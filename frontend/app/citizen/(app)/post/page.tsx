"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { 
  Camera, 
  Sparkles, 
  MapPin, 
  UploadCloud, 
  Trash2, 
  Send, 
  Loader2,
  Building2,
  Info
} from "lucide-react";

import { REQUEST } from "@/services/api";
import { Department, ComplaintCreatePayload } from "@/types";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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

export default function CitizenPostPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [form, setForm] = useState<ComplaintCreatePayload>(INITIAL_FORM_STATE);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const res = await REQUEST("GET", "admins/departments/");
      setDepartments(res || []);
    } catch (err) {
      console.error(err);
    }
  };

  const updateForm = (updates: Partial<ComplaintCreatePayload>) => {
    setForm(prev => ({ ...prev, ...updates }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);

    if (selectedFile) {
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleRefineLocation = async () => {
    setLoading(true);
    try {
      const pos: any = await new Promise((res, rej) => 
        navigator.geolocation.getCurrentPosition(res, rej)
      );
      const { latitude: lat, longitude: lng } = pos.coords;
      
      const location = await REQUEST("POST", "citizens/ai/resolve_location/", {
        latitude: lat,
        longitude: lng,
      });

      updateForm({
        latitude: lat,
        longitude: lng,
        city: location.city || form.city,
        pincode: location.pincode || form.pincode,
        address_line_1: location.address_line_1 || form.address_line_1,
      });
      toast.success("Location synced from GPS");
    } catch (err) {
      toast.error("Geolocation access denied");
    } finally {
      setLoading(false);
    }
  };

  const handleAIAnalyze = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const ai = await REQUEST("POST", "citizens/ai/caption_image/", fd, { isMultipart: true });
      
      updateForm({
        description: ai.caption,
        department: ai.suggested_department.id,
      });
      toast.success("AI Analysis complete");
    } catch (err) {
      toast.error("AI Analysis failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return toast.warning("Please upload evidence");
    
    setLoading(true);
    try {
      const complaint = await REQUEST("POST", "citizens/complaints/", form);
      const fd = new FormData();
      fd.append("file", file);
      fd.append("media_type", file.type.split('/')[0]);
      
      await REQUEST("POST", `citizens/upload_evidence/${complaint.id}/`, fd, { isMultipart: true });
      
      toast.success("Report filed successfully");
      router.push("/citizen/complaints");
    } catch (err) {
      toast.error("Submission failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-black py-10 px-4">
      <div className="max-w-xl mx-auto space-y-6">
        
        <div className="flex items-center gap-3 px-2">
          <div className="h-10 w-10 bg-primary rounded flex items-center justify-center shadow-lg shadow-primary/20">
            <Camera className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">File a Report</h1>
            <p className="text-xs text-muted-foreground uppercase font-semibold tracking-widest">Incident Reporting System</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="border-border/50 shadow-none bg-card">
            <CardContent className="p-6 space-y-6">
              
              {/* 1. Title */}
              <div className="space-y-2">
                <Label htmlFor="title" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Report Title</Label>
                <Input 
                  id="title"
                  placeholder="E.g., Large Pothole on Main St"
                  value={form.title}
                  onChange={e => updateForm({ title: e.target.value })}
                  className="rounded h-11 border-border/60 focus-visible:ring-primary"
                  required
                />
              </div>

              {/* 2. Image / Preview */}
              <div className="space-y-3">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Visual Evidence</Label>
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*,video/*"
                  className="hidden" 
                />
                
                {!previewUrl ? (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-border/60 roundedl p-10 flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-muted/50 transition-colors"
                  >
                    <div className="h-12 w-12 roundedll bg-muted flex items-center justify-center">
                      <UploadCloud className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold">Click to upload media</p>
                      <p className="text-xs text-muted-foreground">Images or Videos up to 10MB</p>
                    </div>
                  </div>
                ) : (
                  <div className="relative group roundedl overflow-hidden border border-border">
                    <img src={previewUrl} className="w-full aspect-video object-cover" alt="Preview" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity gap-3">
                      <Button type="button" variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>Change</Button>
                      <Button type="button" variant="destructive" size="sm" onClick={() => { setFile(null); setPreviewUrl(null); }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {previewUrl && file?.type.startsWith("image") && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleAIAnalyze}
                    disabled={loading}
                    className="w-full h-11 rounded border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 transition-all border-dashed"
                  >
                    {loading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                    Auto-Fill with AI Magic
                  </Button>
                )}
              </div>

              {/* 3. Description */}
              <div className="space-y-2">
                <Label htmlFor="desc" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Issue Description</Label>
                <Textarea 
                  id="desc"
                  rows={4}
                  placeholder="Provide details about the issue..."
                  value={form.description}
                  onChange={e => updateForm({ description: e.target.value })}
                  className="rounded border-border/60 focus-visible:ring-primary"
                  required
                />
              </div>

              {/* 4. Department */}
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Assign Department</Label>
                <Select
                  value={form.department ? form.department.toString() : ""}
                  onValueChange={v => updateForm({ department: Number(v) })}
                >
                  <SelectTrigger className="h-11 rounded border-border/60">
                    <SelectValue placeholder="Select Department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map(dep => (
                      <SelectItem key={dep.id} value={dep.id.toString()}>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 opacity-50" />
                          {dep.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 5. Address */}
              <div className="space-y-4 pt-4 border-t border-border/40">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Location Details</Label>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleRefineLocation}
                    className="h-7 text-primary font-bold text-[10px] hover:bg-primary/5 px-2"
                  >
                    <MapPin className="h-3 w-3 mr-1" /> AUTO-DETECT
                  </Button>
                </div>
                
                <div className="grid gap-4">
                  <Input 
                    placeholder="Street Address / Area" 
                    value={form.address_line_1}
                    onChange={e => updateForm({ address_line_1: e.target.value })}
                    className="h-11 rounded border-border/60"
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <Input 
                      placeholder="City" 
                      value={form.city}
                      onChange={e => updateForm({ city: e.target.value })}
                      className="h-11 rounded border-border/60"
                    />
                    <Input 
                      placeholder="Pincode" 
                      value={form.pincode}
                      onChange={e => updateForm({ pincode: e.target.value })}
                      className="h-11 rounded border-border/60"
                    />
                  </div>
                </div>
              </div>

            </CardContent>
          </Card>

          <Button 
            type="submit" 
            disabled={loading} 
            className="w-full h-14 roundedl text-md font-bold shadow-xl shadow-primary/20 transition-all hover:scale-[1.01] active:scale-[0.99]"
          >
            {loading ? (
              <Loader2 className="animate-spin h-5 w-5" />
            ) : (
              <span className="flex items-center gap-2">
                Submit Report <Send className="h-4 w-4" />
              </span>
            )}
          </Button>
          
          <p className="text-center text-[10px] text-muted-foreground uppercase font-bold tracking-widest flex items-center justify-center gap-1">
            <Info className="h-3 w-3" /> All submissions are subject to legal verification
          </p>
        </form>
      </div>
    </div>
  );
}