import { createBrowserClient } from "@supabase/ssr";
import { getSupabasePublicEnv } from "@/lib/supabase/env";
import type { Database } from "@/types/database";

export function createClient() {
  const { anonKey, url } = getSupabasePublicEnv();

  return createBrowserClient<Database>(url, anonKey);
}

export const createSupabaseBrowserClient = createClient;
