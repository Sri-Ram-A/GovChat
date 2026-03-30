"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Mic, MicOff, Send, Moon, Sun, Wifi, WifiOff } from "lucide-react"
import { useWebSocket } from "@/hooks/useWebSocket"
import { useAudioRecorder } from "@/hooks/useAudioRecorder"
import EmptyState from "@/components/reusables/forms/EmptyState"
import { cn } from "@/lib/utils"

const WS_URL = "ws://localhost:8000/chat/"

interface Message {
  id: string
  type: "user" | "bot" | "system"
  text: string
  time: string
  isFinal?: boolean
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [isAudioPlaying, setIsAudioPlaying] = useState(false)
  const [textInput, setTextInput] = useState("")
  const msgIdRef = useRef(0)
  const audioContextRef = useRef<AudioContext | null>(null)
  const audioQueueRef = useRef<ArrayBuffer[]>([])
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll on new messages
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const addMessage = useCallback((type: Message["type"], text: string, isFinal = true) => {
    const msg: Message = {
      id: `msg-${msgIdRef.current++}`,
      type,
      text,
      time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
      isFinal,
    }
    setMessages((prev) => {
      if (!isFinal && prev.length > 0 && prev[prev.length - 1].type === type && !prev[prev.length - 1].isFinal) {
        return [...prev.slice(0, -1), msg]
      }
      return [...prev, msg]
    })
  }, [])

  const handleTranscript = useCallback(
    (data: any) => {
      switch (data.type) {
        case "transcript":
          addMessage("user", data.text, data.final)
          break

        case "response":
          addMessage("bot", data.text, true)
          break

        default:
          console.warn("Unknown WS message:", data)
      }
    },
    [addMessage],
  )

  const handleAudioBinary = useCallback(
    async (audioData: ArrayBuffer) => {
      audioQueueRef.current.push(audioData)
      if (!isAudioPlaying) playAudioQueue()
    },
    [isAudioPlaying],
  )

  const playAudioQueue = async () => {
    if (audioQueueRef.current.length === 0) {
      setIsAudioPlaying(false)
      return
    }
    setIsAudioPlaying(true)
    try {
      if (!audioContextRef.current || audioContextRef.current.state === "closed") {
        audioContextRef.current = new AudioContext({ sampleRate: 24000 })
      }
      if (audioContextRef.current.state === "suspended") {
        await audioContextRef.current.resume()
      }
      const audioData = audioQueueRef.current.shift()!
      const pcm16 = new Int16Array(audioData)
      const float32 = new Float32Array(pcm16.length)
      for (let i = 0; i < pcm16.length; i++) {
        float32[i] = pcm16[i] / 32768.0
      }
      const audioBuffer = audioContextRef.current.createBuffer(1, float32.length, 24000)
      audioBuffer.copyToChannel(float32, 0)
      const source = audioContextRef.current.createBufferSource()
      source.buffer = audioBuffer
      source.connect(audioContextRef.current.destination)
      source.onended = () => {
        audioQueueRef.current.length > 0 ? playAudioQueue() : setIsAudioPlaying(false)
      }
      source.start()
    } catch {
      setIsAudioPlaying(false)
    }
  }

  const { isConnected, connect, disconnect, sendMessage, sendBinary } = useWebSocket({
    url: WS_URL,
    onMessage: handleTranscript,
    onBinary: handleAudioBinary,
    onOpen: () => addMessage("system", "Connected to server"),
    onClose: () => addMessage("system", "Disconnected"),
    onError: () => addMessage("system", "Connection error"),
    autoConnect: false,
  })

  const { isRecording, startRecording, stopRecording } = useAudioRecorder({
    onAudioData: (pcm) => sendBinary(pcm),
    onError: (err) => addMessage("system", `Mic error: ${err.message}`),
  })

  const handleStartRecording = async () => {
    if (!isConnected) return
    sendMessage({ action: "start_recording" })
    await startRecording()
  }

  const handleStopRecording = () => {
    stopRecording()
    sendMessage({ action: "finalize" })
  }

  const handleSendText = () => {
    if (!textInput.trim() || !isConnected) return
    addMessage("user", textInput.trim())
    sendMessage({ type: "text", text: textInput.trim() })
    setTextInput("")
  }

  const isResponding =
    isAudioPlaying || (messages[messages.length - 1]?.type === "bot" && !messages[messages.length - 1]?.isFinal)

  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      {/* Dot Grid Background */}
      <div
        className={cn(
          "absolute inset-0",
          "bg-size-[40px_40px]",
          "bg-[linear-gradient(to_right,#e4e4e7_1px,transparent_1px),linear-gradient(to_bottom,#e4e4e7_1px,transparent_1px)]",
          "dark:bg-[linear-gradient(to_right,#262626_1px,transparent_1px),linear-gradient(to_bottom,#262626_1px,transparent_1px)]",
        )}
      />
      {/* Radial gradient for the container to give a faded look */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-white mask-[radial-gradient(ellipse_at_center,transparent_20%,black)] dark:bg-black"></div>
      {/* Main Container */}
      <div className="relative z-10 flex flex-col h-screen max-w-3xl mx-auto">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-border/50 backdrop-blur-sm">
          <div className="flex items-center gap-3">

            <div>
              <h1 className="text-lg font-semibold text-foreground">AI Assistant</h1>
              <p className="text-xs text-muted-foreground">
                {isRecording ? "Listening..." : isResponding ? "Responding..." : isConnected ? "Online" : "Offline"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Connection Status */}
            <Button
              variant="ghost"
              size="icon"
              onClick={isConnected ? disconnect : connect}
              className={cn(
                "rounded-full",
                isConnected ? "text-emerald-500 hover:text-emerald-600" : "text-muted-foreground",
              )}
            >
              {isConnected ? <Wifi className="h-5 w-5" /> : <WifiOff className="h-5 w-5" />}
            </Button>

          </div>
        </header>

        {/* Chat Area */}
        <ScrollArea className="flex-1 px-6 py-4">
          <div className="space-y-4">
            {messages.length === 0 && (
              <EmptyState
                isConnected={isConnected}
                isRecording={isRecording}
                onConnect={connect}
                onRecord={handleStartRecording}
              />
            )}
            {messages.map((msg) => (
              <div key={msg.id} className={cn("flex", msg.type === "user" ? "justify-end" : "justify-start")}>
                {msg.type === "system" ? (
                  <div className="w-full text-center">
                    <span className="text-xs text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">{msg.text}</span>
                  </div>
                ) : (
                  <div
                    className={cn(
                      "max-w-[80%] rounded-2xl px-4 py-3 text-sm transition-all duration-300 ease-out msg-enter",
                      msg.type === "user"
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-muted text-foreground rounded-bl-md",
                    )}
                  >
                    <p className={cn(!msg.isFinal && "opacity-70")}>{msg.text}</p>
                    <span
                      className={cn(
                        "text-[10px] mt-1 block",
                        msg.type === "user" ? "text-primary-foreground/60" : "text-muted-foreground",
                      )}
                    >
                      {msg.time}
                      {!msg.isFinal && " • typing..."}
                    </span>
                  </div>
                )}
              </div>
            ))}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="px-6 py-4 border-t border-border/50 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            {/* Mic Button */}
            <Button
              variant={isRecording ? "destructive" : "secondary"}
              size="icon"
              onClick={isRecording ? handleStopRecording : handleStartRecording}
              disabled={!isConnected}
              className={cn(
                "rounded-full h-12 w-12 shrink-0 transition-all",
                isRecording
                  ? "shadow-[0_0_30px_rgba(239,68,68,0.45)] ring-2 ring-destructive/40"
                  : "hover:shadow-md",
              )}
            >
              {isRecording ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </Button>

            {/* Text Input */}
            <div className="relative flex-1">
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendText()}
                placeholder={isConnected ? "Type a message..." : "Connect to start chatting"}
                disabled={!isConnected}
                className="w-full h-12 px-4 pr-12 rounded-full bg-muted/50 border border-border/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSendText}
                disabled={!isConnected || !textInput.trim()}
                className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full h-10 w-10"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Keyboard shortcuts hint */}
          <p className="text-[10px] text-muted-foreground text-center mt-3">
            Press <kbd className="px-1.5 py-0.5 rounded bg-muted text-[9px] font-mono">B</kbd> to record •{" "}
            <kbd className="px-1.5 py-0.5 rounded bg-muted text-[9px] font-mono">E</kbd> to stop •{" "}
            <kbd className="px-1.5 py-0.5 rounded bg-muted text-[9px] font-mono">Enter</kbd> to send
          </p>
        </div>
      </div>
    </div>
  )
}
