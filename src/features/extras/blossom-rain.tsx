"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { currentMotif, type Motif } from "@/features/shell/motif";
import { nextCompliment } from "./actions";
import { FALLBACK_COMPLIMENT } from "./compliments";
import { needsMotionPermission, requestMotion, storedMotion } from "./motion";
import { initialShakeState, magnitude, onMotion, shakeAllowedOn } from "./shake";

type Petal = { id: number; left: number; delay: number; duration: number; size: number; drift: number; kind: number };

const RAIN_MS = 3200;
const CARD_MS = 6000;
// Farben und Symbol je Design: Blüten · Blätter & Papier · Sternschnuppen · Pfoten & Wolle.
const COLORS: Record<Motif, string[]> = {
  flower: ["#ffb0cb", "#f78cb2", "#ffd1e1", "#e45b91"],
  clean: ["#8fa088", "#b8c4b0", "#c9c0b3", "#6f8268"],
  dark: ["#ff8fb3", "#ffc867", "#ffb3cd", "#fff3c4"],
  cat: ["#c98b5a", "#8b5a3c", "#e9cba8", "#a0522d"],
};
const CARD_ICON: Record<Motif, string> = { flower: "🌸", clean: "🍃", dark: "🌙", cat: "🐾" };

function typing(): boolean {
  const el = document.activeElement as HTMLElement | null;
  if (!el) return false;
  return el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName);
}

function makePetals(): Petal[] {
  return Array.from({ length: 34 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 1.1,
    duration: 1.8 + Math.random() * 1.2,
    size: 16 + Math.random() * 18,
    drift: (Math.random() - 0.5) * 120,
    kind: i % 3,
  }));
}

/** Schütteln (SPEC-extras, Easter Egg): Blütenregen und ein englisches Kompliment. Kein Hinweis in der UI. */
export function BlossomRain() {
  const pathname = usePathname();
  const pathRef = useRef(pathname);
  const stateRef = useRef(initialShakeState());
  const busyRef = useRef(false);
  const [petals, setPetals] = useState<Petal[] | null>(null);
  const [motif, setMotif] = useState<Motif>("flower");
  const [text, setText] = useState<string | null>(null);
  const [cardOpen, setCardOpen] = useState(false);

  useEffect(() => {
    pathRef.current = pathname;
  }, [pathname]);

  const trigger = useCallback(() => {
    busyRef.current = true;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setMotif(currentMotif());
    if (!reduced) setPetals(makePetals());
    setText(null);
    setCardOpen(true);
    navigator.vibrate?.(30);
    nextCompliment()
      .then((r) => setText(r.text ?? FALLBACK_COMPLIMENT))
      .catch(() => setText(FALLBACK_COMPLIMENT));
    window.setTimeout(() => setPetals(null), RAIN_MS);
    window.setTimeout(() => {
      setCardOpen(false);
      busyRef.current = false;
    }, CARD_MS);
  }, []);

  useEffect(() => {
    function handle(event: DeviceMotionEvent) {
      const strength = magnitude(event.acceleration, event.accelerationIncludingGravity);
      const r = onMotion(stateRef.current, strength, event.timeStamp || performance.now());
      stateRef.current = r.state;
      if (!r.shake || busyRef.current) return;
      if (document.visibilityState !== "visible" || typing() || !shakeAllowedOn(pathRef.current)) return;
      if (document.querySelector('[aria-modal="true"]')) return;
      trigger();
    }
    window.addEventListener("devicemotion", handle);

    // iPhone: Eine früher erteilte Erlaubnis nach einem Neustart der App beim ersten Tipp still erneuern.
    function renew() {
      if (needsMotionPermission() && storedMotion() === "granted") void requestMotion();
    }
    window.addEventListener("pointerdown", renew, { once: true });
    return () => {
      window.removeEventListener("devicemotion", handle);
      window.removeEventListener("pointerdown", renew);
    };
  }, [trigger]);

  if (!petals && !cardOpen) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden" aria-live="polite">
      {petals?.map((p) => (
        <span
          key={p.id}
          className="absolute -top-12 block"
          style={
            {
              left: `${p.left}%`,
              width: p.size,
              height: p.size,
              animation: `petal-fall ${p.duration}s ${p.delay}s ease-in forwards`,
              "--drift": `${p.drift}px`,
            } as React.CSSProperties
          }
          aria-hidden
        >
          <PetalShape motif={motif} kind={p.kind} color={COLORS[motif][p.id % COLORS[motif].length]} />
        </span>
      ))}
      {cardOpen && (
        <div className="absolute inset-0 flex items-center justify-center px-8">
          <button
            type="button"
            onClick={() => setCardOpen(false)}
            className="pointer-events-auto w-full max-w-xs animate-pop rounded-3xl border border-border bg-surface px-6 py-7 text-center shadow-soft"
          >
            <span className="text-4xl" aria-hidden>
              {CARD_ICON[motif]}
            </span>
            <p lang="en" className="mt-3 text-xl leading-snug font-extrabold text-accent-ink">
              {text ?? "…"}
            </p>
          </button>
        </div>
      )}
    </div>
  );
}

function PetalShape({ motif, kind, color }: { motif: Motif; kind: number; color: string }) {
  if (motif === "clean") {
    if (kind === 2) return <svg viewBox="0 0 40 40" className="size-full"><rect x="12" y="8" width="16" height="24" rx="2" fill="#fff" stroke="#c9c0b3" strokeWidth="1.5" transform="rotate(15 20 20)" /></svg>;
    return (
      <svg viewBox="0 0 40 40" className="size-full">
        <path d="M20 3 C33 12 33 28 20 37 C7 28 7 12 20 3Z" fill={color} />
        <path d="M20 5 L20 36" stroke="#fff" strokeOpacity=".6" strokeWidth="1.5" />
      </svg>
    );
  }
  if (motif === "dark") {
    return (
      <svg viewBox="0 0 40 40" className="size-full">
        {kind === 0 && <path d="M20 20 L36 4" stroke={color} strokeOpacity=".5" strokeWidth="2" strokeLinecap="round" />}
        <path d="M20 6 L23.5 15.5 L33.5 16 L25.5 22 L28.5 32 L20 26 L11.5 32 L14.5 22 L6.5 16 L16.5 15.5Z" fill={color} />
      </svg>
    );
  }
  if (motif === "cat") {
    if (kind === 0) {
      return (
        <svg viewBox="0 0 40 40" className="size-full">
          <circle cx="20" cy="20" r="14" fill={color} />
          <path d="M9 15 Q20 22 31 12 M8 22 Q20 29 32 19" stroke="#fff" strokeOpacity=".5" strokeWidth="2" fill="none" />
        </svg>
      );
    }
    return (
      <svg viewBox="0 0 40 40" className="size-full" fill={color}>
        <ellipse cx="20" cy="27" rx="9" ry="8" />
        <ellipse cx="9" cy="16" rx="4" ry="5" />
        <ellipse cx="16" cy="9" rx="4" ry="5" />
        <ellipse cx="24" cy="9" rx="4" ry="5" />
        <ellipse cx="31" cy="16" rx="4" ry="5" />
      </svg>
    );
  }
  if (kind === 0) {
    // Kleine Blüte mit fünf Blättern
    return (
      <svg viewBox="0 0 40 40" className="size-full">
        {[0, 72, 144, 216, 288].map((r) => (
          <ellipse key={r} cx="20" cy="10" rx="7" ry="10" fill={color} transform={`rotate(${r} 20 20)`} />
        ))}
        <circle cx="20" cy="20" r="4.5" fill="#fff3b0" />
      </svg>
    );
  }
  // Einzelnes Blütenblatt
  return (
    <svg viewBox="0 0 40 40" className="size-full">
      <path d="M20 3 C33 12 31 30 20 37 C9 30 7 12 20 3 Z" fill={color} opacity={kind === 1 ? 0.95 : 0.75} />
    </svg>
  );
}
