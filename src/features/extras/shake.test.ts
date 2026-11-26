import { describe, expect, it } from "vitest";
import { initialShakeState, magnitude, onMotion, SHAKE, shakeAllowedOn, type ShakeState } from "./shake";

function feed(samples: [number, number][], start: ShakeState = initialShakeState()) {
  let state = start;
  const fired: number[] = [];
  for (const [t, s] of samples) {
    const r = onMotion(state, s, t);
    state = r.state;
    if (r.shake) fired.push(t);
  }
  return { state, fired };
}

describe("onMotion", () => {
  it("löst bei 3 kräftigen Bewegungen innerhalb einer Sekunde aus", () => {
    expect(feed([[0, 20], [300, 20], [600, 20]]).fired).toEqual([600]);
  });

  it("ignoriert schwache Bewegungen (Gehen)", () => {
    expect(feed([[0, 8], [300, 9], [600, 10], [900, 12]]).fired).toEqual([]);
  });

  it("zählt nur Ausschläge innerhalb des Zeitfensters", () => {
    expect(feed([[0, 20], [700, 20], [1500, 20]]).fired).toEqual([]);
  });

  it("zählt einen Ruck mit mehreren Messwerten nur einmal", () => {
    expect(feed([[0, 20], [16, 22], [32, 21], [48, 20]]).fired).toEqual([]);
  });

  it("sperrt 10 Sekunden nach einem Blütenregen", () => {
    const { fired } = feed([
      [0, 20], [300, 20], [600, 20],
      [2000, 20], [2300, 20], [2600, 20],
      [600 + SHAKE.COOLDOWN_MS + 100, 20], [600 + SHAKE.COOLDOWN_MS + 400, 20], [600 + SHAKE.COOLDOWN_MS + 700, 20],
    ]);
    expect(fired).toEqual([600, 600 + SHAKE.COOLDOWN_MS + 700]);
  });
});

describe("magnitude", () => {
  it("nimmt die Beschleunigung ohne Schwerkraft, wenn vorhanden", () => {
    expect(magnitude({ x: 3, y: 4, z: 0 }, { x: 0, y: 0, z: 9.81 })).toBe(5);
  });
  it("zieht sonst die Schwerkraft ab", () => {
    expect(magnitude(null, { x: 0, y: 0, z: 9.81 })).toBeCloseTo(0);
    expect(magnitude({ x: null, y: null, z: null }, { x: 0, y: 0, z: 29.81 })).toBeCloseTo(20);
  });
});

describe("shakeAllowedOn", () => {
  it("ist im Tutor aus, sonst an", () => {
    expect(shakeAllowedOn("/tutor")).toBe(false);
    expect(shakeAllowedOn("/")).toBe(true);
    expect(shakeAllowedOn("/journal")).toBe(true);
    expect(shakeAllowedOn("/tutorial")).toBe(true);
  });
});
