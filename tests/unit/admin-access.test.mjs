import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { isPortfolioAdmin, safeAdminPath } from "../../src/lib/admin-access.ts";
import { getAdminErrorMessage } from "../../src/lib/admin-error.ts";
import { buildMissingProjectRows, getMissingCategories } from "../../src/lib/admin-catalog.ts";
import { defaultPageMedia, mergePageMedia } from "../../src/data/page-media.ts";

const sampleProject = {
  category: { slug: "video-projects" },
  display_order: 1,
  featured_image_url: "/poster.webp",
  full_description: "Project details and creative choices.",
  gallery_images: [],
  github_url: null,
  is_featured: true,
  live_demo_url: null,
  short_description: "A video project.",
  slug: "video-one",
  status: "published",
  tech_stack: ["Premiere Pro"],
  technical_breakdown: null,
  title: "Video One",
  video_url: "/film.mp4",
};

test("signed-in non-admins are denied; only the trusted app_metadata claim grants access", () => {
  const signedInMember = { app_metadata: { role: "user" } };
  assert.equal(Boolean(signedInMember), true);
  assert.equal(isPortfolioAdmin(signedInMember), false);
  assert.equal(isPortfolioAdmin({ app_metadata: { role: "admin" } }), true);
  assert.equal(isPortfolioAdmin({ app_metadata: { role: "editor" } }), false);
  assert.equal(isPortfolioAdmin({ user_metadata: { role: "admin" } }), false);
  assert.equal(isPortfolioAdmin(null), false);
  assert.equal(isPortfolioAdmin(undefined), false);
});

test("login return paths stay inside the admin route", () => {
  assert.equal(safeAdminPath("/admin/dashboard?tab=projects"), "/admin/dashboard?tab=projects");
  assert.equal(safeAdminPath("/admin"), "/admin");
  assert.equal(safeAdminPath("//attacker.example"), "/admin/dashboard");
  assert.equal(safeAdminPath("/administrator"), "/admin/dashboard");
  assert.equal(safeAdminPath("/admin\\\\attacker.example"), "/admin/dashboard");
});

test("the upgrade migration gates every CMS write policy on the admin claim", async () => {
  const migration = await readFile(
    new URL("../../supabase/migrations/0002_admin_only_cms_writes.sql", import.meta.url),
    "utf8",
  );
  assert.match(migration, /auth\.jwt\(\)\s*->\s*'app_metadata'\s*->>\s*'role'\s*=\s*'admin'/i);
  for (const table of ["profiles", "categories", "projects"]) {
    assert.match(migration, new RegExp(`Admins can manage ${table}`, "i"));
  }
  assert.match(migration, /Admins can upload project media/i);
  assert.match(migration, /file_size_limit\s*=\s*262144000/i);
  assert.match(migration, /allowed_mime_types\s*=\s*array/i);
  assert.doesNotMatch(migration, /for\s+all\s+to\s+authenticated\s+using\s*\(\s*true\s*\)/i);
});

test("page images have public reads but administrator-only CMS writes", async () => {
  const migration = await readFile(
    new URL("../../supabase/migrations/0003_page_media.sql", import.meta.url),
    "utf8",
  );
  assert.match(migration, /create table if not exists public\.page_media/i);
  assert.match(migration, /on public\.page_media for select\s+using\s*\(true\)/i);
  assert.match(migration, /Admins can manage page media[\s\S]*?for all[\s\S]*?using\s*\(public\.is_portfolio_admin\(\)\)[\s\S]*?with check\s*\(public\.is_portfolio_admin\(\)\)/i);
  assert.match(migration, /\('hero_room_background'[\s\S]*'gallery_photo_5'/i);
});

test("catalog import creates only categories missing from the CMS", () => {
  const categories = [
    { name: "Video Editing", slug: "video-projects", description: null, display_order: 1 },
    { name: "Web Apps", slug: "web-apps", description: null, display_order: 2 },
  ];

  assert.deepEqual(getMissingCategories(categories, new Set(["video-projects"])), [categories[1]]);
});

test("catalog import assigns the linked category and never overwrites existing projects", () => {
  const rows = buildMissingProjectRows(
    [sampleProject],
    new Set(["another-existing-project"]),
    new Map([["video-projects", "category-video-id"]]),
  );

  assert.equal(rows.length, 1);
  assert.equal(rows[0].category_id, "category-video-id");
  assert.equal(rows[0].slug, "video-one");
  assert.equal("id" in rows[0], false);

  assert.deepEqual(
    buildMissingProjectRows(
      [sampleProject],
      new Set(["video-one"]),
      new Map([["video-projects", "category-video-id"]]),
    ),
    [],
  );
});

test("catalog import refuses to create a project without a valid category link", () => {
  assert.throws(
    () => buildMissingProjectRows([sampleProject], new Set(), new Map()),
    /Choose or create a category/,
  );
});

test("missing Supabase CMS tables produce an actionable setup message", () => {
  assert.match(
    getAdminErrorMessage(
      { code: "PGRST205", message: "Could not find the table 'public.categories' in the schema cache" },
      "Unable to import.",
    ),
    /0001_portfolio_cms\.sql.*0002_admin_only_cms_writes\.sql/,
  );
});

test("page image overrides merge into the full default set without dropping untouched slots", () => {
  const saved = {
    key: "history_edit",
    label: "Story: The Edit",
    image_url: "https://portfolio.supabase.co/storage/v1/object/public/project-media/story/edit.webp",
    alt_text: "Prajjwol editing a video",
    display_order: 9,
  };
  const merged = mergePageMedia([saved]);

  assert.equal(merged.length, defaultPageMedia.length);
  assert.equal(merged.find(({ key }) => key === "history_edit")?.image_url, saved.image_url);
  assert.equal(merged.find(({ key }) => key === "history_edit")?.alt_text, saved.alt_text);
  assert.equal(merged.find(({ key }) => key === "gallery_photo_1")?.image_url, "/media/portraits/19.webp");
});
