"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { cn } from "@/lib/utils";
import { Card, CardContent, CardFooter, CardHeader, } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import { toast } from "sonner";
import { FilePlusCorner, MessageCircle, MapPin, Search, CalendarDays } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ThumbsUp, Eye, FileText, ImageIcon, Video, Music, ArrowRight, History } from "lucide-react";

import { REQUEST, API_URL } from "@/services/api";
import { Complaint, Evidence } from "@/types";
import { Timeline as AceternityTimeline } from "@/components/ui/timeline";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/* -------------------------------- Evidence Renderer -------------------------------- */

function EvidenceRenderer({ evidence }: { evidence: Evidence }) {
  const src = evidence.file?.startsWith("http")
    ? evidence.file
    : `${API_URL}/${evidence.file?.replace(/^\/+/, "")}`;

  switch (evidence.media_type) {
    case "image":
      return (
        <div className="w-full h-full rounded-lg overflow-hidden border">
          <img
            src={src}
            alt="Evidence"
            className="w-full h-full object-cover"
          />
        </div>
      );

    case "video":
      return (
        <video
          src={src}
          controls
          className="w-full rounded-lg border"
        />
      );

    case "audio":
      return (
        <audio
          src={src}
          controls
          className="w-full"
        />
      );

    default:
      return (
        <Link
          href={src}
          target="_blank"
          className="flex items-center gap-2 text-sm text-primary hover:underline"
        >
          <FileText className="h-4 w-4" />
          View document
        </Link>
      );
  }
}

/* -------------------------------- Timeline Dialog -------------------------------- */

function TimelineModal({ complaintId, open, onOpenChange }: { complaintId: number | null, open: boolean, onOpenChange: (open: boolean) => void }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && complaintId) {
      setLoading(true);
      REQUEST("GET", `admins/complaint/${complaintId}/`)
        .then((res: any) => setData(res))
        .catch((err) => toast.error("Failed to load timeline"))
        .finally(() => setLoading(false));
    } else {
      setData(null);
    }
  }, [open, complaintId]);

  const timelineData = data?.group?.timeline?.map((item: any) => ({
    title: format(new Date(item.created_at), "dd MMM yyyy"),
    content: (
      <div className="space-y-4">
        {item.title && <h4 className="text-sm font-semibold text-slate-800">{item.title}</h4>}
        <p className="text-sm text-slate-600 leading-relaxed">{item.text}</p>
        
        {item.image && (
          <div className="rounded-2xl overflow-hidden border border-slate-100 bg-slate-50 shadow-sm">
             <img 
               src={item.image.startsWith('http') ? item.image : `${API_URL}/${item.image.replace(/^\//, '')}`} 
               alt="Progress update" 
               className="w-full h-auto object-cover max-h-60"
             />
          </div>
        )}

        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Posted by {item.admin}</p>
      </div>
    ),
  })) || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl rounded-[32px] border-none shadow-2xl p-0 overflow-hidden bg-white">
        <DialogHeader className="p-8 pb-4 bg-slate-50/50 border-b border-slate-100">
          <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight">Resolution Progress</DialogTitle>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Official updates from the department</p>
        </DialogHeader>
        <div className="max-h-[70vh] overflow-y-auto p-8 pt-0">
          {loading ? (
            <div className="py-20 flex flex-col items-center gap-4">
               <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fetching latest updates...</p>
            </div>
          ) : timelineData.length > 0 ? (
            <div className="relative w-full overflow-hidden">
               <AceternityTimeline data={timelineData} />
            </div>
          ) : (
            <div className="py-20 text-center space-y-4">
               <History className="w-12 h-12 text-slate-200 mx-auto" />
               <div className="space-y-1">
                 <p className="text-sm font-bold text-slate-800">No official updates yet</p>
                 <p className="text-xs text-slate-400">Our team is currently reviewing your report. You'll see updates here as we progress.</p>
               </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* -------------------------------- Page -------------------------------- */

export default function AllComplaintsPage() {
  return (
    <Suspense fallback={<div className="p-20 text-center">Loading...</div>}>
      <ComplaintsContent />
    </Suspense>
  );
}

function ComplaintsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedComplaintId, setSelectedComplaintId] = useState<number | null>(null);
  const [timelineOpen, setTimelineOpen] = useState(false);

  const filter = searchParams.get('filter');
  const isMyComplaints = filter === 'my';
  const endpoint = isMyComplaints 
    ? "citizens/complaints/my/" 
    : "citizens/complaints/all/";

  useEffect(() => {
    setLoading(true);
    REQUEST("GET", endpoint)
      .then((res: any) => setComplaints(res || []))
      .catch((err) => {
        console.error(err);
        toast.error(err?.message || "Failed to load complaints");
      })
      .finally(() => setLoading(false));
  }, [endpoint]);

  const getStatusStep = (status: string) => {
    switch (status) {
      case "OPEN": return 1;
      case "IN_PROGRESS": return 2;
      case "RESOLVED":
      case "CLOSED": return 3;
      default: return 1;
    }
  };

  const handleUpvote = async (id: number) => {
    try {
      const res: any = await REQUEST("POST", `citizens/complaints/upvote/${id}/`);
      setComplaints((prev) => 
        prev.map((c) => c.id === id ? { ...c, likes_count: res.likes_count } : c)
      );
      toast.success("Thanks for your support!");
    } catch (err) {
      toast.error("Failed to record upvote");
    }
  };

  return (
    <div key={filter || "all"} className="min-h-screen bg-slate-50/50 pb-20">
      {/* Background Decor */}
      <div className="absolute inset-0 pointer-events-none -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-100/30 blur-3xl rounded-full" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-100/30 blur-3xl rounded-full" />
      </div>

      <div className={cn("mx-auto px-4 pt-12 transition-all duration-700", isMyComplaints ? "max-w-7xl" : "max-w-3xl")}>
        {/* Header Section */}
        <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="text-center md:text-left">
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-2">
              {isMyComplaints ? "My Complaints" : "Community Feed"}
            </h1>
            <p className="text-slate-500 text-lg max-w-xl">
              {isMyComplaints 
                ? "Manage and track the progress of civic issues you've personally reported."
                : "Explore and support civic improvements reported by citizens across the city."}
            </p>
          </div>

        </div>

        <div className={cn(
          "gap-8",
          isMyComplaints ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "space-y-8"
        )}>
          {loading ? (
            Array.from({ length: 2 }).map((_, i) => (
              <Card key={i} className="rounded-3xl border-slate-200/60 shadow-xl shadow-slate-200/20 overflow-hidden bg-white">
                <div className="p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                  </div>
                  <Skeleton className="h-8 w-3/4" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-64 w-full rounded-2xl" />
                </div>
              </Card>
            ))
          ) : complaints.length === 0 ? (
            <Card className="rounded-3xl border-dashed border-2 border-slate-200 bg-white/50 p-20 text-center">
              <div className="flex flex-col items-center gap-4 text-slate-400">
                <FileText className="w-12 h-12 opacity-20" />
                <p className="font-medium">
                  {isMyComplaints 
                    ? "You haven't filed any complaints yet." 
                    : "No complaints found in your area."}
                </p>
                <Button variant="outline" className="rounded-xl" onClick={() => router.push('/citizen/post')}>
                  {isMyComplaints ? "File your first complaint" : "Be the first to report"}
                </Button>
              </div>
            </Card>
          ) : (
            complaints.map((c) => (
              <Card 
                key={c.id} 
                className={cn(
                  "overflow-hidden bg-white group transition-all duration-500 cursor-pointer border-none relative",
                  isMyComplaints 
                    ? "rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_50px_rgba(59,130,246,0.1)] hover:-translate-y-1.5 flex flex-col h-full" 
                    : "rounded-[32px] border-slate-200/60 shadow-2xl shadow-slate-200/40 hover:shadow-blue-500/5"
                )}
                onClick={() => {
                  if (isMyComplaints) {
                    setSelectedComplaintId(c.id);
                    setTimelineOpen(true);
                  }
                }}
              >
                {/* Sidebar Accent for My Complaints */}
                {isMyComplaints && (
                  <div className={cn(
                    "absolute left-0 top-0 bottom-0 w-1.5 z-20 transition-all duration-500",
                    c.status === "RESOLVED" ? "bg-emerald-500 group-hover:w-2" : "bg-blue-500 group-hover:w-2"
                  )} />
                )}

                <CardHeader className={cn("p-5 pb-0 flex flex-row items-start justify-between relative z-10", isMyComplaints ? "pl-8" : "p-6")}>
                  {isMyComplaints && (
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md",
                          c.status === "RESOLVED" ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"
                        )}>
                          {c.status}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                         {formatDistanceToNow(new Date(c.timestamp), { addSuffix: true })}
                      </span>
                    </div>
                  )}

                  {!isMyComplaints && (
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12 ring-4 ring-slate-50">
                        <AvatarFallback className="bg-gradient-to-br from-slate-100 to-slate-200 text-slate-600 font-bold">
                          {c.citizen?.[0]?.toUpperCase() ?? "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="space-y-0.5">
                        <h4 className="font-bold text-slate-800 leading-tight">
                          {c.citizen ?? "Anonymous Citizen"}
                        </h4>
                        <p className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                          {formatDistanceToNow(new Date(c.timestamp), { addSuffix: true })}
                          <span className="w-1 h-1 rounded-full bg-slate-200" />
                          {c.city || c.address_line_2 || "Bengaluru"}
                        </p>
                      </div>
                    </div>
                  )}



                  {!isMyComplaints && (
                    <Badge className="bg-orange-50 text-orange-600 border-none px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider">
                      {typeof c.department === 'string' ? c.department : "General"}
                    </Badge>
                  )}
                </CardHeader>

                <CardContent className={cn("p-5 pt-4 flex-1 flex flex-col gap-4 relative z-10", isMyComplaints ? "pl-8" : "p-6 space-y-6")}>
                  <div className="space-y-1.5">
                    <h2 className={cn(
                      "font-bold text-slate-900 leading-tight transition-colors group-hover:text-blue-600",
                      isMyComplaints ? "text-lg line-clamp-1" : "text-2xl font-black"
                    )}>
                      {c.title}
                    </h2>
                    <p className={cn(
                      "text-slate-400 leading-relaxed",
                      isMyComplaints ? "text-[11px] line-clamp-2" : "text-sm text-slate-500"
                    )}>
                      {c.description}
                    </p>
                  </div>

                  {/* Evidence Display */}
                  {c.evidences?.[0] && (
                    <div className={cn(
                      "relative rounded-xl overflow-hidden border border-slate-50 bg-slate-50/50",
                      !isMyComplaints ? "rounded-[32px] aspect-[16/9]" : "h-32 w-full"
                    )}>
                      <EvidenceRenderer evidence={c.evidences[0]} />
                    </div>
                  )}

                  {/* Progress Stepper (Community Feed Only) */}
                  {!isMyComplaints && (
                    <div className="bg-slate-50/80 rounded-[24px] p-6 border border-slate-100/50">
                      <div className="flex items-center justify-between relative px-2">
                        <div className="absolute top-[18px] left-[10%] right-[10%] h-0.5 bg-slate-200 -z-0" />
                        <div 
                          className="absolute top-[18px] left-[10%] h-0.5 bg-blue-500 transition-all duration-1000 -z-0" 
                          style={{ width: `${Math.max(0, (getStatusStep(c.status) - 1) * 40)}%` }}
                        />
                        <div className="flex flex-col items-center gap-2 relative z-10">
                          <div className={cn("w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-500", getStatusStep(c.status) >= 1 ? "bg-slate-900 text-white shadow-lg shadow-slate-900/20" : "bg-white text-slate-400 border-2 border-slate-100")}>1</div>
                          <span className={cn("text-[10px] font-bold uppercase tracking-wider", getStatusStep(c.status) >= 1 ? "text-slate-900" : "text-slate-300")}>Reported</span>
                        </div>
                        <div className="flex flex-col items-center gap-2 relative z-10">
                          <div className={cn("w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-500", getStatusStep(c.status) >= 2 ? "bg-slate-900 text-white shadow-lg shadow-slate-900/20" : "bg-white text-slate-400 border-2 border-slate-100")}>2</div>
                          <span className={cn("text-[10px] font-bold uppercase tracking-wider", getStatusStep(c.status) >= 2 ? "text-slate-900" : "text-slate-300")}>Assigned</span>
                        </div>
                        <div className="flex flex-col items-center gap-2 relative z-10">
                          <div className={cn("w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-500", getStatusStep(c.status) >= 3 ? "bg-slate-900 text-white shadow-lg shadow-slate-900/20" : "bg-white text-slate-400 border-2 border-slate-100")}>3</div>
                          <span className={cn("text-[10px] font-bold uppercase tracking-wider", getStatusStep(c.status) >= 3 ? "text-slate-900" : "text-slate-300")}>Resolved</span>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>

                {isMyComplaints && (
                  <CardFooter className="p-5 pt-0 relative z-10 pl-8">
                    <Button 
                      variant="ghost" 
                      className="w-full rounded-xl text-[10px] font-black uppercase tracking-widest h-10 bg-slate-50 text-slate-400 hover:bg-blue-600 hover:text-white transition-all duration-300"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedComplaintId(c.id);
                        setTimelineOpen(true);
                      }}
                    >
                      Track Progress <ArrowRight className="w-3.5 h-3.5 ml-2" />
                    </Button>
                  </CardFooter>
                )}

                {!isMyComplaints && (
                  <CardFooter className="px-6 py-4 border-t border-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <button 
                        className="flex items-center gap-2 text-slate-400 hover:text-blue-500 transition-colors group/btn" 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          handleUpvote(c.id);
                        }}
                      >
                        <ThumbsUp className="w-4 h-4 group-hover/btn:-translate-y-0.5 transition-transform" />
                        <span className="text-xs font-bold">{c.likes_count ?? 0} Upvotes</span>
                      </button>
                      <button className="flex items-center gap-2 text-slate-400 cursor-default">
                        <MessageCircle className="w-4 h-4" />
                        <span className="text-xs font-bold">Comments</span>
                      </button>
                    </div>
                    <button className="p-2 rounded-xl hover:bg-slate-50 text-slate-400 transition-colors" onClick={(e) => { e.stopPropagation(); toast.info("Location details copied to clipboard!"); }}>
                      <MapPin className="w-4 h-4" />
                    </button>
                  </CardFooter>
                )}
              </Card>
            ))
          )}
        </div>
      </div>

      <TimelineModal 
        complaintId={selectedComplaintId} 
        open={timelineOpen} 
        onOpenChange={setTimelineOpen} 
      />
    </div>
  );
}