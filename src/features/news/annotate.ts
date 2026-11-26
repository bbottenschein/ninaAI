import { findWord } from "@/features/lesson/match";

export type MarkKind = "term" | "person" | "vocab";

export type Mark = {
  kind: MarkKind;
  /** Textstelle, die markiert wird. */
  needle: string;
  /** Verweis auf den Eintrag (Index in terms / persons / vocab). */
  index: number;
};

export type Segment = { text: string; mark?: Omit<Mark, "needle"> };

/**
 * Zerlegt einen Text in Abschnitte mit und ohne Markierung.
 * Begriffe und Vokabeln werden beim ersten Vorkommen markiert, Personen bei
 * jedem. Überlappen sich Markierungen, gewinnt die frühere (bei gleichem
 * Start die längere).
 */
export function annotate(text: string, marks: Mark[]): Segment[] {
  type Range = { start: number; end: number; mark: Omit<Mark, "needle"> };
  const ranges: Range[] = [];

  for (const { needle, ...mark } of marks) {
    const length = needle.trim().length;
    let from = 0;
    let index = findWord(text, needle, from);
    while (index !== -1) {
      ranges.push({ start: index, end: index + length, mark });
      if (mark.kind !== "person") break;
      from = index + length;
      index = findWord(text, needle, from);
    }
  }

  ranges.sort((a, b) => a.start - b.start || b.end - a.end);

  const segments: Segment[] = [];
  let cursor = 0;
  for (const range of ranges) {
    if (range.start < cursor) continue;
    if (range.start > cursor) segments.push({ text: text.slice(cursor, range.start) });
    segments.push({ text: text.slice(range.start, range.end), mark: range.mark });
    cursor = range.end;
  }
  if (cursor < text.length) segments.push({ text: text.slice(cursor) });
  return segments;
}

export type Token = { text: string; start: number; isWord: boolean };

/** Zerlegt Text in Wörter und Zwischenräume (Satzzeichen, Leerzeichen). */
export function tokenize(text: string, offset = 0): Token[] {
  const tokens: Token[] = [];
  const re = /\p{L}[\p{L}\p{M}'’-]*/gu;
  let last = 0;
  for (const m of text.matchAll(re)) {
    const index = m.index ?? 0;
    if (index > last) tokens.push({ text: text.slice(last, index), start: offset + last, isWord: false });
    // Bindestrich/Apostroph am Wortende gehören nicht zum Wort.
    const word = m[0].replace(/['’-]+$/u, "");
    tokens.push({ text: word, start: offset + index, isWord: true });
    last = index + word.length;
  }
  if (last < text.length) tokens.push({ text: text.slice(last), start: offset + last, isWord: false });
  return tokens;
}

/** Der Satz, in dem die Textstelle `offset` liegt. */
export function sentenceAt(text: string, offset: number): string {
  const re = /[^.!?]+(?:[.!?]+["”’)]*|$)/g;
  for (const m of text.matchAll(re)) {
    const start = m.index ?? 0;
    if (offset >= start && offset < start + m[0].length) return m[0].trim();
  }
  return text.trim();
}
