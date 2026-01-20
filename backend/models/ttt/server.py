import grpc
from concurrent import futures
from loguru import logger
from retrieve import retrieve_service
from ttt_pb2 import TextResponse  # type: ignore
import ttt_pb2_grpc as ttt_pb2_grpc

class RetrieveContext(ttt_pb2_grpc.RetrieveContextServicer):
    def __init__(self):
        logger.info("Initialized FAISS")

    def RetrieveText(self, request, context):
        logger.debug(f"[REQUEST] : {request.text}")
        return TextResponse(text=retrieve_service(str(request.text)))

def serve():
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=4))
    ttt_pb2_grpc.add_RetrieveContextServicer_to_server(RetrieveContext(), server)
    server.add_insecure_port("[::]:50054")
    server.start()
    logger.success("[TTT] gRPC server running on :50054")
    server.wait_for_termination()

if __name__ == "__main__":
    serve()
