import type { QuizQuestion } from "@/features/lesson/schema";

export type QuizAnswer = { question: number; choice: number; correct: boolean };

export type QuizState = { answers: QuizAnswer[]; done: boolean; score: number };

export function quizState(answers: QuizAnswer[], total: number): QuizState {
  return {
    answers,
    done: answers.length >= total,
    score: answers.filter((a) => a.correct).length,
  };
}

/**
 * Wertet eine Antwort aus. Fragen werden der Reihe nach beantwortet; eine bereits
 * beantwortete Frage bleibt unverändert (kein Nachbessern, doppelte Klicks harmlos).
 * Für die Streak zählt nur das Beantworten, nicht die Punktzahl (SPEC › Quiz).
 */
export function applyAnswer(
  answers: QuizAnswer[],
  quiz: Pick<QuizQuestion, "correct_index">[],
  question: number,
  choice: number,
): QuizState | { error: string } {
  if (answers.some((a) => a.question === question)) return quizState(answers, quiz.length);
  if (!Number.isInteger(question) || question < 0 || question >= quiz.length) {
    return { error: "Unbekannte Frage" };
  }
  if (question !== answers.length) return { error: "Bitte die Fragen der Reihe nach beantworten." };
  if (!Number.isInteger(choice) || choice < 0 || choice > 3) return { error: "Ungültige Antwort" };

  const next = [...answers, { question, choice, correct: choice === quiz[question].correct_index }];
  return quizState(next, quiz.length);
}
