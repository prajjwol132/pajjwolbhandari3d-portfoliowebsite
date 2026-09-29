import { randomBytes, randomUUID } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

function parseEnv(filePath) {
  const env = {};

  if (!existsSync(filePath)) {
    return env;
  }

  for (const rawLine of readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#") || !line.includes("=")) {
      continue;
    }

    const index = line.indexOf("=");
    const key = line.slice(0, index).trim();
    const value = line.slice(index + 1).trim().replace(/^["']|["']$/g, "");
    env[key] = value;
  }

  return env;
}

const env = {
  ...parseEnv(resolve(process.cwd(), ".env.local")),
  ...process.env,
};

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);

const categories = [
  {
    description: "Full-stack apps, dashboards, admin systems, and product interfaces.",
    display_order: 1,
    name: "Web Apps",
    slug: "web-apps",
  },
  {
    description: "React Three Fiber, WebGL, motion systems, and interactive visuals.",
    display_order: 2,
    name: "3D & Graphics",
    slug: "3d-graphics",
  },
  {
    description: "Video-led case studies, media previews, and gallery experiences.",
    display_order: 3,
    name: "Video Projects",
    slug: "video-projects",
  },
];

const profile = {
  avatar_url: null,
  bio:
    "Prajjwol Bhandari builds fast, cinematic web interfaces with Next.js, TypeScript, Supabase, React Three Fiber, and GSAP. His work focuses on reliable CMS architecture, polished motion, and performance-aware user experiences.",
  email: "hello@prajjwol-bhandari.dev",
  full_name: "Prajjwol Bhandari",
  github_url: "https://github.com/",
  headline: "Full-Stack & 3D Developer",
  id: randomUUID(),
  linkedin_url: "https://www.linkedin.com/",
  location: "Kathmandu, Nepal",
  metrics: [
    { detail: "Production-focused web development", label: "Years Exp", value: "3+" },
    { detail: "Full-stack, CMS, 3D, and media builds", label: "Projects", value: "15+" },
    { detail: "Built around clear scope and reliable delivery", label: "Client Satisfaction", value: "100%" },
    { detail: "Next.js, Supabase, GSAP, and R3F", label: "Core Spec", value: "Next / Three" },
  ],
  resume_url: "/resume",
  social_links: [
    { icon: "github", label: "GitHub", url: "https://github.com/" },
    { icon: "linkedin", label: "LinkedIn", url: "https://www.linkedin.com/" },
    { icon: "mail", label: "Email", url: "mailto:hello@prajjwol-bhandari.dev" },
  ],
  tagline:
    "I build polished web systems where backend structure, motion, and visual depth work as one product.",
  title: "Full-Stack Software Engineer / 3D Creative Developer",
  website_url: "https://prajjwol-bhandari.dev",
};

const projectTemplates = [
  {
    categorySlug: "web-apps",
    display_order: 1,
    featured_image_url: "/media/projects/portfolio-engine.svg",
    full_description:
      "## Problem Statement\nPrajjwol needed a portfolio system that feels engineered rather than templated.\n\n## Solution\nThe build combines Next.js 14, Supabase-backed CMS data, dark technical layouts, and performance-focused motion.\n\n## Outcome\nA production-ready portfolio foundation with admin editing and deployment validation.",
    gallery_images: ["/media/projects/portfolio-engine.svg", "/media/projects/performance-pass.svg"],
    github_url: "https://github.com/",
    is_featured: true,
    live_demo_url: "https://prajjwol-bhandari.dev",
    short_description:
      "A Next.js 14 portfolio architecture with Supabase CMS controls and deployment validation.",
    slug: "developer-portfolio-engine",
    status: "published",
    tech_stack: ["Next.js 14", "TypeScript", "Supabase", "Tailwind"],
    technical_breakdown: {
      Architecture: "Next.js 14 App Router",
      CMS: "Supabase Auth, Database, Storage",
      Deployment: "Vercel production pipeline",
    },
    title: "Developer Portfolio Engine",
    video_url: null,
  },
  {
    categorySlug: "3d-graphics",
    display_order: 2,
    featured_image_url: "/media/projects/r3f-showcase.svg",
    full_description:
      "## Problem Statement\nThe site needed a cinematic 3D-ready architecture without sacrificing mobile performance.\n\n## Solution\nThe WebGL layer uses adaptive DPR, model LOD, WebGL fallback detection, and explicit Three.js disposal utilities.\n\n## Outcome\nA cleaner 3D foundation for scroll-driven creative development.",
    gallery_images: ["/media/projects/r3f-showcase.svg", "/media/projects/portfolio-engine.svg"],
    github_url: "https://github.com/",
    is_featured: true,
    live_demo_url: "https://prajjwol-bhandari.dev/#projects",
    short_description:
      "A performance-aware React Three Fiber showcase foundation with fallback and cleanup utilities.",
    slug: "interactive-tech-showcase",
    status: "published",
    tech_stack: ["Three.js", "R3F", "Drei", "GSAP"],
    technical_breakdown: {
      Rendering: "React Three Fiber",
      Performance: "Adaptive DPR + LOD",
      Fallback: "CSS static WebGL fallback",
    },
    title: "Interactive Tech Showcase",
    video_url: null,
  },
  {
    categorySlug: "video-projects",
    display_order: 3,
    featured_image_url: "/media/projects/media-cms.svg",
    full_description:
      "## Problem Statement\nProject media needed to be editable without code changes.\n\n## Solution\nThe admin dashboard writes project thumbnails, gallery images, and videos to Supabase Storage.\n\n## Outcome\nA practical CMS workflow for visual project storytelling.",
    gallery_images: ["/media/projects/media-cms.svg", "/media/projects/r3f-showcase.svg"],
    github_url: "https://github.com/",
    is_featured: false,
    live_demo_url: "https://prajjwol-bhandari.dev/#projects",
    short_description:
      "A Supabase-backed project media library for thumbnails, galleries, videos, and case studies.",
    slug: "project-media-library",
    status: "published",
    tech_stack: ["Supabase", "Storage", "PostgreSQL", "Radix"],
    technical_breakdown: {
      Storage: "project-media bucket",
      Editing: "Protected admin dashboard",
      Content: "Dynamic project records",
    },
    title: "Project Media Library",
    video_url: null,
  },
];

async function upsertCategory(category) {
  const existing = await supabase
    .from("categories")
    .select("*")
    .eq("slug", category.slug)
    .maybeSingle();

  if (existing.error) {
    throw existing.error;
  }

  if (existing.data) {
    const updated = await supabase
      .from("categories")
      .update(category)
      .eq("id", existing.data.id)
      .select("*")
      .single();

    if (updated.error) {
      throw updated.error;
    }

    return updated.data;
  }

  const inserted = await supabase.from("categories").insert(category).select("*").single();

  if (inserted.error) {
    throw inserted.error;
  }

  return inserted.data;
}

async function seedProfile() {
  const existing = await supabase
    .from("profiles")
    .select("id")
    .limit(1)
    .maybeSingle();

  if (existing.error) {
    throw existing.error;
  }

  const payload = {
    ...profile,
    id: existing.data?.id ?? profile.id,
  };

  const saved = existing.data?.id
    ? await supabase.from("profiles").update(payload).eq("id", existing.data.id)
    : await supabase.from("profiles").insert(payload);

  if (saved.error) {
    throw saved.error;
  }
}

async function upsertProject(project, categoryId) {
  const payload = {
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

  const existing = await supabase
    .from("projects")
    .select("id")
    .eq("slug", project.slug)
    .maybeSingle();

  if (existing.error) {
    throw existing.error;
  }

  const saved = existing.data?.id
    ? await supabase.from("projects").update(payload).eq("id", existing.data.id)
    : await supabase.from("projects").insert(payload);

  if (saved.error) {
    throw saved.error;
  }
}

async function ensureBucket() {
  const buckets = await supabase.storage.listBuckets();

  if (buckets.error) {
    throw buckets.error;
  }

  if (buckets.data.some((bucket) => bucket.name === "project-media")) {
    return "exists";
  }

  const created = await supabase.storage.createBucket("project-media", { public: true });

  if (created.error) {
    throw created.error;
  }

  return "created";
}

async function ensureAdminUser() {
  const users = await supabase.auth.admin.listUsers({ page: 1, perPage: 1 });

  if (users.error) {
    throw users.error;
  }

  if (users.data.users.length > 0) {
    return null;
  }

  const email = "admin@prajjwol-bhandari.dev";
  const password = randomBytes(18).toString("base64url");
  const created = await supabase.auth.admin.createUser({
    email,
    email_confirm: true,
    password,
    user_metadata: {
      role: "admin",
    },
  });

  if (created.error) {
    throw created.error;
  }

  return { email, password };
}

const categoryMap = new Map();

for (const category of categories) {
  const saved = await upsertCategory(category);
  categoryMap.set(saved.slug, saved.id);
}

await seedProfile();

for (const project of projectTemplates) {
  const categoryId = categoryMap.get(project.categorySlug);

  if (!categoryId) {
    throw new Error(`Missing category for project: ${project.title}`);
  }

  await upsertProject(project, categoryId);
}

const bucketStatus = await ensureBucket();
const admin = await ensureAdminUser();

console.log(
  JSON.stringify(
    {
      admin,
      bucket: bucketStatus,
      categories: categories.length,
      profile: "seeded",
      projects: projectTemplates.length,
    },
    null,
    2,
  ),
);
