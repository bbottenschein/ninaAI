import { addDays } from "@/lib/date";
import { rewardsAt, type RewardType } from "@/features/rewards/milestones";

/** Ergebnis eines Tages, wie er sich aus Lektion und Fortschritt ergibt. */
export type DayOutcome = "completed" | "missed" | "no_lesson";

/** Was in streak_days gespeichert wird. */
export type DayResult = "completed" | "joker" | "missed" | "no_lesson";

export type StreakState = {
  current: number;
  longest: number;
  jokers: number; // 0 oder 1
  runStartedOn: string | null;
  lastCompletedDate: string | null;
  lastEvaluatedDate: string | null;
  jokerUsedOn: string | null;
  jokerNoticeSeen: boolean;
};

export type EvaluatedDay = { date: string; result: DayResult; streakAfter: number };
export type EarnedReward = { type: RewardType; milestoneDay: number; runStartedOn: string; date: string };

export const JOKER_EVERY = 10;
export const MAX_JOKERS = 1;

export const EMPTY_STREAK: StreakState = {
  current: 0,
  longest: 0,
  jokers: 0,
  runStartedOn: null,
  lastCompletedDate: null,
  lastEvaluatedDate: null,
  jokerUsedOn: null,
  jokerNoticeSeen: true,
};

/**
 * Wertet Tage in zeitlicher Reihenfolge aus (SPEC › Streak, Joker & Pathway):
 * - absolviert: Streak +1. Bei 10, 20, 30 … gibt es einen Joker (höchstens 1).
 *   An Meilensteinen werden Gutscheine verdient – gebunden an die Streak-Runde.
 * - verpasst mit Joker: Joker wird verbraucht, Streak bleibt.
 * - verpasst ohne Joker: Streak fällt auf 0, die Runde endet.
 * - ohne Lektion (technischer Ausfall): neutral.
 */
export function evaluateDays(
  start: StreakState,
  days: { date: string; outcome: DayOutcome }[],
): { state: StreakState; days: EvaluatedDay[]; rewards: EarnedReward[] } {
  const state = { ...start };
  const evaluated: EvaluatedDay[] = [];
  const rewards: EarnedReward[] = [];

  for (const { date, outcome } of [...days].sort((a, b) => a.date.localeCompare(b.date))) {
    if (state.lastEvaluatedDate && date <= state.lastEvaluatedDate) continue; // schon ausgewertet

    let result: DayResult;
    if (outcome === "completed") {
      if (state.current === 0) state.runStartedOn = date;
      state.current += 1;
      state.longest = Math.max(state.longest, state.current);
      state.lastCompletedDate = date;
      if (state.current % JOKER_EVERY === 0) state.jokers = Math.min(MAX_JOKERS, state.jokers + 1);
      for (const type of rewardsAt(state.current)) {
        rewards.push({ type, milestoneDay: state.current, runStartedOn: state.runStartedOn!, date });
      }
      result = "completed";
    } else if (outcome === "missed") {
      if (state.jokers > 0) {
        state.jokers -= 1;
        state.jokerUsedOn = date;
        state.jokerNoticeSeen = false;
        result = "joker";
      } else {
        state.current = 0;
        state.runStartedOn = null;
        result = "missed";
      }
    } else {
      result = "no_lesson";
    }

    state.lastEvaluatedDate = date;
    evaluated.push({ date, result, streakAfter: state.current });
  }

  return { state, days: evaluated, rewards };
}

/** Alle Tage von nach `lastEvaluatedDate` bis einschließlich `until`. */
export function pendingDates(lastEvaluatedDate: string | null, until: string): string[] {
  const dates: string[] = [];
  let date = lastEvaluatedDate ? addDays(lastEvaluatedDate, 1) : until;
  while (date <= until) {
    dates.push(date);
    date = addDays(date, 1);
  }
  return dates;
}

/**
 * Wie ein Tag ausgegangen ist. Eine Lektion, die nicht fertig wurde, macht den
 * Tag neutral; eine fertige Lektion ohne Abschluss zählt als verpasst.
 */
export function dayOutcome(lessonReady: boolean, completed: boolean): DayOutcome {
  if (completed) return "completed";
  return lessonReady ? "missed" : "no_lesson";
}
