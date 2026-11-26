"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { askStructured } from "@/lib/claude";
import { berlinDate } from "@/lib/date";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/features/auth/session";
import { applyResult } from "./quiz";

/** Speichert das Ergebnis einer Quizfrage für ein Wort. */
export async function answerVocab(id: string, correct: boolean): Promise<{ learned?: boolean; error?: string }> {
  const user = await getCurrentUser();
  const supabase = await createClient();
  const { data: word } = await supabase
    .from("vocab")
    .select("correct_streak, times_wrong, learned")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!word) return { error: "Wort nicht gefunden" };

  const next = applyResult(word, correct);
  const { error } = await supabase.from("vocab").update(next).eq("id", id).eq("user_id", user.id);
  if (error) return { error: "Konnte nicht gespeichert werden." };
  return { learned: next.learned };
}

export async function deleteVocab(id: string) {
  const user = await getCurrentUser();
  const supabase = await createClient();
  await supabase.from("vocab").delete().eq("id", id).eq("user_id", user.id);
  revalidatePath("/vokabeln");
}

const TranslationSchema = z.object({
  word_en: z.string().describe("The word in its dictionary base form (e.g. 'negotiate' for 'negotiated'), lower case unless a proper noun."),
  translation_de: z.string().describe("Die passende deutsche Übersetzung in diesem Satz (kurz)."),
  explanation: z.string().describe("A short explanation in simple English (B1), one sentence."),
});

/**
 * Nina tippt in den News auf ein Wort: Claude liefert Grundform, Übersetzung und
 * Erklärung passend zum Satz, das Wort landet in ihrer Sammlung.
 */
export async function addVocabFromNews(input: {
  word: string;
  sentence: string;
}): Promise<{ word?: string; translation?: string; error?: string }> {
  const user = await getCurrentUser();
  if (user.role !== "player") return { error: "Nur für die Spielerin" };
  const word = input.word.trim().slice(0, 60);
  const sentence = input.sentence.trim().slice(0, 600);
  if (!/\p{L}/u.test(word)) return { error: "Kein Wort ausgewählt" };

  try {
    const result = await askStructured({
      schema: TranslationSchema,
      system:
        "You help a German B1 learner of English build a vocabulary list. Answer only with the requested fields.",
      prompt: `Word: "${word}"\nSentence: "${sentence}"`,
      effort: "low",
      maxTokens: 1000,
    });

    const supabase = await createClient();
    const { error } = await supabase.from("vocab").insert({
      user_id: user.id,
      word_en: result.word_en.trim() || word,
      translation_de: result.translation_de.trim(),
      explanation: result.explanation.trim(),
      example: sentence,
      source_date: berlinDate(),
    });
    if (error?.code === "23505") return { error: `„${result.word_en}“ ist schon in deiner Sammlung.` };
    if (error) throw error;

    revalidatePath("/vokabeln");
    return { word: result.word_en, translation: result.translation_de };
  } catch (error) {
    console.error("[vocab] Wort hinzufügen", error);
    return { error: "Konnte gerade nicht hinzugefügt werden. Bitte nochmal versuchen." };
  }
}
