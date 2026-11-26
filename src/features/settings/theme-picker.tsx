"use client";

import { useState, useTransition } from "react";
import { setTheme } from "./actions";
import { THEMES, type Theme } from "./theme";
import { applyTheme } from "./theme-dom";

/** Fünf Kacheln; jede Kachel zeigt sich selbst im jeweiligen Design (data-theme). */
export function ThemePicker({ initial }: { initial: Theme }) {
  const [current, setCurrent] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function choose(theme: Theme) {
    const previous = current;
    setCurrent(theme);
    setError(null);
    applyTheme(theme);
    startTransition(async () => {
      const r = await setTheme(theme).catch(() => ({ error: "Keine Verbindung – bitte nochmal versuchen." }));
      if (r.error) {
        setCurrent(previous);
        applyTheme(previous);
        setError(r.error);
      }
    });
  }

  return (
    <>
      <div role="radiogroup" aria-label="Design" className="mt-3 grid grid-cols-2 gap-3">
        {THEMES.map((t) => {
          const selected = current === t.key;
          return (
            <button
              key={t.key}
              type="button"
              role="radio"
              aria-checked={selected}
              data-theme={t.key}
              onClick={() => choose(t.key)}
              className={`flex flex-col gap-2 rounded-3xl border-2 bg-background p-3 text-left text-foreground transition active:scale-95 ${
                selected ? "border-accent ring-4 ring-accent-soft" : "border-border"
              } ${t.key === "auto" ? "col-span-2" : ""}`}
            >
              <span className="flex items-center justify-between">
                <span className="font-extrabold">
                  {t.emoji} {t.label}
                </span>
                {selected && <span className="chip bg-accent text-on-accent">✓</span>}
              </span>
              <span className="text-xs text-muted">{t.hint}</span>
              <span className="flex items-center gap-1.5" aria-hidden>
                <span className="h-5 flex-1 rounded-full bg-surface ring-1 ring-border" />
                <span className="size-5 rounded-full bg-accent" />
                <span className="size-5 rounded-full bg-accent-soft ring-1 ring-border" />
                <span className="size-5 rounded-full bg-lavender-soft ring-1 ring-border" />
              </span>
            </button>
          );
        })}
      </div>
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
    </>
  );
}
