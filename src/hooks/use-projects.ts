"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fallbackCategories, fallbackProjects, selectedVideoProjects } from "@/data/portfolio-projects";
import { isVideoProject } from "@/lib/project-kind";
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

const localVideoMediaBySlug = new Map(
  selectedVideoProjects.map(({ slug, media }) => [slug, media]),
);

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
    media: localVideoMediaBySlug.get(row.slug),
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

      const nextCategories = (categoryResponse.data ?? []).sort((a, b) =>
        Number(isVideoProject({ category: b, video_url: null })) - Number(isVideoProject({ category: a, video_url: null })),
      );
      const nextProjects = ((projectResponse.data ?? []) as SupabaseProjectRow[])
        .map(normalizeProject)
        .sort((a, b) => Number(isVideoProject(b)) - Number(isVideoProject(a)));

      if (!mountedRef.current) {
        return;
      }

      setCategories(nextCategories);
      setAllProjects(nextProjects);
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
