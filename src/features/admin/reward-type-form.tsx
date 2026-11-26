"use client";

import { useActionState } from "react";
import { updateRewardType } from "@/features/rewards/actions";
import { REWARD_EMOJI, type RewardTypeRow } from "@/features/rewards/labels";

export function RewardTypeForm({ type }: { type: RewardTypeRow }) {
  const [state, action, pending] = useActionState(updateRewardType, {});
  return (
    <form action={action} className="card flex flex-col gap-3">
      <input type="hidden" name="type" value={type.type} />
      <p className="text-sm font-bold text-muted">
        {REWARD_EMOJI[type.type] ?? "🎁"} alle {type.interval_days} Streak-Tage
      </p>
      <label className="flex flex-col gap-1">
        <span className="text-xs font-bold text-muted">Titel</span>
        <input name="title" defaultValue={type.title} maxLength={80} required className="input" />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs font-bold text-muted">Beschreibung (z. B. was die Überraschung andeutet)</span>
        <textarea name="description" defaultValue={type.description} maxLength={300} rows={2} className="input" />
      </label>
      <div className="flex items-center justify-end gap-3">
        {state.ok && <span className="text-sm font-bold text-mint">Gespeichert ✓</span>}
        {state.error && <span className="text-sm text-danger">{state.error}</span>}
        <button disabled={pending} className="btn-primary px-4 py-2 text-sm">
          Speichern
        </button>
      </div>
    </form>
  );
}
