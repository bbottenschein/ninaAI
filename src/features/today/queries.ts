import "server-only";
import { createClient } from "@/lib/supabase/server";
import { lessonPhase, type LessonPhase, type LessonRow } from "@/features/lesson/status";
import { loadStreakView } from "@/features/streak/queries";
import type { ProgressFlags } from "./steps";

export type TodayData = {
  lessonPhase: LessonPhase;
  progress: ProgressFlags;
  streak: { current: number; longest: number; jokers: number; daysToJoker: number } | null;
  jokerNotice: string | null;
  playerName: string | null;
};

/**
 * Lädt alles für den Heute-Tab. Für den Admin werden die Daten der Spielerin
 * geladen (RLS erlaubt ihm das Lesen von Fortschritt und Streak).
 */
export async function loadToday(
  date: string,
  viewer: { id: string; role: "player" | "admin" },
): Promise<TodayData> {
  const supabase = await createClient();

  const [lesson, streak] = await Promise.all([
    supabase
      .from("daily_lessons")
      .select("status, attempts, generation_started_at")
      .eq("date", date)
      .maybeSingle(),
    loadStreakView(viewer, date),
  ]);

  const playerId = streak?.playerId ?? (viewer.role === "player" ? viewer.id : null);
  const { data: progress } = playerId
    ? await supabase
        .from("lesson_progress")
        .select("news_read, quiz_done, tutor_done")
        .eq("user_id", playerId)
        .eq("date", date)
        .maybeSingle()
    : { data: null };

  return {
    lessonPhase: lessonPhase((lesson.data as LessonRow | null) ?? null),
    progress: {
      newsRead: progress?.news_read?.length ?? 0,
      quizDone: progress?.quiz_done ?? false,
      tutorDone: progress?.tutor_done ?? false,
    },
    streak:
      streak
        ? {
            current: streak.state.current,
            longest: streak.state.longest,
            jokers: streak.state.jokers,
            daysToJoker: streak.daysToJoker,
          }
        : null,
    jokerNotice: viewer.role === "player" ? (streak?.jokerNotice ?? null) : null,
    playerName: viewer.role === "admin" ? (streak?.playerName ?? null) : null,
  };
}
