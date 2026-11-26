"use client";

import { useEffect, useState, useTransition } from "react";
import { Mouse } from "@/features/shell/mouse";
import { markCorrections, type EntryTexts, type FieldKey, type JournalFeedback } from "./feedback";
import { addJournalVocab, generateJournalFeedback } from "./feedback-actions";
import { QUESTIONS } from "./logic";

/** Lädt bzw. erzeugt das Feedback nach dem Speichern und zeigt es an. */
export function FeedbackLoader({ date, texts }: { date: string; texts: EntryTexts }) {
  const [state, setState] = useState<
    { kind: "loading" } | { kind: "done"; feedback: JournalFeedback } | { kind: "off" } | { kind: "error"; message: string }
  >({ kind: "loading" });

  useEffect(() => {
    let active = true;
    generateJournalFeedback(date).then((r) => {
      if (!active) return;
      if (r.disabled) setState({ kind: "off" });
      else if (r.feedback) setState({ kind: "done", feedback: r.feedback });
      else setState({ kind: "error", message: r.error ?? "Das Feedback klappt gerade nicht." });
    });
    return () => {
      active = false;
    };
  }, [date]);

  if (state.kind === "off") return null;
  if (state.kind === "loading") {
    return (
      <div className="card mt-4 flex items-center gap-3" role="status">
        <Mouse mood="sleepy" className="size-10 shrink-0 animate-wiggle" />
        <p className="text-sm text-muted">Die Maus liest dein Englisch …</p>
      </div>
    );
  }
  if (state.kind === "error") return <p className="card mt-4 text-sm text-muted">{state.message}</p>;
  return <FeedbackCard feedback={state.feedback} texts={texts} date={date} />;
}

/** Englisch-Feedback (SPEC-journal › Englisch-Feedback): Original bleibt, Korrekturen markiert. */
export function FeedbackCard({ feedback, texts, date }: { feedback: JournalFeedback; texts: EntryTexts; date: string }) {
  const fields = (["day_text", "gratitude", "highlight", "tomorrow_focus"] as FieldKey[]).filter((f) =>
    feedback.corrections.some((c) => c.field === f),
  );

  return (
    <section className="card mt-4 flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <span aria-hidden>📝</span>
        <h2 className="font-extrabold">Feedback zu deinem Englisch</h2>
      </div>

      {feedback.praise_de && (
        <div className="rounded-2xl bg-mint-soft px-4 py-3">
          <p className="font-semibold">✨ {feedback.praise_de}</p>
          {feedback.praise_quote && (
            <p lang="en" className="mt-1 text-sm text-muted italic">
              „{feedback.praise_quote}“
            </p>
          )}
        </div>
      )}

      {feedback.corrections.length === 0 ? (
        <p className="text-sm">Keine Korrekturen – dein Englisch war heute richtig gut 🎉</p>
      ) : (
        <>
          {fields.map((f) => (
            <div key={f}>
              <p lang="en" className="mb-1 text-xs font-extrabold text-muted">
                {QUESTIONS[f].label}
              </p>
              {(f === "gratitude" ? texts.gratitude : [texts[f]]).map((text, i) => (
                <p key={i} lang="en" className="leading-relaxed">
                  {markCorrections(text, feedback.corrections.filter((c) => c.field === f)).map((s, j) =>
                    s.fix ? (
                      <span key={j}>
                        <s className="rounded bg-accent-soft px-0.5 text-accent-ink decoration-2">{s.text}</s>{" "}
                        <span className="rounded bg-mint-soft px-0.5 font-bold text-mint">
                          {s.fix.corrected}
                          <sup className="ml-0.5">{s.fix.index + 1}</sup>
                        </span>
                      </span>
                    ) : (
                      <span key={j}>{s.text}</span>
                    ),
                  )}
                </p>
              ))}
            </div>
          ))}
          <ol className="flex flex-col gap-1.5 text-sm">
            {feedback.corrections.map((c, i) => (
              <li key={i} className="flex gap-2">
                <span className="font-extrabold text-mint">{i + 1}</span>
                <span>{c.explanation_de}</span>
              </li>
            ))}
          </ol>
        </>
      )}

      {feedback.vocab.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-extrabold text-muted">Neue Wörter für dich</p>
          <ul className="flex flex-col gap-2">
            {feedback.vocab.map((v) => (
              <VocabSuggestion key={v.word_en} vocab={v} date={date} />
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function VocabSuggestion({ vocab, date }: { vocab: JournalFeedback["vocab"][number]; date: string }) {
  const [state, setState] = useState<"idle" | "added" | "duplicate" | "error">("idle");
  const [pending, startTransition] = useTransition();
  return (
    <li className="flex items-center gap-3 rounded-2xl bg-lavender-soft px-3 py-2.5">
      <div className="min-w-0 flex-1">
        <p className="font-bold">
          <span lang="en">{vocab.word_en}</span> <span className="font-semibold text-muted">· {vocab.translation_de}</span>
        </p>
        {vocab.example && (
          <p lang="en" className="truncate text-xs text-muted italic">
            {vocab.example}
          </p>
        )}
      </div>
      {state === "idle" || state === "error" ? (
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const r = await addJournalVocab({ ...vocab, date });
              setState(r.duplicate ? "duplicate" : r.error ? "error" : "added");
            })
          }
          className="shrink-0 rounded-full bg-surface px-3 py-1.5 text-xs font-extrabold text-lavender"
        >
          {state === "error" ? "Nochmal" : "+ Sammlung"}
        </button>
      ) : (
        <span className="shrink-0 text-xs font-extrabold text-mint">{state === "added" ? "✓ Übernommen" : "✓ Schon drin"}</span>
      )}
    </li>
  );
}
