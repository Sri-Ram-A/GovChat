# Start Backend

* use python3.10 backend
```python
conda create -n govchat python=3.10 -y
conda activate govchat
```
* [https://docs.djangoproject.com/en/6.0/intro/tutorial01/](https://docs.djangoproject.com/en/6.0/intro/tutorial01/)
* [https://channels.readthedocs.io/en/latest/installation.html](https://channels.readthedocs.io/en/latest/installation.html)
<!-- https://www.django-rest-framework.org/tutorial/quickstart/ -->
You will get below kind of output:

```python
December 05, 2025 - 10:27:57
Django version 6.0, using settings 'backend.settings'
Starting ASGI/Daphne version 4.2.1 development server at http://127.0.0.1:8000/
Quit the server with CTRL-BREAK.
HTTP GET / 200 [0.03, 127.0.0.1:54896]
```
```bash
$ python -c 'import channels; import daphne; print(channels.__version__, daphne.__version__)'
4.3.2 4.2.1
$ python -m django version
6.0
```

---

# Create frontend
```tsx
npx create-next-app@latest frontend
```
Need to install the following packages:
create-next-app@16.0.7
```
√ Would you like to use the recommended Next.js defaults? » Yes, use recommended defaults
Creating a new Next.js app in C:\Users\SriRam.A\Documents\sr_proj\GovChat\backend\frontend.
Using npm.
Initializing project with template: app-tw
```
Installing dependencies:
* next
* react
* react-dom
Installing devDependencies:
* @tailwindcss/postcss
* @types/node
* @types/react
* @types/react-dom
* eslint
* eslint-config-next
* tailwindcss
* typescript
---

## Configuring shadcn ui

```tsx
npm install -g pnpm
```

* [https://ui.shadcn.com/docs/installation/next](https://ui.shadcn.com/docs/installation/next)
* [https://ui.shadcn.com/docs/dark-mode/next](https://ui.shadcn.com/docs/dark-mode/next)
* [https://ui.shadcn.com/themes#themes](https://ui.shadcn.com/themes#themes)
* [https://nextjs.org/docs/messages/next-image-unconfigured-host](https://nextjs.org/docs/messages/next-image-unconfigured-host)

---

## Websocket in NExtJS (React) (Go to Step 2)

* [https://medium.com/@chaman388/websockets-in-reactjs-a-practical-guide-with-real-world-examples-2efe483ee150](https://medium.com/@chaman388/websockets-in-reactjs-a-practical-guide-with-real-world-examples-2efe483ee150)

---

# Configuring VOSK STT

* [https://dev.to/mattsu014/vosk-offline-speech-recognition-3kbb](https://dev.to/mattsu014/vosk-offline-speech-recognition-3kbb)

---

# Understanding Django Websockets Connection

* [https://testdriven.io/blog/django-channels/](https://testdriven.io/blog/django-channels/)

---

# Recording Audio in Frontend

* [https://medium.com/@chaman388/websockets-in-reactjs-a-practical-guide-with-real-world-examples-2efe483ee150](https://medium.com/@chaman388/websockets-in-reactjs-a-practical-guide-with-real-world-examples-2efe483ee150)
* Custom Hooks using GPT
* Problem with opus, vosk needs PCM (Below Soln with Deepseek)

[https://medium.com/developer-rants/streaming-audio-with-16-bit-mono-pcm-encoding-from-the-browser-and-how-to-mix-audio-while-we-are-f6a160409135](https://medium.com/developer-rants/streaming-audio-with-16-bit-mono-pcm-encoding-from-the-browser-and-how-to-mix-audio-while-we-are-f6a160409135)

---

# Sending audio from Backend

* Kokoro TTS
  [https://huggingface.co/hexgrad/Kokoro-82M/blob/main/README.md](https://huggingface.co/hexgrad/Kokoro-82M/blob/main/README.md)
- Numpy version must be less than 2
```bash
pip install "numpy<2.0"
```
---

# Moving STT and TTS to microservices
* First I am changing the frontend to use BLobs
  [https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder)
* Wasnot Successfull (Decoding error from audio/wav to pcm in frontend)
* Learning grpc
  Intro: [https://medium.com/@coderviewer/simple-usage-of-grpc-with-python-f714d9f69daa](https://medium.com/@coderviewer/simple-usage-of-grpc-with-python-f714d9f69daa)
* Best for writing code from:
  [https://codelabs.developers.google.com/grpc/getting-started-grpc-python-streaming#2](https://codelabs.developers.google.com/grpc/getting-started-grpc-python-streaming#2)
* grpc in python
  [https://grpc.io/docs/languages/python/basics/](https://grpc.io/docs/languages/python/basics/)

```zsh
python -m grpc_tools.protoc -I. --python_out=. --grpc_python_out=. stt.proto
```

Then i put this on top of grpc file :

```python
## pyright: reportAttributeAccessIssue=false
```

# API routes for admins and citizens
- Created Django governance.py Models
- https://stackoverflow.com/questions/25841712/django-best-approach-for-creating-multiple-type-users
- Registered models 
```python
# DRF follows this exact sequence:
serializer = SomeSerializer(data=request.data)
serializer.is_valid()
serializer.save()
       ↓ 
1. __init__(data=...)
2. validate_<field>()   (field-level)
3. validate()           (object-level)
4. create() OR update()
5. return instance
```
```java
User
 ├── username: ramesh
 ├── email: ramesh@gmail.com
 ├── password: ****
 │
 ├── Citizen profile (optional)
 │     ├── address
 │     ├── jurisdiction
 │
 └── Admin profile (optional)
       ├── department
       ├── designation
```
- Login : https://appliku.com/post/how-use-jwt-authentication-django/
# File upload in DRF : 
- https://www.django-rest-framework.org/api-guide/parsers/#fileuploadparser
# Coordinates 
https://www.geoapify.com/how-to-get-user-location-with-javascript/
# Navbar
https://nextjs.org/docs/pages/building-your-application/routing/pages-and-layouts
# Dango Signals
- Undestanding : https://www.freecodecamp.org/news/how-to-use-django-signals-in-your-projects/
- https://www.geeksforgeeks.org/python/how-to-create-and-use-signals-in-django/


# Setting up Sahana TTT in docker image:
#!/bin/bash

# Build the Docker image (optimized for size)
docker build -t grpc-retrieval:latest .

# Check image size
docker images grpc-retrieval:latest

# Run the container
docker run -d --name grpc-retrieval-service -p 50054:50054 --restart unless-stopped grpc-retrieval:latest

# View logs
docker logs -f grpc-retrieval-service

# Stop the container
docker stop grpc-retrieval-service

# Remove the container
docker rm grpc-retrieval-service

# Check in python
python -c "import grpc; ch=grpc.insecure_channel('localhost:50054'); print('✓ gRPC port accessible' if ch else '✗ Failed'); ch.close()"

# Start the container again
docker start grpc-retrieval-service

# to see live logs
docker logs -f grpc-retrieval-service

## Finally decided to package kokoro tts itself..since that is the most shit