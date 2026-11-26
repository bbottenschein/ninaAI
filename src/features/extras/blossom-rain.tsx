"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { nextCompliment } from "./actions";
import { FALLBACK_COMPLIMENT } from "./compliments";
import { needsMotionPermission, requestMotion, storedMotion } from "./motion";
import { initialShakeState, magnitude, onMotion, shakeAllowedOn } from "./shake";

type Petal = { id: number; left: number; delay: number; duration: number; size: number; drift: number; kind: number };

const RAIN_MS = 3200;
const CARD_MS = 6000;
const COLORS = ["#ffb0cb", "#f78cb2", "#ffd1e1", "#e45b91"];

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
  const [text, setText] = useState<string | null>(null);
  const [cardOpen, setCardOpen] = useState(false);

  useEffect(() => {
    pathRef.current = pathname;
  }, [pathname]);

  const trigger = useCallback(() => {
    busyRef.current = true;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
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
          <PetalShape kind={p.kind} color={COLORS[p.id % COLORS.length]} />
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
              🌸
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

function PetalShape({ kind, color }: { kind: number; color: string }) {
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
