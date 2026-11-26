import { describe, expect, it } from "vitest";
import { addDays } from "@/lib/date";
import { EMPTY_STREAK, dayOutcome, evaluateDays, pendingDates, type DayOutcome, type StreakState } from "./evaluate";

const START = "2026-12-01";

/** Baut eine Folge von Tagen ab START, z. B. ("c", 13) = 13 absolvierte Tage. */
function days(...parts: [DayOutcome | "c" | "m" | "n", number][]) {
  const map = { c: "completed", m: "missed", n: "no_lesson" } as const;
  const result: { date: string; outcome: DayOutcome }[] = [];
  for (const [kind, count] of parts) {
    for (let i = 0; i < count; i++) {
      result.push({ date: addDays(START, result.length), outcome: kind in map ? map[kind as "c"] : (kind as DayOutcome) });
    }
  }
  return result;
}

function run(input: ReturnType<typeof days>, start: StreakState = EMPTY_STREAK) {
  return evaluateDays(start, input);
}

describe("Streak", () => {
  it("steigt mit jedem absolvierten Tag und merkt sich den Rundenstart", () => {
    const { state, days: evaluated } = run(days(["c", 3]));
    expect(state).toMatchObject({ current: 3, longest: 3, runStartedOn: START, lastCompletedDate: "2026-12-03" });
    expect(evaluated.map((d) => d.streakAfter)).toEqual([1, 2, 3]);
    expect(state.lastEvaluatedDate).toBe("2026-12-03");
  });

  it("fällt ohne Joker auf 0 und behält die längste Streak", () => {
    const { state, days: evaluated } = run(days(["c", 5], ["m", 1]));
    expect(state).toMatchObject({ current: 0, longest: 5, runStartedOn: null, jokers: 0 });
    expect(evaluated.at(-1)).toEqual({ date: "2026-12-06", result: "missed", streakAfter: 0 });
  });

  it("lässt die Streak an einem Tag ohne Lektion unverändert und verbraucht keinen Joker", () => {
    const { state, days: evaluated } = run(days(["c", 10], ["n", 2], ["c", 1]));
    expect(state).toMatchObject({ current: 11, jokers: 1 });
    expect(evaluated.slice(10, 12).map((d) => d.result)).toEqual(["no_lesson", "no_lesson"]);
  });
});

describe("Joker", () => {
  it("gibt es an Streak-Tag 10", () => {
    expect(run(days(["c", 9])).state.jokers).toBe(0);
    expect(run(days(["c", 10])).state.jokers).toBe(1);
  });

  it("gibt es höchstens einmal gleichzeitig", () => {
    expect(run(days(["c", 20])).state.jokers).toBe(1);
  });

  it("wird bei einem Fehltag verbraucht – Streak bleibt, Hinweis wird angezeigt", () => {
    const { state, days: evaluated } = run(days(["c", 12], ["m", 1]));
    expect(state).toMatchObject({
      current: 12,
      jokers: 0,
      jokerUsedOn: "2026-12-13",
      jokerNoticeSeen: false,
      runStartedOn: START,
    });
    expect(evaluated.at(-1)).toEqual({ date: "2026-12-13", result: "joker", streakAfter: 12 });
  });

  it("rettet nur einen Fehltag – der zweite setzt die Streak auf 0", () => {
    const { state, days: evaluated } = run(days(["c", 10], ["m", 2]));
    expect(evaluated.slice(-2).map((d) => d.result)).toEqual(["joker", "missed"]);
    expect(state).toMatchObject({ current: 0, jokers: 0, longest: 10 });
  });

  it("zählt nach einem verbrauchten Joker ab der gehaltenen Streak weiter", () => {
    const { state } = run(days(["c", 10], ["m", 1], ["c", 10]));
    expect(state).toMatchObject({ current: 20, jokers: 1 });
  });

  it("gibt nach einem Reset bei 10 wieder einen Joker", () => {
    const { state } = run(days(["c", 5], ["m", 1], ["c", 10]));
    expect(state).toMatchObject({ current: 10, jokers: 1 });
  });
});

describe("Meilensteine & Gutscheine", () => {
  it("vergibt die Massage an Tag 14 und 28", () => {
    const { rewards } = run(days(["c", 28]));
    expect(rewards).toEqual([
      { type: "massage", milestoneDay: 14, runStartedOn: START, date: "2026-12-14" },
      { type: "massage", milestoneDay: 28, runStartedOn: START, date: "2026-12-28" },
    ]);
  });

  it("vergibt an Tag 150 alle passenden Gutscheine", () => {
    const { rewards } = run(days(["c", 150]));
    const day150 = rewards.filter((r) => r.milestoneDay === 150).map((r) => r.type).sort();
    expect(day150).toEqual(["dinner", "surprise"]);
    expect(rewards).toHaveLength(10 + 5 + 3); // 10× Massage, 5× Überraschung, 3× Essen
  });

  it("vergibt nach einem Reset denselben Meilenstein erneut – an die neue Runde gebunden", () => {
    // 2 Fehltage: der erste verbraucht den Joker von Tag 10, der zweite setzt zurück.
    const { rewards } = run(days(["c", 14], ["m", 2], ["c", 14]));
    expect(rewards).toEqual([
      { type: "massage", milestoneDay: 14, runStartedOn: "2026-12-01", date: "2026-12-14" },
      { type: "massage", milestoneDay: 14, runStartedOn: "2026-12-17", date: "2026-12-30" },
    ]);
  });

  it("vergibt keinen Gutschein für einen durch den Joker gehaltenen Tag", () => {
    const { rewards } = run(days(["c", 13], ["m", 1], ["c", 1]));
    expect(rewards).toEqual([{ type: "massage", milestoneDay: 14, runStartedOn: START, date: "2026-12-15" }]);
  });

  it("verliert verdiente Gutscheine bei einem Reset nicht (sie bleiben in der Liste)", () => {
    const { rewards, state } = run(days(["c", 14], ["m", 2]));
    expect(rewards).toHaveLength(1);
    expect(state.current).toBe(0);
  });
});

describe("Nachholen & Idempotenz", () => {
  it("überspringt bereits ausgewertete Tage", () => {
    const first = run(days(["c", 3]));
    const again = evaluateDays(first.state, days(["c", 3]));
    expect(again.days).toEqual([]);
    expect(again.state).toEqual(first.state);
  });

  it("liefert dasselbe Ergebnis, egal ob am Stück oder in Etappen ausgewertet", () => {
    const all = days(["c", 12], ["m", 1], ["n", 1], ["c", 3], ["m", 2], ["c", 15]);
    const once = run(all);
    let state = EMPTY_STREAK;
    const rewards = [];
    for (const day of all) {
      const step = evaluateDays(state, [day]);
      state = step.state;
      rewards.push(...step.rewards);
    }
    expect(state).toEqual(once.state);
    expect(rewards).toEqual(once.rewards);
  });

  it("sortiert die Tage selbst", () => {
    const shuffled = days(["c", 3]).reverse();
    expect(run(shuffled).state.current).toBe(3);
  });

  it("listet offene Tage seit der letzten Auswertung", () => {
    expect(pendingDates("2026-11-28", "2026-12-01")).toEqual(["2026-11-29", "2026-11-30", "2026-12-01"]);
    expect(pendingDates("2026-12-01", "2026-12-01")).toEqual([]);
    expect(pendingDates(null, "2026-12-01")).toEqual(["2026-12-01"]);
  });
});

describe("dayOutcome", () => {
  it("unterscheidet absolviert, verpasst und ohne Lektion", () => {
    expect(dayOutcome(true, true)).toBe("completed");
    expect(dayOutcome(true, false)).toBe("missed");
    expect(dayOutcome(false, false)).toBe("no_lesson");
  });
});
