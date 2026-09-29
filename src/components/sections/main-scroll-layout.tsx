"use client";

import {
  GitBranch,
  Mail,
  Rocket,
  Sparkles,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { SceneCanvas } from "@/components/3d";
import { HeroSection } from "@/components/sections/hero-section";
import { ProjectsSection } from "@/components/sections/projects/projects-section";
import { Button } from "@/components/ui/button";
import { SiteNavigation } from "@/components/ui/navigation";
import { createScrubbedTimeline, gsap, pinElement, registerScrollTrigger } from "@/lib/gsap";

const skillMetrics = [
  { value: "10+", label: "Production Builds" },
  { value: "6", label: "Core Stacks" },
  { value: "3+", label: "Years Practice" },
  { value: "60", label: "FPS Target" },
];

const profileTimeline = [
  {
    year: "01",
    title: "Full-Stack Systems",
    body: "Next.js, TypeScript, Supabase, auth, storage, and structured data flows for scalable product interfaces.",
  },
  {
    year: "02",
    title: "3D Web Experiences",
    body: "React Three Fiber scenes with responsive cameras, optimized lighting, asset loading, and scroll-synchronized motion.",
  },
  {
    year: "03",
    title: "Creative Engineering",
    body: "GSAP timelines, Lenis scrolling, media-rich project pages, and polished motion systems tuned for real devices.",
  },
];

function isWeakTouchBrowser() {
  if (typeof window === "undefined") {
    return false;
  }

  return navigator.maxTouchPoints > 0 && window.innerWidth < 768;
}

export function MainScrollLayout() {
  const rootRef = useRef<HTMLElement>(null);
  const aboutSectionRef = useRef<HTMLElement>(null);
  const aboutPinnedRef = useRef<HTMLDivElement>(null);
  const contactSectionRef = useRef<HTMLElement>(null);
  const scrollProgressRef = useRef(0);
  const [isWeakTouchDevice, setIsWeakTouchDevice] = useState(false);

  useEffect(() => {
    const updateTouchMode = () => {
      setIsWeakTouchDevice(isWeakTouchBrowser());
    };

    updateTouchMode();
    window.addEventListener("resize", updateTouchMode);

    return () => {
      window.removeEventListener("resize", updateTouchMode);
    };
  }, []);

  useEffect(() => {
    const ScrollTriggerPlugin = registerScrollTrigger();
    const root = rootRef.current;

    if (!ScrollTriggerPlugin || !root) {
      return undefined;
    }

    const context = gsap.context(() => {
      const aboutSection = aboutSectionRef.current;
      const contactSection = contactSectionRef.current;

      ScrollTriggerPlugin.create({
        trigger: root,
        start: "top top",
        end: "bottom bottom",
        invalidateOnRefresh: true,
        onRefresh: (self) => {
          scrollProgressRef.current = self.progress;
        },
        onUpdate: (self) => {
          scrollProgressRef.current = self.progress;
        },
      });

      if (aboutSection) {
        pinElement(aboutPinnedRef.current, {
          trigger: aboutSection,
          start: "top top",
          end: "bottom bottom",
          pinSpacing: false,
        });

        createScrubbedTimeline({
          scrollTrigger: {
            trigger: aboutSection,
            start: "top 72%",
            end: "center 28%",
          },
        }).fromTo(
          "[data-about-reveal]",
          { autoAlpha: 0, y: 54 },
          { autoAlpha: 1, duration: 1, ease: "power3.out", stagger: 0.1, y: 0 },
        );
      }

      if (isWeakTouchDevice) {
        gsap.utils.toArray<HTMLElement>("[data-mobile-fallback]", root).forEach((element) => {
          gsap.fromTo(
            element,
            { autoAlpha: 0.68, scale: 0.98, y: 42 },
            {
              autoAlpha: 1,
              ease: "power2.out",
              scale: 1,
              scrollTrigger: {
                trigger: element,
                start: "top 88%",
                end: "top 58%",
                scrub: 0.45,
              },
              y: 0,
            },
          );
        });
      }

      if (contactSection) {
        createScrubbedTimeline({
          scrollTrigger: {
            trigger: contactSection,
            start: "top 78%",
            end: "top 26%",
          },
        }).fromTo(
          "[data-contact-reveal]",
          { autoAlpha: 0, y: 48 },
          { autoAlpha: 1, duration: 1, ease: "power3.out", stagger: 0.12, y: 0 },
        );
      }

      window.requestAnimationFrame(() => ScrollTriggerPlugin.refresh());
    }, root);

    return () => {
      context.revert();
    };
  }, [isWeakTouchDevice]);

  return (
    <>
      <SiteNavigation />
      <main ref={rootRef} className="relative min-h-screen overflow-x-clip bg-[#030407]">
        <SceneCanvas
          className="fixed inset-0 z-[3]"
          mode="scroll"
          scrollProgressRef={scrollProgressRef}
        />

        <div className="pointer-events-none fixed inset-0 z-[1] bg-[radial-gradient(circle_at_68%_28%,rgba(255,24,47,0.16),transparent_28rem),linear-gradient(90deg,rgba(3,4,7,0.9)_0%,rgba(3,4,7,0.58)_42%,rgba(3,4,7,0.12)_100%)]" />
        <div className="pointer-events-none fixed inset-0 z-[1] opacity-40 [background-image:linear-gradient(rgba(255,255,255,0.055)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.055)_1px,transparent_1px)] [background-size:64px_64px]" />
        <div className="pointer-events-none fixed left-0 top-16 z-[4] h-[calc(100%-4rem)] w-1 bg-red-600" />
        <div className="pointer-events-none fixed right-0 top-16 z-[4] h-[calc(100%-4rem)] w-px bg-white/10" />

        <section className="relative z-10 min-h-screen overflow-hidden" id="hero">
          <HeroSection />
        </section>

        <section
          className="relative z-10 min-h-[150vh] border-y border-white/10 bg-black/28"
          id="about"
          ref={aboutSectionRef}
        >
          <div className="container flex min-h-screen items-center py-24 pt-28" ref={aboutPinnedRef}>
            <div className="grid w-full gap-10 lg:grid-cols-[0.85fr_1fr] lg:items-center">
              <div data-about-reveal data-mobile-fallback>
                <p className="font-mono text-xs font-black uppercase tracking-normal text-red-400">
                  01 / Developer Profile
                </p>
                <h2 className="mt-5 max-w-3xl text-balance text-4xl font-black uppercase leading-[0.9] text-white sm:text-6xl lg:text-7xl">
                  Built for clean systems and cinematic interfaces.
                </h2>
                <p className="mt-6 max-w-xl text-base leading-7 text-zinc-300 sm:text-lg">
                  Prajjwol Bhandari creates production-ready web experiences where backend
                  structure, interface polish, and real-time 3D motion work as one system.
                </p>
              </div>

              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {skillMetrics.map((metric) => (
                    <div
                      className="border border-white/12 bg-black/50 p-4 backdrop-blur-md"
                      data-about-reveal
                      data-mobile-fallback
                      key={metric.label}
                    >
                      <div className="font-mono text-3xl font-black leading-none text-white">
                        {metric.value}
                      </div>
                      <div className="mt-2 text-[0.68rem] font-black uppercase leading-tight text-red-300">
                        {metric.label}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid gap-3">
                  {profileTimeline.map((item) => (
                    <article
                      className="grid gap-4 border border-white/12 bg-black/42 p-5 backdrop-blur-md sm:grid-cols-[4rem_1fr]"
                      data-about-reveal
                      data-mobile-fallback
                      key={item.title}
                    >
                      <div className="font-mono text-2xl font-black text-red-500">
                        {item.year}
                      </div>
                      <div>
                        <h3 className="text-lg font-black uppercase text-white">{item.title}</h3>
                        <p className="mt-2 text-sm leading-6 text-zinc-400">{item.body}</p>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <ProjectsSection />

        <section
          className="relative z-10 flex min-h-screen items-center border-t border-white/10 bg-black/35 py-24 pt-28"
          id="contact"
          ref={contactSectionRef}
        >
          <div className="container grid gap-10 lg:grid-cols-[0.9fr_1fr] lg:items-end">
            <div data-contact-reveal data-mobile-fallback>
              <p className="font-mono text-xs font-black uppercase tracking-normal text-red-400">
                03 / Contact
              </p>
              <h2 className="mt-5 max-w-3xl text-balance text-4xl font-black uppercase leading-[0.9] text-white sm:text-6xl lg:text-7xl">
                Let&apos;s ship the next immersive build.
              </h2>
            </div>

            <div className="grid gap-4" data-contact-reveal data-mobile-fallback>
              <p className="max-w-xl text-base leading-7 text-zinc-300 sm:text-lg">
                Available for full-stack product interfaces, 3D web experiences, Supabase
                content systems, and motion-heavy portfolio builds.
              </p>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  asChild
                  className="h-12 rounded-none border-red-500 bg-red-600 font-black uppercase text-white hover:bg-red-500"
                >
                  <a href="mailto:hello@prajjwol-bhandari.dev">
                    <Mail />
                    Email Prajjwol
                  </a>
                </Button>
                <Button
                  asChild
                  className="h-12 rounded-none border-white/16 bg-black/35 font-black uppercase text-white hover:border-red-500/70 hover:bg-red-600/12"
                  variant="outline"
                >
                  <a href="https://github.com/" rel="noreferrer" target="_blank">
                    <GitBranch />
                    GitHub
                  </a>
                </Button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="border border-white/12 bg-black/42 p-4">
                  <Sparkles className="size-5 text-red-400" />
                  <p className="mt-3 text-sm font-bold uppercase text-white">
                    3D-first storytelling
                  </p>
                </div>
                <div className="border border-white/12 bg-black/42 p-4">
                  <Rocket className="size-5 text-red-400" />
                  <p className="mt-3 text-sm font-bold uppercase text-white">
                    Performance-focused delivery
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
