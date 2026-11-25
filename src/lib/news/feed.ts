import "server-only";
import { extractArticleText } from "./article";
import { parseFeed, stripSourceSuffix, type FeedItem } from "./normalize";
import { FEED_SOURCES, googleNewsUrl, type FeedSource, type Region } from "./sources";

const USER_AGENT = "Mozilla/5.0 (compatible; NinAI/1.0; private learning app)";
const TIMEOUT_MS = 10_000;

export type SourcedItem = FeedItem & {
  sourceId: string;
  sourceName: string;
  region: Region;
  /** true, wenn die Meldung über den Google-News-Ersatzweg kam (nur Schlagzeile). */
  viaGoogle: boolean;
  fetchArticle: boolean;
};

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, Accept: "*/*" },
    signal: AbortSignal.timeout(TIMEOUT_MS),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} für ${url}`);
  return res.text();
}

async function loadSource(source: FeedSource): Promise<SourcedItem[]> {
  const base = {
    sourceId: source.id,
    sourceName: source.name,
    region: source.region,
  };

  if (source.url) {
    try {
      const items = parseFeed(await fetchText(source.url));
      if (items.length > 0) {
        return items.map((item) => ({
          ...item,
          ...base,
          viaGoogle: false,
          fetchArticle: source.fetchArticle,
        }));
      }
    } catch (error) {
      console.warn(`[news] Feed ${source.id} fehlgeschlagen, nutze Google News`, error);
    }
  }

  // Ersatzweg wie im News-Dashboard: Google News liefert nur Schlagzeilen.
  try {
    const items = parseFeed(await fetchText(googleNewsUrl(source.googleQuery, source.region)));
    return items.map((item) => ({
      ...item,
      title: stripSourceSuffix(item.title),
      summary: "",
      ...base,
      viaGoogle: true,
      fetchArticle: false,
    }));
  } catch (error) {
    console.warn(`[news] Google News für ${source.id} fehlgeschlagen`, error);
    return [];
  }
}

/** Lädt alle Feeds parallel. Ein ausgefallener Feed bricht nichts ab. */
export async function loadAllFeeds(): Promise<SourcedItem[]> {
  const results = await Promise.all(FEED_SOURCES.map(loadSource));
  return results.flat();
}

/** Lädt den Artikeltext oder liefert "" (Bot-Schutz, Paywall, Zeitüberschreitung). */
export async function loadArticleText(item: SourcedItem): Promise<string> {
  if (!item.fetchArticle) return "";
  try {
    return extractArticleText(await fetchText(item.url));
  } catch (error) {
    console.warn(`[news] Artikel nicht ladbar: ${item.url}`, error);
    return "";
  }
}
