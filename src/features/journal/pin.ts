/** Regeln für die optionale Journal-PIN (SPEC-journal › Privatsphäre). */
export const PIN_LENGTH = 4;
export const MAX_ATTEMPTS = 5;
export const LOCKOUT_MINUTES = 5;
/** Nach so vielen Minuten sperrt sich das Journal wieder. */
export const UNLOCK_MINUTES = 10;

export function isValidPin(pin: string): boolean {
  return new RegExp(`^\\d{${PIN_LENGTH}}$`).test(pin);
}

/** Zustand nach einem falschen Versuch: nach 5 Fehlversuchen 5 Minuten Sperre. */
export function afterFailedAttempt(failed: number, now: Date): { failed: number; lockedUntil: string | null } {
  const next = failed + 1;
  if (next >= MAX_ATTEMPTS) {
    return { failed: 0, lockedUntil: new Date(now.getTime() + LOCKOUT_MINUTES * 60_000).toISOString() };
  }
  return { failed: next, lockedUntil: null };
}

export function isLockedOut(lockedUntil: string | null, now: Date): boolean {
  return Boolean(lockedUntil) && Date.parse(lockedUntil!) > now.getTime();
}
