/** Alle Tagesgrenzen der App gelten in deutscher Zeit. */
export const APP_TIME_ZONE = "Europe/Berlin";

const isoDate = new Intl.DateTimeFormat("en-CA", {
  timeZone: APP_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** Kalenderdatum (YYYY-MM-DD) in Europe/Berlin für einen Zeitpunkt. */
export function berlinDate(at: Date = new Date()): string {
  return isoDate.format(at);
}

/** Verschiebt ein Kalenderdatum (YYYY-MM-DD) um n Tage. */
export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Datum für die Anzeige, z. B. „Mittwoch, 25. November“. */
export function formatLongDate(date: string): string {
  return new Intl.DateTimeFormat("de-DE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}

const hourFormat = new Intl.DateTimeFormat("en-GB", {
  timeZone: APP_TIME_ZONE,
  hour: "2-digit",
  hourCycle: "h23",
});

/** Stunde (0–23) in Europe/Berlin für einen Zeitpunkt. */
export function berlinHour(at: Date = new Date()): number {
  return Number(hourFormat.format(at));
}
