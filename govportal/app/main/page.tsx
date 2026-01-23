"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import TiltedCard from "@/components/decor/TiltedCard"

export default function HomePage() {
  const { setTheme } = useTheme()
  const router = useRouter()
  const [exiting, setExiting] = useState(false)

  const navigateWithFade = (path: string) => {
    setExiting(true)
    setTimeout(() => {
      router.push(path)
    }, 800)
  }

  return (
    <div
      className={`
        relative min-h-screen w-full overflow-x-hidden text-foreground
        transition-opacity duration-700 ease-in-out
        ${exiting ? "opacity-0" : "opacity-100"}
      `}
    >
      {/* FULLSCREEN VIDEO BACKGROUND */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="h-full w-full object-cover opacity-60"
        >
          <source src="/introbgMain.mp4" type="video/mp4" />
        </video>
        {/* Gradient overlay for better text contrast */}
        <div className="absolute inset-0 bg-linear-to-b from-black/40 via-black/20 to-black/60" />
      </div>

      {/* NAVBAR */}
      <nav className="relative z-20 w-full px-6 py-4 md:px-12 md:py-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-4">
            <img 
              src="/RVlogo/logo.png" 
              alt="Logo" 
              className="h-10 md:h-12 w-auto"
            />
            <div className="text-xl md:text-2xl font-black tracking-tighter text-white">
              GOV<span className="text-blue-400">CHAT</span>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/10"
              >
                <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTheme("light")}>Light</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")}>Dark</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("system")}>System</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </nav>

      {/* MAIN CONTENT */}
      <main className="relative z-10 flex min-h-[calc(100vh-80px)] flex-col items-center justify-center px-4 py-12">
        <div className="mx-auto w-full max-w-6xl space-y-12 md:space-y-20 text-center">

          {/* HERO SECTION */}
          <div className="space-y-4 md:space-y-6">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-white">
              Our E-Governance Portal
            </h1>
            <p className="mx-auto max-w-2xl text-base md:text-xl text-white/80">
              Report issues, engage with your community, and track resolutions in real-time.
            </p>
          </div>

          {/* PORTAL CARDS GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10 justify-items-center">
            
            {/* Citizen */}
            <PortalCard 
              title="Citizen Portal"
              desc="Report issues and track progress"
              img="/herocontainer/5.jpg"
              onClick={() => navigateWithFade("/citizen/login")}
            />

            {/* Admin */}
            <PortalCard 
              title="Admin Portal"
              desc="Manage issues and resolve tickets"
              img="/herocontainer/6.jpg"
              onClick={() => navigateWithFade("/admin/home")}
            />

            {/* Handler */}
            <div className="sm:col-span-2 lg:col-span-1">
              <PortalCard 
                title="Handler Portal"
                desc="Direct field operations and updates"
                img="/herocontainer/7.jpg"
                onClick={() => navigateWithFade("/handler/login")}
              />
            </div>
          </div>

          {/* FOOTER */}
          <footer className="pt-8">
            <p className="text-sm font-medium text-white/50">
              Join thousands of citizens improving their community together.
            </p>
          </footer>
        </div>
      </main>
    </div>
  )
}

/**
 * Reusable Card Wrapper to keep the main component clean 
 * and handle the TiltedCard responsive props.
 */
function PortalCard({ title, desc, img, onClick }: { title: string, desc: string, img: string, onClick: () => void }) {
  return (
    <div onClick={onClick} className="group cursor-pointer transition-transform duration-300 hover:scale-[1.02]">
      <TiltedCard
        imageSrc={img}
        altText={title}
        // These widths are slightly reduced to fit mobile screens better
        containerWidth="100%"
        containerHeight="300px"
        imageWidth="300px"
        imageHeight="300px"
        rotateAmplitude={10}
        scaleOnHover={1.05}
        showMobileWarning={false}
        displayOverlayContent
        overlayContent={
          <div className="w-65 rounded-xl bg-black/60 backdrop-blur-lg p-5 text-left border border-white/10 shadow-2xl">
            <h3 className="text-lg font-bold text-white">{title}</h3>
            <p className="mt-1 text-xs text-white/70 leading-relaxed">
              {desc}
            </p>
          </div>
        }
      />
    </div>
  )
}