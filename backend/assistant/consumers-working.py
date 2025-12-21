import json
from loguru import logger
from pathlib import Path
from channels.generic.websocket import WebsocketConsumer
from models.stt.vosk_stt import AudioTranscriber
from models.tts.kokoro_tts import KokoroTTS

MODEL_PATH = Path().resolve() / "models" / "stt" / "vosk-model-small-en-in-0.4"

class ChatConsumer(WebsocketConsumer):
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.room_name = None
        self.transcriber = AudioTranscriber(str(MODEL_PATH))
        logger.success("[WS] Vosk model loaded")
        self.tts = KokoroTTS(lang_code='a', repo_id='hexgrad/Kokoro-82M', voice='hf_alpha', speed=1.0, sampling_rate=24000)
        logger.success("[WS] Kokoro TTS wrapper ready")

    def connect(self):
        self.room_name = "ConversationalAI"
        self.accept()
        logger.info(f"[WS] Client connected to room: {self.room_name}")

    def disconnect(self, close_code):
        logger.info(f"[WS] Client disconnected. Code: {close_code}")

    def receive(self, text_data=None, bytes_data=None):
        # Binary data: PCM16 audio from frontend
        if bytes_data:
            # Directly send PCM16 to Vosk 
            result = self.transcriber.accept_audio_chunk(bytes_data)
            if result["type"] == "partial" and result["text"]:
                self.send(json.dumps({
                    "text": result["text"],
                    "type": "partial"
                }))
            elif result["type"] == "final" and result["text"]:
                self.send(json.dumps({
                    "text": result["text"],
                    "type": "final"
                }))
        elif text_data:
            try:
                data = json.loads(text_data)
                if data.get("action") == "finalize":
                    final_output = self.transcriber.flush()
                    if final_output["text"]:
                        self.send(json.dumps({
                            "text": final_output["text"],
                            "type": "finalized"
                        }))
                    logger.info("[Audio] Final transcription sent")

                    # For now: use final_output["text"] if present,
                    # otherwise fallback to an example text.
                    text_for_tts = final_output.get("text") or "Hello! This is a sample response from server."

                    # Generate WAV bytes with Kokoro
                    try:
                        wav_bytes = self.tts.synthesize_to_wav_bytes(text_for_tts)
                    except Exception as e:
                        logger.exception("TTS generation failed")
                        # Inform client about failure
                        self.send(json.dumps({"type": "error", "message": "TTS generation failed"}))
                        return

                    # Option A (recommended): send binary WAV frame preceded by a small JSON metadata
                    # 1) send metadata as JSON (so client knows incoming binary format)
                    metadata = {
                        "type": "audio.metadata",
                        "format": "wav",
                        "samplerate": 24000,
                        "encoding": "pcm16",
                        "length_bytes": len(wav_bytes),
                    }
                    self.send(text_data=json.dumps(metadata))
                    # 2) send binary payload (WAV)
                    self.send(bytes_data=wav_bytes)

                    # Option B (alternate): send base64-encoded WAV inside JSON (easier but larger)
                    # base64_wav = base64.b64encode(wav_bytes).decode('ascii')
                    # self.send(text_data=json.dumps({
                    #     "type": "audio.base64",
                    #     "format": "wav",
                    #     "samplerate": 24000,
                    #     "data": base64_wav
                    # }))
            except json.JSONDecodeError as e:
                logger.error(f"[Error] Invalid JSON: {e}")
                self.send(json.dumps({"error": "Invalid JSON format"}))