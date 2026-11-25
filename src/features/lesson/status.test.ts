import { describe, expect, it } from "vitest";
import { MAX_ATTEMPTS, lessonPhase } from "./status";

const now = new Date("2026-11-25T06:00:00Z");
const minutesAgo = (m: number) => new Date(now.getTime() - m * 60_000).toISOString();

describe("lessonPhase", () => {
  it("startet die Erzeugung, wenn es noch keine Lektion gibt", () => {
    expect(lessonPhase(null, now)).toBe("start");
  });

  it("zeigt eine fertige Lektion", () => {
    expect(lessonPhase({ status: "ready", attempts: 1, generation_started_at: minutesAgo(60) }, now)).toBe("ready");
  });

  it("wartet auf eine laufende Erzeugung", () => {
    expect(lessonPhase({ status: "generating", attempts: 1, generation_started_at: minutesAgo(2) }, now)).toBe(
      "generating",
    );
  });

  it("startet neu, wenn eine Erzeugung hängt oder fehlgeschlagen ist", () => {
    expect(lessonPhase({ status: "generating", attempts: 1, generation_started_at: minutesAgo(10) }, now)).toBe(
      "start",
    );
    expect(lessonPhase({ status: "failed", attempts: 1, generation_started_at: minutesAgo(1) }, now)).toBe("start");
  });

  it("gibt nach allen Versuchen auf (Tag ohne Lektion)", () => {
    const attempts = MAX_ATTEMPTS;
    expect(lessonPhase({ status: "failed", attempts, generation_started_at: minutesAgo(1) }, now)).toBe(
      "unavailable",
    );
    expect(lessonPhase({ status: "generating", attempts, generation_started_at: minutesAgo(10) }, now)).toBe(
      "unavailable",
    );
    expect(lessonPhase({ status: "generating", attempts, generation_started_at: minutesAgo(1) }, now)).toBe(
      "generating",
    );
  });
});
