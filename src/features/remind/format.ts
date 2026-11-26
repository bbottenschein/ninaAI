import { addDays, berlinParts, weekday } from "@/lib/date";
import { WEEKDAY_SHORT } from "./repeat";
import type { Area } from "./logic";

export const AREA_STYLE: Record<Area, { chip: string; dot: string; label: string; short: string }> = {
  work: { chip: "bg-work-soft text-work", dot: "bg-work-dot", label: "Work Mode", short: "Work" },
  life: { chip: "bg-life-soft text-life", dot: "bg-life-dot", label: "Life Mode", short: "Life" },
};

/** Fälligkeit kurz, z. B. „Heute 15:00“, „Morgen“, „Fr 28.11.“, „Gestern“. */
export function dueLabel(date: string | null, time: string | null, today: string): string | null {
  if (!date) return null;
  const t = time ? ` ${time.slice(0, 5)}` : "";
  if (date === today) return `Heute${t}`;
  if (date === addDays(today, 1)) return `Morgen${t}`;
  if (date === addDays(today, -1)) return `Gestern${t}`;
  const [y, m, d] = date.split("-");
  const year = y === today.slice(0, 4) ? "" : y.slice(2);
  return `${WEEKDAY_SHORT[weekday(date)]} ${Number(d)}.${Number(m)}.${year}${t}`;
}

/** Erinnerung kurz, z. B. „Do 19:00“. */
export function reminderLabel(remindAt: string | null, today: string): string | null {
  if (!remindAt) return null;
  const { date, time } = berlinParts(new Date(remindAt));
  return dueLabel(date, time, today);
}
