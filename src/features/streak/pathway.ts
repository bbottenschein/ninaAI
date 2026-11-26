import { nextMilestone, rewardsAt, type RewardType } from "@/features/rewards/milestones";
import type { EvaluatedDay } from "./evaluate";

export type PathNode = {
  key: string;
  kind: "done" | "joker" | "today" | "future";
  /** Streak-Tag, den dieses Feld bedeutet (beim Joker: der gehaltene Stand). */
  streakDay: number;
  milestones: RewardType[];
  isToday: boolean;
};

const MAX_PAST = 10;
const MIN_FUTURE = 5;
const MAX_FUTURE = 30;

/**
 * Baut den Weg der aktuellen Streak-Runde: zurückliegende Felder (absolviert oder
 * Joker), den heutigen Tag und die kommenden Felder bis mindestens zur nächsten
 * Belohnung. Tage ohne Lektion erscheinen nicht – sie zählen ja nicht.
 */
export function buildPathway(input: {
  runDays: EvaluatedDay[];
  current: number;
  today: string;
  todayDone: boolean;
  /** Wie viele zurückliegende Felder sichtbar sind (Standard 10). */
  maxPast?: number;
}): { nodes: PathNode[]; hiddenPast: number } {
  const past: PathNode[] = input.runDays
    .filter((d) => d.result === "completed" || d.result === "joker")
    .map((d) => ({
      key: d.date,
      kind: d.result === "joker" ? "joker" : "done",
      streakDay: d.streakAfter,
      milestones: d.result === "completed" ? rewardsAt(d.streakAfter) : [],
      isToday: d.date === input.today,
    }));

  const visiblePast = past.slice(-(input.maxPast ?? MAX_PAST));
  const nodes: PathNode[] = [...visiblePast];

  let next = input.current + 1;
  if (!input.todayDone) {
    nodes.push({ key: "today", kind: "today", streakDay: next, milestones: rewardsAt(next), isToday: true });
    next += 1;
  }

  const goal = nextMilestone(input.todayDone ? input.current : input.current + 1).day;
  const end = Math.min(Math.max(goal, next + MIN_FUTURE - 1), next + MAX_FUTURE - 1);
  for (let day = next; day <= end; day++) {
    nodes.push({ key: `f${day}`, kind: "future", streakDay: day, milestones: rewardsAt(day), isToday: false });
  }

  return { nodes, hiddenPast: past.length - visiblePast.length };
}
