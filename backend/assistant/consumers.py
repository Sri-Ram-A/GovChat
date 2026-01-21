import json
from loguru import logger
from channels.generic.websocket import WebsocketConsumer

from .stt_client import STTClient
from .tts_client import TTSClient
from .ttt_client import TTTClient
from django.conf import settings

STT_URL = settings.STT_URL
TTS_URL = settings.TTS_URL
TTT_URL = settings.TTT_URL
class ChatConsumer(WebsocketConsumer):
    def connect(self):
        self.accept()
        logger.info("[WS] Connected")
        # Speech-to-Text client
        self.stt = STTClient(url=STT_URL,on_result=self.on_stt_result)
        # Text-to-Speech client
        self.tts = TTSClient(url=TTS_URL,on_audio=self.on_tts_audio)
        self.ttt = TTTClient(url=TTT_URL)

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
            elif msg.get("type") == "text":
                response_text = self.ttt.response(msg["text"])

                self.send(text_data=json.dumps({
                    "type": "response",
                    "text": response_text
                }))


    def on_stt_result(self, text: str, is_final: bool):
        # 1️⃣ Send STT transcript to frontend
        self.send(text_data=json.dumps({
            "type": "transcript",
            "text": text,
            "final": is_final
        }))

        # 2️⃣ Only act on final transcript
        if not is_final or not text.strip():
            return

        # 3️⃣ Get response from TTT
        response_text = self.ttt.response(text)[:150]
        logger.info(f"[WS] TTT response: {response_text}")

        # 4️⃣ Send TTT response as TEXT to frontend
        self.send(text_data=json.dumps({
            "type": "response",
            "text": response_text
        }))

        # 5️⃣ Speak it using TTS
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
