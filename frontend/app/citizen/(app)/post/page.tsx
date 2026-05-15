"use client"
import React, { useEffect, useRef, useState } from "react"
import FormField from "@/components/reusables/forms/FormField"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useRouter } from "next/navigation"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Department, ComplaintCreatePayload } from "@/types"
import { REQUEST } from "@/services/api"
import { toast } from "sonner"
import {
  MapPin,
  Sparkles,
  Upload,
  X,
  FileText,
  FileAudio,
  FileVideo,
  Image as ImageIcon,
  Loader2,
  SendHorizonal,
  Building2,
  ChevronRight,
} from "lucide-react"

const INITIAL_FORM_STATE: ComplaintCreatePayload = {
  title: "",
  description: "",
  department: 0,
  address_line_1: "",
  address_line_2: "",
  landmark: "",
  city: "",
  pincode: "",
  latitude: 0,
  longitude: 0,
}

const UPDATABLE_LOCATION_FIELDS = ["city", "pincode", "address_line_2"] as const

function SectionHeader({
  step,
  title,
  subtitle,
}: {
  step: number
  title: string
  subtitle?: string
}) {
  return (
    <div className="flex items-start gap-3 mb-4">
      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center mt-0.5 shadow-sm">
        {step}
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground leading-tight">{title}</p>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
        )}
      </div>
    </div>
  )
}

function FilePreview({
  file,
  onRemove,
}: {
  file: File
  onRemove: () => void
}) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    if (file.type.startsWith("image")) {
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
      return () => URL.revokeObjectURL(url)
    }
  }, [file])

  const isImage = file.type.startsWith("image")
  const isVideo = file.type.startsWith("video")
  const isAudio = file.type.startsWith("audio")

  const FileIcon = isVideo
    ? FileVideo
    : isAudio
    ? FileAudio
    : isImage
    ? ImageIcon
    : FileText

  const fileSizeLabel =
    file.size < 1024 * 1024
      ? `${(file.size / 1024).toFixed(1)} KB`
      : `${(file.size / (1024 * 1024)).toFixed(1)} MB`

  return (
    <div className="relative rounded-xl border border-border bg-muted/40 overflow-hidden">
      {isImage && previewUrl ? (
        <div className="relative">
          <img
            src={previewUrl}
            alt="Evidence preview"
            className="w-full max-h-64 object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <div className="absolute bottom-3 left-3 right-10">
            <p className="text-white text-xs font-medium truncate">{file.name}</p>
            <p className="text-white/70 text-[10px]">{fileSizeLabel}</p>
          </div>
          <Badge
            variant="secondary"
            className="absolute top-2 left-2 text-[10px] gap-1 py-0.5"
          >
            <ImageIcon className="w-2.5 h-2.5" />
            Image
          </Badge>
        </div>
      ) : (
        <div className="flex items-center gap-3 p-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <FileIcon className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
            <p className="text-xs text-muted-foreground">{fileSizeLabel}</p>
          </div>
        </div>
      )}
      <button
        type="button"
        onClick={onRemove}
        className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

export default function CitizenPostPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [form, setForm] = useState<ComplaintCreatePayload>(INITIAL_FORM_STATE)
  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => {
    fetchDepartments()
  }, [])

  // ==================== DATA FETCHING ====================

  const fetchDepartments = async () => {
    try {
      const res = await REQUEST("GET", "admins/departments/")
      setDepartments(res || [])
    } catch (err) {
      console.error("Failed to fetch departments:", err)
    }
  }

  // ==================== FORM HANDLERS ====================

  const updateForm = (updates: Partial<ComplaintCreatePayload>) => {
    setForm((prev) => ({ ...prev, ...updates }))
  }

  const handleChange = (
    key: keyof ComplaintCreatePayload,
    value: string | number
  ) => {
    updateForm({ [key]: value })
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] || null)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    const dropped = e.dataTransfer.files?.[0]
    if (dropped) setFile(dropped)
  }

  // ==================== GEOLOCATION ====================

  const getCurrentCoordinates = (): Promise<{ lat: number; lng: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        return reject(new Error("Geolocation not supported"))
      }
      navigator.geolocation.getCurrentPosition(
        (pos) =>
          resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => reject(err)
      )
    })
  }

  const handleRefineLocation = async () => {
    setLoading(true)
    try {
      const { lat, lng } = await getCurrentCoordinates()
      const location = await REQUEST("POST", "citizens/ai/resolve_location/", {
        latitude: lat,
        longitude: lng,
      })
      const updates: Partial<ComplaintCreatePayload> = { latitude: lat, longitude: lng }
      UPDATABLE_LOCATION_FIELDS.forEach((key) => {
        if (location[key]) updates[key] = location[key]
      })
      updateForm(updates)
      toast.success("Location refined successfully!")
    } catch (err) {
      console.error("Location refinement failed:", err)
      toast.error("Failed to refine location. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  // ==================== AI DESCRIPTION ====================

  const handleRefineDescription = async () => {
    if (!file) {
      toast.warning("Please upload an image first")
      return
    }
    setLoading(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      const ai = await REQUEST("POST", "citizens/ai/caption_image/", fd, {
        isMultipart: true,
      })
      updateForm({ description: ai.caption, department: ai.suggested_department.id })
      toast.success("AI description generated!")
    } catch (err) {
      console.error("AI refinement failed:", err)
      toast.error("Failed to generate AI description. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  // ==================== SUBMISSION ====================

  const getMediaType = (file: File): string => {
    if (file.type.startsWith("image")) return "image"
    if (file.type.startsWith("video")) return "video"
    if (file.type.startsWith("audio")) return "audio"
    return "document"
  }

  const ensureCoordinates = async (): Promise<{
    latitude: number
    longitude: number
  }> => {
    if (form.latitude && form.longitude) {
      return { latitude: form.latitude, longitude: form.longitude }
    }
    const coords = await getCurrentCoordinates()
    return { latitude: coords.lat, longitude: coords.lng }
  }

  const uploadEvidence = async (complaintId: number, file: File) => {
    const fd = new FormData()
    fd.append("file", file)
    fd.append("media_type", getMediaType(file))
    await REQUEST("POST", `citizens/upload_evidence/${complaintId}/`, fd, {
      isMultipart: true,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) {
      toast.warning("Evidence file is required")
      return
    }
    setLoading(true)
    try {
      const coordinates = await ensureCoordinates()
      const complaint = await REQUEST("POST", "citizens/complaints/", {
        ...form,
        ...coordinates,
      })
      await uploadEvidence(complaint.id, file)
      toast.success("Complaint submitted successfully!")
      router.push("/citizen/complaints")
      setForm(INITIAL_FORM_STATE)
      setFile(null)
    } catch (err) {
      console.error("Submission failed:", err)
      toast.error("Failed to submit complaint. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const isImageFile = file?.type.startsWith("image")
  const hasCoordinates = form.latitude !== 0 && form.longitude !== 0

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
            <span>Dashboard</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-foreground font-medium">New Complaint</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            File a Complaint
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Report a civic issue in your area. We'll route it to the right department.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* ── Section 1: Basic Info ── */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4">
            <SectionHeader
              step={1}
              title="Basic Information"
              subtitle="Give your complaint a clear title and description"
            />

            <FormField
              label="Title"
              value={form.title}
              onChange={(v) => handleChange("title", v)}
              required
            />

            <div className="space-y-1.5">
              <FormField
                label="Description"
                value={form.description}
                onChange={(v) => handleChange("description", v)}
                required
              />
              {isImageFile && (
                <Button
                  type="button"
                  onClick={handleRefineDescription}
                  disabled={loading}
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs h-7 px-2.5 mt-1 border-dashed border-primary/40 text-primary hover:bg-primary/5"
                >
                  {loading ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Sparkles className="w-3 h-3" />
                  )}
                  Auto-fill with AI
                </Button>
              )}
            </div>
          </div>

          {/* ── Section 2: Location ── */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4">
            <SectionHeader
              step={2}
              title="Location Details"
              subtitle="Where is the issue located?"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Address Line 1"
                value={form.address_line_1}
                onChange={(v) => handleChange("address_line_1", v)}
              />
              <FormField
                label="Address Line 2"
                value={form.address_line_2}
                onChange={(v) => handleChange("address_line_2", v)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                label="City"
                value={form.city}
                onChange={(v) => handleChange("city", v)}
              />
              <FormField
                label="Pincode"
                value={form.pincode}
                onChange={(v) => handleChange("pincode", v)}
              />
            </div>

            <div className="flex items-center gap-3">
              <Button
                type="button"
                onClick={handleRefineLocation}
                disabled={loading}
                variant="outline"
                size="sm"
                className="gap-2 text-xs h-8 px-3"
              >
                {loading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <MapPin className="w-3.5 h-3.5" />
                )}
                Detect My Location
              </Button>
              {hasCoordinates && (
                <Badge
                  variant="secondary"
                  className="gap-1 text-[10px] py-0.5 px-2 bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                  GPS acquired
                </Badge>
              )}
            </div>
          </div>

          {/* ── Section 3: Department ── */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4">
            <SectionHeader
              step={3}
              title="Department"
              subtitle="Select the department responsible for this issue"
            />

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Assigned Department
              </Label>
              <Select
                value={form.department.toString()}
                onValueChange={(v) => handleChange("department", Number(v))}
              >
                <SelectTrigger className="h-10">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-muted-foreground" />
                    <SelectValue placeholder="Select a department" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {departments.map((dep) => (
                      <SelectItem key={dep.id} value={dep.id.toString()}>
                        {dep.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* ── Section 4: Evidence Upload ── */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4">
            <SectionHeader
              step={4}
              title="Evidence"
              subtitle="Attach a photo, video, audio, or PDF to support your complaint"
            />

            {!file ? (
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`
                  relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed
                  cursor-pointer transition-all duration-200 py-10 px-6 text-center
                  ${isDragging
                    ? "border-primary bg-primary/5 scale-[1.01]"
                    : "border-border hover:border-primary/50 hover:bg-muted/30"
                  }
                `}
              >
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                  <Upload className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Drop your file here, or{" "}
                    <span className="text-primary underline underline-offset-2">browse</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Supports images, videos, audio, and PDFs
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*,audio/*,.pdf"
                  onChange={handleFileChange}
                  className="sr-only"
                />
              </div>
            ) : (
              <FilePreview file={file} onRemove={() => setFile(null)} />
            )}
          </div>

          <Separator />

          {/* ── Submit ── */}
          <Button
            type="submit"
            disabled={loading}
            className="w-full h-11 text-sm font-semibold gap-2 shadow-sm"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Submitting…
              </>
            ) : (
              <>
                <SendHorizonal className="w-4 h-4" />
                Submit Complaint
              </>
            )}
          </Button>

        </form>
      </div>
    </div>
  )
}