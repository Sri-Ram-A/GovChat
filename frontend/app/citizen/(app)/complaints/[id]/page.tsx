"use client"
import { useEffect, useState } from "react"
import { useParams, useRouter } from 'next/navigation'
import { REQUEST } from "@/services/api";
import { Complaint } from "@/types";
import { toast } from "sonner";
import { API_URL } from "@/services/api";
import { Timeline as AceternityTimeline } from "@/components/ui/timeline";
import { format } from "date-fns";
import { formatDistanceToNow } from "date-fns";
import { Card, CardHeader, CardContent, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { MessageCircle, ThumbsUp, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
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

function CommentSection({ complaintId, comments = [] }: { complaintId: number, comments: any[] }) {
  const [commentText, setCommentText] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [localComments, setLocalComments] = useState(comments);

  const handlePostComment = async () => {
    if (!commentText.trim()) return;
    try {
      setIsPosting(true);
      const newComment = {
        id: Date.now(),
        user: "You",
        text: commentText,
        created_at: new Date().toISOString()
      };
      setLocalComments([...localComments, newComment]);
      setCommentText("");
      toast.success("Comment posted!");
    } catch (err) {
      toast.error("Failed to post comment");
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <Card className="rounded-[32px] overflow-hidden border-slate-200/60 shadow-xl bg-white">
      <CardHeader>
        <CardTitle className="text-lg font-bold text-slate-800">Discussion</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          {localComments.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">No comments yet. Start the conversation!</p>
          ) : (
            localComments.map((c) => (
              <div key={c.id} className="flex gap-3">
                <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500 shrink-0">
                  {c.user?.[0]?.toUpperCase() || "U"}
                </div>
                <div className="flex-1 bg-slate-50 rounded-2xl p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-700">{c.user}</span>
                    <span className="text-[10px] text-slate-400">{formatDistanceToNow(new Date(c.created_at))} ago</span>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">{c.text}</p>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex gap-2 pt-4 border-t border-slate-50">
          <textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Add a comment..."
            className="flex-1 min-h-[44px] max-h-[120px] rounded-2xl border border-slate-200 bg-white p-3 text-sm focus:ring-2 focus:ring-blue-500/20 transition-all outline-none resize-none"
          />
          <Button 
            onClick={handlePostComment} 
            disabled={isPosting || !commentText.trim()}
            className="rounded-xl px-6 bg-slate-900 hover:bg-slate-800 h-[44px]"
          >
            Post
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function resolveMediaUrl(path?: string | null) {
  if (!path) return null;
  return path.startsWith("http") ? path : `${API_URL}/${path.replace(/^\/+/, "")}`;
}

function GroupTimeline({ timeline = [] }: { timeline: any[] }) {
  const data = timeline.map((item) => ({
    title: format(new Date(item.created_at), "dd MMM yyyy"),
    content: (
      <div className="space-y-3">
        {item.title && <h4 className="text-sm font-semibold text-slate-800">{item.title}</h4>}
        <p className="text-sm text-slate-600 leading-relaxed">{item.text}</p>
        {item.image && <img src={resolveMediaUrl(item.image)!} alt="Timeline" className="w-full max-w-md rounded-2xl border border-slate-100 shadow-sm" />}
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Posted by {item.admin}</p>
      </div>
    ),
  }));
  if (data.length === 0) return null;
  return <div className="relative w-full overflow-hidden"><AceternityTimeline data={data} /></div>;
}

function EvidenceGrid({ evidences = [] }: { evidences: any[] }) {
  if (evidences.length === 0) return null;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {evidences.map((ev) => {
        const src = resolveMediaUrl(ev.file);
        if (!src) return null;
        return (
          <div key={ev.id} className="rounded-2xl overflow-hidden border border-slate-100 bg-slate-50 aspect-video shadow-sm">
            {ev.media_type === "image" && <img src={src} className="w-full h-full object-cover" />}
            {ev.media_type === "video" && <video src={src} controls className="w-full h-full object-cover" />}
            {ev.media_type === "audio" && <audio src={src} controls className="w-full p-4" />}
          </div>
        );
      })}
    </div>
  );
}

export default function ComplaintDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
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
      .then((res: any) => setData(res))
      .catch((err) => { toast.error(err?.message || "Failed to load complaint"); })
      .finally(() => setLoading(false));
  }, [params.id]);

  async function updateGroupStatus() {
    if (!data?.group || !newStatus) return;
    try {
      setUpdatingStatus(true);
      const response: any = await REQUEST("POST", `citizens/complaint-groups/status/${data.group.id}/`, { status: newStatus });
      
      toast.success(response.message || "Group status updated");
      
      if (response.verification_remaining !== undefined) {
        setVerificationRemaining(response.verification_remaining);
      }

      setData((prev: any) => {
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
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
        <Skeleton className="h-12 w-1/2 rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-[32px]" />
        <Skeleton className="h-64 w-full rounded-[32px]" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-8 bg-slate-50/30 min-h-screen">
      {/* Detail Header */}
      <Card className="rounded-[32px] overflow-hidden border-slate-200/60 shadow-2xl bg-white">
        <CardHeader className="p-8 pb-4 space-y-4">
          <div className="flex items-center justify-between">
            <Badge className="bg-blue-50 text-blue-600 border-none px-4 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">
              {data.status}
            </Badge>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              ID: #{data.id}
            </span>
          </div>
          <CardTitle className="text-3xl font-black text-slate-900 tracking-tight leading-tight">
            {data.title}
          </CardTitle>
          <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            <span>{data.city}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-slate-200" />
            <span>{formatDistanceToNow(new Date(data.timestamp), { addSuffix: true })}</span>
          </div>
        </CardHeader>
        <CardContent className="p-8 pt-0 space-y-8">
          <p className="text-lg text-slate-600 leading-relaxed italic border-l-4 border-slate-100 pl-6">
            "{data.description}"
          </p>
          <EvidenceGrid evidences={data.evidences || []} />
        </CardContent>
        <CardFooter className="px-8 py-6 border-t border-slate-50 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-slate-400">
              <ThumbsUp className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-widest">{data.likes_count || 0} Upvotes</span>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <MessageCircle className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-widest">Discussion</span>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="rounded-xl text-slate-400">
            <MapPin className="w-4 h-4" />
          </Button>
        </CardFooter>
      </Card>

      {/* Group & Timeline */}
      {data.group && (
        <Card className="rounded-[32px] overflow-hidden border-slate-200/60 shadow-xl bg-white">
          <CardHeader className="p-8 pb-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <CardTitle className="text-xl font-bold text-slate-800">Governance Update</CardTitle>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Department: {data.group.department}</p>
              </div>
              <div className="flex items-center gap-3">
                <GroupStatusBadge status={data.group.grouped_status as GroupStatus} />
                <Button 
                  size="sm" 
                  className="rounded-xl font-bold h-9 px-6 bg-slate-900 hover:bg-slate-800 shadow-lg shadow-slate-900/20"
                  onClick={() => { setNewStatus(data.group.grouped_status as GroupStatus); setStatusDialogOpen(true); }}
                >
                  Verify
                </Button>
              </div>
            </div>
            {verificationRemaining !== null && verificationRemaining > 0 && (
              <div className="mt-6 p-4 bg-blue-50/50 border border-blue-100 rounded-2xl flex items-center justify-center gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">
                  {verificationRemaining} more verification{verificationRemaining > 1 ? 's' : ''} needed to close
                </p>
              </div>
            )}
          </CardHeader>
          <CardContent className="p-8 pt-0">
            <GroupTimeline timeline={data.group.timeline} />
          </CardContent>
        </Card>
      )}

      {/* Comment Section */}
      <CommentSection complaintId={data.id} comments={(data as any).comments || []} />

      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent className="rounded-[32px] max-w-md border-none shadow-2xl">
          <DialogHeader className="pt-4">
            <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight">Verify Status</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-6">
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">New Community Status</label>
              <Select value={newStatus} onValueChange={(val) => setNewStatus(val as GroupStatus)}>
                <SelectTrigger className="h-14 rounded-2xl border-slate-200 bg-slate-50 focus:ring-blue-500/20"><SelectValue placeholder="Select status" /></SelectTrigger>
                <SelectContent className="rounded-2xl border-slate-100 shadow-xl">
                  {CITIZEN_STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value} className="rounded-xl py-3 font-medium">{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[10px] text-slate-400 font-medium leading-relaxed italic">
                Your verification helps your neighbors stay informed about the real progress being made.
              </p>
            </div>
          </div>
          <DialogFooter className="gap-3 pb-4">
            <Button variant="outline" className="rounded-2xl flex-1 h-12 font-bold text-slate-500 border-slate-200" onClick={() => setStatusDialogOpen(false)} disabled={updatingStatus}>Cancel</Button>
            <Button className="rounded-2xl flex-1 h-12 bg-slate-900 hover:bg-slate-800 font-bold shadow-lg shadow-slate-900/20" onClick={updateGroupStatus} disabled={!newStatus || updatingStatus}>
              {updatingStatus ? "Verifying..." : "Submit Verification"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}