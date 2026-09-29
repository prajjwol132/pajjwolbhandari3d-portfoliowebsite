function readRequiredEnv(name: string) {
  const value = process.env[name];

  if (!value || value.trim().length === 0) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function readSupabasePublicKey() {
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const value = publishableKey || anonKey;

  if (!value || value.trim().length === 0) {
    throw new Error(
      "Missing required environment variable: NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY",
    );
  }

  return value;
}

export function getSupabasePublicEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!url || url.trim().length === 0) {
    throw new Error("Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL");
  }

  return {
    url,
    anonKey: readSupabasePublicKey(),
  };
}

export function getSupabaseAdminEnv() {
  return {
    ...getSupabasePublicEnv(),
    serviceRoleKey: readRequiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
  };
}
