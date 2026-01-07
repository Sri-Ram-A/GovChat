"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { REQUEST, API_URL } from "@/services/api";
import { Complaint, Evidence } from "@/types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

function EvidenceRenderer({ evidence }: { evidence: Evidence }) {
  const src = evidence.file?.startsWith("http")
    ? evidence.file
    : `${API_URL}${evidence.file?.replace(/^\/+/, "")}`;

  switch (evidence.media_type) {
    case "image":
      return (
        <div className="w-full rounded-md overflow-hidden">
          {/* Use intrinsic sizes (no fill) so aspect ratio preserved */}
          <img src={src} alt="evidence" width={900} height={600} className="w-full h-auto object-cover rounded-md" />
        </div>
      );

    case "video":
      return (
        <div className="w-full rounded-md overflow-hidden">
          <video controls className="w-full h-auto rounded-md bg-black">
            <source src={src} />
            Your browser does not support the video tag.
          </video>
        </div>
      );

    case "audio":
      return (
        <div className="w-full rounded-md overflow-hidden">
          <audio controls className="w-full">
            <source src={src} />
            Your browser does not support the audio element.
          </audio>
        </div>
      );

    default: // document or unknown
      return (
        <div className="w-full">
          <a
            href={src}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 underline"
          >
            View document
          </a>
        </div>
      );
  }
}

export default function AllComplaintsPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Adjust route to your backend if needed:
    REQUEST("GET", "citizens/complaints/all/")
      .then((res: any) => {
        // if backend returns array directly
        setComplaints(res || []);
      })
      .catch((err) => {
        console.error(err);
        toast.error(err?.message || "Failed to load complaints");
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">All Complaints</h1>
        <div className="flex items-center gap-3">
          <Button asChild>
            <Link href="/citizen/post">New Complaint</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/citizen/evidence/upload">Upload Evidence</Link>
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {loading &&
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-56 rounded-xl" />
          ))}

        {!loading && complaints.length === 0 && (
          <div className="text-center text-muted-foreground py-12">
            No complaints found.
          </div>
        )}

        {!loading &&
          complaints.map((c) => (
            <Card key={c.id} className="border hover:shadow-lg transition">
              <CardHeader className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 p-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>
                      {c.citizen_username?.[0]?.toUpperCase() ?? "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg mb-0!">{c.title}</CardTitle>
                      <Badge variant="outline" className="ml-2">
                        {c.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {c.citizen_username ?? "Citizen"} • {c.city ?? "—"} •{" "}
                      {formatDistanceToNow(new Date(c.timestamp), { addSuffix: true })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">👍 {c.likes_count}</span>
                  <Button variant="ghost" asChild size="sm">
                    <Link href={`/citizen/complaints/${c.id}`}>View</Link>
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="p-4 space-y-4">
                <p className="text-sm text-muted-foreground whitespace-pre-line">{c.description}</p>

                {/* Display evidences (if any) vertically */}
                {c.evidences && c.evidences.length > 0 && (
                  <div className="space-y-3">
                    {c.evidences.map((ev) => (
                      <div key={ev.id} className="rounded-md overflow-hidden">
                        <EvidenceRenderer evidence={ev} />
                        <div className="mt-2 text-xs text-muted-foreground flex items-center justify-between">
                          <div>{ev.media_type.toUpperCase()}</div>
                          <a
                            href={ev.file?.startsWith("http") ? ev.file : `${API_URL}${ev.file?.replace(/^\/+/, "")}`}
                            target="_blank"
                            rel="noreferrer"
                            className="underline text-sm"
                          >
                            Open
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
      </div>
    </div>
  );
}
