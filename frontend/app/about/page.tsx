"use client";

import { useEffect, useState } from "react";
import GlitchText from "@/components/decor/GlitchText";
import InfiniteMenu from "@/components/decor/InfiniteMenu";
import Beams from "@/components/decor/Beams";
import { Mail, Instagram, Github, MailIcon } from "lucide-react";
import { useRouter } from "next/navigation";

type Stage = 0 | 1;

const SocialRow = ({
  icon: Icon,
  label,
  href
}: {
  icon: any;
  label: string;
  href: string;
}) => (
  <div className="flex items-center gap-3 mt-2 text-sm text-white/90 whitespace-nowrap">
    <Icon className="h-4 w-4 text-white" />
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="hover:underline hover:text-cyan-400 transition-colors"
    >
      {label}
    </a>
  </div>
);

export default function AboutUsPage() {
  const router = useRouter(); // ✅ must be INSIDE component

  const [stage, setStage] = useState<Stage>(0);
  const [visible, setVisible] = useState(false);

  /* Initial cinematic fade-in */
  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  /* Keyboard navigation */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === "ArrowRight" || e.key === "ArrowDown") && stage === 0) {
        transitionTo(1);
      }
      if ((e.key === "ArrowLeft" || e.key === "ArrowUp") && stage === 1) {
        transitionTo(0);
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [stage]);

  const transitionTo = (next: Stage) => {
    setVisible(false);
    setTimeout(() => {
      setStage(next);
      setVisible(true);
    }, 2000);
  };

  const handleClick = () => {
    if (stage === 0) transitionTo(1);
  };

  const handleGoBack = () => {
    setVisible(false);
    setTimeout(() => {
      router.back(); // ✅ preserves navigation history
    }, 2000);
  };

  const developers = [
    {
      image: "/developers/1.png",
      title: "Siri Kumar C S",
      link: "#",
      description: (
        <div className="space-y-1 leading-relaxed">
          <p>Department of AIML</p>
          <p>Map rendering & rerouting</p>
          <p>Frontend Developer</p>
          <p>Overall integration</p>

          <div className="mt-4">
            <SocialRow
              icon={Instagram}
              label="sirikumar968"
              href="https://instagram.com/sirikumar968"
            />
            <SocialRow
              icon={Github}
              label="siriaanya129"
              href="https://github.com/siriaanya129"
            />
            <SocialRow
              icon={Mail}
              label="sirikumar69.ga@gmail.com"
              href="mailto:sirikumar69.ga@gmail.com"
            />
          </div>
        </div>
      )
    },
    {
      image: "/developers/2.png",
      title: "Sriram A",
      link: "#",
      description: (
        <div className="space-y-1 leading-relaxed">
          <p>Department of AIML</p>
          <p>Backend Development</p>
          <p>TTS & STT</p>
          <p>Frontend + Integration</p>

          <div className="mt-4">
            <SocialRow
              icon={Instagram}
              label="sri_ram_2k"
              href="https://instagram.com/sri_ram_2k"
            />
            <SocialRow
              icon={Github}
              label="Sri-Ram-A"
              href="https://github.com/Sri-Ram-A"
            />
            <SocialRow
              icon={Mail}
              label="srirnsametalmart@gmail.com"
              href="mailto:srirnsametalmart@gmail.com"
            />
          </div>
        </div>
      )
    },
    {
      image: "/developers/3.png",
      title: "Srinidhi H",
      link: "#",
      description: (
        <div className="space-y-1 leading-relaxed">
          <p>Department of CSE</p>
          <p>Backend Developer (Mobile App)</p>
          <p>Geo-map complaint routing</p>

          <div className="mt-4">
            <SocialRow
              icon={Instagram}
              label="srinidhi_3628"
              href="https://instagram.com/srinidhi_3628"
            />
            <SocialRow
              icon={Github}
              label="SRINIDHI3628"
              href="https://github.com/SRINIDHI3628"
            />
            <SocialRow
              icon={MailIcon}
              label="srinidhi3628@gmail.com"
              href="mailto:srinidhi3628@gmail.com"
            />
          </div>
        </div>
      )
    },
    {
      image: "/developers/4.png",
      title: "Sahana",
      link: "#",
      description: (
        <div className="space-y-1 leading-relaxed">
          <p>Department of ISE</p>
          <p>Muril based answer retrieval</p>
          <p>Draft Paper and Survey Report and Research</p>
          <p>Webscraping Information Databases</p>

          <div className="mt-4">
            <SocialRow
              icon={Instagram}
              label="sa_ahh_nahh"
              href="https://instagram.com/sa_ahh_nahh"
            />
            <SocialRow
              icon={Github}
              label="Sahana-Acharya7"
              href="https://github.com/Sahana-Acharya7"
            />
            <SocialRow
              icon={Mail}
              label="sahanasaanu349@gmail.com"
              href="mailto:sahanasaanu349@gmail.com"
            />
          </div>
        </div>
      )
    },
    {
      image: "/developers/5.png",
      title: "Sahana Vernekar",
      link: "#",
      description: (
        <div className="space-y-1 leading-relaxed">
          <p>Department of CSE</p>
          <p>Research and Reporting existing systems</p>
          <p>Query - Answer extraction using Muril</p>
          <p>Webscraping Information Databases</p>
          

          <div className="mt-4">
            <SocialRow
              icon={Instagram}
              label="sahana_vernekar2006"
              href="https://instagram.com/sahana_vernekar2006"
            />
            <SocialRow
              icon={Github}
              label="sahana-mv06"
              href="https://github.com/sahana-mv06"
            />
            <SocialRow
              icon={Mail}
              label="sahanavernekar9999@gmail.com"
              href="mailto:sahanavernekar9999@gmail.com"
            />
          </div>
        </div>
      )
    }
  ];

  return (
    <div
      onClick={handleClick}
      className="relative min-h-screen w-full overflow-hidden bg-black text-white"
    >
      {/* BEAMS BACKGROUND */}
      <div
        className={`
          absolute inset-0 z-0
          transition-opacity duration-2000 ease-in-out
          ${visible ? "opacity-100" : "opacity-0"}
        `}
      >
        <Beams
          beamWidth={2.1}
          beamHeight={16}
          beamNumber={40}
          lightColor="#00d5ff"
          speed={8}
          noiseIntensity={1.25}
          scale={0.21}
          rotation={21}
        />
      </div>

      {/* STAGE 0 */}
      {stage === 0 && (
        <div
          className={`
            relative z-10 flex items-center justify-center h-screen
            transition-opacity duration-2000 ease-in-out
            ${visible ? "opacity-100" : "opacity-0"}
          `}
        >
          <GlitchText speed={1.5} enableShadows enableOnHover={false}>
            DEVELOPERS
          </GlitchText>
        </div>
      )}

      {/* STAGE 1 */}
      {stage === 1 && (
        <div
          className={`
            relative z-10 h-screen w-full
            transition-opacity duration-2000 ease-in-out
            ${visible ? "opacity-100" : "opacity-0"}
          `}
        >
          {/* GO BACK BUTTON */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleGoBack();
            }}
            className="
              absolute bottom-8 left-1/2 -translate-x-1/2 z-20
              px-5 py-2 rounded-full
              bg-white/90 text-black text-sm font-medium
              hover:bg-white transition-colors
            "
          >
            Go Back
          </button>

          <InfiniteMenu items={developers} scale={1} />
        </div>
      )}
    </div>
  );
}