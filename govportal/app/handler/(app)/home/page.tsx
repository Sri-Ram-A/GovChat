"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

export default function Home() {
  const router = useRouter()

  return (
    <main className="relative w-full h-screen overflow-hidden bg-white">
      {/* Background Video */}
      <video autoPlay loop muted playsInline
        className="absolute inset-0 w-full h-full object-fit z-0 bottom-1">
        <source src="/admin_intro.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* UI Layer */}
      <div className="relative z-20 w-full h-full">
        
        {/* Top Right: Admin Registration */}
        <div className="absolute top-8 right-8">
          <Button 
            variant="outline" 
            className="text-black border-black/40 hover:bg-black border-2 hover:text-white transition-all"
            onClick={() => router.push("/admin/register")}
          >
            Admin Registration
          </Button>
        </div>

        {/* Left Center: Register Department */}
        <div className="absolute top-8 left-8">
          <Button 
            className="bg-black text-white hover:bg-gray-200 hover:text-black font-semibold border-2 shadow-2xl"
            onClick={() => router.push("/admin/jurisdiction")}
          >
            Register Department
          </Button>
        </div>

      </div>
    </main>
  )
}