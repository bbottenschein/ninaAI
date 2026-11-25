import { z } from "zod";

// ---------------------------------------------------------------------------
// Was Claude liefert (Structured Output). Herkunft (Quelle, URL, Region) kommt
// nicht von der KI, sondern wird aus den ausgewählten Feed-Meldungen ergänzt.
// ---------------------------------------------------------------------------

const TermSchema = z.object({
  en: z.string().describe("The term exactly as it appears in text_en (verbatim substring)."),
  de: z.string().describe("The term exactly as it appears in text_de (verbatim substring)."),
  explanation_en: z.string().describe("One or two short, simple English sentences (B1)."),
  explanation_de: z.string().describe("Ein bis zwei kurze, einfache deutsche Sätze."),
});

const PersonSchema = z.object({
  name: z.string().describe("Full name exactly as written in both texts."),
  role_en: z
    .string()
    .nullable()
    .describe("Current office/role in English, ONLY if stated in the source article, else null."),
  role_de: z
    .string()
    .nullable()
    .describe("Dasselbe Amt auf Deutsch, nur wenn im Quellartikel genannt, sonst null."),
});

const VocabSchema = z.object({
  word: z.string().describe("The word or short phrase exactly as it appears in text_en."),
  translation_de: z.string(),
  explanation: z.string().describe("Short explanation in simple English."),
  example: z.string().describe("The full sentence from text_en that contains the word."),
});

const GeneratedNewsSchema = z.object({
  title_en: z.string(),
  text_en: z.string().describe("4–6 short sentences, B1 English."),
  title_de: z.string(),
  text_de: z.string().describe("Dieselbe Meldung auf Deutsch, 4–6 kurze Sätze."),
  terms: z.array(TermSchema),
  persons: z.array(PersonSchema),
  vocab: z.array(VocabSchema),
});

const QuizQuestionSchema = z.object({
  news_index: z.number().int().describe("0, 1 or 2 – the news item this question is about."),
  difficulty: z.enum(["easy", "medium", "hard"]),
  question_en: z.string(),
  question_de: z.string(),
  options_en: z.array(z.string()).describe("Exactly 4 answer options."),
  options_de: z.array(z.string()).describe("The same 4 options in German, same order."),
  correct_index: z.number().int().describe("Index (0–3) of the correct option."),
  explanation_en: z.string(),
  explanation_de: z.string(),
});

const TutorQuestionSchema = z.object({
  kind: z.enum(["comprehension", "opinion"]),
  question: z.string().describe("Question in simple English."),
});

export const GeneratedLessonSchema = z.object({
  news: z.array(GeneratedNewsSchema).describe("Exactly 3 items, in the order of the articles given."),
  quiz: z.array(QuizQuestionSchema).describe("Exactly 4 questions."),
  tutor_questions: z.array(TutorQuestionSchema).describe("2 or 3 questions."),
});

export type GeneratedLesson = z.infer<typeof GeneratedLessonSchema>;

/** Auswahl der Meldungen: Kandidaten-IDs nach Relevanz sortiert. */
export const RankingSchema = z.object({
  german: z.array(z.string()).describe("IDs of German candidates, most relevant first (up to 6)."),
  international: z
    .array(z.string())
    .describe("IDs of international candidates, most relevant first (up to 4)."),
});

// ---------------------------------------------------------------------------
// Was gespeichert wird (daily_lessons.news / quiz / tutor_questions)
// ---------------------------------------------------------------------------

export type Term = z.infer<typeof TermSchema>;
export type Person = z.infer<typeof PersonSchema>;
export type Vocab = z.infer<typeof VocabSchema>;

export type LessonNews = z.infer<typeof GeneratedNewsSchema> & {
  region: "de" | "int";
  source_name: string;
  source_url: string;
};

export type QuizQuestion = z.infer<typeof QuizQuestionSchema>;
export type TutorQuestion = z.infer<typeof TutorQuestionSchema>;

export type StoredLesson = {
  news: LessonNews[];
  quiz: QuizQuestion[];
  tutor_questions: TutorQuestion[];
};
