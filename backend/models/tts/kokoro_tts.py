import numpy as np
from typing import Iterator
from kokoro import KPipeline

class KokoroTTS:
    """
    Streaming-first wrapper around kokoro.KPipeline.

    - Input: text
    - Output: PCM16 audio chunks (bytes)
    - Sample rate is fixed per instance
    """

    def __init__(
        self,
        lang_code: str = "a",
        repo_id: str = "hexgrad/Kokoro-82M",
        voice: str = "hf_alpha",
        speed: float = 1.0,
        sampling_rate: int = 24000,
    ):
        self.voice = voice
        self.speed = speed
        self.sr = sampling_rate

        self.pipeline = KPipeline(
            lang_code=lang_code,
            repo_id=repo_id,
        )

    def stream_pcm16(self, text: str) -> Iterator[bytes]:
        """
        Stream PCM16 audio chunks for the given text.
        """
        generator = self.pipeline(
            text,
            voice=self.voice,
            speed=self.speed,
            split_pattern=None,
        )

        for _, _, audio in generator:
            audio = np.asarray(audio, dtype=np.float32)

            # Defensive: collapse to mono if needed
            if audio.ndim > 1:
                audio = audio.mean(axis=1)

            # Clamp and convert
            audio = np.clip(audio, -1.0, 1.0)
            pcm16 = (audio * 32767.0).astype(np.int16)

            yield pcm16.tobytes()
