"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { REQUEST } from "@/services/api"
import { Complaint } from "@/types"
import { Card, CardContent, CardHeader, CardTitle, } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"

export default function AllComplaintsPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    REQUEST("GET", "citizens/complaints/all/")
      .then(setComplaints)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">All Complaints</h1>
        <Button asChild>
          <Link href="/citizen/post">New Complaint</Link>
        </Button>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {loading &&
          Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}

        {!loading &&
          complaints.map((c) => (
            <Card
              key={c.id}
              className="hover:shadow-lg transition border-muted/40 bg-background"
            >
              <CardHeader className="space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="outline">{c.status}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(c.timestamp).toLocaleDateString()}
                  </span>
                </div>

                <CardTitle className="text-lg line-clamp-2">
                  {c.title}
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {c.description}
                </p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-7 w-7">
                      <AvatarFallback>
                        {c.citizen_username?.[0]?.toUpperCase() ?? "U"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-muted-foreground">
                      {c.city}
                    </span>
                  </div>

                  <Badge variant="secondary">
                    👍 {c.likes_count}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
      </div>
    </div>
  )
}
