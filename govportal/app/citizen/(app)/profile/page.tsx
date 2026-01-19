"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { REQUEST } from "@/services/api"
import { getStoredToken } from "@/services/auth"
import { Complaint } from "@/types"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"

export default function MyComplaintsPage() {
  const router = useRouter()
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!getStoredToken()) {
      router.push("/citizen/login")
      return
    }

    REQUEST("GET", "citizens/complaints/")
      .then(setComplaints)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">My Complaints</h1>
        <Button onClick={() => router.push("/citizen/post")}>
          File Complaint
        </Button>
      </div>

      <div className="space-y-4">
        {loading &&
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}

        {!loading &&
          complaints.map((c) => (
            <Card key={c.id} className="border-muted/40">
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle className="text-lg">
                  {c.title}
                </CardTitle>
                <Badge>{c.status}</Badge>
              </CardHeader>

              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p className="line-clamp-2">{c.description}</p>

                <div className="flex justify-between text-xs">
                  <span>
                    📍 {c.city} — {c.pincode}
                  </span>
                  <span>
                    {new Date(c.timestamp).toLocaleDateString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}

        {!loading && complaints.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No complaints yet. File your first one 🚀
          </div>
        )}
      </div>
    </div>
  )
}
