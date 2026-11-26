import { describe, expect, it } from "vitest";
import { dueLabel, reminderLabel } from "./format";

const TODAY = "2026-11-26";

describe("dueLabel", () => {
  it("benennt nahe Tage und sonst Wochentag + Datum", () => {
    expect(dueLabel(TODAY, "15:00:00", TODAY)).toBe("Heute 15:00");
    expect(dueLabel("2026-11-27", null, TODAY)).toBe("Morgen");
    expect(dueLabel("2026-11-25", null, TODAY)).toBe("Gestern");
    expect(dueLabel("2026-11-28", null, TODAY)).toBe("Sa 28.11.");
    expect(dueLabel("2027-01-04", "08:00", TODAY)).toBe("Mo 4.1.27 08:00");
    expect(dueLabel(null, null, TODAY)).toBeNull();
  });

  it("zeigt Erinnerungen in deutscher Zeit", () => {
    expect(reminderLabel("2026-11-26T18:00:00.000Z", TODAY)).toBe("Heute 19:00");
  });
});
