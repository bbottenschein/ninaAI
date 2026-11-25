/** Wie oft die Erzeugung einer Tageslektion höchstens versucht wird. */
export const MAX_ATTEMPTS = 3;
/** Läuft eine Erzeugung länger, gilt sie als abgebrochen (Funktions-Limit 300 s). */
export const STALE_AFTER_SECONDS = 6 * 60;

export type LessonRow = {
  status: "generating" | "ready" | "failed";
  attempts: number;
  generation_started_at: string | null;
};

/**
 * Was die App mit der Lektion eines Tages tun soll:
 * - ready:       anzeigen
 * - generating:  läuft gerade, warten
 * - start:       (erneut) erzeugen
 * - unavailable: alle Versuche verbraucht – Tag ohne Lektion (neutral für die Streak)
 */
export type LessonPhase = "ready" | "generating" | "start" | "unavailable";

export function lessonPhase(row: LessonRow | null, now: Date = new Date()): LessonPhase {
  if (!row) return "start";
  if (row.status === "ready") return "ready";
  if (row.attempts >= MAX_ATTEMPTS) {
    // Auch eine hängen gebliebene letzte Erzeugung zählt dann als gescheitert.
    if (row.status === "failed" || isStale(row, now)) return "unavailable";
    return "generating";
  }
  if (row.status === "failed") return "start";
  return isStale(row, now) ? "start" : "generating";
}

function isStale(row: LessonRow, now: Date): boolean {
  if (!row.generation_started_at) return true;
  return now.getTime() - Date.parse(row.generation_started_at) > STALE_AFTER_SECONDS * 1000;
}
