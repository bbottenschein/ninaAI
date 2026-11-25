import type { Metadata } from "next";
import { getCurrentUser } from "@/features/auth/session";
import { RewardsView } from "@/features/rewards/rewards-view";

export const metadata: Metadata = { title: "Gutscheine" };

export default async function RewardsPage() {
  const user = await getCurrentUser();
  return <RewardsView userId={user.id} />;
}
