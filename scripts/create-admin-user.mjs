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

const email = (env.SUPABASE_ADMIN_EMAIL || env.ADMIN_EMAIL)?.trim().toLowerCase();
if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY || !email) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and SUPABASE_ADMIN_EMAIL (or ADMIN_EMAIL) are required.");
}

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

let page = 1;
let account = null;
while (!account) {
  const result = await supabase.auth.admin.listUsers({ page, perPage: 100 });
  if (result.error) throw result.error;
  account = result.data.users.find((user) => user.email?.toLowerCase() === email) ?? null;
  if (result.data.users.length < 100) break;
  page += 1;
}

if (!account) {
  const password = env.SUPABASE_ADMIN_PASSWORD || env.ADMIN_PASSWORD;
  if (!password || password.length < 12) {
    throw new Error("No matching account found. Create it in Supabase Auth or set SUPABASE_ADMIN_PASSWORD (12+ characters).");
  }

  const created = await supabase.auth.admin.createUser({
    email,
    email_confirm: true,
    password,
    app_metadata: { role: "admin" },
  });
  if (created.error) throw created.error;
  console.log(JSON.stringify({ action: "created", email, role: "admin" }, null, 2));
} else {
  const promoted = await supabase.auth.admin.updateUserById(account.id, {
    app_metadata: { ...account.app_metadata, role: "admin" },
  });
  if (promoted.error) throw promoted.error;
  console.log(JSON.stringify({ action: "admin-claim-set", email, role: "admin" }, null, 2));
}
