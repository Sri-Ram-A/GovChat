"use client";

import { useEffect, useState, useMemo } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from "@/components/ui/table";
import { toast } from "sonner";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { REQUEST } from "@/services/api";
import type { Complaint } from "@/types";
import { Map, MapMarker, MapTileLayer } from "@/components/ui/map";
import type { LatLngExpression } from "leaflet";
import { MapPin } from "lucide-react";
import { GroupStatus, ComplaintGroup } from "@/types";

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
const GROUP_STATUS_OPTIONS: { value: GroupStatus; label: string }[] = [
    { value: "OPEN", label: "Open" },
    { value: "IN_PROGRESS", label: "In Progress" },
    { value: "RESOLVED", label: "Resolved" },
    { value: "CLOSED", label: "Closed" },
];

/** --- Main Component --- **/
export default function AdminGroupsPage() {
    const [groups, setGroups] = useState<ComplaintGroup[]>([]);
    const [loadingGroups, setLoadingGroups] = useState(true);
    const [selectedGroup, setSelectedGroup] = useState<ComplaintGroup | null>(null);
    const [groupComplaints, setGroupComplaints] = useState<Complaint[]>([]);
    const [loadingComplaints, setLoadingComplaints] = useState(false);

    const [timelineOpen, setTimelineOpen] = useState(false);
    const [timelineText, setTimelineText] = useState("");
    const [timelineTitle, setTimelineTitle] = useState("");
    const [timelineImage, setTimelineImage] = useState<File | null>(null);

    const [statusDialogOpen, setStatusDialogOpen] = useState(false);
    const [newStatus, setNewStatus] = useState<GroupStatus | null>(null);
    const [updatingStatus, setUpdatingStatus] = useState(false);

    const [assignDialogOpen, setAssignDialogOpen] = useState(false)
    const [handlers, setHandlers] = useState<any[]>([])
    const [selectedHandlerId, setSelectedHandlerId] = useState<number | null>(null)
    const [loadingHandlers, setLoadingHandlers] = useState(false)


    useEffect(() => {
        fetchGroups();
        fetchHandlers();
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

    async function submitTimeline() {
        if (!selectedGroup) return;
        const formData = new FormData();
        formData.append("group", String(selectedGroup.id));
        formData.append("text", timelineText);
        formData.append("title", timelineTitle);
        if (timelineImage) {
            formData.append("image", timelineImage);
        }
        try {
            await REQUEST("POST", "admins/timeline/", formData, { isMultipart: true });
            toast.success("Timeline updated");
            setTimelineOpen(false);
            setTimelineText("");
            setTimelineTitle("");
            setTimelineImage(null);
        } catch (err) {
            toast.error("Failed to post timeline");
        }
    }

    async function openGroup(group: ComplaintGroup) {
        // future: open map / zoom
        toast(`You are viewing group : ${group.id}`);
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

    async function updateGroupStatus() {
        if (!selectedGroup || !newStatus) return;

        try {
            setUpdatingStatus(true);

            const response = await REQUEST(
                "POST",
                `admins/complaint-groups/status/${selectedGroup.id}/`,
                { status: newStatus }
            );

            toast.success(response.message || "Group status updated");

            // Update UI instantly (no refetch needed)
            setGroups((prev) =>
                prev.map((g) =>
                    g.id === selectedGroup.id
                        ? { ...g, grouped_status: newStatus }
                        : g
                )
            );

            setSelectedGroup((prev) =>
                prev ? { ...prev, grouped_status: newStatus } : prev
            );

            setStatusDialogOpen(false);
        } catch (error: any) {
            // Just show whatever message we can find
            toast.error(
                error?.response?.data?.message || 
                error?.response?.data?.detail ||
                error?.message ||
                "Something went wrong"
            );
        } finally {
            setUpdatingStatus(false);
        }
    }

    function closeGroup() {
        setSelectedGroup(null);
        setGroupComplaints([]);
    }

    async function fetchHandlers() {
        try {
            setLoadingHandlers(true)
            const data = await REQUEST(
                "GET",
                `handlers/department/`
            )
            setHandlers(data || [])
        } catch {
            toast.error("Failed to load handlers")
        } finally {
            setLoadingHandlers(false)
        }
    }

    async function assignGroup() {
        if (!selectedHandlerId || !selectedGroup) return

        try {
            await REQUEST(
                "POST",
                `handlers/${selectedHandlerId}/assign-group/`,
                { group_id: selectedGroup.id }
            )

            toast.success("Group assigned successfully")
            setAssignDialogOpen(false)
        } catch {
            toast.error("Failed to assign group")
        }
    }

    const groupCards = useMemo(() => groups, [groups]);

    return (
        <div className="min-h-screen bg-background">
            <main className="container px-6 py-8 space-y-8">
                <Card className="border shadow-sm">
                    <CardHeader className="border-b py-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Total Groups nased on areas</CardTitle>
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

                                        <div className="mt-4 grid grid-cols-2 gap-3">
                                            <Button variant="outline" size="sm" onClick={() => openGroup(g)}>
                                                View complaints
                                            </Button>
                                            <Button
                                                variant="default"
                                                size="sm"
                                                onClick={() => {
                                                    setSelectedGroup(g);
                                                    setTimelineOpen(true);
                                                }}
                                            >
                                                Update Timeline
                                            </Button>

                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                onClick={() => {
                                                    setSelectedGroup(g);
                                                    setNewStatus(g.grouped_status);
                                                    setStatusDialogOpen(true);
                                                }}
                                            >
                                                Update Status
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    setSelectedGroup(g)
                                                    setAssignDialogOpen(true)
                                                }}
                                            >
                                                Assign Group
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
                    <SheetTitle>{selectedGroup.title}</SheetTitle>
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
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {groupComplaints.map((c) => (
                                                            <TableRow key={c.id} className="hover:bg-muted/50">
                                                                <TableCell>
                                                                    <div className="font-medium truncate">{c.title}</div>
                                                                    <div className="text-xs text-muted-foreground truncate">{c.description?.slice(0, 60)}{c.description && c.description.length > 60 ? "..." : ""}</div>
                                                                </TableCell>
                                                                <TableCell><Badge variant="default" className="font-normal">{c.status}</Badge></TableCell>
                                                                <TableCell>
                                                                    <div className="text-sm truncate">{c.address_line_2 || "—"}</div>
                                                                </TableCell>
                                                                <TableCell className="text-sm text-muted-foreground">{format(new Date(c.timestamp), "MMM dd, yyyy")}</TableCell>
                                                                <TableCell className="text-right">
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
            <Dialog open={timelineOpen} onOpenChange={setTimelineOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Update Timeline</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                        <textarea
                            className="w-full border rounded p-2"
                            placeholder="Proper Title"
                            value={timelineTitle}
                            onChange={(e) => setTimelineTitle(e.target.value)}
                        />
                        <textarea
                            className="w-full border rounded p-2"
                            placeholder="Timeline update…"
                            value={timelineText}
                            onChange={(e) => setTimelineText(e.target.value)}
                        />

                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setTimelineImage(e.target.files?.[0] || null)}
                        />

                        <Button onClick={submitTimeline}>
                            Post Update
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Update Group Status</DialogTitle>
                        <DialogDescription>
                            Change the lifecycle state of this complaint group.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <select
                            className="w-full border rounded p-2"
                            value={newStatus ?? ""}
                            onChange={(e) => setNewStatus(e.target.value as GroupStatus)}
                        >
                            {GROUP_STATUS_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>

                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => setStatusDialogOpen(false)}
                            >
                                Cancel
                            </Button>

                            <Button
                                onClick={updateGroupStatus}
                                disabled={updatingStatus}
                            >
                                {updatingStatus ? "Updating…" : "Update Status"}
                            </Button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Assign Group</DialogTitle>
                        <DialogDescription>
                            Select a handler to assign this group.
                        </DialogDescription>
                    </DialogHeader>

                    {loadingHandlers ? (
                        <Skeleton className="h-24" />
                    ) : (
                        <div className="space-y-3">
                            {handlers.map((h) => (
                                <label
                                    key={h.id}
                                    className="flex items-center gap-3 border rounded p-3 cursor-pointer"
                                >
                                    <input
                                        type="radio"
                                        name="handler"
                                        checked={selectedHandlerId === h.id}
                                        onChange={() => setSelectedHandlerId(h.id)}
                                    />
                                    <div>
                                        <div className="font-medium">{h.name}</div>
                                        <div className="text-sm text-muted-foreground">
                                            {h.group_title
                                                ? `Assigned to: ${h.group_title}`
                                                : "Not assigned"}
                                        </div>
                                    </div>
                                </label>
                            ))}
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            disabled={!selectedHandlerId}
                            onClick={assignGroup}
                        >
                            Assign
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    );
}
