import { describe, expect, it } from "vitest";
import { buildRepeat, parseRepeat, repeatLabel } from "./repeat";

describe("Wiederholung (RRULE)", () => {
  it("liest und schreibt die unterstützten Regeln", () => {
    for (const rule of ["FREQ=DAILY", "FREQ=WEEKLY;BYDAY=MO", "FREQ=WEEKLY;BYDAY=MO,WE,FR", "FREQ=MONTHLY", "FREQ=YEARLY"]) {
      expect(buildRepeat(parseRepeat(rule))).toBe(rule);
    }
  });

  it("sortiert Wochentage und ignoriert Unbekanntes", () => {
    expect(buildRepeat(parseRepeat("freq=weekly;byday=FR,MO,XX"))).toBe("FREQ=WEEKLY;BYDAY=MO,FR");
    expect(parseRepeat("FREQ=HOURLY")).toBeNull();
    expect(parseRepeat(null)).toBeNull();
  });

  it("beschreibt die Regel auf Deutsch", () => {
    expect(repeatLabel("FREQ=WEEKLY;BYDAY=SU,MO")).toBe("wöchentlich Mo, So");
    expect(repeatLabel("FREQ=DAILY")).toBe("täglich");
    expect(repeatLabel(null)).toBeNull();
  });
});
