"use client";

import { useState, useTransition } from "react";
import { redeemReward } from "./actions";

export function RedeemButton({ id, title }: { id: string; title: string }) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!confirming) {
    return (
      <button type="button" onClick={() => setConfirming(true)} className="btn-primary px-4 py-2 text-sm">
        Einlösen
      </button>
    );
  }
  return (
    <div className="flex flex-col items-end gap-2">
      <p className="text-right text-sm font-semibold">„{title}“ jetzt einlösen?</p>
      <div className="flex gap-2">
        <button type="button" onClick={() => setConfirming(false)} className="btn-secondary px-3 py-1.5 text-sm">
          Später
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const result = await redeemReward(id);
              if (result.error) setError(result.error);
            })
          }
          className="btn-primary px-3 py-1.5 text-sm"
        >
          Ja, einlösen!
        </button>
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}
