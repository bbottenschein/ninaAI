import { describe, expect, it } from "vitest";
import { reminderText, shouldRemind } from "./reminder";

describe("shouldRemind", () => {
  const base = { hour: 19, lessonReady: true, dayComplete: false };
  it("erinnert ab 19 Uhr, wenn die Lektion noch offen ist", () => {
    expect(shouldRemind(base)).toBe(true);
    expect(shouldRemind({ ...base, hour: 21 })).toBe(true);
  });
  it("erinnert nicht vor 19 und nicht ab 22 Uhr", () => {
    expect(shouldRemind({ ...base, hour: 18 })).toBe(false);
    expect(shouldRemind({ ...base, hour: 22 })).toBe(false);
  });
  it("erinnert nicht, wenn der Tag geschafft ist oder es keine Lektion gibt", () => {
    expect(shouldRemind({ ...base, dayComplete: true })).toBe(false);
    expect(shouldRemind({ ...base, lessonReady: false })).toBe(false);
  });
});

describe("reminderText", () => {
  it("passt den Text an den Fortschritt an", () => {
    expect(reminderText({ newsRead: 0, quizDone: false, streak: 0 }).body).toBe(
      "3 News, ein Quiz und ein kurzes Gespräch.",
    );
    expect(reminderText({ newsRead: 3, quizDone: true, streak: 5 }).body).toContain("Tutor-Gespräch");
    expect(reminderText({ newsRead: 1, quizDone: false, streak: 5 }).body).toContain("5-Tage-Streak");
  });
});
