"use client";

import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { useEffect, useRef } from "react";
import { usePortfolioContent } from "@/components/providers/portfolio-content-provider";
import { registerScrollTrigger } from "@/lib/gsap";
import { getPageImage } from "@/data/page-media";

const chapters = [
  {
    title: "The foundation",
    imageKey: "history_foundation",
    alt: "Prajjwol seated outdoors in a blazer",
    description: "",
  },
  {
    title: "The edit",
    imageKey: "history_edit",
    alt: "Prajjwol seated on a stool, smiling",
    description: "Video editing is my main focus. I shape raw footage into stories with rhythm, purpose, and a clear message. From social-media content and event highlights to promotional videos, I bring together pacing, sound, and color to make every moment earn its place.",
  },
  {
    title: "Motion & AI",
    imageKey: "history_motion_ai",
    alt: "An evening portrait of Prajjwol",
    description: "I create motion graphics and AI-generated video ads for clients, combining visuals with editing, animated text, and sound. AI gives me another way to bring creative concepts to life. I shape the result around the brand, the message, and the audience, with the same attention I bring to every edit.",
  },
  {
    title: "Beyond the views",
    imageKey: "history_beyond_views",
    alt: "Prajjwol at Surya Events",
    description: "A good-looking video is only the beginning. I bring marketing knowledge into the edit: who it is for, what makes someone stop scrolling, and why they should keep watching. I analyze video performance to refine hooks, pacing, titles, and captions, helping content reach the right audience on social media.",
  },
  {
    title: "Beyond the edit",
    imageKey: "history_beyond_edit",
    alt: "Prajjwol in a red jacket overlooking a mountain landscape",
    description: "My IT studies also take me into web development. I build responsive websites that give ideas, businesses, and creative work a place online. Video editing remains my main focus, with AI video creation and web development offering clients more ways to bring an idea to life.",
  },
];

export function HistorySection() {
  const sectionRef = useRef<HTMLElement>(null);
  const { profile, pageMedia } = usePortfolioContent();
  const age = profile.metrics.find(metric => /^age$/i.test(metric.label))?.value ?? "21";
  const semester = profile.metrics.find(metric => /semester/i.test(metric.label))?.value ?? "4th";
  const foundation = `I'm ${profile.full_name}, a ${age}-year-old IT student in my ${semester} semester. Video editing is at the heart of my creative work, alongside motion graphics, AI-generated ads, and web development. I combine storytelling, marketing knowledge, and technical curiosity to turn ideas into something people can watch, use, and connect with.`;
  useEffect(() => {
    const section = sectionRef.current;
    const ScrollTrigger = registerScrollTrigger();
    if (!section || !ScrollTrigger) return;

    const photos = Array.from(section.querySelectorAll<HTMLElement>("[data-history-card]"));
    let activePhoto: HTMLElement | null = null;
    let refreshFrame = 0;

    const updateActivePhoto = () => {
      let nextPhoto: HTMLElement | null = null;
      let closestDistance = Infinity;

      // Scale around the center so the focal point stays stable during the pop.
      for (const photo of photos) {
        const rect = photo.getBoundingClientRect();
        if (rect.bottom <= 0 || rect.top >= window.innerHeight) continue;
        const distance = Math.abs(rect.top + rect.height / 2 - window.innerHeight / 2);
        if (distance < closestDistance) {
          closestDistance = distance;
          nextPhoto = photo;
        }
      }

      if (nextPhoto === activePhoto) return;
      activePhoto?.removeAttribute("data-history-active");
      activePhoto?.closest<HTMLElement>(".history-chapter")?.removeAttribute("data-history-selected");
      nextPhoto?.setAttribute("data-history-active", "true");
      nextPhoto?.closest<HTMLElement>(".history-chapter")?.setAttribute("data-history-selected", "true");
      activePhoto = nextPhoto;
    };

    const trigger = ScrollTrigger.create({
      trigger: section,
      start: "top bottom",
      end: "bottom top",
      onUpdate: updateActivePhoto,
      onRefresh: updateActivePhoto,
    });

    const observer = new ResizeObserver(() => {
      window.cancelAnimationFrame(refreshFrame);
      refreshFrame = window.requestAnimationFrame(() => trigger.refresh());
    });
    observer.observe(section);
    updateActivePhoto();

    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(refreshFrame);
      trigger.kill();
      activePhoto?.removeAttribute("data-history-active");
      activePhoto?.closest<HTMLElement>(".history-chapter")?.removeAttribute("data-history-selected");
    };
  }, []);

  return (
    <section ref={sectionRef} id="history" className="portfolio-history" aria-labelledby="history-heading">
      <h2 id="history-heading" className="sr-only">My creative journey</h2>
      <div className="history-chapters">
        {chapters.map((chapter, index) => (
          <article id={`chapter-${index + 1}`} data-chapter={index} className="history-chapter"
            aria-labelledby={`chapter-title-${index + 1}`} key={chapter.title}>
            <h3 className="history-title" id={`chapter-title-${index + 1}`}>{chapter.title}</h3>
            <div className="history-photo" data-history-card>
              <Image src={getPageImage(pageMedia, chapter.imageKey)} alt={pageMedia.find((item) => item.key === chapter.imageKey)?.alt_text || chapter.alt} fill
                quality={95} sizes="(max-width: 767px) 260px, (max-width: 1300px) 25vw, 320px" />
            </div>
            <div className="history-copy">
              <p>{index === 0 ? foundation : chapter.description}</p>
              {index === chapters.length - 1 && (
                <a className="portfolio-text-link" href="#contact">Let&apos;s bring your idea to life <ArrowUpRight size={17} aria-hidden /></a>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
