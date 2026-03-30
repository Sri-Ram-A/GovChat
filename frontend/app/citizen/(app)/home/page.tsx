"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { getStoredToken, clearStoredToken } from "@/services/auth"
import { useRouter } from "next/navigation"


export default function CitizenHome() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)

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
    }
  }

  if (!isAuthenticated) {
    return null // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-background to-muted/30">
      {/* Welcome Screen */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <section >
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

        {/* Image showcase */}
        <section className="">
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
              <div key={index}>
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

    </div>
  )
}