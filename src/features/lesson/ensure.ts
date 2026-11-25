import "server-only";
import { addDays } from "@/lib/date";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateLesson, type PreviousLesson } from "./generate";
import type { LessonNews } from "./schema";
import { MAX_ATTEMPTS, STALE_AFTER_SECONDS } from "./status";

export type EnsureResult = "generated" | "failed" | "skipped";

/**
 * Sorgt dafür, dass die Lektion für `date` existiert. Wird vom Morgen-Job und als
 * On-Demand-Fallback beim Öffnen der App aufgerufen. Die DB-Funktion
 * `claim_lesson_generation` verhindert doppelte Erzeugung; wer die Sperre nicht
 * bekommt, tut nichts.
 */
export async function ensureLesson(date: string, trigger: "job" | "on-demand"): Promise<EnsureResult> {
  const admin = createAdminClient();

  const { data: claimed, error: claimError } = await admin.rpc("claim_lesson_generation", {
    p_date: date,
    p_max_attempts: MAX_ATTEMPTS,
    p_stale_seconds: STALE_AFTER_SECONDS,
  });
  if (claimError) throw claimError;
  if (!claimed) return "skipped";

  const started = Date.now();
  try {
    const previous = await loadPreviousLesson(admin, date);
    const lesson = await generateLesson(date, previous);

    const { error } = await admin
      .from("daily_lessons")
      .update({
        status: "ready",
        news: lesson.news,
        quiz: lesson.quiz,
        tutor_questions: lesson.tutor_questions,
        error: null,
        updated_at: new Date().toISOString(),
      })
      .eq("date", date);
    if (error) throw error;

    console.info(`[lesson] ${date} erzeugt (${trigger}, ${Math.round((Date.now() - started) / 1000)} s)`);
    return "generated";
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[lesson] ${date} fehlgeschlagen (${trigger})`, error);
    await admin
      .from("daily_lessons")
      .update({ status: "failed", error: message.slice(0, 2000), updated_at: new Date().toISOString() })
      .eq("date", date);
    return "failed";
  }
}

/** Meldungen des Vortags, damit keine Dubletten entstehen. */
async function loadPreviousLesson(
  admin: ReturnType<typeof createAdminClient>,
  date: string,
): Promise<PreviousLesson> {
  const { data } = await admin
    .from("daily_lessons")
    .select("news")
    .eq("date", addDays(date, -1))
    .eq("status", "ready")
    .maybeSingle();
  const news = (data?.news ?? []) as LessonNews[];
  return {
    titles: news.map((n) => n.title_en),
    urls: news.map((n) => n.source_url),
  };
}
