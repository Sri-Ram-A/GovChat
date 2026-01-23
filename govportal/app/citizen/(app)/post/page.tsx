"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Brain } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import LightRays from '@/components/LightRays';
import ElectricBorder from '@/components/ElectricBorder';
import GlassCard from '@/components/GlassCard';
import Badge from '@/components/Badge';
import InfoBox from '@/components/InfoBox';
import DecryptedText from '@/components/DecryptedText';
import AnimatedInput from "@/components/reusables/decrpyText";
import { REQUEST } from "@/services/api";
import type { MediaType, ComplaintCreatePayload, Department } from "@/types";

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
};

export default function PostComplaintPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [analyzingPhoto, setAnalyzingPhoto] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [photoAnalyzed, setPhotoAnalyzed] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<{
    confidence?: number;
    department_name?: string;
  } | null>(null);
  
  const [form, setForm] = useState<ComplaintCreatePayload>(INITIAL_FORM_STATE);
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    REQUEST("GET", "admins/departments/")
      .then(setDepartments)
      .catch(console.error);
  }, []);

  const updateForm = (updates: Partial<ComplaintCreatePayload>) => {
    setForm(prev => ({ ...prev, ...updates }));
  };

  const getCurrentCoordinates = (): Promise<{ lat: number; lng: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        return reject(new Error("Geolocation not supported"));
      }

      navigator.geolocation.getCurrentPosition(
        pos => resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        }),
        err => reject(err),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  };

  async function uploadAndAnalyze() {
    if (!file) {
      alert("Please select a photo first");
      return;
    }

    setAnalyzingPhoto(true);

    try {
      // Get current coordinates
      const { lat, lng } = await getCurrentCoordinates();

      // Step 1: Get location data
      const location = await REQUEST("POST", "citizens/ai/resolve_location/", {
        latitude: lat,
        longitude: lng,
      });

      // Step 2: Get AI caption and department suggestion
      const fd = new FormData();
      fd.append("file", file);

      const ai = await REQUEST("POST", "citizens/ai/caption_image/", fd, {
        isMultipart: true,
      });

      // Update AI suggestions state
      setAiSuggestions({
        confidence: ai.confidence,
        department_name: ai.suggested_department?.name,
      });

      // Update form with all the data
      updateForm({
        title: ai.caption || "",
        description: ai.caption || "",
        department: ai.suggested_department?.id || 0,
        address_line_2: location.address_line_2 || "",
        city: location.city || "",
        pincode: location.pincode || "",
        latitude: lat,
        longitude: lng,
      });

      setPhotoAnalyzed(true);
      alert("Photo analyzed! Please review the auto-filled details.");
    } catch (error: any) {
      console.error("Analysis failed:", error);
      alert("Failed to upload and analyze photo. Please try again.");
    } finally {
      setAnalyzingPhoto(false);
    }
  }

  const getMediaType = (file: File): string => {
    if (file.type.startsWith("image")) return "image";
    if (file.type.startsWith("video")) return "video";
    if (file.type.startsWith("audio")) return "audio";
    return "document";
  };

  const ensureCoordinates = async (): Promise<{ latitude: number; longitude: number }> => {
    if (form.latitude && form.longitude) {
      return { latitude: form.latitude, longitude: form.longitude };
    }

    const coords = await getCurrentCoordinates();
    return { latitude: coords.lat, longitude: coords.lng };
  };

  const uploadEvidence = async (complaintId: number, file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("media_type", getMediaType(file));

    await REQUEST(
      "POST",
      `citizens/upload_evidence/${complaintId}/`,
      fd,
      { isMultipart: true }
    );
  };

  async function submitComplaint() {
    if (!photoAnalyzed || !file) {
      alert("Please upload and analyze a photo first");
      return;
    }

    if (!form.department || !form.title) {
      alert("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      const coordinates = await ensureCoordinates();

      const complaint = await REQUEST("POST", "citizens/complaints/", {
        ...form,
        ...coordinates,
      });

      await uploadEvidence(complaint.id, file);

      router.push("/citizen/complaints");
    } catch (error) {
      console.error("Complaint submission failed:", error);
      alert("Failed to submit complaint. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '10vh', position: 'relative', background: '#0a0a1a' }}>
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: '100vh', zIndex: 0, pointerEvents: 'none' }}>
        <LightRays 
          raysOrigin="top-center"
          raysColor="#6600ff"
          raysSpeed={1}
          rayLength={3.0}
          pulsating={false}
          fadeDistance={1.0}
          saturation={1.0}
          mouseInfluence={0.3}
          noiseAmount={0.0}
          distortion={0.0}
          className=""
        />
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 20px', minHeight: '100vh', position: 'relative', zIndex: 10, gap: '40px' }}>
        
        {/* Left Card - Photo Upload */}
        <ElectricBorder color="#4169E1" speed={0.8} chaos={0.02} borderRadius={24} >
          <GlassCard variant="transparent" width="600px" height="650px">
            <h2 style={{ fontSize: '32px', fontWeight: 'bold', color: 'white', margin: '24px 0 16px', lineHeight: '1.2' }}>
              Upload Photo
            </h2>
            <p style={{ color: '#a0a0b8', fontSize: '16px', lineHeight: '1.6', marginBottom: '24px' }}>
              Upload a photo of the issue for AI analysis
            </p>

            <input
              type="file"
              accept="image/*"
              style={{ 
                display: 'block', 
                width: '100%', 
                padding: '12px',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '2px dashed rgba(255, 255, 255, 0.3)',
                borderRadius: '8px',
                color: 'white',
                cursor: 'pointer',
                marginBottom: '16px'
              }}
              onChange={(e) => {
                const selectedFile = e.target.files?.[0];
                if (selectedFile) {
                  setFile(selectedFile);
                  setPhotoAnalyzed(false); // Reset analysis state
                }
              }}
            />

            {file && (
              <div style={{ marginBottom: '16px' }}>
                <Badge variant="pill">{file.name}</Badge>
              </div>
            )}

            {file && !photoAnalyzed && (
              <button 
                onClick={uploadAndAnalyze}
                disabled={analyzingPhoto}
                style={{ 
                  width: '100%', 
                  padding: '16px',
                  background: 'white',
                  color: '#1a1a2e',
                  fontSize: '16px',
                  fontWeight: '600',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: analyzingPhoto ? 'not-allowed' : 'pointer',
                  opacity: analyzingPhoto ? 0.7 : 1,
                  marginBottom: '16px'
                }}
              >
                {analyzingPhoto ? "Analyzing..." : "Upload & Analyze"}
              </button>
            )}

            {photoAnalyzed && aiSuggestions && (
              <div>
                <InfoBox variant="primary">
                  <p style={{ color: '#6ed397', fontWeight: '600', marginBottom: '8px' }}>
                    Photo analyzed successfully!
                  </p>
                </InfoBox>

                <InfoBox variant="secondary">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <Brain style={{ width: '16px', height: '16px', color: '#6b7bff' }} />
                    <span style={{ color: 'white', fontWeight: '600', fontSize: '14px' }}>AI Analysis</span>
                  </div>
                  
                  {aiSuggestions.confidence !== undefined && (
                    <p style={{ color: '#d0d8ff', fontSize: '14px', marginBottom: '8px' }}>
                      <span style={{ fontWeight: '500' }}>Confidence:</span> {(aiSuggestions.confidence * 100).toFixed(0)}%
                    </p>
                  )}
                  
                  {aiSuggestions.department_name && (
                    <p style={{ color: '#d0d8ff', fontSize: '14px', marginBottom: '8px' }}>
                      <span style={{ fontWeight: '500' }}>Department:</span>{' '}
                      <DecryptedText 
                        text={aiSuggestions.department_name} 
                        animateOn="hover" 
                        speed={80}
                        maxIterations={100}
                        sequential={true}
                        revealDirection="start"
                      />
                    </p>
                  )}
                </InfoBox>
              </div>
            )}
          </GlassCard>
        </ElectricBorder>

        {/* Right Card - Form Details */}
        <ElectricBorder color="#4169E1" speed={0.8} chaos={0.02} borderRadius={24}>
          <GlassCard variant="transparent" width="600px" height="600px">
            <div style={{ maxHeight: '80vh', overflowY: 'auto', paddingRight: '8px' }}>
              <h2 style={{ fontSize: '32px', fontWeight: 'bold', color: 'white', margin: '24px 0 16px', lineHeight: '1.2' }}>
                Review Details
              </h2>

              <div style={{ marginBottom: '24px' }}>
                <AnimatedInput
                  label="Complaint Title"
                  value={form.title}
                  onChange={(v) => updateForm({ title: v })}
                  placeholder="Enter complaint title"
                  draftComplaintId={photoAnalyzed ? 1 : null}
                  fieldKey="title"
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <AnimatedInput
                  label="Description"
                  type="textarea"
                  value={form.description}
                  onChange={(v) => updateForm({ description: v })}
                  placeholder="Explain the issue in detail..."
                  draftComplaintId={photoAnalyzed ? 1 : null}
                  fieldKey="description"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                <AnimatedInput
                  label="Address Line 1"
                  placeholder="House/Building No."
                  value={form.address_line_1}
                  onChange={(v) => updateForm({ address_line_1: v })}
                  draftComplaintId={photoAnalyzed ? 1 : null}
                  fieldKey="address_line_1"
                />
              </div>
              <div>
                <AnimatedInput
                  label="Address Line 2"
                  placeholder="Street/Area"
                  value={form.address_line_2}
                  onChange={(v) => updateForm({ address_line_2: v })}
                  draftComplaintId={photoAnalyzed ? 1 : null}
                  fieldKey="address_line_2"
                />
              </div>
              <div style={{ marginBottom: '24px' }}></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                <AnimatedInput
                  label="City"
                  value={form.city}
                  onChange={(v) => updateForm({ city: v })}
                  placeholder="City"
                  draftComplaintId={photoAnalyzed ? 1 : null}
                  fieldKey="city"
                />

                <AnimatedInput
                  label="Pincode"
                  value={form.pincode}
                  onChange={(v) => updateForm({ pincode: v })}
                  placeholder="Pincode"
                  draftComplaintId={photoAnalyzed ? 1 : null}
                  fieldKey="pincode"
                />

                <div>
                  <Label style={{ color: 'white', marginBottom: '8px', display: 'block' }}>Department</Label>
                  <Select
                    value={form.department ? String(form.department) : ""}
                    onValueChange={(value) => updateForm({ department: Number(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((d) => (
                        <SelectItem key={d.id} value={String(d.id)}>
                          {d.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {photoAnalyzed ? (
                <button
                  onClick={submitComplaint}
                  disabled={loading || !form.department || !form.title}
                  style={{ 
                    width: '100%', 
                    padding: '16px',
                    background: 'white',
                    color: '#1a1a2e',
                    fontSize: '16px',
                    fontWeight: '600',
                    border: 'none',
                    borderRadius: '12px',
                    cursor: (loading || !form.department || !form.title) ? 'not-allowed' : 'pointer',
                    opacity: (loading || !form.department || !form.title) ? 0.5 : 1
                  }}
                >
                  {loading ? "Submitting..." : "Submit Complaint"}
                </button>
              ) : (
                <InfoBox variant="primary">
                  <p style={{ color: '#9db4ff', fontSize: '14px' }}>
                    ℹ️ Please upload and analyze a photo first
                  </p>
                </InfoBox>
              )}
            </div>
          </GlassCard>
        </ElectricBorder>

      </div>
    </div>
  );
}