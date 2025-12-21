import grpc
import threading
from queue import Queue
from loguru import logger

from models.stt import stt_pb2_grpc
from models.stt.stt_pb2 import AudioChunk, FINAL # type: ignore

class STTClient:
    def __init__(self, url: str, on_result):
        """on_result(text: str, is_final: bool)"""
        self.channel = grpc.insecure_channel(url)
        self.stub = stt_pb2_grpc.SpeechToTextStub(self.channel)
        self.audio_queue = Queue()
        self.on_result = on_result
        self.active = False

    def start(self):
        if self.active:
            return
        self.active = True
        self.responses = self.stub.StreamAudio(self._audio_generator())
        self.thread = threading.Thread(target=self._read_responses,daemon=True)
        self.thread.start()
        logger.info("[STT] Stream started")

    def send_audio(self, pcm: bytes):
        if self.active:
            self.audio_queue.put(AudioChunk(pcm=pcm, end_of_stream=False))

    def stop(self):
        if self.active:
            self.audio_queue.put(AudioChunk(pcm=b"", end_of_stream=True))
            self.active = False

    def _audio_generator(self):
        while True:
            chunk = self.audio_queue.get()
            yield chunk
            if chunk.end_of_stream:
                break

    def _read_responses(self):
        try:
            for res in self.responses:
                is_final = res.type == FINAL
                self.on_result(res.text, is_final)
        except Exception as e:
            logger.error(f"[STT] Error: {e}")

    def close(self):
        self.channel.close()
