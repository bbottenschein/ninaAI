import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { EMPTY_STREAK, JOKER_EVERY, evaluateDays, type EvaluatedDay, type StreakState } from "./evaluate";
import { STREAK_COLUMNS, loadOutcomes, toState } from "./data";

export type StreakView = {
  playerId: string;
  playerName: string;
  /** Vorläufiger Stand inkl. heute, falls heute schon absolviert (SPEC › Sofort-Anzeige). */
  state: StreakState;
  todayDone: boolean;
  daysToJoker: number;
  /** Tage der aktuellen Runde (gebucht + vorläufig), chronologisch. */
  runDays: EvaluatedDay[];
  /** Datum, an dem ein Joker die Streak gerettet hat – solange der Hinweis offen ist. */
  jokerNotice: string | null;
};

/**
 * Streak der Spielerin für die Anzeige. Der Admin sieht die Streak der Spielerin.
 * Pro Request nur einmal geladen.
 */
export const loadStreakView = cache(
  async (viewer: { id: string; role: "player" | "admin" }, today: string): Promise<StreakView | null> => {
    const supabase = await createClient();

    let player = { id: viewer.id, name: "" };
    if (viewer.role === "admin") {
      const { data } = await supabase.from("profiles").select("id, name").eq("role", "player").limit(1).maybeSingle();
      if (!data) return null;
      player = data;
    }

    const { data: row } = await supabase.from("streaks").select(STREAK_COLUMNS).eq("user_id", player.id).maybeSingle();
    const stored = row ? toState(row) : EMPTY_STREAK;

    // Noch nicht gebuchte Tage bis heute: gestern & Co. wie der Nacht-Job, heute nur, wenn absolviert.
    const outcomes = await loadOutcomes(supabase, player.id, stored.lastEvaluatedDate, today);
    const todayOutcome = outcomes.find((o) => o.date === today);
    const todayDone = todayOutcome?.outcome === "completed";
    const provisional = evaluateDays(
      stored,
      outcomes.filter((o) => o.date !== today || todayDone),
    );

    const { state } = provisional;
    let runDays: EvaluatedDay[] = [];
    if (state.runStartedOn) {
      const { data: days } = await supabase
        .from("streak_days")
        .select("date, result, streak_after")
        .eq("user_id", player.id)
        .gte("date", state.runStartedOn)
        .order("date");
      runDays = [
        ...(days ?? []).map((d) => ({ date: d.date, result: d.result, streakAfter: d.streak_after })),
        ...provisional.days.filter((d) => d.date >= state.runStartedOn!),
      ];
    }

    return {
      playerId: player.id,
      playerName: player.name,
      state,
      todayDone,
      daysToJoker: state.jokers > 0 ? 0 : JOKER_EVERY - (state.current % JOKER_EVERY),
      runDays,
      jokerNotice: !stored.jokerNoticeSeen && stored.jokerUsedOn ? stored.jokerUsedOn : null,
    };
  },
);
