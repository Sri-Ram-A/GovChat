import os
import json
import pyaudio
import numpy as np
import sounddevice as sd
from google import genai
from colorama import Fore, init
from dotenv import load_dotenv
import threading
import queue
from loguru import logger
import models
import system_instructions

load_dotenv() 
# === INIT === #
init(autoreset=True)
logger.remove()
logger.add(lambda msg: print(msg, end=""))

# Set up Gemini
API_KEY = os.getenv("API_KEY")
if not API_KEY:
    raise EnvironmentError("❌ Gemini API key missing in 'API_KEY' env variable.")
model = genai.Client(api_key=API_KEY) # Or gemini-2.0
logger.success("Gemini API KEY loaded successffully")
# Set up TTS
SAMPLING_RATE = 24000
pipeline=models.get_tts_pipeline()
logger.success("Kokoro TTS loaded successffully")
# Set up STT #
recognizer = models.get_vosk_recognizer()
logger.success("VOSK STT loaded successffully")

# set up yjreading queue
text_queue = queue.Queue()
stop_signal = object()  # Unique object to signal stopping

# === MIC SETUP FOR INPUT === #
mic = pyaudio.PyAudio()
stream = mic.open(format=pyaudio.paInt16, channels=1, rate=16000, input=True, frames_per_buffer=1024)
logger.info(Fore.BLUE + "\n🎤 Speak to the assistant... (Ctrl+C to quit)\n")

# === STREAM + TTS === #
def gemini_producer(prompt, q):
    response = model.models.generate_content_stream(model="gemini-2.0-flash",contents=prompt,config={"systemInstruction": system_instructions.converse_instruction})
    for chunk in response:
        text = chunk.text
        if text.strip():
            q.put(text)
    q.put(stop_signal)  # Notify end of stream
    
def tts_consumer(q):
    sentence_buffer = ""
    while True:
        item = q.get()
        if item is stop_signal:
            if sentence_buffer.strip():
                speak_text(sentence_buffer)
            break
        
        sentence_buffer += item
        if any(sentence_buffer.strip().endswith(punct) for punct in [".", "!", "?"]):
            speak_text(sentence_buffer)
            sentence_buffer = ""
            
def speak_text(text):
    clean_text = text.replace("*", "").replace("**", "")
    print(Fore.GREEN + clean_text + "\n", end="", flush=True)
    for _, _, audio in pipeline(clean_text, voice='af_heart', speed=1.1, split_pattern=None):
        audio = np.asarray(audio, dtype=np.float32)
        sd.play(audio, samplerate=SAMPLING_RATE, blocking=False)
        sd.wait()
        
def stream_gemini_and_speak(prompt):
    print(Fore.CYAN + f"\n👤 You: {prompt}")
    text_queue.queue.clear()  # Optional: reset old content
    producer_thread = threading.Thread(target=gemini_producer, args=(prompt, text_queue))
    consumer_thread = threading.Thread(target=tts_consumer, args=(text_queue,))
    producer_thread.start()
    consumer_thread.start()
    producer_thread.join()
    consumer_thread.join()
    
# === MAIN LOOP === #
try:
    while True:
        data = stream.read(4096)
        if recognizer.AcceptWaveform(data):
            result = json.loads(recognizer.Result())
            user_text = result["text"]
            if user_text.strip():
                stream_gemini_and_speak(user_text)
        else:
            partial = json.loads(recognizer.PartialResult())
            print(Fore.YELLOW + f"🗣️ {partial['partial']}", end="\r")

except KeyboardInterrupt:
    print(Fore.RED + "\n🛑 Stopped by user.")
finally:
    stream.stop_stream()
    stream.close()
    mic.terminate()
