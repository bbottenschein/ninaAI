import { describe, expect, it } from "vitest";
import { applyResult, buildOptions, pickRound, seededRng, weight } from "./quiz";

const word = (id: string, en: string, de: string, extra: Partial<{ times_wrong: number; correct_streak: number; learned: boolean }> = {}) => ({
  id,
  word_en: en,
  translation_de: de,
  times_wrong: 0,
  correct_streak: 0,
  learned: false,
  ...extra,
});

describe("applyResult", () => {
  it("zählt richtige Antworten hintereinander und markiert nach 3 als gelernt", () => {
    let w = { correct_streak: 0, times_wrong: 0, learned: false };
    w = applyResult(w, true);
    w = applyResult(w, true);
    expect(w.learned).toBe(false);
    w = applyResult(w, true);
    expect(w).toEqual({ correct_streak: 3, times_wrong: 0, learned: true });
  });

  it("setzt bei einer falschen Antwort zurück und zählt den Fehler", () => {
    expect(applyResult({ correct_streak: 4, times_wrong: 1, learned: true }, false)).toEqual({
      correct_streak: 0,
      times_wrong: 2,
      learned: false,
    });
  });
});

describe("weight", () => {
  it("lässt oft falsche Wörter häufiger und gelernte seltener drankommen", () => {
    const fresh = weight({ times_wrong: 0, correct_streak: 0, learned: false });
    const wrong = weight({ times_wrong: 3, correct_streak: 0, learned: false });
    const learned = weight({ times_wrong: 0, correct_streak: 3, learned: true });
    expect(wrong).toBeGreaterThan(fresh);
    expect(learned).toBeLessThan(fresh);
  });
});

describe("pickRound", () => {
  it("zieht höchstens 10 verschiedene Wörter", () => {
    const words = Array.from({ length: 25 }, (_, i) => word(`w${i}`, `en${i}`, `de${i}`));
    const round = pickRound(words, 10, seededRng(1));
    expect(round).toHaveLength(10);
    expect(new Set(round.map((w) => w.id)).size).toBe(10);
  });

  it("nimmt alle Wörter, wenn es weniger als 10 sind", () => {
    const words = [word("a", "a", "A"), word("b", "b", "B")];
    expect(pickRound(words, 10, seededRng(1))).toHaveLength(2);
  });

  it("wählt oft falsche Wörter deutlich häufiger", () => {
    const words = [
      word("hard", "hard", "schwer", { times_wrong: 5 }),
      ...Array.from({ length: 19 }, (_, i) => word(`w${i}`, `en${i}`, `de${i}`, { learned: true, correct_streak: 3 })),
    ];
    let hits = 0;
    for (let seed = 0; seed < 200; seed++) {
      if (pickRound(words, 3, seededRng(seed)).some((w) => w.id === "hard")) hits++;
    }
    expect(hits).toBeGreaterThan(180);
  });
});

describe("buildOptions", () => {
  const pool = [
    word("1", "debt", "Schulden"),
    word("2", "compromise", "Kompromiss"),
    word("3", "trade", "Handel"),
    word("4", "vote", "Abstimmung"),
    word("5", "ballot", "Abstimmung"),
  ];

  it("enthält die richtige Antwort und drei verschiedene andere", () => {
    const options = buildOptions(pool[0], pool, "en-de", seededRng(3));
    expect(options).toHaveLength(4);
    expect(options).toContain("Schulden");
    expect(new Set(options.map((o) => o.toLowerCase())).size).toBe(4);
  });

  it("fragt in Richtung DE→EN nach dem englischen Wort", () => {
    const options = buildOptions(pool[1], pool, "de-en", seededRng(3));
    expect(options).toContain("compromise");
    expect(options).not.toContain("Kompromiss");
  });

  it("kommt mit kleinen Sammlungen aus", () => {
    expect(buildOptions(pool[0], pool.slice(0, 2), "en-de", seededRng(1)).sort()).toEqual(["Kompromiss", "Schulden"]);
  });
});
