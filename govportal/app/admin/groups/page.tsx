"use client";

import { useEffect, useState, useMemo } from "react";
import { REQUEST, API_URL } from "@/services/api";
import type { Complaint } from "@/types";
import { format } from "date-fns";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

import { Map, MapMarker, MapTileLayer } from "@/components/ui/map";
import type { LatLngExpression } from "leaflet";

import { MapPin } from "lucide-react";

/** --- Local Types --- **/
export type GroupStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";

export interface ComplaintGroup {
  id: number;
  title: string;
  department?: string;
  centroid_latitude: number;
  centroid_longitude: number;
  radius_meters?: number;
  grouped_status: GroupStatus;
  complaints_count?: number;
  created_at?: string;
}

/** --- Helper UI pieces --- **/
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

function CoordBadge({ lat, lng }: { lat: number; lng: number }) {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <MapPin className="h-4 w-4" />
      <span className="font-mono">{lat.toFixed(4)}, {lng.toFixed(4)}</span>
    </div>
  );
}

/** --- Main Component --- **/
export default function AdminGroupsPage() {
  const [groups, setGroups] = useState<ComplaintGroup[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState<ComplaintGroup | null>(null);
  const [groupComplaints, setGroupComplaints] = useState<Complaint[]>([]);
  const [loadingComplaints, setLoadingComplaints] = useState(false);

  useEffect(() => {
    fetchGroups();
  }, []);

  async function fetchGroups() {
    try {
      setLoadingGroups(true);
      // Adjust path prefix if your API has /admins/ or similar
      const data = await REQUEST("GET", "admins/complaint-groups/"); 
      setGroups(data || []);
    } catch (err) {
      toast.error("Failed to load groups");
    } finally {
      setLoadingGroups(false);
    }
  }

  async function openGroup(group: ComplaintGroup) {
    setSelectedGroup(group);
    setGroupComplaints([]);
    try {
      setLoadingComplaints(true);
      const data: Complaint[] = await REQUEST("GET", `admins/complaint-groups/${group.id}/`);
      setGroupComplaints(data || []);
    } catch (err) {
      toast.error("Failed to load complaints for group");
    } finally {
      setLoadingComplaints(false);
    }
  }

  function closeGroup() {
    setSelectedGroup(null);
    setGroupComplaints([]);
  }

  const groupCards = useMemo(() => groups, [groups]);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-6">
          <div>
            <h1 className="text-2xl font-bold">Complaint Groups</h1>
            <p className="text-sm text-muted-foreground">Clusters of complaints by proximity</p>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={fetchGroups}>Refresh</Button>
          </div>
        </div>
      </header>

      <main className="container px-6 py-8 space-y-8">
        <Card className="border shadow-sm">
          <CardHeader className="border-b py-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Groups</CardTitle>
                <CardDescription>
                  {loadingGroups ? "Loading groups…" : `${groups.length} groups`}
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            {loadingGroups ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-28 rounded-lg" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {groupCards.map((g) => (
                  <div key={g.id} className="rounded-lg border p-4 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-semibold text-lg">{g.title}</h3>
                          <div className="text-sm text-muted-foreground mt-1">
                            {g.department ?? "—"}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <GroupStatusBadge status={g.grouped_status} />
                          <div className="text-xs text-muted-foreground">{g.complaints_count ?? 0} complaints</div>
                        </div>
                      </div>

                      <div className="mt-3">
                        <CoordBadge lat={g.centroid_latitude} lng={g.centroid_longitude} />
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-3">
                      <Button variant="ghost" size="sm" onClick={() => openGroup(g)}>
                        View complaints
                      </Button>
                      <Button size="sm" onClick={() => {
                        // future: open map / zoom
                        toast("Open map/zoom later");
                      }}>
                        Open on map
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {selectedGroup && (
        <Sheet open={!!selectedGroup} onOpenChange={(open) => !open && closeGroup()}>
          <SheetContent className="sm:max-w-3xl p-3">
            <SheetHeader className="mb-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <GroupStatusBadge status={selectedGroup.grouped_status} />
                    <h2 className="text-xl font-bold">{selectedGroup.title}</h2>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <CoordBadge lat={selectedGroup.centroid_latitude} lng={selectedGroup.centroid_longitude} />
                  </div>
                </div>

                <div className="text-sm text-muted-foreground">
                  {selectedGroup.complaints_count ?? 0} complaints
                </div>
              </div>
            </SheetHeader>

            <ScrollArea className="h-[calc(100vh-180px)] pr-4">
              <div className="space-y-6">
                {/* Map preview */}
                <section>
                  <div className="rounded-lg overflow-hidden border h-48">
                    <Map
                      center={[selectedGroup.centroid_latitude, selectedGroup.centroid_longitude] as LatLngExpression}
                      zoom={14}
                      className="h-full w-full"
                    >
                      <MapTileLayer />
                      <MapMarker
                        position={[selectedGroup.centroid_latitude, selectedGroup.centroid_longitude] as LatLngExpression}
                      />
                    </Map>
                  </div>
                </section>

                {/* Complaints table */}
                <section>
                  <h4 className="font-semibold mb-3 text-foreground">Complaints</h4>

                  {loadingComplaints ? (
                    <div className="space-y-3">
                      {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 rounded" />)}
                    </div>
                  ) : groupComplaints.length === 0 ? (
                    <div className="text-sm text-muted-foreground">No complaints found in this group.</div>
                  ) : (
                    <Card className="border">
                      <CardContent className="p-0">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Title</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Location</TableHead>
                              <TableHead>Reported</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {groupComplaints.map((c) => (
                              <TableRow key={c.id} className="hover:bg-muted/50">
                                <TableCell>
                                  <div className="font-medium truncate">{c.title}</div>
                                  <div className="text-xs text-muted-foreground truncate">{c.description?.slice(0, 60)}{c.description && c.description.length > 60 ? "..." : ""}</div>
                                </TableCell>
                                <TableCell><Badge variant="outline" className="font-normal">{c.status}</Badge></TableCell>
                                <TableCell>
                                  <div className="text-sm">{c.address_line_2 || "—"}</div>
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">{format(new Date(c.timestamp), "MMM dd, yyyy")}</TableCell>
                                <TableCell className="text-right">
                                  <Button variant="outline" size="sm" onClick={() => {
                                    // in future: open complaint sheet
                                    toast("Open complaint details (not implemented here)");
                                  }}>
                                    View
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  )}
                </section>
              </div>
            </ScrollArea>
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}
