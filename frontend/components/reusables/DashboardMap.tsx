"use client"

import React from "react"
import { 
  Map, 
  MapMarker, 
  MapTileLayer, 
  MapZoomControl 
} from "@/components/ui/map"
import { 
  MapPinIcon,
  AlertTriangle, 
  Zap, 
  Trash2, 
  Construction, 
  ShieldCheck,
  CheckCircle2,
  Clock
} from "lucide-react"
import { cn } from "@/lib/utils"
import { REQUEST } from "@/services/api"
import { Complaint } from "@/types"
import { MapPopup } from "@/components/ui/map"
import { Badge } from "@/components/ui/badge"

function MapPin({ color }: { color: string }) {
  return (
    <div className="relative flex items-center justify-center">
      <div className={cn("absolute w-8 h-8 rounded-full animate-ping opacity-20", color)} />
      <div className={cn("relative w-6 h-6 rounded-full flex items-center justify-center text-white shadow-lg", color)}>
        <MapPinIcon className="w-3.5 h-3.5" />
      </div>
    </div>
  )
}

export default function DashboardMap() {
  const [complaints, setComplaints] = React.useState<Complaint[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    REQUEST("GET", "citizens/complaints/all/")
      .then((res: any) => setComplaints(res || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const activeReportsCount = complaints.filter(c => c.status !== "RESOLVED" && c.status !== "CLOSED").length;
  const resolvedCount = complaints.filter(c => c.status === "RESOLVED" || c.status === "CLOSED").length;

  return (
    <div className="flex-1 p-0 relative min-h-[450px] overflow-hidden">
      <div className="absolute inset-0 z-0">
        <Map 
          center={[12.9629, 77.5775]} 
          zoom={13} 
          className="h-full w-full"
          zoomControl={false}
        >
          <MapTileLayer 
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          />
          <MapZoomControl position="bottomright" />
          
          {!loading && complaints.map((c) => {
            if (!c.latitude || !c.longitude) return null;
            
            let color = "bg-red-500";
            if (c.status === "RESOLVED" || c.status === "CLOSED") color = "bg-green-500";
            else if (c.status === "IN_PROGRESS") color = "bg-orange-500";

            return (
              <MapMarker 
                key={c.id}
                position={[parseFloat(c.latitude), parseFloat(c.longitude)]} 
                icon={<MapPin color={color} />}
              >
                <MapPopup className="w-64 p-0 overflow-hidden border-none shadow-2xl">
                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-[10px] uppercase font-black">
                        {c.status}
                      </Badge>
                      <span className="text-[10px] text-slate-400 font-bold">
                        {new Date(c.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                    <h4 className="font-bold text-slate-900 leading-tight">
                      {c.title}
                    </h4>
                    <p className="text-xs text-slate-500 line-clamp-2">
                      {c.description}
                    </p>
                    <div className="pt-2 flex items-center gap-2 text-[10px] font-bold text-blue-600">
                      <span>{c.city || "Bangalore"}</span>
                      <span className="w-1 h-1 rounded-full bg-blue-600" />
                      <span>{c.likes_count} Upvotes</span>
                    </div>
                  </div>
                </MapPopup>
              </MapMarker>
            );
          })}
        </Map>
      </div>
      
      {/* Premium Data Overlays */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-20">
        <div className="relative w-full h-full p-8 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div className="bg-white/90 backdrop-blur-xl border border-blue-100 rounded-2xl p-4 shadow-xl shadow-blue-900/5 rotate-[-5deg] animate-bounce-slow pointer-events-auto">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Alerts</p>
                  <p className="text-lg font-black text-slate-900 leading-tight">{activeReportsCount} Reports</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white/90 backdrop-blur-xl border border-green-100 rounded-2xl p-4 shadow-xl shadow-green-900/5 rotate-[3deg] pointer-events-auto">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Resolved</p>
                  <p className="text-lg font-black text-slate-900 leading-tight">{resolvedCount} Issues</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-center">
            <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-2xl flex items-center gap-4 border border-white/10 pointer-events-auto">
              <div className="flex -space-x-2">
                {[1,2,3].map((i) => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-slate-900 bg-slate-700 flex items-center justify-center text-[10px] font-bold">
                    {String.fromCharCode(64 + i)}
                  </div>
                ))}
              </div>
              <p className="text-xs font-medium">85 citizens tracking in this zone</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
