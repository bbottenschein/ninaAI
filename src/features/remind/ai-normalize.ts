import type { AiOperation } from "./ai-schema";
import { remindAtFor, type Area, type ReminderChoice, type Todo, type TodoList } from "./logic";
import { buildRepeat, parseRepeat } from "./repeat";

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Was die Karte zum Bestätigen braucht. */
export type ProposalDraft = {
  id?: string;
  title: string;
  area: Area;
  list_id: string;
  note: string;
  due_date: string | null;
  due_time: string | null;
  remind_at: string | null;
  reminder: ReminderChoice;
  repeat_rule: string | null;
  priority: boolean;
};

export type Proposal =
  | { kind: "create"; draft: ProposalDraft }
  | { kind: "update"; draft: ProposalDraft; before: Todo }
  | { kind: "delete"; todo: Todo }
  | { kind: "complete"; todo: Todo }
  | { kind: "choose"; action: AiOperation["action"]; candidates: Todo[]; op: AiOperation };

function validDate(value: string | null): string | null {
  if (!value || !DATE.test(value)) return null;
  return Number.isNaN(Date.parse(`${value}T00:00:00Z`)) ? null : value;
}

function validTime(value: string | null): string | null {
  return value && TIME.test(value.slice(0, 5)) ? value.slice(0, 5) : null;
}

/** Liste zum Bereich: Work Mode immer „Job“, Life Mode die genannte oder „Allgemein“. */
export function resolveList(area: Area, listName: string | null, lists: TodoList[]): TodoList | undefined {
  const areaLists = lists.filter((l) => l.area === area);
  if (area === "life" && listName) {
    const wanted = listName.trim().toLowerCase();
    const match = areaLists.find((l) => l.name.toLowerCase() === wanted);
    if (match) return match;
  }
  return areaLists.find((l) => l.name === "Allgemein") ?? areaLists[0];
}

/** Baut aus einer Operation den Karten-Entwurf; ungültige Felder werden verworfen. */
export function toDraft(op: AiOperation, lists: TodoList[], id?: string): ProposalDraft | null {
  const title = op.title.trim().slice(0, 200);
  const list = resolveList(op.area, op.list_name, lists);
  if (!title || !list) return null;

  const due_date = validDate(op.due_date);
  const due_time = due_date ? validTime(op.due_time) : null;

  let reminder: ReminderChoice = { kind: "none" };
  if (op.reminder === "custom") {
    const date = validDate(op.reminder_date);
    const time = validTime(op.reminder_time);
    if (date && time) reminder = { kind: "custom", date, time };
  } else if ((op.reminder === "due" || op.reminder === "day_before") && due_date) {
    reminder = { kind: op.reminder };
  }

  return {
    id,
    title,
    area: list.area,
    list_id: list.id,
    note: op.note.trim().slice(0, 2000),
    due_date,
    due_time,
    reminder,
    remind_at: remindAtFor({ date: due_date, time: due_time }, reminder),
    repeat_rule: buildRepeat(parseRepeat(op.repeat_rule)),
    priority: op.priority,
  };
}

/**
 * Prüft Claudes Operationen gegen Ninas echte Listen und Aufgaben und macht daraus
 * Vorschläge für die Karte. Was nicht passt, fällt weg.
 */
export function normalizeOperations(ops: AiOperation[], ctx: { lists: TodoList[]; todos: Todo[] }): Proposal[] {
  const byId = new Map(ctx.todos.map((t) => [t.id, t]));
  const proposals: Proposal[] = [];

  for (const op of ops.slice(0, 20)) {
    if (op.action === "create") {
      const draft = toDraft(op, ctx.lists);
      if (draft) proposals.push({ kind: "create", draft });
      continue;
    }

    const target = op.target_id ? byId.get(op.target_id) : undefined;
    if (!target) {
      const candidates = op.candidate_ids.map((id) => byId.get(id)).filter((t): t is Todo => Boolean(t));
      if (candidates.length === 1) proposals.push(...normalizeOperations([{ ...op, target_id: candidates[0].id, candidate_ids: [] }], ctx));
      else if (candidates.length > 1) proposals.push({ kind: "choose", action: op.action, candidates, op });
      continue;
    }

    if (op.action === "update") {
      const draft = toDraft(op, ctx.lists, target.id);
      if (draft) proposals.push({ kind: "update", draft, before: target });
    } else if (op.action === "delete") {
      proposals.push({ kind: "delete", todo: target });
    } else {
      proposals.push({ kind: "complete", todo: target });
    }
  }
  return proposals;
}
