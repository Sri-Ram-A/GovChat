"use client";

import { useEffect, useState, useMemo } from "react";
import { REQUEST, API_URL } from "@/services/api";
import { Complaint, Evidence } from "@/types";
import { format } from "date-fns";

// Components
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Map,
  MapMarker,
  MapTileLayer,
} from "@/components/ui/map";
import type { LatLngExpression } from "leaflet";

// Icons
import {
  Search,
  CheckCircle2,
  Clock,
  FileText,
  Filter,
  Download,
  MapPin,
  Image as ImageIcon,
  Video,
  File,
} from "lucide-react";

// Status Badge Component
function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
    OPEN: { variant: "destructive", label: "Pending" },
    RESOLVED: { variant: "default", label: "Resolved" },
    IN_PROGRESS: { variant: "secondary", label: "In Progress" },
  };

  const config = variants[status] || { variant: "outline", label: status };

  return (
    <Badge variant={config.variant} className="font-normal px-3 py-1">
      {config.label}
    </Badge>
  );
}



// Evidence Display Component
function EvidenceDisplay({ ev }: { ev: Evidence }) {
  const src = ev.file?.startsWith("http") ? ev.file : `${API_URL}${ev.file?.replace(/^\/+/, "")}`;

  if (ev.media_type === "image") {
    return (
      <div className="rounded-lg overflow-hidden border">
        <img src={src} alt="Evidence" className="w-full h-48 object-cover" />
        {ev.caption && <p className="p-3 text-sm text-muted-foreground">{ev.caption}</p>}
      </div>
    );
  }

  if (ev.media_type === "video") {
    return (
      <div className="rounded-lg overflow-hidden border">
        <video src={src} controls className="w-full h-48 object-cover" />
        {ev.caption && <p className="p-3 text-sm text-muted-foreground">{ev.caption}</p>}
      </div>
    );
  }

  return (
    <div className="rounded-lg border p-4 flex items-center gap-3">
      <File className="h-8 w-8 text-muted-foreground" />
      <div className="flex-1">
        <div className="font-medium">Document Attachment</div>
        {ev.caption && <p className="text-sm text-muted-foreground mt-1">{ev.caption}</p>}
        <a href={src} target="_blank" className="text-sm text-blue-600 hover:underline mt-2 inline-block">
          Download File
        </a>
      </div>
    </div>
  );
}

// Complaint Details Sheet
function ComplaintDetails({ complaint, open, onOpenChange }: { complaint: Complaint; open: boolean; onOpenChange: (open: boolean) => void }) {
  const hasLocation = complaint.latitude && complaint.longitude;
  const coordinates = hasLocation ? [Number(complaint.latitude), Number(complaint.longitude)] as LatLngExpression : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-2xl p-3">
        <SheetHeader className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <StatusBadge status={complaint.status} />
            <span className="text-sm text-muted-foreground">
              {format(new Date(complaint.timestamp), "MMM dd, yyyy · hh:mm a")}
            </span>
          </div>
          <SheetTitle className="text-xl font-bold">{complaint.title}</SheetTitle>
          <CardDescription>
            Reported by {complaint.citizen} · {complaint.city || "Location not specified"}
          </CardDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-180px)] pr-4">
          <div className="space-y-6">
            {/* Description */}
            <section>
              <h4 className="font-semibold mb-3 text-foreground">Description</h4>
              <p className="text-sm leading-relaxed bg-muted/50 p-4 rounded-lg">
                {complaint.description}
              </p>
            </section>

            {/* Location Map */}
            {hasLocation && coordinates && (
              <section>
                <h4 className="font-semibold mb-3 text-foreground flex items-center gap-2">
                  <MapPin className="h-4 w-4" /> Location
                </h4>
                <div className="rounded-lg overflow-hidden border h-64">
                  <Map center={coordinates} zoom={15} className="h-full w-full">
                    <MapTileLayer />
                    <MapMarker position={coordinates} />
                  </Map>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Coordinates: {complaint.latitude}, {complaint.longitude}
                </p>
              </section>
            )}

            {/* Evidence */}
            {complaint.evidences && complaint.evidences.length > 0 && (
              <section>
                <h4 className="font-semibold mb-3 text-foreground">Evidence</h4>
                <div className="grid gap-4">
                  {complaint.evidences.map((ev) => (
                    <EvidenceDisplay key={ev.id} ev={ev} />
                  ))}
                </div>
              </section>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

// Enhanced Search Bar
function SearchBar({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div className="relative flex-1 max-w-md">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="Search by title, citizen, address, or landmark..."
        className="pl-9 bg-background"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

// Main Component
export default function AdminDashboard() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const data = await REQUEST("GET", "admins/complaints/");
      setComplaints(data || []);
    } catch (error) {
      toast.error("Failed to load complaints");
    } finally {
      setLoading(false);
    }
  };

  const filteredComplaints = useMemo(() => {
    if (!searchQuery.trim()) return complaints;

    const query = searchQuery.toLowerCase();
    return complaints.filter((c) =>
      c.title.toLowerCase().includes(query) ||
      c.citizen?.toLowerCase().includes(query) ||
      c.address_line_2?.toLowerCase().includes(query) ||
      c.landmark?.toLowerCase().includes(query) ||
      c.city?.toLowerCase().includes(query)
    );
  }, [complaints, searchQuery]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-6">
          <div>
            <h1 className="text-2xl font-bold">GovChat</h1>
            <p className="text-sm text-muted-foreground">Lets resolve community issues</p>
          </div>
          <div className="flex items-center gap-3">
            <SearchBar value={searchQuery} onChange={setSearchQuery} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container px-6 py-8 space-y-8">

        {/* Data Table */}
        <Card className="border shadow-sm">
          <CardHeader className="border-b py-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Active Complaints</CardTitle>
                <CardDescription>
                  {filteredComplaints.length} of {complaints.length} complaints
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-75">Complaint</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Reported</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={6}>
                        <Skeleton className="h-12 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : filteredComplaints.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                      No complaints found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredComplaints.map((complaint) => (
                    <TableRow key={complaint.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div className="font-medium truncate">{complaint.title.substring(0, 20)}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {complaint.description.substring(0, 20)}...
                        </div>
                      </TableCell>

                      <TableCell>
                        <StatusBadge status={complaint.status} />
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{complaint.address_line_2 || "—"}</div>
                        {complaint.landmark && (
                          <div className="text-xs text-muted-foreground">{complaint.landmark}</div>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(complaint.timestamp), "MMM dd")}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedComplaint(complaint)}
                        >
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>

      {/* Details Sheet */}
      {selectedComplaint && (
        <ComplaintDetails
          complaint={selectedComplaint}
          open={!!selectedComplaint}
          onOpenChange={(open) => !open && setSelectedComplaint(null)}
        />
      )}
    </div>
  );
}