import { berlinDate } from "@/lib/date";
import { isAuthorizedJob } from "@/lib/jobs";
import { runReminder } from "@/features/notifications/job";

export const maxDuration = 30;

/** Erinnerungs-Job, stündlich von pg_cron aufgerufen (arbeitet nur 19–22 Uhr). */
export async function POST(request: Request) {
  if (!isAuthorizedJob(request)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    return Response.json(await runReminder(berlinDate()));
  } catch (error) {
    console.error("[reminder] fehlgeschlagen", error);
    return Response.json({ error: "failed" }, { status: 500 });
  }
}
