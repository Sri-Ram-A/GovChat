'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown, Zap, Shield, Globe } from 'lucide-react'
import LightPillar from '@/components/decor/LightPillar'

type Phase = 'black' | 'fadeInHero' | 'heroIdle' | 'heroExit' | 'cardsFadeIn' | 'cardsIdle' | 'cardsExit' | 'navigate'

export default function HeroPage() {
  const router = useRouter()
  const [phase, setPhase] = useState<Phase>('black')
  const [showHeroNext, setShowHeroNext] = useState(false)
  const [showCardsNext, setShowCardsNext] = useState(false)
  const heroExitedRef = useRef(false)

  const HERO_FADE_IN_DELAY = 1000
  const HERO_FADE_IN_DURATION = 6000
  const HERO_ZOOM_DURATION = 3000
  const CARDS_FADE_DURATION = 2000

  useEffect(() => {
    const t = setTimeout(() => setPhase('fadeInHero'), HERO_FADE_IN_DELAY)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (phase === 'heroIdle') {
      const t = setTimeout(() => setShowHeroNext(true), 2000)
      return () => clearTimeout(t)
    }
    setShowHeroNext(false)
  }, [phase])

  const onHeroNext = () => {
    if (phase !== 'heroIdle' || heroExitedRef.current) return
    heroExitedRef.current = true
    setPhase('heroExit')
    setTimeout(() => {
      setPhase('cardsFadeIn')
    }, HERO_ZOOM_DURATION)
  }

  useEffect(() => {
    if (phase === 'cardsIdle') {
      const t = setTimeout(() => setShowCardsNext(true), 5000)
      return () => clearTimeout(t)
    }
    setShowCardsNext(false)
  }, [phase])

  const onCardsNext = () => {
    if (phase !== 'cardsIdle') return
    setPhase('cardsExit')
    setTimeout(() => {
      setPhase('navigate')
    }, CARDS_FADE_DURATION)
  }

  useEffect(() => {
    if (phase === 'navigate') {
      router.push('/main')
    }
  }, [phase, router])

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black text-white">
      {/* LIGHTPILLAR BACKGROUND */}
      <div
        className={`
          absolute inset-0 transition-opacity ease-in-out
          ${phase === 'black'
            ? 'opacity-0'
            : phase === 'fadeInHero'
              ? 'opacity-100 duration-6000'
              : phase === 'cardsExit'
                ? 'opacity-0 duration-2000'
                : 'opacity-100'
          }
        `}
      >
        <LightPillar
          topColor="#5227FF"
          bottomColor="#FF9FFC"
          intensity={1}
          rotationSpeed={0.3}
          glowAmount={0.002}
          pillarWidth={3}
          pillarHeight={0.4}
          noiseIntensity={0.5}
          pillarRotation={25}
          interactive={false}
          mixBlendMode="screen"
          quality="high"
        />
      </div>

      {/* HERO TEXT */}
      <div
        className={`
          absolute inset-0 flex items-center justify-center
          transition-all ease-in-out
          ${phase === 'black'
            ? 'opacity-0'
            : phase === 'fadeInHero'
              ? 'opacity-100 duration-6000'
              : phase === 'heroIdle'
                ? 'opacity-100'
                : phase === 'heroExit'
                  ? 'opacity-0 scale-[12] duration-3000'
                  : 'opacity-0 scale-[12]'
          }
        `}
        onTransitionEnd={() => {
          if (phase === 'fadeInHero') setPhase('heroIdle')
        }}
      >
        <div className="relative z-10 text-center space-y-6">
          <h1 className="relative text-7xl md:text-8xl font-bold text-white drop-shadow-2xl">
            GovChat
          </h1>

          <p className="relative text-lg md:text-xl text-white/60 font-light tracking-wide max-w-2xl mx-auto">
            Transcending Government Services with Ethereal Intelligence
          </p>
        </div>
      </div>

      {/* HERO NEXT BUTTON */}
      {phase === 'heroIdle' && (
        <div
          className={`
            absolute bottom-10 left-1/2 -translate-x-1/2 z-20
            transition-opacity duration-700
            ${showHeroNext ? 'opacity-100' : 'opacity-0 pointer-events-none'}
          `}
        >
          <button
            onClick={onHeroNext}
            className="group relative px-10 py-3 rounded-full font-semibold text-sm overflow-hidden"
          >
            {/* Glassmorphism button */}
            <div className="absolute inset-0 bg-white/15 backdrop-blur-md border border-white/30 rounded-full" />
            <div className="absolute inset-0 bg-linear-to-r from-white/10 to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full" />
            <span className="relative flex items-center gap-2 text-white">
              Next <ChevronDown className="w-4 h-4 group-hover:translate-y-1 transition-transform" />
            </span>
          </button>
        </div>
      )}

      {/* CARD SWAP SECTION */}
      <div
        className={`
          absolute inset-0 flex items-center
          transition-opacity ease-in-out
          ${phase === 'cardsFadeIn'
            ? 'opacity-100 duration-2000'
            : phase === 'cardsIdle'
              ? 'opacity-100'
              : phase === 'cardsExit'
                ? 'opacity-0 duration-2000'
                : 'opacity-0 pointer-events-none'
          }
        `}
        onTransitionEnd={() => {
          if (phase === 'cardsFadeIn') setPhase('cardsIdle')
        }}
      >
        <div className="relative mx-auto w-full max-w-7xl px-6 md:px-12">
          {/* Header */}
          <div className="mb-16 text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              A Smarter Way to Engage with Government
            </h2>
            <p className="text-base md:text-lg text-white/60 max-w-2xl mx-auto">
              GovChat brings AI-powered assistance, transparent tracking, and multilingual access together into a single citizen-first portal
            </p>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Zap,
                title: 'Instant Assistance',
                desc: 'Get answers to government questions in real-time with AI-powered support'
              },
              {
                icon: Shield,
                title: 'Secure & Transparent',
                desc: 'Your data is protected with enterprise-grade security and full transparency'
              },
              {
                icon: Globe,
                title: 'Community Verification',
                desc: 'Ensure authenticity and trust with community-driven verification processes.'
              }
            ].map((item, idx) => {
              const Icon = item.icon
              return (
                <div
                  key={idx}
                  className="group relative overflow-hidden rounded-2xl transition-all duration-500 hover:scale-105"
                  style={{
                    animation: `slideUp 0.6s ease-out ${0.1 * idx}s both`
                  }}
                >
                  {/* Glassmorphic background */}
                  <div className="absolute inset-0 bg-white/8 backdrop-blur-xl border border-white/15 rounded-2xl" />

                  {/* Hover effect */}
                  <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />

                  {/* Content */}
                  <div className="relative p-8 h-full flex flex-col justify-between">
                    <div className="space-y-4">
                      <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center group-hover:bg-white/15 transition-colors">
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-xl font-semibold text-white group-hover:text-white/90 transition-colors">
                        {item.title}
                      </h3>
                    </div>
                    <p className="text-white/60 text-sm leading-relaxed group-hover:text-white/70 transition-colors">
                      {item.desc}
                    </p>

                    {/* Animated underline */}
                    <div className="mt-4 h-0.5 w-0 bg-white/40 group-hover:w-full transition-all duration-500" />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* FINAL NEXT BUTTON */}
      {phase === 'cardsIdle' && (
        <div
          className={`
            absolute bottom-10 left-1/2 -translate-x-1/2 z-20
            transition-opacity duration-700
            ${showCardsNext ? 'opacity-100' : 'opacity-0 pointer-events-none'}
          `}
        >
          <button
            onClick={onCardsNext}
            className="group relative px-10 py-3 rounded-full font-semibold text-sm overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/15 backdrop-blur-md border border-white/30 rounded-full" />
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full" />
            <span className="relative flex items-center gap-2 text-white">
              Next <ChevronDown className="w-4 h-4 group-hover:translate-y-1 transition-transform" />
            </span>
          </button>
        </div>
      )}

      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) translateX(0px);
            opacity: 0.3;
          }
          50% {
            transform: translateY(-20px) translateX(10px);
            opacity: 0.6;
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}
