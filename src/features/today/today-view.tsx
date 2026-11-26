import Link from "next/link";
import { addDays, formatLongDate } from "@/lib/date";
import { logout } from "@/features/auth/actions";
import { Mouse } from "@/features/shell/mouse";
import { HeaderButton, PageHeader } from "@/features/shell/page-header";
import { STEPS, isDayComplete, stepStates, type StepKey, type StepState } from "./steps";
import type { TodayData } from "./queries";
import { AutoRefresh } from "./auto-refresh";
import { JokerNotice } from "@/features/streak/joker-notice";

/** Wohin ein Schritt führt, sobald er offen ist. */
const STEP_HREF: Partial<Record<StepKey, string>> = {
  news: "/news",
  quiz: "/quiz",
  tutor: "/tutor",
};

/** Jeder Schritt hat seine eigene Farbe und ein Symbol. */
const STEP_STYLE: Record<StepKey, { emoji: string; bubble: string }> = {
  news: { emoji: "📰", bubble: "bg-accent-soft" },
  quiz: { emoji: "🧠", bubble: "bg-lavender-soft" },
  tutor: { emoji: "💬", bubble: "bg-mint-soft" },
};

export function TodayView({
  date,
  greetingName,
  data,
}: {
  date: string;
  greetingName: string;
  data: TodayData;
}) {
  const states = stepStates(data.progress);
  const complete = isDayComplete(data.progress);
  const generating = data.lessonPhase === "generating" || data.lessonPhase === "start";

  return (
    <>
      <PageHeader
        icon={<Mouse mood={complete ? "party" : "happy"} className="size-14 shrink-0" />}
        subtitle={formatLongDate(date)}
        title={data.playerName ? `Heute bei ${data.playerName}` : `Hi ${greetingName}!`}
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

      {data.streak && (
        <Link href="/gutscheine" className="mb-6 grid grid-cols-3 gap-3 text-center transition active:scale-[0.98]">
          <Stat emoji="🔥" value={data.streak.current} label="Streak" tint="bg-accent-soft text-accent-ink" />
          <Stat emoji="🏆" value={data.streak.longest} label="Längste" tint="bg-sun-soft text-sun" />
          <Stat
            emoji="🃏"
            value={data.streak.jokers > 0 ? "1" : "–"}
            label={data.streak.jokers > 0 ? "Joker bereit" : `Joker in ${data.streak.daysToJoker}`}
            tint="bg-lavender-soft text-lavender"
          />
        </Link>
      )}

      {generating && (
        <div className="card mb-4 flex items-center gap-4" role="status">
          <Mouse mood="sleepy" className="size-14 shrink-0 animate-wiggle" />
          <div>
            <p className="font-bold">Die Maus sammelt gerade die News …</p>
            <p className="text-sm text-muted">Das dauert ein bis zwei Minuten.</p>
          </div>
          <AutoRefresh />
        </div>
      )}

      {data.lessonPhase === "unavailable" && (
        <div className="card mb-4 flex items-center gap-4">
          <Mouse mood="sleepy" className="size-14 shrink-0" />
          <p className="text-sm text-muted">
            Heute gibt es leider keine Lektion – die News konnten nicht geladen werden. Dieser Tag
            zählt nicht gegen deine Streak.
          </p>
        </div>
      )}

      <ol className="flex flex-col gap-3">
        {STEPS.map((step) => {
          const state = data.lessonPhase === "ready" ? states[step.key] : "locked";
          const href = state !== "locked" ? STEP_HREF[step.key] : undefined;
          const description =
            step.key === "news" && data.lessonPhase === "ready" && state !== "done"
              ? `${Math.min(data.progress.newsRead, 3)}/3 Meldungen gelesen`
              : step.description;
          const style = STEP_STYLE[step.key];

          const content = (
            <>
              <span
                className={`flex size-12 shrink-0 items-center justify-center rounded-2xl text-2xl ${
                  state === "done" ? "bg-mint-soft" : style.bubble
                } ${state === "locked" ? "grayscale" : ""}`}
                aria-hidden
              >
                {state === "done" ? "✅" : style.emoji}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-extrabold">{step.title}</p>
                <p className="text-sm text-muted">{description}</p>
              </div>
              <StateBadge state={state} linked={Boolean(href)} />
            </>
          );

          const className = `card flex items-center gap-4 ${state === "locked" ? "opacity-60 shadow-none" : ""}`;
          return (
            <li key={step.key}>
              {href ? (
                <Link
                  href={href}
                  className={`${className} transition hover:-translate-y-0.5 active:scale-[0.98]`}
                >
                  {content}
                </Link>
              ) : (
                <div className={className}>{content}</div>
              )}
            </li>
          );
        })}
      </ol>

      {complete && (
        <div className="card mt-6 animate-pop bg-accent-soft text-center">
          <Mouse mood="party" className="mx-auto size-20" />
          <p className="mt-2 text-lg font-extrabold">Geschafft für heute! 🎉</p>
          <p className="text-sm text-muted">
            {data.streak ? `Deine Streak steht jetzt bei ${data.streak.current} 🔥` : "Die Maus ist stolz auf dich."}
          </p>
        </div>
      )}
    </>
  );
}

function StateBadge({ state, linked }: { state: StepState; linked: boolean }) {
  if (state === "done") return <span className="chip bg-mint-soft text-mint">Erledigt</span>;
  if (state === "locked") return <span className="text-lg" aria-label="Gesperrt">🔒</span>;
  if (!linked) return <span className="chip bg-lavender-soft text-lavender">Bald da</span>;
  return (
    <span className="chip bg-accent text-on-accent">
      Los geht&apos;s ›
    </span>
  );
}

function Stat({
  emoji,
  value,
  label,
  tint,
}: {
  emoji: string;
  value: number | string;
  label: string;
  tint: string;
}) {
  return (
    <div className={`rounded-3xl px-2 py-3 ${tint}`}>
      <p className="text-lg" aria-hidden>
        {emoji}
      </p>
      <p className="text-2xl font-extrabold tabular-nums">{value}</p>
      <p className="text-xs font-bold">{label}</p>
    </div>
  );
}
