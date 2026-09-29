"use client";

import {
  ArrowDown,
  Download,
  ExternalLink,
  GitBranch,
  Mail,
  MapPin,
  Network,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Profile, SocialLink, TelemetryMetric } from "@/types/database";

const fallbackMetrics: TelemetryMetric[] = [
  {
    label: "Years Exp",
    value: "3+",
    detail: "Production-focused web development",
  },
  {
    label: "Projects",
    value: "15+",
    detail: "Full-stack, CMS, 3D, and media builds",
  },
  {
    label: "Client Satisfaction",
    value: "100%",
    detail: "Built around clear scope and reliable delivery",
  },
  {
    label: "Core Spec",
    value: "Next / Three",
    detail: "Next.js, Supabase, GSAP, and R3F",
  },
];

const fallbackProfile: Profile = {
  id: "local-profile",
  full_name: "Prajjwol Bhandari",
  headline: "Full-Stack & 3D Developer",
  title: "Full-Stack Software Engineer / 3D Creative Developer",
  tagline: "I build polished web systems where backend structure, motion, and visual depth work as one product.",
  bio:
    "Prajjwol Bhandari develops modern software interfaces with Next.js, TypeScript, Supabase, React Three Fiber, and GSAP. His work focuses on fast user experiences, clean CMS architecture, and dark technical layouts that feel engineered rather than templated.",
  location: "Kathmandu, Nepal",
  email: "hello@prajjwol-bhandari.dev",
  github_url: "https://github.com/",
  linkedin_url: "https://www.linkedin.com/",
  website_url: "https://prajjwol-bhandari.dev",
  resume_url: "/resume",
  avatar_url: null,
  social_links: [
    { icon: "github", label: "GitHub", url: "https://github.com/" },
    { icon: "linkedin", label: "LinkedIn", url: "https://www.linkedin.com/" },
    { icon: "mail", label: "Email", url: "mailto:hello@prajjwol-bhandari.dev" },
  ],
  metrics: fallbackMetrics,
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
};

function isTelemetryMetric(value: unknown): value is TelemetryMetric {
  if (!value || typeof value !== "object") {
    return false;
  }

  const metric = value as Record<string, unknown>;
  return typeof metric.label === "string" && typeof metric.value === "string";
}

function isSocialLink(value: unknown): value is SocialLink {
  if (!value || typeof value !== "object") {
    return false;
  }

  const link = value as Record<string, unknown>;
  return typeof link.label === "string" && typeof link.url === "string";
}

function normalizeProfile(row: Partial<Profile> | null): Profile {
  if (!row) {
    return fallbackProfile;
  }

  const metrics = Array.isArray(row.metrics)
    ? row.metrics.filter(isTelemetryMetric)
    : fallbackMetrics;
  const socialLinks = Array.isArray(row.social_links)
    ? row.social_links.filter(isSocialLink)
    : fallbackProfile.social_links;

  return {
    ...fallbackProfile,
    ...row,
    metrics: metrics.length > 0 ? metrics.slice(0, 4) : fallbackMetrics,
    social_links: socialLinks.length > 0 ? socialLinks : fallbackProfile.social_links,
  };
}

function getSocialIcon(link: SocialLink) {
  if (link.icon === "github" || link.label.toLowerCase().includes("github")) {
    return <GitBranch className="size-4" />;
  }

  if (link.icon === "linkedin" || link.label.toLowerCase().includes("linkedin")) {
    return <Network className="size-4" />;
  }

  if (link.icon === "mail" || link.url.startsWith("mailto:")) {
    return <Mail className="size-4" />;
  }

  return <ExternalLink className="size-4" />;
}

export function AboutSection() {
  const [profile, setProfile] = useState<Profile>(fallbackProfile);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      setIsLoading(true);

      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) {
          throw error;
        }

        if (isMounted) {
          setProfile(normalizeProfile(data));
        }
      } catch {
        if (isMounted) {
          setProfile(fallbackProfile);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  const metrics = useMemo(() => profile.metrics.slice(0, 4), [profile.metrics]);

  const handleContactScroll = () => {
    document.querySelector("#contact")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section
      className="relative overflow-hidden bg-black px-5 py-24 text-white md:px-12 md:py-32"
      id="profile"
    >
      <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:42px_42px]" />
      <div className="pointer-events-none absolute right-0 top-0 h-40 w-40 bg-[#ffd60a]/10 blur-3xl" />

      <div className="relative mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.92fr_1.08fr] lg:items-end">
        <div>
          <p className="font-mono text-[0.68rem] font-black uppercase tracking-normal text-[#ffd60a]">
            01 / Developer Profile
          </p>
          <h2 className="mt-5 max-w-4xl text-[clamp(3.2rem,8vw,8rem)] font-black uppercase leading-[0.78] tracking-normal">
            {profile.full_name}
          </h2>
          <div className="mt-6 grid gap-3 border-l-4 border-[#ffd60a] pl-5">
            <p className="font-mono text-xs font-black uppercase text-white/70">
              {profile.headline}
            </p>
            <p className="max-w-2xl text-2xl font-black uppercase leading-none text-white md:text-4xl">
              {profile.title ?? profile.tagline}
            </p>
          </div>
        </div>

        <div className="grid gap-6">
          <div className="border border-white/15 bg-white/[0.03] p-6 shadow-2xl backdrop-blur">
            <div className="mb-5 flex items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <p className="font-mono text-[0.64rem] font-black uppercase text-white/45">
                  Bio Feed
                </p>
                {profile.location ? (
                  <p className="mt-2 inline-flex items-center gap-2 font-mono text-xs font-black uppercase text-[#ffd60a]">
                    <MapPin className="size-4" />
                    {profile.location}
                  </p>
                ) : null}
              </div>
              <div className="font-mono text-[0.64rem] font-black uppercase text-white/45">
                {isLoading ? "Syncing" : "Live CMS"}
              </div>
            </div>

            <p className="text-base leading-7 text-white/76 md:text-lg">{profile.bio}</p>

            <div className="mt-7 flex flex-wrap gap-3">
              {profile.social_links.map((link) => (
                <a
                  className="inline-flex h-10 items-center gap-2 border border-white/15 bg-black px-4 font-mono text-[0.68rem] font-black uppercase text-white transition hover:border-[#ffd60a] hover:text-[#ffd60a]"
                  href={link.url}
                  key={`${link.label}-${link.url}`}
                  rel={link.url.startsWith("http") ? "noreferrer" : undefined}
                  target={link.url.startsWith("http") ? "_blank" : undefined}
                >
                  {getSocialIcon(link)}
                  {link.label}
                </a>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {metrics.map((metric) => (
              <article
                className="group border border-white/14 bg-white/[0.04] p-5 transition hover:border-[#ffd60a]"
                key={metric.label}
              >
                <div className="font-mono text-[0.62rem] font-black uppercase text-white/45">
                  [ {metric.label} ]
                </div>
                <div className="mt-3 text-4xl font-black uppercase leading-none text-white group-hover:text-[#ffd60a]">
                  {metric.value}
                </div>
                {metric.detail ? (
                  <p className="mt-3 text-sm leading-5 text-white/55">{metric.detail}</p>
                ) : null}
              </article>
            ))}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <a
              className="inline-flex h-12 items-center justify-center gap-2 bg-[#ffd60a] px-5 font-mono text-xs font-black uppercase text-black transition hover:bg-white"
              href={profile.resume_url ?? "/resume"}
              rel={profile.resume_url?.startsWith("http") ? "noreferrer" : undefined}
              target={profile.resume_url?.startsWith("http") ? "_blank" : undefined}
            >
              <Download className="size-4" />
              Download CV
            </a>
            <button
              className="inline-flex h-12 items-center justify-center gap-2 border border-white/18 bg-black px-5 font-mono text-xs font-black uppercase text-white transition hover:border-[#ffd60a] hover:text-[#ffd60a]"
              onClick={handleContactScroll}
              type="button"
            >
              <ArrowDown className="size-4" />
              Get in Touch
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
