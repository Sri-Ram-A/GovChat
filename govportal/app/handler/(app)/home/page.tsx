"use client"

import { useEffect, useState } from "react"
import { REQUEST } from "@/services/api"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function MyGroupPage() {
  const [group, setGroup] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    REQUEST("GET", "handlers/assigned-group/")
      .then(setGroup)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Skeleton className="h-48" />

  if (!group || group.message) {
    return <div className="text-muted-foreground">No group assigned</div>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{group.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p>Status: {group.grouped_status}</p>
        <p>Radius: {group.radius_meters}m</p>
      </CardContent>
    </Card>
  )
}
