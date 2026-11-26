"use server";

import { revalidatePath } from "next/cache";
import { berlinDate } from "@/lib/date";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/features/auth/session";

export type NuggetInput = { id?: string; name: string; nugget: string; fromNews?: boolean };

/** Legt ein Knowledge Nugget an oder bearbeitet es. */
export async function saveNugget(input: NuggetInput): Promise<{ error?: string }> {
  const user = await getCurrentUser();
  if (user.role !== "player") return { error: "Nur für die Spielerin" };
  const name = input.name.trim();
  const nugget = input.nugget.trim();
  if (!name || !nugget) return { error: "Bitte Name und Knowledge Nugget ausfüllen." };
  if (name.length > 120 || nugget.length > 1000) return { error: "Der Text ist zu lang." };

  const supabase = await createClient();
  const { error } = input.id
    ? await supabase
        .from("knowledge_nuggets")
        .update({ name, nugget, updated_at: new Date().toISOString() })
        .eq("id", input.id)
        .eq("user_id", user.id)
    : await supabase.from("knowledge_nuggets").insert({
        user_id: user.id,
        name,
        nugget,
        source_date: input.fromNews ? berlinDate() : null,
      });
  if (error) {
    console.error("[knowledge] speichern", error);
    return { error: "Konnte nicht gespeichert werden." };
  }
  revalidatePath("/knowledge");
  return {};
}

export async function deleteNugget(id: string) {
  const user = await getCurrentUser();
  const supabase = await createClient();
  await supabase.from("knowledge_nuggets").delete().eq("id", id).eq("user_id", user.id);
  revalidatePath("/knowledge");
}
