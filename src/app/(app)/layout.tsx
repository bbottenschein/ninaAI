import { getCurrentUser } from "@/features/auth/session";
import { loadRewards } from "@/features/rewards/queries";
import { RewardUnlock } from "@/features/rewards/reward-unlock";
import { TabBar } from "@/features/shell/tab-bar";
import { tabsFor } from "@/features/shell/tabs";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await getCurrentUser();
  // Neu verdiente Gutscheine zeigt die App beim nächsten Öffnen als Vollbild-Animation.
  const unseen =
    user.role === "player" ? (await loadRewards(user.id)).rewards.filter((r) => !r.seen_at).reverse() : [];

  return (
    <>
      <main className="mx-auto w-full max-w-lg px-5 pt-[calc(env(safe-area-inset-top)+1.5rem)] pb-32">
        {children}
      </main>
      <TabBar tabs={tabsFor(user.role)} />
      <RewardUnlock rewards={unseen} />
    </>
  );
}
