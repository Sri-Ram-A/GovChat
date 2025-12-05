# import torch
# from transformers import pipeline

# # path to the audio file to be transcribed
# audio = "/path/to/audio.format"
# device = "cuda:0" if torch.cuda.is_available() else "cpu"

# transcribe = pipeline(task="automatic-speech-recognition", model="vasista22/whisper-kannada-tiny", chunk_length_s=30, device=device)
# transcribe.model.config.forced_decoder_ids = transcribe.tokenizer.get_decoder_prompt_ids(language="kn", task="transcribe")

# print('Transcription: ', transcribe(audio)["text"])
