import "server-only";
import { z } from "zod";
import { askStructured } from "@/lib/claude";
import { berlinParts } from "@/lib/date";
import { createAdminClient } from "@/lib/supabase/admin";
import { monthNameEn, previousMonth, reviewStats, shouldCreateReview } from "./review";

const ReviewSchema = z.object({
  summary_en: z.string().describe("4–7 short sentences in simple English (B1), addressed to Nina as 'you'."),
});

const SYSTEM = `You write a short, warm monthly look-back for Nina's private journal, in simple English (level B1), addressed to her as "you".

Content: her nicest moments of the month (from highlights and day texts), recurring things she was grateful for, and how her mood went over the month (described gently, e.g. "the second half of the month felt lighter").
Rules:
- Always positive and descriptive. Never judge, never give advice, never interpret feelings or diagnose, never mention numbers of entries or missing days.
- Only use what is in her entries. Do not invent events.
- 4–7 short sentences. No headings, no lists.`;

/**
 * Monthly Review (SPEC-journal › Jobs): ab dem Monatsersten 07:00 für jede Nutzerin mit
 * Einträgen im Vormonat einmal einen Rückblick erzeugen. Kein Push.
 */
export async function runJournalReviews(now = new Date()) {
  const admin = createAdminClient();
  const { month, from, to } = previousMonth(berlinParts(now).date);
  const { data: players } = await admin.from("profiles").select("id").eq("role", "player");

  let created = 0;
  for (const { id } of players ?? []) {
    const [{ data: existing }, { data: entries }] = await Promise.all([
      admin.from("journal_reviews").select("id").eq("user_id", id).eq("month", month).maybeSingle(),
      admin
        .from("journal_entries")
        .select("date, rating, mood_word, day_text, gratitude, highlight")
        .eq("user_id", id)
        .gte("date", from)
        .lte("date", to)
        .order("date"),
    ]);
    if (!shouldCreateReview(now, Boolean(existing), entries?.length ?? 0)) continue;

    const stats = reviewStats(entries!.map((e) => ({ date: e.date, rating: e.rating })));
    const prompt = [
      `<month>${monthNameEn(month)}</month>`,
      `<entries>`,
      ...entries!.map(
        (e) =>
          `${e.date} | rating ${e.rating}/10${e.mood_word ? ` | ${e.mood_word}` : ""}\nday: ${String(e.day_text).slice(0, 600)}\ngrateful: ${(e.gratitude as string[]).join("; ")}${e.highlight ? `\nhighlight: ${e.highlight}` : ""}`,
      ),
      `</entries>`,
    ].join("\n");

    try {
      const { summary_en } = await askStructured({ schema: ReviewSchema, system: SYSTEM, prompt, effort: "medium", maxTokens: 2000 });
      const { error } = await admin
        .from("journal_reviews")
        .upsert({ user_id: id, month, summary_en: summary_en.trim(), stats }, { onConflict: "user_id,month", ignoreDuplicates: true });
      if (error) throw error;
      created++;
    } catch (error) {
      console.error("[journal] Monthly Review", month, error);
    }
  }
  return { month, created };
}
