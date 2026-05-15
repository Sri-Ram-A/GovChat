"use client"

import React from "react"
import { 
  Map, 
  MapMarker, 
  MapTileLayer 
} from "@/components/ui/map"

interface MiniMapProps {
  lat: number
  lng: number
  zoom?: number
}

export default function MiniMap({ lat, lng, zoom = 15 }: MiniMapProps) {
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || !lat || !lng) return null

  return (
    <div className="h-48 w-full border-t border-slate-100 relative grayscale hover:grayscale-0 transition-all duration-500 overflow-hidden">
      <Map 
        center={[lat, lng]} 
        zoom={zoom} 
        className="h-full w-full"
        zoomControl={false}
      >
        <MapTileLayer />
        <MapMarker position={[lat, lng]} />
      </Map>
    </div>
  )
}
