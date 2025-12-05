# https://github.com/hexgrad/kokoro?tab=readme-ov-file#advanced-usage
# https://huggingface.co/hexgrad/Kokoro-82M/blob/main/README.md
from kokoro import KPipeline
import sounddevice as sd
import numpy as np

pipeline = KPipeline(lang_code='a',repo_id='hexgrad/Kokoro-82M')

text = "Helloo! How are you doing today? SriRam You look handsome"
generator = pipeline(text, voice='hf_alpha', speed=1, split_pattern=None)

SAMPLING_RATE = 24000

for i, (gs, ps, audio) in enumerate(generator):
    print(i, gs, ps)
    # Ensure audio is a 1D float32 NumPy array in [-1.0, 1.0]
    audio = np.asarray(audio, dtype=np.float32)
    # Play using sounddevice
    sd.play(audio, samplerate=SAMPLING_RATE)
    sd.wait()
