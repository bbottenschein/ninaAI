import Link from "next/link";
import { MOOD_EMOJI, type JournalEntry } from "./logic";
import { RatingFlower } from "./rating-flower";

/**
 * Ruhige Journal-Karte auf Home (SPEC-journal › Navigation): ab 18:00 eine Einladung
 * ohne Status oder Zähler, nach dem Eintrag die Bewertung des Tages (mit PIN ohne Bewertung).
 */
export function JournalHomeCard({ entry, hideRating = false }: { entry: JournalEntry | null; hideRating?: boolean }) {
  // Mit PIN verrät Home nichts über den Tag – nur, dass der Eintrag da ist.
  if (entry && hideRating) {
    return (
      <Link href="/journal" className="card mb-6 flex items-center gap-3 transition active:scale-[0.99]">
        <span className="text-3xl" aria-hidden>
          🔒
        </span>
        <p lang="en" className="min-w-0 flex-1 font-bold">
          Journal · written today 🌸
        </p>
        <span className="text-muted" aria-hidden>
          ›
        </span>
      </Link>
    );
  }
  if (entry) {
    return (
      <Link href="/journal" className="card mb-6 flex items-center gap-3 transition active:scale-[0.99]">
        <RatingFlower rating={entry.rating} className="size-14 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-extrabold tracking-wide text-accent-ink uppercase">Journal</p>
          <p lang="en" className="font-bold">
            Your day: {entry.rating}/10 {entry.mood_word ? `· ${MOOD_EMOJI[entry.mood_word]} ${entry.mood_word}` : ""}
          </p>
        </div>
        <span className="text-muted" aria-hidden>
          ›
        </span>
      </Link>
    );
  }
  return (
    <Link href="/journal" className="card mb-6 flex items-center gap-3 bg-lavender-soft transition active:scale-[0.99]">
      <span className="text-3xl" aria-hidden>
        🌙
      </span>
      <div className="min-w-0 flex-1">
        <p lang="en" className="font-extrabold">
          Write about your day
        </p>
        <p className="text-sm text-muted">Ein paar Minuten nur für dich.</p>
      </div>
      <span className="text-muted" aria-hidden>
        ›
      </span>
    </Link>
  );
}
