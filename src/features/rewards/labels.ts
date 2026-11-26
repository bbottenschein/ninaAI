export type RewardRow = {
  id: string;
  type: string;
  milestone_day: number;
  earned_at: string;
  redeemed_at: string | null;
  fulfilled_at: string | null;
};

export function rewardStatus(r: RewardRow): "verdient" | "eingelöst" | "erfüllt" {
  if (r.fulfilled_at) return "erfüllt";
  if (r.redeemed_at) return "eingelöst";
  return "verdient";
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("de-DE", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Europe/Berlin",
  }).format(new Date(iso));
}

export const REWARD_EMOJI: Record<string, string> = {
  massage: "💆",
  surprise: "🎁",
  dinner: "🍽️",
};

export type RewardTypeRow = { type: string; title: string; description: string; interval_days: number };
