import grpc
from models.caption.caption_pb2 import ImageRequest # type: ignore
from models.caption import caption_pb2_grpc


class ITTClient:
    def __init__(self, url="localhost:50053"):
        self.channel = grpc.insecure_channel(url)
        self.stub = caption_pb2_grpc.ImageCaptionServiceStub(self.channel)

    def generate_caption_from_bytes(self, image_bytes: bytes):
        response = self.stub.GenerateCaption(
            ImageRequest(image=image_bytes)
        )
        return response.caption, response.inference_time

itt = ITTClient("localhost:50053")