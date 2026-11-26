import { describe, expect, it } from "vitest";
import { isOverviewTime, overviewPush } from "./overview";

const THU = "2026-11-26";
const SAT = "2026-11-28";

describe("overviewPush", () => {
  it("zählt heutige und überfällige Aufgaben", () => {
    expect(
      overviewPush(
        [
          { due_date: THU, area: "work" },
          { due_date: THU, area: "life" },
          { due_date: "2026-11-24", area: "life" },
          { due_date: "2026-11-27", area: "life" },
          { due_date: null, area: "life" },
        ],
        THU,
      ),
    ).toEqual({ title: "☀️ Guten Morgen", body: "Heute: 3 Aufgaben, 1 überfällig" });
  });

  it("zählt am Wochenende nur Life Mode", () => {
    expect(overviewPush([{ due_date: SAT, area: "work" }, { due_date: SAT, area: "life" }], SAT)).toEqual({
      title: "🌿 Dein Wochenende",
      body: "Heute: 1 Aufgabe",
    });
  });

  it("schickt nichts, wenn nichts ansteht", () => {
    expect(overviewPush([{ due_date: SAT, area: "work" }, { due_date: "2026-12-01", area: "life" }], SAT)).toBeNull();
  });
});

describe("isOverviewTime", () => {
  it("gilt ab 07:30 bis vor 09:00 deutscher Zeit", () => {
    expect(isOverviewTime(new Date("2026-11-26T06:30:00Z"))).toBe(true); // 07:30 MEZ
    expect(isOverviewTime(new Date("2026-11-26T06:29:00Z"))).toBe(false);
    expect(isOverviewTime(new Date("2026-11-26T08:00:00Z"))).toBe(false); // 09:00
    expect(isOverviewTime(new Date("2026-07-01T05:30:00Z"))).toBe(true); // 07:30 MESZ
  });
});
