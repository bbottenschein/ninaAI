"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { PageHeader } from "@/features/shell/page-header";
import { deleteLoveNote, markLoveNotesRead, sendLoveNote, toggleLoveNoteFavorite } from "./actions";
import { formatNoteTime, LOVE_COUNTER_FROM, LOVE_MAX, viewOf, type LoveNote } from "./love-notes";

type Tab = "all" | "favorites";

/** Postfach und Schreiben (SPEC-extras › Love Notes). Keine Lesebestätigung für den Absender. */
export function LoveNotesScreen({
  notes,
  userId,
  partnerName,
}: {
  notes: LoveNote[];
  userId: string;
  partnerName: string;
}) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [hearts, setHearts] = useState(0);
  const [tab, setTab] = useState<Tab>("all");
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});
  const [removed, setRemoved] = useState<Set<string>>(() => new Set());
  const [confirming, setConfirming] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  // Beim Öffnen ungelesene Notes merken, damit sie diesmal noch als „neu“ erscheinen.
  const [newIds] = useState(() => new Set(notes.filter((n) => viewOf(n, userId).unread).map((n) => n.id)));
  const [now] = useState(() => new Date());

  useEffect(() => {
    if (newIds.size > 0) markLoveNotesRead().catch(() => {});
  }, [newIds]);

  function send() {
    setError(null);
    startTransition(async () => {
      const r = await sendLoveNote(text);
      if (r.error) {
        setError(r.error);
        return;
      }
      setText("");
      setHearts((h) => h + 1);
      router.refresh();
    });
  }

  function toggle(note: LoveNote, current: boolean) {
    setFavorites((f) => ({ ...f, [note.id]: !current }));
    startTransition(async () => {
      const r = await toggleLoveNoteFavorite(note.id);
      if (r.error) setFavorites((f) => ({ ...f, [note.id]: current }));
    });
  }

  function remove(note: LoveNote) {
    setConfirming(null);
    setRemoved((r) => new Set(r).add(note.id));
    startTransition(async () => {
      const r = await deleteLoveNote(note.id);
      if (r.error) {
        setError(r.error);
        setRemoved((prev) => {
          const next = new Set(prev);
          next.delete(note.id);
          return next;
        });
      }
    });
  }

  const isFavorite = (n: LoveNote) => favorites[n.id] ?? viewOf(n, userId).favorite;
  const visible = notes.filter((n) => !removed.has(n.id));
  const shown = tab === "favorites" ? visible.filter(isFavorite) : visible;

  return (
    <>
      <PageHeader
        icon={<span className="text-5xl" aria-hidden>💌</span>}
        subtitle={`Du & ${partnerName}`}
        title="Love Notes"
        action={
          <Link href="/" className="rounded-full border-2 border-border bg-surface px-3 py-1 text-xs font-bold text-muted">
            ‹ Home
          </Link>
        }
      />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="card relative mb-6 flex flex-col gap-3"
      >
        <label htmlFor="love-note" className="font-extrabold">
          Nachricht an {partnerName}
        </label>
        <textarea
          id="love-note"
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, LOVE_MAX))}
          maxLength={LOVE_MAX}
          rows={3}
          className="input resize-none"
          placeholder="Ein paar liebe Worte …"
        />
        <div className="flex items-center justify-between gap-3">
          <span className={`text-xs font-bold tabular-nums ${text.length >= LOVE_MAX ? "text-accent-ink" : "text-muted"}`}>
            {text.length >= LOVE_COUNTER_FROM ? `${text.length}/${LOVE_MAX}` : ""}
          </span>
          <button disabled={pending || !text.trim()} className="btn-primary px-5 py-2 disabled:opacity-40">
            {pending ? "Senden …" : "Senden 💌"}
          </button>
        </div>
        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}
        {hearts > 0 && <HeartBurst key={hearts} />}
      </form>

      <div role="tablist" aria-label="Postfach" className="mb-4 flex gap-2">
        {(
          [
            ["all", "Alle"],
            ["favorites", "⭐ Favorites"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            role="tab"
            type="button"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={`rounded-full px-4 py-1.5 text-sm font-extrabold transition ${
              tab === key ? "bg-foreground text-background" : "border-2 border-border bg-surface text-muted"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <p className="card py-8 text-center text-muted">
          {tab === "favorites" ? "Tippe auf ☆ bei einer Nachricht, um sie hier zu sammeln." : "Noch keine Love Notes – schreib die erste 💕"}
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {shown.map((n) => {
            const { sent } = viewOf(n, userId);
            const fav = isFavorite(n);
            return (
              <li key={n.id} className={`flex ${sent ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-3xl px-4 py-3 shadow-soft ${
                    sent ? "rounded-br-md bg-lavender-soft" : "rounded-bl-md bg-accent-soft"
                  }`}
                >
                  <p className="text-xs font-bold text-muted">
                    {sent ? `Du → ${partnerName}` : `${partnerName} 💕`} · {formatNoteTime(n.created_at, now)}
                    {newIds.has(n.id) && <span className="ml-1.5 chip bg-accent px-2 py-0.5 text-[10px] text-on-accent">neu</span>}
                  </p>
                  <p className="mt-1 break-words whitespace-pre-line">{n.text}</p>
                  <div className="mt-1 flex items-center justify-end gap-3">
                    {confirming === n.id ? (
                      <>
                        <span className="mr-auto text-xs text-muted">Nur bei dir löschen?</span>
                        <button type="button" onClick={() => setConfirming(null)} className="text-xs font-bold text-muted">
                          Abbrechen
                        </button>
                        <button type="button" onClick={() => remove(n)} className="text-xs font-extrabold text-danger">
                          Löschen
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirming(n.id)}
                        aria-label="Nachricht löschen"
                        className="text-base leading-none opacity-60 transition active:scale-90"
                      >
                        🗑️
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => toggle(n, fav)}
                      aria-pressed={fav}
                      aria-label={fav ? "Aus Favorites entfernen" : "Als Favorit markieren"}
                      className={`text-lg leading-none transition active:scale-90 ${fav ? "text-sun" : "text-muted"}`}
                    >
                      {fav ? "★" : "☆"}
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

/** Kleine Herz-Animation nach dem Senden. */
function HeartBurst() {
  const hearts = [
    { left: "50%", delay: 0, size: "text-5xl" },
    { left: "30%", delay: 0.15, size: "text-2xl" },
    { left: "70%", delay: 0.1, size: "text-3xl" },
    { left: "42%", delay: 0.3, size: "text-xl" },
    { left: "60%", delay: 0.35, size: "text-2xl" },
  ];
  return (
    <div className="pointer-events-none absolute inset-0 overflow-visible" role="status" aria-label="Gesendet">
      {hearts.map((h, i) => (
        <span
          key={i}
          className={`absolute bottom-4 -translate-x-1/2 opacity-0 ${h.size}`}
          style={{ left: h.left, animation: `heart-rise 1.4s ${h.delay}s ease-out forwards` }}
          aria-hidden
        >
          💗
        </span>
      ))}
      <p className="absolute right-5 bottom-[-1.75rem] text-sm font-bold text-accent-ink">Gesendet 💕</p>
    </div>
  );
}
