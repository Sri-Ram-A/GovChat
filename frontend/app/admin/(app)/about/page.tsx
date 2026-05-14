"use client"

import React from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { 
  ShieldCheck, 
  Zap, 
  Users, 
  Globe, 
  ArrowRight, 
  CheckCircle2,
  Cpu,
  BarChart3,
  MessageSquareText
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function AdminAboutPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-20 space-y-32">
        
        {/* Hero Section */}
        <section className="text-center space-y-8 max-w-4xl mx-auto">
          <div className="space-y-4">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-[0.2em] animate-fade-in">
              Comprehensive Project Overview
            </span>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-slate-900 leading-[1.1]">
              The GovChat <br className="hidden md:block" /> 
              Project.
            </h1>
            <p className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed">
              GovChat is a next-generation grievance management platform designed to bridge the gap between citizens and municipal authorities through transparency and real-time accountability.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-4 pt-4">
            <Button 
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-8 h-12 shadow-lg shadow-blue-600/20"
              onClick={function() { router.push("/admin/home"); }}
            >
              Go to Dashboard
            </Button>
            <Button 
              variant="outline" 
              className="rounded-full px-8 h-12 border-slate-200"
              onClick={function() { router.push("/resources/contact"); }}
            >
              Contact Support
            </Button>
          </div>
        </section>

        {/* Vision & Values */}
        <section id="vision" className="grid lg:grid-cols-2 gap-20 items-center">
          <div className="relative rounded-3xl overflow-hidden shadow-2xl aspect-square lg:aspect-video">
            <Image
              src="/herocontainer/1.png"
              alt="System Visualization"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-blue-600/10 mix-blend-multiply" />
          </div>
          <div className="space-y-10">
            <div className="space-y-4">
              <h2 className="text-3xl font-bold tracking-tight">Our Core Vision</h2>
              <p className="text-slate-500 leading-relaxed">
                We believe that every citizen deserves a voice that is heard, not just recorded. Our system is built on the foundation of immediate responsiveness and radical transparency.
              </p>
            </div>
            
            <div className="grid sm:grid-cols-2 gap-8">
              <ValueItem 
                icon={ShieldCheck} 
                title="Trust" 
                desc="Verified reporting ensures data integrity and prevents misuse." 
              />
              <ValueItem 
                icon={Zap} 
                title="Speed" 
                desc="Automated routing reduces response time by up to 60%." 
              />
              <ValueItem 
                icon={Users} 
                title="Community" 
                desc="A shared platform for collective urban improvement." 
              />
              <ValueItem 
                icon={Globe} 
                title="Inclusion" 
                desc="Multi-lingual support for every strata of society." 
              />
            </div>
          </div>
        </section>

        {/* Feature Highlights */}
        <section id="how-it-works" className="space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-bold tracking-tight">How it Works</h2>
            <p className="text-slate-500 max-w-xl mx-auto">
              Our sophisticated backend handles complex routing so you only focus on the solution.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={Cpu}
              title="AI Grievance Routing"
              desc="Machine learning models automatically categorize and route your complaints to the specific department responsible."
            />
            <FeatureCard 
              icon={BarChart3}
              title="Real-time Analytics"
              desc="Transparent dashboards show live resolution metrics, heatmaps of issues, and department performance scores."
            />
            <FeatureCard 
              icon={MessageSquareText}
              title="Gov Services AI"
              desc="A conversational assistant that helps you navigate complex government procedures and service requests instantly."
            />
          </div>
        </section>

        {/* Impact Section */}
        <section id="impact" className="bg-slate-900 rounded-[3rem] p-12 md:p-20 text-white relative overflow-hidden">
          <div className="relative z-10 grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight">Making a Tangible Impact on Urban Life.</h2>
              <ul className="space-y-6">
                <ImpactLink text="Reduction in unresolved civic complaints" />
                <ImpactLink text="Faster coordination between municipal departments" />
                <ImpactLink text="Enhanced accountability of public service officers" />
                <ImpactLink text="Direct line of communication with local leaders" />
              </ul>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-6">
                <StatCard val="50k+" label="Complaints Resolved" />
                <StatCard val="24/7" label="Active Monitoring" />
              </div>
              <div className="space-y-6 pt-12">
                <StatCard val="15+" label="Municipal Depts" />
                <StatCard val="4.8/5" label="User Satisfaction" />
              </div>
            </div>
          </div>
          {/* Decorative background element */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/20 blur-[120px] rounded-full" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-600/10 blur-[100px] rounded-full" />
        </section>

      </main>
    </div>
  )
}

function ValueItem({ icon: Icon, title, desc }: any) {
  return (
    <div className="space-y-3">
      <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
        <Icon className="w-5 h-5" />
      </div>
      <h3 className="font-bold text-lg">{title}</h3>
      <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
    </div>
  )
}

function FeatureCard({ icon: Icon, title, desc }: any) {
  return (
    <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl p-8 transition-all hover:translate-y-[-5px] hover:shadow-xl">
      <CardContent className="p-0 space-y-6">
        <div className="w-14 h-14 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-lg shadow-slate-900/20">
          <Icon className="w-6 h-6" />
        </div>
        <div className="space-y-3">
          <h3 className="text-xl font-bold">{title}</h3>
          <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function ImpactLink({ text }: { text: string }) {
  return (
    <li className="flex items-center gap-3 text-slate-300">
      <CheckCircle2 className="w-5 h-5 text-blue-400 shrink-0" />
      <span className="text-lg">{text}</span>
    </li>
  )
}

function StatCard({ val, label }: { val: string, label: string }) {
  return (
    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-8 text-center space-y-1">
      <div className="text-4xl font-bold tracking-tight">{val}</div>
      <div className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">{label}</div>
    </div>
  )
}
