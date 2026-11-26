import type { TutorQuestion } from "@/features/lesson/schema";

export type ChatMessage = { role: "tutor" | "nina"; text: string };

/** Tageslimit für Sprachaufnahmen (SPEC › Hinweise: begrenzt die Kosten). */
export const VOICE_LIMIT_SECONDS = 5 * 60;
/** Längste einzelne Aufnahme. */
export const MAX_RECORDING_SECONDS = 60;
export const MAX_ANSWER_CHARS = 1500;

export function openingMessage(name: string, questions: TutorQuestion[]): ChatMessage {
  return {
    role: "tutor",
    text: `Hi ${name}! I'm your English tutor. Let's talk about today's news. ${questions[0]?.question ?? ""}`.trim(),
  };
}

/** Wie viele Fragen sind beantwortet, welche kommt als Nächstes? */
export function conversationStage(history: ChatMessage[], questions: TutorQuestion[]) {
  const answered = history.filter((m) => m.role === "nina").length;
  return {
    answered,
    total: questions.length,
    nextQuestion: questions[answered]?.question ?? null,
    finished: answered >= questions.length,
  };
}

/**
 * Prüft einen Gesprächsverlauf aus dem Browser: abwechselnd Tutor/Nina,
 * beginnend mit dem Tutor, nicht mehr Antworten als Fragen, begrenzte Länge.
 */
export function validateHistory(history: unknown, questions: TutorQuestion[]): ChatMessage[] | null {
  if (!Array.isArray(history) || history.length === 0 || history.length > questions.length * 2 + 1) {
    return null;
  }
  const result: ChatMessage[] = [];
  for (const [i, m] of history.entries()) {
    if (typeof m !== "object" || m === null) return null;
    const { role, text } = m as Record<string, unknown>;
    const expected = i % 2 === 0 ? "tutor" : "nina";
    if (role !== expected || typeof text !== "string") return null;
    const trimmed = text.trim().slice(0, MAX_ANSWER_CHARS);
    if (!trimmed) return null;
    result.push({ role: expected, text: trimmed });
  }
  return result;
}
