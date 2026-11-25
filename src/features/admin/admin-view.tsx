import { createClient } from "@/lib/supabase/server";
import { logout } from "@/features/auth/actions";
import { ComingSoon, PageHeader } from "@/features/shell/page-header";
import { formatDate, rewardStatus, type RewardRow } from "@/features/rewards/labels";
import { nextMilestone } from "@/features/rewards/milestones";

export async function AdminView() {
  const supabase = await createClient();
  const [{ data: streak }, { data: rewards }, { data: types }] = await Promise.all([
    supabase
      .from("streaks")
      .select("current_streak, longest_streak, jokers_available")
      .limit(1)
      .maybeSingle(),
    supabase
      .from("rewards")
      .select("id, type, milestone_day, earned_at, redeemed_at, fulfilled_at")
      .order("earned_at", { ascending: false }),
    supabase.from("reward_types").select("type, title"),
  ]);

  const titles = new Map((types ?? []).map((t) => [t.type, t.title]));
  const next = nextMilestone(streak?.current_streak ?? 0);

  return (
    <>
      <PageHeader
        title="Admin"
        action={
          <form action={logout}>
            <button className="text-sm text-muted underline">Abmelden</button>
          </form>
        }
      />

      <section className="card mb-6 grid grid-cols-2 gap-4">
        <Item label="Aktuelle Streak" value={streak?.current_streak ?? 0} />
        <Item label="Längste Streak" value={streak?.longest_streak ?? 0} />
        <Item label="Joker" value={streak?.jokers_available ? "verfügbar" : "keiner"} />
        <Item
          label="Nächster Meilenstein"
          value={`Tag ${next.day} (${next.types.map((t) => titles.get(t) ?? t).join(" + ")})`}
        />
      </section>

      <h2 className="mb-3 font-semibold">Gutscheine</h2>
      {rewards && rewards.length > 0 ? (
        <ul className="card mb-6 divide-y divide-border p-0">
          {(rewards as RewardRow[]).map((r) => (
            <li key={r.id} className="flex items-center justify-between px-5 py-3">
              <div>
                <p className="font-medium">{titles.get(r.type) ?? r.type}</p>
                <p className="text-sm text-muted">
                  Tag {r.milestone_day} · {formatDate(r.earned_at)}
                </p>
              </div>
              <span className="text-sm text-muted">{rewardStatus(r)}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mb-6 text-muted">Noch keine Gutscheine verdient.</p>
      )}

      <ComingSoon phase={4}>Gutscheine als erfüllt markieren und Texte bearbeiten</ComingSoon>
    </>
  );
}

function Item({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-xs text-muted">{label}</p>
      <p className="font-semibold">{value}</p>
    </div>
  );
}
