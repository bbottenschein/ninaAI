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

/** Einträge ab einem Datum (für die Mood Overview), neueste zuerst. */
export async function loadEntriesSince(from: string): Promise<JournalEntry[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("journal_entries")
    .select(COLUMNS)
    .gte("date", from)
    .order("date", { ascending: false })
    .limit(800);
  return (data ?? []) as JournalEntry[];
}

/** Ob das Englisch-Feedback eingeschaltet ist (Standard: an). */
export async function loadFeedbackEnabled(userId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase.from("user_settings").select("journal_feedback").eq("user_id", userId).maybeSingle();
  return data?.journal_feedback ?? true;
}
