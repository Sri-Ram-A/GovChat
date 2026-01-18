"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Moon, Sun, ArrowRight, UserCircle, ShieldCheck } from "lucide-react"
import { useTheme } from "next-themes"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export default function HomePage() {
  const { setTheme } = useTheme()

  return (
    <div className="relative min-h-screen overflow-hidden text-foreground">

      {/* FULLSCREEN VIDEO BACKGROUND */}
      <div className="absolute inset-0 -z-10">
        <video
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          className="
            h-full w-full
            object-cover
            opacity-60
          "
        >
          <source src="/introBG.mp4" type="video/mp4" />
        </video>

        {/* soft overlay to improve text contrast */}
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
              <DropdownMenuItem onClick={() => setTheme("light")}>
                Light
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")}>
                Dark
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("system")}>
                System
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </nav>

      {/* MAIN CONTENT */}
      <main className="relative z-10 flex min-h-[calc(100vh-120px)] items-center justify-center">
        <div className="mx-auto max-w-xl space-y-10 px-6 text-center">

          {/* HERO */}
          <div className="space-y-3">
            <h1 className="text-5xl font-bold text-white">
              E-Governance Portal
            </h1>
            <p className="text-lg text-white/80">
              Report issues, engage with community, track resolutions
            </p>
          </div>

          {/* GLASS ACTION CARDS */}
          <div className="flex flex-col gap-5">
            {/* Citizen */}
            <Link href="/citizen/login">
              <div
                className="
                  group cursor-pointer
                  rounded-2xl
                  bg-white/15
                  backdrop-blur-xl
                  border border-white/20
                  shadow-xl
                  p-6
                  transition-all
                  hover:bg-white/20
                "
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/30">
                      <UserCircle className="h-6 w-6 text-blue-200" />
                    </div>
                    <div className="text-left">
                      <h3 className="text-lg font-semibold text-white">
                        Continue as Citizen
                      </h3>
                      <p className="text-sm text-white/70">
                        Report issues, join discussions, track progress
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-white/70 transition-all group-hover:translate-x-1 group-hover:text-white" />
                </div>
              </div>
            </Link>

            {/* Admin */}
            <Link href="/admin/home">
              <div
                className="
                  group cursor-pointer
                  rounded-2xl
                  bg-white/15
                  backdrop-blur-xl
                  border border-white/20
                  shadow-xl
                  p-6
                  transition-all
                  hover:bg-white/20
                "
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/30">
                      <ShieldCheck className="h-6 w-6 text-emerald-200" />
                    </div>
                    <div className="text-left">
                      <h3 className="text-lg font-semibold text-white">
                        Admin Portal
                      </h3>
                      <p className="text-sm text-white/70">
                        Manage issues, resolve tickets, update status
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-white/70 transition-all group-hover:translate-x-1 group-hover:text-white" />
                </div>
              </div>
            </Link>
          </div>

          {/* FOOTER TEXT */}
          <p className="text-sm text-white/60">
            Join thousands of citizens improving their community
          </p>
        </div>
      </main>
    </div>
  )
}
