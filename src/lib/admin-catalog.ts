export interface CatalogCategory {
  description: string | null;
  display_order: number;
  name: string;
  slug: string;
}

export interface CatalogProject {
  category: { slug: string } | null;
  display_order: number;
  featured_image_url: string | null;
  full_description: string;
  gallery_images: string[];
  github_url: string | null;
  is_featured: boolean;
  live_demo_url: string | null;
  short_description: string;
  slug: string;
  status: "draft" | "published" | "archived";
  tech_stack: string[];
  technical_breakdown: Record<string, string> | null;
  title: string;
  video_url: string | null;
}

export function getMissingCategories(
  categories: readonly CatalogCategory[],
  existingSlugs: ReadonlySet<string>,
) {
  return categories.filter((category) => !existingSlugs.has(category.slug));
}

export function buildMissingProjectRows(
  projects: readonly CatalogProject[],
  existingSlugs: ReadonlySet<string>,
  categoryIdsBySlug: ReadonlyMap<string, string>,
) {
  return projects.filter((project) => !existingSlugs.has(project.slug)).map((project) => {
    const categorySlug = project.category?.slug;
    const categoryId = categorySlug ? categoryIdsBySlug.get(categorySlug) : undefined;

    if (!categoryId) {
      throw new Error(`Choose or create a category for "${project.title}" before importing.`);
    }

    return {
      category_id: categoryId,
      display_order: project.display_order,
      featured_image_url: project.featured_image_url,
      full_description: project.full_description,
      gallery_images: project.gallery_images,
      github_url: project.github_url,
      is_featured: project.is_featured,
      live_demo_url: project.live_demo_url,
      short_description: project.short_description,
      slug: project.slug,
      status: project.status,
      tech_stack: project.tech_stack,
      technical_breakdown: project.technical_breakdown,
      title: project.title,
      video_url: project.video_url,
    };
  });
}
