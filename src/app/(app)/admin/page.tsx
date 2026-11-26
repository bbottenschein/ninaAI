import type { Metadata } from "next";
import { berlinDate } from "@/lib/date";
import { requireAdmin } from "@/features/auth/session";
import { AdminView } from "@/features/admin/admin-view";
import { loadRewards } from "@/features/rewards/queries";
import { loadStreakView } from "@/features/streak/queries";

export const metadata: Metadata = { title: "Admin" };

export default async function AdminPage() {
  const user = await requireAdmin();
  const streak = await loadStreakView(user, berlinDate());
  const { rewards, types } = streak ? await loadRewards(streak.playerId) : { rewards: [], types: [] };
  return <AdminView streak={streak} rewards={rewards} types={types} />;
}
