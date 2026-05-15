"use client";

import { useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { REQUEST } from "@/services/api";
import type { Complaint, ComplaintGroup } from "@/types";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  MapPin,
  Layers,
  ImageUp,
  ListChecks,
  Map,
  Upload,
  X,
  ChevronRight,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type View = "complaints" | "group" | "upload";

type ComplaintStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------
function statusConfig(s: ComplaintStatus) {
  const map: Record<
    ComplaintStatus,
    { label: string; icon: React.ReactNode; badge: string }
  > = {
    OPEN: {
      label: "Open",
      icon: <AlertCircle className="h-4 w-4" />,
      badge: "destructive",
    },
    IN_PROGRESS: {
      label: "In Progress",
      icon: <Clock className="h-4 w-4" />,
      badge: "secondary",
    },
    RESOLVED: {
      label: "Resolved",
      icon: <CheckCircle2 className="h-4 w-4" />,
      badge: "default",
    },
    CLOSED: {
      label: "Closed",
      icon: <XCircle className="h-4 w-4" />,
      badge: "outline",
    },
  };
  return map[s] ?? { label: s, icon: null, badge: "outline" };
}

function StatusBadge({ status }: { status: ComplaintStatus }) {
  const cfg = statusConfig(status);
  return (
    <Badge variant={cfg.badge as any} className="font-normal gap-1">
      {cfg.icon}
      {cfg.label}
    </Badge>
  );
}

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="rounded-lg bg-muted/50 p-4">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-2xl font-semibold tabular-nums">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sidebar navigation
// ---------------------------------------------------------------------------
function Sidebar({
  view,
  setView,
}: {
  view: View;
  setView: (v: View) => void;
}) {
  const items: { id: View; label: string; icon: React.ReactNode }[] = [
    { id: "complaints", label: "Complaints", icon: <ListChecks className="h-4 w-4" /> },
    { id: "group", label: "My group", icon: <Map className="h-4 w-4" /> },
    { id: "upload", label: "Upload evidence", icon: <ImageUp className="h-4 w-4" /> },
  ];

  return (
    <aside className="w-56 shrink-0 border-r flex flex-col bg-background">
      <div className="px-4 py-5 border-b">
        <h1 className="font-semibold text-sm">GovChat</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Handler Portal</p>
      </div>
      <nav className="flex-1 py-2">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            className={`
              w-full flex items-center gap-2.5 px-4 py-2 text-sm transition-colors
              border-l-2 text-left
              ${
                view === item.id
                  ? "border-l-primary bg-muted text-foreground font-medium"
                  : "border-l-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              }
            `}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </nav>
    </aside>
  );
}

// ---------------------------------------------------------------------------
// Complaints view
// ---------------------------------------------------------------------------
type FilterStatus = "ALL" | ComplaintStatus;

function ComplaintsView() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterStatus>("ALL");
  const [selected, setSelected] = useState<Complaint | null>(null);

  useEffect(() => {
    REQUEST("GET", "handlers/group-complaints/")
      .then((data) => setComplaints(data || []))
      .catch(() => toast.error("Failed to load complaints"))
      .finally(() => setLoading(false));
  }, []);

  const filters: FilterStatus[] = ["ALL", "OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];
  const filtered =
    filter === "ALL" ? complaints : complaints.filter((c) => c.status === filter);

  const counts = {
    total: complaints.length,
    open: complaints.filter((c) => c.status === "OPEN").length,
    inProgress: complaints.filter((c) => c.status === "IN_PROGRESS").length,
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-lg" />)}
        </div>
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Total assigned" value={counts.total} sub="in your group" />
        <StatCard label="Open" value={counts.open} sub="need attention" />
        <StatCard label="In progress" value={counts.inProgress} sub="being handled" />
      </div>

      {/* Filter pills */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium">All complaints</h2>
        <div className="flex gap-1.5">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => { setFilter(f); setSelected(null); }}
              className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                filter === f
                  ? "bg-primary/10 border-primary/40 text-primary font-medium"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {f.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* List + detail panel */}
      <div className={`grid gap-4 ${selected ? "grid-cols-[1fr_260px]" : "grid-cols-1"}`}>
        <div className="space-y-2">
          {filtered.length === 0 ? (
            <div className="text-center py-10 text-sm text-muted-foreground border border-dashed rounded-lg">
              No complaints match this filter.
            </div>
          ) : (
            filtered.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelected(selected?.id === c.id ? null : c)}
                className={`
                  w-full text-left flex items-start gap-3 p-3.5 rounded-lg border transition-all
                  ${selected?.id === c.id
                    ? "border-primary/50 bg-primary/5"
                    : "border-border hover:border-border/80 hover:bg-muted/30"
                  }
                `}
              >
                <div
                  className={`
                    mt-0.5 p-1.5 rounded-md shrink-0
                    ${c.status === "OPEN" ? "bg-destructive/10 text-destructive" : ""}
                    ${c.status === "IN_PROGRESS" ? "bg-yellow-500/10 text-yellow-600" : ""}
                    ${c.status === "RESOLVED" ? "bg-green-500/10 text-green-600" : ""}
                    ${c.status === "CLOSED" ? "bg-muted text-muted-foreground" : ""}
                  `}
                >
                  {statusConfig(c.status as ComplaintStatus).icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{c.title}</p>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {c.description?.slice(0, 80)}
                    {(c.description?.length ?? 0) > 80 ? "…" : ""}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <StatusBadge status={c.status as ComplaintStatus} />
                    <span className="text-xs text-muted-foreground font-mono">
                      {format(new Date(c.timestamp), "MMM dd, yyyy")}
                    </span>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
              </button>
            ))
          )}
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="space-y-3">
            <div className="rounded-lg border bg-background p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium leading-snug">{selected.title}</p>
                <button onClick={() => setSelected(null)}>
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
              <hr className="border-border" />
              <dl className="space-y-2 text-xs">
                {[
                  ["Status", <StatusBadge key="s" status={selected.status as ComplaintStatus} />],
                  ["Department", selected.department ?? "—"],
                  ["Address", selected.address_line_2 || selected.address_line_1 || "—"],
                  ["Reported", format(new Date(selected.timestamp), "MMM dd, yyyy")],
                  ["Evidences", `${selected.evidences?.length ?? 0} file(s)`],
                ].map(([label, val]) => (
                  <div key={String(label)} className="flex justify-between gap-2">
                    <dt className="text-muted-foreground shrink-0">{label}</dt>
                    <dd className="text-right font-mono">{val as any}</dd>
                  </div>
                ))}
              </dl>
              {selected.description && (
                <>
                  <hr className="border-border" />
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {selected.description}
                  </p>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// My Group view
// ---------------------------------------------------------------------------
function GroupView() {
  const [group, setGroup] = useState<ComplaintGroup | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    REQUEST("GET", "handlers/assigned-group/")
      .then((data) => {
        if (!data || data.message) setGroup(null);
        else setGroup(data);
      })
      .catch(() => toast.error("Failed to load group"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 rounded-lg" />
        <Skeleton className="h-48 rounded-lg" />
      </div>
    );
  }

  if (!group) {
    return (
      <div className="flex h-48 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
        No group assigned to you yet.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Complaints" value={group.complaints_count ?? 0} sub="in this group" />
        <StatCard label="Radius" value={`${group.radius_meters ?? "—"} m`} sub="coverage area" />
        <StatCard label="Status" value={group.grouped_status.replace("_", " ")} />
      </div>

      {/* Group card */}
      <div className="rounded-lg border bg-background p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-medium text-sm">{group.title}</h3>
            {group.department && (
              <p className="text-xs text-muted-foreground mt-0.5">{group.department}</p>
            )}
          </div>
          <Badge variant="secondary">{group.grouped_status.replace("_", " ")}</Badge>
        </div>

        {/* Map placeholder — replace with your <Map> component */}
        <div className="h-36 rounded-md bg-muted/50 border flex items-center justify-center relative overflow-hidden">
          <svg
            className="absolute inset-0 opacity-20"
            xmlns="http://www.w3.org/2000/svg"
            width="100%"
            height="100%"
          >
            <defs>
              <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
          <div className="text-center z-10">
            <MapPin className="h-5 w-5 mx-auto text-primary mb-1" />
            <p className="text-xs font-mono text-muted-foreground">
              {group.centroid_latitude.toFixed(4)}, {group.centroid_longitude.toFixed(4)}
            </p>
          </div>
        </div>

        {/* Coordinate tiles */}
        <div className="grid grid-cols-3 gap-2">
          {[
            ["Latitude", group.centroid_latitude.toFixed(6)],
            ["Longitude", group.centroid_longitude.toFixed(6)],
            ["Radius", `${group.radius_meters ?? "—"} m`],
          ].map(([label, val]) => (
            <div key={label} className="bg-muted/50 rounded-md p-2">
              <p className="text-[10px] text-muted-foreground">{label}</p>
              <p className="text-xs font-mono mt-0.5">{val}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Timeline */}
      {group.timeline && group.timeline.length > 0 && (
        <div className="rounded-lg border bg-background p-4 space-y-3">
          <h3 className="text-sm font-medium">Timeline</h3>
          <hr className="border-border" />
          <div className="space-y-3">
            {group.timeline.map((t: any) => (
              <div key={t.id} className="flex gap-3 items-start">
                <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                <div>
                  <p className="text-xs font-medium">{t.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    {t.text}
                  </p>
                  <p className="text-[10px] text-muted-foreground font-mono mt-1">
                    {format(new Date(t.created_at), "MMM dd, yyyy")} · {t.admin}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Upload evidence view
// ---------------------------------------------------------------------------
function UploadView() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loadingComplaints, setLoadingComplaints] = useState(true);
  const [selectedComplaintId, setSelectedComplaintId] = useState<number | "">("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    REQUEST("GET", "handlers/group-complaints/")
      .then((data) =>
        setComplaints(
          (data || []).filter(
            (c: Complaint) => !["CLOSED", "RESOLVED"].includes(c.status)
          )
        )
      )
      .catch(() => toast.error("Failed to load complaints"))
      .finally(() => setLoadingComplaints(false));
  }, []);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 20 * 1024 * 1024) {
      toast.error("File exceeds 20 MB limit.");
      return;
    }
    setFile(f);
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
    reader.readAsDataURL(f);
  }

  function clearFile() {
    setFile(null);
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit() {
    if (!selectedComplaintId) {
      toast.error("Please select a complaint.");
      return;
    }
    if (!file) {
      toast.error("Please choose an image to upload.");
      return;
    }

    const selectedComplaint = complaints.find((c) => c.id === selectedComplaintId);
    const complaintRef = selectedComplaint
      ? `[Complaint #${selectedComplaint.id}: ${selectedComplaint.title}]`
      : `[Complaint #${selectedComplaintId}]`;

    const fullText = caption.trim()
      ? `${caption.trim()}\n\n${complaintRef}`
      : complaintRef;

    const formData = new FormData();
    formData.append("group", String(selectedComplaint?.group ?? ""));
    formData.append("title", selectedComplaint?.title ?? `Complaint #${selectedComplaintId}`);
    formData.append("text", fullText);
    formData.append("image", file);

    try {
      setUploading(true);
      await REQUEST("POST", "handlers/timeline/", formData, { isMultipart: true });
      toast.success("Timeline updated successfully.");
      clearFile();
      setCaption("");
      setSelectedComplaintId("");
    } catch (err: any) {
      toast.error(
        err?.response?.data?.detail ||
          err?.message ||
          "Upload failed. Please try again."
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="max-w-lg space-y-4">
      <div className="rounded-lg border bg-background p-5 space-y-4">
        <div>
          <h2 className="text-sm font-medium">Upload field evidence</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Attach photos from the site. Images will be linked to the selected complaint.
          </p>
        </div>

        <hr className="border-border" />

        {/* Complaint selector */}
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">Select complaint</label>
          {loadingComplaints ? (
            <Skeleton className="h-9 w-full" />
          ) : (
            <select
              value={selectedComplaintId}
              onChange={(e) => setSelectedComplaintId(Number(e.target.value) || "")}
              className="w-full border rounded-md px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">— pick a complaint —</option>
              {complaints.map((c) => (
                <option key={c.id} value={c.id}>
                  #{c.id} · {c.title}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Drop zone */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className={`
            border border-dashed rounded-lg cursor-pointer transition-colors
            ${preview
              ? "p-0 overflow-hidden"
              : "p-8 text-center hover:border-primary/50 hover:bg-muted/30"
            }
          `}
        >
          {preview ? (
            <div className="relative">
              <img
                src={preview}
                alt="Evidence preview"
                className="w-full h-48 object-cover"
              />
              <button
                onClick={(e) => { e.stopPropagation(); clearFile(); }}
                className="absolute top-2 right-2 bg-background/80 rounded-full p-1 hover:bg-background border"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <>
              <Upload className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Click to choose image</p>
              <p className="text-xs text-muted-foreground/60 mt-1">JPG, PNG, WEBP — up to 20 MB</p>
            </>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* File name */}
        {file && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 rounded-md px-3 py-2">
            <ImageUp className="h-3.5 w-3.5 text-green-600" />
            <span className="truncate flex-1">{file.name}</span>
            <span className="shrink-0 text-muted-foreground/60">
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </span>
          </div>
        )}

        {/* Caption */}
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">Caption (optional)</label>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Describe what the photo shows…"
            rows={3}
            className="w-full border rounded-md px-3 py-2 text-sm bg-background text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/50"
          />
        </div>

        <Button
          onClick={handleSubmit}
          disabled={uploading || !selectedComplaintId || !file}
          className="w-full"
        >
          {uploading ? "Uploading…" : "Upload evidence"}
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Root page
// ---------------------------------------------------------------------------
export default function HandlerDashboardPage() {
  const [view, setView] = useState<View>("complaints");

  const titles: Record<View, string> = {
    complaints: "Complaints",
    group: "My group",
    upload: "Upload evidence",
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar view={view} setView={setView} />

      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center justify-between px-6 py-3.5 border-b bg-background shrink-0">
          <h1 className="text-sm font-medium">{titles[view]}</h1>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">Handler</span>
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
              H
            </div>
          </div>
        </header>

        {/* Main content */}
        <ScrollArea className="flex-1">
          <main className="px-6 py-6">
            {view === "complaints" && <ComplaintsView />}
            {view === "group" && <GroupView />}
            {view === "upload" && <UploadView />}
          </main>
        </ScrollArea>
      </div>
    </div>
  );
}