"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/features/auth/session";
import { clearUnlocked, hashPin, journalAccess, setUnlocked, verifyPin } from "./lock";
import { afterFailedAttempt, isLockedOut, isValidPin } from "./pin";

type Result = { error?: string };

async function player() {
  const user = await getCurrentUser();
  if (user.role !== "player") throw new Error("Nur für Nina");
  return { user, supabase: await createClient() };
}

/** Journal mit PIN entsperren (5 Fehlversuche → 5 Minuten Pause). */
export async function unlockJournal(pin: string): Promise<Result> {
  const { user, supabase } = await player();
  const { data } = await supabase
    .from("user_settings")
    .select("journal_pin_hash, journal_pin_failed, journal_pin_locked_until")
    .eq("user_id", user.id)
    .maybeSingle();
  const now = new Date();
  if (!data?.journal_pin_hash) return {};
  if (isLockedOut(data.journal_pin_locked_until, now)) {
    return { error: "Zu viele Versuche. Bitte warte ein paar Minuten." };
  }
  if (!verifyPin(pin, data.journal_pin_hash)) {
    const next = afterFailedAttempt(data.journal_pin_failed ?? 0, now);
    await supabase
      .from("user_settings")
      .update({ journal_pin_failed: next.failed, journal_pin_locked_until: next.lockedUntil })
      .eq("user_id", user.id);
    return { error: next.lockedUntil ? "Zu viele Versuche. Bitte warte 5 Minuten." : "Die PIN stimmt nicht." };
  }
  await supabase.from("user_settings").update({ journal_pin_failed: 0, journal_pin_locked_until: null }).eq("user_id", user.id);
  await setUnlocked(user.id, data.journal_pin_hash);
  revalidatePath("/journal");
  return {};
}

/** Journal sofort wieder sperren. */
export async function lockJournal() {
  await clearUnlocked();
  revalidatePath("/journal");
}

/** PIN setzen oder ändern. Zum Ändern muss das Journal gerade entsperrt sein. */
export async function setJournalPin(pin: string): Promise<Result> {
  const { user, supabase } = await player();
  if (!isValidPin(pin)) return { error: "Die PIN braucht genau 4 Ziffern." };
  const access = await journalAccess(user.id);
  if (!access.unlocked) return { error: "Bitte zuerst das Journal entsperren." };
  const hash = hashPin(pin);
  const { error } = await supabase
    .from("user_settings")
    .upsert(
      { user_id: user.id, journal_pin_hash: hash, journal_pin_failed: 0, journal_pin_locked_until: null, updated_at: new Date().toISOString() },
      { onConflict: "user_id" },
    );
  if (error) return { error: "Konnte nicht gespeichert werden." };
  await setUnlocked(user.id, hash);
  revalidatePath("/", "layout");
  return {};
}

/** PIN entfernen (nur, wenn das Journal gerade entsperrt ist). */
export async function removeJournalPin(): Promise<Result> {
  const { user, supabase } = await player();
  const access = await journalAccess(user.id);
  if (!access.unlocked) return { error: "Bitte zuerst das Journal entsperren." };
  const { error } = await supabase
    .from("user_settings")
    .update({ journal_pin_hash: null, journal_pin_failed: 0, journal_pin_locked_until: null })
    .eq("user_id", user.id);
  if (error) return { error: "Konnte nicht gespeichert werden." };
  await clearUnlocked();
  revalidatePath("/", "layout");
  return {};
}

/** Journal vollständig löschen: alle Einträge und Rückblicke. */
export async function deleteJournal(confirmation: string): Promise<Result> {
  const { user, supabase } = await player();
  if (confirmation.trim().toUpperCase() !== "LÖSCHEN") return { error: "Bitte „LÖSCHEN“ eintippen." };
  const access = await journalAccess(user.id);
  if (!access.unlocked) return { error: "Bitte zuerst das Journal entsperren." };
  const [entries, reviews] = await Promise.all([
    supabase.from("journal_entries").delete().eq("user_id", user.id),
    // Rückblicke schreibt nur der Job; löschen darf sie die Besitzerin über diese Aktion.
    supabase.rpc("delete_own_journal_reviews"),
  ]);
  if (entries.error || reviews.error) {
    console.error("[journal] löschen", entries.error, reviews.error);
    return { error: "Konnte nicht vollständig gelöscht werden. Bitte nochmal versuchen." };
  }
  revalidatePath("/", "layout");
  return {};
}
