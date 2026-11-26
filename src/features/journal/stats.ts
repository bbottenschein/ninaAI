import { addDays, weekday } from "@/lib/date";

export type Rated = { date: string; rating: number };

/** Montag der Woche, in der `date` liegt. */
export function mondayOf(date: string): string {
  return addDays(date, -((weekday(date) + 6) % 7));
}

/** Die 7 Tage (Mo–So) der Woche um `anchor`. */
export function weekDates(anchor: string): string[] {
  const monday = mondayOf(anchor);
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

export function average(items: Rated[]): number | null {
  if (items.length === 0) return null;
  return Math.round((items.reduce((s, x) => s + x.rating, 0) / items.length) * 10) / 10;
}

/** Bester Tag (bei Gleichstand der jüngste). */
export function bestDay(items: Rated[]): Rated | null {
  return items.reduce<Rated | null>(
    (best, x) => (!best || x.rating > best.rating || (x.rating === best.rating && x.date > best.date) ? x : best),
    null,
  );
}

export function inRange(items: Rated[], from: string, to: string): Rated[] {
  return items.filter((x) => x.date >= from && x.date <= to);
}

/** Kalender eines Monats: Wochen ab Montag, leere Felder vor dem 1. als null. */
export function monthGrid(year: number, month: number): (string | null)[][] {
  const first = `${year}-${String(month).padStart(2, "0")}-01`;
  const days = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const cells: (string | null)[] = Array((weekday(first) + 6) % 7).fill(null);
  for (let d = 1; d <= days; d++) cells.push(`${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
  while (cells.length % 7) cells.push(null);
  return Array.from({ length: cells.length / 7 }, (_, i) => cells.slice(i * 7, i * 7 + 7));
}

export function monthRange(year: number, month: number): [string, string] {
  const days = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const m = String(month).padStart(2, "0");
  return [`${year}-${m}-01`, `${year}-${m}-${String(days).padStart(2, "0")}`];
}

/** Monatsdurchschnitte eines Jahres (null = keine Einträge). */
export function yearAverages(items: Rated[], year: number): (number | null)[] {
  return Array.from({ length: 12 }, (_, i) => {
    const [from, to] = monthRange(year, i + 1);
    return average(inRange(items, from, to));
  });
}

/** Rosaton für eine Bewertung: 5 Stufen von zart bis kräftig. */
export function ratingTone(rating: number): number {
  return Math.min(4, Math.max(0, Math.floor((rating - 1) / 2)));
}
