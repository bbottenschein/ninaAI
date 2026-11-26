"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import type { QuizQuestion } from "@/features/lesson/schema";
import { Mouse } from "@/features/shell/mouse";
import type { NewsLang } from "@/features/news/lang";
import { LangToggle, saveNewsLang } from "@/features/news/lang-toggle";
import { answerQuizQuestion } from "./actions";
import { quizState, type QuizAnswer } from "./logic";

const DIFFICULTY: Record<QuizQuestion["difficulty"], { label: string; chip: string }> = {
  easy: { label: "Leicht", chip: "bg-mint-soft text-mint" },
  medium: { label: "Mittel", chip: "bg-sun-soft text-sun" },
  hard: { label: "Knifflig", chip: "bg-lavender-soft text-lavender" },
};

export function QuizRunner({
  date,
  quiz,
  newsTitles,
  initialAnswers,
  initialLang,
  readOnly,
}: {
  date: string;
  quiz: QuizQuestion[];
  newsTitles: { en: string; de: string }[];
  initialAnswers: QuizAnswer[];
  initialLang: NewsLang;
  readOnly: boolean;
}) {
  const [lang, setLang] = useState<NewsLang>(initialLang);
  const [answers, setAnswers] = useState<QuizAnswer[]>(initialAnswers);
  // Nach einer Antwort bleibt die Frage mit Erklärung stehen, bis „Weiter“ getippt wird.
  const [current, setCurrent] = useState(Math.min(initialAnswers.length, quiz.length - 1));
  const [showResult, setShowResult] = useState(initialAnswers.length >= quiz.length);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const state = quizState(answers, quiz.length);

  function chooseLang(next: NewsLang) {
    setLang(next);
    saveNewsLang(next);
  }

  function answer(choice: number) {
    setError(null);
    startTransition(async () => {
      const result = await answerQuizQuestion(date, current, choice);
      if ("error" in result) setError(result.error);
      else setAnswers(result.answers);
    });
  }

  function next() {
    if (current + 1 >= quiz.length) setShowResult(true);
    else setCurrent(current + 1);
  }

  const header = (
    <header className="mb-4 flex items-center justify-between gap-4">
      <div>
        <Link href="/" className="text-sm font-bold text-accent-ink">
          ← Heute
        </Link>
        <h1 className="text-[1.75rem] leading-tight font-extrabold tracking-tight">Quiz of the Day</h1>
      </div>
      <LangToggle lang={lang} onChange={chooseLang} />
    </header>
  );

  if (showResult) {
    return (
      <>
        {header}
        <div className="card animate-pop bg-accent-soft text-center">
          <Mouse mood="party" className="mx-auto size-24" />
          <p className="mt-2 text-sm font-bold text-muted">Dein Ergebnis</p>
          <p className="text-5xl font-extrabold tabular-nums">
            {state.score}/{quiz.length}
          </p>
          <p className="mt-2 font-semibold">
            {state.score === quiz.length
              ? "Perfekt! Alles richtig."
              : state.score >= quiz.length / 2
                ? "Stark gemacht!"
                : "Gut, dass du drangeblieben bist!"}
          </p>
          <p className="mt-1 text-sm text-muted">Jetzt folgt das Gespräch mit dem Tutor.</p>
          <Link href="/tutor" className="btn-primary mt-5 inline-block">
            Zum Tutor-Gespräch ›
          </Link>
        </div>

        <h2 className="mt-8 mb-3 font-extrabold">Deine Antworten</h2>
        <ol className="flex flex-col gap-3">
          {quiz.map((q, i) => {
            const a = answers.find((x) => x.question === i);
            const options = lang === "en" ? q.options_en : q.options_de;
            return (
              <li key={i} className="card py-4">
                <p lang={lang} className="font-bold">
                  {a?.correct ? "✅" : "❌"} {lang === "en" ? q.question_en : q.question_de}
                </p>
                <p lang={lang} className="mt-1 text-sm text-muted">
                  Richtig: {options[q.correct_index]}
                </p>
              </li>
            );
          })}
        </ol>
      </>
    );
  }

  const question = quiz[current];
  const given = answers.find((a) => a.question === current);
  const options = lang === "en" ? question.options_en : question.options_de;
  const newsTitle = newsTitles[question.news_index];

  return (
    <>
      {header}

      <div className="mb-5 flex items-center gap-3">
        <div className="flex gap-1.5" aria-hidden>
          {quiz.map((_, i) => (
            <span
              key={i}
              className={`h-2.5 w-8 rounded-full transition-colors ${
                i < answers.length ? "bg-accent" : i === current ? "bg-accent/40" : "bg-border"
              }`}
            />
          ))}
        </div>
        <p className="text-sm font-semibold text-muted">
          Frage {current + 1} von {quiz.length}
        </p>
      </div>

      <section key={current} className="card animate-pop">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`chip ${DIFFICULTY[question.difficulty].chip}`}>
            {DIFFICULTY[question.difficulty].label}
          </span>
          {newsTitle && (
            <span lang={lang} className="truncate text-xs font-semibold text-muted">
              📰 {lang === "en" ? newsTitle.en : newsTitle.de}
            </span>
          )}
        </div>
        <h2 lang={lang} className="mt-3 text-xl leading-snug font-extrabold">
          {lang === "en" ? question.question_en : question.question_de}
        </h2>

        <ul className="mt-5 flex flex-col gap-2.5">
          {options.map((option, i) => {
            const isCorrect = i === question.correct_index;
            const isChosen = given?.choice === i;
            const style = !given
              ? "border-border bg-surface active:scale-[0.98]"
              : isCorrect
                ? "border-mint bg-mint-soft"
                : isChosen
                  ? "border-accent bg-accent-soft"
                  : "border-border bg-surface opacity-60";
            return (
              <li key={i}>
                <button
                  type="button"
                  lang={lang}
                  disabled={Boolean(given) || pending || readOnly}
                  onClick={() => answer(i)}
                  className={`flex w-full items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left font-semibold transition ${style}`}
                >
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-background text-sm font-extrabold">
                    {given && isCorrect ? "✓" : given && isChosen ? "✗" : String.fromCharCode(65 + i)}
                  </span>
                  {option}
                </button>
              </li>
            );
          })}
        </ul>

        {given && (
          <div className={`mt-5 rounded-2xl p-4 ${given.correct ? "bg-mint-soft" : "bg-accent-soft"}`}>
            <p className="font-extrabold">{given.correct ? "Richtig! 🎉" : "Fast! 💪"}</p>
            <p lang={lang} className="mt-1 text-sm">
              {lang === "en" ? question.explanation_en : question.explanation_de}
            </p>
          </div>
        )}
      </section>

      {error && (
        <p role="alert" className="mt-4 text-center text-sm text-danger">
          {error}
        </p>
      )}

      {readOnly && !given && (
        <p className="mt-4 text-center text-sm text-muted">Noch nicht beantwortet (Ansicht der Spielerin).</p>
      )}

      {(given || readOnly) && (
        <button type="button" onClick={next} className="btn-primary mt-5 w-full">
          {current + 1 >= quiz.length ? "Ergebnis ansehen" : "Weiter ›"}
        </button>
      )}
    </>
  );
}
