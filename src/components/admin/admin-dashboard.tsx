"use client";

import {
  FolderKanban,
  Image as ImageIcon,
  Import,
  LayoutGrid,
  LogOut,
  Pencil,
  Plus,
  RefreshCw,
  Settings,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CategoryForm, type CategoryFormValues } from "@/components/admin/category-form";
import { ProfileSettingsForm } from "@/components/admin/profile-settings-form";
import { ProjectForm } from "@/components/admin/project-form";
import { PageImagesForm } from "@/components/admin/page-images-form";
import { buildMissingProjectRows, getMissingCategories } from "@/lib/admin-catalog";
import { getAdminErrorMessage } from "@/lib/admin-error";
import { createClient } from "@/lib/supabase/client";
import { fallbackCategories, fallbackProjects } from "@/data/portfolio-projects";
import { mergePageMedia } from "@/data/page-media";
import type {
  Category,
  CategoryInsert,
  CategoryUpdate,
  PageMedia,
  Profile,
  Project,
  ProjectWithCategory,
} from "@/types/database";

type AdminTab = "projects" | "categories" | "profile" | "images";

interface AdminDashboardProps {
  initialCategories: Category[];
  initialError?: string;
  initialProfile: Profile | null;
  initialPageMedia: PageMedia[];
  initialProjects: ProjectWithCategory[];
  userEmail?: string | null;
}

type SupabaseProjectRow = Project & {
  category: Category | Category[] | null;
};

const tabs: Array<{ icon: LucideIcon; id: AdminTab; label: string }> = [
  { icon: LayoutGrid, id: "projects", label: "Projects" },
  { icon: FolderKanban, id: "categories", label: "Categories" },
  { icon: Settings, id: "profile", label: "Profile" },
  { icon: ImageIcon, id: "images", label: "Page Images" },
];

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

export function AdminDashboard({
  initialCategories,
  initialError = "",
  initialPageMedia,
  initialProfile,
  initialProjects,
  userEmail,
}: AdminDashboardProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<AdminTab>("projects");
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [projects, setProjects] = useState<ProjectWithCategory[]>(initialProjects);
  const [profile, setProfile] = useState<Profile | null>(initialProfile);
  const [pageMedia, setPageMedia] = useState<PageMedia[]>(initialPageMedia);
  const [selectedProject, setSelectedProject] = useState<ProjectWithCategory | null>(null);
  const [isProjectFormOpen, setIsProjectFormOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [isCategoryFormOpen, setIsCategoryFormOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [isImportingSiteWork, setIsImportingSiteWork] = useState(false);
  const [savingPageMediaKey, setSavingPageMediaKey] = useState<string | null>(null);
  const [message, setMessage] = useState(initialError);

  const refreshData = async () => {
    setIsRefreshing(true);
    setMessage("");

    try {
      const supabase = createClient();
      const [categoryResponse, projectResponse, profileResponse, pageMediaResponse] = await Promise.all([
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
        supabase
          .from("page_media")
          .select("key,label,image_url,alt_text,display_order,created_at,updated_at")
          .order("display_order", { ascending: true }),
      ]);

      if (categoryResponse.error) {
        throw categoryResponse.error;
      }

      if (projectResponse.error) {
        throw projectResponse.error;
      }

      if (profileResponse.error) {
        throw profileResponse.error;
      }

      setCategories(categoryResponse.data ?? []);
      setProjects(((projectResponse.data ?? []) as SupabaseProjectRow[]).map(normalizeProject));
      setProfile(normalizeProfile(profileResponse.data));
      if (pageMediaResponse.error) {
        setPageMedia(mergePageMedia(null));
        setMessage(getAdminErrorMessage(pageMediaResponse.error, "Unable to load page images."));
      } else {
        setPageMedia(mergePageMedia(pageMediaResponse.data));
      }
      return true;
    } catch (error) {
      setMessage(getAdminErrorMessage(error, "Unable to refresh dashboard data."));
      return false;
    } finally {
      setIsRefreshing(false);
    }
  };

  const handlePageMediaSave = async (media: PageMedia) => {
    setSavingPageMediaKey(media.key);
    setMessage("");
    try {
      const { error } = await createClient().from("page_media").upsert({
        key: media.key,
        label: media.label,
        image_url: media.image_url,
        alt_text: media.alt_text,
        display_order: media.display_order,
      }, { onConflict: "key" });
      if (error) throw error;
      setPageMedia((current) => mergePageMedia([
        ...current.filter((item) => item.key !== media.key),
        media,
      ]));
      setMessage(`${media.label} updated.`);
      router.refresh();
    } catch (error) {
      setMessage(getAdminErrorMessage(error, "Unable to save page image."));
    } finally {
      setSavingPageMediaKey(null);
    }
  };

  const handleProjectSaved = async () => {
    await refreshData();
    setIsProjectFormOpen(false);
    setSelectedProject(null);
    setMessage("Project saved successfully.");
  };

  const handleImportSiteWork = async () => {
    setIsImportingSiteWork(true);
    setMessage("");

    try {
      const supabase = createClient();
      const { data: existingCategories, error: existingCategoriesError } = await supabase
        .from("categories")
        .select("id,slug");

      if (existingCategoriesError) throw existingCategoriesError;

      const existingCategorySlugs = new Set((existingCategories ?? []).map(({ slug }) => slug));
      const missingCategories = getMissingCategories(fallbackCategories, existingCategorySlugs);

      if (missingCategories.length > 0) {
        const { error } = await supabase
          .from("categories")
          .insert(missingCategories.map((category) => ({ ...category })) as CategoryInsert[]);
        if (error) throw error;
      }

      const { data: savedCategories, error: savedCategoriesError } = await supabase
        .from("categories")
        .select("id,slug");
      if (savedCategoriesError) throw savedCategoriesError;

      const { data: existingProjects, error: existingProjectsError } = await supabase
        .from("projects")
        .select("slug");
      if (existingProjectsError) throw existingProjectsError;

      const categoryIdsBySlug = new Map(
        (savedCategories ?? []).map(({ id, slug }) => [slug, id]),
      );
      const projectRows = buildMissingProjectRows(
        fallbackProjects,
        new Set((existingProjects ?? []).map(({ slug }) => slug)),
        categoryIdsBySlug,
      );

      if (projectRows.length > 0) {
        const { error } = await supabase.from("projects").insert(projectRows);
        if (error) throw error;
      }

      const refreshed = await refreshData();
      if (refreshed) {
        setMessage(
          projectRows.length > 0
            ? `Imported ${projectRows.length} missing site projects. Existing records were not changed.`
            : "The current site catalog is already in the CMS. No existing records were changed.",
        );
      }
    } catch (error) {
      setMessage(getAdminErrorMessage(error, "Unable to import current site work."));
    } finally {
      setIsImportingSiteWork(false);
    }
  };

  const handleDeleteProject = async (project: ProjectWithCategory) => {
    if (!window.confirm(`Delete "${project.title}"? This cannot be undone.`)) {
      return;
    }

    setIsMutating(true);
    setMessage("");

    try {
      const supabase = createClient();
      const { error } = await supabase.from("projects").delete().eq("id", project.id);

      if (error) {
        throw error;
      }

      await refreshData();
      setIsProjectFormOpen(false);
      setSelectedProject(null);
      setMessage("Project deleted.");
    } catch (error) {
      setMessage(getAdminErrorMessage(error, "Unable to delete project."));
    } finally {
      setIsMutating(false);
    }
  };

  const handleCategorySubmit = async (values: CategoryFormValues, category?: Category | null) => {
    setIsMutating(true);
    setMessage("");

    const payload: CategoryInsert | CategoryUpdate = {
      description: values.description.trim().length > 0 ? values.description.trim() : null,
      display_order: values.display_order,
      name: values.name,
      slug: values.slug,
    };

    try {
      const supabase = createClient();

      if (category?.id) {
        const { error } = await supabase.from("categories").update(payload).eq("id", category.id);
        if (error) {
          throw error;
        }
      } else {
        const { error } = await supabase.from("categories").insert(payload as CategoryInsert);
        if (error) {
          throw error;
        }
      }

      await refreshData();
      setIsCategoryFormOpen(false);
      setSelectedCategory(null);
      setMessage("Category saved successfully.");
    } catch (error) {
      setMessage(getAdminErrorMessage(error, "Unable to save category."));
    } finally {
      setIsMutating(false);
    }
  };

  const handleDeleteCategory = async (category: Category) => {
    if (!window.confirm(`Delete "${category.name}"? Existing projects should be moved first.`)) {
      return;
    }

    setIsMutating(true);
    setMessage("");

    try {
      const supabase = createClient();
      const { error } = await supabase.from("categories").delete().eq("id", category.id);

      if (error) {
        throw error;
      }

      await refreshData();
      setIsCategoryFormOpen(false);
      setSelectedCategory(null);
      setMessage("Category deleted.");
    } catch (error) {
      setMessage(getAdminErrorMessage(error, "Unable to delete category."));
    } finally {
      setIsMutating(false);
    }
  };

  const handleDeleteProfile = async () => {
    if (!profile || !window.confirm("Delete the public profile? The website will use its built-in profile content.")) {
      return;
    }

    setIsMutating(true);
    setMessage("");
    try {
      const supabase = createClient();
      const { error } = await supabase.from("profiles").delete().eq("id", profile.id);
      if (error) throw error;
      await refreshData();
      setMessage("Profile deleted. The website is using its built-in profile content.");
    } catch (error) {
      setMessage(getAdminErrorMessage(error, "Unable to delete profile."));
    } finally {
      setIsMutating(false);
    }
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/admin/login");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-black/90 px-5 py-5 backdrop-blur md:px-8">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-5 lg:flex-row lg:items-center">
          <div>
            <p className="font-mono text-[0.66rem] font-black uppercase text-[#ffd60a]">
              Prajjwol Bhandari / CMS
            </p>
            <h1 className="mt-2 text-4xl font-black uppercase leading-none md:text-6xl">
              Admin Control Panel
            </h1>
            {userEmail ? (
              <p className="mt-2 font-mono text-[0.68rem] font-black uppercase text-white/45">
                Signed in as {userEmail}
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              className="inline-flex h-11 items-center gap-2 border border-white/15 px-4 font-mono text-xs font-black uppercase text-white transition hover:border-[#ffd60a] hover:text-[#ffd60a]"
              disabled={isRefreshing}
              onClick={refreshData}
              type="button"
            >
              <RefreshCw className={isRefreshing ? "size-4 animate-spin" : "size-4"} />
              Refresh
            </button>
            <button
              className="inline-flex h-11 items-center gap-2 bg-[#ffd60a] px-4 font-mono text-xs font-black uppercase text-black transition hover:bg-white"
              onClick={handleSignOut}
              type="button"
            >
              <LogOut className="size-4" />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-8 px-5 py-8 md:px-8">
        <nav className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                className={
                  isActive
                    ? "flex items-center justify-between border border-[#ffd60a] bg-[#ffd60a] px-5 py-4 text-left text-black"
                    : "flex items-center justify-between border border-white/15 bg-white/[0.03] px-5 py-4 text-left text-white transition hover:border-[#ffd60a]"
                }
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                type="button"
              >
                <span>
                  <span className="block font-mono text-[0.62rem] font-black uppercase opacity-65">
                    Panel
                  </span>
                  <span className="mt-1 block text-xl font-black uppercase leading-none">
                    {tab.label}
                  </span>
                </span>
                <Icon className="size-5" />
              </button>
            );
          })}
        </nav>

        {message ? (
          <p role="status" aria-live="polite" className="border border-[#ffd60a]/40 bg-[#ffd60a]/10 p-3 text-sm font-semibold text-[#ffd60a]">
            {message}
          </p>
        ) : null}

        {activeTab === "projects" ? (
          <section className="grid gap-6">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div>
                <p className="font-mono text-[0.66rem] font-black uppercase text-white/45">
                  {projects.length.toString().padStart(2, "0")} project records
                </p>
                <h2 className="mt-2 text-3xl font-black uppercase leading-none">
                  Projects Management
                </h2>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  className="inline-flex h-11 items-center justify-center gap-2 border border-white/20 px-4 font-mono text-xs font-black uppercase text-white transition hover:border-[#ffd60a] hover:text-[#ffd60a] disabled:cursor-wait disabled:opacity-55"
                  disabled={isImportingSiteWork || isMutating || isRefreshing}
                  onClick={() => void handleImportSiteWork()}
                  type="button"
                >
                  {isImportingSiteWork ? (
                    <RefreshCw className="size-4 animate-spin" />
                  ) : (
                    <Import className="size-4" />
                  )}
                  {isImportingSiteWork ? "Importing" : `Import Missing Site Work (${fallbackProjects.length})`}
                </button>
                <button
                  className="inline-flex h-11 items-center justify-center gap-2 bg-[#ffd60a] px-4 font-mono text-xs font-black uppercase text-black transition hover:bg-white"
                  onClick={() => {
                    setSelectedProject(null);
                    setIsProjectFormOpen(true);
                  }}
                  type="button"
                >
                  <Plus className="size-4" />
                  New Project
                </button>
              </div>
            </div>

            {isProjectFormOpen ? (
              <div className="border border-white/15 bg-white/[0.03] p-5 md:p-7">
                <ProjectForm
                  categories={categories}
                  onCancel={() => {
                    setIsProjectFormOpen(false);
                    setSelectedProject(null);
                  }}
                  onDelete={handleDeleteProject}
                  onSaved={handleProjectSaved}
                  project={selectedProject}
                />
              </div>
            ) : null}

            <div className="grid gap-3">
              {projects.length === 0 ? (
                <p className="border border-white/10 p-5 text-sm text-white/50">
                  No projects found. Create the first showcase entry to populate the portfolio.
                </p>
              ) : (
                projects.map((project) => (
                  <article
                    className="grid gap-4 border border-white/12 bg-white/[0.03] p-4 md:grid-cols-[1fr_auto] md:items-center"
                    key={project.id}
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="bg-[#ffd60a] px-2 py-1 font-mono text-[0.6rem] font-black uppercase text-black">
                          {project.status}
                        </span>
                        {project.is_featured ? (
                          <span className="border border-white/15 px-2 py-1 font-mono text-[0.6rem] font-black uppercase text-white/65">
                            Featured
                          </span>
                        ) : null}
                        <span className="font-mono text-[0.6rem] font-black uppercase text-white/40">
                          {project.category?.name ?? "Unassigned"}
                        </span>
                      </div>
                      <h3 className="mt-3 text-2xl font-black uppercase leading-none">
                        {project.title}
                      </h3>
                      <p className="mt-2 max-w-3xl text-sm leading-6 text-white/55">
                        {project.short_description}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        className="inline-flex size-10 items-center justify-center border border-white/15 text-white transition hover:border-[#ffd60a] hover:text-[#ffd60a]"
                        onClick={() => {
                          setSelectedProject(project);
                          setIsProjectFormOpen(true);
                        }}
                        type="button"
                      >
                        <Pencil className="size-4" />
                      </button>
                      <button
                        className="inline-flex size-10 items-center justify-center border border-white/15 text-white transition hover:border-[#ffd60a] hover:text-[#ffd60a]"
                        disabled={isMutating}
                        onClick={() => handleDeleteProject(project)}
                        type="button"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>
        ) : null}

        {activeTab === "categories" ? (
          <section className="grid gap-6">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div>
                <p className="font-mono text-[0.66rem] font-black uppercase text-white/45">
                  {categories.length.toString().padStart(2, "0")} category records
                </p>
                <h2 className="mt-2 text-3xl font-black uppercase leading-none">
                  Categories Management
                </h2>
              </div>
              <button
                className="inline-flex h-11 items-center justify-center gap-2 bg-[#ffd60a] px-4 font-mono text-xs font-black uppercase text-black transition hover:bg-white"
                onClick={() => {
                  setSelectedCategory(null);
                  setIsCategoryFormOpen(true);
                }}
                type="button"
              >
                <Plus className="size-4" />
                New Category
              </button>
            </div>

            {isCategoryFormOpen ? (
              <CategoryForm
                category={selectedCategory}
                isSubmitting={isMutating}
                onCancel={() => {
                  setIsCategoryFormOpen(false);
                  setSelectedCategory(null);
                }}
                onDelete={handleDeleteCategory}
                onSubmit={handleCategorySubmit}
              />
            ) : null}

            <div className="grid gap-3 md:grid-cols-2">
              {categories.length === 0 ? (
                <div className="grid gap-3 border border-white/10 p-5 text-sm text-white/60 md:col-span-2">
                  <p>The website already has these built-in categories, but they are not stored in Supabase yet:</p>
                  <div className="flex flex-wrap gap-2">
                    {fallbackCategories.map((category) => (
                      <span className="border border-white/15 px-3 py-2 font-mono text-xs font-bold uppercase text-white" key={category.slug}>
                        {category.name}
                      </span>
                    ))}
                  </div>
                  <p>Initialize the CMS database to manage these categories and assign them to projects.</p>
                </div>
              ) : (
                categories.map((category) => (
                  <article
                    className="grid gap-4 border border-white/12 bg-white/[0.03] p-4"
                    key={category.id}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-mono text-[0.62rem] font-black uppercase text-[#ffd60a]">
                          [{category.display_order.toString().padStart(2, "0")}] / {category.slug}
                        </p>
                        <h3 className="mt-2 text-2xl font-black uppercase leading-none">
                          {category.name}
                        </h3>
                      </div>
                      <button
                        className="inline-flex size-10 items-center justify-center border border-white/15 text-white transition hover:border-[#ffd60a] hover:text-[#ffd60a]"
                        onClick={() => {
                          setSelectedCategory(category);
                          setIsCategoryFormOpen(true);
                        }}
                        type="button"
                      >
                        <Pencil className="size-4" />
                      </button>
                    </div>
                    {category.description ? (
                      <p className="text-sm leading-6 text-white/52">{category.description}</p>
                    ) : null}
                  </article>
                ))
              )}
            </div>
          </section>
        ) : null}

        {activeTab === "profile" ? (
          <section className="border border-white/15 bg-white/[0.03] p-5 md:p-7">
            <ProfileSettingsForm
              key={profile?.updated_at ?? "new-profile-settings"}
              isDeleting={isMutating}
              onDelete={profile ? handleDeleteProfile : undefined}
              onSaved={async () => {
                await refreshData();
              }}
              profile={profile}
            />
          </section>
        ) : null}

        {activeTab === "images" ? (
          <PageImagesForm
            media={pageMedia}
            onSave={handlePageMediaSave}
            savingKey={savingPageMediaKey}
          />
        ) : null}
      </main>
    </div>
  );
}
