"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/features/auth/session";
import { prefsFor, type PushPrefKey } from "./prefs";
import { parseTheme, THEME_COOKIE } from "./theme";

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

/** Design wählen: am Konto speichern und als Cookie für dieses Gerät setzen. */
export async function setTheme(value: string): Promise<{ error?: string }> {
  const user = await getCurrentUser();
  const theme = parseTheme(value);
  if (theme !== value) return { error: "Unbekanntes Design" };
  const supabase = await createClient();
  const { error } = await supabase
    .from("user_settings")
    .upsert({ user_id: user.id, theme, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
  if (error) return { error: "Konnte nicht gespeichert werden." };
  (await cookies()).set(THEME_COOKIE, theme, { path: "/", maxAge: 31536000, sameSite: "lax" });
  revalidatePath("/", "layout");
  return {};
}
