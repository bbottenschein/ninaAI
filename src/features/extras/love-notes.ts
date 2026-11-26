import { addDays, berlinParts } from "@/lib/date";

/** Love Notes (SPEC-extras): bewusst kurz. */
export const LOVE_MAX = 150;
/** Ab hier wird der Zeichenzähler sichtbar. */
export const LOVE_COUNTER_FROM = 120;

export const LOVE_PUSH = { title: "💌 Neue Love Note", body: "Tippe zum Lesen", url: "/love-notes", tag: "love-note" } as const;

export type LoveNote = {
  id: string;
  sender_id: string;
  recipient_id: string;
  text: string;
  created_at: string;
  read_at: string | null;
  is_favorite_sender: boolean;
  is_favorite_recipient: boolean;
};

/** Text prüfen: getrimmt, 1–150 Zeichen. */
export function cleanLoveNote(input: string): { text: string } | { error: string } {
  const text = input.trim();
  if (!text) return { error: "Schreib erst ein paar Worte." };
  if (text.length > LOVE_MAX) return { error: `Höchstens ${LOVE_MAX} Zeichen.` };
  return { text };
}

/** Sicht einer Person auf eine Note: gesendet/empfangen und eigener Favorit. */
export function viewOf(note: LoveNote, userId: string) {
  const sent = note.sender_id === userId;
  return { sent, favorite: sent ? note.is_favorite_sender : note.is_favorite_recipient, unread: !sent && !note.read_at };
}

/** „Heute, 21:14“, „Gestern, 08:03“, „24.11., 19:30“ bzw. mit Jahr (deutsche Zeit). */
export function formatNoteTime(iso: string, now: Date): string {
  const { date, time } = berlinParts(new Date(iso));
  const today = berlinParts(now).date;
  if (date === today) return `Heute, ${time}`;
  if (date === addDays(today, -1)) return `Gestern, ${time}`;
  const [y, m, d] = date.split("-");
  return `${Number(d)}.${Number(m)}.${y === today.slice(0, 4) ? "" : y}, ${time}`;
}
