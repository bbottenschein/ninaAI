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
