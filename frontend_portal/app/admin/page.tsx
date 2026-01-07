"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/reusables/navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getStoredToken, clearStoredToken } from "@/services/helpers"

export default function AdminDashboard() {
  const router = useRouter()
  const [stats, setStats] = useState({ total: 0, resolved: 0, pending: 0 })

  useEffect(() => {
    const token = getStoredToken()
    if (!token) router.push("/citizen/login")
  }, [])

  return (
    <>
      <Navbar
        links={[{ href: "/admin/complaints", label: "All Complaints" }]}
        onLogout={() => {
          clearStoredToken()
          router.push("/citizen/login")
        }}
      />
      <div className="max-w-7xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { label: "Total Complaints", value: stats.total },
            { label: "Resolved", value: stats.resolved },
            { label: "Pending", value: stats.pending },
          ].map((stat, i) => (
            <Card key={i}>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </>
  )
}
