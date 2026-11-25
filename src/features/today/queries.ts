import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { ProgressFlags } from "./steps";

export type LessonStatus = "ready" | "generating" | "failed" | "missing";

export type TodayData = {
  lessonStatus: LessonStatus;
  progress: ProgressFlags;
  streak: { current: number; longest: number; jokers: number } | null;
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

  let playerId: string | null = viewer.id;
  let playerName: string | null = null;
  if (viewer.role === "admin") {
    const { data: player } = await supabase
      .from("profiles")
      .select("id, name")
      .eq("role", "player")
      .limit(1)
      .maybeSingle();
    playerId = player?.id ?? null;
    playerName = player?.name ?? null;
  }

  const [lesson, progress, streak] = await Promise.all([
    supabase.from("daily_lessons").select("status").eq("date", date).maybeSingle(),
    playerId
      ? supabase
          .from("lesson_progress")
          .select("news_read, quiz_done, tutor_done")
          .eq("user_id", playerId)
          .eq("date", date)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    playerId
      ? supabase
          .from("streaks")
          .select("current_streak, longest_streak, jokers_available")
          .eq("user_id", playerId)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  return {
    lessonStatus: (lesson.data?.status as LessonStatus | undefined) ?? "missing",
    progress: {
      newsRead: progress.data?.news_read?.length ?? 0,
      quizDone: progress.data?.quiz_done ?? false,
      tutorDone: progress.data?.tutor_done ?? false,
    },
    streak: streak.data
      ? {
          current: streak.data.current_streak,
          longest: streak.data.longest_streak,
          jokers: streak.data.jokers_available,
        }
      : null,
    playerName,
  };
}
