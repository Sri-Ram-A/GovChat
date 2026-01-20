"use client"

import { useEffect, useState } from "react"
import { REQUEST } from "@/services/api"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { MapPin, Layers } from "lucide-react"
import { Map, MapTileLayer } from "@/components/ui/map"
import type { ComplaintGroup } from "@/types"
import type { LatLngExpression } from "leaflet"

export default function MyGroupPage() {
  const [group, setGroup] = useState<ComplaintGroup | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    REQUEST("GET", "handlers/assigned-group/")
      .then((data) => {
        if (!data || data.message) {
          setGroup(null)
        } else {
          setGroup(data)
        }
      })
      .finally(() => setLoading(false))
  }, [])

  /* ---------------- Loading ---------------- */
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-2/3" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-[240px] w-full" />
        </CardContent>
      </Card>
    )
  }

  /* ---------------- Empty State ---------------- */
  if (!group) {
    return (
      <div className="flex h-48 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
        No group assigned to you yet
      </div>
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
      <Card className="transition-shadow hover:shadow-md">
        <CardHeader className="space-y-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">
              {group.title}
            </CardTitle>

            <Badge
              variant={
                group.grouped_status === "OPEN"
                  ? "secondary"
                  : group.grouped_status === "IN_PROGRESS"
                  ? "default"
                  : "outline"
              }
            >
              {group.grouped_status.replace("_", " ")}
            </Badge>
          </div>

          {group.department && (
            <p className="text-xs text-muted-foreground">
              Department: {group.department}
            </p>
          )}
        </CardHeader>

        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
              {/* 
                Future upgrades:
                - Circle using radius_meters
                - Complaint markers
                - Heatmaps
              */}
            </Map>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
