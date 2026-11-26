import { describe, expect, it } from "vitest";
import { average, bestDay, monthGrid, mondayOf, ratingTone, weekDates, yearAverages } from "./stats";

describe("Woche", () => {
  it("beginnt am Montag", () => {
    expect(mondayOf("2026-11-26")).toBe("2026-11-23");
    expect(mondayOf("2026-11-29")).toBe("2026-11-23"); // Sonntag
    expect(weekDates("2026-11-26")).toEqual([
      "2026-11-23", "2026-11-24", "2026-11-25", "2026-11-26", "2026-11-27", "2026-11-28", "2026-11-29",
    ]);
  });
});

describe("Kennzahlen", () => {
  const items = [
    { date: "2026-11-23", rating: 6 },
    { date: "2026-11-24", rating: 9 },
    { date: "2026-11-26", rating: 9 },
  ];
  it("berechnet Durchschnitt und besten Tag", () => {
    expect(average(items)).toBe(8);
    expect(bestDay(items)).toEqual({ date: "2026-11-26", rating: 9 });
    expect(average([])).toBeNull();
    expect(bestDay([])).toBeNull();
  });

  it("berechnet Monatsdurchschnitte und lässt leere Monate leer", () => {
    const year = yearAverages([...items, { date: "2026-01-10", rating: 4 }], 2026);
    expect(year[0]).toBe(4);
    expect(year[10]).toBe(8);
    expect(year[5]).toBeNull();
  });
});

describe("monthGrid", () => {
  it("legt den Monat in Wochen ab Montag an", () => {
    const grid = monthGrid(2026, 11); // 1.11.2026 ist ein Sonntag
    expect(grid[0]).toEqual([null, null, null, null, null, null, "2026-11-01"]);
    expect(grid.at(-1)).toEqual(["2026-11-30", null, null, null, null, null, null]);
    expect(grid.flat().filter(Boolean)).toHaveLength(30);
  });
});

describe("ratingTone", () => {
  it("ordnet Bewertungen fünf Rosatönen zu", () => {
    expect([1, 2, 3, 5, 7, 9, 10].map(ratingTone)).toEqual([0, 0, 1, 2, 3, 4, 4]);
  });
});
