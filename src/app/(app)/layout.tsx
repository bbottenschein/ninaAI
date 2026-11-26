import { getCurrentUser } from "@/features/auth/session";
import { BlossomRain } from "@/features/extras/blossom-rain";
import { loadRewards } from "@/features/rewards/queries";
import { RewardUnlock } from "@/features/rewards/reward-unlock";
import { ThemeSync } from "@/features/settings/theme-sync";
import { loadTheme } from "@/features/settings/queries";
import { TabBar } from "@/features/shell/tab-bar";
import { tabsFor } from "@/features/shell/tabs";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await getCurrentUser();
  // Neu verdiente Gutscheine zeigt die App beim nächsten Öffnen als Vollbild-Animation.
  const [unseen, theme] = await Promise.all([
    user.role === "player"
      ? loadRewards(user.id).then(({ rewards }) => rewards.filter((r) => !r.seen_at).reverse())
      : Promise.resolve([]),
    loadTheme(user.id),
  ]);

  return (
    <>
      <main className="mx-auto w-full max-w-lg px-5 pt-[calc(env(safe-area-inset-top)+1.5rem)] pb-32">
        {children}
      </main>
      <TabBar tabs={tabsFor(user.role)} />
      <ThemeSync theme={theme} />
      <RewardUnlock rewards={unseen} />
      {user.role === "player" && <BlossomRain />}
    </>
  );
}
