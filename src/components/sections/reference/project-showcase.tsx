"use client";

import Image from "next/image";
import { ArrowLeft, ArrowRight, ArrowUpRight, ChevronDown, ChevronUp, Play, Code2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePortfolioContent } from "@/components/providers/portfolio-content-provider";
import { useSmoothScroll } from "@/components/providers/smooth-scroll-provider";
import type { ProjectWithCategory } from "@/types/database";
import { registerScrollTrigger } from "@/lib/gsap";
import { isVideoProject } from "@/lib/project-kind";

const INDEX_PREVIEW_COUNT = 5;
const LEAD_SHOWCASE_SLUG = "mcs-admissions";

function HoverPreview({ src, onStop }: { src: string; onStop: () => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    const element = video.current;
    if (!element) return;
    element.src = src;
    let cancelled = false;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const stopWhenHidden = () => { if (document.hidden) onStop(); };
    const stopForMotion = () => { if (motion.matches) onStop(); };
    const observer = new IntersectionObserver(([entry]) => { if (!entry.isIntersecting) onStop(); });
    observer.observe(element);
    document.addEventListener("visibilitychange", stopWhenHidden);
    motion.addEventListener("change", stopForMotion);
    if (motion.matches) onStop();
    else void element.play().then(() => { if (!cancelled) setPlaying(true); }).catch(() => { if (!cancelled) onStop(); });
    return () => {
      cancelled = true;
      observer.disconnect();
      document.removeEventListener("visibilitychange", stopWhenHidden);
      motion.removeEventListener("change", stopForMotion);
      element.pause();
      element.removeAttribute("src");
      element.load();
    };
  }, [src, onStop]);
  return <video ref={video} src={src} muted loop playsInline preload="none" aria-hidden
    tabIndex={-1} onError={onStop} className={playing ? "is-playing" : ""} />;
}

function ShowcaseCard({
  project,
  onSelect,
}: {
  project: ProjectWithCategory;
  onSelect: (project: ProjectWithCategory) => void;
}) {
  const [previewing, setPreviewing] = useState(false);
  const videoProject = isVideoProject(project);
  const previewUrl = project.media?.preview_url ?? project.video_url;
  const start = () => {
    if (previewUrl && window.matchMedia("(hover: hover)").matches && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) setPreviewing(true);
  };
  const stop = useCallback(() => setPreviewing(false), []);
  return (
    <article className="showcase-card">
      <button
        onClick={() => { stop(); onSelect(project); }}
        onPointerEnter={event => { if (event.pointerType !== "touch") start(); }}
        onPointerLeave={stop}
        onFocus={start}
        onBlur={stop}
        aria-label={`View ${project.title}`}
      >
        <div className="showcase-image" data-video={videoProject}>
          {project.featured_image_url ? <Image
            src={project.featured_image_url}
            alt={project.title}
            fill
            sizes="(min-width: 900px) 30vw, 80vw"
          /> : <div className="showcase-poster">
            {videoProject ? <Play size={38} aria-hidden /> : <Code2 size={38} aria-hidden />}
            <strong>{project.title}</strong>
            <span>{videoProject ? "Video edit" : "Web project"}</span>
          </div>}
          {previewing && previewUrl && <HoverPreview src={previewUrl} onStop={stop} />}
          {project.media && <span className="showcase-duration">
            {Math.floor(Math.round(project.media.duration) / 60)}:{String(Math.round(project.media.duration) % 60).padStart(2, "0")}
          </span>}
          <span className="showcase-open">
            {videoProject ? <Play size={22} aria-hidden /> : <ArrowUpRight size={22} aria-hidden />}
          </span>
        </div>
        <p className="portfolio-eyebrow">
          {project.category?.name || "Independent project"}
        </p>
        <h3>{project.title}</h3>
        <p className="showcase-description">{project.short_description}</p>
      </button>
    </article>
  );
}

export function ProjectShowcase({
  onSelect,
}: {
  onSelect: (project: ProjectWithCategory) => void;
}) {
  const { allProjects, categories, categoryCounts } = usePortfolioContent();
  const [category, setCategory] = useState("all");
  const track = useRef<HTMLDivElement>(null);
  const projects = allProjects
    .filter((project) => category === "all" || project.category?.slug === category)
    .sort((a, b) => Number(b.slug === LEAD_SHOWCASE_SLUG) - Number(a.slug === LEAD_SHOWCASE_SLUG));
  function scroll(direction: number) {
    track.current?.scrollBy({
      left: direction * track.current.clientWidth * 0.85,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
  }
  return (
    <section
      id="projects"
      className="portfolio-projects"
      aria-labelledby="projects-heading"
    >
      <span id="media" />
      <div className="section-ghost" aria-hidden>
        Selected work
      </div>
      <div className="section-title-row">
        <div>
          <p className="portfolio-eyebrow">Video first. Ideas in every format.</p>
          <h2 id="projects-heading">Edits & creative work</h2>
        </div>
        <div className="carousel-buttons">
          <button
            className="portfolio-icon-button"
            aria-label="Previous projects"
            title="Previous projects"
            onClick={() => scroll(-1)}
          >
            <ArrowLeft size={18} />
          </button>
          <button
            className="portfolio-icon-button"
            aria-label="Next projects"
            title="Next projects"
            onClick={() => scroll(1)}
          >
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
      <div
        className="project-filters"
        role="group"
        aria-label="Project category"
      >
        <button
          aria-pressed={category === "all"}
          onClick={() => { setCategory("all"); track.current?.scrollTo({ left: 0 }); }}
        >
          All projects{" "}
          <span>[{String(allProjects.length).padStart(2, "0")}]</span>
        </button>
        {categories.map((item) => (
          <button
            key={item.id}
            aria-pressed={category === item.slug}
            onClick={() => {
              setCategory(item.slug);
              track.current?.scrollTo({ left: 0 });
            }}
          >
            {item.name}{" "}
            <span>
              [{String(categoryCounts[item.slug] || 0).padStart(2, "0")}]
            </span>
          </button>
        ))}
      </div>
      <div className="showcase-track" ref={track} data-lenis-prevent-wheel>
        {projects.map((project) => (
          <ShowcaseCard
            key={project.id}
            project={project}
            onSelect={onSelect}
          />
        ))}
      </div>
      {!projects.length && (
        <p className="empty-projects" role="status">
          No projects in this category yet. More work is on the way.
        </p>
      )}
    </section>
  );
}

export function ProjectCalendar({
  onSelect,
}: {
  onSelect: (project: ProjectWithCategory) => void;
}) {
  const { allProjects } = usePortfolioContent();
  const { lenis } = useSmoothScroll();
  const [expanded, setExpanded] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const interactionPending = useRef(false);
  const visibleProjects = expanded ? allProjects : allProjects.slice(0, INDEX_PREVIEW_COUNT);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      lenis?.resize();
      registerScrollTrigger()?.refresh();
      if (!interactionPending.current) return;
      interactionPending.current = false;

      // Keep keyboard navigation at the new work, not past the expanded list.
      if (expanded) {
        listRef.current?.querySelectorAll<HTMLButtonElement>(".calendar-row")[INDEX_PREVIEW_COUNT]?.focus({ preventScroll: true });
      } else {
        toggleRef.current?.focus({ preventScroll: true });
        toggleRef.current?.scrollIntoView({ block: "nearest", behavior: "instant" });
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, [expanded, allProjects.length, lenis]);

  return (
    <section
      id="calendar"
      className="portfolio-calendar"
      aria-labelledby="calendar-heading"
    >
      <div className="calendar-heading" data-reference-reveal>
        <p className="portfolio-eyebrow">The work, at a glance</p>
        <h2 id="calendar-heading">Creative work index</h2>
      </div>
      <div id="creative-work-list" className="calendar-list" ref={listRef}>
        {visibleProjects.map((project, index) => (
          <button
            key={project.id}
            onClick={() => onSelect(project)}
            className="calendar-row"
          >
            <span className="calendar-number">
              {String(index + 1).padStart(2, "0")}
            </span>
            <span>
              <strong>{project.title}</strong>
              <small>
                {project.category?.name || "Independent project"} /{" "}
                {project.tech_stack.slice(0, 2).join(" + ")}
              </small>
            </span>
            {Number.isFinite(Date.parse(project.created_at)) ? <time dateTime={project.created_at}>
              {new Intl.DateTimeFormat("en-GB", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                timeZone: "UTC",
              }).format(new Date(project.created_at))}
            </time> : <span className="calendar-format">{isVideoProject(project) ? "Video edit" : "Web project"}</span>}
            <ArrowUpRight size={18} />
          </button>
        ))}
      </div>
      {allProjects.length > INDEX_PREVIEW_COUNT && (
        <div className="calendar-actions">
          <button
            ref={toggleRef}
            type="button"
            className="portfolio-cta calendar-toggle"
            aria-expanded={expanded}
            aria-controls="creative-work-list"
            onClick={() => {
              interactionPending.current = true;
              setExpanded(current => !current);
            }}
          >
            {expanded ? "Show Less" : "Show All"}
            {expanded ? <ChevronUp size={18} aria-hidden /> : <ChevronDown size={18} aria-hidden />}
          </button>
          <p className="sr-only" role="status">
            Showing {visibleProjects.length} of {allProjects.length} projects
          </p>
        </div>
      )}
      {!allProjects.length && (
        <p className="empty-projects">
          New projects will appear here when published.
        </p>
      )}
    </section>
  );
}
