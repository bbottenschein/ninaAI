import { addDays, berlinParts, berlinToUtc, weekday } from "@/lib/date";
import { DEFAULT_REMIND_TIME, reminderChoiceOf, remindAtFor, type Area, type Todo } from "./logic";
import { parseRepeat } from "./repeat";

// ---------------------------------------------------------------------------
// Wiederholung: nächste Instanz beim Abhaken (SPEC-remind-me › Logik)
// ---------------------------------------------------------------------------

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate(); // month: 1–12
}

/** Nächstes Fälligkeitsdatum nach `from` gemäß Regel, oder null ohne gültige Regel. */
export function nextOccurrence(rule: string | null, from: string): string | null {
  const repeat = parseRepeat(rule);
  if (!repeat) return null;
  const [y, m, d] = from.split("-").map(Number);

  switch (repeat.freq) {
    case "DAILY":
      return addDays(from, 1);
    case "WEEKLY": {
      if (repeat.byDay.length === 0) return addDays(from, 7);
      for (let i = 1; i <= 7; i++) {
        const date = addDays(from, i);
        if (repeat.byDay.includes(weekday(date))) return date;
      }
      return addDays(from, 7);
    }
    case "MONTHLY": {
      // Gleicher Tag im nächsten Monat; am 31. → letzter Tag des kürzeren Monats.
      const year = m === 12 ? y + 1 : y;
      const month = m === 12 ? 1 : m + 1;
      const day = Math.min(d, daysInMonth(year, month));
      return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }
    case "YEARLY": {
      const day = Math.min(d, daysInMonth(y + 1, m)); // 29.02. → 28.02.
      return `${y + 1}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }
  }
}

export type NextInstance = Pick<Todo, "due_date" | "remind_at">;

/**
 * Die nächste Instanz einer wiederkehrenden Aufgabe: neues Fälligkeitsdatum und
 * eine Erinnerung im selben Abstand zur Fälligkeit wie bisher.
 * Ohne Fälligkeit zählt „heute“ als Ausgangspunkt.
 */
export function nextInstance(
  todo: Pick<Todo, "due_date" | "due_time" | "remind_at" | "repeat_rule">,
  today: string,
): NextInstance | null {
  const base = todo.due_date ?? today;
  let due = nextOccurrence(todo.repeat_rule, base);
  if (!due) return null;
  // Lag die Aufgabe lange zurück, nicht in der Vergangenheit weiterwiederholen.
  while (due < today) due = nextOccurrence(todo.repeat_rule, due)!;

  const choice = reminderChoiceOf(todo);
  if (choice.kind === "custom" && todo.remind_at) {
    const { date, time } = berlinParts(new Date(todo.remind_at));
    const shift = daysBetween(base, due);
    return { due_date: due, remind_at: berlinToUtc(addDays(date, shift), time).toISOString() };
  }
  return { due_date: due, remind_at: remindAtFor({ date: due, time: todo.due_time }, choice) };
}

function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);
}

// ---------------------------------------------------------------------------
// „Später“ (Snooze)
// ---------------------------------------------------------------------------

export type SnoozeOption = "hour" | "evening" | "tomorrow";

export const EVENING_TIME = "19:00";

/** Zeitpunkt für „Später“: in 1 Stunde, heute Abend (19:00) oder morgen früh (09:00). */
export function snoozeUntil(option: SnoozeOption, now: Date): Date {
  const { date, time } = berlinParts(now);
  if (option === "hour") return new Date(now.getTime() + 60 * 60 * 1000);
  if (option === "evening") {
    // Ist es schon (fast) Abend, wird daraus morgen Abend.
    return time < "18:30" ? berlinToUtc(date, EVENING_TIME) : berlinToUtc(addDays(date, 1), EVENING_TIME);
  }
  return berlinToUtc(addDays(date, 1), DEFAULT_REMIND_TIME);
}

/** Beschriftung der Später-Knöpfe, passend zur Uhrzeit. */
export function snoozeLabel(option: SnoozeOption, now: Date): string {
  if (option === "hour") return "In 1 Stunde";
  if (option === "tomorrow") return "Morgen früh";
  return berlinParts(now).time < "18:30" ? "Heute Abend" : "Morgen Abend";
}

// ---------------------------------------------------------------------------
// Erinnerungs-Job: was jetzt verschickt wird (SPEC-remind-me › Jobs)
// ---------------------------------------------------------------------------

export type DueReminder = {
  id: string;
  owner_id: string;
  title: string;
  area: Area;
  remind_at: string | null;
  snoozed_until: string | null;
};

/** Montag 08:00 – Ziel für Work-Erinnerungen am Wochenende. */
export const WORK_WEEKEND_TIME = "08:00";
/** Ältere Erinnerungen (z. B. nachträglich für gestern angelegt) werden still übersprungen. */
export const STALE_AFTER_MS = 6 * 60 * 60 * 1000;

export type ReminderPlan = {
  /** Pro Besitzerin: zu verschickende Erinnerungen (mehrere = ein gemeinsamer Push). */
  send: Map<string, DueReminder[]>;
  /** Work-Erinnerungen vom Wochenende: auf Montag 08:00 verschieben. */
  defer: { id: string; until: string }[];
  /** Veraltet: als verschickt markieren, ohne Push. */
  skip: string[];
};

export function effectiveTime(r: Pick<DueReminder, "remind_at" | "snoozed_until">): string | null {
  return r.snoozed_until ?? r.remind_at;
}

/**
 * Teilt fällige Erinnerungen auf: verschicken, aufs Wochenende-Ende verschieben
 * (Work Mode, SPEC-remind-me › Benachrichtigungen) oder als veraltet überspringen.
 */
export function planReminders(due: DueReminder[], now: Date): ReminderPlan {
  const plan: ReminderPlan = { send: new Map(), defer: [], skip: [] };
  const today = berlinParts(now).date;
  const day = weekday(today);

  for (const r of due) {
    const at = effectiveTime(r);
    if (!at || Date.parse(at) > now.getTime()) continue;

    if (r.area === "work" && (day === 6 || day === 0)) {
      const monday = addDays(today, day === 6 ? 2 : 1);
      plan.defer.push({ id: r.id, until: berlinToUtc(monday, WORK_WEEKEND_TIME).toISOString() });
      continue;
    }
    if (now.getTime() - Date.parse(at) > STALE_AFTER_MS) {
      plan.skip.push(r.id);
      continue;
    }
    plan.send.set(r.owner_id, [...(plan.send.get(r.owner_id) ?? []), r]);
  }
  return plan;
}

/** Text des Pushs: eine Aufgabe einzeln, mehrere zusammengefasst. */
export function reminderPush(reminders: Pick<DueReminder, "id" | "title" | "area">[]): {
  title: string;
  body: string;
  url: string;
  tag: string;
} {
  if (reminders.length === 1) {
    const [r] = reminders;
    return {
      title: r.area === "work" ? "💼 Erinnerung" : "🌸 Erinnerung",
      body: r.title,
      url: `/remind?todo=${r.id}`,
      tag: `todo-${r.id}`,
    };
  }
  const titles = reminders.map((r) => r.title);
  const shown = titles.slice(0, 3).join(", ") + (titles.length > 3 ? ` und ${titles.length - 3} weitere` : "");
  return { title: `🔔 ${reminders.length} Erinnerungen`, body: shown, url: "/remind", tag: "todo-group" };
}
