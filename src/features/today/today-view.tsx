import { formatLongDate } from "@/lib/date";
import { logout } from "@/features/auth/actions";
import { PageHeader } from "@/features/shell/page-header";
import { STEPS, isDayComplete, stepStates, type StepState } from "./steps";
import type { TodayData } from "./queries";

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

      {data.lessonStatus !== "ready" && (
        <p className="card mb-4 text-sm text-muted">
          {data.lessonStatus === "generating"
            ? "Die Lektion für heute wird gerade erstellt …"
            : "Die Lektion für heute ist noch nicht da. Ab Phase 2 wird sie jeden Morgen automatisch erstellt."}
        </p>
      )}

      <ol className="flex flex-col gap-3">
        {STEPS.map((step, i) => {
          const state = states[step.key];
          return (
            <li
              key={step.key}
              className={`card flex items-center gap-4 ${state === "locked" ? "opacity-55" : ""}`}
            >
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
                <p className="text-sm text-muted">{step.description}</p>
              </div>
              <span className="text-xs font-medium text-muted">{STATE_LABEL[state]}</span>
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
