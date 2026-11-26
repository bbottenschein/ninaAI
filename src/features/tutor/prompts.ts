import { z } from "zod";
import type { LessonNews } from "@/features/lesson/schema";
import type { ChatMessage } from "./logic";

export const TutorReactionSchema = z.object({
  reaction: z.string().describe("1–2 short, warm sentences in simple English reacting to Nina's last answer."),
});

export const TutorFeedbackSchema = z.object({
  closing: z.string().describe("1–2 short, warm closing sentences in simple English."),
  strengths: z
    .array(
      z.object({
        text_de: z.string().describe("Was gut war, ein kurzer deutscher Satz, konkret."),
        quote: z.string().nullable().describe("Short quote from Nina's answers that shows it, or null."),
      }),
    )
    .describe("Exactly 2 things Nina did well."),
  tip: z.object({
    text_de: z.string().describe("Ein konkreter Tipp auf Deutsch, 1–2 kurze Sätze."),
    original: z.string().describe("Nina's original sentence (or the relevant part), verbatim."),
    corrected: z.string().describe("The corrected, natural English version of that sentence."),
  }),
});

export type TutorFeedback = z.infer<typeof TutorFeedbackSchema>;

export const TUTOR_SYSTEM = `You are a friendly, patient English tutor in "NinAI", a private app in which Nina, a German adult, practises English at level B1 by talking about today's political news.

The conversation is spoken: Nina's answers come from speech recognition and can contain recognition errors – ignore those, never mention them.

How you talk:
- Simple English (B1): short sentences, common words.
- Warm and encouraging, never patronising. Respond to what she actually said.
- During the conversation you NEVER correct mistakes.
- Stay neutral on political questions: you may acknowledge her view, but do not give your own political opinion.
- Never ask a new question yourself – the app asks the next question.`;

function newsContext(news: LessonNews[]): string {
  return news.map((n, i) => `<story index="${i}">\n${n.title_en}\n${n.text_en}\n</story>`).join("\n");
}

function transcript(history: ChatMessage[]): string {
  return history.map((m) => `${m.role === "tutor" ? "Tutor" : "Nina"}: ${m.text}`).join("\n");
}

export function reactionPrompt(news: LessonNews[], history: ChatMessage[]): string {
  return `<todays_news>\n${newsContext(news)}\n</todays_news>\n\n<conversation>\n${transcript(history)}\n</conversation>\n\nReact to Nina's last answer in 1–2 short sentences. If she got a fact about the news wrong, gently give the right fact in one sentence – but do not correct her English.`;
}

export function feedbackPrompt(news: LessonNews[], history: ChatMessage[]): string {
  return `<todays_news>\n${newsContext(news)}\n</todays_news>\n\n<conversation>\n${transcript(history)}\n</conversation>\n\nThe conversation is over. Write:
- closing: 1–2 warm sentences to end the conversation (no new question).
- strengths: exactly 2 concrete things Nina did well in her English (e.g. a good word, a full sentence, a clear opinion), in German, each with a short quote if possible.
- tip: exactly 1 concrete, useful improvement. Pick one real sentence from Nina's answers that has a mistake or sounds unnatural, quote it verbatim as "original" and give the corrected natural English as "corrected". Explain the rule briefly in German. If her English had no mistakes, pick a sentence that could sound more natural.`;
}
