"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import dynamic from "next/dynamic"
import {
  Zap,
  Plus,
  ArrowRight,
  AlertTriangle,
  Droplets,
  Trash2,
  Construction,
  Filter,
  Share2,
  Globe2,
  CheckCircle2,
  Clock,
  MapPin,
  ChevronRight
} from "lucide-react"

import { REQUEST } from "@/services/api"
import { Complaint } from "@/types"
import { getStoredToken, clearStoredToken } from "@/services/auth"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious
} from "@/components/ui/carousel"
import { cn } from "@/lib/utils"

const DashboardMap = dynamic(() => import("@/components/reusables/DashboardMap"), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-muted animate-pulse flex items-center justify-center text-muted-foreground text-sm">Loading Map...</div>
})

export default function CitizenHome() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [recentComplaints, setRecentComplaints] = useState<Complaint[]>([])
  const [loadingFeed, setLoadingFeed] = useState(true)

  useEffect(() => {
    checkAuth()
    fetchUserData()
    fetchFeedData()
  }, [])

  async function fetchUserData() {
    const token = getStoredToken()
    if (token) {
      REQUEST("GET", "citizens/me/")
        .then((res: any) => setUser(res))
        .catch(console.error)
    }
  }

  async function fetchFeedData() {
    setLoadingFeed(true)
    REQUEST("GET", "citizens/complaints/all/")
      .then((res: any) => {
        setRecentComplaints(res?.slice(0, 4) || [])
      })
      .catch(console.error)
      .finally(() => setLoadingFeed(false))
  }

  async function checkAuth() {
    try {
      const token = getStoredToken()
      if (!token) {
        router.push("/citizen/login")
        return
      }
      setIsAuthenticated(true)
    } catch (error) {
      clearStoredToken()
      router.push("/citizen/login")
    }
  }

  if (!isAuthenticated) return null

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="container max-w-7xl mx-auto px-4 py-6 md:py-10 space-y-8">

        {/* Header Section */}
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b pb-6">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
              Welcome back, {user?.user?.first_name || "Citizen"}
            </h1>
            <p className="text-sm text-muted-foreground">
              Monitor local infrastructure and community reports in real-time.
            </p>
          </div>
          <Button
            size="lg"
            className="w-full md:w-auto font-medium"
            onClick={() => router.push("/citizen/post")}
          >
            <Plus className="mr-2 h-4 w-4" />
            File New Complaint
          </Button>
        </header>

        {/* Hero Carousel - Modernized with better aspect ratios */}
        <HeroCarousel />

        {/* Quick Categories - Semantic ghost buttons */}
        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Quick Filters</h2>
          <div className="flex flex-wrap gap-2">
            <CategoryButton icon={AlertTriangle} label="Pothole" />
            <CategoryButton icon={Droplets} label="Water" />
            <CategoryButton icon={Zap} label="Electricity" />
            <CategoryButton icon={Trash2} label="Garbage" />
            <CategoryButton icon={Construction} label="Roads" />
          </div>
        </section>

        {/* Main Grid: Responsive 12-column grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Left Column: Community Feed */}
          <Card className="lg:col-span-5 flex flex-col shadow-none border-border/60">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-lg">Community Feed</CardTitle>
                <CardDescription>Latest reported issues near you</CardDescription>
              </div>
              <Button variant="outline" size="icon" className="h-8 w-8">
                <Filter className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="p-0 flex-1">
              {loadingFeed ? (
                <div className="p-8 text-center text-sm text-muted-foreground">Loading feed...</div>
              ) : recentComplaints.length > 0 ? (
                <div className="divide-y divide-border">
                  {recentComplaints.map((complaint) => (
                    <FeedItem
                      key={complaint.id}
                      complaint={complaint}
                      onClick={() => router.push(`/citizen/complaints/${complaint.id}`)}
                    />
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-sm text-muted-foreground">No recent reports found.</div>
              )}
            </CardContent>
            <div className="p-4 bg-muted/30 border-t mt-auto">
              <Button
                variant="ghost"
                className="w-full justify-between font-medium group"
                onClick={() => router.push("/citizen/complaints")}
              >
                View all reports
                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </div>
          </Card>

          {/* Right Column: Map Section */}
          <Card className="lg:col-span-7 shadow-none border-border/60 overflow-hidden min-h-[400px] md:min-h-full">
            <CardHeader className="border-b bg-muted/20">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  Live Map View
                </CardTitle>
                <Badge variant="outline" className="bg-background gap-1.5 font-medium">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Updates
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0 h-full min-h-[400px]">
              <DashboardMap />
            </CardContent>
          </Card>
        </div>

        {/* Professional Footer */}
        <footer className="pt-10 pb-6 border-t">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-1">
              <p className="text-lg font-semibold tracking-tight">GovChat</p>
              <p className="text-xs text-muted-foreground">© 2024 Digital Governance Initiative.</p>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              <FooterLink href="/privacy">Privacy</FooterLink>
              <FooterLink href="/terms">Terms</FooterLink>
              <FooterLink href="/contact">Support</FooterLink>
              <FooterLink href="/api">Open Data</FooterLink>
            </div>
            <div className="flex items-center gap-4 text-muted-foreground">
              <Share2 className="h-4 w-4 cursor-pointer hover:text-foreground transition-colors" />
              <Globe2 className="h-4 w-4 cursor-pointer hover:text-foreground transition-colors" />
            </div>
          </div>
        </footer>
      </main>
    </div>
  )
}

function HeroCarousel() {
  const slides = [
    {
      img: "/grievances/pothole_fix.png",
      badge: "Infrastructure",
      title: "Active Pothole Restoration",
      desc: "Major arterial roads are being resurfaced across the city center."
    },
    {
      img: "/grievances/water_fix.png",
      badge: "Utilities",
      title: "Water Supply Upgrades",
      desc: "Fixing underground mains to stabilize pressure in residential blocks."
    }
  ];

  return (
    <Carousel className="w-full" opts={{ loop: true }}>
      <CarouselContent>
        {slides.map((slide, index) => (
          <CarouselItem key={index}>
            <div className="relative aspect-[16/9] md:aspect-[21/7] overflow-hidden rounded-lg border">
              <Image
                src={slide.img}
                alt={slide.title}
                fill
                className="object-cover"
                priority={index === 0}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent" />
              <div className="absolute inset-0 flex flex-col justify-center p-6 md:p-12 text-white max-w-xl space-y-3">
                <Badge className="w-fit bg-primary text-primary-foreground border-none">
                  {slide.badge}
                </Badge>
                <h2 className="text-2xl md:text-4xl font-bold tracking-tight">
                  {slide.title}
                </h2>
                <p className="text-sm md:text-base text-zinc-200 line-clamp-2">
                  {slide.desc}
                </p>
              </div>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="hidden md:flex left-4" />
      <CarouselNext className="hidden md:flex right-4" />
    </Carousel>
  );
}

function CategoryButton({ icon: Icon, label }: { icon: any, label: string }) {
  return (
    <Button
      variant="secondary"
      size="sm"
      className="h-9 rounded-md px-4 font-medium border border-transparent hover:border-border transition-all"
    >
      <Icon className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
      {label}
    </Button>
  )
}

function FeedItem({ complaint, onClick }: { complaint: Complaint, onClick: () => void }) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case "RESOLVED":
      case "CLOSED":
        return { icon: CheckCircle2, color: "text-emerald-600 bg-emerald-50 border-emerald-100" };
      case "IN_PROGRESS":
        return { icon: Clock, color: "text-amber-600 bg-amber-50 border-amber-100" };
      default:
        return { icon: AlertTriangle, color: "text-destructive bg-destructive/5 border-destructive/10" };
    }
  }

  const { icon: StatusIcon, color } = getStatusConfig(complaint.status);

  return (
    <div
      className="p-4 flex items-start justify-between hover:bg-muted/40 transition-colors cursor-pointer"
      onClick={onClick}
    >
      <div className="flex gap-4">
        <div className="mt-1 h-9 w-9 rounded-md bg-muted flex items-center justify-center shrink-0">
          <StatusIcon className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-semibold leading-none">{complaint.title}</h4>
          <p className="text-xs text-muted-foreground">
            {complaint.department || "General"} • {complaint.city || "Area"}
          </p>
          <p className="text-[10px] font-medium text-muted-foreground/70 uppercase">
            {new Date(complaint.timestamp).toLocaleDateString()}
          </p>
        </div>
      </div>
      <Badge variant="outline" className={cn("text-[10px] font-bold uppercase py-0", color)}>
        {complaint.status}
      </Badge>
    </div>
  )
}

function FooterLink({ href, children }: { href: string, children: React.ReactNode }) {
  return (
    <a href={href} className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors">
      {children}
    </a>
  )
}