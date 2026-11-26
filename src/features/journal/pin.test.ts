import { describe, expect, it } from "vitest";
import { afterFailedAttempt, isLockedOut, isValidPin } from "./pin";

describe("PIN", () => {
  it("verlangt genau 4 Ziffern", () => {
    expect(isValidPin("1234")).toBe(true);
    expect(isValidPin("123")).toBe(false);
    expect(isValidPin("12a4")).toBe(false);
    expect(isValidPin("12345")).toBe(false);
  });

  it("sperrt nach 5 Fehlversuchen für 5 Minuten", () => {
    const now = new Date("2026-11-26T20:00:00Z");
    expect(afterFailedAttempt(3, now)).toEqual({ failed: 4, lockedUntil: null });
    const locked = afterFailedAttempt(4, now);
    expect(locked).toEqual({ failed: 0, lockedUntil: "2026-11-26T20:05:00.000Z" });
    expect(isLockedOut(locked.lockedUntil, new Date("2026-11-26T20:04:59Z"))).toBe(true);
    expect(isLockedOut(locked.lockedUntil, new Date("2026-11-26T20:05:01Z"))).toBe(false);
    expect(isLockedOut(null, now)).toBe(false);
  });
});
