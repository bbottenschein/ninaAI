import Link from "next/link";
import { formatLongDate } from "@/lib/date";
import { logout } from "@/features/auth/actions";
import { PageHeader } from "@/features/shell/page-header";
import { STEPS, isDayComplete, stepStates, type StepState } from "./steps";
import type { TodayData } from "./queries";
import { AutoRefresh } from "./auto-refresh";

/** Wohin ein Schritt führt, sobald er offen ist (Quiz und Tutor ab Phase 3). */
const STEP_HREF: Partial<Record<(typeof STEPS)[number]["key"], string>> = {
  news: "/news",
};

const STATE_LABEL: Record<StepState, string> = {
  done: "Erledigt",
  open: "Bereit",
  locked: "Gesperrt",
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

  return (
    <>
      <PageHeader
        subtitle={formatLongDate(date)}
        title={data.playerName ? `Heute bei ${data.playerName}` : `Hi ${greetingName}!`}
        action={
          <form action={logout}>
            <button className="text-sm text-muted underline">Abmelden</button>
          </form>
        }
      />

      {data.streak && (
        <section className="card mb-6 flex items-center justify-around text-center">
          <Stat value={data.streak.current} label="Streak" />
          <Stat value={data.streak.longest} label="Längste" />
          <Stat value={data.streak.jokers > 0 ? "1" : "–"} label="Joker" />
        </section>
      )}

      {(data.lessonPhase === "generating" || data.lessonPhase === "start") && (
        <div className="card mb-4 flex items-center gap-3 text-sm text-muted" role="status">
          <span className="size-4 shrink-0 animate-spin rounded-full border-2 border-border border-t-accent" />
          Die Lektion für heute wird gerade erstellt. Das dauert ein bis zwei Minuten …
          <AutoRefresh />
        </div>
      )}

      {data.lessonPhase === "unavailable" && (
        <p className="card mb-4 text-sm text-muted">
          Heute gibt es leider keine Lektion – die News konnten nicht geladen werden. Dieser Tag
          zählt nicht gegen deine Streak.
        </p>
      )}

      <ol className="flex flex-col gap-3">
        {STEPS.map((step, i) => {
          const state = data.lessonPhase === "ready" ? states[step.key] : "locked";
          const href = state !== "locked" ? STEP_HREF[step.key] : undefined;
          const description =
            step.key === "news" && data.lessonPhase === "ready" && state !== "done"
              ? `${Math.min(data.progress.newsRead, 3)}/3 Meldungen gelesen`
              : step.description;
          const content = (
            <>
              <span
                className={`flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                  state === "done"
                    ? "bg-success text-white"
                    : state === "open"
                      ? "bg-accent text-on-accent"
                      : "bg-border text-muted"
                }`}
              >
                {state === "done" ? "✓" : i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{step.title}</p>
                <p className="text-sm text-muted">{description}</p>
              </div>
              <span className="text-xs font-medium text-muted">
                {STATE_LABEL[state]}
                {href && " ›"}
              </span>
            </>
          );
          const className = `card flex items-center gap-4 ${state === "locked" ? "opacity-55" : ""}`;
          return (
            <li key={step.key}>
              {href ? (
                <Link href={href} className={`${className} transition active:scale-[0.99]`}>
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
        <p className="mt-6 text-center font-medium text-success">
          Geschafft für heute! 🎉
        </p>
      )}
    </>
  );
}

function Stat({ value, label }: { value: number | string; label: string }) {
  return (
    <div>
      <p className="text-2xl font-semibold tabular-nums">{value}</p>
      <p className="text-xs text-muted">{label}</p>
    </div>
  );
}
