import { describe, expect, it } from "vitest";
import { applyAnswer, quizState } from "./logic";

const quiz = [{ correct_index: 0 }, { correct_index: 1 }, { correct_index: 2 }, { correct_index: 3 }];

describe("applyAnswer", () => {
  it("wertet richtige und falsche Antworten aus", () => {
    const first = applyAnswer([], quiz, 0, 0);
    expect(first).toEqual({ answers: [{ question: 0, choice: 0, correct: true }], done: false, score: 1 });
    if ("error" in first) throw new Error(first.error);
    const second = applyAnswer(first.answers, quiz, 1, 3);
    expect(second).toMatchObject({ done: false, score: 1 });
  });

  it("ist nach der vierten Antwort fertig – egal wie viele richtig sind", () => {
    let state = quizState([], 4);
    for (const q of [0, 1, 2, 3]) {
      const next = applyAnswer(state.answers, quiz, q, 3);
      if ("error" in next) throw new Error(next.error);
      state = next;
    }
    expect(state).toMatchObject({ done: true, score: 1 });
  });

  it("verlangt die Reihenfolge", () => {
    expect(applyAnswer([], quiz, 2, 0)).toEqual({ error: "Bitte die Fragen der Reihe nach beantworten." });
  });

  it("lässt beantwortete Fragen unverändert", () => {
    const answers = [{ question: 0, choice: 1, correct: false }];
    expect(applyAnswer(answers, quiz, 0, 0)).toEqual({ answers, done: false, score: 0 });
  });

  it("lehnt ungültige Fragen und Antworten ab", () => {
    expect(applyAnswer([], quiz, 9, 0)).toHaveProperty("error");
    expect(applyAnswer([], quiz, 0, 4)).toHaveProperty("error");
    expect(applyAnswer([], quiz, 0, 1.5)).toHaveProperty("error");
  });
});
