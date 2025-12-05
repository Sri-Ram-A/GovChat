# Start Backend 
- https://docs.djangoproject.com/en/6.0/intro/tutorial01/
- https://channels.readthedocs.io/en/latest/installation.html
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
# Create frontend
```tsx
npx create-next-app@latest frontend
Need to install the following packages:
create-next-app@16.0.7
√ Would you like to use the recommended Next.js defaults? » Yes, use recommended defaults
Creating a new Next.js app in C:\Users\SriRam.A\Documents\sr_proj\GovChat\backend\frontend.

Using npm.

Initializing project with template: app-tw 


Installing dependencies:
- next
- react
- react-dom

Installing devDependencies:
- @tailwindcss/postcss
- @types/node
- @types/react
- @types/react-dom
- eslint
- eslint-config-next
- tailwindcss
- typescript
```
## Configuring shadcn ui
```tsx
npm install -g pnpm
```
- https://ui.shadcn.com/docs/installation/next
- https://ui.shadcn.com/docs/dark-mode/next
- https://ui.shadcn.com/themes#themes
- https://nextjs.org/docs/messages/next-image-unconfigured-host
- https://medium.com/@chaman388/websockets-in-reactjs-a-practical-guide-with-real-world-examples-2efe483ee150

# Configuring VOSK STT
- https://dev.to/mattsu014/vosk-offline-speech-recognition-3kbb