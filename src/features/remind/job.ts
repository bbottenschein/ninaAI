import "server-only";
import { sendPush } from "@/lib/push";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Area } from "./logic";
import { planReminders, reminderPush, type DueReminder } from "./schedule";

/**
 * Erinnerungs-Job (jede Minute): fällige Erinnerungen verschicken, Work-Erinnerungen
 * vom Wochenende auf Montag 08:00 schieben, veraltete überspringen.
 * Jede Erinnerung wird vor dem Versand „beansprucht“ (reminder_sent_at), damit
 * sich überlappende Läufe nichts doppelt schicken.
 */
export async function runTodoReminders(now = new Date()) {
  const admin = createAdminClient();
  const iso = now.toISOString();

  const { data: rows, error } = await admin
    .from("todos")
    .select("id, owner_id, title, remind_at, snoozed_until, todo_lists!inner(area)")
    .is("completed_at", null)
    .is("reminder_sent_at", null)
    // Alle offenen Erinnerungen; welche jetzt fällig sind, entscheidet planReminders.
    .or("remind_at.not.is.null,snoozed_until.not.is.null")
    .limit(1000);
  if (error) throw error;

  const due: DueReminder[] = (rows ?? []).map((r) => ({
    id: r.id,
    owner_id: r.owner_id,
    title: r.title,
    remind_at: r.remind_at,
    snoozed_until: r.snoozed_until,
    area: ((r.todo_lists as unknown as { area: Area }).area ?? "life") as Area,
  }));
  const plan = planReminders(due, now);

  for (const { id, until } of plan.defer) {
    await admin.from("todos").update({ snoozed_until: until }).eq("id", id).is("reminder_sent_at", null);
  }
  if (plan.skip.length > 0) {
    await admin.from("todos").update({ reminder_sent_at: iso }).in("id", plan.skip).is("reminder_sent_at", null);
  }

  let sent = 0;
  for (const [ownerId, reminders] of plan.send) {
    const { data: claimed, error: claimError } = await admin
      .from("todos")
      .update({ reminder_sent_at: iso })
      .in("id", reminders.map((r) => r.id))
      .is("reminder_sent_at", null)
      .select("id");
    if (claimError) throw claimError;
    const ids = new Set((claimed ?? []).map((c) => c.id as string));
    const mine = reminders.filter((r) => ids.has(r.id));
    if (mine.length === 0) continue;
    sent += await sendPush([ownerId], reminderPush(mine));
  }

  return { due: due.length, sent, deferred: plan.defer.length, skipped: plan.skip.length };
}
