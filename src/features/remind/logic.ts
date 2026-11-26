import { addDays, berlinParts, berlinToUtc, weekday } from "@/lib/date";

export type Area = "work" | "life";
export type AreaFilter = "all" | Area;

export type TodoList = { id: string; area: Area; name: string; sort_order: number };

export type Todo = {
  id: string;
  list_id: string;
  title: string;
  note: string;
  due_date: string | null;
  due_time: string | null; // "HH:mm" oder "HH:mm:ss"
  remind_at: string | null;
  repeat_rule: string | null;
  priority: boolean;
  completed_at: string | null;
  snoozed_until: string | null;
  created_at: string;
};

export const AREA_LABEL: Record<Area, string> = { work: "Work Mode", life: "Life Mode" };

/** Standard-Uhrzeit für Erinnerungen ohne Uhrzeit (SPEC › Standardzeiten). */
export const DEFAULT_REMIND_TIME = "09:00";

export type Bucket = "overdue" | "today" | "tomorrow" | "week" | "later" | "none";

/** In welche Gruppe eine offene Aufgabe gehört (Heute / Geplant). */
export function bucketOf(dueDate: string | null, today: string): Bucket {
  if (!dueDate) return "none";
  if (dueDate < today) return "overdue";
  if (dueDate === today) return "today";
  if (dueDate === addDays(today, 1)) return "tomorrow";
  // „Diese Woche“ = bis einschließlich Sonntag der laufenden Woche.
  const daysToSunday = (7 - weekday(today)) % 7;
  if (dueDate <= addDays(today, daysToSunday)) return "week";
  return "later";
}

export function isWeekend(date: string): boolean {
  const d = weekday(date);
  return d === 0 || d === 6;
}

/** Home zeigt am Wochenende nur Life Mode, unter der Woche beide Bereiche. */
export function areasForHome(today: string): Area[] {
  return isWeekend(today) ? ["life"] : ["work", "life"];
}

/** Sortierung: wichtig zuerst, dann nach Fälligkeit (ohne Uhrzeit = ganztägig vorne), dann Anlage. */
export function compareTodos(a: Todo, b: Todo): number {
  if (a.priority !== b.priority) return a.priority ? -1 : 1;
  const ad = `${a.due_date ?? "9999-99-99"} ${a.due_time ?? "00:00"}`;
  const bd = `${b.due_date ?? "9999-99-99"} ${b.due_time ?? "00:00"}`;
  if (ad !== bd) return ad < bd ? -1 : 1;
  return a.created_at.localeCompare(b.created_at);
}

// ---------------------------------------------------------------------------
// Erinnerung
// ---------------------------------------------------------------------------

export type ReminderChoice =
  | { kind: "none" }
  | { kind: "due" } // zur Fälligkeit
  | { kind: "day_before" } // 1 Tag vorher
  | { kind: "custom"; date: string; time: string }; // eigene Zeit (Berlin)

/** Erinnerungszeitpunkt (UTC, ISO) aus Fälligkeit und Auswahl auf der Karte. */
export function remindAtFor(
  due: { date: string | null; time: string | null },
  choice: ReminderChoice,
): string | null {
  if (choice.kind === "none") return null;
  if (choice.kind === "custom") return berlinToUtc(choice.date, choice.time).toISOString();
  if (!due.date) return null;
  const time = due.time?.slice(0, 5) || DEFAULT_REMIND_TIME;
  const date = choice.kind === "day_before" ? addDays(due.date, -1) : due.date;
  return berlinToUtc(date, time).toISOString();
}

/** Welche Auswahl auf der Karte zu einer gespeicherten Erinnerung passt. */
export function reminderChoiceOf(todo: Pick<Todo, "due_date" | "due_time" | "remind_at">): ReminderChoice {
  if (!todo.remind_at) return { kind: "none" };
  const due = { date: todo.due_date, time: todo.due_time };
  for (const kind of ["due", "day_before"] as const) {
    const at = remindAtFor(due, { kind });
    if (at && Date.parse(at) === Date.parse(todo.remind_at)) return { kind };
  }
  const { date, time } = berlinParts(new Date(todo.remind_at));
  return { kind: "custom", date, time };
}

/**
 * Auf morgen verschieben (Wischen nach rechts): Fälligkeit wird morgen, eine
 * Erinnerung wandert relativ mit (zur Fälligkeit bleibt zur Fälligkeit usw.).
 */
export function postponeToTomorrow(
  todo: Pick<Todo, "due_date" | "due_time" | "remind_at">,
  today: string,
): { due_date: string; remind_at: string | null } {
  const tomorrow = addDays(today, 1);
  const choice = reminderChoiceOf(todo);
  if (choice.kind === "custom" && todo.remind_at) {
    // Eigene Zeit: um so viele Tage verschieben wie die Fälligkeit.
    const shift = todo.due_date ? daysBetween(todo.due_date, tomorrow) : 1;
    const { date, time } = berlinParts(new Date(todo.remind_at));
    return { due_date: tomorrow, remind_at: berlinToUtc(addDays(date, shift), time).toISOString() };
  }
  return { due_date: tomorrow, remind_at: remindAtFor({ date: tomorrow, time: todo.due_time }, choice) };
}

function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);
}
