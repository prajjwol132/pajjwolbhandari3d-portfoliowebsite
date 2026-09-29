import { randomBytes } from "node:crypto";
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

const users = await supabase.auth.admin.listUsers({ page: 1, perPage: 1 });

if (users.error) {
  throw users.error;
}

if (users.data.users.length > 0) {
  console.log(JSON.stringify({ created: false, reason: "auth-user-already-exists" }, null, 2));
  process.exit(0);
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

console.log(JSON.stringify({ created: true, email, password }, null, 2));
