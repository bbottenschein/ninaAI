import { describe, expect, it } from "vitest";
import type { EvaluatedDay } from "./evaluate";
import { buildPathway } from "./pathway";

const day = (date: string, result: EvaluatedDay["result"], streakAfter: number): EvaluatedDay => ({ date, result, streakAfter });

describe("buildPathway", () => {
  it("zeigt am Anfang den heutigen Tag und den Weg bis zur Massage an Tag 14", () => {
    const { nodes } = buildPathway({ runDays: [], current: 0, today: "2026-12-01", todayDone: false });
    expect(nodes[0]).toMatchObject({ kind: "today", streakDay: 1, isToday: true });
    expect(nodes.at(-1)).toMatchObject({ kind: "future", streakDay: 14, milestones: ["massage"] });
    expect(nodes).toHaveLength(14);
  });

  it("füllt absolvierte Tage, markiert Joker-Tage und lässt Tage ohne Lektion weg", () => {
    const runDays = [
      day("2026-12-01", "completed", 1),
      day("2026-12-02", "no_lesson", 1),
      day("2026-12-03", "completed", 2),
      day("2026-12-04", "joker", 2),
    ];
    const { nodes } = buildPathway({ runDays, current: 2, today: "2026-12-05", todayDone: false });
    expect(nodes.slice(0, 4).map((n) => [n.kind, n.streakDay])).toEqual([
      ["done", 1],
      ["done", 2],
      ["joker", 2],
      ["today", 3],
    ]);
  });

  it("hebt den heutigen Tag auch hervor, wenn er schon absolviert ist", () => {
    const runDays = [day("2026-12-01", "completed", 1), day("2026-12-02", "completed", 2)];
    const { nodes } = buildPathway({ runDays, current: 2, today: "2026-12-02", todayDone: true });
    expect(nodes[1]).toMatchObject({ kind: "done", isToday: true, streakDay: 2 });
    expect(nodes[2]).toMatchObject({ kind: "future", streakDay: 3 });
    expect(nodes.some((n) => n.kind === "today")).toBe(false);
  });

  it("zeigt mehrere Belohnungen am selben Tag (Tag 150)", () => {
    const { nodes } = buildPathway({ runDays: [], current: 148, today: "2026-12-01", todayDone: false });
    const node = nodes.find((n) => n.streakDay === 150);
    expect(node?.milestones.sort()).toEqual(["dinner", "surprise"]);
  });

  it("zeigt nach einem erreichten Meilenstein mindestens ein paar Felder voraus", () => {
    const { nodes } = buildPathway({ runDays: [], current: 27, today: "2026-12-01", todayDone: false });
    // heute = 28 (Massage), danach bis zur Überraschung an Tag 30, mindestens 5 Felder
    expect(nodes.map((n) => n.streakDay)).toEqual([28, 29, 30, 31, 32, 33]);
  });

  it("kürzt lange Wege und zählt die ausgeblendeten Tage", () => {
    const runDays = Array.from({ length: 25 }, (_, i) =>
      day(`2026-11-${String(i + 1).padStart(2, "0")}`, "completed", i + 1),
    );
    const { nodes, hiddenPast } = buildPathway({ runDays, current: 25, today: "2026-11-26", todayDone: false });
    expect(hiddenPast).toBe(15);
    expect(nodes[0].streakDay).toBe(16);
  });
});
