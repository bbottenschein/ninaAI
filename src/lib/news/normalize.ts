import { XMLParser } from "fast-xml-parser";

/** Eine Meldung aus einem Feed, unabhängig vom Feed-Format. */
export type FeedItem = {
  title: string;
  summary: string;
  url: string;
  publishedAt: string | null;
};

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  ndash: "–",
  mdash: "—",
  hellip: "…",
  bdquo: "„",
  ldquo: "“",
  rdquo: "”",
  lsquo: "‘",
  rsquo: "’",
  sbquo: "‚",
  laquo: "«",
  raquo: "»",
  auml: "ä",
  ouml: "ö",
  uuml: "ü",
  Auml: "Ä",
  Ouml: "Ö",
  Uuml: "Ü",
  szlig: "ß",
  eacute: "é",
  euro: "€",
};

export function decodeEntities(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, code: string) => {
    if (code[0] === "#") {
      const n = code[1] === "x" || code[1] === "X" ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
      return Number.isFinite(n) && n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : match;
    }
    return NAMED_ENTITIES[code] ?? match;
  });
}

/** Entfernt HTML-Tags und normalisiert Leerraum. */
export function stripHtml(html: string): string {
  return decodeEntities(
    html
      .replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ")
      .replace(/<br\s*\/?>/gi, " ")
      .replace(/<[^>]+>/g, " "),
  )
    .replace(/\s+/g, " ")
    .trim();
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@",
  processEntities: false,
  htmlEntities: false,
  parseTagValue: false,
  trimValues: true,
  isArray: (name) => name === "item" || name === "entry",
});

function text(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (typeof value === "object" && "#text" in value) return text((value as { "#text": unknown })["#text"]);
  return "";
}

function toIso(value: string): string | null {
  if (!value) return null;
  const time = Date.parse(value);
  return Number.isNaN(time) ? null : new Date(time).toISOString();
}

/** Liest RSS 2.0 (und zur Sicherheit Atom) in eine einheitliche Liste. */
export function parseFeed(xml: string): FeedItem[] {
  let doc: Record<string, unknown>;
  try {
    doc = parser.parse(xml) as Record<string, unknown>;
  } catch {
    return [];
  }

  const rss = doc.rss as { channel?: { item?: Record<string, unknown>[] } } | undefined;
  const atom = doc.feed as { entry?: Record<string, unknown>[] } | undefined;

  const items: FeedItem[] = [];
  for (const raw of rss?.channel?.item ?? []) {
    items.push({
      title: stripHtml(text(raw.title)),
      summary: stripHtml(text(raw.description)),
      url: decodeEntities(text(raw.link)).trim(),
      publishedAt: toIso(text(raw.pubDate) || text(raw["dc:date"])),
    });
  }
  for (const raw of atom?.entry ?? []) {
    const link = raw.link as { "@href"?: string } | { "@href"?: string }[] | undefined;
    const href = Array.isArray(link) ? link[0]?.["@href"] : link?.["@href"];
    items.push({
      title: stripHtml(text(raw.title)),
      summary: stripHtml(text(raw.summary) || text(raw.content)),
      url: decodeEntities(href ?? "").trim(),
      publishedAt: toIso(text(raw.published) || text(raw.updated)),
    });
  }

  return items.filter((item) => item.title && /^https?:\/\//.test(item.url));
}

/**
 * Google-News-Titel enden auf „ - Quelle“. Der Zusatz wird entfernt, damit die
 * KI nur die Schlagzeile sieht.
 */
export function stripSourceSuffix(title: string): string {
  return title.replace(/\s+[-–]\s+[^-–]{2,40}$/, "").trim();
}

/** Vergleichsschlüssel für Dubletten: URL ohne Query/Fragment, Titel klein. */
export function urlKey(url: string): string {
  try {
    const u = new URL(url);
    return `${u.hostname.replace(/^www\./, "")}${u.pathname.replace(/\/$/, "")}`;
  } catch {
    return url;
  }
}

/**
 * Behält nur Meldungen aus dem Zeitfenster (Meldungen ohne Datum bleiben drin),
 * entfernt Dubletten und bereits genutzte URLs, neueste zuerst.
 */
export function selectRecent<T extends FeedItem>(
  items: T[],
  options: { since: Date; exclude?: Iterable<string>; limit: number },
): T[] {
  const seen = new Set<string>();
  for (const url of options.exclude ?? []) seen.add(urlKey(url));
  const since = options.since.getTime();

  return items
    .filter((item) => !item.publishedAt || Date.parse(item.publishedAt) >= since)
    .sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""))
    .filter((item) => {
      const key = urlKey(item.url);
      const titleKey = item.title.toLowerCase();
      if (seen.has(key) || seen.has(titleKey)) return false;
      seen.add(key);
      seen.add(titleKey);
      return true;
    })
    .slice(0, options.limit);
}
