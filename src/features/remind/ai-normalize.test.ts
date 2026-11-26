import { describe, expect, it } from "vitest";
import { normalizeOperations, resolveList } from "./ai-normalize";
import type { AiOperation } from "./ai-schema";
import type { Todo, TodoList } from "./logic";

const lists: TodoList[] = [
  { id: "job", area: "work", name: "Job", sort_order: 0 },
  { id: "all", area: "life", name: "Allgemein", sort_order: 0 },
  { id: "ein", area: "life", name: "Einkauf", sort_order: 1 },
];
const todo = (id: string, title: string, over: Partial<Todo> = {}): Todo => ({
  id, list_id: "all", title, note: "", due_date: null, due_time: null, remind_at: null, repeat_rule: null,
  priority: false, completed_at: null, snoozed_until: null, created_at: "2026-11-20T08:00:00Z", ...over,
});
const op = (over: Partial<AiOperation>): AiOperation => ({
  action: "create", target_id: null, candidate_ids: [], title: "Aufgabe", area: "life", list_name: null,
  due_date: null, due_time: null, reminder: "none", reminder_date: null, reminder_time: null,
  repeat_rule: null, priority: false, note: "", ...over,
});
const ctx = { lists, todos: [todo("z", "Zahnarzt", { due_date: "2026-11-27", due_time: "15:00" }), todo("z2", "Zahnarzt Kontrolle")] };

describe("normalizeOperations", () => {
  it("„Zahnarzt Freitag 15 Uhr, erinner mich Donnerstag Abend“", () => {
    const [p] = normalizeOperations(
      [op({ title: "Zahnarzt", due_date: "2026-11-27", due_time: "15:00", reminder: "custom", reminder_date: "2026-11-26", reminder_time: "19:00" })],
      ctx,
    );
    expect(p).toMatchObject({
      kind: "create",
      draft: { title: "Zahnarzt", area: "life", list_id: "all", due_time: "15:00", remind_at: "2026-11-26T18:00:00.000Z" },
    });
  });

  it("„Präsentation für den Kunden bis Mittwoch“ → Work Mode, Liste Job, Erinnerung 09:00", () => {
    const [p] = normalizeOperations(
      [op({ title: "Präsentation fertig machen", area: "work", list_name: "Einkauf", due_date: "2026-12-02", reminder: "due" })],
      ctx,
    );
    expect(p).toMatchObject({ kind: "create", draft: { area: "work", list_id: "job", remind_at: "2026-12-02T08:00:00.000Z" } });
  });

  it("„Milch, Eier und Brot“ → 3 Einträge in Einkauf", () => {
    const proposals = normalizeOperations(
      ["Milch", "Eier", "Brot"].map((title) => op({ title, list_name: "einkauf" })),
      ctx,
    );
    expect(proposals.map((p) => p.kind === "create" && p.draft.list_id)).toEqual(["ein", "ein", "ein"]);
  });

  it("„Jeden Montag Müll rausbringen“ → Wiederholung wöchentlich Mo", () => {
    const [p] = normalizeOperations([op({ title: "Müll rausbringen", due_date: "2026-11-30", repeat_rule: "FREQ=WEEKLY;BYDAY=MO" })], ctx);
    expect(p).toMatchObject({ draft: { repeat_rule: "FREQ=WEEKLY;BYDAY=MO" } });
  });

  it("„Schieb Zahnarzt um einen Tag“ → Änderung an der bestehenden Aufgabe", () => {
    const [p] = normalizeOperations(
      [op({ action: "update", target_id: "z", title: "Zahnarzt", due_date: "2026-11-28", due_time: "15:00", reminder: "custom", reminder_date: "2026-11-27", reminder_time: "19:00" })],
      ctx,
    );
    expect(p).toMatchObject({ kind: "update", draft: { id: "z", due_date: "2026-11-28" }, before: { id: "z" } });
  });

  it("fragt nach, wenn mehrere Aufgaben passen", () => {
    const [p] = normalizeOperations([op({ action: "delete", candidate_ids: ["z", "z2", "unbekannt"] })], ctx);
    expect(p).toMatchObject({ kind: "choose", action: "delete" });
    expect(p.kind === "choose" && p.candidates.map((c) => c.id)).toEqual(["z", "z2"]);
  });

  it("nimmt den einzigen gültigen Kandidaten direkt", () => {
    const [p] = normalizeOperations([op({ action: "complete", candidate_ids: ["z", "fremd"] })], ctx);
    expect(p).toMatchObject({ kind: "complete", todo: { id: "z" } });
  });

  it("verwirft unbekannte Aufgaben, leere Titel und ungültige Daten", () => {
    expect(normalizeOperations([op({ action: "delete", target_id: "fremd" }), op({ title: "  " })], ctx)).toEqual([]);
    const [p] = normalizeOperations(
      [op({ due_date: "2026-13-45", due_time: "25:99", reminder: "due", repeat_rule: "FREQ=HOURLY" })],
      ctx,
    );
    expect(p).toMatchObject({ draft: { due_date: null, due_time: null, remind_at: null, repeat_rule: null } });
  });

  it("ignoriert eine Uhrzeit ohne Datum und „zur Fälligkeit“ ohne Datum", () => {
    const [p] = normalizeOperations([op({ due_time: "10:00", reminder: "day_before" })], ctx);
    expect(p).toMatchObject({ draft: { due_time: null, reminder: { kind: "none" } } });
  });
});

describe("resolveList", () => {
  it("fällt im Life Mode auf Allgemein zurück", () => {
    expect(resolveList("life", "Gibt es nicht", lists)?.id).toBe("all");
    expect(resolveList("work", "Einkauf", lists)?.id).toBe("job");
  });
});
