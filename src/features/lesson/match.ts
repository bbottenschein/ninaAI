const WORD_CHAR = /[\p{L}\p{N}]/u;

/**
 * Sucht `needle` in `text` (ohne Groß-/Kleinschreibung) und nur an Wortgrenzen,
 * damit z. B. „act“ nicht in „fact“ gefunden wird. Liefert den Startindex oder -1.
 */
export function findWord(text: string, needle: string, from = 0): number {
  const n = needle.trim();
  if (!n) return -1;
  const haystack = text.toLocaleLowerCase("en");
  const lower = n.toLocaleLowerCase("en");
  // toLocaleLowerCase kann die Länge in Sonderfällen ändern (z. B. „İ“);
  // dann lieber exakt suchen, damit die Indizes stimmen.
  const exact = haystack.length !== text.length || lower.length !== n.length;
  const source = exact ? text : haystack;
  const target = exact ? n : lower;

  let index = source.indexOf(target, from);
  while (index !== -1) {
    const before = index === 0 ? "" : text[index - 1];
    const after = text[index + target.length] ?? "";
    if (!WORD_CHAR.test(before) && !WORD_CHAR.test(after)) return index;
    index = source.indexOf(target, index + 1);
  }
  return -1;
}

export function containsWord(text: string, needle: string): boolean {
  return findWord(text, needle) !== -1;
}
