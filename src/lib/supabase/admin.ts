import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { supabaseUrl } from "@/lib/env";
import { supabaseSecretKey } from "@/lib/env.server";

/**
 * Supabase-Client mit dem Secret Key. Umgeht Row Level Security –
 * nur für Jobs (z. B. Erzeugen der Tageslektion), nie mit Nutzereingaben direkt.
 */
export function createAdminClient() {
  return createSupabaseClient(supabaseUrl(), supabaseSecretKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
