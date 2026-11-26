"use server";

import { revalidatePath } from "next/cache";
import { adminIds, sendPush } from "@/lib/push";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, requireAdmin } from "@/features/auth/session";

/** Spielerin löst einen verdienten Gutschein ein (DB-Funktion prüft Besitz und Status). */
export async function redeemReward(id: string): Promise<{ error?: string }> {
  const user = await getCurrentUser();
  if (user.role !== "player") return { error: "Nur für die Spielerin" };
  const supabase = await createClient();
  const { data: reward, error } = await supabase.rpc("redeem_reward", { p_reward_id: id });
  if (error) return { error: "Konnte nicht eingelöst werden." };

  // Benedikt bekommt Bescheid – ein Fehler beim Push ändert nichts am Einlösen.
  try {
    const { data: type } = await supabase.from("reward_types").select("title").eq("type", reward.type).maybeSingle();
    await sendPush(await adminIds(), {
      title: `💌 ${user.name} löst einen Gutschein ein`,
      body: `${type?.title ?? reward.type} (Streak-Tag ${reward.milestone_day})`,
      url: "/admin",
      tag: "reward-redeemed",
    });
  } catch (pushError) {
    console.error("[rewards] Benachrichtigung fehlgeschlagen", pushError);
  }
  revalidatePath("/gutscheine");
  revalidatePath("/admin");
  return {};
}

/** Freischalt-Animation gesehen. */
export async function markRewardsSeen() {
  const supabase = await createClient();
  await supabase.rpc("mark_rewards_seen");
  revalidatePath("/", "layout");
}

/** Admin markiert einen eingelösten Gutschein als erfüllt. */
export async function fulfillReward(id: string): Promise<{ error?: string }> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.rpc("fulfill_reward", { p_reward_id: id });
  if (error) return { error: "Konnte nicht als erledigt markiert werden." };
  revalidatePath("/admin");
  revalidatePath("/gutscheine");
  return {};
}

/** Admin bearbeitet Titel und Beschreibung eines Gutscheins. */
export async function updateRewardType(
  _prev: { ok?: boolean; error?: string },
  form: FormData,
): Promise<{ ok?: boolean; error?: string }> {
  await requireAdmin();
  const type = String(form.get("type") ?? "");
  const title = String(form.get("title") ?? "").trim();
  const description = String(form.get("description") ?? "").trim();
  if (!title) return { error: "Der Titel darf nicht leer sein." };
  if (title.length > 80 || description.length > 300) return { error: "Text ist zu lang." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("reward_types")
    .update({ title, description, updated_at: new Date().toISOString() })
    .eq("type", type);
  if (error) return { error: "Konnte nicht gespeichert werden." };
  revalidatePath("/admin");
  revalidatePath("/gutscheine");
  return { ok: true };
}
