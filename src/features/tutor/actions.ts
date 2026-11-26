"use server";

import { revalidatePath } from "next/cache";
import { askStructured } from "@/lib/claude";
import { berlinDate } from "@/lib/date";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/features/auth/session";
import type { LessonNews, TutorQuestion } from "@/features/lesson/schema";
import { conversationStage, validateHistory, type ChatMessage } from "./logic";
import {
  TUTOR_SYSTEM,
  TutorFeedbackSchema,
  TutorReactionSchema,
  feedbackPrompt,
  reactionPrompt,
  type TutorFeedback,
} from "./prompts";
import type { StoredTutorResult } from "./queries";

export type TutorTurnResult =
  | { kind: "next"; message: ChatMessage }
  | { kind: "done"; message: ChatMessage; feedback: TutorFeedback }
  | { error: string };

/**
 * Ein Gesprächsschritt: Nina hat geantwortet. Der Tutor reagiert kurz und stellt die
 * nächste vorbereitete Frage – oder beendet das Gespräch mit Feedback. Ist das
 * Gespräch beendet, ist der Tutor-Schritt erledigt (auch bei „Nochmal“ unverändert).
 */
export async function tutorTurn(date: string, rawHistory: unknown): Promise<TutorTurnResult> {
  const user = await getCurrentUser();
  if (user.role !== "player") return { error: "Nur für die Spielerin" };
  if (date !== berlinDate()) return { error: "Ein neuer Tag hat begonnen – bitte neu laden." };

  const supabase = await createClient();
  const [{ data: lesson }, { data: progress }] = await Promise.all([
    supabase.from("daily_lessons").select("status, news, tutor_questions").eq("date", date).maybeSingle(),
    supabase
      .from("lesson_progress")
      .select("news_read, quiz_done, completed_at")
      .eq("user_id", user.id)
      .eq("date", date)
      .maybeSingle(),
  ]);
  if (lesson?.status !== "ready") return { error: "Die Lektion ist noch nicht fertig." };
  if (!progress?.quiz_done) return { error: "Erst das Quiz beantworten, dann kommt der Tutor." };

  const questions = lesson.tutor_questions as TutorQuestion[];
  const news = lesson.news as LessonNews[];
  const history = validateHistory(rawHistory, questions);
  if (!history || history.at(-1)?.role !== "nina") return { error: "Das Gespräch ist durcheinander – bitte neu starten." };

  const stage = conversationStage(history, questions);

  try {
    if (!stage.finished) {
      const { reaction } = await askStructured({
        schema: TutorReactionSchema,
        system: TUTOR_SYSTEM,
        prompt: reactionPrompt(news, history),
        effort: "low",
        maxTokens: 2000,
      });
      return { kind: "next", message: { role: "tutor", text: `${reaction.trim()} ${stage.nextQuestion}` } };
    }

    const feedback = await askStructured({
      schema: TutorFeedbackSchema,
      system: TUTOR_SYSTEM,
      prompt: feedbackPrompt(news, history),
      effort: "medium",
      maxTokens: 4000,
    });
    const closing: ChatMessage = { role: "tutor", text: feedback.closing.trim() };

    const result: StoredTutorResult = {
      feedback: { ...feedback, strengths: feedback.strengths.slice(0, 2) },
      transcript: [...history, closing],
      at: new Date().toISOString(),
    };
    const newsDone = ((progress.news_read as number[] | null) ?? []).length >= 3;
    const { error } = await supabase
      .from("lesson_progress")
      .update({
        tutor_done: true,
        tutor_feedback: result,
        completed_at: progress.completed_at ?? (newsDone ? new Date().toISOString() : null),
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id)
      .eq("date", date);
    if (error) throw error;

    revalidatePath("/");
    return { kind: "done", message: closing, feedback: result.feedback };
  } catch (error) {
    console.error("[tutor] Gesprächsschritt fehlgeschlagen", error);
    return { error: "Der Tutor braucht kurz eine Pause. Bitte nochmal senden." };
  }
}
