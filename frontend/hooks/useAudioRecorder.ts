// hooks/useAudioRecorder.ts
import { useRef, useCallback, useState } from "react";

interface AudioRecorderOptions {
  onAudioData?: (pcmData: ArrayBuffer) => void;
  onError?: (error: Error) => void;
  sampleRate?: number;
}

export const useAudioRecorder = (options: AudioRecorderOptions = {}) => {
  const { onAudioData, onError, sampleRate = 16000 } = options;

  const [isRecording, setIsRecording] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);
  const contextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);

  const float32ToPCM16 = (float32: Float32Array): ArrayBuffer => {
    const buffer = new ArrayBuffer(float32.length * 2);
    const view = new DataView(buffer);
    
    for (let i = 0; i < float32.length; i++) {
      const s = Math.max(-1, Math.min(1, float32[i]));
      view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }
    return buffer;
  };

  const cleanup = useCallback(() => {
    processorRef.current?.disconnect();
    contextRef.current?.close();
    streamRef.current?.getTracks().forEach(track => track.stop());
    
    processorRef.current = null;
    contextRef.current = null;
    streamRef.current = null;
  }, []);

  const startRecording = useCallback(async () => {
    if (isRecording) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: { ideal: sampleRate },
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      const context = new AudioContext({ sampleRate });
      const source = context.createMediaStreamSource(stream);
      const processor = context.createScriptProcessor(4096, 1, 1);

      processor.onaudioprocess = (e) => {
        const pcm = float32ToPCM16(e.inputBuffer.getChannelData(0));
        onAudioData?.(pcm);
      };

      source.connect(processor);
      processor.connect(context.destination);

      streamRef.current = stream;
      contextRef.current = context;
      processorRef.current = processor;
      setIsRecording(true);
    } catch (error) {
      console.error("Recording failed:", error);
      onError?.(error as Error);
      cleanup();
    }
  }, [isRecording, sampleRate, onAudioData, onError, cleanup]);

  const stopRecording = useCallback(() => {
    if (!isRecording) return;
    setIsRecording(false);
    cleanup();
  }, [isRecording, cleanup]);

  return { isRecording, startRecording, stopRecording };
};