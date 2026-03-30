"use client"
import { useEffect, useState } from "react"
import { useParams } from 'next/navigation'
import { REQUEST } from "@/services/api";
import { Complaint } from "@/types";
import { toast } from "sonner";
import { API_URL } from "@/services/api";
import { Timeline as AceternityTimeline } from "@/components/ui/timeline";
import { format } from "date-fns";
import { formatDistanceToNow } from "date-fns";
import { Card, CardHeader, CardContent, CardTitle, } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type GroupStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";

function GroupStatusBadge({ status }: { status: GroupStatus }) {
  const map: Record<GroupStatus, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
    OPEN: { variant: "destructive", label: "Open" },
    IN_PROGRESS: { variant: "secondary", label: "In Progress" },
    RESOLVED: { variant: "default", label: "Resolved" },
    CLOSED: { variant: "outline", label: "Closed" },
  };
  const cfg = map[status] ?? { variant: "outline", label: status };
  return <Badge variant={cfg.variant} className="font-normal">{cfg.label}</Badge>;
}

function resolveMediaUrl(path?: string | null) {
  if (!path) return null;
  return path.startsWith("http") ? path : `${API_URL}${path.replace(/^\/+/, "")}`;
}

function GroupTimeline({ timeline = [] }: { timeline: any[] }) {
  const data = timeline.map((item) => ({
    title: format(new Date(item.created_at), "dd MMM yyyy"),
    content: (
      <div className="space-y-3">
        {item.title && <h4 className="text-sm font-semibold">{item.title}</h4>}
        <p className="text-sm text-neutral-700 dark:text-neutral-300">{item.text}</p>
        {item.image && <img src={resolveMediaUrl(item.image)!} alt="Timeline" className="w-full max-w-md rounded-xl border shadow-sm" />}
        <p className="text-xs text-neutral-500">Posted by {item.admin}</p>
      </div>
    ),
  }));
  if (data.length === 0) return null;
  return <div className="relative w-full overflow-hidden"><AceternityTimeline data={data} /></div>;
}

function EvidenceGrid({ evidences = [] }: { evidences: any[] }) {
  if (evidences.length === 0) return null;
  return (
    <div>
      {evidences.map((ev) => {
        const src = resolveMediaUrl(ev.file);
        if (!src) return null;
        return (
          <div key={ev.id} className="rounded-xl overflow-hidden border bg-muted/40">
            {ev.media_type === "image" && <img src={src} className="w-full h-full object-cover" />}
            {ev.media_type === "video" && <video src={src} controls className="w-full" />}
            {ev.media_type === "audio" && <audio src={src} controls className="w-full p-3" />}
          </div>
        );
      })}
    </div>
  );
}

export default function ComplaintDetailPage() {
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<Complaint | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<GroupStatus | "">("");
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [verificationRemaining, setVerificationRemaining] = useState<number | null>(null);

  const CITIZEN_STATUS_OPTIONS: { value: GroupStatus; label: string }[] = [
    { value: "RESOLVED", label: "Resolved" },
    { value: "CLOSED", label: "Closed" },
  ];

  useEffect(() => {
    REQUEST("GET", `admins/complaint/${params.id}/`)
      .then((res) => setData(res))
      .catch((err) => { toast.error(err?.message || "Failed to load complaint"); })
      .finally(() => setLoading(false));
  }, [params.id]);

  async function updateGroupStatus() {
    if (!data?.group || !newStatus) return;
    try {
      setUpdatingStatus(true);
      const response = await REQUEST("POST", `citizens/complaint-groups/status/${data.group.id}/`, { status: newStatus });
      
      toast.success(response.message || "Group status updated");
      
      if (response.verification_remaining !== undefined) {
        setVerificationRemaining(response.verification_remaining);
      }

      setData((prev) => {
        if (!prev || !prev.group) return prev;
        return {
          ...prev,
          group: {
            ...prev.group,
            grouped_status: response.status || newStatus,
          },
        };
      });

      setStatusDialogOpen(false);
      setNewStatus("");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error?.response?.data?.detail || error?.message || "Failed to update status");
    } finally {
      setUpdatingStatus(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto p-6 space-y-4">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      <Card>
        <CardHeader className="space-y-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">{data.title}</CardTitle>
            <Badge>{data.status}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {data.city} • {formatDistanceToNow(new Date(data.timestamp), { addSuffix: true })}
          </p>
        </CardHeader>
        <CardContent className="space-y-4 w-full h-full">
          <p className="text-sm leading-relaxed">{data.description}</p>
          <EvidenceGrid evidences={data.evidences} />
        </CardContent>
      </Card>

      {data.group && (
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <CardTitle className="text-lg">Group: {data.group.title}</CardTitle>
                <p className="text-sm text-muted-foreground">{data.group.department}</p>
              </div>
              <div className="flex items-center gap-2">
                <GroupStatusBadge status={data.group.grouped_status as GroupStatus} />
                <Button size="sm" variant="outline" onClick={() => { setNewStatus(data.group.grouped_status as GroupStatus); setStatusDialogOpen(true); }}>
                  Update Status
                </Button>
              </div>
            </div>
            {verificationRemaining !== null && verificationRemaining > 0 && (
              <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                  {verificationRemaining} more verification{verificationRemaining > 1 ? 's' : ''} needed to close this complaint
                </p>
              </div>
            )}
          </CardHeader>
          <CardContent>
            <GroupTimeline timeline={data.group.timeline} />
          </CardContent>
        </Card>
      )}

      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Group Status</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">New Status</label>
              <Select value={newStatus} onValueChange={(val) => setNewStatus(val as GroupStatus)}>
                <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                <SelectContent>
                  {CITIZEN_STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Citizens can only mark complaints as Resolved or Closed</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusDialogOpen(false)} disabled={updatingStatus}>Cancel</Button>
            <Button onClick={updateGroupStatus} disabled={!newStatus || updatingStatus}>
              {updatingStatus ? "Updating..." : "Update Status"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}