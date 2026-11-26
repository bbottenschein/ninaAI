import "server-only";
import { createClient } from "@/lib/supabase/server";

export type Compliment = { id: string; text_en: string; created_by: "system" | "admin"; active: boolean; created_at: string };

/** Alle Komplimente für den Admin-Bereich, eigene zuerst. */
export async function loadCompliments(): Promise<Compliment[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("compliments")
    .select("id, text_en, created_by, active, created_at")
    .order("created_by")
    .order("created_at", { ascending: false });
  return (data ?? []) as Compliment[];
}
