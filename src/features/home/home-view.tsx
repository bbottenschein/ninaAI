import Link from "next/link";
import { addDays, formatLongDate } from "@/lib/date";
import { logout } from "@/features/auth/actions";
import { REWARD_EMOJI } from "@/features/rewards/labels";
import { nextMilestone } from "@/features/rewards/milestones";
import { Mouse } from "@/features/shell/mouse";
import { HeaderButton, PageHeader } from "@/features/shell/page-header";
import { JokerNotice } from "@/features/streak/joker-notice";
import { AutoRefresh } from "@/features/today/auto-refresh";
import type { TodayData } from "@/features/today/queries";
import { stepStates } from "@/features/today/steps";

/** Kopf, Daily-Learning-Status und Streak auf Home (SPEC-remind-me › Home). */
export function HomeHeader({ date, name, data }: { date: string; name: string; data: TodayData }) {
  const states = stepStates(data.progress);
  const doneSteps = Object.values(states).filter((s) => s === "done").length;
  const generating = data.lessonPhase === "generating" || data.lessonPhase === "start";

  let status: string;
  let button = "Weiter lernen";
  if (generating) status = "Die Maus sammelt gerade die News …";
  else if (data.lessonPhase === "unavailable") status = "Heute gibt es leider keine Lektion.";
  else if (doneSteps === 3) {
    status = "Erledigt – stark! 🎉";
    button = "Ansehen";
  } else if (doneSteps === 0) {
    status = "Deine 10 Minuten warten: News, Quiz, Tutor.";
    button = "Los geht's";
  } else status = `${doneSteps} von 3 Schritten geschafft`;

  const streak = data.streak;
  const next = nextMilestone(streak?.current ?? 0);

  return (
    <>
      <PageHeader
        icon={<Mouse mood={doneSteps === 3 ? "party" : "happy"} className="size-14 shrink-0" />}
        subtitle={formatLongDate(date)}
        title={`Hi ${name}!`}
        action={
          <form action={logout}>
            <HeaderButton>Abmelden</HeaderButton>
          </form>
        }
      />

      {data.jokerNotice && (
        <JokerNotice
          label={data.jokerNotice === addDays(date, -1) ? "gestern" : `am ${formatLongDate(data.jokerNotice)}`}
        />
      )}

      <section className="mb-3 grid grid-cols-[1fr_auto] items-center gap-3 card">
        <div>
          <p className="text-xs font-extrabold tracking-wide text-accent-ink uppercase">
            Daily Learning{data.playerName ? ` · ${data.playerName}` : ""}
          </p>
          <p className="mt-1 font-bold">{status}</p>
          <div className="mt-2 flex gap-1.5" aria-label={`${doneSteps} von 3 Schritten`}>
            {[0, 1, 2].map((i) => (
              <span key={i} className={`h-2 w-8 rounded-full ${i < doneSteps ? "bg-accent" : "bg-border"}`} />
            ))}
          </div>
          {generating && <AutoRefresh />}
        </div>
        <Link href="/learn" className="btn-primary px-4 py-2 text-sm whitespace-nowrap">
          {button} ›
        </Link>
      </section>

      {streak && (
        <Link href="/success" className="card mb-6 flex items-center gap-4 bg-accent-soft transition active:scale-[0.99]">
          <p className="text-4xl leading-none font-extrabold tabular-nums text-accent-ink">{streak.current}</p>
          <div className="min-w-0 flex-1 text-sm">
            <p className="font-extrabold">Tage Streak 🔥</p>
            <p className="text-muted">
              🃏 {streak.jokers > 0 ? "Joker bereit" : `Joker in ${streak.daysToJoker} ${streak.daysToJoker === 1 ? "Tag" : "Tagen"}`}
              {" · "}
              {REWARD_EMOJI[next.types[0]] ?? "🎁"} in {next.daysLeft} {next.daysLeft === 1 ? "Tag" : "Tagen"}
            </p>
          </div>
          <span className="text-muted" aria-hidden>
            ›
          </span>
        </Link>
      )}
    </>
  );
}
