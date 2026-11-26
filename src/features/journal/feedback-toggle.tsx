"use client";

import { useState, useTransition } from "react";
import { setJournalFeedback } from "./feedback-actions";

/** Englisch-Feedback abschalten, wenn sie einfach nur schreiben möchte. */
export function FeedbackToggle({ initial }: { initial: boolean }) {
  const [on, setOn] = useState(initial);
  const [pending, startTransition] = useTransition();
  return (
    <div className="mt-6 flex items-center gap-3 px-1 text-sm">
      <p className="min-w-0 flex-1 text-muted">Englisch-Feedback nach dem Speichern</p>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label="Englisch-Feedback"
        disabled={pending}
        onClick={() => {
          const next = !on;
          setOn(next);
          startTransition(async () => {
            const r = await setJournalFeedback(next);
            if (r.error) setOn(!next);
          });
        }}
        className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${on ? "bg-accent" : "bg-border"}`}
      >
        <span className={`absolute top-1 left-1 size-5 rounded-full bg-surface transition-transform ${on ? "translate-x-5" : ""}`} />
      </button>
    </div>
  );
}
