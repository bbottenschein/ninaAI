import { describe, expect, it } from "vitest";
import { annotate } from "./annotate";

describe("annotate", () => {
  it("markiert Begriffe beim ersten Vorkommen", () => {
    const segments = annotate("The Bundesrat voted. The Bundesrat agreed.", [
      { kind: "term", needle: "Bundesrat", index: 0 },
    ]);
    expect(segments).toEqual([
      { text: "The " },
      { text: "Bundesrat", mark: { kind: "term", index: 0 } },
      { text: " voted. The Bundesrat agreed." },
    ]);
  });

  it("markiert Personen bei jedem Vorkommen", () => {
    const segments = annotate("Merz spoke. Later Merz left.", [
      { kind: "person", needle: "Merz", index: 0 },
    ]);
    expect(segments.filter((s) => s.mark).length).toBe(2);
  });

  it("achtet auf Wortgrenzen und ignoriert Groß-/Kleinschreibung", () => {
    const segments = annotate("In fact, the Act passed.", [{ kind: "vocab", needle: "act", index: 0 }]);
    expect(segments).toEqual([
      { text: "In fact, the " },
      { text: "Act", mark: { kind: "vocab", index: 0 } },
      { text: " passed." },
    ]);
  });

  it("lässt bei Überlappung die längere Markierung gewinnen", () => {
    const segments = annotate("The coalition committee met.", [
      { kind: "vocab", needle: "coalition", index: 0 },
      { kind: "term", needle: "coalition committee", index: 0 },
    ]);
    expect(segments).toEqual([
      { text: "The " },
      { text: "coalition committee", mark: { kind: "term", index: 0 } },
      { text: " met." },
    ]);
  });

  it("gibt den Text unverändert zurück, wenn nichts passt", () => {
    expect(annotate("Nothing here.", [{ kind: "term", needle: "Bundestag", index: 0 }])).toEqual([
      { text: "Nothing here." },
    ]);
  });

  it("findet Umlaute an Wortgrenzen", () => {
    const segments = annotate("Der Koalitionsausschuss tagte über Nacht.", [
      { kind: "term", needle: "Koalitionsausschuss", index: 0 },
    ]);
    expect(segments[1]).toEqual({ text: "Koalitionsausschuss", mark: { kind: "term", index: 0 } });
  });
});
