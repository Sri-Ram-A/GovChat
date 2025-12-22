import grpc
import threading
from queue import Queue
from loguru import logger

from models.tts.tts_pb2 import TTSRequest # type: ignore
from models.tts import tts_pb2_grpc


class TTSClient:
    def __init__(self, url: str, on_audio):
        """on_audio(pcm: bytes, is_final: bool)"""
        self.channel = grpc.insecure_channel(url)
        self.stub = tts_pb2_grpc.TextToSpeechStub(self.channel)
        self.text_queue = Queue()
        self.on_audio = on_audio
        self.active = False

    def start(self):
        if self.active:
            return
        self.active = True
        self.responses = self.stub.StreamTTS(self._text_generator())
        self.thread = threading.Thread(target=self._read_responses,daemon=True)
        self.thread.start()
        logger.info("[TTS] Stream started")
        
    def _text_generator(self):
        """Feeds text into gRPC stream."""
        while True:
            req = self.text_queue.get()
            yield req
            if req.end_of_stream:
                break

    def _read_responses(self):
        """Background thread reading audio chunks from TTS."""
        try:
            for res in self.responses:
                self.on_audio(res.audio, res.is_final)
                if res.is_final:
                    logger.info("[TTS] Final audio received")
                    break
        except Exception as e:
            logger.error(f"[TTS] Error: {e}")

    def send_text(self, text: str):
        if not self.active:
            self.start()
        self.text_queue.put(TTSRequest(text=text, end_of_stream=False))

    def stop(self):
        if self.active:
            self.text_queue.put(TTSRequest(text="", end_of_stream=True))
            self.active = False

    def close(self):
        self.channel.close()

