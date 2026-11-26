import { Mouse } from "@/features/shell/mouse";
import { PageHeader } from "@/features/shell/page-header";
import { buildPathway } from "@/features/streak/pathway";
import { PathwayView } from "@/features/streak/pathway-view";
import type { StreakView } from "@/features/streak/queries";
import { REWARD_EMOJI, formatDate, rewardStatus } from "./labels";
import { nextMilestone } from "./milestones";
import type { RewardTypeRow } from "./labels";
import type { RewardWithType } from "./queries";
import { RedeemButton } from "./redeem-button";

const STATUS_CHIP = {
  verdient: "bg-accent-soft text-accent-ink",
  eingelöst: "bg-sun-soft text-sun",
  erfüllt: "bg-mint-soft text-mint",
} as const;

export function RewardsView({
  streak,
  rewards,
  types,
  today,
  readOnly = false,
}: {
  streak: StreakView;
  rewards: RewardWithType[];
  types: RewardTypeRow[];
  today: string;
  readOnly?: boolean;
}) {
  const { current } = streak.state;
  const next = nextMilestone(current);
  const titles = new Map(types.map((t) => [t.type, t.title]));
  const path = buildPathway({ runDays: streak.runDays, current, today, todayDone: streak.todayDone });

  return (
    <>
      <PageHeader
        icon={<Mouse className="size-14 shrink-0" />}
        title="Belohnungen"
        subtitle={`${current} ${current === 1 ? "Tag" : "Tage"} Streak 🔥`}
      />

      <section className="card mb-6 bg-accent-soft text-center">
        <p className="text-sm font-bold text-accent-ink">Deine nächste Belohnung</p>
        <p className="mt-1 text-xl font-extrabold">
          Noch {next.daysLeft} {next.daysLeft === 1 ? "Tag" : "Tage"} bis{" "}
          {next.types.map((t) => `${REWARD_EMOJI[t] ?? "🎁"} ${titles.get(t) ?? t}`).join(" + ")}
        </p>
        <p className="mt-1 text-sm text-muted">
          {streak.state.jokers > 0
            ? "🃏 Dein Joker fängt einen verpassten Tag auf."
            : `🃏 Nächster Joker in ${streak.daysToJoker} ${streak.daysToJoker === 1 ? "Tag" : "Tagen"}.`}
        </p>
      </section>

      <h2 className="mb-2 font-extrabold">Dein Weg</h2>
      <section className="card mb-8 overflow-hidden">
        <PathwayView nodes={path.nodes} hiddenPast={path.hiddenPast} />
      </section>

      <h2 className="mb-3 font-extrabold">Meine Gutscheine</h2>
      {rewards.length > 0 ? (
        <ul className="mb-6 flex flex-col gap-3">
          {rewards.map((r) => {
            const status = rewardStatus(r);
            return (
              <li key={r.id} className="card flex items-center gap-4">
                <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-accent-soft text-3xl">
                  {REWARD_EMOJI[r.type] ?? "🎁"}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-extrabold">{r.title}</p>
                  <p className="text-xs text-muted">
                    Tag {r.milestone_day} · {formatDate(r.earned_at)}
                  </p>
                  <span className={`chip mt-1.5 ${STATUS_CHIP[status]}`}>
                    {status === "verdient" ? "Bereit" : status === "eingelöst" ? "Eingelöst" : "Erfüllt ✓"}
                  </span>
                </div>
                {status === "verdient" && !readOnly && <RedeemButton id={r.id} title={r.title} />}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="card mb-6 text-center text-muted">Noch keine Gutscheine – deine erste Belohnung wartet auf Tag 14!</p>
      )}

      <h2 className="mb-2 font-extrabold">So funktioniert&apos;s</h2>
      <ul className="card mb-6 flex flex-col gap-2 text-sm">
        {types.map((t) => (
          <li key={t.type}>
            {REWARD_EMOJI[t.type] ?? "🎁"} <span className="font-bold">{t.title}</span> – alle {t.interval_days}{" "}
            Streak-Tage
          </li>
        ))}
        <li>🃏 Alle 10 Streak-Tage gibt es einen Joker für einen verpassten Tag.</li>
        <li className="text-muted">Verdiente Gutscheine bleiben dir, auch wenn die Streak mal reißt.</li>
      </ul>
    </>
  );
}
