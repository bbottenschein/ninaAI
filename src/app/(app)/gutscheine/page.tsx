import type { Metadata } from "next";
import { berlinDate } from "@/lib/date";
import { getCurrentUser } from "@/features/auth/session";
import { loadRewards } from "@/features/rewards/queries";
import { RewardsView } from "@/features/rewards/rewards-view";
import { loadStreakView } from "@/features/streak/queries";

export const metadata: Metadata = { title: "Belohnungen" };

export default async function RewardsPage() {
  const user = await getCurrentUser();
  const today = berlinDate();
  const streak = await loadStreakView(user, today);
  if (!streak) return <p className="card text-muted">Es gibt noch keine Spielerin.</p>;
  const { rewards, types } = await loadRewards(streak.playerId);

  return (
    <RewardsView streak={streak} rewards={rewards} types={types} today={today} readOnly={user.role !== "player"} />
  );
}
