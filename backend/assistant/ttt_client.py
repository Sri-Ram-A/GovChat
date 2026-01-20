import grpc
from models.ttt import ttt_pb2_grpc
from models.ttt.ttt_pb2 import QueryRequest # type: ignore
class TTTClient:

    def __init__(self, url: str):
        """on_result(text: str, is_final: bool)"""
        self.channel = grpc.insecure_channel(url)
        self.stub = ttt_pb2_grpc.RetrieveContextStub(self.channel)

    def response(self,query):
        request = QueryRequest(text=query)
        response = self.stub.RetrieveText(request)
        return response.text


    def close(self):
        self.channel.close()
