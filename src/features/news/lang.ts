export type NewsLang = "en" | "de";

/** Gemerkte Sprachwahl; die Seite liest das Cookie, damit beim Laden nichts flackert. */
export const NEWS_LANG_COOKIE = "ninaai_news_lang";

export function parseNewsLang(value: string | undefined): NewsLang {
  return value === "de" ? "de" : "en";
}
