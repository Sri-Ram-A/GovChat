import json
from loguru import logger
from channels.generic.websocket import WebsocketConsumer

from .stt_client import STTClient
from .tts_client import TTSClient

class ChatConsumer(WebsocketConsumer):
    def connect(self):
        self.accept()
        logger.info("[WS] Connected")
        # Speech-to-Text client
        self.stt = STTClient(url="localhost:50051",on_result=self.on_stt_result)
        # Text-to-Speech client
        self.tts = TTSClient(url="localhost:50052",on_audio=self.on_tts_audio)

    def receive(self, text_data=None, bytes_data=None):
        if bytes_data:
            self.stt.start()
            self.stt.send_audio(bytes_data)
            return
        # Control messages
        if text_data:
            msg = json.loads(text_data)
            if msg.get("action") == "start_recording":
                self.stt.start()
            elif msg.get("action") == "finalize":
                self.stt.stop()

    def on_stt_result(self, text: str, is_final: bool):
        # Send transcript to frontend
        self.send(text_data=json.dumps({
            "type": "transcript",
            "text": text,
            "final": is_final
        }))

        # Trigger TTS only on final text
        if is_final and text.strip():
            response_text = f"You said: {text}"
            logger.info(f"[WS] Triggering TTS: {response_text}")
            self.tts.start()
            self.tts.send_text(response_text)
            self.tts.stop()

    def on_tts_audio(self, pcm: bytes, is_final: bool):
        if pcm:
            self.send(bytes_data=pcm)
        if is_final:
            logger.info("[WS] TTS playback finished")

    def disconnect(self, close_code):
        logger.info(f"[WS] Disconnected ({close_code})")
        try:
            self.stt.close()
            self.tts.close()
        except Exception as e:
            logger.error(f"[WS] Cleanup error: {e}")
