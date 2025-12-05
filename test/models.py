from vosk import Model,KaldiRecognizer
import os
import warnings
warnings.filterwarnings("ignore")
# Load Vosk model (only once)
_vosk_model = None

def get_vosk_recognizer():
    global _vosk_model
    if _vosk_model is None:
        model_path = os.path.join(os.path.dirname(__file__), "vosk-model", "vosk-model-small-en-in-0.4")
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Model not found at {model_path}")
        _vosk_model = Model(model_path)
        _recognizer = KaldiRecognizer(_vosk_model, 16000)
    return _recognizer

# Similarly for TTS (if needed)
_tts_pipeline = None

def get_tts_pipeline():
    global _tts_pipeline
    if _tts_pipeline is None:
        from kokoro import KPipeline
        _tts_pipeline = KPipeline(lang_code='a', repo_id='hexgrad/Kokoro-82M')
        
    return _tts_pipeline