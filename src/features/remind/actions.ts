"use server";

import { revalidatePath } from "next/cache";
import { berlinDate } from "@/lib/date";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/features/auth/session";
import { postponeToTomorrow, remindAtFor, type Area, type ReminderChoice } from "./logic";
import { buildRepeat, parseRepeat } from "./repeat";
import { nextInstance, snoozeUntil, type SnoozeOption } from "./schedule";

export type TodoInput = {
  id?: string;
  title: string;
  area: Area;
  listId?: string | null;
  note: string;
  dueDate: string | null;
  dueTime: string | null;
  reminder: ReminderChoice;
  repeatRule: string | null;
  priority: boolean;
  createdVia?: "form" | "ai_text" | "ai_voice";
};

type Result = { error?: string };

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^\d{2}:\d{2}(:\d{2})?$/;

function refresh() {
  revalidatePath("/", "layout");
}

/** „Remind me“ ist privat und nur für die Spielerin. */
async function player() {
  const user = await getCurrentUser();
  if (user.role !== "player") throw new Error("Nur für die Spielerin");
  return { user, supabase: await createClient() };
}

/** Legt eine Aufgabe an oder speichert die Korrektur-Karte. */
export async function saveTodo(input: TodoInput): Promise<Result> {
  const { user, supabase } = await player();

  const title = input.title.trim();
  if (!title) return { error: "Bitte einen Titel eingeben." };
  if (title.length > 200 || input.note.length > 2000) return { error: "Der Text ist zu lang." };
  const dueDate = input.dueDate && DATE.test(input.dueDate) ? input.dueDate : null;
  const dueTime = dueDate && input.dueTime && TIME.test(input.dueTime) ? input.dueTime.slice(0, 5) : null;
  if (input.reminder.kind === "custom" && !(DATE.test(input.reminder.date) && TIME.test(input.reminder.time))) {
    return { error: "Bitte Datum und Uhrzeit der Erinnerung wählen." };
  }

  // Liste: Work Mode immer „Job“, Life Mode die gewählte (Standard „Allgemein“).
  const { data: lists } = await supabase.from("todo_lists").select("id, area, name, sort_order").order("sort_order");
  const areaLists = (lists ?? []).filter((l) => l.area === input.area);
  const list = areaLists.find((l) => l.id === input.listId) ?? areaLists.find((l) => l.name === "Allgemein") ?? areaLists[0];
  if (!list) return { error: "Keine passende Liste gefunden." };

  const remindAt = remindAtFor({ date: dueDate, time: dueTime }, input.reminder);
  const row = {
    list_id: list.id,
    title,
    note: input.note.trim(),
    due_date: dueDate,
    due_time: dueTime,
    remind_at: remindAt,
    repeat_rule: buildRepeat(parseRepeat(input.repeatRule)),
    priority: input.priority,
    updated_at: new Date().toISOString(),
  };

  if (input.id) {
    const { data: before } = await supabase.from("todos").select("remind_at").eq("id", input.id).maybeSingle();
    const reminderChanged = before?.remind_at !== remindAt && Date.parse(before?.remind_at ?? "") !== Date.parse(remindAt ?? "");
    const { error } = await supabase
      .from("todos")
      .update({ ...row, ...(reminderChanged ? { reminder_sent_at: null, snoozed_until: null } : {}) })
      .eq("id", input.id);
    if (error) return { error: "Konnte nicht gespeichert werden." };
  } else {
    const { error } = await supabase.from("todos").insert({
      ...row,
      owner_id: user.id,
      created_by: user.id,
      created_via: input.createdVia ?? "form",
    });
    if (error) {
      console.error("[remind] anlegen", error);
      return { error: "Konnte nicht gespeichert werden." };
    }
  }
  refresh();
  return {};
}

/**
 * Abhaken bzw. wiederherstellen. Beim Abhaken einer wiederkehrenden Aufgabe wird
 * die nächste Instanz angelegt (SPEC-remind-me › Logik) – genau einmal, auch bei
 * doppeltem Tippen.
 */
export async function setTodoDone(id: string, done: boolean): Promise<Result & { nextDue?: string }> {
  const { user, supabase } = await player();
  const now = new Date().toISOString();

  if (!done) {
    const { error } = await supabase.from("todos").update({ completed_at: null, updated_at: now }).eq("id", id);
    if (error) return { error: "Konnte nicht gespeichert werden." };
    refresh();
    return {};
  }

  const { data: completed, error } = await supabase
    .from("todos")
    .update({ completed_at: now, updated_at: now })
    .eq("id", id)
    .is("completed_at", null)
    .select("list_id, title, note, due_date, due_time, remind_at, repeat_rule, priority")
    .maybeSingle();
  if (error) return { error: "Konnte nicht gespeichert werden." };

  let nextDue: string | undefined;
  const next = completed?.repeat_rule ? nextInstance(completed, berlinDate()) : null;
  if (completed && next) {
    const { error: insertError } = await supabase.from("todos").insert({
      list_id: completed.list_id,
      owner_id: user.id,
      created_by: user.id,
      title: completed.title,
      note: completed.note,
      due_date: next.due_date,
      due_time: completed.due_time,
      remind_at: next.remind_at,
      repeat_rule: completed.repeat_rule,
      priority: completed.priority,
      created_via: "form",
    });
    if (insertError) console.error("[remind] nächste Wiederholung", insertError);
    else nextDue = next.due_date ?? undefined;
  }
  refresh();
  return { nextDue };
}

/** „Später“ aus der Erinnerung: in 1 Stunde, heute Abend oder morgen früh. */
export async function snoozeTodo(id: string, option: SnoozeOption): Promise<Result & { until?: string }> {
  const { supabase } = await player();
  if (!["hour", "evening", "tomorrow"].includes(option)) return { error: "Ungültige Auswahl" };
  const until = snoozeUntil(option, new Date()).toISOString();
  const { error } = await supabase
    .from("todos")
    .update({ snoozed_until: until, reminder_sent_at: null, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { error: "Konnte nicht verschoben werden." };
  refresh();
  return { until };
}

export async function deleteTodo(id: string): Promise<Result> {
  const { supabase } = await player();
  const { error } = await supabase.from("todos").delete().eq("id", id);
  if (error) return { error: "Konnte nicht gelöscht werden." };
  refresh();
  return {};
}

/** Wischen nach rechts: auf morgen verschieben (Erinnerung wandert mit). */
export async function postponeTodo(id: string): Promise<Result> {
  const { supabase } = await player();
  const { data: todo } = await supabase.from("todos").select("due_date, due_time, remind_at").eq("id", id).maybeSingle();
  if (!todo) return { error: "Aufgabe nicht gefunden." };
  const next = postponeToTomorrow(todo, berlinDate());
  const { error } = await supabase
    .from("todos")
    .update({ ...next, reminder_sent_at: null, snoozed_until: null, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { error: "Konnte nicht verschoben werden." };
  refresh();
  return {};
}

/** Erledigte Einträge einer Liste leeren (z. B. Einkauf). */
export async function clearCompleted(listId: string): Promise<Result> {
  const { supabase } = await player();
  const { error } = await supabase.from("todos").delete().eq("list_id", listId).not("completed_at", "is", null);
  if (error) return { error: "Konnte nicht geleert werden." };
  refresh();
  return {};
}

// ---------------------------------------------------------------------------
// Listen (nur Life Mode; Work Mode hat genau die Liste „Job“)
// ---------------------------------------------------------------------------

export async function createList(name: string): Promise<Result> {
  const { user, supabase } = await player();
  const clean = name.trim();
  if (!clean || clean.length > 60) return { error: "Bitte einen Namen (max. 60 Zeichen) eingeben." };
  const { count } = await supabase.from("todo_lists").select("id", { count: "exact", head: true }).eq("area", "life");
  const { error } = await supabase
    .from("todo_lists")
    .insert({ owner_id: user.id, area: "life", name: clean, sort_order: count ?? 0 });
  if (error) return { error: "Konnte nicht angelegt werden." };
  refresh();
  return {};
}

export async function renameList(id: string, name: string): Promise<Result> {
  const { supabase } = await player();
  const clean = name.trim();
  if (!clean || clean.length > 60) return { error: "Bitte einen Namen (max. 60 Zeichen) eingeben." };
  const { error } = await supabase.from("todo_lists").update({ name: clean }).eq("id", id).eq("area", "life");
  if (error) return { error: "Konnte nicht umbenannt werden." };
  refresh();
  return {};
}

/** Löscht eine Life-Liste samt Aufgaben. Die letzte Life-Liste bleibt immer bestehen. */
export async function deleteList(id: string): Promise<Result> {
  const { supabase } = await player();
  const { count } = await supabase.from("todo_lists").select("id", { count: "exact", head: true }).eq("area", "life");
  if ((count ?? 0) <= 1) return { error: "Mindestens eine Life-Liste muss bleiben." };
  const { error } = await supabase.from("todo_lists").delete().eq("id", id).eq("area", "life");
  if (error) return { error: "Konnte nicht gelöscht werden." };
  refresh();
  return {};
}
