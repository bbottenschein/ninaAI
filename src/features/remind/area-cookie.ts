import type { AreaFilter } from "./logic";

/** Merkt sich den Umschalter Alle / Work / Life (SPEC-remind-me › To-Do Overview). */
export const REMIND_AREA_COOKIE = "ninaai_remind_area";

export function parseAreaFilter(value: string | undefined): AreaFilter {
  return value === "work" || value === "life" ? value : "all";
}

export function saveAreaFilter(area: AreaFilter) {
  document.cookie = `${REMIND_AREA_COOKIE}=${area}; path=/; max-age=31536000; samesite=lax`;
}
