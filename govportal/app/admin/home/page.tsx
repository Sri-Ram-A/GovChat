"use client"

import { useEffect, useState } from "react"
import { REQUEST } from "@/services/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { GridPattern } from "@/components/ui/grid-pattern"
export default function AdminDashboard() {
  const [complaints, setComplaints] = useState<any[]>([])

  useEffect(() => {
    fetchComplaints()
  }, [])

  const fetchComplaints = async () => {
    try {
      const data = await REQUEST("GET", "admins/complaints/")
      setComplaints(data)
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="bg-background relative flex h-screen w-full flex-col items-center justify-center overflow-hidden rounded-lg border">
      <GridPattern/>
       <h1 className="text-3xl font-bold">Department Complaints</h1>

      <ScrollArea className="h-[70vh]">
        <div className="space-y-4">
          {complaints.map(c => (
            <Card key={c.id}>
              <CardHeader>
                <CardTitle>{c.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <p>{c.description}</p>
                <p className="mt-2">
                  Status: <strong>{c.status}</strong>
                </p>
                <p>
                  Location: {c.city} – {c.pincode}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
