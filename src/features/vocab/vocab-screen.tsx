"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { Mascot } from "@/features/shell/mascot";
import { PageHeader } from "@/features/shell/page-header";
import { answerVocab, deleteVocab } from "./actions";
import {
  ROUND_SIZE,
  buildOptions,
  pickRound,
  promptOf,
  answerOf,
  seededRng,
  type Direction,
  type VocabWord,
} from "./quiz";

type Filter = "all" | "new" | "learned";
type Question = { word: VocabWord; options: string[] };

const MIN_WORDS = 4;

export function VocabScreen({ words }: { words: VocabWord[] }) {
  const [round, setRound] = useState<{ questions: Question[]; direction: Direction } | null>(null);
  const [direction, setDirection] = useState<Direction>("en-de");

  function startRound() {
    const rng = seededRng(Date.now());
    const picked = pickRound(words, ROUND_SIZE, rng);
    setRound({
      direction,
      questions: picked.map((word) => ({ word, options: buildOptions(word, words, direction, rng) })),
    });
  }

  if (round) {
    return <VocabQuiz key={round.questions.map((q) => q.word.id).join()} {...round} onExit={() => setRound(null)} onAgain={startRound} />;
  }

  const learned = words.filter((w) => w.learned).length;
  return (
    <>
      <PageHeader
        icon={<Mascot className="size-14 shrink-0" />}
        title="Vokabeln"
        subtitle={`${words.length} Wörter · ${learned} gelernt`}
      />

      <section className="card mb-6 bg-lavender-soft">
        <p className="text-lg font-extrabold">🧠 Vokabel-Quiz</p>
        <p className="text-sm text-muted">
          {ROUND_SIZE} Wörter pro Runde. Wörter, die du oft falsch hast, kommen öfter dran – dreimal richtig
          hintereinander und sie gelten als gelernt.
        </p>
        <div role="group" aria-label="Richtung" className="mt-4 grid grid-cols-2 gap-2">
          {(["en-de", "de-en"] as const).map((d) => (
            <button
              key={d}
              type="button"
              aria-pressed={direction === d}
              onClick={() => setDirection(d)}
              className={`rounded-full border-2 py-2 text-sm font-extrabold transition ${
                direction === d ? "border-lavender bg-lavender text-surface" : "border-border bg-surface text-muted"
              }`}
            >
              {d === "en-de" ? "🇬🇧 → 🇩🇪" : "🇩🇪 → 🇬🇧"}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={startRound}
          disabled={words.length < MIN_WORDS}
          className="btn-primary mt-3 w-full"
        >
          Quiz starten
        </button>
        {words.length < MIN_WORDS && (
          <p className="mt-2 text-center text-xs text-muted">Ab {MIN_WORDS} Wörtern geht&apos;s los.</p>
        )}
      </section>

      <WordList words={words} />
    </>
  );
}

function WordList({ words }: { words: VocabWord[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [open, setOpen] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return words.filter(
      (w) =>
        (filter === "all" || (filter === "learned" ? w.learned : !w.learned)) &&
        (!q || w.word_en.toLowerCase().includes(q) || w.translation_de.toLowerCase().includes(q)),
    );
  }, [words, query, filter]);

  return (
    <>
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Suchen …"
        className="input mb-3"
        aria-label="Vokabeln durchsuchen"
      />
      <div role="group" aria-label="Filter" className="mb-4 flex gap-2">
        {(
          [
            ["all", "Alle"],
            ["new", "Neu"],
            ["learned", "Gelernt"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            aria-pressed={filter === key}
            onClick={() => setFilter(key)}
            className={`chip px-3.5 py-1.5 text-sm ${filter === key ? "bg-accent text-on-accent" : "bg-surface text-muted"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="card text-center text-muted">
          {words.length === 0
            ? "Noch keine Wörter. Die Vokabeln aus den News landen automatisch hier."
            : "Keine Treffer."}
        </p>
      ) : (
        <ul className="card divide-y divide-border p-0">
          {visible.map((w) => (
            <li key={w.id}>
              <button
                type="button"
                onClick={() => setOpen(open === w.id ? null : w.id)}
                aria-expanded={open === w.id}
                className="flex w-full items-center justify-between gap-3 px-5 py-3 text-left"
              >
                <span lang="en" className="font-bold">
                  {w.word_en}
                </span>
                <span className="flex items-center gap-2 text-sm text-muted">
                  {w.translation_de}
                  {w.learned && <span className="chip bg-mint-soft text-mint">✓</span>}
                </span>
              </button>
              {open === w.id && (
                <div className="px-5 pb-4 text-sm">
                  {w.explanation && <p lang="en">{w.explanation}</p>}
                  {w.example && (
                    <p lang="en" className="mt-2 text-muted italic">
                      „{w.example}“
                    </p>
                  )}
                  <div className="mt-3 flex items-center justify-between text-xs text-muted">
                    <span>
                      {w.source_date ? `Aus den News vom ${formatShort(w.source_date)}` : ""}
                      {w.times_wrong > 0 ? ` · ${w.times_wrong}× falsch` : ""}
                    </span>
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => startTransition(() => deleteVocab(w.id))}
                      className="font-bold text-danger"
                    >
                      Löschen
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function VocabQuiz({
  questions,
  direction,
  onExit,
  onAgain,
}: {
  questions: Question[];
  direction: Direction;
  onExit: () => void;
  onAgain: () => void;
}) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [chosen, setChosen] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [newlyLearned, setNewlyLearned] = useState<string[]>([]);
  const [done, setDone] = useState(false);

  const { word, options } = questions[index];
  const correct = answerOf(word, direction);

  function choose(option: string) {
    if (chosen) return;
    setChosen(option);
    const ok = option === correct;
    if (ok) setScore((s) => s + 1);
    // Lernstand im Hintergrund speichern.
    answerVocab(word.id, ok).then((r) => {
      if (r.learned && !word.learned) setNewlyLearned((list) => [...list, word.word_en]);
    });
  }

  function next() {
    if (index + 1 >= questions.length) {
      setDone(true);
      router.refresh();
    } else {
      setIndex(index + 1);
      setChosen(null);
    }
  }

  if (done) {
    return (
      <div className="card animate-pop bg-lavender-soft text-center">
        <Mascot mood="party" className="mx-auto size-24" />
        <p className="mt-2 text-sm font-bold text-muted">Runde geschafft</p>
        <p className="text-5xl font-extrabold tabular-nums">
          {score}/{questions.length}
        </p>
        {newlyLearned.length > 0 && (
          <p className="mt-2 font-semibold">🎓 Neu gelernt: {newlyLearned.join(", ")}</p>
        )}
        <div className="mt-5 grid grid-cols-2 gap-3">
          <button type="button" onClick={onExit} className="btn-secondary">
            Zur Liste
          </button>
          <button type="button" onClick={onAgain} className="btn-primary">
            Nochmal 🔁
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <header className="mb-4 flex items-center justify-between">
        <button type="button" onClick={onExit} className="text-sm font-bold text-accent-ink">
          ← Vokabeln
        </button>
        <p className="text-sm font-semibold text-muted">
          {index + 1} / {questions.length}
        </p>
      </header>
      <div className="mb-5 h-2.5 overflow-hidden rounded-full bg-border">
        <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${(index / questions.length) * 100}%` }} />
      </div>

      <section key={word.id} className="card animate-pop text-center">
        <p className="text-sm font-bold text-muted">{direction === "en-de" ? "Was heißt auf Deutsch …" : "What's the English word for …"}</p>
        <p lang={direction === "en-de" ? "en" : "de"} className="mt-2 text-3xl font-extrabold">
          {promptOf(word, direction)}
        </p>
        <ul className="mt-6 flex flex-col gap-2.5 text-left">
          {options.map((option) => {
            const style = !chosen
              ? "border-border bg-surface active:scale-[0.98]"
              : option === correct
                ? "border-mint bg-mint-soft"
                : option === chosen
                  ? "border-accent bg-accent-soft"
                  : "border-border bg-surface opacity-60";
            return (
              <li key={option}>
                <button
                  type="button"
                  disabled={Boolean(chosen)}
                  onClick={() => choose(option)}
                  lang={direction === "en-de" ? "de" : "en"}
                  className={`w-full rounded-2xl border-2 px-4 py-3 font-semibold transition ${style}`}
                >
                  {option}
                </button>
              </li>
            );
          })}
        </ul>
        {chosen && word.example && (
          <p lang="en" className="mt-4 text-sm text-muted italic">
            „{word.example}“
          </p>
        )}
      </section>

      {chosen && (
        <button type="button" onClick={next} className="btn-primary mt-5 w-full">
          {index + 1 >= questions.length ? "Ergebnis ansehen" : "Weiter ›"}
        </button>
      )}
    </>
  );
}

function formatShort(date: string): string {
  return new Intl.DateTimeFormat("de-DE", { day: "numeric", month: "short", timeZone: "UTC" }).format(
    new Date(`${date}T00:00:00Z`),
  );
}
