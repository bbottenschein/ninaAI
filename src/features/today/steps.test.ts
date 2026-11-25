import { describe, expect, it } from "vitest";
import { isDayComplete, stepStates } from "./steps";

describe("stepStates", () => {
  it("startet mit News offen, Rest gesperrt", () => {
    expect(stepStates({ newsRead: 0, quizDone: false, tutorDone: false })).toEqual({
      news: "open",
      quiz: "locked",
      tutor: "locked",
    });
  });

  it("schaltet das Quiz erst nach allen 3 Meldungen frei", () => {
    expect(stepStates({ newsRead: 2, quizDone: false, tutorDone: false }).quiz).toBe("locked");
    expect(stepStates({ newsRead: 3, quizDone: false, tutorDone: false }).quiz).toBe("open");
  });

  it("schaltet den Tutor erst nach dem Quiz frei", () => {
    expect(stepStates({ newsRead: 3, quizDone: false, tutorDone: false }).tutor).toBe("locked");
    expect(stepStates({ newsRead: 3, quizDone: true, tutorDone: false }).tutor).toBe("open");
  });

  it("zählt Schritte außerhalb der Reihenfolge nicht", () => {
    const p = { newsRead: 1, quizDone: true, tutorDone: true };
    expect(stepStates(p)).toEqual({ news: "open", quiz: "locked", tutor: "locked" });
    expect(isDayComplete(p)).toBe(false);
  });

  it("ist abgeschlossen, wenn alle drei Schritte erledigt sind", () => {
    expect(isDayComplete({ newsRead: 3, quizDone: true, tutorDone: true })).toBe(true);
  });
});
