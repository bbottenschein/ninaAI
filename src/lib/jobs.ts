import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import { jobsSecret } from "@/lib/env.server";

/** Prüft `Authorization: Bearer $JOBS_SECRET` (zeitkonstant). */
export function isAuthorizedJob(request: Request): boolean {
  const header = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${jobsSecret()}`;
  const a = createHash("sha256").update(header).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}
