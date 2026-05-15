"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import {
  ThumbsUp,
  Eye,
  FileText,
  ImageIcon,
  Video,
  Music,
  MapPin,
  Clock,
  Building2,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ChevronRight,
  Shield,
} from "lucide-react";
import { Badge } from "@/components/ui/badge"
import { CardFooter, CardHeader } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { REQUEST, API_URL } from "@/services/api";
import { Complaint, Evidence } from "@/types";

/* ─── Status Design Schema ─────────────────────────────────────────────────── */
const STATUS_CONFIG: Record<
  string,
  { label: string; icon: React.ComponentType<{ className?: string }>; className: string }
> = {
  OPEN: {
    label: "Open",
    icon: AlertCircle,
    className: "text-red-600 dark:text-red-400 border-red-200 bg-red-50/50 dark:bg-red-950/20 dark:border-red-900/50",
  },
  IN_PROGRESS: {
    label: "In Progress",
    icon: Loader2,
    className: "text-amber-600 dark:text-amber-400 border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-900/50",
  },
  RESOLVED: {
    label: "Resolved",
    icon: CheckCircle2,
    className: "text-emerald-600 dark:text-emerald-400 border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20 dark:border-emerald-900/50",
  },
  CLOSED: {
    label: "Closed",
    icon: CheckCircle2,
    className: "text-neutral-500 dark:text-neutral-400 border-neutral-200 bg-neutral-50/50 dark:bg-neutral-900/40 dark:border-neutral-800",
  },
  DRAFT: {
    label: "Draft",
    icon: FileText,
    className: "text-neutral-400 dark:text-neutral-500 border-dashed border-neutral-200 bg-transparent dark:border-neutral-800",
  },
};

/* ─── Evidence Attachment Layouts ─────────────────────────────────────────── */
function EvidenceRenderer({ evidence }: { evidence: Evidence }) {
  const src = evidence.file?.startsWith("http")
    ? evidence.file
    : `${API_URL}/${evidence.file?.replace(/^\/+/, "")}`;

  switch (evidence.media_type) {
    case "image":
      return (
        <div className="relative rounded-lg overflow-hidden border border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900">
          <img src={src} alt={evidence.caption || "Evidence file"} className="w-full object-cover max-h-60" />
          {evidence.caption && (
            <div className="bg-neutral-50 dark:bg-neutral-900 border-t border-neutral-100 dark:border-neutral-800 px-3 py-1.5">
              <p className="text-xs text-neutral-500 dark:text-neutral-400 italic">{evidence.caption}</p>
            </div>
          )}
        </div>
      );
    case "video":
      return <video src={src} controls className="w-full rounded-lg border border-neutral-100 dark:border-neutral-800 max-h-60" />;
    case "audio":
      return (
        <div className="flex items-center gap-2 p-2.5 rounded-lg border border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900">
          <Music className="h-3.5 w-3.5 text-neutral-400 shrink-0" />
          <audio src={src} controls className="w-full h-7 text-xs" />
        </div>
      );
    default:
      return (
        <Link
          href={src}
          target="_blank"
          className="flex items-center gap-2 p-2.5 rounded-lg border border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-xs text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
        >
          <FileText className="h-3.5 w-3.5 text-neutral-400 shrink-0" />
          <span className="font-medium truncate">View attached supporting documentation</span>
          <ChevronRight className="h-3 w-3 ml-auto text-neutral-400" />
        </Link>
      );
  }
}

function MediaTypeIcon({ type }: { type: string }) {
  const icons: Record<string, React.ComponentType<{ className?: string }>> = {
    image: ImageIcon,
    video: Video,
    audio: Music,
    document: FileText,
  };
  const IconComponent = icons[type] ?? FileText;
  return <IconComponent className="h-3 w-3" />;
}

/* ─── Premium Modernized Complaint Card ───────────────────────────────────── */
function ComplaintCard({
  complaint,
  onView,
  onUpvote,
  upvoting,
}: {
  complaint: Complaint
  onView: (c: Complaint) => void
  onUpvote: (id: number) => void
  upvoting: number | null
}) {
  const statusCfg = STATUS_CONFIG[complaint.status] ?? STATUS_CONFIG.OPEN
  const StatusIcon = statusCfg.icon

  const initials = (complaint.citizen ?? "U")
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  const departmentName =
    typeof complaint.department === "string"
      ? complaint.department
      : complaint.department?.name ?? "Unassigned"

  const locationText =
    complaint.city ||
    complaint.address_line_1 ||
    complaint.address_line_2 ||
    complaint.landmark ||
    ""

  const hasLocation = Boolean(locationText)

  return (
    <Card
      className={cn(
        "group overflow-hidden rounded border bg-card text-card-foreground shadow-sm transition-all duration-200",
        "hover:-translate-y-0.5 m-4 hover:shadow-md hover:border-border/80"
      )}
    >
      <article>
        <CardHeader className="space-y-4 px-5 pt-5 pb-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <Avatar className="h-9 w-9 shrink-0 ring-1 ring-border">
                <AvatarFallback className="bg-muted text-xs font-semibold text-muted-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0">
                <p className="truncate text-sm font-medium leading-none text-foreground">
                  {complaint.citizen ?? "Citizen"}
                </p>
                <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  <span>
                    {formatDistanceToNow(new Date(complaint.timestamp), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
              </div>
            </div>

            <Badge
              variant="secondary"
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium",
                statusCfg.className
              )}
            >
              <StatusIcon className="h-3.5 w-3.5" />
              {statusCfg.label}
            </Badge>
          </div>

          <div className="space-y-2">
            <h3 className="text-base font-semibold leading-snug tracking-tight text-foreground">
              <button
                type="button"
                onClick={() => onView(complaint)}
                className="text-left transition-colors hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-md"
              >
                {complaint.title}
              </button>
            </h3>

            <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">
              {complaint.description}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {complaint.department && (
              <Badge
                variant="outline"
                className="max-w-full gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
              >
                <Building2 className="h-3.5 w-3.5" />
                <span className="truncate">{departmentName}</span>
              </Badge>
            )}

            {hasLocation && (
              <Badge
                variant="outline"
                className="max-w-full gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
              >
                <MapPin className="h-3.5 w-3.5" />
                <span className="truncate">
                  {complaint.city || complaint.address_line_1}
                  {complaint.pincode ? ` • ${complaint.pincode}` : ""}
                </span>
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="px-5 pb-4">
          {complaint.evidences?.length > 0 && (
            <section className="space-y-4">
              <Separator />
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Evidence
                  </p>
                  <span className="text-xs text-muted-foreground">
                    {complaint.evidences.length} item
                    {complaint.evidences.length > 1 ? "s" : ""}
                  </span>
                </div>

                <div className="space-y-4">
                  {complaint.evidences.map((ev) => (
                    <section key={ev.id} className="space-y-2">
                      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                        <MediaTypeIcon type={ev.media_type} />
                        <span>{ev.media_type} verification</span>
                      </div>
                      <EvidenceRenderer evidence={ev} />
                    </section>
                  ))}
                </div>
              </div>
            </section>
          )}
        </CardContent>

        <CardFooter className="flex items-center justify-between gap-3 px-5 pb-5 pt-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onUpvote(complaint.id)}
            disabled={upvoting === complaint.id}
            className={cn(
              "h-9 rounded-full px-4 text-sm font-medium",
              "border-border/70 bg-background hover:bg-muted/50"
            )}
          >
            {upvoting === complaint.id ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <ThumbsUp className="mr-2 h-4 w-4" />
            )}
            <span className="tabular-nums">{complaint.likes_count ?? 0}</span>
            <span className="ml-1 text-muted-foreground">Upvotes</span>
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => onView(complaint)}
            className="h-9 rounded-full px-4 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Eye className="mr-2 h-4 w-4" />
            Details
          </Button>
        </CardFooter>
      </article>
    </Card>
  )
}

/* ─── Skeleton Preloaders ─────────────────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div className="border-b border-neutral-100 dark:border-neutral-900 pb-6 mb-6 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-6 rounded-full" />
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-16" />
        </div>
        <Skeleton className="h-5 w-16 rounded-md" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-full" />
      </div>
      <Skeleton className="h-3 w-1/2" />
      <div className="flex justify-between items-center pt-1">
        <Skeleton className="h-8 w-24 rounded-md" />
        <Skeleton className="h-8 w-16 rounded-md" />
      </div>
    </div>
  );
}

/* ─── Main Complaints Feed Page Container ─────────────────────────────────── */
export default function AllComplaintsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [upvoting, setUpvoting] = useState<number | null>(null);

  const filter = searchParams.get("filter");
  const isMyComplaints = filter === "my";
  const endpoint = isMyComplaints ? "citizens/complaints/my/" : "citizens/complaints/all/";
  const pageTitle = isMyComplaints ? "My Filings" : "Public Feed";

  useEffect(() => {
    setLoading(true);
    REQUEST("GET", endpoint)
      .then((res: any) => setComplaints(res || []))
      .catch((err) => toast.error(err?.message || "Failed to load instances"))
      .finally(() => setLoading(false));
  }, [endpoint]);

  const handleUpvote = async (id: number) => {
    if (upvoting !== null) return;
    setUpvoting(id);
    try {
      const res = await REQUEST<{ liked: boolean; likes_count: number }>(
        "POST",
        `citizens/complaints/${id}/upvote/`
      );
      setComplaints((prev) =>
        prev.map((c) => c.id === id ? { ...c, likes_count: res.likes_count } : c)
      );
      toast.success(res.liked ? "Upvoted" : "Upvote removed");
    } catch (err: any) {
      toast.error(err?.message || "Failed to upvote");
    } finally {
      setUpvoting(null);
    }
  };
  const handleView = (complaint: Complaint) => {
    router.push(`/citizen/complaints/${complaint.id}`);
  };

  const openCount = complaints.filter((c) => c.status === "OPEN").length;
  const resolvedCount = complaints.filter((c) => c.status === "RESOLVED").length;

  return (
    <div className="min-h-screen w-screen bg-background text-neutral-900 dark:text-neutral-50 flex flex-col items-center">
      <div className="w-full max-w-200 px-4 py-8 sm:py-12 ">

        {/* GovChat System Title Header */}
        <div className="border-b border-neutral-100 dark:border-neutral-900 pb-4 space-y-2">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md border border-neutral-200 dark:border-neutral-800 shadow-xs text-neutral-950 dark:text-neutral-50">
              <Shield className="h-3.5 w-3.5" />
            </div>
            <span className="text-xs font-semibold tracking-wider uppercase text-neutral-400 dark:text-neutral-500">GovChat Core</span>
          </div>

          <div className="flex items-baseline justify-between gap-4">
            <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">{pageTitle}</h1>
            {!loading && complaints.length > 0 && (
              <span className="text-xs font-medium text-neutral-400 dark:text-neutral-500 tabular-nums">
                {complaints.length} systemic log{complaints.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          {/* Status Matrix Counters */}
          {!loading && complaints.length > 0 && (
            <div className="flex items-center gap-3 pt-1 text-[11px] font-medium tracking-tight">
              {openCount > 0 && (
                <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400">
                  <AlertCircle className="h-3 w-3 shrink-0" />
                  {openCount} unresolved cases
                </span>
              )}
              {resolvedCount > 0 && (
                <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-3 w-3 shrink-0" />
                  {resolvedCount} closed solutions
                </span>
              )}
            </div>
          )}
        </div>

        {/* Main Feed Content Execution Tunnel */}
        <div className="pt-2">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
          ) : complaints.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center gap-2 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-lg bg-neutral-50/30 dark:bg-neutral-900/10">
              <FileText className="h-5 w-5 text-neutral-300 dark:text-neutral-700" />
              <div className="space-y-0.5">
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">Database index empty</p>
                <p className="text-xs text-neutral-400 dark:text-neutral-500 px-6 max-w-xs leading-normal">
                  {isMyComplaints ? "You haven't initialized any security or infrastructure tickets yet." : "No public records match the database request pipeline."}
                </p>
              </div>
            </div>
          ) : (
            complaints.map((c) => (
              <ComplaintCard
                key={c.id}
                complaint={c}
                onView={handleView}
                onUpvote={handleUpvote}
                upvoting={upvoting}
              />
            ))
          )}
        </div>

      </div>
    </div>
  );
}