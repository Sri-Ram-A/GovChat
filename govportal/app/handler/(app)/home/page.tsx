"use client"

import { useEffect, useState } from "react"
import { format } from "date-fns"
import { REQUEST } from "@/services/api"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogDescription 
} from "@/components/ui/dialog"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { MapPin, Layers, Clock, User } from "lucide-react"
import { Map, MapTileLayer } from "@/components/ui/map"
import { toast } from "sonner"
import type { ComplaintGroup, Complaint } from "@/types"
import type { LatLngExpression } from "leaflet"

interface TimelineEntry {
  id: number
  title: string
  text: string
  image: string | null
  created_at: string
  posted_by: string
  posted_by_name: string
}

interface EnhancedComplaintGroup extends ComplaintGroup {
  complaints: Complaint[]
  timeline: TimelineEntry[]
}

export default function MyGroupPage() {
  const [group, setGroup] = useState<EnhancedComplaintGroup | null>(null)
  const [loading, setLoading] = useState(true)
  const [timelineOpen, setTimelineOpen] = useState(false)
  const [timelineTitle, setTimelineTitle] = useState("")
  const [timelineText, setTimelineText] = useState("")
  const [timelineImage, setTimelineImage] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchGroup()
  }, [])

  async function fetchGroup() {
    try {
      setLoading(true)
      const data = await REQUEST("GET", "handlers/assigned-group/")
      
      if (!data || data.message) {
        setGroup(null)
      } else {
        setGroup(data)
      }
    } catch (error) {
      toast.error("Failed to load group data")
      setGroup(null)
    } finally {
      setLoading(false)
    }
  }

  async function submitTimeline() {
    if (!timelineText && !timelineTitle) {
      toast.error("Please provide a title or description")
      return
    }

    const formData = new FormData()
    formData.append("title", timelineTitle)
    formData.append("text", timelineText)
    if (timelineImage) {
      formData.append("image", timelineImage)
    }

    try {
      setSubmitting(true)
      await REQUEST("POST", "handlers/timeline/", formData, { isMultipart: true })
      toast.success("Timeline updated successfully")
      
      // Reset form
      setTimelineTitle("")
      setTimelineText("")
      setTimelineImage(null)
      setTimelineOpen(false)
      
      // Refresh group data to show new timeline entry
      fetchGroup()
    } catch (error) {
      toast.error("Failed to update timeline")
    } finally {
      setSubmitting(false)
    }
  }

  /* ---------------- Loading State ---------------- */
  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-2/3" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-4 w-1/2" />
          </CardContent>
        </Card>
        <Skeleton className="h-60 w-full rounded-lg" />
      </div>
    )
  }

  /* ---------------- Empty State ---------------- */
  if (!group) {
    return (
      <Card>
        <CardContent className="flex h-48 items-center justify-center">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              No group assigned to you yet
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Contact your administrator for group assignment
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const mapCenter: LatLngExpression = [
    group.centroid_latitude,
    group.centroid_longitude,
  ]

  /* ---------------- Main View ---------------- */
  return (
    <div className="space-y-6">
      {/* ===== Group Summary Card ===== */}
      <Card className="border shadow-sm">
        <CardHeader className="space-y-2">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-xl font-semibold">
                {group.title}
              </CardTitle>
              {group.department && (
                <CardDescription>
                  Department: {group.department}
                </CardDescription>
              )}
            </div>

            <div className="flex flex-col items-end gap-2">
              <Badge
                variant={
                  group.grouped_status === "OPEN"
                    ? "destructive"
                    : group.grouped_status === "IN_PROGRESS"
                    ? "secondary"
                    : group.grouped_status === "RESOLVED"
                    ? "default"
                    : "outline"
                }
              >
                {group.grouped_status.replace("_", " ")}
              </Badge>
              <Button 
                size="sm" 
                onClick={() => setTimelineOpen(true)}
              >
                Update Timeline
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="flex items-start gap-2 text-sm">
            <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
            <div>
              <p className="font-medium">Location Center</p>
              <p className="text-muted-foreground">
                {group.centroid_latitude.toFixed(4)},{" "}
                {group.centroid_longitude.toFixed(4)}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2 text-sm">
            <Layers className="mt-0.5 h-4 w-4 text-muted-foreground" />
            <div>
              <p className="font-medium">Coverage Radius</p>
              <p className="text-muted-foreground">
                {group.radius_meters ?? "—"} meters
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2 text-sm">
            <User className="mt-0.5 h-4 w-4 text-muted-foreground" />
            <div>
              <p className="font-medium">Total Complaints</p>
              <p className="text-muted-foreground">
                {group.complaints?.length ?? 0} complaints
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ===== Map Section ===== */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Group Coverage Area
          </CardTitle>
        </CardHeader>

        <CardContent>
          <div className="h-[320px] w-full overflow-hidden rounded-lg border">
            <Map center={mapCenter} zoom={14}>
              <MapTileLayer />
            </Map>
          </div>
        </CardContent>
      </Card>

      {/* ===== Complaints List ===== */}
      {group.complaints && group.complaints.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Complaints in This Group</CardTitle>
            <CardDescription>
              {group.complaints.length} complaints requiring attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Reported</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {group.complaints.map((complaint) => (
                  <TableRow key={complaint.id}>
                    <TableCell className="font-medium">
                      {complaint.title}
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <p className="truncate text-sm text-muted-foreground">
                        {complaint.description}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-normal">
                        {complaint.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {complaint.address_line_2 || complaint.city || "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(complaint.timestamp), "MMM dd, yyyy")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* ===== Timeline ===== */}
      {group.timeline && group.timeline.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Timeline Updates</CardTitle>
            <CardDescription>
              Progress updates from admins and handlers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
                {group.timeline.map((entry) => (
                  <div
                    key={entry.id}
                    className="border-l-2 border-muted pl-4 pb-4 last:pb-0"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        {entry.title && (
                          <h4 className="font-semibold text-sm">
                            {entry.title}
                          </h4>
                        )}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>
                            {format(new Date(entry.created_at), "MMM dd, yyyy 'at' h:mm a")}
                          </span>
                          <span>•</span>
                          <span>by {entry.posted_by}</span>
                        </div>
                      </div>
                    </div>

                    {entry.text && (
                      <p className="text-sm text-foreground mb-2">
                        {entry.text}
                      </p>
                    )}

                    {entry.image && (
                      <img src={`http://localhost:8000${entry.image}`}/>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* ===== Update Timeline Dialog ===== */}
      <Dialog open={timelineOpen} onOpenChange={setTimelineOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Timeline</DialogTitle>
            <DialogDescription>
              Post a progress update about this group
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">
                Title
              </label>
              <input
                type="text"
                className="w-full border rounded-md px-3 py-2 text-sm"
                placeholder="e.g., Work Started, Progress Update..."
                value={timelineTitle}
                onChange={(e) => setTimelineTitle(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">
                Description
              </label>
              <textarea
                className="w-full border rounded-md px-3 py-2 text-sm min-h-[100px]"
                placeholder="Describe the progress or update..."
                value={timelineText}
                onChange={(e) => setTimelineText(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">
                Image (optional)
              </label>
              <input
                type="file"
                accept="image/*"
                className="w-full text-sm"
                onChange={(e) => setTimelineImage(e.target.files?.[0] || null)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setTimelineOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button onClick={submitTimeline} disabled={submitting}>
              {submitting ? "Posting..." : "Post Update"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}