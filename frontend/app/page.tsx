"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Moon, Sun, Shield, ChevronDown, User, Users, ShieldCheck, Wrench, Building2, ArrowRight } from "lucide-react"
import { useTheme } from "next-themes"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { motion } from "framer-motion"

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
          <div className="flex items-center gap-2 text-xl md:text-2xl font-black tracking-tighter text-white">
            <div className="p-1.5 rounded-lg bg-blue-500 text-white">
              <Shield className="h-6 w-6" />
            </div>
            GOV<span className="text-blue-400">CHAT</span>
          </div>



          <div className="flex items-center gap-4">
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
        </div>
      </nav>

      {/* MAIN CONTENT */}
      <main className="relative z-10 flex min-h-[calc(100vh-80px)] flex-col items-center justify-center px-4 py-12">
        <div className="mx-auto w-full space-y-12 md:space-y-20 text-center">

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
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-10">

            {/* Citizen */}
            <PortalCard
              title="Citizen Portal"
              desc="Report issues and track progress"
              img="/herocontainer/5.jpg"
              icon={<Users className="h-6 w-6" />}
              onClick={() => navigateWithFade("/citizen/login")}
            />

            {/* Admin */}
            <PortalCard
              title="Admin Portal"
              desc="Manage issues and resolve tickets"
              img="/herocontainer/6.jpg"
              icon={<ShieldCheck className="h-6 w-6" />}
              onClick={() => navigateWithFade("/admin/login")}
            />

            {/* Handler Portal */}
            <PortalCard
              title="Handler Portal"
              desc="Direct field operations and service handling"
              img="/herocontainer/7.jpg"
              icon={<Wrench className="h-6 w-6" />}
              onClick={() => navigateWithFade("/handler/login")}
            />

            {/* Department Registration */}
            <PortalCard
              title="Add Department"
              desc="Register and onboard new administrative units"
              img="/grievances/electricity_fix.png"
              icon={<Building2 className="h-6 w-6" />}
              onClick={() => navigateWithFade("/admin/jurisdiction")}
            />
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
 * Reusable Card Wrapper with a professional, premium glassmorphic design.
 */
function PortalCard({ title, desc, img, icon, onClick }: { title: string, desc: string, img: string, icon: React.ReactNode, onClick: () => void }) {
  return (
    <motion.div
      whileHover={{ y: -10 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      onClick={onClick}
      className="group relative w-full max-w-[320px] h-[400px] cursor-pointer overflow-hidden rounded-2xl border border-white/10 bg-black/20 backdrop-blur-sm shadow-2xl transition-all duration-300 hover:border-blue-500/50 hover:shadow-blue-500/10"
    >
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src={img}
          alt={title}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-60"
        />
        <div className="absolute inset-0 bg-linear-to-b from-transparent via-black/20 to-black/90" />
      </div>

      {/* Content */}
      <div className="absolute inset-0 z-10 flex flex-col justify-end p-6 text-left">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/20 text-blue-400 backdrop-blur-md border border-blue-500/30 transition-transform duration-500 group-hover:scale-110 group-hover:bg-blue-500 group-hover:text-white">
          {icon}
        </div>

        <h3 className="text-2xl font-bold text-white tracking-tight group-hover:text-blue-400 transition-colors">
          {title}
        </h3>
        <p className="mt-2 text-sm text-white/60 leading-relaxed line-clamp-2">
          {desc}
        </p>

        <div className="mt-6 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-blue-400 opacity-0 transform translate-y-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0">
          Enter Portal <ArrowRight className="h-4 w-4" />
        </div>
      </div>
    </motion.div>
  )
}