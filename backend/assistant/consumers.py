import json
import grpc
import threading
from loguru import logger
from channels.generic.websocket import WebsocketConsumer
from models.stt import stt_pb2_grpc  
from models.stt.stt_pb2 import AudioChunk, FINAL # type: ignore
from queue import Queue
import numpy as np

class ChatConsumer(WebsocketConsumer):

    def connect(self):
        self.accept()
        logger.info("[WS] Client connected")

        # gRPC channel (reusable)
        self.channel = grpc.insecure_channel("localhost:50051")
        self.stub = stt_pb2_grpc.SpeechToTextStub(self.channel)
        
        # Stream management
        self.audio_queue = None
        self.grpc_responses = None
        self.response_thread = None
        self.stream_active = False
        
    def receive(self, text_data=None, bytes_data=None):
        if bytes_data:
            # Start a new stream if this is the first audio chunk
            if not self.stream_active:
                logger.info("[WS] Starting new gRPC stream")
                self._start_new_stream()
            
            if self.audio_queue:
                self.audio_queue.put(AudioChunk(pcm=bytes_data,end_of_stream=False))
            return
            
        if text_data:
            data = json.loads(text_data)
            
            if data.get("action") == "start_recording":
                logger.info("[WS] Start recording signal received")
                # Start a new stream if not already active
                if not self.stream_active:
                    self._start_new_stream()
                return
            
            if data.get("action") == "finalize":
                if not self.stream_active:
                    logger.warning("[WS] Finalize received but no active stream")
                    return
                # Signal end of stream
                if self.audio_queue:
                    self.audio_queue.put(AudioChunk(pcm=b"",end_of_stream=True))
                self.stream_active = False

    def _start_new_stream(self):
        """Create a new gRPC stream for a new recording session"""
        # Create new queue for this stream
        self.audio_queue = Queue()
        self.stream_active = True
        # Start new gRPC streaming call
        self.grpc_responses = self.stub.StreamAudio(self._audio_generator())
        # Start background thread to read transcripts
        self.response_thread = threading.Thread(target=self._read_grpc_responses, daemon=True)
        self.response_thread.start()
        logger.info("[WS] New gRPC stream started")

    def _audio_generator(self):
        """Generator that yields audio chunks to gRPC"""
        chunk_count = 0
        if self.audio_queue:
            while True:
                chunk = self.audio_queue.get()   # BLOCKS until available
                if chunk.end_of_stream:
                    logger.info(f"[gRPC] Sending end_of_stream after {chunk_count} chunks")
                    yield chunk
                    break
                chunk_count += 1
                logger.debug(f"[gRPC] Yielding chunk {chunk_count}: {len(chunk.pcm)} bytes")
                yield chunk
                
    def _read_grpc_responses(self):
        """Read transcription results from gRPC"""
        if self.grpc_responses:
            try:
                for response in self.grpc_responses:
                    logger.info(f"[gRPC] Received transcript: '{response.text}' (final={response.type == FINAL})")
                    self.send(text_data=json.dumps({
                        "type": "transcript",
                        "text": response.text,
                        "final": response.type == FINAL
                    }))
                logger.info("[gRPC] Response stream ended")
            except Exception as e:
                logger.error(f"[gRPC] Error reading responses: {e}")

    def disconnect(self, close_code):
        logger.info(f"[WS] Client disconnected ({close_code})")
        try:
            if self.stream_active and self.audio_queue:
                self.audio_queue.put(AudioChunk(pcm=b"", end_of_stream=True))
            if self.channel:
                self.channel.close()
        except Exception as e:
            logger.error(f"[WS] Error during disconnect: {e}")