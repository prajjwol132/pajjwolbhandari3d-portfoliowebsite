"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { useRef } from "react";
import { usePortfolioContent } from "@/components/providers/portfolio-content-provider";
import { getPageImage } from "@/data/page-media";

function HeroSceneLoading() {
  const { pageMedia } = usePortfolioContent();
  return (
    <div className="character-stage portrait-stage rotation-stage">
      <div className="seated-loading-picture">
        <Image
          src={getPageImage(pageMedia, "hero_character_poster")}
          alt="Prajjwol seated in his white and yellow creative studio"
          width={1672}
          height={941}
          priority
          unoptimized
          sizes="100vw"
        />
      </div>
    </div>
  );
}

const RotationHeroScene = dynamic(
  () => import("@/components/3d/rotation-hero-scene").then(module => module.RotationHeroScene),
  { ssr: false, loading: () => <HeroSceneLoading /> },
);

export function PortfolioHeroSection({ characterPreview = false }: { characterPreview?: boolean }) {
  const { profile, totalCount, pageMedia } = usePortfolioContent();
  const hero = useRef<HTMLElement>(null);
  const age = profile.metrics.find(metric => /^age$/i.test(metric.label))?.value ?? "21";
  const semester = profile.metrics.find(metric => /semester/i.test(metric.label))?.value ?? "4th";

  return <section id="profile" ref={hero} className="portfolio-hero character-hero" aria-label="Introduction" data-character-preview={characterPreview}>
    <RotationHeroScene
      heroRef={hero}
      showControls={characterPreview}
      roomSrc={getPageImage(pageMedia, "hero_room_background")}
      posterSrc={getPageImage(pageMedia, "hero_character_poster")}
    />
    <div className="character-intro">
      <p className="portfolio-eyebrow"><span aria-hidden />{profile.headline}</p>
      <h1>{profile.full_name}</h1>
      <p className="character-bio">{profile.bio}</p>
      <a className="portfolio-cta character-work-cta" href="#projects">
        View my work <ArrowUpRight size={16} aria-hidden />
      </a>
    </div>
    <aside className="character-stats" aria-label="At a glance">
      <div><strong className="character-project-count">{String(totalCount).padStart(2, "0")}</strong><span>Selected projects</span></div>
      <div><strong>{age}</strong><span>Years old</span></div>
      <div><strong>{semester}</strong><span>IT semester</span></div>
    </aside>
    <div className="character-details">
      <p>{profile.tagline}</p>
      <div><strong>{profile.location}</strong><span>{profile.title || profile.headline}</span></div>
    </div>
    <a className="hero-next character-next" href="#about">
      <span>Meet the creative<strong>Beyond the edit</strong></span><ArrowDownRight size={28} />
    </a>
  </section>;
}
