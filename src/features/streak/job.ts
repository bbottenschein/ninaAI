import "server-only";
import { addDays } from "@/lib/date";
import { adminIds, sendPush } from "@/lib/push";
import { createAdminClient } from "@/lib/supabase/admin";
import { evaluateDays } from "./evaluate";
import { STREAK_COLUMNS, loadOutcomes, toRow, toState } from "./data";

export type NightlyResult = { userId: string; evaluated: number; rewards: number; streak: number };

/**
 * Nacht-Job: wertet für jede Spielerin alle Tage seit der letzten Auswertung bis
 * gestern aus (holt verpasste Läufe nach). Idempotent: Mehrfaches Ausführen ändert
 * nichts, Tage und Gutscheine werden nur einmal angelegt.
 */
export async function runNightly(today: string): Promise<NightlyResult[]> {
  const admin = createAdminClient();
  const yesterday = addDays(today, -1);
  const { data: rows, error } = await admin.from("streaks").select(STREAK_COLUMNS);
  if (error) throw error;

  const results: NightlyResult[] = [];
  for (const row of rows ?? []) {
    const start = toState(row);
    const outcomes = await loadOutcomes(admin, row.user_id, start.lastEvaluatedDate, yesterday);
    if (outcomes.length === 0) {
      results.push({ userId: row.user_id, evaluated: 0, rewards: 0, streak: start.current });
      continue;
    }

    const { state, days, rewards } = evaluateDays(start, outcomes);

    // Erst Tage und Gutscheine, zuletzt der Streak-Stand: Bricht der Job mittendrin ab,
    // rechnet der nächste Lauf vom alten Stand aus neu und überspringt Vorhandenes.
    const { error: dayError } = await admin.from("streak_days").upsert(
      days.map((d) => ({ user_id: row.user_id, date: d.date, result: d.result, streak_after: d.streakAfter })),
      { onConflict: "user_id,date" },
    );
    if (dayError) throw dayError;

    if (rewards.length > 0) {
      const { data: inserted, error: rewardError } = await admin
        .from("rewards")
        .upsert(
          rewards.map((r) => ({
            user_id: row.user_id,
            type: r.type,
            milestone_day: r.milestoneDay,
            streak_run_started_on: r.runStartedOn,
          })),
          { onConflict: "user_id,type,milestone_day,streak_run_started_on", ignoreDuplicates: true },
        )
        .select("type, milestone_day");
      if (rewardError) throw rewardError;
      // Nur wirklich neue Gutscheine melden (beim Nachholen kein doppelter Push).
      if (inserted && inserted.length > 0) await notifyEarned(row.user_id, inserted);
    }

    const { error: updateError } = await admin.from("streaks").update(toRow(state)).eq("user_id", row.user_id);
    if (updateError) throw updateError;

    results.push({ userId: row.user_id, evaluated: days.length, rewards: rewards.length, streak: state.current });
  }
  return results;
}

/** Benedikt bekommt Bescheid, wenn Nina einen Gutschein verdient hat. */
async function notifyEarned(userId: string, rewards: { type: string; milestone_day: number }[]) {
  try {
    const admin = createAdminClient();
    const [{ data: types }, { data: player }] = await Promise.all([
      admin.from("reward_types").select("type, title"),
      admin.from("profiles").select("name").eq("id", userId).maybeSingle(),
    ]);
    const titles = new Map((types ?? []).map((t) => [t.type, t.title]));
    const name = player?.name || "Nina";
    const list = rewards.map((r) => titles.get(r.type) ?? r.type).join(" + ");
    await sendPush(await adminIds(), {
      title: `🎉 ${name} hat einen Gutschein verdient`,
      body: `${list} – Streak-Tag ${rewards[0].milestone_day}`,
      url: "/admin",
      tag: "reward-earned",
    }, "rewards");
  } catch (error) {
    console.error("[streak] Benachrichtigung fehlgeschlagen", error);
  }
}
