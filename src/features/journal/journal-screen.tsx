"use client";

import { useRouter } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import { formatLongDate } from "@/lib/date";
import { Mouse } from "@/features/shell/mouse";
import { PageHeader } from "@/features/shell/page-header";
import { EntryForm, EntryView } from "./entry-form";
import type { EntryTexts, JournalFeedback } from "./feedback";
import { FeedbackCard, FeedbackLoader } from "./feedback-card";
import { FeedbackToggle } from "./feedback-toggle";
import type { JournalEntry } from "./logic";
import { MoodOverview } from "./mood-overview";

type Section = "entry" | "overview";

const NOTICE_KEY = "ninaai.journalNotice";
const subscribe = () => () => {};
function noticeSeen(): boolean {
  try {
    return localStorage.getItem(NOTICE_KEY) === "1";
  } catch {
    return true;
  }
}

/** Journal: Daily Entry und Mood Overview (SPEC-journal). Keine Zähler, kein Druck. */
export function JournalScreen({
  today,
  dates,
  entries,
  editableDates,
  history,
  feedbackEnabled,
}: {
  today: string;
  /** Tage, für die sie jetzt schreiben kann (heute, vormittags auch gestern). */
  dates: string[];
  entries: JournalEntry[];
  editableDates: string[];
  /** Einträge für die Mood Overview (rund ein Jahr). */
  history: JournalEntry[];
  feedbackEnabled: boolean;
}) {
  const router = useRouter();
  const [section, setSection] = useState<Section>("entry");
  const [date, setDate] = useState(dates[0]);
  const [saved, setSaved] = useState<EntryTexts | null>(null);
  const [reading, setReading] = useState<JournalEntry | null>(null);
  const seen = useSyncExternalStore(subscribe, noticeSeen, () => true);
  const [noticeClosed, setNoticeClosed] = useState(false);

  const entry = entries.find((e) => e.date === date) ?? null;
  const editable = editableDates.includes(date);

  function closeNotice() {
    try {
      localStorage.setItem(NOTICE_KEY, "1");
    } catch {}
    setNoticeClosed(true);
  }

  return (
    <>
      <PageHeader icon={<Mouse className="size-14 shrink-0" />} title="Journal" subtitle={formatLongDate(today)} />

      {!seen && !noticeClosed && (
        <div className="card mb-4 flex items-start gap-3 bg-lavender-soft text-sm" role="note">
          <span aria-hidden>🔒</span>
          <p className="flex-1">
            Dein Journal ist privat – Benedikt sieht es nicht. Für das Englisch-Feedback gehen deine Texte an die
            KI (Claude).
          </p>
          <button type="button" onClick={closeNotice} className="font-extrabold text-lavender">
            Okay
          </button>
        </div>
      )}

      <div role="tablist" aria-label="Journal" className="mb-5 grid grid-cols-2 gap-1 rounded-full border-2 border-border bg-surface p-1">
        {(
          [
            ["entry", "Daily Entry"],
            ["overview", "Mood Overview"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            role="tab"
            type="button"
            aria-selected={section === key}
            onClick={() => {
              setSection(key);
              setReading(null);
            }}
            className={`rounded-full py-1.5 text-sm font-extrabold transition ${
              section === key ? "bg-accent text-on-accent" : "text-muted"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {section === "entry" && (
        <>
          {dates.length > 1 && (
            <div role="group" aria-label="Tag" className="mb-4 flex gap-2">
              {dates.map((d) => (
                <button
                  key={d}
                  type="button"
                  aria-pressed={date === d}
                  onClick={() => {
                    setDate(d);
                    setSaved(null);
                  }}
                  className={`chip px-3.5 py-1.5 text-sm ${date === d ? "bg-foreground text-background" : "bg-surface text-muted"}`}
                >
                  {d === today ? "Heute" : "Gestern nachtragen"}
                </button>
              ))}
            </div>
          )}

          {saved ? (
            <>
              <div className="card animate-pop bg-accent-soft text-center">
                <Mouse mood="party" className="mx-auto size-20" />
                <p className="mt-2 text-lg font-extrabold">Danke fürs Schreiben 🌸</p>
                <p className="text-sm text-muted">Dein Eintrag ist gespeichert.</p>
                <button type="button" onClick={() => setSaved(null)} className="btn-secondary mt-4">
                  Eintrag ansehen
                </button>
              </div>
              {feedbackEnabled && <FeedbackLoader date={date} texts={saved} />}
            </>
          ) : (
            <>
              <EntryForm
                key={`${date}-${entry?.updated_at ?? "new"}`}
                date={date}
                entry={entry}
                editable={editable}
                onSaved={(texts) => {
                  setSaved(texts);
                  router.refresh();
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              />
              {entry && feedbackEnabled && <StoredFeedback entry={entry} />}
            </>
          )}
          <FeedbackToggle initial={feedbackEnabled} />
        </>
      )}

      {section === "overview" &&
        (reading ? (
          <>
            <button type="button" onClick={() => setReading(null)} className="mb-3 text-sm font-bold text-accent-ink">
              ← Zurück
            </button>
            <p className="mb-3 font-extrabold">{formatLongDate(reading.date)}</p>
            <EntryView entry={reading} />
            <StoredFeedback entry={reading} />
          </>
        ) : (
          <MoodOverview entries={history} today={today} onRead={setReading} />
        ))}
    </>
  );
}

/** Gespeichertes Feedback zur aktuellen Fassung eines Eintrags anzeigen. */
function StoredFeedback({ entry }: { entry: JournalEntry }) {
  const feedback = entry.feedback as JournalFeedback | null;
  if (!feedback || feedback.for_updated_at !== entry.updated_at) return null;
  return (
    <FeedbackCard
      feedback={feedback}
      date={entry.date}
      texts={{ day_text: entry.day_text, gratitude: entry.gratitude, highlight: entry.highlight, tomorrow_focus: entry.tomorrow_focus }}
    />
  );
}
