import { isAuthorizedJob } from "@/lib/jobs";
import { runTodoReminders } from "@/features/remind/job";

export const maxDuration = 30;

/** Erinnerungs-Job für „Remind me“, jede Minute von pg_cron aufgerufen. */
export async function POST(request: Request) {
  if (!isAuthorizedJob(request)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    return Response.json(await runTodoReminders());
  } catch (error) {
    console.error("[remind] Erinnerungs-Job fehlgeschlagen", error);
    return Response.json({ error: "failed" }, { status: 500 });
  }
}
