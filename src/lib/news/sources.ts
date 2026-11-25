export type Region = "de" | "int";

export type FeedSource = {
  id: string;
  name: string;
  region: Region;
  /** Direkter RSS-Feed. null = nur über Google News erreichbar (Bot-Schutz). */
  url: string | null;
  /** Suchbegriff für den Google-News-Ersatzweg, falls der Feed nichts liefert. */
  googleQuery: string;
  /**
   * Wird der Artikeltext von der Seite geladen? Nur dann kann die Meldung
   * ausgewählt werden (Regel „Ämter nur aus dem Quelltext“). ZEIT untersagt
   * automatisierte Zugriffe ausdrücklich, SZ blockt sie (Stand 25.11.2026).
   * Deren Schlagzeilen helfen der KI trotzdem, die Relevanz einzuschätzen.
   */
  fetchArticle: boolean;
};

/** Festgelegte Quellen, siehe SPEC.md › News des Tages › Auswahl. */
export const FEED_SOURCES: FeedSource[] = [
  {
    id: "tagesschau",
    name: "tagesschau",
    region: "de",
    url: "https://www.tagesschau.de/inland/innenpolitik/index~rss2.xml",
    googleQuery: "site:tagesschau.de innenpolitik",
    fetchArticle: true,
  },
  {
    id: "zeit",
    name: "ZEIT ONLINE",
    region: "de",
    url: "https://newsfeed.zeit.de/politik/index",
    googleQuery: "site:zeit.de politik",
    fetchArticle: false,
  },
  {
    id: "sz",
    name: "Süddeutsche Zeitung",
    region: "de",
    url: "https://rss.sueddeutsche.de/rss/Politik",
    googleQuery: "site:sueddeutsche.de politik",
    fetchArticle: false,
  },
  {
    id: "bbc",
    name: "BBC News",
    region: "int",
    url: "https://feeds.bbci.co.uk/news/world/rss.xml",
    googleQuery: "site:bbc.co.uk world",
    fetchArticle: true,
  },
  {
    id: "politico",
    name: "POLITICO Europe",
    region: "int",
    url: null,
    googleQuery: "site:politico.eu",
    fetchArticle: false,
  },
  {
    id: "cnbc",
    name: "CNBC",
    region: "int",
    url: null,
    googleQuery: "site:cnbc.com politics",
    fetchArticle: false,
  },
];

export function googleNewsUrl(query: string, region: Region): string {
  const locale =
    region === "de" ? "hl=de&gl=DE&ceid=DE:de" : "hl=en-GB&gl=GB&ceid=GB:en";
  return `https://news.google.com/rss/search?q=${encodeURIComponent(`when:24h ${query}`)}&${locale}`;
}
