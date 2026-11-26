"use server";

import { revalidatePath } from "next/cache";
import { berlinDate } from "@/lib/date";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/features/auth/session";
import type { QuizQuestion } from "@/features/lesson/schema";
import { applyAnswer, type QuizAnswer, type QuizState } from "./logic";

/** Speichert die Antwort auf eine Quizfrage der heutigen Lektion. */
export async function answerQuizQuestion(
  date: string,
  question: number,
  choice: number,
): Promise<QuizState | { error: string }> {
  const user = await getCurrentUser();
  if (user.role !== "player") return { error: "Nur für die Spielerin" };
  if (date !== berlinDate()) return { error: "Ein neuer Tag hat begonnen – bitte neu laden." };

  const supabase = await createClient();
  const [{ data: lesson }, { data: progress }] = await Promise.all([
    supabase.from("daily_lessons").select("status, quiz").eq("date", date).maybeSingle(),
    supabase
      .from("lesson_progress")
      .select("news_read, quiz_answers")
      .eq("user_id", user.id)
      .eq("date", date)
      .maybeSingle(),
  ]);

  if (lesson?.status !== "ready") return { error: "Die Lektion ist noch nicht fertig." };
  if (((progress?.news_read as number[] | undefined) ?? []).length < 3) {
    return { error: "Erst die 3 Meldungen lesen, dann kommt das Quiz." };
  }

  const answers = (progress?.quiz_answers as QuizAnswer[] | undefined) ?? [];
  const result = applyAnswer(answers, lesson.quiz as QuizQuestion[], question, choice);
  if ("error" in result) return result;
  if (result.answers.length === answers.length) return result; // schon beantwortet

  const { error } = await supabase
    .from("lesson_progress")
    .update({
      quiz_answers: result.answers,
      quiz_done: result.done,
      quiz_score: result.done ? result.score : null,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id)
    .eq("date", date);
  if (error) {
    console.error("[quiz] Antwort speichern", error);
    return { error: "Konnte nicht gespeichert werden. Bitte nochmal versuchen." };
  }

  revalidatePath("/", "layout");
  return result;
}
