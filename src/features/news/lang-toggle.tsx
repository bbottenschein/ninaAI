"use client";

import { NEWS_LANG_COOKIE, type NewsLang } from "./lang";

type Lang = NewsLang;

/** Merkt die Sprachwahl für News und Quiz (Cookie, damit beim Laden nichts flackert). */
export function saveNewsLang(lang: Lang) {
  document.cookie = `${NEWS_LANG_COOKIE}=${lang}; path=/; max-age=31536000; samesite=lax`;
}

export function LangToggle({ lang, onChange }: { lang: Lang; onChange: (lang: Lang) => void }) {
  return (
    <div role="group" aria-label="Sprache" className="flex rounded-full border-2 border-border bg-surface p-1">
      {(["en", "de"] as const).map((option) => (
        <button
          key={option}
          type="button"
          aria-pressed={lang === option}
          onClick={() => onChange(option)}
          className={`rounded-full px-3.5 py-1.5 text-sm font-extrabold transition-colors ${
            lang === option ? "bg-accent text-on-accent" : "text-muted"
          }`}
        >
          {option.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
