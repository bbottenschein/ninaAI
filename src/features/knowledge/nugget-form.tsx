"use client";

import { useState, useTransition } from "react";
import { saveNugget } from "./actions";

/** Formular für ein Knowledge Nugget (neu, bearbeiten oder Schnell-Anlage aus den News). */
export function NuggetForm({
  initial,
  fromNews = false,
  onDone,
  onCancel,
  submitLabel = "Speichern",
}: {
  initial?: { id?: string; name: string; nugget: string };
  fromNews?: boolean;
  onDone: () => void;
  onCancel?: () => void;
  submitLabel?: string;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [nugget, setNugget] = useState(initial?.nugget ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        startTransition(async () => {
          const result = await saveNugget({ id: initial?.id, name, nugget, fromNews });
          if (result.error) setError(result.error);
          else onDone();
        });
      }}
      className="flex flex-col gap-3"
    >
      <label className="flex flex-col gap-1">
        <span className="text-xs font-bold text-muted">Name</span>
        <input value={name} onChange={(e) => setName(e.target.value)} required maxLength={120} className="input" />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs font-bold text-muted">Knowledge Nugget</span>
        <textarea
          value={nugget}
          onChange={(e) => setNugget(e.target.value)}
          required
          maxLength={1000}
          rows={3}
          placeholder="z. B. SPD-Vorsitzender und Finanzminister"
          className="input"
        />
      </label>
      {error && <p className="text-sm text-danger">{error}</p>}
      <div className="flex gap-2">
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn-secondary flex-1">
            Abbrechen
          </button>
        )}
        <button disabled={pending} className="btn-primary flex-1">
          {pending ? "Speichern …" : submitLabel}
        </button>
      </div>
    </form>
  );
}
