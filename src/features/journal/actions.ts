"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/features/auth/session";
import { journalAccess } from "./lock";
import { isEditable, validateEntry, type EntryInput } from "./logic";

/**
 * Speichert den Abend-Eintrag eines Tages (einer pro Tag). Bearbeitbar bis 12:00
 * am Folgetag, danach nur noch lesbar (SPEC-journal › Zeitfenster).
 */
export async function saveJournalEntry(date: string, input: EntryInput): Promise<{ error?: string }> {
  const user = await getCurrentUser();
  if (user.role !== "player") return { error: "Nur für Nina" };
  if (!(await journalAccess(user.id)).unlocked) return { error: "Das Journal ist gesperrt." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !isEditable(date, new Date())) {
    return { error: "Dieser Tag kann nicht mehr bearbeitet werden." };
  }
  const result = validateEntry(input);
  if ("error" in result) return result;

  const supabase = await createClient();
  const { error } = await supabase
    .from("journal_entries")
    .upsert(
      { user_id: user.id, date, ...result.entry, updated_at: new Date().toISOString() },
      { onConflict: "user_id,date" },
    );
  if (error) {
    console.error("[journal] speichern", error);
    return { error: "Konnte nicht gespeichert werden. Bitte nochmal versuchen." };
  }
  revalidatePath("/", "layout");
  return {};
}
