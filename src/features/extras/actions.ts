"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, requireAdmin } from "@/features/auth/session";
import { sendPush } from "@/lib/push";
import { COMPLIMENT_MAX, pickCompliment } from "./compliments";
import { cleanLoveNote, LOVE_PUSH } from "./love-notes";
import { loveNotePartner } from "./queries";

/** Nächstes Kompliment für Nina auswählen und als gezeigt merken. */
export async function nextCompliment(): Promise<{ text?: string }> {
  const user = await getCurrentUser();
  if (user.role !== "player") return {};
  const supabase = await createClient();
  const [{ data: active }, { data: views }] = await Promise.all([
    supabase.from("compliments").select("id, text_en").eq("active", true),
    supabase.from("compliment_views").select("compliment_id").eq("user_id", user.id).limit(20000),
  ]);
  const counts = new Map<string, number>();
  for (const v of views ?? []) counts.set(v.compliment_id, (counts.get(v.compliment_id) ?? 0) + 1);
  const chosen = pickCompliment(active ?? [], counts);
  if (!chosen) return {};
  await supabase.from("compliment_views").insert({ user_id: user.id, compliment_id: chosen.id });
  return { text: chosen.text_en };
}

type FormState = { ok?: boolean; error?: string };

function cleanText(value: unknown): string | null {
  const text = String(value ?? "").trim().replace(/\s+/g, " ");
  return text.length >= 1 && text.length <= COMPLIMENT_MAX ? text : null;
}

/** Admin: neues Kompliment anlegen. */
export async function addCompliment(_: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();
  const text = cleanText(form.get("text"));
  if (!text) return { error: `1–${COMPLIMENT_MAX} Zeichen, bitte.` };
  const supabase = await createClient();
  const { error } = await supabase.from("compliments").insert({ text_en: text, created_by: "admin" });
  if (error) return { error: "Konnte nicht gespeichert werden." };
  revalidatePath("/admin");
  return { ok: true };
}

/** Admin: Text ändern. */
export async function updateCompliment(id: string, value: string): Promise<{ error?: string }> {
  await requireAdmin();
  const text = cleanText(value);
  if (!text) return { error: `1–${COMPLIMENT_MAX} Zeichen, bitte.` };
  const supabase = await createClient();
  const { error } = await supabase.from("compliments").update({ text_en: text }).eq("id", id);
  if (error) return { error: "Konnte nicht gespeichert werden." };
  revalidatePath("/admin");
  return {};
}

/** Admin: aktivieren / deaktivieren. */
export async function setComplimentActive(id: string, active: boolean): Promise<{ error?: string }> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("compliments").update({ active }).eq("id", id);
  if (error) return { error: "Konnte nicht gespeichert werden." };
  revalidatePath("/admin");
  return {};
}

/** Love Note an das jeweils andere Konto schicken und sofort pushen. */
export async function sendLoveNote(input: string): Promise<{ error?: string }> {
  const user = await getCurrentUser();
  const cleaned = cleanLoveNote(String(input ?? ""));
  if ("error" in cleaned) return { error: cleaned.error };

  const recipient = await loveNotePartner(user.role);
  if (!recipient) return { error: "Niemand da, der die Nachricht bekommen kann." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("love_notes")
    .insert({ sender_id: user.id, recipient_id: recipient.id, text: cleaned.text });
  if (error) {
    console.error("[love-notes] senden", error);
    return { error: "Konnte nicht gesendet werden. Bitte nochmal versuchen." };
  }
  // Ein Fehler beim Push ändert nichts daran, dass die Nachricht im Postfach liegt.
  try {
    await sendPush([recipient.id], { ...LOVE_PUSH });
  } catch (pushError) {
    console.error("[love-notes] Push fehlgeschlagen", pushError);
  }
  revalidatePath("/love-notes");
  return {};
}

/** Alle empfangenen Notes als gelesen markieren (Postfach geöffnet). */
export async function markLoveNotesRead() {
  await getCurrentUser();
  const supabase = await createClient();
  await supabase.rpc("mark_love_notes_read");
  revalidatePath("/", "layout");
}

/** Eigenen Favoriten umschalten. */
export async function toggleLoveNoteFavorite(id: string): Promise<{ favorite?: boolean; error?: string }> {
  await getCurrentUser();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("toggle_love_note_favorite", { p_id: id });
  if (error) return { error: "Konnte nicht gespeichert werden." };
  return { favorite: Boolean(data) };
}
