"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { 
  Zap, 
  Shield, 
  Globe, 
  Plus, 
  MoreHorizontal, 
  ArrowRight, 
  AlertTriangle, 
  Droplets, 
  Trash2, 
  Construction,
  Filter,
  Share2,
  Globe2,
  ClipboardList,
  CheckCircle2,
  Clock
} from "lucide-react"
import { REQUEST } from "@/services/api"
import { Complaint } from "@/types"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { 
  Carousel, 
  CarouselContent, 
  CarouselItem, 
  CarouselNext, 
  CarouselPrevious 
} from "@/components/ui/carousel"
import { getStoredToken, clearStoredToken } from "@/services/auth"
import dynamic from "next/dynamic"

const DashboardMap = dynamic(() => import("@/components/reusables/DashboardMap"), { ssr: false })

export default function CitizenHome() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [recentComplaints, setRecentComplaints] = useState<Complaint[]>([])
  const [loadingFeed, setLoadingFeed] = useState(true)

  useEffect(function() {
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
        // Take only the first 3 for the dashboard feed
        setRecentComplaints(res?.slice(0, 3) || [])
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
      console.error("Auth check failed:", error)
      clearStoredToken()
      router.push("/citizen/login")
    }
  }

  if (!isAuthenticated) return null

  return (
    <div className="min-h-screen bg-white">
      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        
        {/* Header Section */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">
              Dashboard Overview
            </span>
            <h1 className="text-4xl font-bold text-slate-900 tracking-tight">
              Welcome, {user?.user?.first_name ? `${user.user.first_name} ${user.user.last_name}` : "Citizen"}
            </h1>
            <p className="text-sm text-slate-500 max-w-md">
              Track your reported issues and discover civic developments across Bangalore in real-time.
            </p>
          </div>
          <Button 
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-6 h-11 flex items-center gap-2 shadow-lg shadow-blue-600/20 transition-all hover:translate-y-[-2px]"
            onClick={function() { router.push("/citizen/post"); }}
            title="Submit a new civic complaint"
          >
            <Plus className="w-4 h-4" />
            File New Complaint
          </Button>
        </header>

        {/* Hero Carousel */}
        <HeroCarousel />

        {/* Quick Categories */}
        <section className="flex flex-wrap items-center gap-3">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-2">
            Quick Categories:
          </span>
          <CategoryButton icon={AlertTriangle} label="Pothole" />
          <CategoryButton icon={Droplets} label="Water Issue" />
          <CategoryButton icon={Zap} label="Electricity" />
          <CategoryButton icon={Trash2} label="Garbage" />
          <CategoryButton icon={Construction} label="Road Damage" />
        </section>

        {/* Main Grid */}
        <div className="grid lg:grid-cols-12 gap-10">
          
          {/* Left Column: Community Feed */}
          <div className="lg:col-span-5 space-y-6">
            <Card className="border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between pb-4 bg-slate-50/30">
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  Community Feed
                </CardTitle>
                <Button variant="ghost" size="icon" className="rounded-full" title="Filter Feed">
                  <Filter className="w-4 h-4 text-slate-400" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-0 p-0">
                {loadingFeed ? (
                  <div className="p-12 text-center text-slate-400">Loading feed...</div>
                ) : recentComplaints.length > 0 ? (
                  recentComplaints.map((complaint, idx) => {
                    const isLast = idx === recentComplaints.length - 1;
                    let StatusIcon = AlertTriangle;
                    let statusColor = "red";
                    
                    if (complaint.status === "RESOLVED" || complaint.status === "CLOSED") {
                      StatusIcon = CheckCircle2;
                      statusColor = "green";
                    } else if (complaint.status === "IN_PROGRESS") {
                      StatusIcon = Clock;
                      statusColor = "orange";
                    }

                    return (
                      <FeedItem 
                        key={complaint.id}
                        icon={StatusIcon} 
                        title={complaint.title} 
                        loc={`${complaint.department || "General"} • ${complaint.city || "Area"}`} 
                        time={new Date(complaint.timestamp).toLocaleDateString()} 
                        status={complaint.status}
                        statusColor={statusColor}
                        isLast={isLast}
                        onClick={() => router.push(`/citizen/complaints/${complaint.id}`)}
                      />
                    )
                  })
                ) : (
                  <div className="p-12 text-center text-slate-400">No recent reports</div>
                )}
                <div className="p-6">
                  <Button 
                    variant="secondary" 
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs h-12 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-slate-900/10"
                    title="Load more community reports"
                    onClick={() => router.push("/citizen/complaints")}
                  >
                    View All Community Reports
                    <ArrowRight className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Map Section */}
          <div className="lg:col-span-7">
            <Card className="border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl h-full overflow-hidden flex flex-col">
              <CardHeader className="flex flex-row items-center justify-between pb-4 bg-slate-50/30">
                <CardTitle className="text-xl font-bold">
                  Complaints Near You
                </CardTitle>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  <span className="text-[10px] font-medium text-slate-400 uppercase">Live Tracking Enabled</span>
                </div>
              </CardHeader>
              <CardContent className="flex-1 p-0 relative min-h-[450px] overflow-hidden">
                <DashboardMap />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Custom Footer */}
        <footer className="pt-16 pb-8 border-t border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="space-y-4">
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tight text-foreground leading-none">GovChat</span>
              <span className="text-[10px] text-slate-400 font-medium">© 2024 GovChat Digital Governance. All rights reserved.</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center md:justify-end gap-6 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            <CustomLink href="/privacy" className="hover:text-blue-600 transition-colors">Privacy Policy</CustomLink>
            <CustomLink href="/terms" className="hover:text-blue-600 transition-colors">Terms of Service</CustomLink>
            <CustomLink href="/contact" className="hover:text-blue-600 transition-colors">Contact Support</CustomLink>
            <CustomLink href="/api" className="hover:text-blue-600 transition-colors">Open Data API</CustomLink>
            <div className="flex items-center gap-4 ml-4">
              <Share2 className="w-4 h-4 cursor-pointer hover:text-slate-900" />
              <Globe2 className="w-4 h-4 cursor-pointer hover:text-slate-900" />
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
      badge: "Infrastructure Repair",
      title: "Active Pothole Restoration in Progress",
      desc: "Major arterial roads are being resurfaced with high-durability asphalt to ensure safer commutes across the city center."
    },
    {
      img: "/grievances/water_fix.png",
      badge: "Water Systems",
      title: "Resolving Critical Water Supply Issues",
      desc: "Technicians are upgrading underground water mains and fixing leakages to stabilize water pressure in residential blocks."
    },
    {
      img: "/grievances/electricity_fix.png",
      badge: "Electrical Grid",
      title: "Ongoing Electrical Grid Maintenance",
      desc: "Maintenance crews are reinforcing high-voltage lines and upgrading transformers to prevent seasonal power outages."
    },
    {
      img: "/grievances/garbage.png",
      badge: "Urban Sanitation",
      title: "Systematic Waste Management Cleanup",
      desc: "Daily specialized cleanup drives are targeting high-density zones to maintain hygiene and environmental standards."
    }
  ];

  return (
    <Carousel className="w-full relative group">
      <CarouselContent>
        {slides.map(function(slide, index) {
          return (
            <CarouselItem key={index}>
              <section className="relative rounded-2xl overflow-hidden aspect-[21/9] md:aspect-[25/8] shadow-2xl">
                <Image
                  src={slide.img}
                  alt={slide.title}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 p-8 md:p-12 space-y-4 max-w-2xl text-left">
                  <Badge className="bg-blue-600 hover:bg-blue-600 text-white border-none rounded-sm px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider">
                    {slide.badge}
                  </Badge>
                  <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
                    {slide.title}
                  </h2>
                  <p className="text-sm md:text-base text-slate-300">
                    {slide.desc}
                  </p>
                  <div className="flex gap-1.5 pt-2">
                    {slides.map(function(_, i) {
                      return (
                        <div key={i} className={cn("w-2 h-2 rounded-full transition-all", i === index ? "bg-white w-6" : "bg-white/40")} />
                      );
                    })}
                  </div>
                </div>
              </section>
            </CarouselItem>
          );
        })}
      </CarouselContent>
      <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 border-none text-white opacity-0 group-hover:opacity-100 transition-opacity z-10" />
      <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 border-none text-white opacity-0 group-hover:opacity-100 transition-opacity z-10" />
    </Carousel>
  );
}

function CategoryButton({ icon: Icon, label }: { icon: any, label: string }) {
  return (
    <Button 
      variant="outline" 
      className="bg-white hover:bg-slate-50 text-slate-600 rounded-full border-slate-200 h-10 px-4 flex items-center gap-2 group shadow-sm transition-all hover:border-slate-300"
      title={`Filter by ${label}`}
    >
      <Icon className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-opacity" />
      <span className="text-xs font-bold">{label}</span>
    </Button>
  )
}

function FeedItem({ icon: Icon, title, loc, time, status, statusColor, isLast, onClick }: any) {
  const colors: any = {
    orange: "bg-orange-100 text-orange-600",
    green: "bg-green-100 text-green-600",
    red: "bg-red-100 text-red-600"
  }
  
  return (
    <div className={cn(
      "p-6 flex items-center justify-between group cursor-pointer transition-colors hover:bg-slate-50/50",
      !isLast && "border-b border-slate-100"
    )} onClick={onClick}>
      <div className="flex gap-4 items-center">
        <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-white group-hover:shadow-md transition-all shrink-0">
          <Icon className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-slate-900">{title}</h4>
          <p className="text-[11px] text-slate-400 font-medium">{loc}</p>
          <span className="text-[10px] text-slate-300 uppercase font-bold tracking-widest">{time}</span>
        </div>
      </div>
      <div className="flex items-center">
        <Badge className={cn("rounded-sm px-2 py-1 text-[8px] uppercase font-black border-none", colors[statusColor])}>
          {status}
        </Badge>
      </div>
    </div>
  )
}

function CustomLink({ href, children, className }: { href: string, children: React.ReactNode, className?: string }) {
  return (
    <a href={href} className={className}>
      {children}
    </a>
  )
}