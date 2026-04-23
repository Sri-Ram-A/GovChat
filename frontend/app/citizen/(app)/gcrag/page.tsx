"use client"

import { ChangeEvent, DragEvent, useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"

const UPLOAD_URL = "http://localhost:8001/upload"
const STATUS_URL = "http://localhost:8001/documents"
const QUERY_URL = "http://localhost:8001/query"

type UploadStatus = "idle" | "uploading" | "processing" | "ready" | "error"

export default function GcragPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [title, setTitle] = useState("")
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>("idle")
  const [statusMessage, setStatusMessage] = useState("Select a PDF and upload to begin.")
  const [documentId, setDocumentId] = useState<string>("")
  const [indexedCount, setIndexedCount] = useState<number | null>(null)
  const [polling, setPolling] = useState(false)
  const [question, setQuestion] = useState("")
  const [topK, setTopK] = useState(3)
  const [answer, setAnswer] = useState("")
  const [graphsUsed, setGraphsUsed] = useState<Array<string | Record<string, any>>>([])
  const [confidence, setConfidence] = useState<number | null>(null)
  const [queryLoading, setQueryLoading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [queryError, setQueryError] = useState<string | null>(null)

  useEffect(() => {
    if (!documentId || !polling) return

    let interval: number
    const fetchStatus = async () => {
      try {
        const res = await fetch(`${STATUS_URL}/${documentId}/status`)
        if (!res.ok) {
          throw new Error("Failed to fetch document status")
        }
        const data = await res.json()
        const sections = typeof data.sections_indexed === "number" ? data.sections_indexed : typeof data.indexed_sections === "number" ? data.indexed_sections : null
        const status = String(data.status || data.state || (sections !== null && sections > 0 ? "ready" : "processing")).toLowerCase()

        if (status === "ready" || status === "done" || status === "completed" || (sections !== null && sections > 0)) {
          setUploadStatus("ready")
          setStatusMessage(`Done - ${sections ?? 0} sections indexed`)
          setIndexedCount(sections)
          setPolling(false)
          return
        }

        setUploadStatus("processing")
        setStatusMessage("Processing in background...")
        if (sections !== null) {
          setIndexedCount(sections)
        }
      } catch (error) {
        setUploadStatus("error")
        setStatusMessage("Unable to fetch upload status.")
        setPolling(false)
      }
    }

    fetchStatus()
    interval = window.setInterval(fetchStatus, 5000)
    return () => window.clearInterval(interval)
  }, [documentId, polling])

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (file.type !== "application/pdf") {
      setUploadError("Only PDF files are accepted.")
      setSelectedFile(null)
      return
    }
    setUploadError(null)
    setSelectedFile(file)
  }

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setDragActive(false)
    const file = event.dataTransfer.files?.[0]
    if (!file) return
    if (file.type !== "application/pdf") {
      setUploadError("Only PDF files are accepted.")
      setSelectedFile(null)
      return
    }
    setUploadError(null)
    setSelectedFile(file)
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadError("Please select a PDF file before uploading.")
      return
    }

    setUploadError(null)
    setUploadStatus("uploading")
    setStatusMessage("Uploading...")
    setDocumentId("")
    setIndexedCount(null)

    try {
      const formData = new FormData()
      formData.append("file", selectedFile)
      if (title.trim()) {
        formData.append("title", title.trim())
      }

      const res = await fetch(UPLOAD_URL, {
        method: "POST",
        body: formData,
      })

      if (!res.ok) {
        const body = await res.text()
        throw new Error(body || "Upload failed")
      }

      const data = await res.json()
      const id = String(data.document_id || data.documentId || data.id || "")
      if (!id) {
        throw new Error("Upload succeeded but no document ID returned.")
      }

      setDocumentId(id)
      setUploadStatus("processing")
      setStatusMessage("Processing in background...")
      setPolling(true)
    } catch (error) {
      setUploadStatus("error")
      setStatusMessage("Upload failed. Please try again.")
      setUploadError(error instanceof Error ? error.message : String(error))
    }
  }

  const handleAsk = async () => {
    if (!question.trim()) {
      setQueryError("Please enter a question to ask.")
      return
    }

    setQueryError(null)
    setAnswer("")
    setGraphsUsed([])
    setConfidence(null)
    setQueryLoading(true)

    try {
      const res = await fetch(QUERY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: question.trim(), top_k: topK }),
      })

      if (!res.ok) {
        const body = await res.text()
        throw new Error(body || "Query failed")
      }

      const data = await res.json()
      setAnswer(String(data.answer ?? data.text ?? "No answer returned."))
      setGraphsUsed(Array.isArray(data.graphs_used) ? data.graphs_used : Array.isArray(data.sections_used) ? data.sections_used : [])
      setConfidence(typeof data.confidence === "number" ? data.confidence : null)
    } catch (error) {
      setQueryError(error instanceof Error ? error.message : String(error))
    } finally {
      setQueryLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground px-4 py-6 sm:px-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold">Graph-RAG Document Q&A</h1>
          <p className="max-w-3xl text-sm text-muted-foreground">
            Upload a PDF to index it into the graph retrieval system, then ask questions and see which sections were used.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Upload Document</CardTitle>
            <CardDescription>PDF only. Upload first, then poll status until indexing completes.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div
              onDragEnter={(event) => {
                event.preventDefault()
                setDragActive(true)
              }}
              onDragOver={(event) => event.preventDefault()}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              className={`rounded-2xl border border-dashed px-4 py-10 text-center transition ${
                dragActive ? "border-primary bg-primary/10" : "border-border bg-muted/10"
              }`}
            >
              <label htmlFor="document-upload" className="cursor-pointer">
                <div className="mx-auto flex max-w-md flex-col items-center justify-center gap-3 text-sm text-muted-foreground">
                  <span className="text-2xl">📄</span>
                  <p className="font-medium text-foreground">Drag and drop a PDF file here</p>
                  <p>or click to select a file</p>
                  <p className="text-xs">Only PDF uploads are accepted.</p>
                  {selectedFile && (
                    <p className="rounded-full bg-background px-3 py-1 text-xs text-primary-foreground">{selectedFile.name}</p>
                  )}
                </div>
              </label>
              <input
                id="document-upload"
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
              <div className="space-y-2">
                <label className="text-sm font-medium">Document title (optional)</label>
                <Input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Add a title for the uploaded document"
                />
              </div>
              <div className="flex items-end justify-end">
                <Button onClick={handleUpload} disabled={uploadStatus === "uploading" || uploadStatus === "processing"}>
                  {uploadStatus === "uploading" ? "Uploading..." : "Upload"}
                </Button>
              </div>
            </div>

            <div className="grid gap-2 rounded-2xl border border-border bg-muted/40 p-4 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium">Status:</span>
                <Badge variant={uploadStatus === "ready" ? "secondary" : uploadStatus === "error" ? "destructive" : "default"}>
                  {uploadStatus === "idle" ? "Waiting" : uploadStatus === "uploading" ? "Uploading" : uploadStatus === "processing" ? "Processing" : uploadStatus === "ready" ? "Ready" : "Error"}
                </Badge>
              </div>
              <p className="text-muted-foreground">{statusMessage}</p>
              {documentId && (
                <p className="text-sm">
                  Document ID: <span className="font-medium text-foreground">{documentId}</span>
                </p>
              )}
              {indexedCount !== null && (
                <p className="text-sm text-muted-foreground">Indexed sections: {indexedCount}</p>
              )}
              {uploadError && <p className="text-sm text-destructive">{uploadError}</p>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Query the Document</CardTitle>
            <CardDescription>Ask a question, choose the number of top sections, and review the confidence score.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Question</label>
                <Input
                  value={question}
                  onChange={(event) => setQuestion(event.target.value)}
                  placeholder="Enter your question here"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-[1fr_auto] items-end">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Top K sections</label>
                  <select
                    value={topK}
                    onChange={(event) => setTopK(Number(event.target.value))}
                    className="border-input h-9 w-full rounded-md border bg-transparent px-3 text-base text-foreground shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                  >
                    {[1, 3, 5, 10].map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end">
                  <Button onClick={handleAsk} disabled={queryLoading}>
                    {queryLoading ? "Asking..." : "Ask"}
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-3 rounded-2xl border border-border bg-muted/40 p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium">Answer</p>
                  <p className="text-xs text-muted-foreground">This section shows the response from your Graph-RAG query.</p>
                </div>
                <div className="text-xs text-muted-foreground">Confidence</div>
              </div>

              <div className="space-y-3">
                {queryLoading ? (
                  <Skeleton className="h-32 w-full" />
                ) : (
                  <Textarea value={answer} readOnly placeholder="Ask a question to see the answer." />
                )}

                <div className="space-y-2">
                  <div className="h-2 overflow-hidden rounded-full bg-border">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${confidence !== null ? Math.round(confidence * 100) : 0}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {confidence !== null ? `Confidence: ${Math.round(confidence * 100)}%` : "Confidence score unavailable."}
                  </p>
                </div>

                {graphsUsed.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Sections used</p>
                    <div className="flex flex-wrap gap-2">
                      {graphsUsed.map((section, index) => {
                        const label =
                          typeof section === "string"
                            ? section
                            : section.title || section.section_id || section.section_graph_id || JSON.stringify(section)
                        const key =
                          typeof section === "string"
                            ? `${section}-${index}`
                            : `${section.section_graph_id}-${index}`
                        return (
                          <Badge key={key} variant="outline">
                            {label}
                          </Badge>
                        )
                      })}
                    </div>
                  </div>
                )}

                {queryError && <p className="text-sm text-destructive">{queryError}</p>}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
