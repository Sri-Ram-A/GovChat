import grpc
from models.caption.caption_pb2 import ImageRequest # type: ignore
from models.caption import caption_pb2_grpc
from django.conf import settings

ITT_URL = settings.ITT_URL
class ITTClient:
    def __init__(self, url=ITT_URL):
        # ==larger message sizes (50MB)
        options = [
            ('grpc.max_send_message_length', 50 * 1024 * 1024),
            ('grpc.max_receive_message_length', 50 * 1024 * 1024),
        ]
        self.channel = grpc.insecure_channel(url, options=options)
        self.stub = caption_pb2_grpc.ImageCaptionServiceStub(self.channel)

    def generate_caption_from_bytes(self, image_bytes: bytes):
        response = self.stub.GenerateCaption(ImageRequest(image=image_bytes))
        return response.caption, response.predicted_department, response.confidence, response.inference_time

itt = ITTClient(ITT_URL)