import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { TutorQuestion } from "@/features/lesson/schema";
import type { ChatMessage } from "./logic";
import type { TutorFeedback } from "./prompts";

export type StoredTutorResult = { feedback: TutorFeedback; transcript: ChatMessage[]; at: string };

export type TutorData = {
  questions: TutorQuestion[];
  quizDone: boolean;
  tutorDone: boolean;
  result: StoredTutorResult | null;
  voiceSecondsUsed: number;
};

export async function loadTutor(
  date: string,
  viewer: { id: string; role: "player" | "admin" },
): Promise<TutorData | null> {
  const supabase = await createClient();
  const { data: lesson } = await supabase
    .from("daily_lessons")
    .select("status, tutor_questions")
    .eq("date", date)
    .maybeSingle();
  if (lesson?.status !== "ready") return null;

  let progressQuery = supabase
    .from("lesson_progress")
    .select("quiz_done, tutor_done, tutor_feedback")
    .eq("date", date);
  let usageQuery = supabase.from("voice_usage").select("audio_seconds").eq("date", date);
  if (viewer.role === "player") {
    progressQuery = progressQuery.eq("user_id", viewer.id);
    usageQuery = usageQuery.eq("user_id", viewer.id);
  }
  const [{ data: progress }, { data: usage }] = await Promise.all([
    progressQuery.limit(1).maybeSingle(),
    usageQuery.limit(1).maybeSingle(),
  ]);

  return {
    questions: lesson.tutor_questions as TutorQuestion[],
    quizDone: progress?.quiz_done ?? false,
    tutorDone: progress?.tutor_done ?? false,
    result: (progress?.tutor_feedback as StoredTutorResult | null) ?? null,
    voiceSecondsUsed: Number(usage?.audio_seconds ?? 0),
  };
}
