import "server-only";
import { addDays } from "@/lib/date";
import { createClient } from "@/lib/supabase/server";
import { areasForHome, compareTodos, type Area, type Todo, type TodoList } from "./logic";

const TODO_COLUMNS =
  "id, list_id, title, note, due_date, due_time, remind_at, repeat_rule, priority, completed_at, snoozed_until, created_at";

export type RemindData = { lists: TodoList[]; open: Todo[]; done: Todo[] };

/** Alles für „Remind me“. Legt beim ersten Mal die Startlisten an. */
export async function loadRemind(today: string): Promise<RemindData> {
  const supabase = await createClient();
  await supabase.rpc("ensure_todo_lists");

  const since = addDays(today, -30);
  const [{ data: lists }, { data: open }, { data: done }] = await Promise.all([
    supabase.from("todo_lists").select("id, area, name, sort_order").order("sort_order").order("created_at"),
    supabase.from("todos").select(TODO_COLUMNS).is("completed_at", null),
    supabase
      .from("todos")
      .select(TODO_COLUMNS)
      .not("completed_at", "is", null)
      .gte("completed_at", `${since}T00:00:00Z`)
      .order("completed_at", { ascending: false }),
  ]);

  return {
    lists: (lists ?? []) as TodoList[],
    open: ((open ?? []) as Todo[]).sort(compareTodos),
    done: (done ?? []) as Todo[],
  };
}

export type HomeTodo = Todo & { area: Area; listName: string };

/** Für Home: heute fällige und überfällige Aufgaben – am Wochenende nur Life Mode. */
export async function loadHomeTodos(today: string): Promise<HomeTodo[]> {
  const supabase = await createClient();
  const [{ data: lists }, { data: todos }] = await Promise.all([
    supabase.from("todo_lists").select("id, area, name"),
    supabase.from("todos").select(TODO_COLUMNS).is("completed_at", null).lte("due_date", today),
  ]);
  const byId = new Map((lists ?? []).map((l) => [l.id as string, l as { area: Area; name: string }]));
  const areas = areasForHome(today);
  return ((todos ?? []) as Todo[])
    .map((t) => ({ ...t, area: byId.get(t.list_id)?.area ?? "life", listName: byId.get(t.list_id)?.name ?? "" }))
    .filter((t) => areas.includes(t.area))
    .sort(compareTodos);
}
