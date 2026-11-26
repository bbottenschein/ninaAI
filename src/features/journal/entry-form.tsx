"use client";

import { useState, useTransition } from "react";
import { useDictation } from "@/features/tutor/use-dictation";
import { saveJournalEntry } from "./actions";
import {
  MOOD_EMOJI,
  MOOD_WORDS,
  QUESTIONS,
  RATING_LABELS,
  RATING_MAX,
  RATING_MIN,
  type JournalEntry,
  type MoodWord,
} from "./logic";
import { RatingFlower } from "./rating-flower";

type Field = "day_text" | "gratitude0" | "gratitude1" | "gratitude2" | "highlight" | "tomorrow_focus";

/** Abend-Eintrag (SPEC-journal › Daily Entry): Bewertung, Stimmungswort, vier Fragen. */
export function EntryForm({
  date,
  entry,
  editable,
  onSaved,
}: {
  date: string;
  entry: JournalEntry | null;
  editable: boolean;
  onSaved: () => void;
}) {
  const [rating, setRating] = useState(entry?.rating ?? 6);
  const [touched, setTouched] = useState(Boolean(entry));
  const [mood, setMood] = useState<MoodWord | null>(entry?.mood_word ?? null);
  const [values, setValues] = useState<Record<Field, string>>({
    day_text: entry?.day_text ?? "",
    gratitude0: entry?.gratitude[0] ?? "",
    gratitude1: entry?.gratitude[1] ?? "",
    gratitude2: entry?.gratitude[2] ?? "",
    highlight: entry?.highlight ?? "",
    tomorrow_focus: entry?.tomorrow_focus ?? "",
  });
  const [active, setActive] = useState<Field | null>(null);
  const [help, setHelp] = useState<keyof typeof QUESTIONS | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Ein Mikrofon für alle Felder: der erkannte Text landet im gerade gewählten Feld.
  const dictation = useDictation((text) => {
    if (!active) return;
    setValues((v) => ({ ...v, [active]: v[active] ? `${v[active]} ${text}` : text }));
  });

  const set = (field: Field, value: string) => setValues((v) => ({ ...v, [field]: value }));

  function insertStarter(question: keyof typeof QUESTIONS, starter: string) {
    const field: Field =
      question === "gratitude"
        ? ((["gratitude0", "gratitude1", "gratitude2"] as const).find((f) => !values[f].trim()) ?? "gratitude0")
        : question;
    const text = starter.replace(" …", " ").replace("…", "");
    set(field, values[field] ? `${values[field]} ${text}` : text);
    setHelp(null);
  }

  function save() {
    setError(null);
    if (!touched) {
      setError("Wie war dein Tag? Zieh den Regler auf deine Bewertung.");
      return;
    }
    startTransition(async () => {
      const result = await saveJournalEntry(date, {
        rating,
        mood_word: mood,
        day_text: values.day_text,
        gratitude: [values.gratitude0, values.gratitude1, values.gratitude2],
        highlight: values.highlight,
        tomorrow_focus: values.tomorrow_focus,
      });
      if (result.error) setError(result.error);
      else onSaved();
    });
  }

  if (!editable && entry) return <EntryView entry={entry} />;

  const mic = (field: Field) =>
    dictation.supported && (
      <button
        type="button"
        onClick={() => {
          setActive(field);
          if (dictation.recording && active !== field) return;
          dictation.toggle();
        }}
        disabled={dictation.transcribing}
        aria-label={dictation.recording && active === field ? "Aufnahme beenden" : "Sprechen"}
        className={`flex size-9 shrink-0 items-center justify-center rounded-full text-base transition active:scale-90 ${
          dictation.recording && active === field ? "animate-pulse bg-accent text-on-accent" : "bg-accent-soft"
        }`}
      >
        {dictation.recording && active === field ? "■" : "🎙️"}
      </button>
    );

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
      className="flex flex-col gap-5"
    >
      {/* Tagesbewertung */}
      <section className="card text-center">
        <p lang="en" className="font-extrabold">
          How was your day overall?
        </p>
        <RatingFlower rating={rating} className="mx-auto size-40" />
        <p className="text-3xl font-extrabold tabular-nums text-accent-ink">{touched ? rating : "?"}</p>
        <input
          type="range"
          min={RATING_MIN}
          max={RATING_MAX}
          step={1}
          value={rating}
          onChange={(e) => {
            setRating(Number(e.target.value));
            setTouched(true);
          }}
          aria-label="Tagesbewertung von 1 bis 10"
          className="mt-2 w-full accent-[var(--accent)]"
        />
        <div lang="en" className="flex justify-between text-xs font-bold text-muted">
          <span>1 · {RATING_LABELS.min}</span>
          <span>{RATING_LABELS.max} · 10</span>
        </div>

        <div role="group" aria-label="Stimmungswort" className="mt-4 flex flex-wrap justify-center gap-1.5">
          {MOOD_WORDS.map((m) => (
            <button
              key={m}
              type="button"
              lang="en"
              aria-pressed={mood === m}
              onClick={() => setMood(mood === m ? null : m)}
              className={`chip px-3 py-1.5 text-sm transition ${mood === m ? "bg-accent text-on-accent" : "bg-background text-muted"}`}
            >
              {MOOD_EMOJI[m]} {m}
            </button>
          ))}
        </div>
      </section>

      {/* Fragen */}
      <Question id="day_text" required help={help} setHelp={setHelp} onStarter={insertStarter}>
        <div className="flex items-start gap-2">
          <textarea
            lang="en"
            value={values.day_text}
            onChange={(e) => set("day_text", e.target.value)}
            onFocus={() => setActive("day_text")}
            rows={4}
            maxLength={5000}
            className="input min-w-0 flex-1"
          />
          {mic("day_text")}
        </div>
      </Question>

      <Question id="gratitude" required help={help} setHelp={setHelp} onStarter={insertStarter}>
        <div className="flex flex-col gap-2">
          {(["gratitude0", "gratitude1", "gratitude2"] as const).map((f, i) => (
            <div key={f} className="flex items-center gap-2">
              <span className="text-sm text-muted" aria-hidden>
                {i + 1}.
              </span>
              <input
                lang="en"
                value={values[f]}
                onChange={(e) => set(f, e.target.value)}
                onFocus={() => setActive(f)}
                maxLength={300}
                className="input min-w-0 flex-1 py-2.5"
                aria-label={`Dankbarkeit ${i + 1}`}
              />
              {mic(f)}
            </div>
          ))}
        </div>
      </Question>

      {(["highlight", "tomorrow_focus"] as const).map((f) => (
        <Question key={f} id={f} help={help} setHelp={setHelp} onStarter={insertStarter}>
          <div className="flex items-center gap-2">
            <input
              lang="en"
              value={values[f]}
              onChange={(e) => set(f, e.target.value)}
              onFocus={() => setActive(f)}
              maxLength={1000}
              className="input min-w-0 flex-1 py-2.5"
            />
            {mic(f)}
          </div>
        </Question>
      ))}

      {(dictation.recording || dictation.transcribing) && (
        <p className="text-center text-sm text-muted" role="status">
          {dictation.recording ? `Ich höre zu … ${dictation.seconds}s – tippe ■ zum Beenden` : "Ich schreibe mit …"}
        </p>
      )}
      {dictation.error && <p className="text-center text-sm text-muted">{dictation.error}</p>}
      {error && (
        <p role="alert" className="text-center text-sm text-danger">
          {error}
        </p>
      )}

      <button disabled={pending} className="btn-primary w-full text-lg">
        {pending ? "Speichern …" : entry ? "Änderungen speichern" : "Eintrag speichern 🌸"}
      </button>
    </form>
  );
}

function Question({
  id,
  required,
  help,
  setHelp,
  onStarter,
  children,
}: {
  id: keyof typeof QUESTIONS;
  required?: boolean;
  help: keyof typeof QUESTIONS | null;
  setHelp: (id: keyof typeof QUESTIONS | null) => void;
  onStarter: (id: keyof typeof QUESTIONS, starter: string) => void;
  children: React.ReactNode;
}) {
  const q = QUESTIONS[id];
  return (
    <section className="card">
      <div className="mb-2 flex items-start justify-between gap-2">
        <p lang="en" className="font-extrabold">
          {q.label}
          {!required && <span className="ml-1 text-xs font-semibold text-muted">(optional)</span>}
        </p>
        <button
          type="button"
          onClick={() => setHelp(help === id ? null : id)}
          aria-expanded={help === id}
          className="shrink-0 rounded-full bg-lavender-soft px-2.5 py-1 text-xs font-extrabold text-lavender"
        >
          💡 Hilfe
        </button>
      </div>
      {help === id && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {q.starters.map((s) => (
            <button
              key={s}
              type="button"
              lang="en"
              onClick={() => onStarter(id, s)}
              className="chip bg-lavender-soft px-3 py-1.5 text-sm text-lavender"
            >
              {s}
            </button>
          ))}
        </div>
      )}
      {children}
    </section>
  );
}

/** Nur lesen: vergangene Einträge nach dem Zeitfenster. */
export function EntryView({ entry }: { entry: JournalEntry }) {
  return (
    <div className="flex flex-col gap-4">
      <section className="card text-center">
        <RatingFlower rating={entry.rating} className="mx-auto size-28" />
        <p className="text-2xl font-extrabold text-accent-ink">{entry.rating}/10</p>
        {entry.mood_word && (
          <p lang="en" className="text-sm text-muted">
            {MOOD_EMOJI[entry.mood_word]} {entry.mood_word}
          </p>
        )}
      </section>
      <ReadBlock title={QUESTIONS.day_text.label} text={entry.day_text} />
      <section className="card">
        <p lang="en" className="mb-2 font-extrabold">
          {QUESTIONS.gratitude.label}
        </p>
        <ul lang="en" className="flex flex-col gap-1.5">
          {entry.gratitude.map((g, i) => (
            <li key={i} className="rounded-2xl bg-accent-soft px-3 py-2">
              🌸 {g}
            </li>
          ))}
        </ul>
      </section>
      {entry.highlight && <ReadBlock title={QUESTIONS.highlight.label} text={entry.highlight} />}
      {entry.tomorrow_focus && <ReadBlock title={QUESTIONS.tomorrow_focus.label} text={entry.tomorrow_focus} />}
    </div>
  );
}

function ReadBlock({ title, text }: { title: string; text: string }) {
  return (
    <section className="card">
      <p lang="en" className="mb-1 font-extrabold">
        {title}
      </p>
      <p lang="en" className="whitespace-pre-line">
        {text}
      </p>
    </section>
  );
}
