import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const required = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
];

const forbiddenPublicFragments = [
  "SERVICE_ROLE",
  "SECRET",
  "PRIVATE",
  "ADMIN",
  "TOKEN",
];

function parseEnvFile(filePath) {
  if (!existsSync(filePath)) {
    return {};
  }

  return Object.fromEntries(
    readFileSync(filePath, "utf8")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const index = line.indexOf("=");
        const key = line.slice(0, index).trim();
        const value = line.slice(index + 1).trim().replace(/^["']|["']$/g, "");
        return [key, value];
      }),
  );
}

const fileEnv = parseEnvFile(resolve(process.cwd(), ".env.local"));
const env = {
  ...fileEnv,
  ...process.env,
};

const errors = [];
const warnings = [];

for (const key of required) {
  if (!env[key] || env[key].trim().length === 0) {
    errors.push(`Missing required environment variable: ${key}`);
  }
}

const supabasePublicKey =
  env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabasePublicKey || supabasePublicKey.trim().length === 0) {
  errors.push(
    "Missing required environment variable: NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY",
  );
}

if (env.NEXT_PUBLIC_SUPABASE_URL) {
  try {
    const url = new URL(env.NEXT_PUBLIC_SUPABASE_URL);

    if (url.protocol !== "https:" && !url.hostname.includes("localhost")) {
      errors.push("NEXT_PUBLIC_SUPABASE_URL must use HTTPS outside local development.");
    }
  } catch {
    errors.push("NEXT_PUBLIC_SUPABASE_URL must be a valid URL.");
  }
}

if (
  supabasePublicKey &&
  env.SUPABASE_SERVICE_ROLE_KEY &&
  supabasePublicKey === env.SUPABASE_SERVICE_ROLE_KEY
) {
  errors.push("SUPABASE_SERVICE_ROLE_KEY must never match the public Supabase key.");
}

for (const key of Object.keys(env)) {
  if (!key.startsWith("NEXT_PUBLIC_")) {
    continue;
  }

  const containsSecretName = forbiddenPublicFragments.some((fragment) => key.includes(fragment));

  if (containsSecretName) {
    errors.push(`Potential secret exposure: ${key} is public because it starts with NEXT_PUBLIC_.`);
  }
}

if (!env.NEXT_PUBLIC_SITE_URL) {
  warnings.push("NEXT_PUBLIC_SITE_URL is not set. Add it for canonical metadata and deployment checks.");
}

if (env.SUPABASE_SERVICE_ROLE_KEY && env.SUPABASE_SERVICE_ROLE_KEY.length < 32) {
  warnings.push("SUPABASE_SERVICE_ROLE_KEY looks unusually short. Confirm the production value.");
}

if (errors.length > 0) {
  console.error("Environment validation failed:");
  errors.forEach((error) => console.error(`- ${error}`));

  if (warnings.length > 0) {
    console.warn("\nWarnings:");
    warnings.forEach((warning) => console.warn(`- ${warning}`));
  }

  process.exit(1);
}

console.log("Environment validation passed.");

if (warnings.length > 0) {
  console.warn("Warnings:");
  warnings.forEach((warning) => console.warn(`- ${warning}`));
}
