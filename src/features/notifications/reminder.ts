/** Erinnerung ab 19:00 Uhr (SPEC › Geplante Jobs). Später nachgeholt, aber nicht nach 22 Uhr. */
export const REMINDER_FROM_HOUR = 19;
export const REMINDER_UNTIL_HOUR = 22;

/** Soll die Spielerin jetzt an die Tageslektion erinnert werden? */
export function shouldRemind(input: { hour: number; lessonReady: boolean; dayComplete: boolean }): boolean {
  return (
    input.hour >= REMINDER_FROM_HOUR &&
    input.hour < REMINDER_UNTIL_HOUR &&
    input.lessonReady &&
    !input.dayComplete
  );
}

/** Freundlicher Text, passend zum Fortschritt. */
export function reminderText(progress: { newsRead: number; quizDone: boolean; streak: number }): {
  title: string;
  body: string;
} {
  const streakHint = progress.streak > 0 ? ` Deine ${progress.streak}-Tage-Streak wartet 🔥` : "";
  if (progress.quizDone) {
    return { title: "Fast geschafft! 🐭", body: `Nur noch das kurze Tutor-Gespräch.${streakHint}` };
  }
  if (progress.newsRead > 0) {
    return { title: "Weiter geht's! 🐭", body: `Deine Tageslektion ist schon angefangen.${streakHint}` };
  }
  return { title: "Deine 10 Minuten warten 🐭", body: `3 News, ein Quiz und ein kurzes Gespräch.${streakHint}` };
}
