
import grpc
from concurrent import futures
import time
import io
import torch
from transformers import VisionEncoderDecoderModel, ViTImageProcessor, AutoTokenizer
from PIL import Image
from caption_pb2 import CaptionResponse # type: ignore
import caption_pb2_grpc
from loguru import logger

MODEL_NAME = "nlpconnect/vit-gpt2-image-captioning"
MAX_WORKERS = 4
PORT = "50053"

device = "cuda" if torch.cuda.is_available() else "cpu"
model = VisionEncoderDecoderModel.from_pretrained(MODEL_NAME).to(device) # type: ignore
image_processor = ViTImageProcessor.from_pretrained(MODEL_NAME)
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
tokenizer.pad_token = tokenizer.eos_token
model.config.pad_token_id = tokenizer.eos_token_id
model.eval()

logger.success("Model loaded successfully")

class ImageCaptionService(caption_pb2_grpc.ImageCaptionServiceServicer):

    def GenerateCaption(self, request, context):
        try:
            # Convert bytes → PIL Image
            image = Image.open(io.BytesIO(request.image)).convert("RGB")
            pixel_values = image_processor(images=image, return_tensors="pt").pixel_values.to(device)

            if device == "cuda":
                torch.cuda.synchronize()
            start = time.perf_counter()

            with torch.no_grad():
                output_ids = model.generate(
                    pixel_values=pixel_values,
                    max_length=30,
                    num_beams=4,
                    pad_token_id=tokenizer.eos_token_id
                )  # type: ignore

            if device == "cuda":
                torch.cuda.synchronize()
            end = time.perf_counter()

            caption = tokenizer.decode(output_ids[0], skip_special_tokens=True)

            return CaptionResponse(
                caption=caption,
                inference_time=end - start
            )

        except Exception as e:
            context.set_code(grpc.StatusCode.INTERNAL)
            context.set_details(str(e))
            return CaptionResponse()


def serve():
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=MAX_WORKERS))
    caption_pb2_grpc.add_ImageCaptionServiceServicer_to_server(ImageCaptionService(), server)
    server.add_insecure_port(f"[::]:{PORT}")
    server.start()
    logger.info(f"gRPC server running on port {PORT}")
    server.wait_for_termination()

if __name__ == "__main__":
    serve()
