import { isAuthorizedJob } from "@/lib/jobs";
import { runDailyOverview } from "@/features/remind/job";

export const maxDuration = 30;

/** Tagesüberblick (07:30), stündlich zur halben Stunde von pg_cron aufgerufen. */
export async function POST(request: Request) {
  if (!isAuthorizedJob(request)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    return Response.json(await runDailyOverview());
  } catch (error) {
    console.error("[remind] Tagesüberblick fehlgeschlagen", error);
    return Response.json({ error: "failed" }, { status: 500 });
  }
}
