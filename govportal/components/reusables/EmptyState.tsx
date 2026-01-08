"use client"

import { Button } from "@/components/ui/button"

interface Props {
  isConnected: boolean
  isRecording: boolean
  onConnect: () => void
  onRecord: () => void
}

export default function EmptyState({ isConnected, isRecording, onConnect, onRecord }: Props) {
  return (
    <div className="flex flex-col items-center justify-center h-[50vh] text-center space-y-4">

      <h2 className="text-2xl font-semibold text-foreground">How can I help you today?</h2>
      <p className="text-sm text-muted-foreground max-w-md">
        Connect to start an intelligent conversation. Use voice or text input — quick commands work great.
      </p>

      <div className="flex items-center gap-3">
        <Button variant="outline" onClick={onConnect} className="px-4">
          {isConnected ? "Reconnect" : "Connect"}
        </Button>
        <Button
          variant={isRecording ? "destructive" : "secondary"}
          onClick={onRecord}
          disabled={!isConnected}
          className={isRecording ? "shadow-[0_0_22px_rgba(239,68,68,0.35)]" : ""}
        >
          {isRecording ? "Recording…" : "Record"}
        </Button>
      </div>

      <small className="text-[11px] text-muted-foreground mt-1">Tip: Press <kbd className="px-1 py-0.5 rounded bg-muted text-[10px]">B</kbd> to record</small>
    </div>
  )
}
