import type { Metadata } from "next";
import { berlinDate } from "@/lib/date";
import { vapidConfig } from "@/lib/env.server";
import { PushSettings } from "@/features/notifications/push-settings";
import { requireAdmin } from "@/features/auth/session";
import { AdminView } from "@/features/admin/admin-view";
import { ComplimentAdmin } from "@/features/extras/compliment-admin";
import { loadCompliments } from "@/features/extras/queries";
import { loadRewards } from "@/features/rewards/queries";
import { loadStreakView } from "@/features/streak/queries";

export const metadata: Metadata = { title: "Admin" };

export default async function AdminPage() {
  const user = await requireAdmin();
  const streak = await loadStreakView(user, berlinDate());
  const [{ rewards, types }, compliments] = await Promise.all([
    streak ? loadRewards(streak.playerId) : Promise.resolve({ rewards: [], types: [] }),
    loadCompliments(),
  ]);
  return (
    <>
      <AdminView streak={streak} rewards={rewards} types={types} />
      <ComplimentAdmin compliments={compliments} />
      <PushSettings
        publicKey={vapidConfig()?.publicKey ?? null}
        title="Benachrichtigungen"
        description="Wenn Nina einen Gutschein verdient oder einlöst und wenn sie dir eine Love Note schickt."
      />
    </>
  );
}
