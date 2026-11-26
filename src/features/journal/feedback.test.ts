import { describe, expect, it } from "vitest";
import { markCorrections, normalizeFeedback, type RawFeedback } from "./feedback";

const texts = {
  day_text: "Today I go to the office and I was very tired.",
  gratitude: ["my mum for calling me", "the sun"],
  highlight: "",
  tomorrow_focus: "I want to make sport.",
};

const raw = (over: Partial<RawFeedback> = {}): RawFeedback => ({
  corrections: [
    { original: "I go to the office", corrected: "I went to the office", explanation_de: "Vergangenheit: went." },
    { original: "make sport", corrected: "do sport", explanation_de: "Man sagt „do sport“." },
  ],
  praise_de: "Schön klar geschrieben!",
  praise_quote: "my mum for calling me",
  vocab: [{ word_en: "exhausted", translation_de: "erschöpft", explanation: "very tired", example: "I was exhausted." }],
  ...over,
});

describe("normalizeFeedback", () => {
  it("ordnet Korrekturen dem passenden Feld zu", () => {
    const fb = normalizeFeedback(raw(), texts, "t1");
    expect(fb.corrections.map((c) => [c.field, c.corrected])).toEqual([
      ["day_text", "I went to the office"],
      ["tomorrow_focus", "do sport"],
    ]);
    expect(fb.for_updated_at).toBe("t1");
  });

  it("verwirft Korrekturen, die nicht wörtlich im Text stehen oder nichts ändern", () => {
    const fb = normalizeFeedback(
      raw({
        corrections: [
          { original: "I goes home", corrected: "I go home", explanation_de: "x" },
          { original: "the sun", corrected: "the sun", explanation_de: "x" },
        ],
      }),
      texts,
      "t",
    );
    expect(fb.corrections).toEqual([]);
  });

  it("liefert höchstens 3 Korrekturen und 3 Vokabeln", () => {
    const many = ["Today", "I go", "office", "very tired"].map((o) => ({ original: o, corrected: `${o}!`, explanation_de: "x" }));
    const words = ["a", "b", "c", "d"].map((w) => ({ word_en: w, translation_de: w, explanation: "", example: "" }));
    const fb = normalizeFeedback(raw({ corrections: many, vocab: words }), texts, "t");
    expect(fb.corrections).toHaveLength(3);
    expect(fb.vocab).toHaveLength(3);
  });

  it("entfernt doppelte Vokabeln und ein Zitat, das nicht im Text steht", () => {
    const fb = normalizeFeedback(
      raw({
        praise_quote: "erfunden",
        vocab: [
          { word_en: "Exhausted", translation_de: "erschöpft", explanation: "", example: "" },
          { word_en: "exhausted", translation_de: "erschöpft", explanation: "", example: "" },
        ],
      }),
      texts,
      "t",
    );
    expect(fb.vocab).toHaveLength(1);
    expect(fb.praise_quote).toBeNull();
  });
});

describe("markCorrections", () => {
  it("markiert die korrigierten Stellen im Original", () => {
    const fb = normalizeFeedback(raw(), texts, "t");
    const segments = markCorrections(texts.day_text, fb.corrections);
    expect(segments.map((s) => (s.fix ? `[${s.text}→${s.fix.corrected}]` : s.text)).join("")).toBe(
      "Today [I go to the office→I went to the office] and I was very tired.",
    );
  });

  it("lässt Text ohne Korrekturen unverändert", () => {
    expect(markCorrections("All good.", [])).toEqual([{ text: "All good." }]);
  });
});
