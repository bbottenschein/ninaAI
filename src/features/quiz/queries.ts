import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { LessonNews, QuizQuestion } from "@/features/lesson/schema";
import type { QuizAnswer } from "./logic";

export type QuizData = {
  quiz: QuizQuestion[];
  newsTitles: { en: string; de: string }[];
  answers: QuizAnswer[];
  newsDone: boolean;
};

/** Quiz des Tages samt Antworten der Spielerin. null, wenn die Lektion fehlt. */
export async function loadQuiz(
  date: string,
  viewer: { id: string; role: "player" | "admin" },
): Promise<QuizData | null> {
  const supabase = await createClient();
  const { data: lesson } = await supabase
    .from("daily_lessons")
    .select("status, news, quiz")
    .eq("date", date)
    .maybeSingle();
  if (lesson?.status !== "ready") return null;

  let progressQuery = supabase.from("lesson_progress").select("news_read, quiz_answers").eq("date", date);
  if (viewer.role === "player") progressQuery = progressQuery.eq("user_id", viewer.id);
  const { data: progress } = await progressQuery.limit(1).maybeSingle();

  return {
    quiz: lesson.quiz as QuizQuestion[],
    newsTitles: (lesson.news as LessonNews[]).map((n) => ({ en: n.title_en, de: n.title_de })),
    answers: (progress?.quiz_answers as QuizAnswer[] | undefined) ?? [],
    newsDone: ((progress?.news_read as number[] | undefined) ?? []).length >= 3,
  };
}
