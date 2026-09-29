import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { createClient } from "@/lib/supabase/server";
import type { Category, Profile, Project, ProjectWithCategory } from "@/types/database";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin Dashboard",
  description: "Protected CMS control panel for Prajjwol Bhandari's portfolio.",
};

function hasSupabasePublicEnv() {
  const publicKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && publicKey,
  );
}

type SupabaseProjectRow = Project & {
  category: Category | Category[] | null;
};

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

function normalizeProfile(row: Partial<Profile> | null): Profile | null {
  if (!row?.id || !row.full_name || !row.headline || !row.bio) {
    return null;
  }

  return {
    avatar_url: row.avatar_url ?? null,
    bio: row.bio,
    created_at: row.created_at ?? new Date().toISOString(),
    email: row.email ?? null,
    full_name: row.full_name,
    github_url: row.github_url ?? null,
    headline: row.headline,
    id: row.id,
    linkedin_url: row.linkedin_url ?? null,
    location: row.location ?? null,
    metrics: Array.isArray(row.metrics) ? row.metrics : [],
    resume_url: row.resume_url ?? null,
    social_links: Array.isArray(row.social_links) ? row.social_links : [],
    tagline: row.tagline ?? null,
    title: row.title ?? null,
    updated_at: row.updated_at ?? new Date().toISOString(),
    website_url: row.website_url ?? null,
  };
}

export default async function AdminDashboardPage() {
  if (!hasSupabasePublicEnv()) {
    redirect("/admin/login?error=supabase-config");
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  const [categoryResponse, projectResponse, profileResponse] = await Promise.all([
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
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false }),
    supabase
      .from("profiles")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const categories = categoryResponse.error ? [] : categoryResponse.data ?? [];
  const projects = projectResponse.error
    ? []
    : ((projectResponse.data ?? []) as SupabaseProjectRow[]).map(normalizeProject);
  const profile = profileResponse.error ? null : normalizeProfile(profileResponse.data);

  return (
    <AdminDashboard
      initialCategories={categories}
      initialProfile={profile}
      initialProjects={projects}
      userEmail={user.email}
    />
  );
}
