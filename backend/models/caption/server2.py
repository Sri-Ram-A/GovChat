import grpc
from concurrent import futures
import time
import io
import torch
import torch.nn as nn
from transformers import VisionEncoderDecoderModel, ViTImageProcessor, AutoTokenizer
from PIL import Image
from caption_pb2 import CaptionResponse  # type: ignore
import caption_pb2_grpc
from loguru import logger

MODEL_NAME = "nlpconnect/vit-gpt2-image-captioning"
MLP_CHECKPOINT_PATH = "models/complete_vit.pth"
MAX_WORKERS = 4
PORT = "50053"

device = "cuda" if torch.cuda.is_available() else "cpu"

class SimpleMLP(nn.Module):
    def __init__(self, hidden_size, num_classes):
        super().__init__()
        self.fc = nn.Sequential(
            nn.Linear(hidden_size, 256),
            nn.ReLU(),
            nn.Dropout(0.5),
            nn.Linear(256, num_classes)
        )
    
    def forward(self, features):
        return self.fc(features)

checkpoint = torch.load(MLP_CHECKPOINT_PATH, map_location=device)
num_classes = checkpoint['num_classes']
hidden_size = checkpoint['hidden_size']

class_names = ['BBMP (garbage)', 'BBMP (pothole)', 'BESCOM', 'BWSSB']

mlp_model = SimpleMLP(hidden_size, num_classes).to(device)
mlp_model.load_state_dict(checkpoint['model_state_dict'])
mlp_model.eval()

vit_gpt2_model = VisionEncoderDecoderModel.from_pretrained(MODEL_NAME).to(device)
image_processor = ViTImageProcessor.from_pretrained(MODEL_NAME)
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
tokenizer.pad_token = tokenizer.eos_token
vit_gpt2_model.config.pad_token_id = tokenizer.eos_token_id
vit_gpt2_model.eval()

logger.success("All models loaded successfully")

class ImageCaptionService(caption_pb2_grpc.ImageCaptionServiceServicer):

    def GenerateCaption(self, request, context):
        try:
            image = Image.open(io.BytesIO(request.image)).convert("RGB")
            pixel_values = image_processor(images=image, return_tensors="pt").pixel_values.to(device)

            if device == "cuda":
                torch.cuda.synchronize()
            start = time.perf_counter()

            stored_encoder_output = None
            
            def capture_encoder_output(module, input, output):
                nonlocal stored_encoder_output
                stored_encoder_output = output.last_hidden_state
            
            hook = vit_gpt2_model.encoder.register_forward_hook(capture_encoder_output) #this stores the features while running whole pipeline in betwen

            with torch.no_grad():
                output_ids = vit_gpt2_model.generate(
                    pixel_values=pixel_values,
                    max_length=30,
                    num_beams=4,
                    pad_token_id=tokenizer.eos_token_id
                )
                
                caption = tokenizer.decode(output_ids[0], skip_special_tokens=True)
                
                cls_features = stored_encoder_output[:, 0, :]
                logits = mlp_model(cls_features)
                probs = torch.softmax(logits, dim=1)
                confidence, pred_idx = torch.max(probs, dim=1)
                
                predicted_class = class_names[pred_idx.item()]
                confidence_score = confidence.item()

            hook.remove()

            if device == "cuda":
                torch.cuda.synchronize()
            end = time.perf_counter()

            return CaptionResponse(
                caption=caption,
                predicted_department=predicted_class,
                confidence=confidence_score,
                inference_time=end - start
            )

        except Exception as e:
            context.set_code(grpc.StatusCode.INTERNAL)
            context.set_details(str(e))
            return CaptionResponse()


def serve():
    # Define options for larger message sizes (50MB)
    options = [
        ('grpc.max_send_message_length', 50 * 1024 * 1024),
        ('grpc.max_receive_message_length', 50 * 1024 * 1024),
    ]
    server = grpc.server(
        futures.ThreadPoolExecutor(max_workers=MAX_WORKERS),
        options=options
    )
    caption_pb2_grpc.add_ImageCaptionServiceServicer_to_server(
        ImageCaptionService(), 
        server
    )
    server.add_insecure_port(f"[::]:{PORT}")
    server.start()
    logger.info(f"gRPC server running on port {PORT}")
    server.wait_for_termination()
    
if __name__ == "__main__":
    serve()