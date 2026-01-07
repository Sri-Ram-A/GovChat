"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Navbar } from "@/components/reusables/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getStoredToken, clearStoredToken } from "@/services/helpers"
import { useRouter } from "next/navigation"

export default function CitizenHome() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const token = getStoredToken()
    if (!token) router.push("/citizen/login")
  }, [])

  return (
    <>
      <Navbar
        links={[{ href: "/citizen/post", label: "File Complaint" }]}
        onLogout={() => {
          clearStoredToken()
          router.push("/citizen/login")
        }}
      />
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 gap-8 items-center mb-12">
          <div>
            <h1 className="text-4xl font-bold mb-4">Citizen Governance Portal</h1>
            <p className="text-lg text-muted-foreground mb-6">
              File complaints, track resolutions, and engage with your local government efficiently.
            </p>
            <Button asChild size="lg">
              <Link href="/citizen/post">File Your First Complaint</Link>
            </Button>
          </div>
          <div className="relative h-96 rounded-lg overflow-hidden">
            <Image
              src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=500&h=400&fit=crop"
              alt="Governance"
              fill
              className="object-cover"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            { title: "Quick Filing", desc: "Submit complaints in under 2 minutes" },
            { title: "Track Progress", desc: "Real-time updates on your requests" },
            { title: "Secure Data", desc: "Your information is protected" },
          ].map((feature, i) => (
            <Card key={i}>
              <CardHeader>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{feature.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </>
  )
}
