import { describe, expect, it } from "vitest";
import { nextMilestone, rewardsAt } from "./milestones";

describe("rewardsAt", () => {
  it("vergibt an den ersten Meilensteinen den passenden Gutschein", () => {
    expect(rewardsAt(14)).toEqual(["massage"]);
    expect(rewardsAt(30)).toEqual(["surprise"]);
    expect(rewardsAt(50)).toEqual(["dinner"]);
  });

  it("vergibt an Tag 150 alle passenden Gutscheine", () => {
    expect(rewardsAt(150).sort()).toEqual(["dinner", "surprise"]);
  });

  it("vergibt an Tag 210 Massage und Überraschung", () => {
    expect(rewardsAt(210).sort()).toEqual(["massage", "surprise"]);
  });

  it("vergibt nichts an normalen Tagen und an Tag 0", () => {
    expect(rewardsAt(13)).toEqual([]);
    expect(rewardsAt(0)).toEqual([]);
  });
});

describe("nextMilestone", () => {
  it("zeigt am Anfang die Massage an Tag 14", () => {
    expect(nextMilestone(0)).toEqual({ day: 14, daysLeft: 14, types: ["massage"] });
  });

  it("springt nach einem erreichten Meilenstein zum nächsten", () => {
    expect(nextMilestone(14)).toEqual({ day: 28, daysLeft: 14, types: ["massage"] });
    expect(nextMilestone(28)).toEqual({ day: 30, daysLeft: 2, types: ["surprise"] });
    expect(nextMilestone(42)).toEqual({ day: 50, daysLeft: 8, types: ["dinner"] });
  });
});
