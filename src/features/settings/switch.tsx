"use client";

/** Kleiner Ein/Aus-Schalter. */
export function Switch({ on, label, disabled, onToggle }: { on: boolean; label: string; disabled?: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={disabled}
      onClick={onToggle}
      className={`relative h-7 w-12 shrink-0 rounded-full transition-colors disabled:opacity-50 ${on ? "bg-accent" : "bg-border"}`}
    >
      <span className={`absolute top-1 left-1 size-5 rounded-full bg-surface shadow-soft transition-transform ${on ? "translate-x-5" : ""}`} />
    </button>
  );
}
