"use client";

import { useEffect, useState } from "react";
import type { LatLngExpression } from "leaflet";
import { toast } from "sonner";
import { MapPinIcon, CircleIcon } from "lucide-react";

import { REQUEST } from "@/services/api";
import { Complaint } from "@/types";

import {
  Map,
  MapMarker,
  MapPopup,
  MapTileLayer,
  MapZoomControl,
  MapControlContainer,
  MapTooltip,
} from "@/components/ui/map";

import { Badge } from "@/components/ui/badge";
import { CardContent } from "@/components/ui/card";

const BANGALORE_CENTER: LatLngExpression = [12.9629, 77.5775];

const STATUS_META = {
  OPEN: {
    label: "Open",
    color: "text-red-600 fill-red-600",
  },
  IN_PROGRESS: {
    label: "In Progress",
    color: "text-orange-500 fill-orange-500",
  },
  RESOLVED: {
    label: "Resolved",
    color: "text-green-600 fill-green-600",
  },
  CLOSED: {
    label: "Closed",
    color: "text-slate-400 fill-slate-400",
  },
  DRAFT: {
    label: "Draft",
    color: "text-slate-400 fill-slate-400",
  },
} as const;

export default function Maps() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);

  useEffect(() => {
    REQUEST("GET", "citizens/complaints/all/")
      .then(setComplaints)
      .catch((err) => {
        console.error(err);
        toast.error("Failed to load complaints");
      });
  }, []);

  return (
    <div className="w-screen h-screen">
      <Map center={BANGALORE_CENTER} className="h-full w-full">
        <MapTileLayer />
        <MapZoomControl />

        {/* City marker */}
        <MapMarker position={BANGALORE_CENTER}>
          <MapTooltip >Bengaluru City Center</MapTooltip>
        </MapMarker>

        {/* Complaint markers */}
        {complaints.filter(c => c.latitude && c.longitude).map((c) => {
          const meta = STATUS_META[c.status];

          return (
            <MapMarker
              key={c.id}
              position={[
                parseFloat(c.latitude!),
                parseFloat(c.longitude!),
              ]}
            >
              <MapTooltip>
                <div className="text-xs">
                  <strong>{c.title}</strong>
                  <div className="text-muted-foreground">
                    {meta.label}
                  </div>
                </div>
              </MapTooltip>

              <MapPopup>
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-sm font-semibold leading-tight">
                      {c.title}
                    </h4>
                    <Badge>{meta.label}</Badge>
                  </div>

                  <p className="text-xs text-muted-foreground line-clamp-4">
                    {c.description || "No description provided"}
                  </p>

                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPinIcon size={12} />
                    {c.address_line_2 || "Unknown location"}
                    {c.address_line_1 || "Unknown location"}
                  </div>

                  <div className="text-[10px] text-muted-foreground">
                    {new Date(c.timestamp).toLocaleString()}
                  </div>
                </CardContent>
              </MapPopup>
            </MapMarker>
          );
        })}

        {/* Legend */}
        <MapControlContainer className="bottom-4 left-4">
          <div className="rounded-xl border bg-background/90 backdrop-blur px-4 py-3 shadow-lg space-y-2">
            <p className="text-xs font-semibold">Complaint Status</p>

            {Object.entries(STATUS_META).map(([key, meta]) => (
              <div
                key={key}
                className="flex items-center gap-2 text-xs"
              >
                <CircleIcon size={10} className={meta.color} />
                {meta.label}
              </div>
            ))}
          </div>
        </MapControlContainer>
      </Map>
    </div>
  );
}
