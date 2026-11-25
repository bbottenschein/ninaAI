import { containsWord } from "./match";
import type { GeneratedLesson, LessonNews, StoredLesson } from "./schema";

export type ArticleOrigin = {
  region: "de" | "int";
  source_name: string;
  source_url: string;
};

export class LessonValidationError extends Error {
  constructor(message: string) {
    super(`Lektion ungültig: ${message}`);
    this.name = "LessonValidationError";
  }
}

const MAX_VOCAB = 5;
const MAX_TUTOR = 3;

function fail(message: string): never {
  throw new LessonValidationError(message);
}

/**
 * Prüft die von Claude erzeugte Lektion gegen die Regeln der SPEC und ergänzt
 * die Herkunft der Meldungen.
 *
 * - Strukturfehler (falsche Anzahl, fehlende Abdeckung, kaputte Antworten)
 *   lassen die Erzeugung fehlschlagen – der nächste Versuch macht es neu.
 * - Markierungen (Begriffe, Personen, Vokabeln), die nicht im Text vorkommen,
 *   werden still entfernt: Sie ließen sich ohnehin nicht antippen.
 */
export function finalizeLesson(generated: GeneratedLesson, origins: ArticleOrigin[]): StoredLesson {
  if (origins.length !== 3) fail(`3 Quellmeldungen erwartet, ${origins.length} erhalten`);
  if (generated.news.length !== 3) fail(`3 Meldungen erwartet, ${generated.news.length} erhalten`);

  const news: LessonNews[] = generated.news.map((item, i) => {
    for (const field of ["title_en", "text_en", "title_de", "text_de"] as const) {
      if (!item[field].trim()) fail(`Meldung ${i + 1}: ${field} ist leer`);
    }
    return {
      ...item,
      terms: item.terms.filter(
        (t) => containsWord(item.text_en, t.en) || containsWord(item.text_de, t.de),
      ),
      persons: item.persons.filter(
        (p) => containsWord(item.text_en, p.name) || containsWord(item.text_de, p.name),
      ),
      vocab: item.vocab.filter((v) => containsWord(item.text_en, v.word)).slice(0, MAX_VOCAB),
      ...origins[i],
    };
  });

  if (generated.quiz.length !== 4) fail(`4 Quizfragen erwartet, ${generated.quiz.length} erhalten`);
  const covered = new Set<number>();
  const difficulty = { easy: 0, medium: 0, hard: 0 };
  generated.quiz.forEach((q, i) => {
    const label = `Quizfrage ${i + 1}`;
    if (!Number.isInteger(q.news_index) || q.news_index < 0 || q.news_index > 2) {
      fail(`${label}: news_index ${q.news_index} ungültig`);
    }
    if (q.options_en.length !== 4 || q.options_de.length !== 4) fail(`${label}: 4 Antworten erwartet`);
    if (!Number.isInteger(q.correct_index) || q.correct_index < 0 || q.correct_index > 3) {
      fail(`${label}: correct_index ${q.correct_index} ungültig`);
    }
    if (new Set(q.options_en.map((o) => o.trim().toLowerCase())).size !== 4) {
      fail(`${label}: Antworten nicht eindeutig`);
    }
    covered.add(q.news_index);
    difficulty[q.difficulty] += 1;
  });
  if (covered.size !== 3) fail("Nicht jede Meldung hat eine Quizfrage");
  if (difficulty.easy !== 2 || difficulty.medium !== 1 || difficulty.hard !== 1) {
    fail(`Schwierigkeitsmix 2/1/1 erwartet, erhalten ${JSON.stringify(difficulty)}`);
  }

  const tutor = generated.tutor_questions.filter((q) => q.question.trim()).slice(0, MAX_TUTOR);
  if (tutor.length < 2) fail("Mindestens 2 Tutor-Fragen erwartet");

  return { news, quiz: generated.quiz, tutor_questions: tutor };
}
