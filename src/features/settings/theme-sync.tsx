"use client";

import { useEffect } from "react";
import type { Theme } from "./theme";
import { applyTheme } from "./theme-dom";

/** Gleicht das Design des Kontos mit diesem Gerät ab (z. B. nach Wechsel auf einem anderen Gerät). */
export function ThemeSync({ theme }: { theme: Theme }) {
  useEffect(() => {
    if (document.documentElement.dataset.theme !== theme) applyTheme(theme);
  }, [theme]);
  return null;
}
