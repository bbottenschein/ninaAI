import type { Metadata } from "next";
import { getCurrentUser } from "@/features/auth/session";
import { createClient } from "@/lib/supabase/server";
import type { VocabWord } from "@/features/vocab/quiz";
import { VocabScreen } from "@/features/vocab/vocab-screen";

export const metadata: Metadata = { title: "Vokabeln" };

export default async function VocabPage() {
  const user = await getCurrentUser();
  const supabase = await createClient();
  const { data } = await supabase
    .from("vocab")
    .select("id, word_en, translation_de, explanation, example, source_date, correct_streak, times_wrong, learned, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  return <VocabScreen words={(data ?? []) as VocabWord[]} />;
}
