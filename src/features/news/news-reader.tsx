"use client";

import Link from "next/link";
import { useEffect, useState, useTransition, type ReactNode } from "react";
import type { LessonNews } from "@/features/lesson/schema";
import { markNewsRead } from "./actions";
import { annotate, type Mark, type MarkKind } from "./annotate";
import { NEWS_LANG_COOKIE, type NewsLang } from "./lang";

type Lang = NewsLang;
type Selection = { news: number; kind: MarkKind; index: number };


const REGION_LABEL: Record<LessonNews["region"], string> = {
  de: "Deutschland",
  int: "International",
};

export function NewsReader({
  date,
  news,
  initialRead,
  initialLang,
  readOnly,
}: {
  date: string;
  news: LessonNews[];
  initialRead: number[];
  initialLang: Lang;
  readOnly: boolean;
}) {
  const [lang, setLang] = useState<Lang>(initialLang);
  const [read, setRead] = useState<number[]>(initialRead);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function chooseLang(next: Lang) {
    setLang(next);
    setSelection(null);
    document.cookie = `${NEWS_LANG_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
  }

  function markRead(index: number) {
    setError(null);
    startTransition(async () => {
      const result = await markNewsRead(date, index);
      if ("error" in result) setError(result.error);
      else setRead(result.read);
    });
  }

  const allRead = read.length >= news.length;

  return (
    <>
      <header className="mb-5 flex items-center justify-between gap-4">
        <div>
          <Link href="/" className="text-sm text-muted">
            ← Heute
          </Link>
          <h1 className="text-2xl font-semibold">News des Tages</h1>
        </div>
        <LangToggle lang={lang} onChange={chooseLang} />
      </header>

      <p className="mb-4 text-sm text-muted">
        {readOnly ? "Ansicht der Spielerin · " : ""}
        {read.length}/{news.length} gelesen · Markierte Wörter antippen
      </p>

      <ol className="flex flex-col gap-4">
        {news.map((item, i) => (
          <li key={i}>
            <NewsCard
              item={item}
              lang={lang}
              isRead={read.includes(i)}
              readOnly={readOnly}
              pending={pending}
              onSelect={(kind, index) => setSelection({ news: i, kind, index })}
              onMarkRead={() => markRead(i)}
            />
          </li>
        ))}
      </ol>

      {error && (
        <p role="alert" className="mt-4 text-center text-sm text-danger">
          {error}
        </p>
      )}

      {allRead && (
        <div className="card mt-6 text-center">
          <p className="font-semibold text-success">Alle 3 Meldungen gelesen ✓</p>
          <p className="mt-1 text-sm text-muted">Als Nächstes kommt das Quiz of the Day.</p>
          <Link href="/" className="btn-primary mt-4 inline-block">
            Zurück zu Heute
          </Link>
        </div>
      )}

      <Legend lang={lang} />

      {selection && (
        <DetailSheet
          item={news[selection.news]}
          selection={selection}
          lang={lang}
          onClose={() => setSelection(null)}
        />
      )}
    </>
  );
}

function LangToggle({ lang, onChange }: { lang: Lang; onChange: (lang: Lang) => void }) {
  return (
    <div role="group" aria-label="Sprache" className="flex rounded-full border border-border bg-surface p-1">
      {(["en", "de"] as const).map((option) => (
        <button
          key={option}
          type="button"
          aria-pressed={lang === option}
          onClick={() => onChange(option)}
          className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors ${
            lang === option ? "bg-accent text-on-accent" : "text-muted"
          }`}
        >
          {option.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

function marksFor(item: LessonNews, lang: Lang): Mark[] {
  const marks: Mark[] = [];
  item.terms.forEach((t, index) => marks.push({ kind: "term", needle: lang === "en" ? t.en : t.de, index }));
  item.persons.forEach((p, index) => marks.push({ kind: "person", needle: p.name, index }));
  if (lang === "en") {
    item.vocab.forEach((v, index) => marks.push({ kind: "vocab", needle: v.word, index }));
  }
  return marks;
}

const MARK_CLASS: Record<MarkKind, string> = {
  term: "underline decoration-accent decoration-dotted decoration-2 underline-offset-4",
  person: "rounded bg-accent-soft px-0.5 font-medium",
  vocab: "underline decoration-success decoration-wavy underline-offset-4",
};

function NewsCard({
  item,
  lang,
  isRead,
  readOnly,
  pending,
  onSelect,
  onMarkRead,
}: {
  item: LessonNews;
  lang: Lang;
  isRead: boolean;
  readOnly: boolean;
  pending: boolean;
  onSelect: (kind: MarkKind, index: number) => void;
  onMarkRead: () => void;
}) {
  const title = lang === "en" ? item.title_en : item.title_de;
  const text = lang === "en" ? item.text_en : item.text_de;
  const segments = annotate(text, marksFor(item, lang));

  return (
    <article className={`card ${isRead ? "border-success/40" : ""}`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">
        {REGION_LABEL[item.region]}
      </p>
      <h2 lang={lang} className="mt-1 text-lg font-semibold leading-snug">
        {title}
      </h2>
      <p lang={lang} className="mt-3 text-[1.0625rem] leading-relaxed">
        {segments.map((segment, i) =>
          segment.mark ? (
            <button
              key={i}
              type="button"
              onClick={() => onSelect(segment.mark!.kind, segment.mark!.index)}
              className={`inline text-left ${MARK_CLASS[segment.mark.kind]}`}
            >
              {segment.text}
            </button>
          ) : (
            <span key={i}>{segment.text}</span>
          ),
        )}
      </p>
      <div className="mt-4 flex items-center justify-between gap-3">
        <a
          href={item.source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="min-w-0 truncate text-sm text-muted underline"
        >
          Quelle: {item.source_name} ↗
        </a>
        {isRead ? (
          <span className="shrink-0 text-sm font-semibold text-success">✓ Gelesen</span>
        ) : readOnly ? (
          <span className="shrink-0 text-sm text-muted">Ungelesen</span>
        ) : (
          <button
            type="button"
            onClick={onMarkRead}
            disabled={pending}
            className="btn-secondary shrink-0 py-2 text-sm"
          >
            Gelesen
          </button>
        )}
      </div>
    </article>
  );
}

function Legend({ lang }: { lang: Lang }) {
  return (
    <p className="mt-6 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-muted">
      <span className={MARK_CLASS.term}>Begriff</span>
      <span className={MARK_CLASS.person}>Person</span>
      {lang === "en" && <span className={MARK_CLASS.vocab}>Vokabel</span>}
    </p>
  );
}

function DetailSheet({
  item,
  selection,
  lang,
  onClose,
}: {
  item: LessonNews;
  selection: Selection;
  lang: Lang;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  let label = "";
  let heading = "";
  let body: ReactNode = null;

  if (selection.kind === "term") {
    const term = item.terms[selection.index];
    label = "Begriff";
    heading = lang === "en" ? term.en : term.de;
    body = <p lang={lang}>{lang === "en" ? term.explanation_en : term.explanation_de}</p>;
  } else if (selection.kind === "person") {
    const person = item.persons[selection.index];
    const role = lang === "en" ? person.role_en : person.role_de;
    label = "Person";
    heading = person.name;
    body = role ? <p lang={lang}>{role}</p> : <p className="text-muted">Amt im Artikel nicht genannt.</p>;
  } else {
    const vocab = item.vocab[selection.index];
    label = "Vokabel";
    heading = vocab.word;
    body = (
      <>
        <p className="font-medium">{vocab.translation_de}</p>
        <p lang="en" className="mt-2">
          {vocab.explanation}
        </p>
        <p lang="en" className="mt-2 text-sm text-muted italic">
          „{vocab.example}“
        </p>
      </>
    );
  }

  return (
    <div className="fixed inset-0 z-20 flex items-end justify-center" role="dialog" aria-modal="true" aria-label={label}>
      <button type="button" aria-label="Schließen" onClick={onClose} className="absolute inset-0 bg-black/30" />
      <div className="relative w-full max-w-lg rounded-t-3xl border border-border bg-surface px-5 pt-5 pb-[calc(env(safe-area-inset-bottom)+1.5rem)]">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
        <h3 className="mt-1 text-xl font-semibold">{heading}</h3>
        <div className="mt-2 leading-relaxed">{body}</div>
        <button type="button" onClick={onClose} className="btn-secondary mt-5 w-full">
          Schließen
        </button>
      </div>
    </div>
  );
}
