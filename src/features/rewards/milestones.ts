export type RewardType = "massage" | "surprise" | "dinner";

export const REWARD_INTERVALS: Record<RewardType, number> = {
  massage: 14,
  surprise: 30,
  dinner: 50,
};

/** Alle Gutscheine, die genau an diesem Streak-Tag fällig werden. */
export function rewardsAt(
  streakDay: number,
  intervals: Record<RewardType, number> = REWARD_INTERVALS,
): RewardType[] {
  if (streakDay <= 0) return [];
  return (Object.keys(intervals) as RewardType[]).filter(
    (type) => streakDay % intervals[type] === 0,
  );
}

/** Nächster Meilenstein nach dem aktuellen Streak-Tag (für „Noch X Tage …“). */
export function nextMilestone(
  currentStreak: number,
  intervals: Record<RewardType, number> = REWARD_INTERVALS,
): { day: number; daysLeft: number; types: RewardType[] } {
  const day = Math.min(
    ...Object.values(intervals).map((i) => (Math.floor(currentStreak / i) + 1) * i),
  );
  return { day, daysLeft: day - currentStreak, types: rewardsAt(day, intervals) };
}
