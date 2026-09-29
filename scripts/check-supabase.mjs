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

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !anonKey || !serviceRoleKey) {
  console.error("Missing Supabase environment variables.");
  process.exit(1);
}

const anonClient = createClient(url, anonKey);
const adminClient = createClient(url, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

function formatProbe(error, count) {
  if (error) {
    return `error:${error.code || error.message}`;
  }

  return `ok:${count ?? 0}`;
}

const result = {
  anon: {},
  auth: {},
  service: "configured",
  storage: {},
  tables: {},
};

const anonProbe = await anonClient
  .from("categories")
  .select("*")
  .limit(1);
result.anon.categories = formatProbe(anonProbe.error, anonProbe.count);

for (const table of ["profiles", "categories", "projects"]) {
  const probe = await adminClient
    .from(table)
    .select("*")
    .limit(1);

  result.tables[table] = formatProbe(probe.error, probe.count);
}

const bucketList = await adminClient.storage.listBuckets();

if (bucketList.error) {
  result.storage.bucketList = `error:${bucketList.error.message}`;
} else {
  const exists = bucketList.data.some((bucket) => bucket.name === "project-media");
  result.storage.projectMedia = exists ? "exists" : "missing";

  if (!exists) {
    const createBucket = await adminClient.storage.createBucket("project-media", {
      public: true,
    });

    result.storage.projectMedia = createBucket.error
      ? `create-error:${createBucket.error.message}`
      : "created-public";
  }
}

const users = await adminClient.auth.admin.listUsers({ page: 1, perPage: 1 });
result.auth.adminListUsers = users.error
  ? `error:${users.error.message}`
  : `ok:${users.data.users.length}`;

console.log(JSON.stringify(result, null, 2));
