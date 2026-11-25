import { describe, expect, it } from "vitest";
import { isActive, tabsFor } from "./tabs";

describe("tabsFor", () => {
  it("zeigt der Spielerin die vier Lern-Tabs", () => {
    expect(tabsFor("player").map((t) => t.label)).toEqual([
      "Heute",
      "Vokabeln",
      "Knowledge",
      "Gutscheine",
    ]);
  });

  it("zeigt dem Admin Heute und Admin", () => {
    expect(tabsFor("admin").map((t) => t.href)).toEqual(["/", "/admin"]);
  });
});

describe("isActive", () => {
  const [today, vocab] = tabsFor("player");

  it("markiert Heute nur auf der Startseite", () => {
    expect(isActive(today, "/")).toBe(true);
    expect(isActive(today, "/vokabeln")).toBe(false);
  });

  it("markiert Heute auch auf den Schritten des Tages", () => {
    expect(isActive(today, "/news")).toBe(true);
    expect(isActive(vocab, "/news")).toBe(false);
  });

  it("markiert Unterseiten als aktiv", () => {
    expect(isActive(vocab, "/vokabeln/quiz")).toBe(true);
    expect(isActive(vocab, "/vokabelnx")).toBe(false);
  });
});
