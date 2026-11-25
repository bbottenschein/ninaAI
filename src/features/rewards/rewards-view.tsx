import { createClient } from "@/lib/supabase/server";
import { ComingSoon, PageHeader } from "@/features/shell/page-header";
import { formatDate, rewardStatus, type RewardRow } from "./labels";
import { nextMilestone } from "./milestones";

export async function RewardsView({ userId }: { userId: string }) {
  const supabase = await createClient();
  const [{ data: rewards }, { data: types }, { data: streak }] = await Promise.all([
    supabase
      .from("rewards")
      .select("id, type, milestone_day, earned_at, redeemed_at, fulfilled_at")
      .eq("user_id", userId)
      .order("earned_at", { ascending: false }),
    supabase.from("reward_types").select("type, title, description, interval_days"),
    supabase.from("streaks").select("current_streak").eq("user_id", userId).maybeSingle(),
  ]);

  const titles = new Map((types ?? []).map((t) => [t.type, t.title]));
  const next = nextMilestone(streak?.current_streak ?? 0);

  return (
    <>
      <PageHeader title="Meine Gutscheine" />

      <section className="card mb-6 bg-accent-soft">
        <p className="text-sm text-muted">Nächste Belohnung</p>
        <p className="text-lg font-semibold">
          Noch {next.daysLeft} {next.daysLeft === 1 ? "Tag" : "Tage"}:{" "}
          {next.types.map((t) => titles.get(t) ?? t).join(" + ")}
        </p>
      </section>

      {rewards && rewards.length > 0 ? (
        <ul className="mb-6 flex flex-col gap-3">
          {(rewards as RewardRow[]).map((r) => (
            <li key={r.id} className="card flex items-center justify-between">
              <div>
                <p className="font-semibold">{titles.get(r.type) ?? r.type}</p>
                <p className="text-sm text-muted">
                  Tag {r.milestone_day} · {formatDate(r.earned_at)}
                </p>
              </div>
              <span className="text-sm text-muted">{rewardStatus(r)}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mb-6 text-muted">Noch keine Gutscheine – bleib dran!</p>
      )}

      <ul className="mb-6 flex flex-col gap-2 text-sm text-muted">
        {(types ?? []).map((t) => (
          <li key={t.type}>
            <span className="font-medium text-foreground">{t.title}</span> – alle{" "}
            {t.interval_days} Streak-Tage
          </li>
        ))}
      </ul>

      <ComingSoon phase={4}>Pathway, Einlösen und Freischalt-Animation</ComingSoon>
    </>
  );
}
