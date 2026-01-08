"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getStoredToken, clearStoredToken } from "@/services/helpers"
import { useRouter } from "next/navigation"
import { Loader2, LogOut, FileText, CheckCircle, Shield } from "lucide-react"


export default function CitizenHome() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const token = getStoredToken()
      if (!token) {
        router.push("/citizen/login")
        return
      }
      setIsAuthenticated(true)
    } catch (error) {
      console.error("Auth check failed:", error)
      clearStoredToken()
      router.push("/citizen/login")
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    clearStoredToken()
    setIsAuthenticated(false)
    router.push("/citizen/login")
  }

  const handleLogoutConfirm = () => {
    setShowLogoutConfirm(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading your dashboard...</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-background to-muted/30">

      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">

          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Citizen Portal</h1>
              <p className="text-xs text-muted-foreground">Governance made simple</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button asChild size="sm" className="gap-2">
              <Link href="/citizen/complaints">
                <FileText className="h-4 w-4" />
                Complaints
              </Link>
            </Button>
            <Button asChild size="sm" className="gap-2">
              <Link href="/citizen/profile">
                <FileText className="h-4 w-4" />
                Profile
              </Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogoutConfirm}
              className="gap-2"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>

        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">

        {/* Hero Section */}
        <section className="mb-16">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="space-y-4">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
                  Welcome to Your{" "}
                  <span className="text-primary">Governance Portal</span>
                </h1>
                <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
                  A unified platform to voice concerns, track resolutions, and
                  collaborate with local authorities. Your feedback drives positive change.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button asChild size="lg" className="gap-2">
                  <Link href="/citizen/post">
                    <FileText className="h-5 w-5" />
                    File a Complaint
                  </Link>
                </Button>

                <Button asChild variant="outline" size="lg" className="gap-2">
                  <Link href="/citizen/complaints">
                    <CheckCircle className="h-5 w-5" />
                    View My Cases
                  </Link>
                </Button>
              </div>
            </div>

            <div className="relative">
              <div className="aspect-4/3 relative rounded-2xl overflow-hidden shadow-2xl">
                <Image
                  src="/home/1.png"
                  alt="Citizen Engagement"
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/40 via-transparent to-transparent" />
              </div>
              <div className="absolute -bottom-4 -left-4 w-24 h-24 rounded-xl overflow-hidden shadow-xl border-4 border-background">
                <Image
                  src="/home/2.png"
                  alt="Community"
                  fill
                  className="object-cover"
                  sizes="96px"
                />
              </div>
              <div className="absolute -top-4 -right-4 w-32 h-32 rounded-xl overflow-hidden shadow-xl border-4 border-background">
                <Image
                  src="/home/3.png"
                  alt="Resolution"
                  fill
                  className="object-cover"
                  sizes="128px"
                />
              </div>
            </div>
          </div>
        </section>

        {/* ================= IMAGE SHOWCASE ================= */}
        <section className="mb-20">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-3">Platform in Action</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              A closer look at how citizens interact with the governance system
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              "/home/6.png",
              "/home/2.png",
              "/home/5.png",
              "/home/4.png",
              "/home/3.png",
            ].map((src, index) => (
              <div>
                <Image
                  src={src}
                  alt={`Platform preview ${index + 1}`}
                  width={800}
                  height={600}
                  className="w-full h-auto rounded-lg"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              </div>

            ))}
          </div>
        </section>


      </main>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle>Confirm Logout</CardTitle>
              <CardDescription>Are you sure you want to logout?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                You will need to login again to access your account.
              </p>
              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowLogoutConfirm(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleLogout}
                  className="gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t py-8 mt-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Citizen Governance Portal. All rights reserved.</p>
          <p className="mt-2">
            Need help?{" "}
            <Link href="/citizen/support" className="text-primary hover:underline">
              Contact Support
            </Link>
          </p>
        </div>
      </footer>
    </div>
  )
}