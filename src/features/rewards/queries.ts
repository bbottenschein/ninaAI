import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { RewardRow, RewardTypeRow } from "./labels";

export type RewardWithType = RewardRow & { seen_at: string | null; title: string; description: string };

/** Gutscheine der Spielerin (neueste zuerst) samt Typen. */
export async function loadRewards(playerId: string) {
  const supabase = await createClient();
  const [{ data: rewards }, { data: types }] = await Promise.all([
    supabase
      .from("rewards")
      .select("id, type, milestone_day, earned_at, seen_at, redeemed_at, fulfilled_at")
      .eq("user_id", playerId)
      .order("earned_at", { ascending: false }),
    supabase.from("reward_types").select("type, title, description, interval_days").order("interval_days"),
  ]);
  const byType = new Map(((types ?? []) as RewardTypeRow[]).map((t) => [t.type, t]));
  return {
    rewards: ((rewards ?? []) as (RewardRow & { seen_at: string | null })[]).map((r) => ({
      ...r,
      title: byType.get(r.type)?.title ?? r.type,
      description: byType.get(r.type)?.description ?? "",
    })) as RewardWithType[],
    types: (types ?? []) as RewardTypeRow[],
  };
}
