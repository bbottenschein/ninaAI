"use server";

import { revalidatePath } from "next/cache";
import { askStructured } from "@/lib/claude";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/features/auth/session";
import { FeedbackSchema, normalizeFeedback, type JournalFeedback } from "./feedback";

const SYSTEM = `You give short, warm feedback on the ENGLISH of a German adult (level B1) who writes a private evening journal in English.

Strict rules:
- Feedback is only about her English: grammar, word choice, natural phrasing.
- Never comment on her feelings, her day, the people she mentions or what she did. Never give life advice, never interpret, never diagnose. Do not repeat or summarise what she wrote.
- At most 3 corrections – pick the most useful ones. Skip tiny style nitpicks. If her English is fine, give no corrections.
- For each correction, "original" must be copied EXACTLY (character by character) from her text and be as short as possible (a few words); "corrected" replaces exactly that part.
- Explanations and praise are in simple, friendly German ("du"). One sentence each.
- Praise: one concrete thing she did well in English (a good word, a full sentence, correct tense …).
- Vocabulary: up to 3 useful English words or expressions that would make her text more natural or are a good next step (not names). Example sentences should be close to her topic but must not comment on it.
- Warm and encouraging, never patronising.`;

type Result = { feedback?: JournalFeedback; error?: string; disabled?: boolean };

/** Erzeugt das Englisch-Feedback zu einem Eintrag und speichert es beim Eintrag. */
export async function generateJournalFeedback(date: string): Promise<Result> {
  const user = await getCurrentUser();
  if (user.role !== "player") return { error: "Nur für Nina" };
  const supabase = await createClient();

  const [{ data: settings }, { data: entry }] = await Promise.all([
    supabase.from("user_settings").select("journal_feedback").eq("user_id", user.id).maybeSingle(),
    supabase
      .from("journal_entries")
      .select("id, day_text, gratitude, highlight, tomorrow_focus, feedback, updated_at")
      .eq("date", date)
      .maybeSingle(),
  ]);
  if (settings && settings.journal_feedback === false) return { disabled: true };
  if (!entry) return { error: "Eintrag nicht gefunden." };

  // Schon Feedback zu genau dieser Fassung? Dann nicht neu erzeugen.
  const existing = entry.feedback as JournalFeedback | null;
  if (existing && existing.for_updated_at === entry.updated_at) return { feedback: existing };

  const texts = {
    day_text: entry.day_text as string,
    gratitude: entry.gratitude as string[],
    highlight: entry.highlight as string,
    tomorrow_focus: entry.tomorrow_focus as string,
  };
  const prompt = [
    `<how_was_your_day>\n${texts.day_text}\n</how_was_your_day>`,
    `<grateful_for>\n${texts.gratitude.map((g) => `- ${g}`).join("\n")}\n</grateful_for>`,
    texts.highlight ? `<highlight>\n${texts.highlight}\n</highlight>` : "",
    texts.tomorrow_focus ? `<focus_tomorrow>\n${texts.tomorrow_focus}\n</focus_tomorrow>` : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  try {
    const raw = await askStructured({ schema: FeedbackSchema, system: SYSTEM, prompt, effort: "low", maxTokens: 3000 });
    const feedback = normalizeFeedback(raw, texts, entry.updated_at as string);
    // Nur das Feedback-Feld ändern; updated_at bleibt, damit die Zuordnung stimmt.
    const { error } = await supabase.from("journal_entries").update({ feedback }).eq("id", entry.id);
    if (error) throw error;
    revalidatePath("/journal");
    return { feedback };
  } catch (error) {
    console.error("[journal] Feedback", error);
    return { error: "Das Feedback klappt gerade nicht – dein Eintrag ist aber gespeichert." };
  }
}

/** Englisch-Feedback ein- oder ausschalten (SPEC-journal › Abschaltbar). */
export async function setJournalFeedback(enabled: boolean): Promise<{ error?: string }> {
  const user = await getCurrentUser();
  if (user.role !== "player") return { error: "Nur für Nina" };
  const supabase = await createClient();
  const { error } = await supabase
    .from("user_settings")
    .upsert({ user_id: user.id, journal_feedback: enabled, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
  if (error) return { error: "Konnte nicht gespeichert werden." };
  revalidatePath("/journal");
  return {};
}

/** Vokabelvorschlag aus dem Feedback in die Vokabelsammlung übernehmen. */
export async function addJournalVocab(input: {
  word_en: string;
  translation_de: string;
  explanation: string;
  example: string;
  date: string;
}): Promise<{ error?: string; duplicate?: boolean }> {
  const user = await getCurrentUser();
  if (user.role !== "player") return { error: "Nur für Nina" };
  const word = input.word_en.trim().slice(0, 80);
  if (!word) return { error: "Kein Wort" };
  const supabase = await createClient();
  const { error } = await supabase.from("vocab").insert({
    user_id: user.id,
    word_en: word,
    translation_de: input.translation_de.trim().slice(0, 200),
    explanation: input.explanation.trim().slice(0, 500),
    example: input.example.trim().slice(0, 500),
    source_date: input.date,
  });
  if (error?.code === "23505") return { duplicate: true };
  if (error) return { error: "Konnte nicht übernommen werden." };
  revalidatePath("/vokabeln");
  return {};
}
