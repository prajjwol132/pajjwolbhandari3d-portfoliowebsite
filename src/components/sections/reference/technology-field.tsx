"use client";

import Image from "next/image";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

const ControllerCanvas = dynamic(
  () => import("@/components/3d/controller-canvas").then((module) => module.ControllerCanvas),
  { ssr: false },
);

const technologies = [
  ["Tailwind CSS", "tailwindcss"],
  ["Django", "django"],
  ["Python", "python"],
  ["Next.js", "nextdotjs"],
  ["React", "react"],
  ["MySQL", "mysql"],
  ["HTML", "html5"],
  ["DaVinci Resolve", "davinciresolve"],
  ["Premiere Pro", "adobepremierepro"],
  ["Vercel", "vercel"],
  ["GitHub", "github"],
  ["MongoDB", "mongodb"],
];

export function TechnologyField() {
  const field = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const element = field.current;
    if (!element) return;
    const preload = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        setReady(true);
        preload.disconnect();
      }
    }, { rootMargin: "300px" });
    const introduction = element.closest("section")?.querySelector("#about-heading");
    if (introduction) preload.observe(introduction);
    preload.observe(element);
    return () => preload.disconnect();
  }, []);

  return (
    <div id="tools" ref={field} className="technology-field" aria-label="Tools I work with">
      <div className="technology-model">
        {ready && <ControllerCanvas sectionRef={field} />}
      </div>
      <div className="technology-columns">
        {technologies.map(([name, slug], index) => (
          <div className={`technology-mark technology-mark-${index % 4}`} key={slug}>
            <Image src={`/media/stack/${slug}.svg`} width={42} height={42} alt="" />
            <span>{name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
