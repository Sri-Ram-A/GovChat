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

function resolveMediaUrl(path?: string | null) {
  if (!path) return null;
  return path.startsWith("http")
    ? path
    : `${API_URL}${path.replace(/^\/+/, "")}`;
}
function GroupTimeline({ timeline = [] }: { timeline: any[] }) {
  const data = timeline.map((item) => ({
    title: format(new Date(item.created_at), "dd MMM yyyy"),
    content: (
      <div className="space-y-3">
        {item.title && (
          <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            {item.title}
          </h4>
        )}

        <p className="text-sm text-neutral-700 dark:text-neutral-300">
          {item.text}
        </p>

        {item.image && (
          <img
            src={resolveMediaUrl(item.image)!}
            alt="Timeline"
            className="w-full max-w-md rounded-xl border shadow-sm"
          />
        )}

        <p className="text-xs text-neutral-500">
          Posted by {item.admin}
        </p>
      </div>
    ),
  }));

  if (data.length === 0) return null;

  return (
    <div className="relative w-full overflow-hidden">
      <AceternityTimeline data={data} />
    </div>
  );
}

function EvidenceGrid({ evidences = [] }: { evidences: any[] }) {
  if (evidences.length === 0) return null;

  return (
    <div >
      {evidences.map((ev) => {
        const src = resolveMediaUrl(ev.file);
        if (!src) return null;

        return (
          <div
            key={ev.id}
            className="rounded-xl overflow-hidden border bg-muted/40"
          >
            {ev.media_type === "image" && (
              <img src={src} className="w-full h-full object-cover" />
            )}

            {ev.media_type === "video" && (
              <video src={src} controls className="w-full" />
            )}

            {ev.media_type === "audio" && (
              <audio src={src} controls className="w-full p-3" />
            )}
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

  useEffect(() => {
    REQUEST("GET", `admins/complaint/${params.id}/`)
      .then((res) => setData(res))
      .catch((err) => { toast.error(err?.message || "Failed to load complaint"); })
      .finally(() => setLoading(false));
  }, [params.id]);

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

      {/* Complaint Core */}
      <Card>
        <CardHeader className="space-y-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">
              {data.title}
            </CardTitle>
            <Badge>{data.status}</Badge>
          </div>

          <p className="text-sm text-muted-foreground">
            {data.city} •{" "}
            {formatDistanceToNow(new Date(data.timestamp), {
              addSuffix: true,
            })}
          </p>
        </CardHeader>

        <CardContent className="space-y-4 w-full h-full">
          <p className="text-sm leading-relaxed">
            {data.description}
          </p>

          <EvidenceGrid evidences={data.evidences} />
        </CardContent>
      </Card>

      {/* Group Context */}
      {data.group && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Group: {data.group.title}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {data.group.department}
            </p>
          </CardHeader>

          <CardContent>
            <GroupTimeline timeline={data.group.timeline} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
