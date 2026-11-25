import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { LessonNews } from "@/features/lesson/schema";

export type NewsData = {
  news: LessonNews[];
  /** Indizes der gelesenen Meldungen (der Spielerin). */
  read: number[];
};

/**
 * Lädt die News des Tages. Für den Admin wird der Lesefortschritt der
 * Spielerin geladen (nur lesend). null, wenn die Lektion noch nicht fertig ist.
 */
export async function loadNews(
  date: string,
  viewer: { id: string; role: "player" | "admin" },
): Promise<NewsData | null> {
  const supabase = await createClient();

  const { data: lesson } = await supabase
    .from("daily_lessons")
    .select("status, news")
    .eq("date", date)
    .maybeSingle();
  if (lesson?.status !== "ready") return null;

  let progressQuery = supabase.from("lesson_progress").select("news_read").eq("date", date);
  if (viewer.role === "player") {
    progressQuery = progressQuery.eq("user_id", viewer.id);
  }
  const { data: progress } = await progressQuery.limit(1).maybeSingle();

  return {
    news: lesson.news as LessonNews[],
    read: (progress?.news_read as number[] | undefined) ?? [],
  };
}
