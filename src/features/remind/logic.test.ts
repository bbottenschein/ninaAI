import { describe, expect, it } from "vitest";
import {
  areasForHome,
  bucketOf,
  compareTodos,
  postponeToTomorrow,
  reminderChoiceOf,
  remindAtFor,
  type Todo,
} from "./logic";

// Donnerstag, 26.11.2026
const TODAY = "2026-11-26";

describe("bucketOf", () => {
  it("ordnet Fälligkeiten Heute / Morgen / Diese Woche / Später zu", () => {
    expect(bucketOf("2026-11-25", TODAY)).toBe("overdue");
    expect(bucketOf(TODAY, TODAY)).toBe("today");
    expect(bucketOf("2026-11-27", TODAY)).toBe("tomorrow");
    expect(bucketOf("2026-11-29", TODAY)).toBe("week"); // Sonntag
    expect(bucketOf("2026-11-30", TODAY)).toBe("later"); // nächster Montag
    expect(bucketOf(null, TODAY)).toBe("none");
  });

  it("hat sonntags keine „Diese Woche“-Gruppe mehr", () => {
    expect(bucketOf("2026-12-01", "2026-11-29")).toBe("later");
    expect(bucketOf("2026-11-30", "2026-11-29")).toBe("tomorrow");
  });
});

describe("areasForHome", () => {
  it("zeigt am Wochenende nur Life Mode", () => {
    expect(areasForHome("2026-11-28")).toEqual(["life"]);
    expect(areasForHome("2026-11-29")).toEqual(["life"]);
    expect(areasForHome("2026-11-30")).toEqual(["work", "life"]);
  });
});

describe("Erinnerung", () => {
  it("erinnert zur Fälligkeit bzw. um 09:00 bei ganztägigen Aufgaben", () => {
    expect(remindAtFor({ date: "2026-11-27", time: "15:00" }, { kind: "due" })).toBe("2026-11-27T14:00:00.000Z");
    expect(remindAtFor({ date: "2026-11-27", time: null }, { kind: "due" })).toBe("2026-11-27T08:00:00.000Z");
  });

  it("erinnert einen Tag vorher", () => {
    expect(remindAtFor({ date: "2026-11-27", time: "15:00" }, { kind: "day_before" })).toBe(
      "2026-11-26T14:00:00.000Z",
    );
  });

  it("nimmt eine eigene Zeit und braucht dafür kein Fälligkeitsdatum", () => {
    expect(remindAtFor({ date: null, time: null }, { kind: "custom", date: "2026-11-26", time: "19:00" })).toBe(
      "2026-11-26T18:00:00.000Z",
    );
    expect(remindAtFor({ date: null, time: null }, { kind: "due" })).toBeNull();
  });

  it("erkennt die Auswahl einer gespeicherten Erinnerung wieder", () => {
    const due = { due_date: "2026-11-27", due_time: "15:00" };
    expect(reminderChoiceOf({ ...due, remind_at: null })).toEqual({ kind: "none" });
    expect(reminderChoiceOf({ ...due, remind_at: "2026-11-27T14:00:00.000Z" })).toEqual({ kind: "due" });
    expect(reminderChoiceOf({ ...due, remind_at: "2026-11-26T14:00:00.000Z" })).toEqual({ kind: "day_before" });
    expect(reminderChoiceOf({ ...due, remind_at: "2026-11-26T18:00:00.000Z" })).toEqual({
      kind: "custom",
      date: "2026-11-26",
      time: "19:00",
    });
  });
});

describe("postponeToTomorrow", () => {
  it("verschiebt Fälligkeit und Erinnerung gemeinsam", () => {
    const result = postponeToTomorrow(
      { due_date: "2026-11-24", due_time: "10:00", remind_at: "2026-11-24T09:00:00.000Z" },
      TODAY,
    );
    expect(result).toEqual({ due_date: "2026-11-27", remind_at: "2026-11-27T09:00:00.000Z" });
  });

  it("gibt Aufgaben ohne Datum morgen als Fälligkeit", () => {
    expect(postponeToTomorrow({ due_date: null, due_time: null, remind_at: null }, TODAY)).toEqual({
      due_date: "2026-11-27",
      remind_at: null,
    });
  });

  it("verschiebt eine eigene Erinnerungszeit um dieselbe Anzahl Tage", () => {
    // Fällig Do, Erinnerung Mi 19:00 → fällig Fr, Erinnerung Do 19:00
    const result = postponeToTomorrow(
      { due_date: TODAY, due_time: "15:00", remind_at: "2026-11-25T18:00:00.000Z" },
      TODAY,
    );
    expect(result).toEqual({ due_date: "2026-11-27", remind_at: "2026-11-26T18:00:00.000Z" });
  });
});

describe("compareTodos", () => {
  const t = (over: Partial<Todo>): Todo => ({
    id: "x", list_id: "l", title: "t", note: "", due_date: null, due_time: null, remind_at: null,
    repeat_rule: null, priority: false, completed_at: null, snoozed_until: null, created_at: "2026-11-01", ...over,
  });
  it("sortiert wichtige zuerst, dann nach Fälligkeit", () => {
    const list = [t({ id: "a", due_date: "2026-11-27" }), t({ id: "b", priority: true }), t({ id: "c", due_date: "2026-11-26", due_time: "08:00" })];
    expect(list.sort(compareTodos).map((x) => x.id)).toEqual(["b", "c", "a"]);
  });
});
