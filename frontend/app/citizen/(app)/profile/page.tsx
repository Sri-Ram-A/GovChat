"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { REQUEST } from "@/services/api"
import { getStoredToken } from "@/services/auth"
import { CitizenProfile } from "@/types"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  ShieldCheck, 
  Fingerprint,
  Map as MapIcon,
  ChevronRight,
  Settings,
  History
} from "lucide-react"

export default function ProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<CitizenProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!getStoredToken()) {
      router.push("/citizen/login")
      return
    }

    REQUEST("GET", "citizens/me/")
      .then((res: any) => setProfile(res))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <ProfileSkeleton />
  if (!profile) return null;

  const user = profile.user;
  const initials = `${user.first_name?.[0] || ""}${user.last_name?.[0] || ""}`.toUpperCase() || "U";

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      <div className="max-w-4xl mx-auto px-4 pt-10 space-y-8">
        
        {/* Profile Hero Section */}
        <section className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="relative">
              <Avatar className="h-24 w-24 border-2 border-background shadow-sm">
                <AvatarImage src="" />
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 bg-background p-1 rounded-full border shadow-sm">
                <ShieldCheck className="w-5 h-5 text-primary" />
              </div>
            </div>

            <div className="text-center md:text-left space-y-1.5">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                <h1 className="text-2xl font-bold tracking-tight">
                  {user.first_name} {user.last_name}
                </h1>
                <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 font-medium">
                  Verified
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground flex items-center justify-center md:justify-start gap-2">
                <Fingerprint className="w-4 h-4" />
                @{user.username}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button  size="sm" onClick={() => router.push("/citizen/complaints?filter=my")}>
              <History className="w-4 h-4 mr-2" />
              History
            </Button>
          </div>
        </section>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Main Details */}
          <div className="md:col-span-2 space-y-6">
            <Card className="shadow-none border-border/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold uppercase tracking-wider text-muted-foreground">
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="grid sm:grid-cols-2 gap-y-6 gap-x-4">
                <InfoItem icon={User} label="Gender" value={profile.gender === "M" ? "Male" : "Female"} />
                <InfoItem icon={Calendar} label="Date of Birth" value={new Date(profile.date_of_birth).toLocaleDateString()} />
                <InfoItem icon={Mail} label="Email Address" value={user.email} />
                <InfoItem icon={Phone} label="Phone Number" value={user.phone_number || "Not provided"} />
              </CardContent>
            </Card>

            <Card className="shadow-none border-border/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold uppercase tracking-wider text-muted-foreground">
                  Location Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 mt-1 text-muted-foreground" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{profile.address}</p>
                    <p className="text-sm text-muted-foreground">
                      {profile.city}, {profile.state_province} — {profile.postal_code}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Side Stats/Meta Card */}
          <div className="space-y-6">
            <Card className="shadow-none bg-muted/30 border-dashed">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Account Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Registered</span>
                  <span className="font-medium">{new Date(user.created_at).toLocaleDateString()}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Citizen Tier</span>
                  <Badge variant="secondary">Standard</Badge>
                </div>
                <div className="pt-2">
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    As a verified citizen, you can upvote community reports and receive priority updates on local infrastructure.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

        </div>

      </div>
    </div>
  )
}

function InfoItem({ icon: Icon, label, value }: { icon: any, label: string, value: string }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="w-3.5 h-3.5" />
        <span className="text-xs font-medium uppercase tracking-tight">{label}</span>
      </div>
      <p className="text-sm font-semibold">{value}</p>
    </div>
  )
}

function ProfileSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
      <div className="flex flex-col md:flex-row items-center gap-6 pb-6 border-b">
        <Skeleton className="h-24 w-24 rounded-full" />
        <div className="space-y-3 flex-1 text-center md:text-left">
          <Skeleton className="h-8 w-64 mx-auto md:mx-0" />
          <Skeleton className="h-4 w-48 mx-auto md:mx-0" />
        </div>
      </div>
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    </div>
  )
}