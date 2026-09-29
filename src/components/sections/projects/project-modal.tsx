"use client";

/* eslint-disable @next/next/no-img-element */

import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, motion } from "framer-motion";
import { ExternalLink, Film, GitBranch, ImageIcon, X } from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ProjectWithCategory } from "@/types/database";

interface ProjectModalProps {
  onOpenChange: (open: boolean) => void;
  open: boolean;
  project: ProjectWithCategory | null;
}

interface GalleryItem {
  label: string;
  src: string;
  type: "image" | "video";
}

function buildGallery(project: ProjectWithCategory): GalleryItem[] {
  const media: GalleryItem[] = [];

  if (project.video_url) {
    media.push({
      label: `${project.title} video preview`,
      src: project.video_url,
      type: "video",
    });
  }

  project.gallery_images.forEach((src, index) => {
    media.push({
      label: `${project.title} gallery image ${index + 1}`,
      src,
      type: "image",
    });
  });

  if (media.length === 0 && project.featured_image_url) {
    media.push({
      label: `${project.title} featured image`,
      src: project.featured_image_url,
      type: "image",
    });
  }

  return media;
}

function MarkdownDescription({ content }: { content: string }) {
  const lines = content.split("\n").map((line) => line.trimEnd());
  const nodes: ReactNode[] = [];
  let bulletBuffer: string[] = [];

  const flushBullets = () => {
    if (bulletBuffer.length === 0) {
      return;
    }

    nodes.push(
      <ul className="my-5 grid gap-2 border-l border-red-500/40 pl-5 text-sm leading-6 text-zinc-300" key={`ul-${nodes.length}`}>
        {bulletBuffer.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>,
    );
    bulletBuffer = [];
  };

  lines.forEach((line, index) => {
    if (line.length === 0) {
      flushBullets();
      return;
    }

    if (line.startsWith("- ")) {
      bulletBuffer.push(line.slice(2));
      return;
    }

    flushBullets();

    if (line.startsWith("### ")) {
      nodes.push(
        <h4 className="mt-6 text-lg font-black uppercase text-white" key={index}>
          {line.slice(4)}
        </h4>,
      );
      return;
    }

    if (line.startsWith("## ")) {
      nodes.push(
        <h3 className="mt-8 text-xl font-black uppercase text-white" key={index}>
          {line.slice(3)}
        </h3>,
      );
      return;
    }

    if (line.startsWith("# ")) {
      nodes.push(
        <h2 className="mt-8 text-2xl font-black uppercase text-white" key={index}>
          {line.slice(2)}
        </h2>,
      );
      return;
    }

    nodes.push(
      <p className="mt-4 text-sm leading-7 text-zinc-300 sm:text-base" key={index}>
        {line}
      </p>,
    );
  });

  flushBullets();

  return <div>{nodes}</div>;
}

function MediaFallback({ title }: { title: string }) {
  return (
    <div className="flex aspect-video items-center justify-center bg-[radial-gradient(circle_at_70%_35%,rgba(255,31,54,0.2),transparent_20rem),linear-gradient(135deg,#05070b,#111827_56%,#25070e)]">
      <div className="text-center">
        <ImageIcon className="mx-auto size-12 text-red-300" />
        <p className="mt-4 font-mono text-xs font-black uppercase text-zinc-300">
          {title}
        </p>
      </div>
    </div>
  );
}

export function ProjectModal({ onOpenChange, open, project }: ProjectModalProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const media = useMemo(() => (project ? buildGallery(project) : []), [project]);
  const activeMedia = media[activeIndex];
  const breakdownEntries = Object.entries(project?.technical_breakdown ?? {});

  useEffect(() => {
    setActiveIndex(0);
  }, [project?.id]);

  return (
    <Dialog.Root onOpenChange={onOpenChange} open={open}>
      <AnimatePresence>
        {open && project ? (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild forceMount>
              <motion.div
                animate={{ opacity: 1 }}
                className="fixed inset-0 z-50 bg-black/82 backdrop-blur-md"
                exit={{ opacity: 0 }}
                initial={{ opacity: 0 }}
              />
            </Dialog.Overlay>
            <Dialog.Content asChild forceMount>
              <motion.div
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="fixed inset-2 z-50 overflow-hidden border border-white/14 bg-[#05070b] shadow-[0_40px_140px_rgba(0,0,0,0.68)] outline-none sm:inset-4"
                exit={{ opacity: 0, scale: 0.98, y: 18 }}
                initial={{ opacity: 0, scale: 0.98, y: 18 }}
                transition={{ duration: 0.24, ease: "easeOut" }}
              >
                <div className="flex h-full flex-col">
                  <header className="flex shrink-0 items-start justify-between gap-4 border-b border-white/10 bg-black/58 p-4 backdrop-blur-md sm:p-6">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="border border-red-500/45 bg-red-600/12 px-3 py-2 font-mono text-[0.64rem] font-black uppercase text-red-200">
                          {project.category?.name ?? "Uncategorized"}
                        </span>
                        {project.is_featured ? (
                          <span className="border border-white/12 bg-white/[0.04] px-3 py-2 font-mono text-[0.64rem] font-black uppercase text-zinc-300">
                            Featured Build
                          </span>
                        ) : null}
                      </div>
                      <Dialog.Title className="mt-4 max-w-4xl text-3xl font-black uppercase leading-none text-white sm:text-5xl">
                        {project.title}
                      </Dialog.Title>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      {project.live_demo_url ? (
                        <Button
                          asChild
                          className="hidden h-11 rounded-none border-red-500 bg-red-600 font-black uppercase text-white hover:bg-red-500 sm:inline-flex"
                        >
                          <a href={project.live_demo_url} rel="noreferrer" target="_blank">
                            Live Demo
                            <ExternalLink />
                          </a>
                        </Button>
                      ) : null}
                      <Dialog.Close className="flex size-11 items-center justify-center border border-white/12 bg-black/45 text-white transition-colors hover:border-red-500/70 hover:bg-red-600/16">
                        <X className="size-5" />
                        <span className="sr-only">Close project modal</span>
                      </Dialog.Close>
                    </div>
                  </header>

                  <div className="grid min-h-0 flex-1 overflow-y-auto lg:grid-cols-[minmax(0,1.12fr)_minmax(24rem,0.88fr)]">
                    <div className="border-b border-white/10 p-4 lg:border-b-0 lg:border-r lg:p-6">
                      <div className="overflow-hidden border border-white/12 bg-black">
                        {activeMedia?.type === "video" ? (
                          <video
                            autoPlay
                            className="aspect-video h-full w-full object-cover"
                            controls
                            loop
                            muted
                            playsInline
                            src={activeMedia.src}
                          />
                        ) : activeMedia?.type === "image" ? (
                          <img
                            alt={activeMedia.label}
                            className="aspect-video h-full w-full object-cover"
                            src={activeMedia.src}
                          />
                        ) : (
                          <MediaFallback title={project.title} />
                        )}
                      </div>

                      {media.length > 1 ? (
                        <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-5">
                          {media.map((item, index) => {
                            const isActive = index === activeIndex;

                            return (
                              <button
                                className={cn(
                                  "relative aspect-video overflow-hidden border bg-black transition-colors",
                                  isActive
                                    ? "border-red-500/80"
                                    : "border-white/12 hover:border-red-500/50",
                                )}
                                key={`${item.type}-${item.src}`}
                                onClick={() => setActiveIndex(index)}
                                type="button"
                              >
                                {item.type === "video" ? (
                                  <div className="flex h-full items-center justify-center bg-red-600/12 text-red-200">
                                    <Film className="size-5" />
                                  </div>
                                ) : (
                                  <img
                                    alt={item.label}
                                    className="h-full w-full object-cover opacity-80"
                                    src={item.src}
                                  />
                                )}
                                <span className="sr-only">{item.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      ) : null}

                      <div className="mt-5 flex flex-wrap gap-2">
                        {project.tech_stack.map((item) => (
                          <span
                            className="border border-white/12 bg-white/[0.04] px-3 py-2 font-mono text-[0.66rem] font-black uppercase text-zinc-300"
                            key={`${project.id}-${item}`}
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="p-4 sm:p-6">
                      <Dialog.Description className="text-base leading-7 text-zinc-300">
                        {project.short_description}
                      </Dialog.Description>

                      <MarkdownDescription content={project.full_description} />

                      {breakdownEntries.length > 0 ? (
                        <div className="mt-8">
                          <h3 className="font-mono text-xs font-black uppercase text-red-300">
                            Technical Breakdown
                          </h3>
                          <div className="mt-4 grid gap-2">
                            {breakdownEntries.map(([label, value]) => (
                              <div
                                className="grid gap-2 border border-white/12 bg-black/35 p-4 sm:grid-cols-[10rem_1fr]"
                                key={label}
                              >
                                <span className="font-mono text-[0.68rem] font-black uppercase text-zinc-500">
                                  {label}
                                </span>
                                <span className="text-sm font-semibold text-white">
                                  {value}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}

                      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                        {project.live_demo_url ? (
                          <Button
                            asChild
                            className="h-11 rounded-none border-red-500 bg-red-600 font-black uppercase text-white hover:bg-red-500"
                          >
                            <a href={project.live_demo_url} rel="noreferrer" target="_blank">
                              Live Demo
                              <ExternalLink />
                            </a>
                          </Button>
                        ) : null}
                        {project.github_url ? (
                          <Button
                            asChild
                            className="h-11 rounded-none border-white/12 bg-black/35 font-black uppercase text-white hover:border-red-500/70 hover:bg-red-600/12"
                            variant="outline"
                          >
                            <a href={project.github_url} rel="noreferrer" target="_blank">
                              <GitBranch />
                              Repository
                            </a>
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        ) : null}
      </AnimatePresence>
    </Dialog.Root>
  );
}
