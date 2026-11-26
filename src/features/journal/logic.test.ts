import { describe, expect, it } from "vitest";
import { bloom, isEditable, showHomeCard, validateEntry, writableDates } from "./logic";

// Donnerstag 26.11.2026 (Winterzeit, UTC+1)
const at = (berlinTime: string, date = "2026-11-26") => new Date(`${date}T${berlinTime}:00+01:00`);

describe("Zeitfenster", () => {
  it("lässt heute bearbeiten und gestern bis 12:00", () => {
    expect(isEditable("2026-11-26", at("23:59"))).toBe(true);
    expect(isEditable("2026-11-25", at("11:59"))).toBe(true);
    expect(isEditable("2026-11-25", at("12:00"))).toBe(false);
    expect(isEditable("2026-11-24", at("08:00"))).toBe(false);
  });

  it("lässt keine Einträge für die Zukunft zu", () => {
    expect(isEditable("2026-11-27", at("23:00"))).toBe(false);
  });

  it("bietet vormittags heute und gestern an, nachmittags nur heute", () => {
    expect(writableDates(at("09:00"))).toEqual(["2026-11-26", "2026-11-25"]);
    expect(writableDates(at("14:00"))).toEqual(["2026-11-26"]);
  });
});

describe("showHomeCard", () => {
  it("zeigt die ruhige Karte ab 18:00 oder wenn es schon einen Eintrag gibt", () => {
    expect(showHomeCard(at("17:59"), false)).toBe(false);
    expect(showHomeCard(at("18:00"), false)).toBe(true);
    expect(showHomeCard(at("10:00"), true)).toBe(true);
  });
});

describe("validateEntry", () => {
  const base = { rating: 7, mood_word: "calm", day_text: " Good day. ", gratitude: ["tea", "", " sun "], highlight: "", tomorrow_focus: "" };

  it("säubert die Eingaben", () => {
    expect(validateEntry(base)).toEqual({
      entry: { rating: 7, mood_word: "calm", day_text: "Good day.", gratitude: ["tea", "sun"], highlight: "", tomorrow_focus: "" },
    });
  });

  it("verlangt Bewertung, Tagestext und mindestens eine Dankbarkeit", () => {
    expect(validateEntry({ ...base, rating: 0 })).toHaveProperty("error");
    expect(validateEntry({ ...base, rating: 11 })).toHaveProperty("error");
    expect(validateEntry({ ...base, day_text: "  " })).toHaveProperty("error");
    expect(validateEntry({ ...base, gratitude: ["", " "] })).toHaveProperty("error");
  });

  it("ignoriert unbekannte Stimmungswörter und kürzt auf 3 Dankbarkeiten", () => {
    const result = validateEntry({ ...base, mood_word: "angry", gratitude: ["a", "b", "c", "d"] });
    expect(result).toMatchObject({ entry: { mood_word: null, gratitude: ["a", "b", "c"] } });
  });

  it("akzeptiert sehr kurze Einträge", () => {
    expect(validateEntry({ ...base, day_text: "Ok.", gratitude: ["sleep"] })).toHaveProperty("entry");
  });
});

describe("bloom", () => {
  it("öffnet die Blume mit der Bewertung", () => {
    expect(bloom(1)).toBe(0);
    expect(bloom(10)).toBe(1);
    expect(bloom(5.5)).toBeCloseTo(0.5);
  });
});
