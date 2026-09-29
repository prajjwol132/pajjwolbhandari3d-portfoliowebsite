import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAdminEnv } from "@/lib/supabase/env";
import type { Database } from "@/types/database";

export function createAdminClient() {
  const { serviceRoleKey, url } = getSupabaseAdminEnv();

  return createSupabaseClient<Database>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export const createSupabaseAdminClient = createAdminClient;
