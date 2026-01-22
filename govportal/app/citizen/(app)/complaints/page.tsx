"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { cn } from "@/lib/utils";
import { Card, CardContent, CardFooter, CardHeader, } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {   useSearchParams ,useRouter } from "next/navigation";
import { toast } from "sonner";
import { FilePlusCorner, MessageCircle, MapPin } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ThumbsUp, Eye, FileText, ImageIcon, Video, Music, } from "lucide-react";

import { REQUEST, API_URL } from "@/services/api";
import { Complaint, Evidence } from "@/types";

/* -------------------------------- Evidence Renderer -------------------------------- */

function EvidenceRenderer({ evidence }: { evidence: Evidence }) {
  const src = evidence.file?.startsWith("http")
    ? evidence.file
    : `${API_URL}${evidence.file?.replace(/^\/+/, "")}`;

  switch (evidence.media_type) {
    case "image":
      return (
        <div className="relative w-full h-full rounded-lg overflow-hidden border">
          <img
            src={src}
            alt="Evidence"
            className="object-cover"
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

/* -------------------------------- Page -------------------------------- */

/* -------------------------------- Page -------------------------------- */

export default function AllComplaintsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [loading, setLoading] = useState(true);

  // Determine if showing "my complaints" or "all complaints"
  const filter = searchParams.get('filter');
  const isMyComplaints = filter === 'my';
  const endpoint = isMyComplaints 
    ? "citizens/complaints/my/" 
    : "citizens/complaints/all/";
  const pageTitle = isMyComplaints ? "My Complaints" : "All Complaints";

  useEffect(() => {
    setLoading(true);
    REQUEST("GET", endpoint)
      .then((res: any) => setComplaints(res || []))
      .catch((err) => {
        console.error(err);
        toast.error(err?.message || "Failed to load complaints");
      })
      .finally(() => setLoading(false));
  }, [endpoint]); // Re-fetch when endpoint changes

  const handleComplaintClick = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    router.push(`/citizen/complaints/${complaint.id}`);
  };

  return (
    <>
      <div className="fixed inset-0 -z-10">
        {/* Dot grid pattern */}
        <div
          className={cn(
            "absolute inset-0",
            "bg-size-[20px_20px]",
            "bg-[radial-gradient(#d4d4d4_1px,transparent_2px)]",
            "dark:bg-[radial-gradient(#404040_1px,transparent_2px)]",
          )}
        />
        {/* Radial gradient overlay for faded effect */}
        <div className="absolute inset-0 bg-white mask-[radial-gradient(ellipse_at_center,transparent_20%,black)] dark:bg-black" />
      </div>

      <div className="relative max-w-3xl mx-auto space-y-6 px-4 py-8">

        {/* Loading Skeleton */}
        {loading &&
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="p-4 space-y-4">
              <Skeleton className="h-6 w-2/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-48 w-full rounded-lg" />
            </Card>
          ))}

        {/* Empty State */}
        {!loading && complaints.length === 0 && (
          <Card className="w-full min-h-fit p-10 text-center text-muted-foreground">
            No complaints found.
          </Card>
        )}

        {/* Feed */}
        {!loading &&
          complaints.map((c) => (
            <Card
              key={c.id}
              className="border shadow-sm hover:shadow-md transition"
            >
              <CardHeader className="flex flex-row items-start gap-4">

                <Avatar className="h-10 w-10">
                  <AvatarFallback>
                    {c.citizen?.[0]?.toUpperCase() ?? "U"}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold leading-none">
                      {c.title}
                    </h3>

                    <Badge
                      variant={
                        c.status === "OPEN"
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {c.status}
                    </Badge>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    {c.citizen ?? "Citizen"} •{" "}
                    {c.city ?? "—"} •{" "}
                    {formatDistanceToNow(
                      new Date(c.timestamp),
                      { addSuffix: true }
                    )}
                  </p>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <p className="text-sm leading-relaxed">
                  {c.description}
                </p>

                {/* Evidences */}
                {c.evidences?.length != null && c.evidences?.length > 0 && (
                  <div className="space-y-3">
                    {c.evidences.map((ev) => (
                      <div
                        key={ev.id}
                        className="space-y-1"
                      >
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {ev.media_type === "image" && <ImageIcon className="h-4 w-4" /> && ev.caption && <span className="italic">- {ev.caption}</span>}
                          {ev.media_type === "video" && <Video className="h-4 w-4" />}
                          {ev.media_type === "audio" && <Music className="h-4 w-4" />}
                          {ev.media_type.toUpperCase()}
                        </div>

                        <EvidenceRenderer evidence={ev} />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button onClick={()=>{handleComplaintClick(c)}}>
                  View
                </Button>
              </CardFooter>
            </Card>
          ))}
      </div>
    </>
  );
}
