import { describe, expect, it } from "vitest";
import { prefsFor, resolvePrefs } from "./prefs";

describe("prefsFor", () => {
  it("zeigt Nina ihre vier Push-Arten", () => {
    expect(prefsFor("player").map((p) => p.key)).toEqual(["push_love_notes", "push_learning", "push_reminders", "daily_overview"]);
  });
  it("zeigt dem Admin Love Notes und Gutscheine", () => {
    expect(prefsFor("admin").map((p) => p.key)).toEqual(["push_love_notes", "push_rewards"]);
  });
});

describe("resolvePrefs", () => {
  it("nutzt Standardwerte ohne Eintrag (Tagesüberblick aus, Rest an)", () => {
    expect(resolvePrefs("player", null)).toEqual({ push_love_notes: true, push_learning: true, push_reminders: true, daily_overview: false });
  });
  it("übernimmt gespeicherte Werte", () => {
    expect(resolvePrefs("admin", { push_rewards: false, push_learning: false })).toEqual({ push_love_notes: true, push_rewards: false });
  });
});
