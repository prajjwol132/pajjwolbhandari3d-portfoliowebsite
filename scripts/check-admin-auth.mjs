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

const email = env.ADMIN_EMAIL;
const password = env.ADMIN_PASSWORD;
const publicKey = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!email || !password) {
  console.error("ADMIN_EMAIL and ADMIN_PASSWORD are required.");
  process.exit(1);
}

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, publicKey);
const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password,
});

if (error) {
  console.log(JSON.stringify({ error: error.message, ok: false }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({ ok: true, user: data.user.email }, null, 2));
