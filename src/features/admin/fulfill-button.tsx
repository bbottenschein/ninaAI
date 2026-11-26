"use client";

import { useState, useTransition } from "react";
import { fulfillReward } from "@/features/rewards/actions";

export function FulfillButton({ id }: { id: string }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await fulfillReward(id);
            if (result.error) setError(result.error);
          })
        }
        className="btn-primary px-3 py-1.5 text-sm"
      >
        Erledigt ✓
      </button>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
