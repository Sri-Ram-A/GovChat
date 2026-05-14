"use client"
import { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { useWebSocket } from "@/hooks/useWebSocket"
import { useAudioRecorder } from "@/hooks/useAudioRecorder"
import { Bot, User, Sparkles, Mic, MicOff, Send, Loader2, Paperclip } from "lucide-react"

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

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const addMessage = useCallback((type: Message["type"], text: string, isFinal = true) => {
    if (type === "system") return;

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

  const { isConnected, sendMessage, sendBinary } = useWebSocket({
    url: WS_URL,
    onMessage: handleTranscript,
    onBinary: handleAudioBinary,
    autoConnect: true,
  })

  const { isRecording, startRecording, stopRecording } = useAudioRecorder({
    onAudioData: (pcm) => sendBinary(pcm),
    onError: (err) => console.error(`Mic error: ${err.message}`),
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

  const handleSendText = (textOverride?: string) => {
    const text = textOverride || textInput.trim()
    if (!text || !isConnected) return
    addMessage("user", text)
    sendMessage({ type: "text", text: text })
    if (!textOverride) setTextInput("")
  }

  const isResponding =
    isAudioPlaying || (messages[messages.length - 1]?.type === "bot" && !messages[messages.length - 1]?.isFinal)

  return (
    <div className="relative min-h-[calc(100vh-64px)] w-full bg-white flex flex-col font-sans overflow-hidden">
      
      {/* Dot Grid Background */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(#e5e7eb 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* Main Content */}
      <div className="relative z-10 flex-1 flex flex-col w-full h-full">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6 pt-20">
            <div className="space-y-6 max-w-3xl">
              <h1 className="text-5xl font-semibold text-[#1e293b] tracking-tight">
                How can I help you today, Aditya?
              </h1>
              <p className="text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">
                Your intelligent gateway to simplified governance. Ask me anything about schemes, applications, or civic services.
              </p>
              
              {/* Suggestion Pills */}
              <div className="flex flex-wrap justify-center gap-4 mt-8">
                <button 
                  onClick={() => handleSendText("What is the Pradhan Mantri Awas Yojana?")}
                  className="px-6 py-4 bg-white border border-slate-200 rounded-2xl text-slate-600 font-medium hover:bg-slate-50 transition-all shadow-sm"
                >
                  "What is the Pradhan Mantri Awas Yojana?"
                </button>
                <button 
                  onClick={() => handleSendText("How to apply for a Senior Citizen card?")}
                  className="px-6 py-4 bg-white border border-slate-200 rounded-2xl text-slate-600 font-medium hover:bg-slate-50 transition-all shadow-sm"
                >
                  "How to apply for a Senior Citizen card?"
                </button>
              </div>
            </div>
          </div>
        ) : (
          <ScrollArea className="flex-1 px-4 py-8">
            <div className="max-w-4xl mx-auto space-y-8">
              {messages.map((msg) => (
                <div key={msg.id} className={cn("flex flex-col gap-3", msg.type === "user" ? "items-end" : "items-start")}>
                  <div className={cn("flex gap-4 max-w-[80%]", msg.type === "user" ? "flex-row-reverse" : "flex-row")}>
                    <div className={cn(
                      "h-10 w-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm",
                      msg.type === "user" ? "bg-slate-900" : "bg-blue-600"
                    )}>
                      {msg.type === "user" ? <User className="h-5 w-5 text-white" /> : <Bot className="h-5 w-5 text-white" />}
                    </div>
                    <div className="space-y-2">
                      <div className={cn(
                        "p-5 rounded-2xl text-[15px] leading-relaxed shadow-sm border",
                        msg.type === "user" 
                          ? "bg-slate-900 text-white border-slate-800" 
                          : "bg-white text-slate-800 border-slate-100"
                      )}>
                        {msg.text}
                      </div>
                      <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400 px-1">
                        {msg.time}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              
              {isResponding && (
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center">
                    <Sparkles className="h-5 w-5 text-blue-600 animate-pulse" />
                  </div>
                  <div className="bg-white border border-slate-100 px-5 py-3 rounded-2xl flex items-center gap-3 shadow-sm">
                    <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                    <span className="text-xs font-medium text-slate-400 uppercase tracking-widest">Thinking...</span>
                  </div>
                </div>
              )}
              <div ref={scrollRef} className="h-20" />
            </div>
          </ScrollArea>
        )}
      </div>

      {/* Input Area */}
      <div className="relative z-20 w-full max-w-4xl mx-auto px-6 pb-6">
        <div className="bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[24px] p-2 flex items-center gap-2 border border-slate-100 transition-all focus-within:border-slate-200">
          <Button variant="ghost" size="icon" className="h-12 w-12 rounded-full text-slate-400 hover:text-slate-600">
            <Paperclip className="h-5 w-5" />
          </Button>

          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendText()}
            placeholder="Describe your request or query here..."
            disabled={!isConnected}
            className="flex-1 bg-transparent border-none outline-none ring-0 focus:ring-0 focus:outline-none text-[15px] text-slate-700 placeholder:text-slate-400"
          />

          <Button
            variant="ghost"
            onClick={isRecording ? handleStopRecording : handleStartRecording}
            className={cn(
              "h-11 px-4 rounded-xl flex items-center gap-2 transition-all",
              isRecording ? "bg-red-50 text-red-600" : "bg-slate-50 text-slate-600 hover:bg-slate-100"
            )}
          >
            <Mic className={cn("h-4 w-4", isRecording && "animate-pulse")} />
            <span className="text-sm font-medium">Record</span>
          </Button>

          <Button
            size="icon"
            onClick={() => handleSendText()}
            disabled={!isConnected || !textInput.trim()}
            className={cn(
              "h-11 w-11 rounded-xl transition-all",
              textInput.trim() ? "bg-[#0f172a] text-white" : "bg-slate-100 text-slate-400"
            )}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>

        {/* Shortcut Hint */}
        <p className="text-center mt-4 text-xs text-slate-400 font-medium tracking-tight">
          Press <span className="px-1.5 py-0.5 bg-slate-50 border border-slate-200 rounded mx-0.5">Enter</span> to send • 
          <span className="px-1.5 py-0.5 bg-slate-50 border border-slate-200 rounded mx-0.5 ml-1">Shift + V</span> for voice
        </p>
      </div>

      {/* Footer */}
      <footer className="relative z-10 w-full border-t border-slate-100 bg-white py-8 mt-auto">
        <div className="max-w-[1400px] mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col gap-1">
            <span className="text-xl font-bold text-slate-900">GovChat</span>
            <p className="text-sm text-slate-500">
              © 2024 GovChat Platform. All rights reserved. Official Civic Governance Portal.
            </p>
          </div>
          
          <div className="flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#" className="hover:text-slate-900 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-slate-900 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-slate-900 transition-colors">Contact Support</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
