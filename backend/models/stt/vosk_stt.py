import json
from vosk import Model, KaldiRecognizer
import numpy as np
from loguru import logger

class AudioTranscriber:
    # Class variable to share model across instances
    _shared_model = None
    _model_path = None
    
    def __init__(self, model_path):
        self.model_path = model_path
        self.sample_rate = 16000
        self.recognizer = None
        
        # Load model only once
        if AudioTranscriber._shared_model is None or AudioTranscriber._model_path != model_path:
            logger.info(f"[VOSK] Loading model from {model_path}")
            AudioTranscriber._shared_model = Model(model_path)
            AudioTranscriber._model_path = model_path
        else:
            logger.debug("[VOSK] Using shared model instance")
        
        self.recognizer = KaldiRecognizer(AudioTranscriber._shared_model, self.sample_rate)
        self.recognizer.SetWords(True)
    
    def accept_audio_chunk(self, pcm_data):
        # Your existing code...
        if self.recognizer :
            if self.recognizer.AcceptWaveform(pcm_data):
                result = json.loads(self.recognizer.Result())
                return {"text": result.get("text", ""), "type": "final"}
            else:
                partial = json.loads(self.recognizer.PartialResult())
                return {"text": partial.get("partial", ""), "type": "partial"}
        
    def flush(self):
        # Your existing code...
        if self.recognizer:
            result = json.loads(self.recognizer.FinalResult())
            return {"text": result.get("text", ""), "type": "final"}