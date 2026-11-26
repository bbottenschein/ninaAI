import { isAuthorizedJob } from "@/lib/jobs";
import { runJournalReviews } from "@/features/journal/review-job";

export const maxDuration = 60;

/** Monthly Review für das Journal, stündlich von pg_cron aufgerufen (idempotent). */
export async function POST(request: Request) {
  if (!isAuthorizedJob(request)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    return Response.json(await runJournalReviews());
  } catch (error) {
    console.error("[journal] Review-Job fehlgeschlagen", error);
    return Response.json({ error: "failed" }, { status: 500 });
  }
}
