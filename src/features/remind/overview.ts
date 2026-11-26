import { berlinParts } from "@/lib/date";
import { areasForHome, isWeekend, type Area } from "./logic";

/** Tagesüberblick um 07:30; ein ausgefallener Lauf wird bis 08:59 nachgeholt. */
export const OVERVIEW_TIME = "07:30";
export const OVERVIEW_UNTIL = "09:00";

export function isOverviewTime(now: Date): boolean {
  const { time } = berlinParts(now);
  return time >= OVERVIEW_TIME && time < OVERVIEW_UNTIL;
}

/**
 * Text des Tagesüberblicks, z. B. „Heute: 3 Aufgaben, 1 überfällig“.
 * Am Wochenende zählen nur Life-Mode-Aufgaben. Ohne Aufgaben: kein Push (null).
 */
export function overviewPush(
  todos: { due_date: string | null; area: Area }[],
  today: string,
): { title: string; body: string } | null {
  const areas = areasForHome(today);
  const relevant = todos.filter((t) => t.due_date && t.due_date <= today && areas.includes(t.area));
  if (relevant.length === 0) return null;

  const overdue = relevant.filter((t) => t.due_date! < today).length;
  const count = relevant.length;
  const parts = [`${count} ${count === 1 ? "Aufgabe" : "Aufgaben"}`];
  if (overdue > 0) parts.push(`${overdue} überfällig`);
  return {
    title: isWeekend(today) ? "🌿 Dein Wochenende" : "☀️ Guten Morgen",
    body: `Heute: ${parts.join(", ")}`,
  };
}
