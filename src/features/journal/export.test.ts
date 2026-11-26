import { describe, expect, it } from "vitest";
import { journalToMarkdown } from "./export";
import type { JournalEntry } from "./logic";

describe("journalToMarkdown", () => {
  it("schreibt Einträge chronologisch mit allen Antworten", () => {
    const entry = (date: string, rating: number): JournalEntry => ({
      id: date, date, rating, mood_word: "calm", day_text: `Day ${date}`, gratitude: ["tea", "sun"],
      highlight: "", tomorrow_focus: "Sleep early.", feedback: null, created_at: "", updated_at: "",
    });
    const md = journalToMarkdown([entry("2026-11-26", 8), entry("2026-11-25", 6)], [{ month: "2026-10-01", summary_en: "A calm month." }], "2026-11-27");
    expect(md.indexOf("Day 2026-11-25")).toBeLessThan(md.indexOf("Day 2026-11-26"));
    expect(md).toContain("**Bewertung:** 8/10 · calm");
    expect(md).toContain("- tea\n- sun");
    expect(md).toContain("Sleep early.");
    expect(md).not.toContain("What was the highlight");
    expect(md).toContain("## 2026-10\n\nA calm month.");
  });
});
