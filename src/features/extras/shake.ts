/**
 * Erkennt kräftiges Schütteln aus DeviceMotion-Werten (reine Logik, ohne Browser).
 * Ein Schütteln = mindestens PEAKS starke Ausschläge innerhalb von WINDOW_MS.
 * Nach jedem Auslösen ist der Detektor COOLDOWN_MS gesperrt.
 */
export const SHAKE = {
  /** Beschleunigung ohne Schwerkraft in m/s², ab der ein Ausschlag zählt. */
  THRESHOLD: 14,
  PEAKS: 3,
  WINDOW_MS: 1000,
  /** Mindestabstand zweier Ausschläge (ein Ruck erzeugt mehrere Messwerte). */
  MIN_GAP_MS: 120,
  COOLDOWN_MS: 10_000,
} as const;

export type ShakeState = { peaks: number[]; lockedUntil: number };

export const initialShakeState = (): ShakeState => ({ peaks: [], lockedUntil: 0 });

/** Stärke eines Messwerts. Ohne `acceleration` wird die Schwerkraft (≈ 9,81) abgezogen. */
export function magnitude(
  acceleration: { x: number | null; y: number | null; z: number | null } | null,
  withGravity: { x: number | null; y: number | null; z: number | null } | null,
): number {
  const len = (v: { x: number | null; y: number | null; z: number | null }) =>
    Math.hypot(v.x ?? 0, v.y ?? 0, v.z ?? 0);
  if (acceleration && (acceleration.x !== null || acceleration.y !== null || acceleration.z !== null)) {
    return len(acceleration);
  }
  if (withGravity) return Math.abs(len(withGravity) - 9.81);
  return 0;
}

/** Nächster Zustand nach einem Messwert; `shake` ist true, wenn jetzt ausgelöst wird. */
export function onMotion(state: ShakeState, strength: number, now: number): { state: ShakeState; shake: boolean } {
  if (now < state.lockedUntil) return { state: { ...state, peaks: [] }, shake: false };
  if (strength < SHAKE.THRESHOLD) return { state, shake: false };

  const recent = state.peaks.filter((t) => now - t <= SHAKE.WINDOW_MS);
  const last = recent[recent.length - 1];
  if (last !== undefined && now - last < SHAKE.MIN_GAP_MS) return { state: { ...state, peaks: recent }, shake: false };

  const peaks = [...recent, now];
  if (peaks.length >= SHAKE.PEAKS) {
    return { state: { peaks: [], lockedUntil: now + SHAKE.COOLDOWN_MS }, shake: true };
  }
  return { state: { ...state, peaks }, shake: false };
}

/** Wo das Schütteln nicht reagiert: Tutor-Gespräch. */
export function shakeAllowedOn(pathname: string): boolean {
  return !(pathname === "/tutor" || pathname.startsWith("/tutor/"));
}
