import "server-only";
import { loadAllFeeds, loadArticleText, type SourcedItem } from "@/lib/news/feed";
import { selectRecent } from "@/lib/news/normalize";
import type { Region } from "@/lib/news/sources";
import { askStructured } from "./claude";
import {
  LESSON_SYSTEM,
  RANKING_SYSTEM,
  lessonPrompt,
  rankingPrompt,
  type RankingCandidate,
  type SourceArticle,
} from "./prompts";
import { GeneratedLessonSchema, RankingSchema, type StoredLesson } from "./schema";
import { finalizeLesson } from "./validate";

/** Schlagzeilen des Vortags und des Morgens. */
const WINDOW_MS = 36 * 60 * 60 * 1000;
const PER_SOURCE = 20;
/** Unter dieser Länge reicht der Artikeltext nicht für Ämter und Details. */
const MIN_ARTICLE_CHARS = 800;
const NEEDED: Record<Region, number> = { de: 2, int: 1 };

export type PreviousLesson = { titles: string[]; urls: string[] };

/**
 * Erzeugt die komplette Tageslektion: Feeds laden → Claude rankt →
 * Artikeltexte laden → Claude schreibt Texte, Begriffe, Personen, Vokabeln,
 * Quiz und Tutor-Fragen → prüfen.
 */
export async function generateLesson(date: string, previous: PreviousLesson): Promise<StoredLesson> {
  const feedItems = await loadAllFeeds();
  const since = new Date(Date.now() - WINDOW_MS);

  const bySource = new Map<string, SourcedItem[]>();
  for (const item of feedItems) {
    bySource.set(item.sourceId, [...(bySource.get(item.sourceId) ?? []), item]);
  }
  const recent = [...bySource.values()].flatMap((items) =>
    selectRecent(items, { since, exclude: previous.urls, limit: PER_SOURCE }),
  );

  const selectable = recent.filter((item) => item.fetchArticle);
  const counters: Record<Region, number> = { de: 0, int: 0 };
  const byId = new Map<string, SourcedItem>();
  const candidates: RankingCandidate[] = selectable.map((item) => {
    const id = `${item.region}-${++counters[item.region]}`;
    byId.set(id, item);
    return {
      id,
      region: item.region,
      source: item.sourceName,
      title: item.title,
      summary: item.summary,
      publishedAt: item.publishedAt,
    };
  });

  for (const region of ["de", "int"] as const) {
    if (counters[region] < NEEDED[region]) {
      throw new Error(`Zu wenige Meldungen mit Volltext (${region}: ${counters[region]})`);
    }
  }

  const ranking = await askStructured({
    schema: RankingSchema,
    system: RANKING_SYSTEM,
    prompt: rankingPrompt({
      candidates,
      context: recent
        .filter((item) => !item.fetchArticle)
        .map((item) => ({ region: item.region, source: item.sourceName, title: item.title })),
      yesterday: previous.titles,
    }),
    effort: "low",
    maxTokens: 4000,
  });

  const picked: Record<Region, SourceArticle[]> = { de: [], int: [] };
  for (const region of ["de", "int"] as const) {
    const ids = region === "de" ? ranking.german : ranking.international;
    const ranked = [...new Set(ids)]
      .map((id) => byId.get(id))
      .filter((item): item is SourcedItem => item?.region === region);
    // Texte parallel laden, Reihenfolge der Rangliste beibehalten.
    const texts = await Promise.all(ranked.map(loadArticleText));
    ranked.forEach((item, i) => {
      if (picked[region].length < NEEDED[region] && texts[i].length >= MIN_ARTICLE_CHARS) {
        picked[region].push({
          region,
          source: item.sourceName,
          url: item.url,
          title: item.title,
          text: texts[i],
        });
      }
    });
    if (picked[region].length < NEEDED[region]) {
      throw new Error(`Nicht genug ladbare Artikel für ${region} (${picked[region].length}/${NEEDED[region]})`);
    }
  }

  const articles = [...picked.de, ...picked.int];
  const generated = await askStructured({
    schema: GeneratedLessonSchema,
    system: LESSON_SYSTEM,
    prompt: lessonPrompt(date, articles),
    effort: "medium",
    maxTokens: 16000,
  });

  return finalizeLesson(
    generated,
    articles.map((a) => ({ region: a.region, source_name: a.source, source_url: a.url })),
  );
}
