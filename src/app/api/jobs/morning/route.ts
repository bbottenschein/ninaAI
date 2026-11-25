import { after } from "next/server";
import { berlinDate, berlinHour } from "@/lib/date";
import { isAuthorizedJob } from "@/lib/jobs";
import { ensureLesson } from "@/features/lesson/ensure";

/** Morgen-Job ab 05:00 Uhr deutscher Zeit. */
const START_HOUR = 5;

// Die Erzeugung dauert 1–3 Minuten und läuft nach der Antwort weiter (after).
export const maxDuration = 300;

/**
 * Wird stündlich von pg_cron aufgerufen (siehe Migration lesson_generation).
 * Idempotent: Ist die Lektion schon da oder wird sie gerade erzeugt, passiert nichts.
 */
export async function POST(request: Request) {
  if (!isAuthorizedJob(request)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const date = berlinDate();
  if (berlinHour() < START_HOUR) {
    return Response.json({ date, result: "too-early" });
  }

  // pg_net wartet nicht lange auf die Antwort – deshalb sofort antworten.
  after(() => ensureLesson(date, "job"));
  return Response.json({ date, result: "started" }, { status: 202 });
}
