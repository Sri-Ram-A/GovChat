# models/stt/vosk_stt.py
import json
from vosk import Model, KaldiRecognizer


class AudioTranscriber:
    def __init__(self, model_path):
        self.model = Model(model_path)
        self.recognizer = KaldiRecognizer(self.model, 16000)
        
    def accept_audio_chunk(self, pcm_chunk):
        """Process PCM16 audio chunk directly"""
        try:
            # bytes_data is already PCM16 16kHz mono
            if self.recognizer.AcceptWaveform(pcm_chunk):
                result = json.loads(self.recognizer.Result())
                return {"type": "final", "text": result.get("text", "")}
            
            partial_result = json.loads(self.recognizer.PartialResult())
            return {"type": "partial", "text": partial_result.get("partial", "")}
            
        except Exception as e:
            print(f"Error processing audio: {e}")
            return {"type": "none", "text": ""}
    
    def flush(self):
        """Get final result after all audio has been processed"""
        final = json.loads(self.recognizer.FinalResult())
        return {"type": "final", "text": final.get("text", "")}