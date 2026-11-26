import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { JournalEntry } from "./logic";

const COLUMNS =
  "id, date, rating, mood_word, day_text, gratitude, highlight, tomorrow_focus, feedback, created_at, updated_at";

/** Einträge der Spielerin für die genannten Tage. RLS liefert nur ihre eigenen. */
export async function loadEntries(dates: string[]): Promise<JournalEntry[]> {
  if (dates.length === 0) return [];
  const supabase = await createClient();
  const { data } = await supabase.from("journal_entries").select(COLUMNS).in("date", dates);
  return (data ?? []) as JournalEntry[];
}

/** Letzte Einträge (für die einfache Übersicht in Phase J1). */
export async function loadRecentEntries(limit = 14): Promise<JournalEntry[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("journal_entries").select(COLUMNS).order("date", { ascending: false }).limit(limit);
  return (data ?? []) as JournalEntry[];
}
