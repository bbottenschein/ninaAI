// Wiederholungen als RRULE-Teilmenge (SPEC-remind-me › Datenmodell), z. B.
// FREQ=DAILY · FREQ=WEEKLY;BYDAY=MO · FREQ=WEEKLY;BYDAY=MO,WE,FR · FREQ=MONTHLY · FREQ=YEARLY

export type Freq = "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
export type Repeat = { freq: Freq; byDay: number[] } | null; // byDay: 0 = So … 6 = Sa

const DAY_CODES = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];
export const WEEKDAY_SHORT = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
/** Reihenfolge für die Auswahl: Montag zuerst. */
export const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

export function parseRepeat(rule: string | null | undefined): Repeat {
  if (!rule) return null;
  const parts = Object.fromEntries(
    rule.split(";").map((p) => {
      const [k, v] = p.split("=");
      return [k?.trim().toUpperCase(), v?.trim().toUpperCase() ?? ""];
    }),
  );
  const freq = parts.FREQ as Freq;
  if (!["DAILY", "WEEKLY", "MONTHLY", "YEARLY"].includes(freq)) return null;
  const byDay = (parts.BYDAY ?? "")
    .split(",")
    .map((c: string) => DAY_CODES.indexOf(c))
    .filter((d: number) => d >= 0)
    .sort((a: number, b: number) => a - b);
  return { freq, byDay: freq === "WEEKLY" ? byDay : [] };
}

export function buildRepeat(repeat: Repeat): string | null {
  if (!repeat) return null;
  if (repeat.freq === "WEEKLY" && repeat.byDay.length > 0) {
    const days = [...new Set(repeat.byDay)].sort((a, b) => a - b).map((d) => DAY_CODES[d]);
    return `FREQ=WEEKLY;BYDAY=${days.join(",")}`;
  }
  return `FREQ=${repeat.freq}`;
}

/** Kurzbeschreibung für Karte und Liste, z. B. „wöchentlich Mo, Mi“. */
export function repeatLabel(rule: string | null | undefined): string | null {
  const repeat = parseRepeat(rule);
  if (!repeat) return null;
  if (repeat.freq === "DAILY") return "täglich";
  if (repeat.freq === "MONTHLY") return "monatlich";
  if (repeat.freq === "YEARLY") return "jährlich";
  const days = WEEKDAY_ORDER.filter((d) => repeat.byDay.includes(d)).map((d) => WEEKDAY_SHORT[d]);
  return days.length > 0 ? `wöchentlich ${days.join(", ")}` : "wöchentlich";
}
