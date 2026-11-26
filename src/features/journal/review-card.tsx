"use client";

import { useState } from "react";
import { monthNameEn } from "./review";
import type { JournalReview } from "./queries";

/** Monatsrückblick oben in der Mood Overview; ältere Rückblicke aufklappbar. */
export function ReviewCards({ reviews }: { reviews: JournalReview[] }) {
  const [showAll, setShowAll] = useState(false);
  if (reviews.length === 0) return null;
  const visible = showAll ? reviews : reviews.slice(0, 1);
  return (
    <div className="mb-5 flex flex-col gap-3">
      {visible.map((r) => (
        <section key={r.month} className="card bg-lavender-soft">
          <p className="text-xs font-extrabold tracking-wide text-lavender uppercase">Monthly Review</p>
          <h2 lang="en" className="mb-2 text-lg font-extrabold">
            🌷 {monthNameEn(r.month)}
          </h2>
          <p lang="en" className="leading-relaxed whitespace-pre-line">
            {r.summary_en}
          </p>
          {r.stats?.average != null && (
            <p className="mt-3 text-sm text-muted">
              Ø {r.stats.average.toLocaleString("de-DE")}
              {r.stats.best && ` · Bester Tag ${Number(r.stats.best.date.slice(8))}.${Number(r.stats.best.date.slice(5, 7))}. (${r.stats.best.rating})`}
            </p>
          )}
        </section>
      ))}
      {reviews.length > 1 && (
        <button type="button" onClick={() => setShowAll(!showAll)} className="text-sm font-bold text-accent-ink">
          {showAll ? "Weniger anzeigen" : "Frühere Rückblicke"}
        </button>
      )}
    </div>
  );
}
