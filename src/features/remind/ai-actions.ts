"use server";

import { askStructured } from "@/lib/claude";
import { addDays, berlinParts, weekday } from "@/lib/date";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/features/auth/session";
import { normalizeOperations, type Proposal } from "./ai-normalize";
import { AiResultSchema } from "./ai-schema";
import { reminderChoiceOf, type Todo, type TodoList } from "./logic";

const WEEKDAYS = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];
const MAX_INPUT = 500;

const SYSTEM = `You turn a short sentence (German or English, typed or spoken) into to-do operations for "Remind me", the private task list of Nina in the app NinAI.

Areas:
- "work": everything about her job (client/Kunde, meeting, boss/Chef, colleagues, presentation, deadline, follow-up, office). Work tasks always go to the single list "Job" (list_name = null).
- "life": everything private (shopping, household, appointments like dentist, family, gifts, sports). Use one of her life lists if it fits (e.g. groceries → "Einkauf", cleaning/laundry/trash → "Haushalt"), otherwise list_name = null (= "Allgemein").

Dates and times (timezone Europe/Berlin). Use the calendar given in the input to resolve weekdays and relative dates.
- A weekday ("Freitag") means the next such day from today; if today is that weekday, it means today.
- "morgen" = tomorrow, "übermorgen" = in 2 days, "nächste Woche" without a day = next Monday.
- Default times: "Abend"/"abends" = 19:00, "morgen früh"/"früh" = 08:00, "mittags" = 12:00, "nachmittags" = 15:00.
- No time mentioned → all-day: due_time = null.

Reminders:
- If Nina says when to remind her ("erinner mich Donnerstag Abend") → reminder = "custom" with reminder_date/reminder_time.
- "einen Tag vorher" → "day_before". "zur Fälligkeit"/"wenn es so weit ist" → "due".
- Otherwise: a task with a due date gets reminder = "due" (an all-day task is then reminded at 09:00); a task without date gets reminder = "none".

Repetition: "jeden Montag" → FREQ=WEEKLY;BYDAY=MO and due_date = the next Monday. "täglich" → FREQ=DAILY, "monatlich" → FREQ=MONTHLY, "jährlich"/"jedes Jahr" → FREQ=YEARLY. Several weekdays → FREQ=WEEKLY;BYDAY=MO,WE.
Priority: true only if she says it is important/urgent/wichtig/dringend.

Several tasks in one sentence → one create operation each. A list of items to buy ("Milch, Eier und Brot") → one create per item in "Einkauf", titles just the item ("Milch").

Changes to existing tasks: the input lists her open tasks with ids. If the sentence asks to move/rename/change/delete/complete existing tasks ("Schieb Zahnarzt um einen Tag", "Alles Überfällige auf morgen", "Milch ist erledigt"), output one operation per affected task with action "update", "delete" or "complete" and target_id.
- For "update", output the COMPLETE resulting task: copy all fields that do not change from the existing task. When moving a task, move its reminder by the same amount (a custom reminder Thursday 19:00 for a Friday task becomes Friday 19:00 when the task moves to Saturday).
- If a focused task is given, the sentence refers to that task.
- If it is unclear which task is meant (several plausible matches), set target_id = null and list all matches in candidate_ids.

Titles: short, in Nina's language, without the date/time words ("Zahnarzt", not "Zahnarzt Freitag 15 Uhr"). Put extra details (place, person) into note only if she mentions them.
Never invent tasks she did not ask for. If the sentence contains nothing actionable, return an empty operations list.`;

function describeTodo(t: Todo, lists: Map<string, TodoList>): string {
  const list = lists.get(t.list_id);
  const reminder = reminderChoiceOf(t);
  const reminderText =
    reminder.kind === "custom" ? `custom ${reminder.date} ${reminder.time}` : reminder.kind;
  return [
    `id=${t.id}`,
    `title="${t.title}"`,
    `area=${list?.area ?? "life"}`,
    `list=${list?.name ?? "?"}`,
    `due=${t.due_date ?? "none"}${t.due_time ? ` ${t.due_time.slice(0, 5)}` : ""}`,
    `reminder=${reminderText}`,
    t.repeat_rule ? `repeat=${t.repeat_rule}` : "",
    t.priority ? "priority" : "",
    t.note ? `note="${t.note.slice(0, 80)}"` : "",
  ]
    .filter(Boolean)
    .join(" | ");
}

export type InterpretResult = { proposals: Proposal[] } | { error: string; fallbackTitle: string };

/**
 * KI-Schnelleingabe (SPEC-remind-me › Eingabe): Satz → Vorschläge für die Karte.
 * Bei jedem Fehler bekommt die App den Text zurück und öffnet die leere Karte.
 */
export async function interpretTodoInput(input: { text: string; focusId?: string | null }): Promise<InterpretResult> {
  const text = input.text.trim().slice(0, MAX_INPUT);
  const fallbackTitle = text.slice(0, 200);
  const user = await getCurrentUser();
  if (user.role !== "player") return { error: "Nur für die Spielerin", fallbackTitle };
  if (!text) return { error: "Bitte etwas eingeben.", fallbackTitle };

  try {
    const supabase = await createClient();
    const [{ data: listRows }, { data: todoRows }] = await Promise.all([
      supabase.from("todo_lists").select("id, area, name, sort_order").order("sort_order"),
      supabase
        .from("todos")
        .select("id, list_id, title, note, due_date, due_time, remind_at, repeat_rule, priority, completed_at, snoozed_until, created_at")
        .is("completed_at", null)
        .order("due_date", { ascending: true, nullsFirst: false })
        .limit(150),
    ]);
    const lists = (listRows ?? []) as TodoList[];
    const todos = (todoRows ?? []) as Todo[];
    const listById = new Map(lists.map((l) => [l.id, l]));

    const now = berlinParts(new Date());
    const calendar = Array.from({ length: 15 }, (_, i) => {
      const date = addDays(now.date, i);
      const label = i === 0 ? " (heute)" : i === 1 ? " (morgen)" : "";
      return `${WEEKDAYS[weekday(date)]} ${date}${label}`;
    });
    const focus = input.focusId ? todos.find((t) => t.id === input.focusId) : undefined;

    const prompt = [
      `<now>${WEEKDAYS[weekday(now.date)]}, ${now.date}, ${now.time} Uhr (Europe/Berlin)</now>`,
      `<calendar>\n${calendar.join("\n")}\n</calendar>`,
      `<life_lists>${lists.filter((l) => l.area === "life").map((l) => l.name).join(", ")}</life_lists>`,
      `<open_tasks>\n${todos.map((t) => describeTodo(t, listById)).join("\n") || "(keine)"}\n</open_tasks>`,
      focus ? `<focused_task>${describeTodo(focus, listById)}</focused_task>` : "",
      `<sentence>${text}</sentence>`,
    ]
      .filter(Boolean)
      .join("\n\n");

    const result = await askStructured({
      schema: AiResultSchema,
      system: SYSTEM,
      prompt,
      effort: "low",
      maxTokens: 6000,
    });

    const proposals = normalizeOperations(result.operations, { lists, todos });
    if (proposals.length === 0) {
      return { error: "Daraus konnte ich keine Aufgabe machen – trag sie einfach selbst ein.", fallbackTitle };
    }
    return { proposals };
  } catch (error) {
    console.error("[remind] KI-Eingabe", error);
    return { error: "Die KI ist gerade nicht erreichbar – trag die Aufgabe einfach selbst ein.", fallbackTitle };
  }
}
