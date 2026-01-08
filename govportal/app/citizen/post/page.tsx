"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, MapPin, Building2 } from "lucide-react";

import FormField from "@/components/reusables/FormField";
import FormSection from "@/components/reusables/FormSection";
import { REQUEST } from "@/services/api";
import type { MediaType, ComplaintCreatePayload, Department, } from "@/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export default function PostComplaintPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [complaintId, setComplaintId] = useState<number | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);

  const [form, setForm] = useState<ComplaintCreatePayload>({
    title: "",
    description: "",
    department: 0,
    city: "",
    pincode: "",
  });

  const [files, setFiles] = useState<
    { file: File; media_type: MediaType }[]
  >([]);

  /* ---------------- Fetch Departments ---------------- */
  useEffect(() => {
    REQUEST("GET", "admins/departments/")
      .then(setDepartments)
      .catch(console.error);
  }, []);

  /* ---------------- Submit Complaint ---------------- */
  async function submitComplaint() {
    setLoading(true);
    try {
      const res = await REQUEST("POST", "citizens/complaints/", form);
      setComplaintId(res.id);
    } finally {
      setLoading(false);
    }
  }

  /* ---------------- Upload Evidences ---------------- */
  async function uploadEvidences() {
    if (!complaintId) return;

    for (const item of files) {
      const fd = new FormData();
      fd.append("complaint", String(complaintId));
      fd.append("file", item.file);
      fd.append("media_type", item.media_type);

      await REQUEST("POST", "citizens/evidence/upload/", fd, {
        isMultipart: true,
      });
    }

    router.push("/citizen/complaints");
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 ">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl">
            Register a Complaint
          </CardTitle>
          <CardDescription>
            Provide accurate details to help authorities resolve the issue
            faster.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-10">

          {/* Complaint */}
          <FormSection title="Complaint Information" icon={<FileText />}>
            <FormField
              label="Complaint Title"
              value={form.title}
              onChange={(v) => setForm({ ...form, title: v })}
              required
              className="mb-4"
            />
            <Textarea
              placeholder="Explain the issue in detail..."
              className="min-h-35"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              } />
          </FormSection>


          {/* Location */}
          <FormSection title="Location Details" icon={<MapPin />}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

              {/* City */}
              <FormField
                label="City"
                value={form.city}
                onChange={(v) => setForm({ ...form, city: v })} />

              {/* Pincode */}
              <FormField
                label="Pincode"
                value={form.pincode}
                onChange={(v) => setForm({ ...form, pincode: v })} />

              {/* Department */}
              <div className="space-y-2">
                <Label className="mb-4">Department</Label>
                <Select
                  value={form.department ? String(form.department) : ""}
                  onValueChange={(value) =>
                    setForm({ ...form, department: Number(value) })
                  }
                >
                  <SelectTrigger className="w-full h-11">
                    <SelectValue placeholder="Select department" />
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
          </FormSection>


          {/* Evidence */}
          <FormSection title="Upload Evidence" icon={<Upload />}>
            <input
              type="file"
              multiple
              className="block w-full text-sm"
              onChange={(e) => {
                if (!e.target.files) return;
                const uploaded = Array.from(e.target.files).map((f) => ({
                  file: f,
                  media_type: f.type.startsWith("image")
                    ? "image"
                    : f.type.startsWith("video")
                      ? "video"
                      : f.type.startsWith("audio")
                        ? "audio"
                        : "document",
                }));
                setFiles(uploaded);
              }}
            />

            <div className="flex flex-wrap gap-2 ">
              {files.map((f, i) => (
                <Badge key={i} variant="secondary">
                  {f.media_type} • {f.file.name}
                </Badge>
              ))}
            </div>
          </FormSection>

          {/* Actions */}
          {!complaintId ? (
            <Button
              className="w-full text-base"
              onClick={submitComplaint}
              disabled={loading || !form.department}
            >
              Submit Complaint
            </Button>
          ) : (
            <Button
              className="w-full text-base"
              onClick={uploadEvidences}
            >
              Upload Evidence & Finish
            </Button>
          )}
        </CardContent>
      </Card>
    </div>

  );
}
