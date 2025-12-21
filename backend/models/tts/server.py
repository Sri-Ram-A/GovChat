import grpc
from concurrent import futures
from loguru import logger

from tts_pb2 import TTSResponse  # type: ignore
import tts_pb2_grpc as tts_pb2_grpc
from kokoro_tts import KokoroTTS

class TextToSpeechService(tts_pb2_grpc.TextToSpeechServicer):
    def __init__(self):
        self.tts = KokoroTTS()
        logger.info("[TTS] Kokoro TTS initialized")

    def StreamTTS(self, request_iterator, context):
        """
        Bidirectional streaming:
        - Client streams text
        - Server streams PCM16 audio chunks
        """
        text_parts = []
        for req in request_iterator:
            if req.text:
                logger.debug(f"[TTS] Received text chunk: {req.text}")
                text_parts.append(req.text)
            if req.end_of_stream:
                break

        text = " ".join(text_parts).strip()
        if not text:
            logger.warning("[TTS] Empty text received")
            return
        logger.info(f"[TTS] Synthesizing: {text}")

        for pcm_chunk in self.tts.stream_pcm16(text):
            yield TTSResponse(
                audio=pcm_chunk,
                sample_rate=self.tts.sr,
                is_final=False,
            )

        yield TTSResponse(
            audio=b"",
            sample_rate=self.tts.sr,
            is_final=True,
        )


def serve():
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=4))
    tts_pb2_grpc.add_TextToSpeechServicer_to_server(TextToSpeechService(), server)
    server.add_insecure_port("[::]:50052")
    server.start()
    logger.success("[TTS] gRPC server running on :50052")
    server.wait_for_termination()


if __name__ == "__main__":
    serve()
