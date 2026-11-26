export type VocabWord = {
  id: string;
  word_en: string;
  translation_de: string;
  explanation: string;
  example: string;
  source_date: string | null;
  correct_streak: number;
  times_wrong: number;
  learned: boolean;
  created_at: string;
};

export type Direction = "en-de" | "de-en";

export const ROUND_SIZE = 10;
/** Dreimal hintereinander richtig = gelernt (SPEC › Vokabelsammlung). */
export const LEARNED_AFTER = 3;

export type Rng = () => number;

/**
 * Wie oft ein Wort drankommt: Häufig falsche Wörter öfter, neue Wörter normal,
 * gelernte Wörter selten (aber nicht nie – zum Wiederholen).
 */
export function weight(w: Pick<VocabWord, "times_wrong" | "correct_streak" | "learned">): number {
  if (w.learned) return 0.4;
  return 1 + 2 * w.times_wrong + (w.correct_streak === 0 ? 0.5 : 0);
}

/** Zieht bis zu `size` verschiedene Wörter, gewichtet nach `weight`. */
export function pickRound<T extends Pick<VocabWord, "times_wrong" | "correct_streak" | "learned">>(
  words: T[],
  size: number,
  rng: Rng,
): T[] {
  const pool = [...words];
  const picked: T[] = [];
  while (picked.length < size && pool.length > 0) {
    const total = pool.reduce((sum, w) => sum + weight(w), 0);
    let r = rng() * total;
    let index = pool.length - 1;
    for (let i = 0; i < pool.length; i++) {
      r -= weight(pool[i]);
      if (r < 0) {
        index = i;
        break;
      }
    }
    picked.push(pool.splice(index, 1)[0]);
  }
  return picked;
}

export function answerOf(w: Pick<VocabWord, "word_en" | "translation_de">, direction: Direction): string {
  return (direction === "en-de" ? w.translation_de : w.word_en).trim();
}

export function promptOf(w: Pick<VocabWord, "word_en" | "translation_de">, direction: Direction): string {
  return (direction === "en-de" ? w.word_en : w.translation_de).trim();
}

function shuffle<T>(items: T[], rng: Rng): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/** Vier Antwortmöglichkeiten: die richtige plus drei verschiedene aus der Sammlung. */
export function buildOptions(
  target: Pick<VocabWord, "id" | "word_en" | "translation_de">,
  pool: Pick<VocabWord, "id" | "word_en" | "translation_de">[],
  direction: Direction,
  rng: Rng,
): string[] {
  const correct = answerOf(target, direction);
  const seen = new Set([correct.toLowerCase()]);
  const distractors: string[] = [];
  for (const w of shuffle(pool, rng)) {
    const option = answerOf(w, direction);
    if (w.id === target.id || !option || seen.has(option.toLowerCase())) continue;
    seen.add(option.toLowerCase());
    distractors.push(option);
    if (distractors.length === 3) break;
  }
  return shuffle([correct, ...distractors], rng);
}

/** Neuer Lernstand eines Wortes nach einer Antwort. */
export function applyResult(
  w: Pick<VocabWord, "correct_streak" | "times_wrong" | "learned">,
  correct: boolean,
): Pick<VocabWord, "correct_streak" | "times_wrong" | "learned"> {
  if (!correct) return { correct_streak: 0, times_wrong: w.times_wrong + 1, learned: false };
  const streak = w.correct_streak + 1;
  return { correct_streak: streak, times_wrong: w.times_wrong, learned: w.learned || streak >= LEARNED_AFTER };
}

/** Kleiner, reproduzierbarer Zufallsgenerator (für Tests und stabile Runden). */
export function seededRng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
