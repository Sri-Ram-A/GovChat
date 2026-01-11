"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge as ShadcnBadge } from "@/components/ui/badge";
import { Camera, FileText, MapPin, Brain } from "lucide-react";
import FormField from "@/components/reusables/FormField";
import { REQUEST } from "@/services/api";
import type { MediaType, ComplaintCreatePayload, Department } from "@/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import LightRays from '@/components/LightRays';
import ElectricBorder from '@/components/ElectricBorder';
import GlassCard from '@/components/GlassCard';
import Badge from '@/components/Badge';
import InfoBox from '@/components/InfoBox';
import DecryptedText from '@/components/DecryptedText';
import AnimatedInput from "@/components/reusables/decrpyText";


export default function PostComplaintPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploadingEvidence, setUploadingEvidence] = useState(false);
  const [draftComplaintId, setDraftComplaintId] = useState<number | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<{
    confidence?: number;
    jurisdiction_name?: string;
    department_name?: string;
  } | null>(null);
  
  const [form, setForm] = useState<ComplaintCreatePayload>({
    title: "",
    description: "",
    department: 0,
    address_line_1: "",
    address_line_2: "",
    landmark: "",
    city: "",
    pincode: "",
  });

  const [files, setFiles] = useState<Array<{ file: File; media_type: MediaType }>>([]);

  useEffect(() => {
    REQUEST("GET", "admins/departments/")
      .then(setDepartments)
      .catch(console.error);
  }, []);

  async function uploadEvidenceAndAnalyze() {
    if (files.length === 0) {
      alert("Please select a photo first");
      return;
    }

    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setUploadingEvidence(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const latitude = position.coords.latitude;
          const longitude = position.coords.longitude;

          const firstImage = files[0];
          const fd = new FormData();
          fd.append("file", firstImage.file);
          fd.append("media_type", firstImage.media_type);
          fd.append("latitude", String(latitude));
          fd.append("longitude", String(longitude));

          const response = await REQUEST("POST", "citizens/evidence/upload/", fd, {
            isMultipart: true,
          });

          if (response && response.suggestions) {
            const suggestions = response.suggestions;

            setAiSuggestions({
              confidence: suggestions.confidence,
              jurisdiction_name: suggestions.jurisdiction_name,
              department_name: suggestions.department_name,
            });

            setForm({
              title: suggestions.title || "",
              description: suggestions.description || "",
              department: suggestions.department_id || 0,
              address_line_1: "", 
              address_line_2: suggestions.address_line_2 || "", 
              city: suggestions.city || "",
              pincode: suggestions.pincode || "",
            });

            setDraftComplaintId(response.draft_complaint_id);
            alert("Photo analyzed! Please review the auto-filled details.");
          }
        } catch (error: any) {
          console.error("Evidence upload failed:", error);
          alert("Failed to upload and analyze photo. Please try again.");
        } finally {
          setUploadingEvidence(false);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        setUploadingEvidence(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }

  async function submitComplaint() {
    if (!draftComplaintId) {
      alert("Please upload a photo first");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        title: form.title,
        description: form.description,
        department: form.department,
        address_line_1: form.address_line_1,
        address_line_2: form.address_line_2,
        city: form.city,
        pincode: form.pincode,
        draft_complaint_id: draftComplaintId,
      };

      await REQUEST("POST", "citizens/complaints/", payload);
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
                if (!e.target.files) return;
                const uploaded = Array.from(e.target.files).map((f) => ({
                  file: f,
                  media_type: "image" as MediaType,
                }));
                setFiles(uploaded);
              }}
            />

            {files.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
                {files.map((f, i) => (
                  <Badge key={i} variant="pill">{f.file.name}</Badge>
                ))}
              </div>
            )}

            {files.length > 0 && !draftComplaintId && (
              <button 
                onClick={uploadEvidenceAndAnalyze}
                disabled={uploadingEvidence}
                style={{ 
                  width: '100%', 
                  padding: '16px',
                  background: 'white',
                  color: '#1a1a2e',
                  fontSize: '16px',
                  fontWeight: '600',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: uploadingEvidence ? 'not-allowed' : 'pointer',
                  opacity: uploadingEvidence ? 0.7 : 1,
                  marginBottom: '16px'
                }}
              >
                {uploadingEvidence ? "Analyzing..." : "Upload & Analyze"}
              </button>
            )}

            {draftComplaintId && aiSuggestions && (
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
                  
                  {aiSuggestions.jurisdiction_name && (
                    <p style={{ color: '#d0d8ff', fontSize: '14px' }}>
                      <span style={{ fontWeight: '500' }}>Jurisdiction:</span>{' '}
                      <DecryptedText 
                        text={aiSuggestions.jurisdiction_name}
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
          onChange={(v) => setForm({ ...form, title: v })}
          placeholder="Enter complaint title"
          draftComplaintId={draftComplaintId}
          fieldKey="title"
        />
      </div>

      <div style={{ marginBottom: '24px' }}>
        <AnimatedInput
          label="Description"
          type="textarea"
          value={form.description}
          onChange={(v) => setForm({ ...form, description: v })}
          placeholder="Explain the issue in detail..."
          draftComplaintId={draftComplaintId}
          fieldKey="description"
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
        <AnimatedInput
          label="Address Line 1"
          placeholder="House/Building No."
          value={form.address_line_1}
          onChange={(v) => setForm({ ...form, address_line_1: v })}
          draftComplaintId={draftComplaintId}
          fieldKey="address_line_1"
        />
      </div>
      <div>
        <AnimatedInput
          label="Address Line 2"
          placeholder="Street/Area"
          value={form.address_line_2}
          onChange={(v) => setForm({ ...form, address_line_2: v })}
          draftComplaintId={draftComplaintId}
          fieldKey="address_line_2"
        />
      </div>
      <div style={{ marginBottom: '24px' }}></div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '24px' }}>
        <AnimatedInput
          label="City"
          value={form.city}
          onChange={(v) => setForm({ ...form, city: v })}
          placeholder="City"
          draftComplaintId={draftComplaintId}
          fieldKey="city"
        />

        <AnimatedInput
          label="Pincode"
          value={form.pincode}
          onChange={(v) => setForm({ ...form, pincode: v })}
          placeholder="Pincode"
          draftComplaintId={draftComplaintId}
          fieldKey="pincode"
        />

        <div>
          <Label style={{ color: 'white', marginBottom: '8px', display: 'block' }}>Department</Label>
          <Select
            value={form.department ? String(form.department) : ""}
            onValueChange={(value) => setForm({ ...form, department: Number(value) })}
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

      {draftComplaintId ? (
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