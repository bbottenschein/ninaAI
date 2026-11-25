import { stripHtml } from "./normalize";

const MIN_PARAGRAPH = 40;
const MAX_CHARS = 8000;

/**
 * Zieht den Fließtext aus einer Artikelseite: alle <p> innerhalb von <article>
 * (falls vorhanden, sonst der ganzen Seite), ohne kurze Schnipsel wie
 * Bildunterschriften oder Navigationspunkte. Bewusst einfach gehalten – für
 * tagesschau und BBC reicht das. Liefert eine Seite zu wenig Text, wird die
 * Meldung nicht ausgewählt (Regel „Ämter nur aus dem Quelltext“).
 */
export function extractArticleText(html: string): string {
  const articles = [...html.matchAll(/<article\b[^>]*>([\s\S]*?)<\/article>/gi)].map((m) => m[1]);
  const scope = articles.length > 0 ? articles.join("\n") : html;

  const paragraphs: string[] = [];
  const seen = new Set<string>();
  for (const match of scope.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)) {
    const paragraph = stripHtml(match[1]);
    if (paragraph.length < MIN_PARAGRAPH || seen.has(paragraph)) continue;
    seen.add(paragraph);
    paragraphs.push(paragraph);
  }

  let result = "";
  for (const paragraph of paragraphs) {
    if (result.length + paragraph.length > MAX_CHARS) break;
    result += (result ? "\n\n" : "") + paragraph;
  }
  return result;
}
