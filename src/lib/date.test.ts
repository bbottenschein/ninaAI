import { describe, expect, it } from "vitest";
import { addDays, berlinDate, berlinHour, berlinParts, berlinToUtc, formatLongDate, weekday } from "./date";

describe("berlinDate", () => {
  it("nutzt Winterzeit (UTC+1): 23:30 UTC ist schon der nächste Tag", () => {
    expect(berlinDate(new Date("2026-11-25T23:30:00Z"))).toBe("2026-11-26");
    expect(berlinDate(new Date("2026-11-25T22:59:59Z"))).toBe("2026-11-25");
  });

  it("nutzt Sommerzeit (UTC+2): 22:00 UTC ist schon der nächste Tag", () => {
    expect(berlinDate(new Date("2026-07-01T22:00:00Z"))).toBe("2026-07-02");
    expect(berlinDate(new Date("2026-07-01T21:59:59Z"))).toBe("2026-07-01");
  });

  it("stimmt in der Nacht der Zeitumstellung", () => {
    // 29.03.2026: 02:00 MEZ → 03:00 MESZ
    expect(berlinDate(new Date("2026-03-28T23:30:00Z"))).toBe("2026-03-29");
    // 25.10.2026: 03:00 MESZ → 02:00 MEZ
    expect(berlinDate(new Date("2026-10-24T22:30:00Z"))).toBe("2026-10-25");
  });
});

describe("addDays", () => {
  it("rechnet über Monats- und Jahresgrenzen", () => {
    expect(addDays("2026-11-30", 1)).toBe("2026-12-01");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("ist unabhängig von der Zeitumstellung", () => {
    expect(addDays("2026-03-28", 1)).toBe("2026-03-29");
    expect(addDays("2026-03-29", 1)).toBe("2026-03-30");
  });
});

describe("formatLongDate", () => {
  it("formatiert auf Deutsch", () => {
    expect(formatLongDate("2026-11-25")).toBe("Mittwoch, 25. November");
  });
});

describe("berlinHour", () => {
  it("rechnet Winter- und Sommerzeit um", () => {
    expect(berlinHour(new Date("2026-11-25T04:00:00Z"))).toBe(5);
    expect(berlinHour(new Date("2026-07-01T03:00:00Z"))).toBe(5);
    expect(berlinHour(new Date("2026-11-25T23:30:00Z"))).toBe(0);
  });
});

describe("berlinToUtc", () => {
  it("rechnet Winter- und Sommerzeit um", () => {
    expect(berlinToUtc("2026-11-27", "15:00").toISOString()).toBe("2026-11-27T14:00:00.000Z");
    expect(berlinToUtc("2026-07-01", "09:00").toISOString()).toBe("2026-07-01T07:00:00.000Z");
  });

  it("stimmt an den Tagen der Zeitumstellung", () => {
    expect(berlinToUtc("2026-03-29", "09:00").toISOString()).toBe("2026-03-29T07:00:00.000Z");
    expect(berlinToUtc("2026-10-25", "09:00").toISOString()).toBe("2026-10-25T08:00:00.000Z");
    expect(berlinToUtc("2026-03-29", "00:30").toISOString()).toBe("2026-03-28T23:30:00.000Z");
  });

  it("ist die Umkehrung von berlinParts", () => {
    expect(berlinParts(berlinToUtc("2026-12-31", "23:45"))).toEqual({ date: "2026-12-31", time: "23:45" });
  });
});

describe("weekday", () => {
  it("liefert den Wochentag", () => {
    expect(weekday("2026-11-28")).toBe(6); // Samstag
    expect(weekday("2026-11-30")).toBe(1); // Montag
  });
});
