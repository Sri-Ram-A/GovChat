import torch
from transformers import VisionEncoderDecoderModel, ViTImageProcessor, AutoTokenizer
from PIL import Image

MODEL_NAME = "nlpconnect/vit-gpt2-image-captioning"

device = "cuda" if torch.cuda.is_available() else "cpu"

model = VisionEncoderDecoderModel.from_pretrained(MODEL_NAME).to(device)
image_processor = ViTImageProcessor.from_pretrained(MODEL_NAME)
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)

model.eval()

def generate_caption(image_file):
    image = Image.open(image_file).convert("RGB")

    pixel_values = image_processor(images=image, return_tensors="pt").pixel_values
    pixel_values = pixel_values.to(device)

    with torch.no_grad():
        output_ids = model.generate(
            pixel_values,
            max_length=30,
            num_beams=4
        )

    caption = tokenizer.decode(output_ids[0], skip_special_tokens=True)
    return caption

if __name__ == "__main__":
    file_path = r"C:\Users\SriRam.A\Documents\login_bg.jpg"
    print(generate_caption(file_path))
