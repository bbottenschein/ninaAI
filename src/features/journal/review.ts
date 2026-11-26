import { addDays, berlinParts } from "@/lib/date";
import { average, bestDay, type Rated } from "./stats";

/** Monthly Review ab dem Monatsersten um 07:00 (SPEC-journal › Jobs). */
export const REVIEW_TIME = "07:00";

/** Der Vormonat zu einem Datum: Monatserster (für journal_reviews.month) und Zeitraum. */
export function previousMonth(date: string): { month: string; from: string; to: string } {
  const firstOfThis = `${date.slice(0, 7)}-01`;
  const to = addDays(firstOfThis, -1);
  const from = `${to.slice(0, 7)}-01`;
  return { month: from, from, to };
}

/**
 * Soll jetzt der Rückblick für den Vormonat erzeugt werden? Ab dem 1. um 07:00,
 * und nur, wenn es im Vormonat Einträge gibt und noch keinen Rückblick.
 */
export function shouldCreateReview(now: Date, hasReview: boolean, entryCount: number): boolean {
  if (hasReview || entryCount === 0) return false;
  const { date, time } = berlinParts(now);
  return date.slice(8) !== "01" || time >= REVIEW_TIME;
}

export type ReviewStats = { average: number | null; best: Rated | null; days: number };

export function reviewStats(items: Rated[]): ReviewStats {
  return { average: average(items), best: bestDay(items), days: items.length };
}

const MONTHS_EN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export function monthNameEn(month: string): string {
  return `${MONTHS_EN[Number(month.slice(5, 7)) - 1]} ${month.slice(0, 4)}`;
}
