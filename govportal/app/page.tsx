"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"

import FuzzyText from "@/components/FuzzyText"
import LightPillar from "@/components/LightPillar"
import CardSwap, { Card } from "@/components/CardSwap"

type Phase =
  | "black"
  | "fadeInHero"
  | "heroIdle"
  | "heroExit"
  | "cardsFadeIn"
  | "cardsIdle"
  | "cardsExit"
  | "navigate"

export default function HeroPage() {
  const router = useRouter()
  const [phase, setPhase] = useState<Phase>("black")

  const heroExitedRef = useRef(false)
  const [showHeroNext, setShowHeroNext] = useState(false)
  const [showCardsNext, setShowCardsNext] = useState(false)

  /* ---------------- TIMINGS (LOCKED CORE) ---------------- */
  const HERO_FADE_IN_DELAY = 1000
  const HERO_FADE_IN_DURATION = 6000
  const HERO_ZOOM_DURATION = 3000
  const CARDS_FADE_DURATION = 2000

  /* ---------------- BLACK → HERO FADE IN ---------------- */
  useEffect(() => {
    const t = setTimeout(() => setPhase("fadeInHero"), HERO_FADE_IN_DELAY)
    return () => clearTimeout(t)
  }, [])

  /* ---------------- HERO NEXT BUTTON FADE-IN ---------------- */
  useEffect(() => {
    if (phase === "heroIdle") {
      const t = setTimeout(() => setShowHeroNext(true), 2000)
      return () => clearTimeout(t)
    }
    setShowHeroNext(false)
  }, [phase])

  /* ---------------- HERO NEXT ---------------- */
  const onHeroNext = () => {
    if (phase !== "heroIdle" || heroExitedRef.current) return
    heroExitedRef.current = true
    setPhase("heroExit")

    setTimeout(() => {
      setPhase("cardsFadeIn")
    }, HERO_ZOOM_DURATION)
  }

  /* ---------------- CARDS NEXT BUTTON DELAY ---------------- */
  useEffect(() => {
    if (phase === "cardsIdle") {
      const t = setTimeout(() => setShowCardsNext(true), 5000)
      return () => clearTimeout(t)
    }
    setShowCardsNext(false)
  }, [phase])

  /* ---------------- CARDS NEXT ---------------- */
  const onCardsNext = () => {
    if (phase !== "cardsIdle") return
    setPhase("cardsExit")

    setTimeout(() => {
      setPhase("navigate")
    }, CARDS_FADE_DURATION)
  }

  /* ---------------- NAVIGATION ---------------- */
  useEffect(() => {
    if (phase === "navigate") {
      router.push("/main")
    }
  }, [phase, router])

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black text-white">
      {/* ---------------- BACKGROUND (PERSISTENT) ---------------- */}
      <div
        className={`
          absolute inset-0 transition-opacity ease-in-out
          ${
            phase === "black"
              ? "opacity-0"
              : phase === "fadeInHero"
              ? "opacity-100 duration-6000"
              : phase === "cardsExit"
              ? "opacity-0 duration-2000"
              : "opacity-100"
          }
        `}
      >
        <LightPillar
          topColor="#00d5ff"
          bottomColor="#0b0986"
          intensity={0.9}
          rotationSpeed={0.8}
          glowAmount={0.002}
          pillarWidth={6}
          pillarHeight={0.7}
          noiseIntensity={0.7}
          pillarRotation={41}
          interactive={false}
          mixBlendMode="normal"
          quality="high"
        />
      </div>

      {/* ---------------- HERO TEXT ---------------- */}
      <div
        className={`
          absolute inset-0 flex items-center justify-center
          transition-all ease-in-out
          ${
            phase === "black"
              ? "opacity-0"
              : phase === "fadeInHero"
              ? "opacity-100 duration-6000"
              : phase === "heroIdle"
              ? "opacity-100"
              : phase === "heroExit"
              ? "opacity-0 scale-[12] duration-3000"
              : "opacity-0 scale-[12]"
          }
        `}
        onTransitionEnd={() => {
          if (phase === "fadeInHero") setPhase("heroIdle")
        }}
      >
        <FuzzyText baseIntensity={0.18} hoverIntensity={0.45} enableHover>
          GovtChat
        </FuzzyText>
      </div>

      {/* ---------------- HERO NEXT BUTTON ---------------- */}
      {phase === "heroIdle" && (
        <div
          className={`
            absolute bottom-10 left-1/2 -translate-x-1/2 z-20
            transition-opacity duration-700
            ${showHeroNext ? "opacity-100" : "opacity-0"}
          `}
        >
          <button
            onClick={onHeroNext}
            className="px-10 py-3 rounded-full bg-white text-black text-lg font-medium hover:bg-white/90"
          >
            Next
          </button>
        </div>
      )}

      {/* ---------------- CARD SWAP SECTION ---------------- */}
      <div
        className={`
          absolute inset-0 flex items-center
          transition-opacity ease-in-out
          ${
            phase === "cardsFadeIn"
              ? "opacity-100 duration-2000"
              : phase === "cardsIdle"
              ? "opacity-100"
              : phase === "cardsExit"
              ? "opacity-0 duration-2000"
              : "opacity-0 pointer-events-none"
          }
        `}
        onTransitionEnd={() => {
          if (phase === "cardsFadeIn") setPhase("cardsIdle")
        }}
      >
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-16 px-12">
          {/* LEFT TEXT */}
          <div className="flex flex-col justify-center space-y-6">
            <h2 className="text-4xl font-semibold">
              A Smarter Way to Engage with Government
            </h2>
            <p className="text-white/70 text-lg">
              GovtChat brings AI-powered assistance, transparent tracking, and
              multilingual access together into a single citizen-first portal.
            </p>
          </div>

          {/* RIGHT CARD SWAP */}
          <div className="relative h-[600px]">
            <CardSwap
              cardDistance={60}
              verticalDistance={80}
              delay={3000}
              pauseOnHover={false}
            >
              {/* CARD 1 */}
              <Card>
                <div className="relative h-full w-full overflow-hidden rounded-xl">
                  <img
                    src="/herocontainer/1.png"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                  <div className="absolute bottom-4 left-4 right-4 rounded-lg bg-black/50 backdrop-blur-md p-4">
                    <h3 className="text-xl font-semibold">
                      Smart Complaint Routing
                    </h3>
                    <p className="text-white/80 mt-1">
                      Upload a photo and let AI route the issue automatically.
                    </p>
                  </div>
                </div>
              </Card>

              {/* CARD 2 */}
              <Card>
                <div className="relative h-full w-full overflow-hidden rounded-xl">
                  <img
                    src="/herocontainer/2.png"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                  <div className="absolute bottom-4 left-4 right-4 rounded-lg bg-black/50 backdrop-blur-md p-4">
                    <h3 className="text-xl font-semibold">
                      Live Geo-Tagged Tracking
                    </h3>
                    <p className="text-white/80 mt-1">
                      Track complaint status on an interactive map in real time.
                    </p>
                  </div>
                </div>
              </Card>

              {/* CARD 3 */}
              <Card>
                <div className="relative h-full w-full overflow-hidden rounded-xl">
                  <img
                    src="/herocontainer/3.png"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                  <div className="absolute bottom-4 left-4 right-4 rounded-lg bg-black/50 backdrop-blur-md p-4">
                    <h3 className="text-xl font-semibold">
                      Kannada Voice Assistance
                    </h3>
                    <p className="text-white/80 mt-1">
                      Navigate the portal using spoken Kannada.
                    </p>
                  </div>
                </div>
              </Card>

              {/* CARD 4 */}
              <Card>
                <div className="relative h-full w-full overflow-hidden rounded-xl">
                  <img
                    src="/herocontainer/4.png"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                  <div className="absolute bottom-4 left-4 right-4 rounded-lg bg-black/50 backdrop-blur-md p-4">
                    <h3 className="text-xl font-semibold">
                      Public Services AI
                    </h3>
                    <p className="text-white/80 mt-1">
                      Get clear answers about schemes and documents.
                    </p>
                  </div>
                </div>
              </Card>
            </CardSwap>
          </div>
        </div>
      </div>

      {/* ---------------- FINAL NEXT BUTTON ---------------- */}
      {phase === "cardsIdle" && (
        <div
          className={`
            absolute bottom-10 left-1/2 -translate-x-1/2 z-20
            transition-opacity duration-700
            ${showCardsNext ? "opacity-100" : "opacity-0"}
          `}
        >
          <button
            onClick={onCardsNext}
            className="px-10 py-3 rounded-full bg-white text-black text-lg font-medium hover:bg-white/90"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
