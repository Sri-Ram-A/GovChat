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
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  ShieldCheck, 
  UserCircle,
  Map as MapIcon,
  ChevronRight
} from "lucide-react"
import { cn } from "@/lib/utils"

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

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
        <div className="flex items-center gap-6">
          <Skeleton className="h-24 w-24 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <Skeleton className="h-40 rounded-2xl" />
          <Skeleton className="h-40 rounded-2xl" />
        </div>
      </div>
    )
  }

  if (!profile) return null;

  const user = profile.user;
  const initials = (user.first_name?.[0] || "" + user.last_name?.[0] || "").toUpperCase() || "U";

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      <div className="max-w-4xl mx-auto px-4 pt-12 space-y-8">
        
        {/* Header / Profile Hero */}
        <section className="relative">
          <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-2xl shadow-slate-200/40 flex flex-col md:flex-row items-center gap-8 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-full -mr-16 -mt-16 blur-2xl" />
            
            <div className="relative">
              <Avatar className="h-28 w-28 ring-4 ring-blue-50 shadow-xl">
                <AvatarImage src="" />
                <AvatarFallback className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white text-3xl font-black">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 bg-green-500 border-4 border-white w-8 h-8 rounded-full flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 text-white" />
              </div>
            </div>

            <div className="text-center md:text-left space-y-2 flex-1">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                  {user.first_name} {user.last_name}
                </h1>
                <Badge variant="secondary" className="bg-blue-50 text-blue-600 border-none px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                  Verified Citizen
                </Badge>
              </div>
              <p className="text-slate-500 font-medium flex items-center justify-center md:justify-start gap-2">
                <UserCircle className="w-4 h-4" />
                @{user.username}
              </p>
            </div>

            <Button variant="outline" className="rounded-xl px-6 border-slate-200" onClick={() => router.push("/citizen/complaints?filter=my")}>
              My Activity <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </section>

        {/* Details Grid */}
        <div className="grid md:grid-cols-2 gap-8">
          
          {/* Contact Information */}
          <Card className="rounded-[28px] border-slate-100 shadow-xl shadow-slate-200/20 overflow-hidden bg-white">
            <CardHeader className="bg-slate-50/30 border-b border-slate-50">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
                Account Details
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <InfoItem icon={Mail} label="Email Address" value={user.email} />
              <InfoItem icon={Phone} label="Phone Number" value={user.phone_number || "Not provided"} />
              <InfoItem icon={Calendar} label="Member Since" value={new Date(user.created_at).toLocaleDateString()} />
            </CardContent>
          </Card>

          {/* Personal Information */}
          <Card className="rounded-[28px] border-slate-100 shadow-xl shadow-slate-200/20 overflow-hidden bg-white">
            <CardHeader className="bg-slate-50/30 border-b border-slate-50">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <User className="w-5 h-5 text-indigo-600" />
                Personal Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <InfoItem icon={User} label="Gender" value={profile.gender === "M" ? "Male" : "Female"} />
              <InfoItem icon={Calendar} label="Date of Birth" value={new Date(profile.date_of_birth).toLocaleDateString()} />
              <InfoItem icon={MapPin} label="Postal Code" value={profile.postal_code} />
            </CardContent>
          </Card>

          {/* Address Information */}
          <Card className="md:col-span-2 rounded-[28px] border-slate-100 shadow-xl shadow-slate-200/20 overflow-hidden bg-white">
            <CardHeader className="bg-slate-50/30 border-b border-slate-50">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <MapIcon className="w-5 h-5 text-emerald-600" />
                Address Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 grid md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <InfoItem icon={MapPin} label="Residential Address" value={profile.address} />
              </div>
              <div className="space-y-6">
                <InfoItem icon={MapPin} label="City / Region" value={`${profile.city}, ${profile.state_province}`} />
              </div>
            </CardContent>
          </Card>

        </div>

      </div>
    </div>
  )
}

function InfoItem({ icon: Icon, label, value }: { icon: any, label: string, value: string }) {
  return (
    <div className="flex items-start gap-4 group">
      <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors shrink-0">
        <Icon className="w-5 h-5" />
      </div>
      <div className="space-y-1">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
        <p className="text-sm font-bold text-slate-900">{value}</p>
      </div>
    </div>
  )
}
