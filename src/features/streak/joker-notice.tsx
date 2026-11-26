"use client";

import { useTransition } from "react";
import { dismissJokerNotice } from "./actions";

export function JokerNotice({ label }: { label: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <div className="card mb-4 flex animate-pop items-center gap-3 bg-lavender-soft" role="status">
      <span className="text-3xl" aria-hidden>
        🃏
      </span>
      <p className="flex-1 font-bold">Dein Joker hat {label} deine Streak gerettet!</p>
      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(() => dismissJokerNotice())}
        className="rounded-full bg-surface px-3 py-1.5 text-sm font-bold"
      >
        Super!
      </button>
    </div>
  );
}
