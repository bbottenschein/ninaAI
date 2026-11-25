"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Lädt die Seite in Abständen neu, solange die Lektion erzeugt wird. */
export function AutoRefresh({ intervalMs = 5000, maxMs = 6 * 60 * 1000 }) {
  const router = useRouter();

  useEffect(() => {
    const started = Date.now();
    const id = setInterval(() => {
      if (Date.now() - started > maxMs) clearInterval(id);
      else router.refresh();
    }, intervalMs);
    return () => clearInterval(id);
  }, [router, intervalMs, maxMs]);

  return null;
}
