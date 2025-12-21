# models/tts/kokoro_tts.py
import io
import wave
import numpy as np
from kokoro import KPipeline

class KokoroTTS:
    """
    Simple wrapper around kokoro.KPipeline that returns a WAV file (bytes).
    - Uses sampling rate 24000 (adjustable if Kokoro supports other rates).
    - Outputs 16-bit PCM WAV (little-endian).
    """

    def __init__(self, lang_code: str = "a", repo_id: str = "hexgrad/Kokoro-82M",
                 voice: str = "hf_alpha", speed: float = 1.0, sampling_rate: int = 24000):
        self.lang_code = lang_code
        self.repo_id = repo_id
        self.voice = voice
        self.speed = speed
        self.sr = sampling_rate
        # Create the pipeline once (it will download/initialize model on first use)
        self.pipeline = KPipeline(lang_code=self.lang_code, repo_id=self.repo_id)

    def synthesize_floats(self, text: str, split_pattern=None):
        """
        Run the pipeline and return a single concatenated numpy float32 array in [-1,1].
        The pipeline yields tuples (gs, ps, audio) where audio is an array-like float in [-1..1].
        """
        chunks = []
        generator = self.pipeline(text, voice=self.voice, speed=self.speed, split_pattern=split_pattern)
        for gs, ps, audio in generator:
            # kokoro yields arrays / lists — ensure numpy float32
            arr = np.asarray(audio, dtype=np.float32)
            # If stereo or multi-dim, flatten to mono (kokoro usually gives 1D)
            if arr.ndim > 1:
                arr = arr.mean(axis=1)
            chunks.append(arr)
        if not chunks:
            return np.zeros(0, dtype=np.float32)
        return np.concatenate(chunks)

    def synthesize_to_wav_bytes(self, text: str, split_pattern=None) -> bytes:
        """
        Produces a WAV file (bytes) 16-bit PCM with sample rate self.sr.
        """
        float_audio = self.synthesize_floats(text, split_pattern=split_pattern)

        # Clamp to [-1,1]
        float_audio = np.clip(float_audio, -1.0, 1.0)

        # Convert to int16 PCM
        int16_audio = (float_audio * 32767.0).astype(np.int16)

        # Write to in-memory WAV file
        buffer = io.BytesIO()
        with wave.open(buffer, 'wb') as wf:
            wf.setnchannels(1)             # mono
            wf.setsampwidth(2)            # 2 bytes = 16-bit
            wf.setframerate(self.sr)      # e.g. 24000
            wf.writeframes(int16_audio.tobytes())
        buffer.seek(0)
        return buffer.read()
