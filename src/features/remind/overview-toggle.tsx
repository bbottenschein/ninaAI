"use client";

import { useState, useTransition } from "react";
import { setDailyOverview } from "./actions";

/** Schalter für den Tagesüberblick um 07:30 (standardmäßig aus). */
export function OverviewToggle({ initial }: { initial: boolean }) {
  const [on, setOn] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function toggle() {
    const next = !on;
    setOn(next);
    setError(null);
    startTransition(async () => {
      const result = await setDailyOverview(next);
      if (result.error) {
        setOn(!next);
        setError(result.error);
      }
    });
  }

  return (
    <section className="card mt-6">
      <div className="flex items-center gap-3">
        <span className="text-2xl" aria-hidden>
          ☀️
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-extrabold">Tagesüberblick um 07:30</p>
          <p className="text-sm text-muted">Ein Push wie „Heute: 3 Aufgaben, 1 überfällig“. Am Wochenende nur Life Mode.</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={on}
          aria-label="Tagesüberblick"
          disabled={pending}
          onClick={toggle}
          className={`relative h-8 w-14 shrink-0 rounded-full transition-colors ${on ? "bg-accent" : "bg-border"}`}
        >
          <span
            className={`absolute top-1 left-1 size-6 rounded-full bg-surface shadow-soft transition-transform ${on ? "translate-x-6" : ""}`}
          />
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
    </section>
  );
}
