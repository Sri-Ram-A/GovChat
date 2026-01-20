"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import TiltedCard from "@/components/TiltedCard"

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
        relative min-h-screen overflow-hidden text-foreground
        transition-opacity duration-800
        ${exiting ? "opacity-0" : "opacity-100"}
      `}
    >
      {/* FULLSCREEN VIDEO BACKGROUND */}
      <div className="absolute inset-0 -z-10">
        <video
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          className="h-full w-full object-cover opacity-60"
        >
          <source src="/introbgMain.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/30" />
      </div>

      {/* NAVBAR */}
      <nav className="relative z-20 px-8 py-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="text-2xl font-bold">GOVCHAT</div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full bg-white/10 backdrop-blur-md"
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
      <main className="relative z-10 flex min-h-[calc(100vh-120px)] items-center justify-center">
        <div className="mx-auto max-w-5xl space-y-14 px-6 text-center">

          {/* HERO */}
          <div className="space-y-3">
            <h1 className="text-5xl font-bold text-white">
              Our E-Governance Portal
            </h1>
            <p className="text-lg text-white/80">
              Report issues, engage with community, track resolutions
            </p>
          </div>

          {/* TITLE CARDS */}
          <div className="flex flex-col md:flex-row justify-center gap-10">

            {/* Citizen */}
            <div onClick={() => navigateWithFade("/citizen/login")} className="cursor-pointer">
              <TiltedCard
                imageSrc="/herocontainer/5.jpg"
                altText="Citizen Portal"
                containerWidth="320px"
                containerHeight="320px"
                imageWidth="320px"
                imageHeight="320px"
                rotateAmplitude={12}
                scaleOnHover={1.06}
                showMobileWarning={false}
                displayOverlayContent
                overlayContent={
                  <div className="rounded-lg bg-black/55 backdrop-blur-md p-4 text-white">
                    <h3 className="text-xl font-semibold">Citizen Portal</h3>
                    <p className="text-sm text-white/80">
                      Report issues, join discussions, track progress
                    </p>
                  </div>
                }
              />
            </div>

            {/* Admin */}
            <div onClick={() => navigateWithFade("/admin/home")} className="cursor-pointer">
              <TiltedCard
                imageSrc="/herocontainer/6.jpg"
                altText="Admin Portal"
                containerWidth="320px"
                containerHeight="320px"
                imageWidth="320px"
                imageHeight="320px"
                rotateAmplitude={12}
                scaleOnHover={1.06}
                showMobileWarning={false}
                displayOverlayContent
                overlayContent={
                  <div className="rounded-lg bg-black/55 backdrop-blur-md p-4 text-white">
                    <h3 className="text-xl font-semibold">Admin Portal</h3>
                    <p className="text-sm text-white/80">
                      Manage issues, resolve tickets, update status
                    </p>
                  </div>
                }
              />
            </div>

            {/* Handler */}
            <div onClick={() => navigateWithFade("/handler/login")} className="cursor-pointer">
              <TiltedCard
                imageSrc="/herocontainer/7.jpg"
                altText="Handler Portal"
                containerWidth="320px"
                containerHeight="320px"
                imageWidth="320px"
                imageHeight="320px"
                rotateAmplitude={12}
                scaleOnHover={1.06}
                showMobileWarning={false}
                displayOverlayContent
                overlayContent={
                  <div className="rounded-lg bg-black/55 backdrop-blur-md p-4 text-white">
                    <h3 className="text-xl font-semibold">Handler Portal</h3>
                    <p className="text-sm text-white/80">
                      Manage issues and help society
                    </p>
                  </div>
                }
              />
            </div>

          </div>

          {/* FOOTER */}
          <p className="text-sm text-white/60">
            Join thousands of citizens improving their community
          </p>
        </div>
      </main>
    </div>
  )
}
