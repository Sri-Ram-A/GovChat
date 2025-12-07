# chat/consumers.py

import json
from loguru import logger
from datetime import datetime
from pathlib import Path
from channels.generic.websocket import WebsocketConsumer

class ChatConsumer(WebsocketConsumer):
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.room_name = None
        self.audio_chunks = []
        self.audio_chunk_count = 0
        self.recording_id = None
        
        # Create audio storage directory
        self.audio_dir = Path('media/audio')
        self.audio_dir.mkdir(parents=True, exist_ok=True)

    def connect(self):
        self.room_name = "ConversationalAI"
        self.accept()
        logger.info(f"[WebSocket] Client connected to room: {self.room_name}")

    def disconnect(self, close_code):
        logger.info(f"[WebSocket] Client disconnected. Code: {close_code}")
        # Clean up any unsaved audio chunks
        if self.audio_chunks:
            logger.warning(f"[WebSocket] Cleaning up {len(self.audio_chunks)} unsaved chunks")
            self.audio_chunks.clear()

    def receive(self, text_data=None, bytes_data=None):
        # Handle binary audio data
        if bytes_data:
            self.audio_chunk_count += 1
            audio_size = len(bytes_data)
            # Store chunk in memory
            self.audio_chunks.append(bytes_data)
            logger.debug(f"[Audio] Chunk {self.audio_chunk_count:<5} | Size: {audio_size:<10} bytes | Total: {len(self.audio_chunks):<5} chunks")

        # Handle text/JSON data
        elif text_data:
            try:
                data = json.loads(text_data)
                action = data.get('action')
                if action == 'finalize':
                    self._finalize_recording()
                    
                elif 'message' in data:
                    message = data['message']
                    self._handle_message(message)
                    
            except json.JSONDecodeError as e:
                logger.error(f"[Error] Invalid JSON: {e}")
                self._send_error('Invalid JSON format')

    def _finalize_recording(self):
        """Save all audio chunks to a file and reset state"""
        if not self.audio_chunks:
            logger.warning("[Audio] No audio chunks to finalize")
            self.send(text_data=json.dumps({
                'type': 'finalized',
                'text': 'No audio data received'
            }))
            return
        
        # Generate unique filename
        timestamp = datetime.now().strftime('%d%m%Y_%H%M%S')
        self.recording_id = f'recording_{timestamp}'
        filename = f'{self.recording_id}.webm'
        filepath = self.audio_dir / filename
        
        # Combine and save all chunks
        try:
            total_bytes = 0
            with open(filepath, 'wb') as f:
                for chunk in self.audio_chunks:
                    f.write(chunk)
                    total_bytes += len(chunk)
            
            file_size = filepath.stat().st_size
            duration_estimate = self.audio_chunk_count * 1  # Rough estimate: 1 chunk per second
            
            logger.info(
                "\n[Audio] ===== Recording Saved =====\n"
                f"    Filename: {filename}\n"
                f"    File size: {file_size} bytes ({file_size / 1024:.2f} KB)\n"
                f"    Total chunks: {self.audio_chunk_count}\n"
                f"    Estimated duration: ~{duration_estimate} seconds\n"
                f"    Full path: {filepath.absolute()}\n"
                "[Audio] =============================="
            )
            
            # Verify file was created and has content
            if file_size > 0:
                # Send success response
                self.send(text_data=json.dumps({
                    'type': 'finalized',
                    'text': f'Recording saved: {duration_estimate}s, {file_size / 1024:.1f} KB',
                    'recording_id': self.recording_id,
                    'total_chunks': self.audio_chunk_count,
                    'file_size': file_size,
                    'duration': duration_estimate,
                    'file_path': str(filepath)
                }))
                
                # Here you can add speech recognition processing
                # self._process_audio(filepath)
            else:
                raise Exception("File created but has 0 bytes")
            
        except Exception as e:
            print(f"[Error] Failed to save audio: {e}")
            self._send_error(f'Failed to save recording: {str(e)}')
        
        finally:
            # Reset state for next recording
            self.audio_chunks.clear()
            self.audio_chunk_count = 0

    def _handle_message(self, message):
        """Handle text messages"""
        print(f"[Message] Received: {message}")
        
        response = f"Echo: {message}"
        self.send(text_data=json.dumps({
            'type': 'message',
            'text': response
        }))

    def _send_error(self, error_message):
        """Send error message to client"""
        self.send(text_data=json.dumps({
            'type': 'error',
            'message': error_message
        }))

    # def _process_audio(self, filepath):
    #     """
    #     Optional: Process audio file with speech recognition
    #     Uncomment and implement when ready to add Vosk or other STT
    #     """
    #     try:
    #         # Example: Add Vosk speech recognition here
    #         # from vosk import Model, KaldiRecognizer
    #         # import wave
    #         
    #         # model = Model("path/to/vosk/model")
    #         # wf = wave.open(str(filepath), "rb")
    #         # rec = KaldiRecognizer(model, wf.getframerate())
    #         
    #         # while True:
    #         #     data = wf.readframes(4000)
    #         #     if len(data) == 0:
    #         #         break
    #         #     if rec.AcceptWaveform(data):
    #         #         result = json.loads(rec.Result())
    #         #         # Send transcription
    #         
    #         pass
    #     except Exception as e:
    #         print(f"[Error] Audio processing failed: {e}")