import { describe, expect, it } from "vitest";
import { parseTheme, THEMES } from "./theme";

describe("parseTheme", () => {
  it("kennt alle fünf Designs", () => {
    expect(THEMES.map((t) => t.key)).toEqual(["flower", "clean", "dark", "cat", "auto"]);
    for (const t of THEMES) expect(parseTheme(t.key)).toBe(t.key);
  });
  it("fällt bei Unbekanntem auf Flower zurück", () => {
    expect(parseTheme(undefined)).toBe("flower");
    expect(parseTheme("neon")).toBe("flower");
  });
});
