import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { fallbackCategories, fallbackProjects } from "../src/data/portfolio-projects.ts";
import { buildMissingProjectRows, getMissingCategories } from "../src/lib/admin-catalog.ts";
import { getAdminErrorMessage } from "../src/lib/admin-error.ts";

function readEnvFile(filePath) {
  if (!existsSync(filePath)) return {};

  return Object.fromEntries(
    readFileSync(filePath, "utf8")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const separator = line.indexOf("=");
        return [
          line.slice(0, separator).trim(),
          line.slice(separator + 1).trim().replace(/^['"]|['"]$/g, ""),
        ];
      }),
  );
}

const env = {
  ...readEnvFile(resolve(process.cwd(), ".env.local")),
  ...process.env,
};

if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
}

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function requireData(result, fallback) {
  if (result.error) {
    throw new Error(getAdminErrorMessage(result.error, fallback));
  }
  return result.data ?? [];
}

const existingCategories = await requireData(
  await supabase.from("categories").select("id,slug"),
  "Unable to read CMS categories.",
);
const missingCategories = getMissingCategories(
  fallbackCategories,
  new Set(existingCategories.map(({ slug }) => slug)),
);

if (missingCategories.length > 0) {
  await requireData(
    await supabase.from("categories").insert(missingCategories.map((category) => ({ ...category }))),
    "Unable to add the site's default categories.",
  );
}

const savedCategories = await requireData(
  await supabase.from("categories").select("id,slug"),
  "Unable to load saved CMS categories.",
);
const existingProjects = await requireData(
  await supabase.from("projects").select("slug"),
  "Unable to read CMS projects.",
);
const projectsToInsert = buildMissingProjectRows(
  fallbackProjects,
  new Set(existingProjects.map(({ slug }) => slug)),
  new Map(savedCategories.map(({ id, slug }) => [slug, id])),
);

if (projectsToInsert.length > 0) {
  await requireData(
    await supabase.from("projects").insert(projectsToInsert),
    "Unable to import the site's existing projects.",
  );
}

console.log(JSON.stringify({
  categoriesAdded: missingCategories.length,
  projectsAdded: projectsToInsert.length,
  existingProjectsSkipped: fallbackProjects.length - projectsToInsert.length,
}, null, 2));
