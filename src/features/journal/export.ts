import { formatLongDate } from "@/lib/date";
import type { JournalEntry } from "./logic";
import { QUESTIONS } from "./logic";

type Review = { month: string; summary_en: string };

/** Das ganze Journal als lesbare Markdown-Datei (SPEC-journal › Export). */
export function journalToMarkdown(entries: JournalEntry[], reviews: Review[], exportedOn: string): string {
  const lines = [`# Mein NinAI-Journal`, ``, `Exportiert am ${formatLongDate(exportedOn)} ${exportedOn.slice(0, 4)}`, ``];
  for (const e of [...entries].sort((a, b) => a.date.localeCompare(b.date))) {
    lines.push(`## ${formatLongDate(e.date)} ${e.date.slice(0, 4)}`, ``);
    lines.push(`**Bewertung:** ${e.rating}/10${e.mood_word ? ` · ${e.mood_word}` : ""}`, ``);
    lines.push(`**${QUESTIONS.day_text.label}**`, ``, e.day_text, ``);
    lines.push(`**${QUESTIONS.gratitude.label}**`, ``, ...e.gratitude.map((g) => `- ${g}`), ``);
    if (e.highlight) lines.push(`**${QUESTIONS.highlight.label}**`, ``, e.highlight, ``);
    if (e.tomorrow_focus) lines.push(`**${QUESTIONS.tomorrow_focus.label}**`, ``, e.tomorrow_focus, ``);
  }
  if (reviews.length > 0) {
    lines.push(`# Monatsrückblicke`, ``);
    for (const r of [...reviews].sort((a, b) => a.month.localeCompare(b.month))) {
      lines.push(`## ${r.month.slice(0, 7)}`, ``, r.summary_en, ``);
    }
  }
  return lines.join("\n");
}
