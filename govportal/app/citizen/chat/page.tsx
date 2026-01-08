"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Mic, MicOff, Wifi, WifiOff, User, Bot } from "lucide-react";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";

const WS_URL = "ws://localhost:8000/chat/";

interface Message {
  id: string;
  type: "user" | "bot" | "system";
  text: string;
  time: string;
  isFinal?: boolean;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const msgIdRef = useRef(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioQueueRef = useRef<ArrayBuffer[]>([]);

  const addMessage = useCallback((type: Message["type"], text: string, isFinal = true) => {
    const msg: Message = {
      id: `msg-${msgIdRef.current++}`,
      type,
      text,
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      isFinal
    };

    setMessages(prev => {
      // Update last partial message or add new one
      if (!isFinal && prev.length > 0 && prev[prev.length - 1].type === type && !prev[prev.length - 1].isFinal) {
        return [...prev.slice(0, -1), msg];
      }
      return [...prev, msg];
    });
  }, []);

  const handleTranscript = useCallback((data: any) => {
    if (data.type === "transcript") {
      addMessage("user", data.text, data.final);
      
      // Bot echo response on final transcript
      if (data.final && data.text.trim()) {
        setTimeout(() => addMessage("bot", `Echo: ${data.text}`), 300);
      }
    }
  }, [addMessage]);

  const handleAudioBinary = useCallback(async (audioData: ArrayBuffer) => {
    console.log("Received audio chunk:", audioData.byteLength, "bytes");
    audioQueueRef.current.push(audioData);
    
    if (!isAudioPlaying) {
      playAudioQueue();
    }
  }, [isAudioPlaying]);

  const playAudioQueue = async () => {
    if (audioQueueRef.current.length === 0) {
      setIsAudioPlaying(false);
      return;
    }

    setIsAudioPlaying(true);

    try {
      // Initialize audio context if needed
      if (!audioContextRef.current || audioContextRef.current.state === "closed") {
        audioContextRef.current = new AudioContext({ sampleRate: 24000 });
      }

      if (audioContextRef.current.state === "suspended") {
        await audioContextRef.current.resume();
      }

      const audioData = audioQueueRef.current.shift()!;
      
      // Convert PCM16 to Float32
      const pcm16 = new Int16Array(audioData);
      const float32 = new Float32Array(pcm16.length);
      
      for (let i = 0; i < pcm16.length; i++) {
        float32[i] = pcm16[i] / 32768.0;
      }

      // Create audio buffer
      const audioBuffer = audioContextRef.current.createBuffer(1, float32.length, 24000);
      audioBuffer.copyToChannel(float32, 0);

      // Play audio
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      
      source.onended = () => {
        if (audioQueueRef.current.length > 0) {
          playAudioQueue();
        } else {
          setIsAudioPlaying(false);
        }
      };

      source.start();
      console.log("Playing audio chunk");
    } catch (error) {
      console.error("Audio playback error:", error);
      setIsAudioPlaying(false);
    }
  };

  const { isConnected, connect, disconnect, sendMessage, sendBinary } = useWebSocket({
    url: WS_URL,
    onMessage: handleTranscript,
    onBinary: handleAudioBinary,
    onOpen: () => addMessage("system", "✓ Connected"),
    onClose: () => addMessage("system", "✗ Disconnected"),
    onError: () => addMessage("system", "⚠ Connection error"),
    autoConnect: false,
  });

  const { isRecording, startRecording, stopRecording } = useAudioRecorder({
    onAudioData: (pcm) => sendBinary(pcm),
    onError: (err) => addMessage("system", `Mic error: ${err.message}`),
  });

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      if (e.key === "b" && isConnected && !isRecording) {
        e.preventDefault();
        handleStartRecording();
      } else if (e.key === "e" && isRecording) {
        e.preventDefault();
        handleStopRecording();
      } else if (e.key === "x" && isConnected) {
        e.preventDefault();
        disconnect();
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isConnected, isRecording, disconnect]);

  const handleStartRecording = async () => {
    if (!isConnected) return addMessage("system", "Connect first");
    sendMessage({ action: "start_recording" });
    await startRecording();
    addMessage("system", "🎤 Recording...");
  };

  const handleStopRecording = () => {
    stopRecording();
    sendMessage({ action: "finalize" });
    addMessage("system", "⏹ Stopped");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Voice Chat
          </h1>
          <p className="text-slate-600 mt-2">Real-time speech transcription</p>
        </div>

        <div className="grid md:grid-cols-4 gap-6">
          {/* Controls */}
          <div className="space-y-4">
            {/* Connection */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Connection</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {isConnected ? <Wifi className="h-4 w-4 text-green-500" /> : <WifiOff className="h-4 w-4 text-red-500" />}
                    <span className="text-sm font-medium">{isConnected ? "Online" : "Offline"}</span>
                  </div>
                  <Button
                    size="sm"
                    variant={isConnected ? "destructive" : "default"}
                    onClick={isConnected ? disconnect : connect}
                  >
                    {isConnected ? "Disconnect" : "Connect"}
                  </Button>
                </div>
                {isAudioPlaying && (
                  <div className="flex items-center gap-2 text-sm text-blue-600">
                    <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                    Audio playing
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recording */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recording</CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={isRecording ? handleStopRecording : handleStartRecording}
                  disabled={!isConnected}
                  size="lg"
                  className="w-full"
                  variant={isRecording ? "destructive" : "default"}
                >
                  {isRecording ? (
                    <>
                      <MicOff className="mr-2 h-5 w-5" />
                      Stop (E)
                    </>
                  ) : (
                    <>
                      <Mic className="mr-2 h-5 w-5" />
                      Record (B)
                    </>
                  )}
                </Button>
                {isRecording && (
                  <div className="mt-3 flex items-center justify-center gap-2 text-sm text-red-600">
                    <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                    Recording live
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Shortcuts */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Shortcuts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Start</span>
                  <kbd className="px-2 py-1 bg-slate-100 rounded text-xs">B</kbd>
                </div>
                <div className="flex justify-between">
                  <span>Stop</span>
                  <kbd className="px-2 py-1 bg-slate-100 rounded text-xs">E</kbd>
                </div>
                <div className="flex justify-between">
                  <span>Disconnect</span>
                  <kbd className="px-2 py-1 bg-slate-100 rounded text-xs">X</kbd>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chat */}
          <Card className="md:col-span-3">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Live Transcription</CardTitle>
                {isRecording && (
                  <Badge variant="destructive" className="animate-pulse">
                    ● Recording
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px] pr-4">
                <div className="space-y-3">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg px-4 py-3 ${
                          msg.type === "user"
                            ? "bg-blue-500 text-white"
                            : msg.type === "bot"
                            ? "bg-slate-200 text-slate-900"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1 text-xs opacity-75">
                          {msg.type === "user" && <User className="h-3 w-3" />}
                          {msg.type === "bot" && <Bot className="h-3 w-3" />}
                          <span className="font-medium">
                            {msg.type === "user" ? "You" : msg.type === "bot" ? "Bot" : "System"}
                          </span>
                          <span>•</span>
                          <span>{msg.time}</span>
                          {!msg.isFinal && <span className="animate-pulse">typing...</span>}
                        </div>
                        <p className="text-sm">{msg.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Instructions */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-4 text-sm text-slate-600">
              <div className="flex-1">
                <strong>1. Connect</strong> → Click Connect button
              </div>
              <div className="flex-1">
                <strong>2. Record</strong> → Press B or click Record
              </div>
              <div className="flex-1">
                <strong>3. Speak</strong> → See live transcription
              </div>
              <div className="flex-1">
                <strong>4. Stop</strong> → Press E or click Stop
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}