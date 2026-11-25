export type StepKey = "news" | "quiz" | "tutor";

export type ProgressFlags = {
  newsRead: number;
  quizDone: boolean;
  tutorDone: boolean;
};

export type StepState = "done" | "open" | "locked";

export const STEPS: { key: StepKey; title: string; description: string }[] = [
  { key: "news", title: "News des Tages", description: "3 Meldungen lesen" },
  { key: "quiz", title: "Quiz of the Day", description: "4 Fragen beantworten" },
  { key: "tutor", title: "Tutor-Gespräch", description: "ca. 2 Minuten sprechen" },
];

/** Schritte werden nacheinander freigeschaltet (SPEC › Tagesablauf). */
export function stepStates(p: ProgressFlags): Record<StepKey, StepState> {
  const newsDone = p.newsRead >= 3;
  const quizDone = newsDone && p.quizDone;
  const tutorDone = quizDone && p.tutorDone;
  return {
    news: newsDone ? "done" : "open",
    quiz: quizDone ? "done" : newsDone ? "open" : "locked",
    tutor: tutorDone ? "done" : quizDone ? "open" : "locked",
  };
}

export function isDayComplete(p: ProgressFlags): boolean {
  return stepStates(p).tutor === "done";
}
