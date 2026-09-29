"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowPathIconFallback } from "@/components/sections/projects/refresh-icon";
import { CategoryFilter } from "@/components/sections/projects/category-filter";
import { ProjectCard } from "@/components/sections/projects/project-card";
import { ProjectModal } from "@/components/sections/projects/project-modal";
import { Button } from "@/components/ui/button";
import { registerScrollTrigger } from "@/lib/gsap";
import { useProjects } from "@/hooks/use-projects";
import type { ProjectWithCategory } from "@/types/database";
import { useEffect, useState } from "react";

function ProjectSkeletonGrid() {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          className="min-h-[34rem] animate-pulse border border-white/10 bg-black/42"
          key={index}
        >
          <div className="aspect-[16/10] bg-white/[0.04]" />
          <div className="space-y-4 p-5">
            <div className="h-8 w-32 bg-white/[0.06]" />
            <div className="h-7 w-4/5 bg-white/[0.06]" />
            <div className="h-20 bg-white/[0.04]" />
            <div className="flex gap-2">
              <div className="h-8 w-20 bg-white/[0.05]" />
              <div className="h-8 w-16 bg-white/[0.05]" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ProjectsSection() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [selectedProject, setSelectedProject] = useState<ProjectWithCategory | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const {
    categories,
    categoryCounts,
    error,
    isRefetching,
    loading,
    projects,
    refetch,
    totalCount,
  } = useProjects({
    categorySlug: activeCategory,
  });

  useEffect(() => {
    const ScrollTriggerPlugin = registerScrollTrigger();

    if (!ScrollTriggerPlugin) {
      return;
    }

    window.requestAnimationFrame(() => ScrollTriggerPlugin.refresh());
  }, [projects.length, loading]);

  const handleQuickView = (project: ProjectWithCategory) => {
    setSelectedProject(project);
    setIsModalOpen(true);
  };

  const handleModalOpenChange = (open: boolean) => {
    setIsModalOpen(open);

    if (!open) {
      window.setTimeout(() => setSelectedProject(null), 180);
    }
  };

  return (
    <section
      className="relative z-10 min-h-screen overflow-hidden bg-black/45 py-24 pt-28"
      data-projects-section
      id="projects"
    >
      <div className="container">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <p className="font-mono text-xs font-black uppercase tracking-normal text-red-400">
              02 / Featured Projects
            </p>
            <h2 className="mt-5 max-w-4xl text-balance text-4xl font-black uppercase leading-[0.9] text-white sm:text-6xl">
              Software builds staged like high-speed telemetry.
            </h2>
          </div>
          <div className="flex items-center gap-3">
            {isRefetching ? (
              <span className="font-mono text-[0.68rem] font-black uppercase text-red-200">
                Syncing Supabase
              </span>
            ) : null}
            <Button
              className="h-11 rounded-none border-white/12 bg-black/35 font-black uppercase text-white hover:border-red-500/70 hover:bg-red-600/12"
              disabled={isRefetching}
              onClick={() => void refetch()}
              type="button"
              variant="outline"
            >
              <ArrowPathIconFallback className={isRefetching ? "animate-spin" : undefined} />
              Refresh
            </Button>
          </div>
        </div>

        {error ? (
          <div className="mt-8 border border-red-500/30 bg-red-950/20 p-4 text-sm leading-6 text-red-100">
            Supabase project data is unavailable, so the local project catalog is showing.
            Use Refresh after the database tables are ready.
          </div>
        ) : null}

        <div className="mt-8">
          <CategoryFilter
            activeSlug={activeCategory}
            categoryCounts={categoryCounts}
            categories={categories}
            disabled={isRefetching}
            onCategoryChange={setActiveCategory}
            totalCount={totalCount}
          />
        </div>

        <div className="mt-10">
          {loading ? (
            <ProjectSkeletonGrid />
          ) : projects.length > 0 ? (
            <motion.div
              className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
              layout
            >
              <AnimatePresence mode="popLayout">
                {projects.map((project) => (
                  <motion.div
                    key={project.id}
                    layout
                    initial={{ opacity: 0, scale: 0.98, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98, y: 20 }}
                    transition={{ duration: 0.24, ease: "easeOut" }}
                  >
                    <ProjectCard onQuickView={handleQuickView} project={project} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          ) : (
            <div className="border border-white/12 bg-black/45 p-8 text-center">
              <p className="font-mono text-xs font-black uppercase text-red-300">
                [ 00 ] Projects
              </p>
              <h3 className="mt-4 text-2xl font-black uppercase text-white">
                No builds in this lane yet.
              </h3>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-zinc-400">
                Choose another category or refresh the Supabase feed after adding
                project rows for this category.
              </p>
            </div>
          )}
        </div>
      </div>

      <ProjectModal
        onOpenChange={handleModalOpenChange}
        open={isModalOpen}
        project={selectedProject}
      />
    </section>
  );
}
