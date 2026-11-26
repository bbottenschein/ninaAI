"use client";

import { useRouter } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import { formatLongDate } from "@/lib/date";
import { Mouse } from "@/features/shell/mouse";
import { PageHeader } from "@/features/shell/page-header";
import { EntryForm, EntryView } from "./entry-form";
import { MOOD_EMOJI, type JournalEntry } from "./logic";
import { RatingFlower } from "./rating-flower";

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
  recent,
}: {
  today: string;
  /** Tage, für die sie jetzt schreiben kann (heute, vormittags auch gestern). */
  dates: string[];
  entries: JournalEntry[];
  editableDates: string[];
  recent: JournalEntry[];
}) {
  const router = useRouter();
  const [section, setSection] = useState<Section>("entry");
  const [date, setDate] = useState(dates[0]);
  const [saved, setSaved] = useState(false);
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
                    setSaved(false);
                  }}
                  className={`chip px-3.5 py-1.5 text-sm ${date === d ? "bg-foreground text-background" : "bg-surface text-muted"}`}
                >
                  {d === today ? "Heute" : "Gestern nachtragen"}
                </button>
              ))}
            </div>
          )}

          {saved ? (
            <div className="card animate-pop bg-accent-soft text-center">
              <Mouse mood="party" className="mx-auto size-20" />
              <p className="mt-2 text-lg font-extrabold">Danke fürs Schreiben 🌸</p>
              <p className="text-sm text-muted">Dein Eintrag ist gespeichert.</p>
              <button type="button" onClick={() => setSaved(false)} className="btn-secondary mt-4">
                Eintrag ansehen
              </button>
            </div>
          ) : (
            <EntryForm
              key={`${date}-${entry?.updated_at ?? "new"}`}
              date={date}
              entry={entry}
              editable={editable}
              onSaved={() => {
                setSaved(true);
                router.refresh();
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            />
          )}
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
          </>
        ) : (
          <>
            <div className="card mb-4 bg-lavender-soft text-sm">
              Woche, Monat, Jahr und die Gratitude Wall kommen mit dem nächsten Update (Phase J2).
            </div>
            {recent.length === 0 ? (
              <div className="card flex flex-col items-center gap-2 py-8 text-center text-muted">
                <Mouse mood="sleepy" className="size-16" />
                <p>Hier wächst bald deine Stimmungs-Wiese.</p>
              </div>
            ) : (
              <ul className="flex flex-col gap-2">
                {recent.map((e) => (
                  <li key={e.id}>
                    <button
                      type="button"
                      onClick={() => setReading(e)}
                      className="card flex w-full items-center gap-3 py-3 text-left transition active:scale-[0.99]"
                    >
                      <RatingFlower rating={e.rating} className="size-12 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="font-bold">{formatLongDate(e.date)}</p>
                        <p lang="en" className="truncate text-sm text-muted">
                          {e.mood_word ? `${MOOD_EMOJI[e.mood_word]} ${e.mood_word} · ` : ""}
                          {e.day_text}
                        </p>
                      </div>
                      <span className="font-extrabold text-accent-ink">{e.rating}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        ))}
    </>
  );
}
