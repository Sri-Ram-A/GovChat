"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { ChevronRight, ChevronLeft, X, Sparkles, Command } from "lucide-react";
import { Button } from "@/components/ui/button";
import { REQUEST, setOnboardingNeeded } from "@/services/api";

interface Step {
  targetId: string;
  title: string;
  description: string;
  badge?: string;
}

const STEPS: Step[] = [
  {
    targetId: "tour-services",
    title: "Government Services",
    description: "Access all digital services provided by your local authorities in one centralized menu.",
    badge: "Core Feature"
  },
  {
    targetId: "tour-file-complaint",
    title: "Report an Issue",
    description: "Submit complaints with photos and location data. Our AI helps route them to the right department.",
    badge: "Action"
  },
  {
    targetId: "tour-my-complaints",
    title: "Resolution Tracker",
    description: "Monitor the real-time progress of your submitted issues and communicate with handlers.",
    badge: "Monitoring"
  },
  {
    targetId: "tour-view-map",
    title: "Community Insights",
    description: "Visualize local concerns on an interactive map to see what's happening in your area.",
    badge: "Insights"
  },
  {
    targetId: "tour-need-help",
    title: "AI Assistant",
    description: "Stuck? Our AI chatbot can help you navigate the portal and answer governance questions.",
    badge: "Support"
  },
  {
    targetId: "tour-resources",
    title: "Knowledge Base",
    description: "Find legal guidelines, frequently asked questions, and official announcements.",
    badge: "Information"
  },
  {
    targetId: "tour-guidelines",
    title: "Community Rules",
    description: "Learn about the standards for filing complaints and community engagement.",
  },
  {
    targetId: "tour-faqs",
    title: "Quick Answers",
    description: "Resolve common queries instantly without having to wait for support responses.",
  },
  {
    targetId: "tour-hero",
    title: "Your Command Center",
    description: "Welcome to your personal governance portal. You're now ready to make an impact.",
    badge: "Welcome"
  }
];

export function SpotlightTour({ onComplete }: { onComplete: () => void }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, height: 0 });
  const [isExiting, setIsExiting] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const updateCoords = useCallback(() => {
    const target = document.getElementById(STEPS[currentStep].targetId);
    if (target) {
      if (STEPS[currentStep].targetId.startsWith("tour-file") || 
          STEPS[currentStep].targetId.startsWith("tour-my") || 
          STEPS[currentStep].targetId.startsWith("tour-view-map") || 
          STEPS[currentStep].targetId.startsWith("tour-need")) {
        document.body.classList.add("tour-force-services");
      } else if (STEPS[currentStep].targetId.startsWith("tour-guidelines") || 
                 STEPS[currentStep].targetId.startsWith("tour-faqs") || 
                 STEPS[currentStep].targetId.startsWith("tour-contact") || 
                 STEPS[currentStep].targetId.startsWith("tour-announcements")) {
        document.body.classList.add("tour-force-resources");
      } else {
        document.body.classList.remove("tour-force-services", "tour-force-resources");
      }

      const rect = target.getBoundingClientRect();
      setCoords({
        top: rect.top + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
        height: rect.height
      });
      
      target.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [currentStep]);

  useEffect(() => {
    const timer = setTimeout(updateCoords, 150);
    window.addEventListener("resize", updateCoords);
    window.addEventListener("scroll", updateCoords);
    setIsVisible(true);
    return () => {
      window.removeEventListener("resize", updateCoords);
      window.removeEventListener("scroll", updateCoords);
      clearTimeout(timer);
    };
  }, [updateCoords]);

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleFinish();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleFinish = async () => {
    setIsExiting(true);
    document.body.classList.remove("tour-force-services", "tour-force-resources");
    try {
      await REQUEST("POST", "citizens/complete-onboarding/");
      setOnboardingNeeded(false);
      setTimeout(onComplete, 500);
    } catch (error) {
      setOnboardingNeeded(false);
      setTimeout(onComplete, 500);
    }
  };

  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleFinish();
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "ArrowLeft") handleBack();
    };
    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [currentStep]);

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      {!isExiting && (
        <div className="fixed inset-0 z-[9999] pointer-events-none font-sans">
          {/* Overlay with Cutout */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-zinc-950/80 pointer-events-auto backdrop-blur-[2px]"
            style={{
              clipPath: `polygon(0% 0%, 0% 100%, ${coords.left}px 100%, ${coords.left}px ${coords.top}px, ${coords.left + coords.width}px ${coords.top}px, ${coords.left + coords.width}px ${coords.top + coords.height}px, ${coords.left}px ${coords.top + coords.height}px, ${coords.left}px 100%, 100% 100%, 100% 0%)`
            }}
          />

          {/* Highlight Ring */}
          <motion.div
            animate={{
              top: coords.top - 8,
              left: coords.left - 8,
              width: coords.width + 16,
              height: coords.height + 16,
            }}
            transition={{ type: "spring", stiffness: 200, damping: 25 }}
            className="absolute border-[3px] border-orange-500/50 rounded-xl pointer-events-none"
          >
             <div className="absolute inset-0 rounded-xl border border-orange-400 shadow-[0_0_20px_rgba(249,115,22,0.6)] animate-pulse" />
          </motion.div>

          {/* Tooltip Card */}
          <motion.div
            ref={tooltipRef}
            animate={{
              top: coords.top + coords.height + 24,
              left: Math.min(window.innerWidth - 380, Math.max(20, coords.left + coords.width / 2 - 180)),
            }}
            transition={{ type: "spring", stiffness: 200, damping: 25 }}
            className="absolute w-[360px] bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] pointer-events-auto"
          >
            <div className="p-6 space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="bg-orange-500/20 p-1.5 rounded-lg">
                    <Command className="w-4 h-4 text-orange-400" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
                    Step {currentStep + 1} of {STEPS.length}
                  </span>
                </div>
                <button 
                  onClick={handleFinish}
                  className="p-1.5 rounded-full hover:bg-white/5 text-zinc-500 hover:text-white transition-all group"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold text-white tracking-tight">
                    {STEPS[currentStep].title}
                  </h3>
                  {STEPS[currentStep].badge && (
                    <span className="px-2 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-[9px] font-bold text-orange-400 uppercase tracking-wider">
                      {STEPS[currentStep].badge}
                    </span>
                  )}
                </div>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  {STEPS[currentStep].description}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex gap-1">
                  {STEPS.map((_, i) => (
                    <div 
                      key={i}
                      className={`h-1 rounded-full transition-all duration-300 ${
                        i === currentStep ? "w-4 bg-orange-500" : "w-1 bg-zinc-700"
                      }`}
                    />
                  ))}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleBack}
                    disabled={currentStep === 0}
                    className="h-9 px-3 text-zinc-400 hover:text-white hover:bg-white/5"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleNext}
                    className="h-9 px-5 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-lg shadow-lg shadow-orange-900/20 active:scale-95 transition-all"
                  >
                    {currentStep === STEPS.length - 1 ? (
                      <span className="flex items-center gap-2">
                        Get Started <Sparkles className="w-3.5 h-3.5" />
                      </span>
                    ) : "Next Step"}
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Arrow */}
            <div 
              className="absolute -top-2 w-4 h-4 bg-zinc-900 rotate-45 border-l border-t border-white/10"
              style={{ left: `${Math.max(24, Math.min(316, coords.left + coords.width/2 - (Math.min(window.innerWidth - 380, Math.max(20, coords.left + coords.width / 2 - 180)))))}px` }}
            />
          </motion.div>

          <style jsx global>{`
            .tour-force-services #tour-services + div,
            .tour-force-services #tour-services ~ div,
            .tour-force-resources #tour-resources + div,
            .tour-force-resources #tour-resources ~ div {
              opacity: 1 !important;
              visibility: visible !important;
              transform: translateY(0) !important;
              box-shadow: 0 20px 40px rgba(0,0,0,0.4) !important;
              border: 1px solid rgba(255,255,255,0.1) !important;
            }
            body.tour-force-services,
            body.tour-force-resources {
              overflow: hidden;
            }
          `}</style>
        </div>
      )}
    </AnimatePresence>
  );
}
