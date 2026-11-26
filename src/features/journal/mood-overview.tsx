"use client";

import { useMemo, useState } from "react";
import { addDays } from "@/lib/date";
import { Mascot } from "@/features/shell/mascot";
import type { JournalEntry } from "./logic";
import { average, bestDay, inRange, monthGrid, monthRange, ratingTone, weekDates, yearAverages } from "./stats";

type View = "week" | "month" | "year" | "gratitude";

const VIEWS: { key: View; label: string }[] = [
  { key: "week", label: "Woche" },
  { key: "month", label: "Monat" },
  { key: "year", label: "Jahr" },
  { key: "gratitude", label: "🌸 Dankbar" },
];

const WEEKDAYS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
const MONTHS = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];
const MONTHS_LONG = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];

// Fünf Töne von zart bis kräftig (Kalender und Jahreskacheln), je nach Design.
const TONES = ["bg-tone-1", "bg-tone-2", "bg-tone-3", "bg-tone-4", "bg-tone-5 text-tone-5-ink"];

function shortDate(date: string): string {
  const [, m, d] = date.split("-");
  return `${Number(d)}.${Number(m)}.`;
}

/**
 * Stimmungsverlauf aus den Abendbewertungen (SPEC-journal › Mood Overview).
 * Bewusst ohne Zähler für Einträge oder fehlende Tage – Lücken bleiben einfach leer.
 */
export function MoodOverview({
  entries,
  today,
  onRead,
}: {
  entries: JournalEntry[];
  today: string;
  onRead: (entry: JournalEntry) => void;
}) {
  const [view, setView] = useState<View>("week");
  const [anchor, setAnchor] = useState(today);
  const byDate = useMemo(() => new Map(entries.map((e) => [e.date, e])), [entries]);

  const year = Number(anchor.slice(0, 4));
  const month = Number(anchor.slice(5, 7));

  function shift(step: number) {
    if (view === "week") setAnchor(addDays(anchor, 7 * step));
    else if (view === "month") {
      const m = month + step;
      const y = year + Math.floor((m - 1) / 12);
      const mm = ((m - 1 + 120) % 12) + 1;
      setAnchor(`${y}-${String(mm).padStart(2, "0")}-01`);
    } else setAnchor(`${year + step}-01-01`);
  }

  return (
    <>
      <div role="tablist" aria-label="Zeitraum" className="mb-4 flex gap-2 overflow-x-auto">
        {VIEWS.map((v) => (
          <button
            key={v.key}
            role="tab"
            type="button"
            aria-selected={view === v.key}
            onClick={() => {
              setView(v.key);
              setAnchor(today);
            }}
            className={`rounded-full px-4 py-1.5 text-sm font-extrabold whitespace-nowrap transition ${
              view === v.key ? "bg-foreground text-background" : "border-2 border-border bg-surface text-muted"
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>

      {entries.length === 0 && view !== "gratitude" ? (
        <div className="card flex flex-col items-center gap-2 py-8 text-center text-muted">
          <Mascot mood="sleepy" className="size-16" />
          <p>Hier wächst bald dein Stimmungsverlauf.</p>
        </div>
      ) : (
        <>
          {view === "week" && <Week anchor={anchor} byDate={byDate} today={today} onShift={shift} onRead={onRead} />}
          {view === "month" && (
            <Month year={year} month={month} byDate={byDate} today={today} onShift={shift} onRead={onRead} />
          )}
          {view === "year" && (
            <Year
              year={year}
              entries={entries}
              onShift={shift}
              onMonth={(m) => {
                setAnchor(`${year}-${String(m).padStart(2, "0")}-01`);
                setView("month");
              }}
            />
          )}
        </>
      )}
      {view === "gratitude" && <GratitudeWall entries={entries} onRead={onRead} />}
    </>
  );
}

function Nav({ label, onShift, canForward }: { label: string; onShift: (step: number) => void; canForward: boolean }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <button type="button" onClick={() => onShift(-1)} aria-label="Zurück" className="btn-secondary px-3 py-1 text-sm">
        ‹
      </button>
      <p className="font-extrabold">{label}</p>
      <button
        type="button"
        onClick={() => onShift(1)}
        disabled={!canForward}
        aria-label="Weiter"
        className="btn-secondary px-3 py-1 text-sm disabled:opacity-30"
      >
        ›
      </button>
    </div>
  );
}

function Stats({ items, label }: { items: { date: string; rating: number }[]; label: string }) {
  const avg = average(items);
  const best = bestDay(items);
  if (avg === null || !best) return null;
  return (
    <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
      <p className="rounded-2xl bg-accent-soft px-3 py-2">
        <span className="block text-xs font-bold text-muted">Ø {label}</span>
        <span className="text-lg font-extrabold text-accent-ink">{avg.toLocaleString("de-DE")}</span>
      </p>
      <p className="rounded-2xl bg-sun-soft px-3 py-2">
        <span className="block text-xs font-bold text-muted">Bester Tag</span>
        <span className="text-lg font-extrabold text-sun">
          {shortDate(best.date)} · {best.rating}
        </span>
      </p>
    </div>
  );
}

function Week({
  anchor,
  byDate,
  today,
  onShift,
  onRead,
}: {
  anchor: string;
  byDate: Map<string, JournalEntry>;
  today: string;
  onShift: (step: number) => void;
  onRead: (e: JournalEntry) => void;
}) {
  const days = weekDates(anchor);
  const items = days.map((d) => byDate.get(d)).filter((e): e is JournalEntry => Boolean(e));
  const avg = average(items);

  // Diagramm: 7 Spalten, Bewertung 1 (unten) bis 10 (oben).
  const W = 320;
  const H = 170;
  const x = (i: number) => 24 + i * ((W - 48) / 6);
  const y = (r: number) => 14 + ((10 - r) / 9) * (H - 44);
  const points = days.map((d, i) => ({ i, e: byDate.get(d) }));
  // Linie nur zwischen aufeinanderfolgenden Tagen mit Eintrag – Lücken bleiben Lücken.
  const lines: string[] = [];
  for (let i = 1; i < 7; i++) {
    const a = points[i - 1].e;
    const b = points[i].e;
    if (a && b) lines.push(`M${x(i - 1)} ${y(a.rating)} L${x(i)} ${y(b.rating)}`);
  }

  return (
    <section className="card">
      <Nav label={`${shortDate(days[0])} – ${shortDate(days[6])}`} onShift={onShift} canForward={days[6] < today} />
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Stimmung der Woche">
        {[1, 5, 10].map((r) => (
          <g key={r}>
            <line x1="16" x2={W - 8} y1={y(r)} y2={y(r)} stroke="var(--border)" strokeWidth="1" />
            <text x="4" y={y(r) + 4} fontSize="10" fill="var(--muted)">
              {r}
            </text>
          </g>
        ))}
        {avg !== null && (
          <line x1="16" x2={W - 8} y1={y(avg)} y2={y(avg)} stroke="var(--accent)" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.6" />
        )}
        <path d={lines.join(" ")} stroke="var(--accent)" strokeWidth="3" fill="none" strokeLinecap="round" />
        {points.map(({ i, e }) =>
          e ? (
            <g key={i} onClick={() => onRead(e)} className="cursor-pointer">
              <circle cx={x(i)} cy={y(e.rating)} r="12" fill="transparent" />
              <circle cx={x(i)} cy={y(e.rating)} r="6" fill="var(--surface)" stroke="var(--accent)" strokeWidth="3" />
            </g>
          ) : null,
        )}
        {days.map((d, i) => (
          <text
            key={d}
            x={x(i)}
            y={H - 8}
            fontSize="11"
            textAnchor="middle"
            fontWeight={d === today ? 800 : 600}
            fill={d === today ? "var(--accent-ink)" : "var(--muted)"}
          >
            {WEEKDAYS[i]}
          </text>
        ))}
      </svg>
      <Stats items={items} label="Woche" />
    </section>
  );
}

function Month({
  year,
  month,
  byDate,
  today,
  onShift,
  onRead,
}: {
  year: number;
  month: number;
  byDate: Map<string, JournalEntry>;
  today: string;
  onShift: (step: number) => void;
  onRead: (e: JournalEntry) => void;
}) {
  const [from, to] = monthRange(year, month);
  const items = [...byDate.values()].filter((e) => e.date >= from && e.date <= to);
  return (
    <section className="card">
      <Nav label={`${MONTHS_LONG[month - 1]} ${year}`} onShift={onShift} canForward={to < today} />
      <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-bold text-muted">
        {WEEKDAYS.map((d) => (
          <span key={d}>{d}</span>
        ))}
        {monthGrid(year, month)
          .flat()
          .map((date, i) => {
            if (!date) return <span key={i} />;
            const e = byDate.get(date);
            const day = Number(date.slice(8));
            return e ? (
              <button
                key={date}
                type="button"
                onClick={() => onRead(e)}
                aria-label={`${day}.: ${e.rating} von 10`}
                className={`aspect-square rounded-xl text-sm font-extrabold transition active:scale-90 ${TONES[ratingTone(e.rating)]} ${
                  date === today ? "ring-2 ring-accent" : ""
                }`}
              >
                {day}
              </button>
            ) : (
              <span
                key={date}
                className={`flex aspect-square items-center justify-center rounded-xl text-sm text-muted/70 ${
                  date === today ? "ring-2 ring-accent" : ""
                }`}
              >
                {day}
              </span>
            );
          })}
      </div>
      <div className="mt-3 flex items-center justify-center gap-1 text-xs text-muted" aria-hidden>
        <span>1</span>
        {TONES.map((t, i) => (
          <span key={i} className={`size-4 rounded ${t}`} />
        ))}
        <span>10</span>
      </div>
      <Stats items={items} label="Monat" />
    </section>
  );
}

function Year({
  year,
  entries,
  onShift,
  onMonth,
}: {
  year: number;
  entries: JournalEntry[];
  onShift: (step: number) => void;
  onMonth: (month: number) => void;
}) {
  const averages = yearAverages(entries, year);
  const thisYear = new Date().getFullYear();
  const items = inRange(entries, `${year}-01-01`, `${year}-12-31`);
  return (
    <section className="card">
      <Nav label={String(year)} onShift={onShift} canForward={year < thisYear} />
      <div className="grid grid-cols-4 gap-2">
        {averages.map((avg, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onMonth(i + 1)}
            className={`flex aspect-square flex-col items-center justify-center rounded-2xl transition active:scale-95 ${
              avg === null ? "border-2 border-dashed border-border text-muted" : TONES[ratingTone(avg)]
            }`}
          >
            <span className="text-xs font-bold">{MONTHS[i]}</span>
            <span className="text-lg font-extrabold">{avg === null ? "" : avg.toLocaleString("de-DE")}</span>
          </button>
        ))}
      </div>
      <Stats items={items} label="Jahr" />
    </section>
  );
}

function GratitudeWall({ entries, onRead }: { entries: JournalEntry[]; onRead: (e: JournalEntry) => void }) {
  const [query, setQuery] = useState("");
  const cards = entries.flatMap((e) => e.gratitude.map((text, i) => ({ key: `${e.id}-${i}`, text, entry: e })));
  const q = query.trim().toLowerCase();
  const visible = q ? cards.filter((c) => c.text.toLowerCase().includes(q)) : cards;

  return (
    <>
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Suchen, z. B. „mum“ oder „coffee“"
        aria-label="Dankbarkeit durchsuchen"
        className="input mb-3"
      />
      {visible.length === 0 ? (
        <p className="card text-center text-muted">
          {cards.length === 0 ? "Hier sammeln sich bald die schönen Dinge, für die du dankbar bist 🌸" : "Nichts gefunden."}
        </p>
      ) : (
        <ul className="columns-2 gap-2">
          {visible.map((c, i) => (
            <li key={c.key} className="mb-2 break-inside-avoid">
              <button
                type="button"
                onClick={() => onRead(c.entry)}
                className={`w-full rounded-2xl p-3 text-left shadow-soft transition active:scale-[0.98] ${
                  ["bg-accent-soft", "bg-lavender-soft", "bg-sun-soft", "bg-mint-soft"][i % 4]
                }`}
              >
                <p lang="en" className="font-semibold">
                  {c.text}
                </p>
                <p className="mt-1 text-xs text-muted">{shortDate(c.entry.date)}</p>
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
