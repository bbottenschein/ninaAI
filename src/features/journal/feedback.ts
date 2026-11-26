import { z } from "zod";

/** Strukturiertes Englisch-Feedback von Claude (SPEC-journal › Englisch-Feedback). */
export const FeedbackSchema = z.object({
  corrections: z
    .array(
      z.object({
        original: z.string().describe("The exact words from Nina's text that need a fix, copied verbatim (as short as possible)."),
        corrected: z.string().describe("The corrected English for exactly that part."),
        explanation_de: z.string().describe("Kurze, freundliche Erklärung auf Deutsch (1 Satz)."),
      }),
    )
    .describe("At most 3 corrections, the most useful ones. Empty if her English is fine."),
  praise_de: z.string().describe("Eine Sache, die im Englisch besonders gut war, auf Deutsch (1–2 Sätze)."),
  praise_quote: z.string().nullable().describe("Short quote from her text that shows it, or null."),
  vocab: z
    .array(
      z.object({
        word_en: z.string().describe("A better or new English word/expression she could use."),
        translation_de: z.string(),
        explanation: z.string().describe("Short explanation in simple English."),
        example: z.string().describe("An example sentence close to what she wrote."),
      }),
    )
    .describe("Up to 3 useful words or expressions."),
});

export type RawFeedback = z.infer<typeof FeedbackSchema>;

export type JournalFeedback = {
  corrections: { field: FieldKey; original: string; corrected: string; explanation_de: string }[];
  praise_de: string;
  praise_quote: string | null;
  vocab: { word_en: string; translation_de: string; explanation: string; example: string }[];
  /** Zu welcher Fassung des Eintrags das Feedback gehört. */
  for_updated_at: string;
};

export type FieldKey = "day_text" | "gratitude" | "highlight" | "tomorrow_focus";
export type EntryTexts = { day_text: string; gratitude: string[]; highlight: string; tomorrow_focus: string };

export const MAX_CORRECTIONS = 3;
export const MAX_VOCAB = 3;

function fieldOf(texts: EntryTexts, original: string): FieldKey | null {
  if (texts.day_text.includes(original)) return "day_text";
  if (texts.gratitude.some((g) => g.includes(original))) return "gratitude";
  if (texts.highlight.includes(original)) return "highlight";
  if (texts.tomorrow_focus.includes(original)) return "tomorrow_focus";
  return null;
}

/**
 * Prüft Claudes Feedback gegen Ninas Originaltext: Korrekturen nur, wenn die Stelle
 * wörtlich vorkommt und sich wirklich etwas ändert; höchstens 3 Korrekturen und 3 Vokabeln.
 */
export function normalizeFeedback(raw: RawFeedback, texts: EntryTexts, forUpdatedAt: string): JournalFeedback {
  const corrections: JournalFeedback["corrections"] = [];
  for (const c of raw.corrections) {
    const original = c.original.trim();
    const corrected = c.corrected.trim();
    if (!original || !corrected || original === corrected) continue;
    const field = fieldOf(texts, original);
    if (!field || corrections.some((x) => x.original === original)) continue;
    corrections.push({ field, original, corrected, explanation_de: c.explanation_de.trim() });
    if (corrections.length === MAX_CORRECTIONS) break;
  }
  const seen = new Set<string>();
  const vocab = raw.vocab
    .map((v) => ({ ...v, word_en: v.word_en.trim(), translation_de: v.translation_de.trim() }))
    .filter((v) => v.word_en && v.translation_de && !seen.has(v.word_en.toLowerCase()) && seen.add(v.word_en.toLowerCase()))
    .slice(0, MAX_VOCAB);
  const quote = raw.praise_quote?.trim() || null;
  return {
    corrections,
    praise_de: raw.praise_de.trim(),
    praise_quote: quote && fieldOf(texts, quote) ? quote : null,
    vocab,
    for_updated_at: forUpdatedAt,
  };
}

export type Segment = { text: string; fix?: { corrected: string; explanation_de: string; index: number } };

/** Teilt einen Text in Abschnitte, Korrekturen markiert (Original bleibt erhalten). */
export function markCorrections(text: string, corrections: JournalFeedback["corrections"]): Segment[] {
  const hits = corrections
    .map((c, index) => ({ c, index, start: text.indexOf(c.original) }))
    .filter((h) => h.start >= 0)
    .sort((a, b) => a.start - b.start);
  const segments: Segment[] = [];
  let cursor = 0;
  for (const h of hits) {
    if (h.start < cursor) continue;
    if (h.start > cursor) segments.push({ text: text.slice(cursor, h.start) });
    segments.push({ text: h.c.original, fix: { corrected: h.c.corrected, explanation_de: h.c.explanation_de, index: h.index } });
    cursor = h.start + h.c.original.length;
  }
  if (cursor < text.length) segments.push({ text: text.slice(cursor) });
  return segments;
}
