# pyright: reportAttributeAccessIssue=false
import grpc
from concurrent import futures
import stt_pb2
import stt_pb2_grpc
from vosk_stt import AudioTranscriber
from loguru import logger

MODEL_PATH = "vosk-model-small-en-in-0.4"
class SpeechToTextService(stt_pb2_grpc.SpeechToTextServicer):

    def StreamAudio(self, request_iterator, context):
        """One gRPC stream = one recognizer instance"""
        transcriber = AudioTranscriber(MODEL_PATH)
        logger.info("[STT] New stream started")
        try:
            for audio_chunk in request_iterator:
                if audio_chunk.end_of_stream:
                    logger.info(f"[STT] End of stream received")
                    break
                if len(audio_chunk.pcm) == 0:
                    logger.warning("[STT] Received empty audio chunk")
                    continue

                # Process with Vosk
                result = transcriber.accept_audio_chunk(audio_chunk.pcm)
                
                if result and result["text"]:  # Only send if there's actual text
                    logger.debug(f"[STT] Transcription ({result['type']}): '{result['text']}'")
                    if result["type"] == "partial":
                        yield stt_pb2.Transcript(text=result["text"],type=stt_pb2.PARTIAL)
                        
                    elif result["type"] == "final":
                        yield stt_pb2.Transcript(text=result["text"],type=stt_pb2.FINAL)
            
            # Flush remaining audio
            final = transcriber.flush()
            if final and final["text"]:
                logger.info(f"[STT] Final FLUSH result: '{final['text']}'")
                yield stt_pb2.Transcript(text=final["text"],type=stt_pb2.FINAL)
            else:
                logger.warning("[STT] No text in final FLUSH")
                
        except Exception as e:
            logger.error(f"[STT] Error in StreamAudio: {e}", exc_info=True)

def serve():
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    stt_pb2_grpc.add_SpeechToTextServicer_to_server(SpeechToTextService(),server)
    server.add_insecure_port("[::]:50051")
    server.start()
    logger.success("STT gRPC server running on port 50051")
    server.wait_for_termination()

if __name__ == "__main__":
    serve()
