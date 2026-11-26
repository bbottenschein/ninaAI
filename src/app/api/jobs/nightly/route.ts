import { berlinDate } from "@/lib/date";
import { isAuthorizedJob } from "@/lib/jobs";
import { runNightly } from "@/features/streak/job";

export const maxDuration = 60;

/**
 * Nacht-Job, stündlich von pg_cron aufgerufen. Arbeitet nur, wenn es seit der
 * letzten Auswertung abgeschlossene Tage gibt – nach Mitternacht (Berlin) also
 * genau einmal, egal ob Sommer- oder Winterzeit.
 */
export async function POST(request: Request) {
  if (!isAuthorizedJob(request)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const results = await runNightly(berlinDate());
    return Response.json({ results });
  } catch (error) {
    console.error("[streak] Nacht-Job fehlgeschlagen", error);
    return Response.json({ error: "failed" }, { status: 500 });
  }
}
