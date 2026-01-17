"use client"
import React, { useEffect, useState } from "react"
import FormField from "@/components/reusables/FormField"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Department, ComplaintCreatePayload } from "@/types"
import { REQUEST } from "@/services/api"

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

export default function CitizenPostPage() {
  const router = useRouter();
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [form, setForm] = useState<ComplaintCreatePayload>(INITIAL_FORM_STATE)

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
    setForm(prev => ({ ...prev, ...updates }))
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

  // ==================== GEOLOCATION ====================
  
  const getCurrentCoordinates = (): Promise<{ lat: number; lng: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        return reject(new Error("Geolocation not supported"))
      }

      navigator.geolocation.getCurrentPosition(
        pos => resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        }),
        err => reject(err)
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

      const updates: Partial<ComplaintCreatePayload> = {
        latitude: lat,
        longitude: lng,
      }

      UPDATABLE_LOCATION_FIELDS.forEach(key => {
        if (location[key]) {
          updates[key] = location[key]
        }
      })

      updateForm(updates)
    } catch (err) {
      console.error("Location refinement failed:", err)
      alert("Failed to refine location. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  // ==================== AI DESCRIPTION ====================
  
  const handleRefineDescription = async () => {
    if (!file) {
      alert("Please upload an image first")
      return
    }

    setLoading(true)
    try {
      const fd = new FormData()
      fd.append("file", file)

      const ai = await REQUEST("POST", "citizens/ai/caption_image/", fd, {
        isMultipart: true,
      })

      updateForm({
        description: ai.caption,
        department: ai.suggested_department.id,
      })
    } catch (err) {
      console.error("AI refinement failed:", err)
      alert("Failed to generate AI description. Please try again.")
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

  const ensureCoordinates = async (): Promise<{ latitude: number; longitude: number }> => {
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

    await REQUEST(
      "POST",
      `citizens/upload_evidence/${complaintId}/`,
      fd,
      { isMultipart: true }
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!file) {
      alert("Evidence file is required")
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

      alert("Complaint submitted successfully!")
      router.push("/citizen/dashboard");
      // Reset form
      setForm(INITIAL_FORM_STATE)
      setFile(null)
    } catch (err) {
      console.error("Submission failed:", err)
      alert("Failed to submit complaint. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  // ==================== RENDER ====================
  
  const isImageFile = file?.type.startsWith("image")

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Create a Complaint</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <FormField
          label="Title"
          value={form.title}
          onChange={v => handleChange("title", v)}
          required
        />

        <FormField
          label="Description"
          value={form.description}
          onChange={v => handleChange("description", v)}
          required
        />

        {/* Address Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="Address Line 1"
            value={form.address_line_1}
            onChange={v => handleChange("address_line_1", v)}
          />

          <FormField
            label="Address Line 2"
            value={form.address_line_2}
            onChange={v => handleChange("address_line_2", v)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            label="City"
            value={form.city}
            onChange={v => handleChange("city", v)}
          />

          <FormField
            label="Pincode"
            value={form.pincode}
            onChange={v => handleChange("pincode", v)}
          />

          <div className="flex items-end">
            <Button
              type="button"
              onClick={handleRefineLocation}
              disabled={loading}
              variant="outline"
              className="w-full"
            >
              Refine Location
            </Button>
          </div>
        </div>

        {/* Department Selection */}
        <div className="space-y-2">
          <Label>Department</Label>
          <Select
            value={form.department.toString()}
            onValueChange={v => handleChange("department", Number(v))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {departments.map(dep => (
                  <SelectItem key={dep.id} value={dep.id.toString()}>
                    {dep.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        {/* Evidence Upload */}
        <div className="space-y-2">
          <Label>Evidence (Image / Video / Audio / PDF)</Label>
          <input
            type="file"
            accept="image/*,video/*,audio/*,.pdf"
            onChange={handleFileChange}
            className="w-full"
          />
          {isImageFile && (
            <Button
              type="button"
              onClick={handleRefineDescription}
              disabled={loading}
              variant="outline"
              className="mt-2"
            >
              Refine Description (AI)
            </Button>
          )}
        </div>

        {/* Submit Button */}
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Submitting..." : "Submit Complaint"}
        </Button>
      </form>
    </div>
  )
}