"use server";

import { revalidatePath } from "next/cache";
import { berlinDate } from "@/lib/date";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/features/auth/session";

/** Markiert eine Meldung der heutigen Lektion als gelesen. */
export async function markNewsRead(
  date: string,
  index: number,
): Promise<{ read: number[] } | { error: string }> {
  const user = await getCurrentUser();
  if (user.role !== "player") return { error: "Nur für die Spielerin" };
  if (!Number.isInteger(index) || index < 0 || index > 2) return { error: "Ungültige Meldung" };
  // Fortschritt zählt nur für den heutigen Tag (z. B. Seite kurz vor Mitternacht geöffnet).
  if (date !== berlinDate()) return { error: "Ein neuer Tag hat begonnen – bitte neu laden." };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("mark_news_read", { p_date: date, p_index: index });
  if (error) {
    console.error("[news] mark_news_read", error);
    return { error: "Konnte nicht gespeichert werden. Bitte nochmal versuchen." };
  }

  revalidatePath("/", "layout");
  return { read: (data as number[] | null) ?? [] };
}
