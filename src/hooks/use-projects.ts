"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Category, Project, ProjectWithCategory } from "@/types/database";

interface UseProjectsOptions {
  categorySlug?: string;
  isFeatured?: boolean;
}

interface UseProjectsResult {
  allProjects: ProjectWithCategory[];
  categories: Category[];
  categoryCounts: Record<string, number>;
  error: Error | null;
  isRefetching: boolean;
  loading: boolean;
  projects: ProjectWithCategory[];
  refetch: () => Promise<void>;
  totalCount: number;
}

type SupabaseProjectRow = Project & {
  category: Category | Category[] | null;
};

const fallbackCategories: Category[] = [
  {
    id: "cat-web-apps",
    name: "Web Apps",
    slug: "web-apps",
    description: "Full-stack products, dashboards, and portfolio systems.",
    display_order: 1,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "cat-3d-graphics",
    name: "3D & Graphics",
    slug: "3d-graphics",
    description: "React Three Fiber scenes, WebGL interfaces, and visual systems.",
    display_order: 2,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "cat-video-projects",
    name: "Video Projects",
    slug: "video-projects",
    description: "Motion-led media interfaces, galleries, and creative playback tools.",
    display_order: 3,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
  },
];

const fallbackProjects: ProjectWithCategory[] = [
  {
    id: "project-portfolio-engine",
    category_id: "cat-web-apps",
    category: fallbackCategories[0],
    title: "Developer Portfolio Engine",
    slug: "developer-portfolio-engine",
    short_description:
      "A Next.js 14 portfolio architecture with persistent 3D canvas, CMS-ready project data, and scroll choreography.",
    full_description:
      "## Problem Statement\nPrajjwol needed a portfolio that feels engineered rather than templated, with motion, project storytelling, and CMS control living in the same interface.\n\n## Solution\nThe build uses a persistent React Three Fiber canvas, Lenis smooth scrolling, GSAP ScrollTrigger timelines, and Supabase-ready content models for projects, media, and categories.\n\n## Architecture Notes\nThe project section is designed as a database-backed showcase that can filter by category, open full-screen technical modals, and support video or image galleries.",
    tech_stack: ["Next.js 14", "TypeScript", "Supabase", "GSAP"],
    featured_image_url: "/media/projects/portfolio-engine.svg",
    video_url: null,
    gallery_images: ["/media/projects/portfolio-engine.svg", "/media/projects/performance-pass.svg"],
    github_url: "https://github.com/",
    live_demo_url: "https://prajjwol-bhandari.dev",
    technical_breakdown: {
      Architecture: "Next.js 14 App Router",
      Database: "Supabase PostgreSQL",
      Animation: "GSAP + Lenis",
      Rendering: "Persistent R3F canvas",
    },
    is_featured: true,
    status: "published",
    display_order: 1,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "project-r3f-showcase",
    category_id: "cat-3d-graphics",
    category: fallbackCategories[1],
    title: "Interactive Tech Showcase",
    slug: "interactive-tech-showcase",
    short_description:
      "A low-poly developer workstation scene with dark metallic materials, red/cyan accents, and scroll-aware camera states.",
    full_description:
      "## Problem Statement\nA static developer portfolio would not match the visual ambition of the reference motorsport site.\n\n## Solution\nThe scene uses a GLTF workstation asset, MeshPhysicalMaterial surfaces, responsive cameras, contact shadows, and frame-level interpolation for fluid state changes.\n\n## Performance Strategy\nThe canvas caps DPR on constrained devices, reduces shadow work on touch screens, and lets HTML content carry the heavier story moments.",
    tech_stack: ["Three.js", "R3F", "Drei", "WebGL"],
    featured_image_url: "/media/projects/r3f-showcase.svg",
    video_url: null,
    gallery_images: ["/media/projects/r3f-showcase.svg", "/media/projects/portfolio-engine.svg"],
    github_url: "https://github.com/",
    live_demo_url: "https://prajjwol-bhandari.dev/#hero",
    technical_breakdown: {
      Rendering: "React Three Fiber",
      Materials: "MeshPhysicalMaterial",
      Lighting: "City environment + contact shadows",
      Target: "60 FPS responsive scene",
    },
    is_featured: true,
    status: "published",
    display_order: 2,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "project-media-cms",
    category_id: "cat-video-projects",
    category: fallbackCategories[2],
    title: "Project Media Library",
    slug: "project-media-library",
    short_description:
      "A Supabase-backed gallery architecture for repository links, live URLs, images, video previews, and case-study metadata.",
    full_description:
      "## Problem Statement\nMedia-heavy project pages need flexible content instead of hardcoded cards.\n\n## Solution\nEach project record stores gallery images, optional video URLs, technical metrics, external links, and a long-form markdown description for case-study storytelling.\n\n## Editorial Flow\nThe UI can surface featured projects, filter by category, and open a full-screen modal without leaving the scroll-driven portfolio experience.",
    tech_stack: ["Supabase", "PostgreSQL", "Storage", "Radix"],
    featured_image_url: "/media/projects/media-cms.svg",
    video_url: null,
    gallery_images: ["/media/projects/media-cms.svg", "/media/projects/r3f-showcase.svg"],
    github_url: "https://github.com/",
    live_demo_url: "https://prajjwol-bhandari.dev/#projects",
    technical_breakdown: {
      Content: "Dynamic project rows",
      Media: "Gallery + video support",
      Modal: "Radix Dialog",
      Filtering: "Category slug + featured status",
    },
    is_featured: false,
    status: "published",
    display_order: 3,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "project-performance-pass",
    category_id: "cat-web-apps",
    category: fallbackCategories[0],
    title: "Mobile Performance Pass",
    slug: "mobile-performance-pass",
    short_description:
      "A device-aware optimization layer with capped DPR, reduced shadows, lightweight reveals, and touch-browser fail-safes.",
    full_description:
      "## Problem Statement\nA cinematic WebGL interface can become expensive on mobile GPUs if every desktop effect is preserved.\n\n## Solution\nThe implementation detects weak touch browsers and shifts heavy scrubbed motion into cheaper CSS and GSAP transforms while preserving the page rhythm.\n\n## Outcome\nThe experience keeps the dark-tech design language while protecting battery, thermals, and scroll responsiveness.",
    tech_stack: ["Lenis", "GSAP", "R3F", "Tailwind"],
    featured_image_url: "/media/projects/performance-pass.svg",
    video_url: null,
    gallery_images: ["/media/projects/performance-pass.svg", "/media/projects/media-cms.svg"],
    github_url: "https://github.com/",
    live_demo_url: "https://prajjwol-bhandari.dev/#projects",
    technical_breakdown: {
      Mobile: "Touch fallback enabled",
      Shadows: "Reduced contact shadow frames",
      DPR: "Responsive cap",
      UX: "Smooth scroll retained",
    },
    is_featured: true,
    status: "published",
    display_order: 4,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
  },
];

function withTimeout<T>(promise: Promise<T>, timeoutMs: number) {
  let timeoutId: number | undefined;

  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutId = window.setTimeout(() => {
      reject(new Error("Supabase project request timed out."));
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (typeof timeoutId !== "undefined") {
      window.clearTimeout(timeoutId);
    }
  });
}

function normalizeProject(row: SupabaseProjectRow): ProjectWithCategory {
  const category = Array.isArray(row.category) ? row.category[0] ?? null : row.category;

  return {
    ...row,
    category,
    gallery_images: Array.isArray(row.gallery_images) ? row.gallery_images : [],
    tech_stack: Array.isArray(row.tech_stack) ? row.tech_stack : [],
    technical_breakdown: normalizeTechnicalBreakdown(row.technical_breakdown),
  };
}

function normalizeTechnicalBreakdown(value: unknown): Record<string, string> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const entries = Object.entries(value).filter(
    (entry): entry is [string, string] => typeof entry[1] === "string",
  );

  return entries.length > 0 ? Object.fromEntries(entries) : null;
}

function filterProjects(
  projects: ProjectWithCategory[],
  options: UseProjectsOptions,
) {
  return projects.filter((project) => {
    const matchesCategory =
      !options.categorySlug ||
      options.categorySlug === "all" ||
      project.category?.slug === options.categorySlug;
    const matchesFeatured =
      typeof options.isFeatured === "undefined" ||
      project.is_featured === options.isFeatured;

    return matchesCategory && matchesFeatured;
  });
}

function countByCategory(projects: ProjectWithCategory[]) {
  return projects.reduce<Record<string, number>>((counts, project) => {
    const slug = project.category?.slug;

    if (!slug) {
      return counts;
    }

    counts[slug] = (counts[slug] ?? 0) + 1;
    return counts;
  }, {});
}

export function useProjects(options: UseProjectsOptions = {}): UseProjectsResult {
  const [allProjects, setAllProjects] = useState<ProjectWithCategory[]>(fallbackProjects);
  const [categories, setCategories] = useState<Category[]>(fallbackCategories);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefetching, setIsRefetching] = useState(false);
  const mountedRef = useRef(true);
  const { categorySlug, isFeatured } = options;

  const fetchProjects = useCallback(async (isOptimisticRefetch = false) => {
    if (!mountedRef.current) {
      return;
    }

    setError(null);

    if (isOptimisticRefetch) {
      setIsRefetching(true);
    } else {
      setLoading(true);
    }

    try {
      const supabase = createClient();
      const [categoryResponse, projectResponse] = await withTimeout(
        Promise.all([
          supabase
            .from("categories")
            .select("id,name,slug,description,display_order,created_at,updated_at")
            .order("display_order", { ascending: true }),
          supabase
            .from("projects")
            .select(
              `
                id,
                category_id,
                title,
                slug,
                short_description,
                full_description,
                tech_stack,
                featured_image_url,
                video_url,
                gallery_images,
                github_url,
                live_demo_url,
                technical_breakdown,
                is_featured,
                status,
                display_order,
                created_at,
                updated_at,
                category:categories (
                  id,
                  name,
                  slug,
                  description,
                  display_order,
                  created_at,
                  updated_at
                )
              `,
            )
            .eq("status", "published")
            .order("display_order", { ascending: true })
            .order("created_at", { ascending: false }),
        ]),
        3200,
      );

      if (categoryResponse.error) {
        throw categoryResponse.error;
      }

      if (projectResponse.error) {
        throw projectResponse.error;
      }

      const nextCategories = categoryResponse.data ?? [];
      const nextProjects = ((projectResponse.data ?? []) as SupabaseProjectRow[]).map(normalizeProject);

      if (!mountedRef.current) {
        return;
      }

      setCategories(nextCategories.length > 0 ? nextCategories : fallbackCategories);
      setAllProjects(nextProjects.length > 0 ? nextProjects : fallbackProjects);
    } catch (caughtError) {
      const nextError =
        caughtError instanceof Error
          ? caughtError
          : new Error("Unable to load projects from Supabase.");

      if (!mountedRef.current) {
        return;
      }

      setError(nextError);
      setCategories(fallbackCategories);
      setAllProjects(fallbackProjects);
    } finally {
      if (mountedRef.current) {
        setLoading(false);
        setIsRefetching(false);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    void fetchProjects(false);

    return () => {
      mountedRef.current = false;
    };
  }, [fetchProjects]);

  const projects = useMemo(
    () => filterProjects(allProjects, { categorySlug, isFeatured }),
    [allProjects, categorySlug, isFeatured],
  );
  const categoryCounts = useMemo(() => countByCategory(allProjects), [allProjects]);

  const refetch = useCallback(async () => {
    await fetchProjects(true);
  }, [fetchProjects]);

  return {
    allProjects,
    categories,
    categoryCounts,
    error,
    isRefetching,
    loading,
    projects,
    refetch,
    totalCount: allProjects.length,
  };
}
