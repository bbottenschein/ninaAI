import { describe, expect, it } from "vitest";
import { pickCompliment } from "./compliments";

const list = [{ id: "a" }, { id: "b" }, { id: "c" }];

describe("pickCompliment", () => {
  it("wählt nur unter den am wenigsten gezeigten", () => {
    const views = new Map([["a", 1], ["b", 0], ["c", 1]]);
    expect(pickCompliment(list, views, () => 0.99)?.id).toBe("b");
  });

  it("wiederholt keins, bevor alle einmal dran waren", () => {
    const views = new Map<string, number>();
    const seen: string[] = [];
    for (let i = 0; i < 3; i++) {
      const c = pickCompliment(list, views, () => 0.5)!;
      seen.push(c.id);
      views.set(c.id, (views.get(c.id) ?? 0) + 1);
    }
    expect(new Set(seen).size).toBe(3);
  });

  it("zeigt neu hinzugefügte zuerst", () => {
    const views = new Map([["a", 3], ["b", 3], ["c", 0]]);
    expect(pickCompliment(list, views, () => 0)?.id).toBe("c");
  });

  it("liefert null ohne aktive Komplimente", () => {
    expect(pickCompliment([], new Map())).toBeNull();
  });
});
