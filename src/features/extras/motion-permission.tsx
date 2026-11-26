"use client";

import { useSyncExternalStore, useState } from "react";
import { MOTION_EVENT, needsMotionPermission, requestMotion, storeMotion, storedMotion } from "./motion";

function subscribe(onChange: () => void) {
  window.addEventListener(MOTION_EVENT, onChange);
  return () => window.removeEventListener(MOTION_EVENT, onChange);
}
const snapshot = () => (needsMotionPermission() ? (storedMotion() ?? "ask") : "none");

/**
 * Neutrale Erlaubnis-Abfrage für die Bewegungssensoren (nur iPhone).
 * `card`: einmalige Karte auf Home. `row`: kleine Zeile bei den Benachrichtigungen,
 * solange die Erlaubnis fehlt.
 */
export function MotionPermission({ variant }: { variant: "card" | "row" }) {
  const state = useSyncExternalStore(subscribe, snapshot, () => "none");
  const [denied, setDenied] = useState(false);

  async function allow() {
    const ok = await requestMotion();
    storeMotion(ok ? "granted" : "denied");
    if (!ok) setDenied(true);
  }

  if (variant === "card") {
    if (state !== "ask") return null;
    return (
      <section className="card mb-6 flex items-center gap-3 bg-mint-soft">
        <span className="text-3xl" aria-hidden>
          ✨
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-bold">Erlaube Bewegungssensoren für kleine Animationen</p>
          <div className="mt-2 flex gap-2">
            <button type="button" onClick={allow} className="btn-primary px-4 py-1.5 text-sm">
              Erlauben
            </button>
            <button type="button" onClick={() => storeMotion("later")} className="px-3 text-sm font-bold text-muted">
              Nicht jetzt
            </button>
          </div>
        </div>
      </section>
    );
  }

  if (state === "none" || state === "granted" || state === "ask") return null;
  return (
    <div className="mt-3 flex items-center gap-3 px-1 text-sm">
      <p className="min-w-0 flex-1 text-muted">
        {denied || state === "denied"
          ? "Bewegungssensoren sind blockiert. Erlauben kannst du sie in den iPhone-Einstellungen."
          : "Bewegungssensoren für kleine Animationen"}
      </p>
      {!(denied || state === "denied") && (
        <button type="button" onClick={allow} className="btn-secondary shrink-0 px-3 py-1 text-sm">
          Erlauben
        </button>
      )}
    </div>
  );
}
