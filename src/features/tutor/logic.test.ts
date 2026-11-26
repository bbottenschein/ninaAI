import { describe, expect, it } from "vitest";
import { conversationStage, openingMessage, validateHistory } from "./logic";

const questions = [
  { kind: "comprehension" as const, question: "What was the news about the budget?" },
  { kind: "opinion" as const, question: "What do you think?" },
];

describe("Tutor-Gespräch", () => {
  it("beginnt mit Begrüßung und erster Frage", () => {
    expect(openingMessage("Nina", questions).text).toBe(
      "Hi Nina! I'm your English tutor. Let's talk about today's news. What was the news about the budget?",
    );
  });

  it("zählt beantwortete Fragen und kennt die nächste", () => {
    const history = [
      { role: "tutor" as const, text: "Q1" },
      { role: "nina" as const, text: "A1" },
    ];
    expect(conversationStage(history, questions)).toEqual({
      answered: 1,
      total: 2,
      nextQuestion: "What do you think?",
      finished: false,
    });
    expect(
      conversationStage([...history, { role: "tutor", text: "Q2" }, { role: "nina", text: "A2" }], questions)
        .finished,
    ).toBe(true);
  });

  it("akzeptiert nur abwechselnde, nicht leere Nachrichten", () => {
    expect(validateHistory([{ role: "tutor", text: "Q" }, { role: "nina", text: " A " }], questions)).toEqual([
      { role: "tutor", text: "Q" },
      { role: "nina", text: "A" },
    ]);
    expect(validateHistory([{ role: "nina", text: "A" }], questions)).toBeNull();
    expect(validateHistory([{ role: "tutor", text: "Q" }, { role: "nina", text: "  " }], questions)).toBeNull();
    expect(validateHistory("kaputt", questions)).toBeNull();
    expect(validateHistory(Array(9).fill({ role: "tutor", text: "x" }), questions)).toBeNull();
  });

  it("kürzt sehr lange Antworten", () => {
    const long = "a".repeat(5000);
    const result = validateHistory([{ role: "tutor", text: "Q" }, { role: "nina", text: long }], questions);
    expect(result?.[1].text).toHaveLength(1500);
  });
});
