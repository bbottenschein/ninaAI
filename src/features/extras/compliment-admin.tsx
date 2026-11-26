"use client";

import { useActionState, useState, useTransition } from "react";
import { addCompliment, setComplimentActive, updateCompliment } from "./actions";
import { COMPLIMENT_MAX } from "./compliments";
import type { Compliment } from "./queries";

/** Admin: Komplimente hinzufügen, bearbeiten, deaktivieren. */
export function ComplimentAdmin({ compliments }: { compliments: Compliment[] }) {
  const [state, action, pending] = useActionState(addCompliment, {});
  const [open, setOpen] = useState(false);
  const activeCount = compliments.filter((c) => c.active).length;

  return (
    <section className="mb-6">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="mb-3 flex w-full items-center justify-between text-left"
      >
        <h2 className="text-lg font-extrabold">🌸 Komplimente</h2>
        <span className="text-sm font-bold text-muted">
          {activeCount} aktiv {open ? "▴" : "▾"}
        </span>
      </button>
      {open && (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted">
            Erscheinen beim Schütteln (Easter Egg). Kein Kompliment wiederholt sich, bevor alle anderen dran waren –
            neue kommen zuerst.
          </p>
          <form action={action} className="card flex flex-col gap-2">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-bold text-muted">Neues Kompliment (Englisch, B1)</span>
              <input name="text" maxLength={COMPLIMENT_MAX} required lang="en" className="input" placeholder="You are …" />
            </label>
            <div className="flex items-center justify-end gap-3">
              {state.ok && <span className="text-sm font-bold text-mint">Hinzugefügt ✓</span>}
              {state.error && <span className="text-sm text-danger">{state.error}</span>}
              <button disabled={pending} className="btn-primary px-4 py-2 text-sm">
                Hinzufügen
              </button>
            </div>
          </form>
          <ul className="flex flex-col gap-2">
            {compliments.map((c) => (
              <ComplimentRow key={c.id} compliment={c} />
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function ComplimentRow({ compliment }: { compliment: Compliment }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(compliment.text_en);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <li className={`card flex flex-col gap-2 p-4 ${compliment.active ? "" : "opacity-60"}`}>
      {editing ? (
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          maxLength={COMPLIMENT_MAX}
          lang="en"
          className="input py-2"
          aria-label="Kompliment"
        />
      ) : (
        <p lang="en" className={compliment.active ? "" : "line-through"}>
          {compliment.text_en}
          {compliment.created_by === "admin" && <span className="ml-1 text-xs font-bold text-accent-ink">· von dir</span>}
        </p>
      )}
      <div className="flex items-center justify-end gap-2 text-sm">
        {error && <span className="mr-auto text-danger">{error}</span>}
        {editing ? (
          <>
            <button type="button" onClick={() => { setEditing(false); setValue(compliment.text_en); }} className="px-2 font-bold text-muted">
              Abbrechen
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  const r = await updateCompliment(compliment.id, value);
                  if (r.error) setError(r.error);
                  else {
                    setError(null);
                    setEditing(false);
                  }
                })
              }
              className="btn-primary px-3 py-1 text-sm"
            >
              Speichern
            </button>
          </>
        ) : (
          <>
            <button type="button" onClick={() => setEditing(true)} className="px-2 font-bold text-muted">
              Bearbeiten
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  const r = await setComplimentActive(compliment.id, !compliment.active);
                  setError(r.error ?? null);
                })
              }
              className="btn-secondary px-3 py-1 text-sm"
            >
              {compliment.active ? "Deaktivieren" : "Aktivieren"}
            </button>
          </>
        )}
      </div>
    </li>
  );
}
