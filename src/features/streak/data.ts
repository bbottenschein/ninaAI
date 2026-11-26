import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { dayOutcome, pendingDates, type DayOutcome, type StreakState } from "./evaluate";

type StreakRow = {
  user_id: string;
  current_streak: number;
  longest_streak: number;
  jokers_available: number;
  run_started_on: string | null;
  last_completed_date: string | null;
  last_evaluated_date: string | null;
  joker_used_on: string | null;
  joker_notice_seen: boolean;
};

export const STREAK_COLUMNS =
  "user_id, current_streak, longest_streak, jokers_available, run_started_on, last_completed_date, last_evaluated_date, joker_used_on, joker_notice_seen";

export function toState(row: StreakRow): StreakState {
  return {
    current: row.current_streak,
    longest: row.longest_streak,
    jokers: row.jokers_available,
    runStartedOn: row.run_started_on,
    lastCompletedDate: row.last_completed_date,
    lastEvaluatedDate: row.last_evaluated_date,
    jokerUsedOn: row.joker_used_on,
    jokerNoticeSeen: row.joker_notice_seen,
  };
}

export function toRow(state: StreakState) {
  return {
    current_streak: state.current,
    longest_streak: state.longest,
    jokers_available: state.jokers,
    run_started_on: state.runStartedOn,
    last_completed_date: state.lastCompletedDate,
    last_evaluated_date: state.lastEvaluatedDate,
    joker_used_on: state.jokerUsedOn,
    joker_notice_seen: state.jokerNoticeSeen,
    updated_at: new Date().toISOString(),
  };
}

/** Ausgang aller noch nicht ausgewerteten Tage bis einschließlich `until`. */
export async function loadOutcomes(
  supabase: SupabaseClient,
  userId: string,
  lastEvaluatedDate: string | null,
  until: string,
): Promise<{ date: string; outcome: DayOutcome }[]> {
  const dates = pendingDates(lastEvaluatedDate, until);
  if (dates.length === 0) return [];
  const from = dates[0];

  const [{ data: lessons, error: lessonError }, { data: progress, error: progressError }] = await Promise.all([
    supabase.from("daily_lessons").select("date, status").gte("date", from).lte("date", until),
    supabase
      .from("lesson_progress")
      .select("date, completed_at")
      .eq("user_id", userId)
      .gte("date", from)
      .lte("date", until),
  ]);
  if (lessonError) throw lessonError;
  if (progressError) throw progressError;

  const ready = new Set((lessons ?? []).filter((l) => l.status === "ready").map((l) => l.date as string));
  const completed = new Set((progress ?? []).filter((p) => p.completed_at).map((p) => p.date as string));
  return dates.map((date) => ({ date, outcome: dayOutcome(ready.has(date), completed.has(date)) }));
}
