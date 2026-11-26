import { describe, expect, it } from "vitest";
import { isActive, tabsFor } from "./tabs";

describe("tabsFor", () => {
  it("zeigt der Spielerin Home, Daily Learning und Remind me", () => {
    expect(tabsFor("player").map((t) => t.label)).toEqual(["Home", "Daily Learning", "Remind me"]);
  });

  it("zeigt dem Admin Home und Admin – aber kein Remind me", () => {
    expect(tabsFor("admin").map((t) => t.href)).toEqual(["/", "/admin"]);
  });
});

describe("isActive", () => {
  const [home, learn, remind] = tabsFor("player");

  it("markiert Home nur auf der Startseite", () => {
    expect(isActive(home, "/")).toBe(true);
    expect(isActive(home, "/learn")).toBe(false);
  });

  it("markiert Daily Learning auf allen Unter-Tabs und Schritten der Lektion", () => {
    for (const path of ["/learn", "/news", "/quiz", "/tutor", "/vokabeln", "/knowledge", "/success"]) {
      expect(isActive(learn, path)).toBe(true);
    }
    expect(isActive(learn, "/remind")).toBe(false);
  });

  it("markiert Unterseiten als aktiv, aber keine ähnlich beginnenden Pfade", () => {
    expect(isActive(remind, "/remind/liste")).toBe(true);
    expect(isActive(remind, "/reminder")).toBe(false);
  });
});
