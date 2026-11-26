"use client";

import { useState, useTransition } from "react";
import { setPushPreference } from "./actions";
import type { PushPref, PushPrefKey } from "./prefs";
import { Switch } from "./switch";

/** Schalter pro Push-Art. Wirken nur, wenn Benachrichtigungen auf dem Gerät erlaubt sind. */
export function PushPreferences({ prefs, initial }: { prefs: PushPref[]; initial: Record<PushPrefKey, boolean> }) {
  const [values, setValues] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function toggle(key: PushPrefKey) {
    const next = !values[key];
    setValues((v) => ({ ...v, [key]: next }));
    setError(null);
    startTransition(async () => {
      const r = await setPushPreference(key, next);
      if (r.error) {
        setValues((v) => ({ ...v, [key]: !next }));
        setError(r.error);
      }
    });
  }

  return (
    <section className="card mt-3 flex flex-col divide-y-2 divide-border py-2">
      {prefs.map((p) => (
        <div key={p.key} className="flex items-center gap-3 py-3">
          <span className="text-xl" aria-hidden>
            {p.emoji}
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-bold">{p.label}</p>
            <p className="text-xs text-muted">{p.hint}</p>
          </div>
          <Switch on={values[p.key]} label={p.label} onToggle={() => toggle(p.key)} />
        </div>
      ))}
      {error && <p className="pt-2 text-sm text-danger">{error}</p>}
    </section>
  );
}
