"use client";

import Image from "next/image";
import { Mail } from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
} from "react";
import { createClient } from "@/lib/supabase/client";
import type { Profile, TelemetryMetric } from "@/types/database";

type HeroContent = {
  fullName: string;
  headline: string;
  tagline: string;
  bio: string;
  email: string;
  location: string;
  projectCount: number;
  yearsExperience: string;
  performanceTarget: string;
};

const fallbackHeroContent: HeroContent = {
  fullName: "Prajjwol Bhandari",
  headline: "Now building",
  tagline: "Full-stack developer / immersive interfaces / Supabase-backed project systems.",
  bio: "I design and build fast, custom software experiences with Next.js, Supabase, Three.js, and motion systems tuned for real users.",
  email: "admin@prajjwol-bhandari.dev",
  location: "Kathmandu, Nepal",
  projectCount: 10,
  yearsExperience: "03",
  performanceTarget: "60",
};

function normalizeMetricValue(metrics: TelemetryMetric[] | null | undefined, includes: string, fallback: string) {
  const metric = metrics?.find((item) => item.label.toLowerCase().includes(includes));
  const value = metric?.value.trim();

  return value && value.length > 0 ? value.replace("+", "") : fallback;
}

function firstAvailable(...values: Array<string | null | undefined>) {
  return values.find((value) => typeof value === "string" && value.trim().length > 0)?.trim();
}

export function PortfolioHeroSection() {
  const [content, setContent] = useState<HeroContent>(fallbackHeroContent);
  const [isHoveringImage, setIsHoveringImage] = useState(false);
  const heroRef = useRef<HTMLElement | null>(null);
  const targetReveal = useRef({ x: 43, y: 42 });
  const currentReveal = useRef({ x: 43, y: 42 });

  useEffect(() => {
    let isMounted = true;

    async function loadHeroContent() {
      try {
        const supabase = createClient();
        const [profileResult, projectCountResult] = await Promise.all([
          supabase
            .from("profiles")
            .select(
              "full_name, headline, title, tagline, bio, email, location, metrics, social_links, updated_at",
            )
            .order("updated_at", { ascending: false })
            .limit(1)
            .maybeSingle(),
          supabase.from("projects").select("id", { count: "exact", head: true }),
        ]);

        if (!isMounted) {
          return;
        }

        const profile = profileResult.data as Partial<Profile> | null;
        const metrics = Array.isArray(profile?.metrics) ? profile.metrics : [];
        const dashboardProjectCount = projectCountResult.count ?? Number.NaN;
        const projectsFromMetrics = Number.parseInt(normalizeMetricValue(metrics, "project", "10"), 10);

        setContent({
          fullName: firstAvailable(profile?.full_name, fallbackHeroContent.fullName) ?? fallbackHeroContent.fullName,
          headline:
            firstAvailable(profile?.headline, profile?.title, fallbackHeroContent.headline) ??
            fallbackHeroContent.headline,
          tagline:
            firstAvailable(profile?.tagline, profile?.title, fallbackHeroContent.tagline) ??
            fallbackHeroContent.tagline,
          bio: firstAvailable(profile?.bio, fallbackHeroContent.bio) ?? fallbackHeroContent.bio,
          email: firstAvailable(profile?.email, fallbackHeroContent.email) ?? fallbackHeroContent.email,
          location: firstAvailable(profile?.location, fallbackHeroContent.location) ?? fallbackHeroContent.location,
          projectCount: Number.isFinite(dashboardProjectCount)
            ? dashboardProjectCount
            : Number.isFinite(projectsFromMetrics)
              ? projectsFromMetrics
              : fallbackHeroContent.projectCount,
          yearsExperience: normalizeMetricValue(metrics, "year", fallbackHeroContent.yearsExperience).padStart(2, "0"),
          performanceTarget: normalizeMetricValue(metrics, "fps", fallbackHeroContent.performanceTarget),
        });
      } catch {
        if (isMounted) {
          setContent(fallbackHeroContent);
        }
      }
    }

    void loadHeroContent();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let animationFrameId = 0;

    function animateReveal() {
      currentReveal.current.x += (targetReveal.current.x - currentReveal.current.x) * 0.12;
      currentReveal.current.y += (targetReveal.current.y - currentReveal.current.y) * 0.12;
      heroRef.current?.style.setProperty("--reveal-x", `${currentReveal.current.x.toFixed(2)}%`);
      heroRef.current?.style.setProperty("--reveal-y", `${currentReveal.current.y.toFixed(2)}%`);
      animationFrameId = window.requestAnimationFrame(animateReveal);
    }

    animationFrameId = window.requestAnimationFrame(animateReveal);

    return () => {
      window.cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const handlePointerMove = useCallback((event: PointerEvent<HTMLElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width) * 100;
    const y = ((event.clientY - bounds.top) / bounds.height) * 100;

    targetReveal.current = {
      x: Math.min(100, Math.max(0, x)),
      y: Math.min(100, Math.max(0, y)),
    };
  }, []);

  const [firstName, lastName] = useMemo(() => {
    const parts = content.fullName.trim().split(/\s+/);
    const first = parts.shift() ?? "Prajjwol";

    return [first, parts.join(" ") || "Bhandari"];
  }, [content.fullName]);

  const mailHref = `mailto:${content.email}`;
  const projectCount = String(content.projectCount).padStart(2, "0");
  const revealMaskStyle: CSSProperties = {
    WebkitMaskImage:
      "radial-gradient(circle 18rem at var(--reveal-x, 43%) var(--reveal-y, 42%), #000 0%, #000 42%, rgba(0,0,0,0.72) 56%, transparent 76%)",
    maskImage:
      "radial-gradient(circle 18rem at var(--reveal-x, 43%) var(--reveal-y, 42%), #000 0%, #000 42%, rgba(0,0,0,0.72) 56%, transparent 76%)",
  };

  return (
    <section
      id="profile"
      ref={heroRef}
      className="relative min-h-screen overflow-hidden bg-black text-white"
      onPointerEnter={() => setIsHoveringImage(true)}
      onPointerLeave={() => setIsHoveringImage(false)}
      onPointerMove={handlePointerMove}
    >
      <div className="absolute inset-0">
        <Image
          src="/media/brand/prajjwol-main.png"
          fill
          priority
          sizes="100vw"
          alt="Prajjwol Bhandari portrait background"
          className="object-cover object-[37%_50%] brightness-[0.58] contrast-125 grayscale md:object-center"
        />
        <Image
          src="/media/brand/prajjwol-main.png"
          fill
          priority
          sizes="100vw"
          alt=""
          aria-hidden="true"
          style={revealMaskStyle}
          className={[
            "object-cover object-[37%_50%] brightness-[0.95] contrast-110 saturate-125 transition-opacity duration-500 ease-out md:object-center",
            isHoveringImage ? "opacity-100" : "opacity-0",
          ].join(" ")}
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.84)_0%,rgba(0,0,0,0.34)_36%,rgba(0,0,0,0.18)_55%,rgba(0,0,0,0.78)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(0,0,0,0.9)_0%,rgba(0,0,0,0.18)_42%,rgba(0,0,0,0.5)_100%)]" />
        <div className="absolute inset-0 opacity-45 [background-image:linear-gradient(90deg,rgba(255,255,255,0.22)_1px,transparent_1px)] [background-size:16.666%_100%]" />
        <div className="absolute inset-0 opacity-25 [background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:100%_4.75rem]" />
      </div>

      <header className="absolute inset-x-0 top-0 z-30 flex items-start justify-between px-6 py-6 md:px-16 md:py-9">
        <a className="block w-11 md:w-14" href="#profile" aria-label="Prajjwol Bhandari home">
          <Image
            src="/media/brand/pb-logo.png"
            width={512}
            height={512}
            priority
            alt="Prajjwol Bhandari logo"
            className="h-auto w-full object-contain"
          />
        </a>

        <a
          className="inline-flex h-12 items-center justify-center gap-3 bg-[#ffd60a] px-4 font-mono text-[0.68rem] font-black uppercase text-black transition-transform duration-200 hover:-translate-y-0.5 md:h-14 md:px-5"
          href={mailHref}
          aria-label="Email Prajjwol"
        >
          <span className="hidden sm:inline">Contact</span>
          <Mail className="size-5" />
        </a>
      </header>

      <aside className="absolute left-6 top-[28%] z-20 hidden flex-col gap-8 font-mono text-[0.68rem] font-black text-white/72 md:flex md:left-16">
        <div>
          <div className="text-4xl leading-none text-white">{projectCount}</div>
          <div className="mt-2 uppercase">Projects</div>
        </div>
        <div>
          <div className="text-4xl leading-none text-white">{content.yearsExperience}</div>
          <div className="mt-2 uppercase">Years Exp</div>
        </div>
        <div>
          <div className="text-4xl leading-none text-white">{content.performanceTarget}</div>
          <div className="mt-2 uppercase">FPS Aim</div>
        </div>
      </aside>

      <div className="absolute left-[45%] top-[38%] z-10 hidden -translate-x-1/2 -translate-y-1/2 font-black text-[clamp(8rem,16vw,18rem)] leading-none text-white md:block">
        {projectCount}
      </div>

      <div className="relative z-20 flex min-h-screen flex-col justify-end px-6 pb-10 pt-32 md:px-16 md:pb-14">
        <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_minmax(17rem,24rem)] md:items-end">
          <div className="max-w-xl">
            <p className="mb-3 font-mono text-[0.72rem] font-black uppercase tracking-normal text-[#ffd60a]">
              {content.headline}
            </p>
            <h1 className="max-w-[9ch] text-[clamp(3.8rem,8vw,7.4rem)] font-black uppercase leading-[0.78] tracking-normal text-white md:ml-0">
              {firstName}
              <span className="block">{lastName}</span>
            </h1>
            <p className="mt-5 max-w-md text-base font-bold leading-6 text-white/88 md:text-lg">
              {content.bio}
            </p>
          </div>

          <div className="grid gap-7 text-left md:justify-items-end md:text-right">
            <article className="max-w-sm">
              <p className="text-lg font-semibold leading-7 text-white/88">{content.tagline}</p>
            </article>

            <div className="grid gap-6 font-mono text-sm font-black text-white/90">
              <div>
                <div className="text-base text-white">{content.location}</div>
                <div className="text-white/68">Location</div>
              </div>
              <div>
                <div className="text-base text-white">{content.yearsExperience}+ Years</div>
                <div className="text-white/68">Development experience</div>
              </div>
              <div>
                <div className="text-base text-white">{projectCount}+ Projects</div>
                <div className="text-white/68">Custom code shipped</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
