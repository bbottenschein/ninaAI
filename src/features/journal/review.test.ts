import { describe, expect, it } from "vitest";
import { monthNameEn, previousMonth, reviewStats, shouldCreateReview } from "./review";

describe("previousMonth", () => {
  it("liefert den Vormonat, auch über den Jahreswechsel", () => {
    expect(previousMonth("2026-12-01")).toEqual({ month: "2026-11-01", from: "2026-11-01", to: "2026-11-30" });
    expect(previousMonth("2027-01-15")).toEqual({ month: "2026-12-01", from: "2026-12-01", to: "2026-12-31" });
    expect(previousMonth("2028-03-01").to).toBe("2028-02-29");
  });
});

describe("shouldCreateReview", () => {
  const first = (time: string) => new Date(`2026-12-01T${time}:00+01:00`);
  it("startet am Monatsersten ab 07:00", () => {
    expect(shouldCreateReview(first("06:59"), false, 5)).toBe(false);
    expect(shouldCreateReview(first("07:00"), false, 5)).toBe(true);
  });
  it("holt einen fehlenden Rückblick an späteren Tagen nach", () => {
    expect(shouldCreateReview(new Date("2026-12-03T05:00:00+01:00"), false, 5)).toBe(true);
  });
  it("erzeugt nichts ohne Einträge oder wenn es den Rückblick schon gibt", () => {
    expect(shouldCreateReview(first("09:00"), false, 0)).toBe(false);
    expect(shouldCreateReview(first("09:00"), true, 5)).toBe(false);
  });
});

describe("reviewStats", () => {
  it("berechnet Durchschnitt und besten Tag", () => {
    expect(reviewStats([{ date: "2026-11-02", rating: 6 }, { date: "2026-11-09", rating: 9 }])).toEqual({
      average: 7.5,
      best: { date: "2026-11-09", rating: 9 },
      days: 2,
    });
  });
  it("benennt den Monat auf Englisch", () => {
    expect(monthNameEn("2026-11-01")).toBe("November 2026");
  });
});
