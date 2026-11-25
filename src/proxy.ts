import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    // Alles außer statischen Dateien, Bildern, Manifest, Icons und Service Worker.
    // /api/jobs/* schützt sich ab Phase 2 selbst über JOBS_SECRET.
    "/((?!_next/static|_next/image|api/jobs|favicon.ico|manifest.webmanifest|sw.js|icons/|.*\\.(?:png|svg|ico|webp)$).*)",
  ],
};
