import { describe, expect, it } from "vitest";
import {
  nextInstance,
  nextOccurrence,
  planReminders,
  reminderPush,
  snoozeLabel,
  snoozeUntil,
  type DueReminder,
} from "./schedule";

describe("nextOccurrence", () => {
  it("wiederholt täglich, monatlich und jährlich", () => {
    expect(nextOccurrence("FREQ=DAILY", "2026-12-31")).toBe("2027-01-01");
    expect(nextOccurrence("FREQ=MONTHLY", "2026-11-26")).toBe("2026-12-26");
    expect(nextOccurrence("FREQ=MONTHLY", "2026-12-15")).toBe("2027-01-15");
    expect(nextOccurrence("FREQ=YEARLY", "2026-11-26")).toBe("2027-11-26");
  });

  it("nimmt am Monatsende den letzten Tag des kürzeren Monats", () => {
    expect(nextOccurrence("FREQ=MONTHLY", "2027-01-31")).toBe("2027-02-28");
    expect(nextOccurrence("FREQ=MONTHLY", "2028-01-31")).toBe("2028-02-29");
    expect(nextOccurrence("FREQ=YEARLY", "2028-02-29")).toBe("2029-02-28");
  });

  it("findet den nächsten gewählten Wochentag", () => {
    // 26.11.2026 ist ein Donnerstag
    expect(nextOccurrence("FREQ=WEEKLY;BYDAY=MO", "2026-11-26")).toBe("2026-11-30");
    expect(nextOccurrence("FREQ=WEEKLY;BYDAY=TH", "2026-11-26")).toBe("2026-12-03");
    expect(nextOccurrence("FREQ=WEEKLY;BYDAY=MO,FR", "2026-11-26")).toBe("2026-11-27");
    expect(nextOccurrence("FREQ=WEEKLY", "2026-11-26")).toBe("2026-12-03");
  });

  it("liefert null ohne gültige Regel", () => {
    expect(nextOccurrence(null, "2026-11-26")).toBeNull();
  });
});

describe("nextInstance", () => {
  const TODAY = "2026-11-26"; // Donnerstag

  it("verschiebt Fälligkeit und Erinnerung „zur Fälligkeit“", () => {
    expect(
      nextInstance(
        { due_date: "2026-11-23", due_time: "07:30", remind_at: "2026-11-23T06:30:00.000Z", repeat_rule: "FREQ=WEEKLY;BYDAY=MO" },
        "2026-11-23",
      ),
    ).toEqual({ due_date: "2026-11-30", remind_at: "2026-11-30T06:30:00.000Z" });
  });

  it("behält „1 Tag vorher“ bei", () => {
    expect(
      nextInstance(
        { due_date: "2026-11-26", due_time: null, remind_at: "2026-11-25T08:00:00.000Z", repeat_rule: "FREQ=MONTHLY" },
        TODAY,
      ),
    ).toEqual({ due_date: "2026-12-26", remind_at: "2026-12-25T08:00:00.000Z" });
  });

  it("verschiebt eine eigene Erinnerungszeit um denselben Abstand", () => {
    // Fällig Do, Erinnerung Mi 19:00 → fällig nächster Do, Erinnerung nächster Mi 19:00
    expect(
      nextInstance(
        { due_date: TODAY, due_time: "15:00", remind_at: "2026-11-25T18:00:00.000Z", repeat_rule: "FREQ=WEEKLY;BYDAY=TH" },
        TODAY,
      ),
    ).toEqual({ due_date: "2026-12-03", remind_at: "2026-12-02T18:00:00.000Z" });
  });

  it("überspringt verpasste Termine bis heute", () => {
    expect(
      nextInstance({ due_date: "2026-11-01", due_time: null, remind_at: null, repeat_rule: "FREQ=DAILY" }, TODAY),
    ).toEqual({ due_date: TODAY, remind_at: null });
  });

  it("nimmt heute als Ausgangspunkt, wenn kein Datum gesetzt ist", () => {
    expect(
      nextInstance({ due_date: null, due_time: null, remind_at: null, repeat_rule: "FREQ=DAILY" }, TODAY),
    ).toEqual({ due_date: "2026-11-27", remind_at: null });
  });

  it("liefert null für Aufgaben ohne Wiederholung", () => {
    expect(nextInstance({ due_date: TODAY, due_time: null, remind_at: null, repeat_rule: null }, TODAY)).toBeNull();
  });
});

describe("Snooze („Später“)", () => {
  const morning = new Date("2026-11-26T09:15:00Z"); // 10:15 Berlin
  const night = new Date("2026-11-26T20:00:00Z"); // 21:00 Berlin

  it("verschiebt um eine Stunde", () => {
    expect(snoozeUntil("hour", morning).toISOString()).toBe("2026-11-26T10:15:00.000Z");
  });

  it("verschiebt auf heute Abend – oder morgen Abend, wenn es schon Abend ist", () => {
    expect(snoozeUntil("evening", morning).toISOString()).toBe("2026-11-26T18:00:00.000Z");
    expect(snoozeUntil("evening", night).toISOString()).toBe("2026-11-27T18:00:00.000Z");
    expect(snoozeLabel("evening", morning)).toBe("Heute Abend");
    expect(snoozeLabel("evening", night)).toBe("Morgen Abend");
  });

  it("verschiebt auf morgen früh 09:00", () => {
    expect(snoozeUntil("tomorrow", night).toISOString()).toBe("2026-11-27T08:00:00.000Z");
  });
});

describe("planReminders", () => {
  const r = (over: Partial<DueReminder>): DueReminder => ({
    id: "t1",
    owner_id: "nina",
    title: "Zahnarzt",
    area: "life",
    remind_at: "2026-11-26T14:00:00.000Z",
    snoozed_until: null,
    ...over,
  });
  const thursday = new Date("2026-11-26T14:00:30Z");
  const saturday = new Date("2026-11-28T09:00:00Z");

  it("verschickt fällige Erinnerungen, aber noch keine künftigen", () => {
    const plan = planReminders([r({}), r({ id: "t2", remind_at: "2026-11-26T15:00:00.000Z" })], thursday);
    expect(plan.send.get("nina")?.map((x) => x.id)).toEqual(["t1"]);
  });

  it("bündelt mehrere Erinnerungen einer Besitzerin", () => {
    const plan = planReminders([r({}), r({ id: "t2", title: "Mama anrufen" })], thursday);
    expect(plan.send.get("nina")).toHaveLength(2);
    expect(reminderPush(plan.send.get("nina")!)).toMatchObject({
      title: "🔔 2 Erinnerungen",
      body: "Zahnarzt, Mama anrufen",
      url: "/remind",
    });
  });

  it("nimmt bei „Später“ die neue Zeit statt der ursprünglichen", () => {
    const snoozed = r({ snoozed_until: "2026-11-26T15:00:00.000Z" });
    expect(planReminders([snoozed], thursday).send.size).toBe(0);
    expect(planReminders([snoozed], new Date("2026-11-26T15:00:10Z")).send.size).toBe(1);
  });

  it("verschiebt Work-Erinnerungen am Wochenende auf Montag 08:00", () => {
    const plan = planReminders(
      [r({ id: "w", area: "work", remind_at: "2026-11-28T08:00:00.000Z" }), r({ id: "l", remind_at: "2026-11-28T08:00:00.000Z" })],
      saturday,
    );
    expect(plan.defer).toEqual([{ id: "w", until: "2026-11-30T07:00:00.000Z" }]);
    expect(plan.send.get("nina")?.map((x) => x.id)).toEqual(["l"]);
  });

  it("verschiebt auch sonntags auf Montag 08:00", () => {
    const plan = planReminders([r({ area: "work", remind_at: "2026-11-29T10:00:00.000Z" })], new Date("2026-11-29T10:00:00Z"));
    expect(plan.defer[0].until).toBe("2026-11-30T07:00:00.000Z");
  });

  it("schickt Work-Erinnerungen unter der Woche auch abends", () => {
    const evening = new Date("2026-11-26T20:30:00Z"); // Do 21:30
    expect(planReminders([r({ area: "work", remind_at: "2026-11-26T20:30:00.000Z" })], evening).send.size).toBe(1);
  });

  it("überspringt veraltete Erinnerungen ohne Push", () => {
    const plan = planReminders([r({ remind_at: "2026-11-25T14:00:00.000Z" })], thursday);
    expect(plan.skip).toEqual(["t1"]);
    expect(plan.send.size).toBe(0);
  });

  it("verlinkt eine einzelne Erinnerung direkt auf die Aufgabe", () => {
    expect(reminderPush([{ id: "t1", title: "Zahnarzt", area: "life" }])).toEqual({
      title: "🌸 Erinnerung",
      body: "Zahnarzt",
      url: "/remind?todo=t1",
      tag: "todo-t1",
    });
  });
});
