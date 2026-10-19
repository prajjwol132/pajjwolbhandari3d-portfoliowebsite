"use client";

import dynamic from "next/dynamic";
import { ArrowDownToLine, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { PortfolioHeroSection } from "@/components/sections/portfolio-hero-section";
import { ReferenceScrollEffects } from "@/components/sections/reference-scroll-effects";
import {
  PortfolioContentProvider,
  usePortfolioContent,
} from "@/components/providers/portfolio-content-provider";
import { useSmoothScroll } from "@/components/providers/smooth-scroll-provider";
import { HistorySection } from "./reference/history-section";
import { AboutPhotoComposition } from "./reference/about-photo-composition";
import { TechnologyField } from "./reference/technology-field";
import { ProjectShowcase, ProjectCalendar } from "./reference/project-showcase";
import { GallerySection } from "./reference/gallery-section";
import { PortfolioContactSection } from "./reference/contact-section";
import { FeatureVideoSection } from "./reference/feature-video-section";
import { PortfolioNavigation } from "./reference/portfolio-navigation";
import type { ProjectWithCategory } from "@/types/database";

const ProjectModal = dynamic(
  () =>
    import("./projects/project-modal").then((module) => module.ProjectModal),
  { ssr: false },
);

function AboutSection() {
  return (
    <section
      id="about"
      className="portfolio-about"
      aria-labelledby="about-heading"
    >
      <AboutPhotoComposition />
      <TechnologyField />
      <a className="portfolio-cta" href="#contact">
        Create with me <Plus size={15} />
      </a>
    </section>
  );
}

function CollaborationSection({ navigationOpen }: { navigationOpen: boolean }) {
  const { profile, allProjects } = usePortfolioContent();
  const videoProject = allProjects.find((project) => project.video_url);
  return (
    <>
      <section
        className="portfolio-collaboration"
        aria-labelledby="collaboration-heading"
      >
        <div className="checker-fade" aria-hidden />
        <div className="collaboration-copy" data-reference-reveal>
          <p className="portfolio-eyebrow">For the next chapter</p>
          <h2 id="collaboration-heading">
            Your next idea.
            <br />A story <span>worth watching.</span>
          </h2>
          <p>
            Video editing and motion graphics lead the way.
            <br />
            AI-generated ads and websites take your idea further.
          </p>
          <a className="portfolio-cta" href={profile.resume_url || "/resume"}>
            View my resume <ArrowDownToLine size={16} />
          </a>
        </div>
      </section>
      <FeatureVideoSection key={videoProject?.id || "no-film"} project={videoProject} navigationOpen={navigationOpen} />
    </>
  );
}

function PortfolioPageContent({ characterPreview }: { characterPreview: boolean }) {
  const [navigationOpen, setNavigationOpen] = useState(false);
  const [selectedProject, setSelectedProject] =
    useState<ProjectWithCategory | null>(null);
  const { stop, start } = useSmoothScroll();
  useEffect(() => {
    if (selectedProject) stop();
    return start;
  }, [selectedProject, start, stop]);
  return (
    <main className="reference-portfolio">
      <a className="portfolio-skip" href="#about">
        Skip to content
      </a>
      <PortfolioNavigation onMenuOpenChange={setNavigationOpen} />
      <ReferenceScrollEffects />
      <PortfolioHeroSection characterPreview={characterPreview} />
      <AboutSection />
      <HistorySection />
      <ProjectShowcase onSelect={setSelectedProject} />
      <ProjectCalendar onSelect={setSelectedProject} />
      <CollaborationSection navigationOpen={navigationOpen} />
      <GallerySection />
      <PortfolioContactSection />
      {selectedProject && (
        <ProjectModal
          project={selectedProject}
          open
          onOpenChange={(open) => {
            if (!open) setSelectedProject(null);
          }}
        />
      )}
    </main>
  );
}

export function ReferencePortfolioPage({ characterPreview = false }: { characterPreview?: boolean }) {
  return (
    <PortfolioContentProvider>
      <PortfolioPageContent characterPreview={characterPreview} />
    </PortfolioContentProvider>
  );
}
