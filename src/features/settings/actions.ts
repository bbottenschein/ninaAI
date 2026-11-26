"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/features/auth/session";
import { prefsFor, type PushPrefKey } from "./prefs";

/** Eine Push-Art ein- oder ausschalten (nur die, die zur Rolle passen). */
export async function setPushPreference(key: PushPrefKey, enabled: boolean): Promise<{ error?: string }> {
  const user = await getCurrentUser();
  if (!prefsFor(user.role).some((p) => p.key === key)) return { error: "Unbekannte Einstellung" };
  const supabase = await createClient();
  const { error } = await supabase
    .from("user_settings")
    .upsert({ user_id: user.id, [key]: Boolean(enabled), updated_at: new Date().toISOString() }, { onConflict: "user_id" });
  if (error) return { error: "Konnte nicht gespeichert werden." };
  revalidatePath("/einstellungen");
  return {};
}
