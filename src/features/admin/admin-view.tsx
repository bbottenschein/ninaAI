import { logout } from "@/features/auth/actions";
import { HeaderButton, PageHeader } from "@/features/shell/page-header";
import { REWARD_EMOJI, formatDate, rewardStatus } from "@/features/rewards/labels";
import { nextMilestone } from "@/features/rewards/milestones";
import type { RewardTypeRow } from "@/features/rewards/labels";
import type { RewardWithType } from "@/features/rewards/queries";
import type { StreakView } from "@/features/streak/queries";
import { FulfillButton } from "./fulfill-button";
import { RewardTypeForm } from "./reward-type-form";

export function AdminView({
  streak,
  rewards,
  types,
}: {
  streak: StreakView | null;
  rewards: RewardWithType[];
  types: RewardTypeRow[];
}) {
  const titles = new Map(types.map((t) => [t.type, t.title]));
  const next = nextMilestone(streak?.state.current ?? 0);
  const open = rewards.filter((r) => rewardStatus(r) === "eingelöst");

  return (
    <>
      <PageHeader
        title="Admin"
        subtitle={streak ? `${streak.playerName}s Fortschritt` : undefined}
        action={
          <form action={logout}>
            <HeaderButton>Abmelden</HeaderButton>
          </form>
        }
      />

      {streak && (
        <section className="mb-6 grid grid-cols-2 gap-3">
          <Item label="Aktuelle Streak" value={`${streak.state.current} 🔥`} tint="bg-accent-soft" />
          <Item label="Längste Streak" value={`${streak.state.longest} 🏆`} tint="bg-sun-soft" />
          <Item
            label="Joker"
            value={streak.state.jokers > 0 ? "verfügbar 🃏" : `in ${streak.daysToJoker} Tagen`}
            tint="bg-lavender-soft"
          />
          <Item
            label="Nächster Meilenstein"
            value={`Tag ${next.day} ${next.types.map((t) => REWARD_EMOJI[t]).join("")}`}
            tint="bg-mint-soft"
          />
        </section>
      )}
      {streak?.state.jokerUsedOn && (
        <p className="mb-6 text-sm text-muted">Letzter Joker eingesetzt am {formatDate(streak.state.jokerUsedOn)}.</p>
      )}

      {open.length > 0 && (
        <section className="card mb-6 bg-sun-soft">
          <p className="font-extrabold">🔔 {open.length} Gutschein(e) warten auf dich</p>
          <p className="text-sm text-muted">Nina hat eingelöst – markiere sie als erledigt, sobald du sie erfüllt hast.</p>
        </section>
      )}

      <h2 className="mb-3 font-extrabold">Gutscheine</h2>
      {rewards.length > 0 ? (
        <ul className="card mb-8 divide-y divide-border p-0">
          {rewards.map((r) => {
            const status = rewardStatus(r);
            return (
              <li key={r.id} className="flex items-center justify-between gap-3 px-5 py-3">
                <div className="min-w-0">
                  <p className="font-bold">
                    {REWARD_EMOJI[r.type] ?? "🎁"} {titles.get(r.type) ?? r.type}
                  </p>
                  <p className="text-xs text-muted">
                    Tag {r.milestone_day} · verdient {formatDate(r.earned_at)}
                    {r.redeemed_at && ` · eingelöst ${formatDate(r.redeemed_at)}`}
                    {r.fulfilled_at && ` · erfüllt ${formatDate(r.fulfilled_at)}`}
                  </p>
                </div>
                {status === "eingelöst" ? (
                  <FulfillButton id={r.id} />
                ) : (
                  <span className={`chip ${status === "erfüllt" ? "bg-mint-soft text-mint" : "bg-accent-soft text-accent-ink"}`}>
                    {status}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="card mb-8 text-muted">Noch keine Gutscheine verdient.</p>
      )}

      <h2 className="mb-3 font-extrabold">Gutschein-Texte</h2>
      <div className="flex flex-col gap-3">
        {types.map((t) => (
          <RewardTypeForm key={t.type} type={t} />
        ))}
      </div>
    </>
  );
}

function Item({ label, value, tint }: { label: string; value: string; tint: string }) {
  return (
    <div className={`rounded-3xl px-4 py-3 ${tint}`}>
      <p className="text-xs font-bold text-muted">{label}</p>
      <p className="font-extrabold">{value}</p>
    </div>
  );
}
