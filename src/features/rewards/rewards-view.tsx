import { Mascot } from "@/features/shell/mascot";
import { PageHeader } from "@/features/shell/page-header";
import { MotifText } from "@/features/shell/motif-text";
import { Meadow } from "@/features/streak/meadow";
import { buildPathway } from "@/features/streak/pathway";
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

/** Success-Bereich: Streak, Pathway (Blumenwiese bzw. Motiv des Designs), Erklärung und (aufklappbar) die Gutscheine. */
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
  const { current, longest, jokers } = streak.state;
  const next = nextMilestone(current);
  const titles = new Map(types.map((t) => [t.type, t.title]));
  const meadow = buildPathway({
    runDays: streak.runDays,
    current,
    today,
    todayDone: streak.todayDone,
    maxPast: 20,
  });
  const ready = rewards.filter((r) => rewardStatus(r) === "verdient").length;

  return (
    <>
      <PageHeader icon={<Mascot mood={current > 0 ? "happy" : "sleepy"} className="size-14 shrink-0" />} title="Success" />

      {/* Streak */}
      <section className="card mb-6 bg-accent-soft">
        <div className="flex items-center gap-4">
          <p className="text-6xl leading-none font-extrabold tabular-nums text-accent-ink">{current}</p>
          <div>
            <p className="text-lg font-extrabold">{current === 1 ? "Tag" : "Tage"} Streak 🔥</p>
            <p className="text-sm text-muted">
              {streak.todayDone ? (
                "Heute schon geschafft!"
              ) : current > 0 ? (
                "Bleib dran – heute zählt!"
              ) : (
                <MotifText
                  flower="Heute fängt deine Wiese an."
                  clean="Heute fängt dein Blätterpfad an."
                  dark="Heute fängt dein Sternenhimmel an."
                  cat="Heute fängt dein Pfotenpfad an."
                />
              )}
            </p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
          <p className="rounded-2xl bg-surface px-3 py-2">
            🏆 <span className="font-bold">Längste:</span> {longest}
          </p>
          <p className="rounded-2xl bg-surface px-3 py-2">
            🃏 <span className="font-bold">Joker:</span>{" "}
            {jokers > 0 ? "bereit" : `in ${streak.daysToJoker} ${streak.daysToJoker === 1 ? "Tag" : "Tagen"}`}
          </p>
        </div>
        <p className="mt-3 text-center font-bold">
          Noch {next.daysLeft} {next.daysLeft === 1 ? "Tag" : "Tage"} bis{" "}
          {next.types.map((t) => `${REWARD_EMOJI[t] ?? "🎁"} ${titles.get(t) ?? t}`).join(" + ")}
        </p>
      </section>

      {/* Pathway: Blumenwiese bzw. Motiv des Designs */}
      <h2 className="mb-2 font-extrabold">
        <MotifText flower="Deine Blumenwiese" clean="Dein Blätterpfad" dark="Dein Sternenhimmel" cat="Dein Pfotenpfad" />
      </h2>
      <section className="mb-6 rounded-3xl border border-border shadow-soft">
        <Meadow nodes={meadow.nodes} hiddenPast={meadow.hiddenPast} />
      </section>

      {/* Erklärung */}
      <h2 className="mb-2 font-extrabold">So funktioniert&apos;s</h2>
      <ul className="card mb-6 flex flex-col gap-2 text-sm">
        <li>
          <MotifText
            flower="🌸 Jeder geschaffte Tag lässt eine Blume blühen."
            clean="🍃 Jeder geschaffte Tag lässt ein Blatt wachsen."
            dark="⭐ Jeder geschaffte Tag lässt einen Stern leuchten."
            cat="🐾 Jeder geschaffte Tag hinterlässt eine Pfote."
          />
        </li>
        <li>
          🃏 Alle 10 Tage gibt es einen Joker – er rettet einen verpassten Tag und wird zum{" "}
          <MotifText flower="Glücksklee 🍀." clean="goldenen Blatt." dark="Mond 🌙." cat="Fischchen 🐟." />
        </li>
        {types.map((t) => (
          <li key={t.type}>
            {REWARD_EMOJI[t.type] ?? "🎁"} <span className="font-bold">{t.title}</span> – alle {t.interval_days}{" "}
            Streak-Tage
          </li>
        ))}
        <li className="text-muted">Verdiente Gutscheine bleiben dir, auch wenn die Streak mal reißt.</li>
      </ul>

      {/* Gutscheine, aufklappbar */}
      <details className="card group mb-6 p-0">
        <summary className="flex cursor-pointer list-none items-center gap-3 px-5 py-4 [&::-webkit-details-marker]:hidden">
          <span className="text-2xl" aria-hidden>
            🎁
          </span>
          <span className="flex-1 font-extrabold">Meine Gutscheine ({rewards.length})</span>
          {ready > 0 && <span className="chip bg-accent text-on-accent">{ready} bereit</span>}
          <span className="text-muted transition group-open:rotate-180" aria-hidden>
            ⌄
          </span>
        </summary>
        <div className="border-t border-border px-5 py-4">
          {rewards.length > 0 ? (
            <ul className="flex flex-col gap-3">
              {rewards.map((r) => {
                const status = rewardStatus(r);
                return (
                  <li key={r.id} className="flex items-center gap-3">
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-accent-soft text-2xl">
                      {REWARD_EMOJI[r.type] ?? "🎁"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-extrabold">{r.title}</p>
                      <p className="text-xs text-muted">
                        Tag {r.milestone_day} · {formatDate(r.earned_at)}
                      </p>
                      <span className={`chip mt-1 ${STATUS_CHIP[status]}`}>
                        {status === "verdient" ? "Bereit" : status === "eingelöst" ? "Eingelöst" : "Erfüllt ✓"}
                      </span>
                    </div>
                    {status === "verdient" && !readOnly && <RedeemButton id={r.id} title={r.title} />}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-center text-sm text-muted">
              Noch keine Gutscheine – dein erster wartet an Tag {nextMilestone(0).day}!
            </p>
          )}
        </div>
      </details>
    </>
  );
}
