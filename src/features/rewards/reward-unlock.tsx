"use client";

import { useState, useTransition } from "react";
import { Mascot } from "@/features/shell/mascot";
import { markRewardsSeen } from "./actions";
import { REWARD_EMOJI } from "./labels";

type Unlocked = { id: string; type: string; title: string; description: string; milestone_day: number };

/** Vollbild-Animation für neu verdiente Gutscheine (SPEC › Belohnungen). */
export function RewardUnlock({ rewards }: { rewards: Unlocked[] }) {
  const [index, setIndex] = useState(0);
  const [closed, setClosed] = useState(false);
  const [, startTransition] = useTransition();
  if (closed || rewards.length === 0) return null;

  const reward = rewards[index];
  const last = index === rewards.length - 1;

  function next() {
    if (!last) {
      setIndex(index + 1);
      return;
    }
    setClosed(true);
    startTransition(() => markRewardsSeen());
  }

  return (
    <div
      className="fixed inset-0 z-30 flex flex-col items-center justify-center bg-accent px-6 text-center text-on-accent"
      role="dialog"
      aria-modal="true"
      aria-label="Neuer Gutschein"
    >
      <Confetti />
      <Mascot mood="party" className="relative size-32 animate-float" />
      <p className="relative mt-4 text-lg font-extrabold">Tag {reward.milestone_day} geschafft!</p>
      <p className="relative text-sm font-semibold opacity-90">Du hast einen Gutschein verdient</p>

      <div key={reward.id} className="relative mt-6 w-full max-w-xs animate-pop rounded-3xl bg-surface p-6 text-foreground shadow-soft">
        <p className="text-5xl" aria-hidden>
          {REWARD_EMOJI[reward.type] ?? "🎁"}
        </p>
        <p className="mt-3 text-2xl font-extrabold">{reward.title}</p>
        {reward.description && <p className="mt-1 text-sm text-muted">{reward.description}</p>}
        <p className="mt-4 text-xs font-bold text-accent-ink">Liegt jetzt unter „Meine Gutscheine“</p>
      </div>

      <button
        type="button"
        onClick={next}
        className="relative mt-8 rounded-full bg-surface px-8 py-3 font-extrabold text-accent-ink transition active:scale-95"
      >
        {last ? "Juhu! 🎉" : "Weiter ›"}
      </button>
    </div>
  );
}

function Confetti() {
  const colors = ["#ffffff", "#ffd1e1", "#ffc24b", "#b7a9ff", "#6fd3a6"];
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {Array.from({ length: 28 }, (_, i) => (
        <span
          key={i}
          className="absolute top-[-5%] block size-2.5 animate-[confetti_3.5s_linear_infinite] rounded-sm"
          style={{
            left: `${(i * 37) % 100}%`,
            backgroundColor: colors[i % colors.length],
            animationDelay: `${(i % 7) * 0.45}s`,
            transform: `rotate(${i * 25}deg)`,
          }}
        />
      ))}
    </div>
  );
}
