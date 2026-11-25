import { describe, expect, it } from "vitest";
import type { GeneratedLesson } from "./schema";
import { LessonValidationError, finalizeLesson, type ArticleOrigin } from "./validate";

const origins: ArticleOrigin[] = [
  { region: "de", source_name: "tagesschau", source_url: "https://t.de/1" },
  { region: "de", source_name: "tagesschau", source_url: "https://t.de/2" },
  { region: "int", source_name: "BBC News", source_url: "https://bbc.co.uk/1" },
];

function news(n: number) {
  return {
    title_en: `Title ${n}`,
    text_en: `Lars Klingbeil (Vice Chancellor) met the coalition committee. The budget was a compromise.`,
    title_de: `Titel ${n}`,
    text_de: `Lars Klingbeil (Vizekanzler) traf den Koalitionsausschuss. Der Haushalt war ein Kompromiss.`,
    terms: [
      { en: "coalition committee", de: "Koalitionsausschuss", explanation_en: "x", explanation_de: "x" },
      { en: "Bundesrat", de: "Bundesrat", explanation_en: "x", explanation_de: "x" },
    ],
    persons: [
      { name: "Lars Klingbeil", role_en: "Vice Chancellor", role_de: "Vizekanzler" },
      { name: "Olaf Scholz", role_en: null, role_de: null },
    ],
    vocab: ["compromise", "budget", "met", "was", "the", "missing"].map((word) => ({
      word,
      translation_de: "x",
      explanation: "x",
      example: "x",
    })),
  };
}

function question(news_index: number, difficulty: "easy" | "medium" | "hard") {
  return {
    news_index,
    difficulty,
    question_en: "Q?",
    question_de: "F?",
    options_en: ["A", "B", "C", "D"],
    options_de: ["A", "B", "C", "D"],
    correct_index: 2,
    explanation_en: "E",
    explanation_de: "E",
  };
}

function lesson(): GeneratedLesson {
  return {
    news: [news(1), news(2), news(3)],
    quiz: [question(0, "easy"), question(1, "easy"), question(2, "medium"), question(0, "hard")],
    tutor_questions: [
      { kind: "comprehension", question: "What was the news about?" },
      { kind: "opinion", question: "What do you think?" },
      { kind: "opinion", question: "How does this affect people in Germany?" },
      { kind: "opinion", question: "One too many?" },
    ],
  };
}

describe("finalizeLesson", () => {
  it("ergänzt die Herkunft und räumt Markierungen auf", () => {
    const result = finalizeLesson(lesson(), origins);
    expect(result.news.map((n) => n.region)).toEqual(["de", "de", "int"]);
    expect(result.news[2].source_url).toBe("https://bbc.co.uk/1");
    expect(result.news[0].terms.map((t) => t.en)).toEqual(["coalition committee"]);
    expect(result.news[0].persons.map((p) => p.name)).toEqual(["Lars Klingbeil"]);
    expect(result.news[0].vocab.map((v) => v.word)).toEqual(["compromise", "budget", "met", "was", "the"]);
    expect(result.tutor_questions).toHaveLength(3);
  });

  it("verlangt genau 3 Meldungen", () => {
    const l = lesson();
    l.news.pop();
    expect(() => finalizeLesson(l, origins)).toThrow(LessonValidationError);
  });

  it("verlangt mindestens eine Quizfrage pro Meldung", () => {
    const l = lesson();
    l.quiz[2] = question(0, "medium");
    expect(() => finalizeLesson(l, origins)).toThrow(/Nicht jede Meldung/);
  });

  it("verlangt den Schwierigkeitsmix 2 leicht, 1 mittel, 1 schwer", () => {
    const l = lesson();
    l.quiz[3] = question(0, "easy");
    expect(() => finalizeLesson(l, origins)).toThrow(/Schwierigkeitsmix/);
  });

  it("verlangt 4 eindeutige Antworten und einen gültigen Lösungsindex", () => {
    const l = lesson();
    l.quiz[0] = { ...question(0, "easy"), options_en: ["A", "B", "C"] };
    expect(() => finalizeLesson(l, origins)).toThrow(/4 Antworten/);

    const l2 = lesson();
    l2.quiz[0] = { ...question(0, "easy"), correct_index: 4 };
    expect(() => finalizeLesson(l2, origins)).toThrow(/correct_index/);

    const l3 = lesson();
    l3.quiz[0] = { ...question(0, "easy"), options_en: ["A", "a", "C", "D"] };
    expect(() => finalizeLesson(l3, origins)).toThrow(/eindeutig/);
  });

  it("verlangt mindestens 2 Tutor-Fragen", () => {
    const l = lesson();
    l.tutor_questions = [{ kind: "comprehension", question: "Only one?" }];
    expect(() => finalizeLesson(l, origins)).toThrow(/Tutor/);
  });
});
