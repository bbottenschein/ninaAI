import { describe, expect, it } from "vitest";
import { cleanLoveNote, formatNoteTime, viewOf, type LoveNote } from "./love-notes";

describe("cleanLoveNote", () => {
  it("trimmt und akzeptiert bis 150 Zeichen", () => {
    expect(cleanLoveNote("  hi  ")).toEqual({ text: "hi" });
    expect(cleanLoveNote("a".repeat(150))).toEqual({ text: "a".repeat(150) });
  });
  it("lehnt leere und zu lange Nachrichten ab", () => {
    expect(cleanLoveNote("   ")).toHaveProperty("error");
    expect(cleanLoveNote("a".repeat(151))).toHaveProperty("error");
  });
});

describe("viewOf", () => {
  const note: LoveNote = {
    id: "1", sender_id: "nina", recipient_id: "ben", text: "hi", created_at: "", read_at: null,
    is_favorite_sender: true, is_favorite_recipient: false,
  };
  it("zeigt jeder Seite ihren eigenen Favoriten", () => {
    expect(viewOf(note, "nina")).toEqual({ sent: true, favorite: true, unread: false });
    expect(viewOf(note, "ben")).toEqual({ sent: false, favorite: false, unread: true });
  });
  it("ist nach dem Lesen nicht mehr ungelesen", () => {
    expect(viewOf({ ...note, read_at: "2026-11-26T20:00:00Z" }, "ben").unread).toBe(false);
  });
});

describe("formatNoteTime", () => {
  const now = new Date("2026-11-26T20:30:00Z"); // 21:30 in Berlin
  it("nutzt deutsche Zeit mit Heute/Gestern", () => {
    expect(formatNoteTime("2026-11-26T20:14:00Z", now)).toBe("Heute, 21:14");
    expect(formatNoteTime("2026-11-25T07:03:00Z", now)).toBe("Gestern, 08:03");
    expect(formatNoteTime("2026-11-24T18:30:00Z", now)).toBe("24.11., 19:30");
    expect(formatNoteTime("2025-12-31T22:30:00Z", now)).toBe("31.12.2025, 23:30");
  });
  it("Tagesgrenze in Berlin, nicht UTC", () => {
    expect(formatNoteTime("2026-11-25T23:30:00Z", now)).toBe("Heute, 00:30");
  });
});
