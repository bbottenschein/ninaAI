import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { CurrentUser } from "@/features/auth/session";
import { resolvePrefs, type PushPrefKey } from "./prefs";
import { parseTheme, type Theme } from "./theme";

export async function loadPushPrefs(user: CurrentUser): Promise<Record<PushPrefKey, boolean>> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("user_settings")
    .select("push_love_notes, push_learning, push_reminders, daily_overview, push_rewards")
    .eq("user_id", user.id)
    .maybeSingle();
  return resolvePrefs(user.role, data);
}

/** Gewähltes Design des Kontos (Standard: Flower). */
export async function loadTheme(userId: string): Promise<Theme> {
  const supabase = await createClient();
  const { data } = await supabase.from("user_settings").select("theme").eq("user_id", userId).maybeSingle();
  return parseTheme(data?.theme);
}
