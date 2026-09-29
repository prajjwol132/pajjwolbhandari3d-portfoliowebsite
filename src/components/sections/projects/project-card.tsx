"use client";

/* eslint-disable @next/next/no-img-element */

import { motion } from "framer-motion";
import { ExternalLink, Eye, GitBranch, ImageIcon, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ProjectWithCategory } from "@/types/database";

interface ProjectCardProps {
  onQuickView: (project: ProjectWithCategory) => void;
  project: ProjectWithCategory;
}

function ProjectImageFallback({ title }: { title: string }) {
  return (
    <div className="flex h-full min-h-[15rem] items-center justify-center bg-[radial-gradient(circle_at_65%_35%,rgba(255,31,54,0.2),transparent_18rem),linear-gradient(135deg,#06080d,#111827_52%,#26080f)]">
      <div className="text-center">
        <ImageIcon className="mx-auto size-10 text-red-300" />
        <p className="mt-4 max-w-[14rem] text-balance font-mono text-xs font-black uppercase text-white/70">
          {title}
        </p>
      </div>
    </div>
  );
}

export function ProjectCard({ onQuickView, project }: ProjectCardProps) {
  const [isPreviewing, setIsPreviewing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    if (isPreviewing) {
      void video.play();
      return;
    }

    video.pause();
    video.currentTime = 0;
  }, [isPreviewing]);

  return (
    <motion.article
      className={cn(
        "group relative overflow-hidden border border-white/12 bg-[#06080d]/88 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_30px_90px_rgba(0,0,0,0.32)] backdrop-blur-md",
        "transition-colors duration-300 hover:border-red-500/50",
      )}
      data-mobile-fallback
      data-project-card
      initial={{ opacity: 0, y: 28 }}
      onMouseEnter={() => setIsPreviewing(true)}
      onMouseLeave={() => setIsPreviewing(false)}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ margin: "-10% 0px", once: true }}
    >
      <button
        aria-label={`Open quick view for ${project.title}`}
        className="absolute inset-0 z-[1] cursor-pointer"
        onClick={() => onQuickView(project)}
        type="button"
      />

      <div className="relative aspect-[16/10] overflow-hidden border-b border-white/10 bg-black">
        {project.featured_image_url ? (
          <img
            alt={`${project.title} featured preview`}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
            src={project.featured_image_url}
          />
        ) : (
          <ProjectImageFallback title={project.title} />
        )}

        {project.video_url ? (
          <video
            aria-hidden="true"
            className={cn(
              "absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-300",
              isPreviewing && "opacity-100",
            )}
            loop
            muted
            playsInline
            ref={videoRef}
            src={project.video_url}
          />
        ) : null}

        {project.video_url ? (
          <div className="absolute left-4 top-4 flex items-center gap-2 border border-red-500/50 bg-black/60 px-3 py-2 font-mono text-[0.62rem] font-black uppercase text-red-100 backdrop-blur-md">
            <Play className="size-3 fill-red-300" />
            Hover Preview
          </div>
        ) : null}

        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black via-black/58 to-transparent" />
      </div>

      <div className="pointer-events-none relative z-[2] grid min-h-[19rem] gap-5 p-5">
        <div className="flex items-start justify-between gap-4">
          <span className="border border-red-500/45 bg-red-600/12 px-3 py-2 font-mono text-[0.64rem] font-black uppercase text-red-200">
            {project.category?.name ?? "Uncategorized"}
          </span>
          <span className="font-mono text-[0.62rem] font-black uppercase text-zinc-500">
            {project.is_featured ? "Featured" : "Project"}
          </span>
        </div>

        <div>
          <h3 className="text-2xl font-black uppercase leading-tight text-white">
            {project.title}
          </h3>
          <p className="mt-3 text-sm leading-6 text-zinc-400">
            {project.short_description}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {project.tech_stack.map((item) => (
            <span
              className="border border-white/12 bg-white/[0.04] px-3 py-2 font-mono text-[0.62rem] font-black uppercase text-zinc-300"
              key={`${project.id}-${item}`}
            >
              {item}
            </span>
          ))}
        </div>

        <div className="pointer-events-auto mt-auto grid grid-cols-[1fr_auto_auto] gap-2 border-t border-white/10 pt-4">
          <Button
            className="relative z-[3] h-10 rounded-none border-red-500 bg-red-600 px-3 text-xs font-black uppercase text-white hover:bg-red-500"
            onClick={() => onQuickView(project)}
            type="button"
          >
            <Eye />
            Quick View
          </Button>
          <Button
            asChild={Boolean(project.github_url)}
            className="relative z-[3] h-10 rounded-none border-white/12 bg-black/35 px-3 text-xs font-black uppercase text-white hover:border-red-500/70 hover:bg-red-600/12"
            disabled={!project.github_url}
            title={project.github_url ? "Open GitHub repository" : "Repository link unavailable"}
            type="button"
            variant="outline"
          >
            {project.github_url ? (
              <a href={project.github_url} rel="noreferrer" target="_blank">
                <GitBranch />
              </a>
            ) : (
              <span>
                <GitBranch />
              </span>
            )}
          </Button>
          <Button
            asChild={Boolean(project.live_demo_url)}
            className="relative z-[3] h-10 rounded-none border-white/12 bg-black/35 px-3 text-xs font-black uppercase text-white hover:border-red-500/70 hover:bg-red-600/12"
            disabled={!project.live_demo_url}
            title={project.live_demo_url ? "Open live demo" : "Live demo unavailable"}
            type="button"
            variant="outline"
          >
            {project.live_demo_url ? (
              <a href={project.live_demo_url} rel="noreferrer" target="_blank">
                <ExternalLink />
              </a>
            ) : (
              <span>
                <ExternalLink />
              </span>
            )}
          </Button>
        </div>
      </div>
    </motion.article>
  );
}
