"use client"

import React, { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { 
  ClipboardCheck, 
  MapPin, 
  UploadCloud, 
  X, 
  Info, 
  FileText, 
  AlignLeft, 
  Navigation, 
  Send, 
  Lock,
  CheckCircle2,
  Trash2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { 
  Select, 
  SelectContent, 
  SelectGroup, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { REQUEST } from "@/services/api"
import { Department, ComplaintCreatePayload } from "@/types"
import { toast } from "sonner"
import Image from "next/image"
import dynamic from "next/dynamic"
import { cn } from "@/lib/utils"

const MiniMap = dynamic(() => import("@/components/reusables/MiniMap"), { ssr: false })

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

export default function CitizenPostPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [filePreview, setFilePreview] = useState<string | null>(null)
  const [form, setForm] = useState<ComplaintCreatePayload>(INITIAL_FORM_STATE)
  const [isLocationDetected, setIsLocationDetected] = useState(false)
  const [locationDetails, setLocationDetails] = useState<any>(null)

  useEffect(() => {
    fetchDepartments()
  }, [])

  const fetchDepartments = async () => {
    try {
      const res = await REQUEST("GET", "admins/departments/")
      setDepartments(res || [])
    } catch (err) {
      console.error("Failed to fetch departments:", err)
    }
  }

  const handleChange = (key: keyof ComplaintCreatePayload, value: string | number) => {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null
    setFile(selectedFile)
    if (selectedFile) {
      const reader = new FileReader()
      reader.onloadend = () => setFilePreview(reader.result as string)
      reader.readAsDataURL(selectedFile)
      
      // Auto-trigger AI captioning if it's an image
      if (selectedFile.type.startsWith("image")) {
        handleAICaption(selectedFile)
      }
    } else {
      setFilePreview(null)
    }
  }

  const handleAICaption = async (imgFile: File) => {
    setIsAnalyzing(true)
    try {
      const fd = new FormData()
      fd.append("file", imgFile)
      const ai: any = await REQUEST("POST", "citizens/ai/caption_image/", fd, { isMultipart: true })
      
      console.log("AI Analysis Result:", ai)
      
      if (ai && ai.caption) {
        setForm(prev => ({
          ...prev,
          description: ai.caption,
          department: ai.suggested_department?.id || prev.department,
        }))
        toast.success("AI Analysis complete: Description updated.")
      } else {
        toast.warning("AI was unable to generate a description for this image.")
      }
    } catch (err: any) {
      console.error("AI Captioning failed:", err)
      toast.error("AI Service is currently unavailable. Please provide a description manually.")
      // Fallback to department 1 if nothing selected
      if (form.department === 0) {
        setForm(prev => ({ ...prev, department: 1 }))
      }
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleRefineLocation = async () => {
    setLoading(true)
    try {
      const pos: any = await new Promise((res, rej) => {
        navigator.geolocation.getCurrentPosition(res, rej)
      })
      
      const lat = pos.coords.latitude
      const lng = pos.coords.longitude

      const location = await REQUEST("POST", "citizens/ai/resolve_location/", {
        latitude: lat,
        longitude: lng,
      })

      setForm(prev => ({
        ...prev,
        latitude: lat,
        longitude: lng,
        city: location.city || prev.city,
        pincode: location.pincode || prev.pincode,
        address_line_1: location.address_line_1 || prev.address_line_1,
        address_line_2: location.address_line_2 || prev.address_line_2,
      }))
      
      setLocationDetails(location)
      setIsLocationDetected(true)
      toast.success("Location pinpointed successfully!")
    } catch (err) {
      toast.error("Could not detect location automatically.")
    } finally {
      setLoading(false)
    }
  }

  const ensureCoordinates = async (): Promise<{ latitude: number; longitude: number }> => {
    if (form.latitude && form.longitude) {
      return { latitude: form.latitude, longitude: form.longitude }
    }
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        pos => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        err => reject(err)
      )
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Basic Validation
    if (!form.title.trim()) {
      toast.warning("Please provide a title for your complaint.")
      return
    }
    if (!form.description.trim()) {
      toast.warning("Please provide a description.")
      return
    }
    if (!file) {
      toast.warning("Please upload evidence (image) first.")
      return
    }

    setLoading(true)
    try {
      // 1. Ensure we have location
      let coords = { latitude: form.latitude, longitude: form.longitude }
      if (!coords.latitude || !coords.longitude) {
        try {
          coords = await ensureCoordinates()
        } catch (lErr) {
          console.warn("Could not auto-detect location, proceeding with default if allowed", lErr)
        }
      }

      // 2. Create Complaint
      const complaint = await REQUEST("POST", "citizens/complaints/", {
        ...form,
        ...coords
      })
      
      // 3. Upload Evidence
      const fd = new FormData()
      fd.append("file", file)
      fd.append("media_type", file.type.startsWith("image") ? "image" : "document")
      
      await REQUEST("POST", `citizens/upload_evidence/${complaint.id}/`, fd, { isMultipart: true })
      
      toast.success("Complaint submitted! Our team is on it.")
      router.push("/citizen/complaints")
    } catch (err) {
      console.error("Submission failed:", err)
      toast.error("Submission failed. Please ensure all required fields are filled correctly.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-12 space-y-10">
        
        {/* Header Section */}
        <section className="flex flex-col md:flex-row items-center justify-between gap-8 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm overflow-hidden relative">
          <div className="space-y-4 relative z-10 max-w-xl">
            <Badge className="bg-blue-50 text-blue-600 border-none px-3 py-1 text-[10px] uppercase font-bold tracking-wider">
              Citizen Reporting Portal
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900">
              Create a Complaint
            </h1>
            <p className="text-slate-500 leading-relaxed">
              Report civic issues quickly and help improve your community. Your reports are automatically routed to the correct department using AI.
            </p>
          </div>
          <div className="relative w-48 h-48 flex-shrink-0">
             <Image 
               src="/illustrations/complaint_hero.png" 
               alt="Creation Illustration" 
               fill 
               className="object-contain"
             />
          </div>
          {/* Decorative background circle */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full -translate-y-1/2 translate-x-1/3 opacity-50" />
        </section>

        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Form Fields: Title & Description */}
          <section className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                Complaint Title <span className="text-red-500">*</span>
              </label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                  <FileText className="w-5 h-5" />
                </div>
                <Input 
                  placeholder="Enter a short title for your complaint" 
                  className="pl-12 h-14 rounded-2xl border-slate-200 bg-white focus:ring-2 focus:ring-blue-500/20 transition-all text-sm"
                  value={form.title}
                  onChange={(e) => handleChange("title", e.target.value)}
                  maxLength={100}
                  required
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-300">
                  {form.title.length}/100
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  Complaint Description <span className="text-red-500">*</span>
                </label>
                <Badge variant="outline" className="bg-blue-50/50 text-blue-500 border-blue-100 text-[9px] font-bold uppercase tracking-wider">
                  AI Auto-Generated
                </Badge>
              </div>
              <div className="relative group">
                <div className={cn(
                  "absolute left-4 top-5 text-slate-400 group-focus-within:text-blue-500 transition-colors",
                  isAnalyzing && "animate-pulse text-blue-500"
                )}>
                  <AlignLeft className="w-5 h-5" />
                </div>
                <Textarea 
                  placeholder={isAnalyzing ? "AI is analyzing your image... Please wait." : "Provide details about the issue you are facing..."}
                  className={cn(
                    "pl-12 min-h-[160px] pt-5 rounded-2xl border-slate-200 bg-white focus:ring-2 focus:ring-blue-500/20 transition-all text-sm leading-relaxed",
                    isAnalyzing && "bg-slate-50/50"
                  )}
                  value={form.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  maxLength={1000}
                  required
                  disabled={isAnalyzing}
                />
                {isAnalyzing && (
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-2">
                    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">AI Thinking...</span>
                  </div>
                )}
                <div className="absolute right-4 bottom-4 text-[10px] font-bold text-slate-300">
                  {form.description.length}/1000
                </div>
              </div>
            </div>
          </section>

          {/* Upload Evidence Section */}
          <section className="space-y-4">
             <label className="text-sm font-bold text-slate-700">
               Upload Evidence (Image Only) <span className="text-red-500">*</span>
             </label>
             <div 
               onClick={() => fileInputRef.current?.click()}
               className={cn(
                 "border-2 border-dashed rounded-3xl p-12 transition-all cursor-pointer flex flex-col items-center justify-center gap-4 bg-white",
                 file ? "border-blue-200 bg-blue-50/20" : "border-slate-200 hover:border-blue-400 hover:bg-slate-50"
               )}
             >
               <input 
                 type="file" 
                 ref={fileInputRef} 
                 onChange={handleFileChange} 
                 className="hidden" 
                 accept="image/*"
               />
               <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 shadow-sm">
                 <UploadCloud className="w-8 h-8" />
               </div>
               <div className="text-center">
                 <p className="text-sm font-bold text-slate-900">Drag and drop an image here</p>
                 <p className="text-xs text-slate-400 mt-1">or click to browse from files</p>
               </div>
               <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest mt-2">
                 Only JPG, PNG, WebP up to 10MB
               </p>
             </div>

             {/* File Preview Card */}
             {file && (
               <Card className="rounded-2xl border-slate-200 overflow-hidden shadow-sm max-w-xs animate-in fade-in slide-in-from-bottom-2">
                 <CardContent className="p-0 relative aspect-video">
                   <Image 
                     src={filePreview || ""} 
                     alt="Preview" 
                     fill 
                     className="object-cover"
                   />
                   <button 
                     type="button"
                     onClick={() => { setFile(null); setFilePreview(null); }}
                     className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-red-500 transition-colors backdrop-blur-sm"
                   >
                     <X className="w-4 h-4" />
                   </button>
                 </CardContent>
                 <div className="p-3 bg-white flex items-center justify-between">
                   <div className="overflow-hidden">
                     <p className="text-xs font-bold text-slate-900 truncate">{file.name}</p>
                     <p className="text-[10px] text-slate-400">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                   </div>
                   <div className="text-green-500">
                     <CheckCircle2 className="w-5 h-5" />
                   </div>
                 </div>
               </Card>
             )}
          </section>

          {/* Location Section */}
          <section className="space-y-6">
            <div className="flex flex-col gap-4">
              <label className="text-sm font-bold text-slate-700">
                Refine Location <span className="text-red-500">*</span>
              </label>
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleRefineLocation}
                disabled={loading}
                className="w-full h-12 rounded-2xl border-blue-200 text-blue-600 hover:bg-blue-50 font-bold text-xs flex items-center gap-2 group transition-all"
              >
                <Navigation className="w-4 h-4 group-hover:rotate-45 transition-transform" />
                Refine Location (Auto Detect)
              </Button>
            </div>

            {isLocationDetected && (
              <Card className="rounded-3xl border-slate-200 overflow-hidden bg-white shadow-sm animate-in fade-in slide-in-from-bottom-4">
                <CardContent className="p-0">
                  <div className="p-6 flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center text-green-600 shrink-0 shadow-sm border border-green-100">
                      <MapPin className="w-6 h-6" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none text-[10px] font-black px-2 py-0.5">
                          Location Detected
                        </Badge>
                        <div className="flex items-center gap-3">
                           <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Accuracy: <span className="text-green-600">High</span></p>
                        </div>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 leading-tight">
                        {form.address_line_1}
                      </h4>
                      <p className="text-xs text-slate-500">
                        {form.address_line_2}, {form.city}, {form.pincode}
                      </p>
                      <button 
                        type="button"
                        onClick={() => setIsLocationDetected(false)}
                        className="text-[11px] font-bold text-blue-600 hover:underline flex items-center gap-1 mt-2"
                      >
                         <Trash2 className="w-3 h-3" />
                         Reset Location
                      </button>
                    </div>
                  </div>
                  
                  <MiniMap lat={form.latitude!} lng={form.longitude!} />
                </CardContent>
              </Card>
            )}
          </section>

          {/* Submit Section */}
          <section className="pt-8 space-y-4">
             <Button 
               disabled={loading || !file} 
               className="w-full h-16 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-xl shadow-slate-900/10 flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
             >
               {loading ? (
                 <>
                   <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                   Processing Request...
                 </>
               ) : (
                 <>
                   <Send className="w-5 h-5" />
                   Submit Complaint
                 </>
               )}
             </Button>
             <div className="flex items-center justify-center gap-2 text-slate-400">
                <Lock className="w-3 h-3" />
                <span className="text-[10px] font-medium uppercase tracking-widest">
                  Your complaint will be securely submitted and tracked
                </span>
             </div>
          </section>

        </form>
      </main>
    </div>
  )
}