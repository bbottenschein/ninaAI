"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { FeedbackToggle } from "./feedback-toggle";
import { PinPad } from "./pin-pad";
import { deleteJournal, lockJournal, removeJournalPin, setJournalPin } from "./settings-actions";

/** Einstellungen unten im Journal: Feedback, PIN, Export, Löschen. */
export function JournalSettings({ feedbackEnabled, pinSet }: { feedbackEnabled: boolean; pinSet: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"idle" | "pin" | "pin-confirm" | "delete">("idle");
  const [firstPin, setFirstPin] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function run(action: () => Promise<{ error?: string } | void>, done?: string) {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const r = await action();
      if (r && r.error) setError(r.error);
      else {
        setMode("idle");
        setConfirmText("");
        if (done) setMessage(done);
        router.refresh();
      }
    });
  }

  return (
    <section className="mt-8">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex w-full items-center justify-between px-1 text-sm font-extrabold text-muted"
      >
        <span>⚙️ Journal-Einstellungen</span>
        <span aria-hidden>{open ? "▴" : "▾"}</span>
      </button>

      {open && (
        <div className="card mt-3 flex flex-col gap-4 text-sm">
          <FeedbackToggle initial={feedbackEnabled} />

          {/* PIN */}
          <div className="border-t-2 border-border pt-4">
            <p className="font-extrabold">🔒 PIN für das Journal</p>
            <p className="mb-3 text-muted">
              {pinSet
                ? "Das Journal ist mit einer PIN geschützt. Nach 10 Minuten sperrt es sich wieder."
                : "Aus. Mit einer PIN kann niemand mitlesen, der dein Handy in der Hand hat."}
            </p>
            {mode === "pin" || mode === "pin-confirm" ? (
              <div className="flex flex-col items-center gap-3">
                <p className="font-bold">{mode === "pin" ? "Neue PIN (4 Ziffern)" : "PIN noch einmal"}</p>
                <PinPad
                  key={mode}
                  disabled={pending}
                  error={error}
                  onComplete={(pin) => {
                    if (mode === "pin") {
                      setFirstPin(pin);
                      setError(null);
                      setMode("pin-confirm");
                    } else if (pin !== firstPin) {
                      setError("Die PINs sind unterschiedlich. Bitte nochmal.");
                      setMode("pin");
                    } else run(() => setJournalPin(pin), "PIN gespeichert ✓");
                  }}
                />
                <button type="button" onClick={() => setMode("idle")} className="text-muted">
                  Abbrechen
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => { setError(null); setMode("pin"); }} className="btn-secondary px-4 py-1.5 text-sm">
                  {pinSet ? "PIN ändern" : "PIN festlegen"}
                </button>
                {pinSet && (
                  <>
                    <button type="button" disabled={pending} onClick={() => run(lockJournal)} className="btn-secondary px-4 py-1.5 text-sm">
                      Jetzt sperren
                    </button>
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => run(removeJournalPin, "PIN entfernt")}
                      className="px-2 py-1.5 text-sm font-bold text-muted"
                    >
                      PIN entfernen
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Export */}
          <div className="border-t-2 border-border pt-4">
            <p className="font-extrabold">⬇️ Export</p>
            <p className="mb-3 text-muted">Alle Einträge und Monatsrückblicke als Textdatei (Markdown).</p>
            <a href="/api/journal/export" download className="btn-secondary inline-block px-4 py-1.5 text-sm">
              Journal herunterladen
            </a>
          </div>

          {/* Löschen */}
          <div className="border-t-2 border-border pt-4">
            <p className="font-extrabold">🗑️ Journal löschen</p>
            {mode === "delete" ? (
              <div className="mt-2 flex flex-col gap-2">
                <p className="text-muted">
                  Alle Einträge, Bewertungen und Rückblicke werden endgültig gelöscht. Tipp zur Bestätigung{" "}
                  <b>LÖSCHEN</b> ein.
                </p>
                <input
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  className="input py-2"
                  aria-label="Bestätigung"
                  autoCapitalize="characters"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={pending || confirmText.trim().toUpperCase() !== "LÖSCHEN"}
                    onClick={() => run(() => deleteJournal(confirmText), "Dein Journal wurde gelöscht.")}
                    className="rounded-full bg-danger px-4 py-1.5 font-extrabold text-white disabled:opacity-40"
                  >
                    Endgültig löschen
                  </button>
                  <button type="button" onClick={() => setMode("idle")} className="px-3 text-muted">
                    Abbrechen
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p className="mb-3 text-muted">Tipp vorher am besten auf „Journal herunterladen“.</p>
                <button
                  type="button"
                  onClick={() => { setError(null); setMode("delete"); }}
                  className="px-0 text-sm font-bold text-danger"
                >
                  Journal vollständig löschen …
                </button>
              </>
            )}
          </div>

          {message && <p role="status" className="text-center font-bold text-mint">{message}</p>}
          {error && mode !== "pin" && mode !== "pin-confirm" && (
            <p role="alert" className="text-center text-danger">{error}</p>
          )}
        </div>
      )}
    </section>
  );
}
