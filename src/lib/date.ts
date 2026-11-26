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

const partsFormat = new Intl.DateTimeFormat("en-CA", {
  timeZone: APP_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** Datum und Uhrzeit (HH:mm) in Europe/Berlin für einen Zeitpunkt. */
export function berlinParts(at: Date): { date: string; time: string } {
  const p = Object.fromEntries(partsFormat.formatToParts(at).map((x) => [x.type, x.value]));
  return { date: `${p.year}-${p.month}-${p.day}`, time: `${p.hour}:${p.minute}` };
}

/** Versatz Berlin gegenüber UTC in Minuten zu einem Zeitpunkt (60 oder 120). */
function berlinOffsetMinutes(at: Date): number {
  const { date, time } = berlinParts(at);
  const asUtc = Date.parse(`${date}T${time}:00Z`);
  return Math.round((asUtc - Math.floor(at.getTime() / 60000) * 60000) / 60000);
}

/** Zeitpunkt (UTC) für ein Datum und eine Uhrzeit in deutscher Zeit, z. B. Fr 15:00. */
export function berlinToUtc(date: string, time = "00:00"): Date {
  const guess = Date.parse(`${date}T${time.slice(0, 5)}:00Z`);
  let utc = guess - berlinOffsetMinutes(new Date(guess)) * 60000;
  // Um die Zeitumstellung herum den Versatz am Ergebnis noch einmal prüfen.
  const corrected = guess - berlinOffsetMinutes(new Date(utc)) * 60000;
  if (corrected !== utc) utc = corrected;
  return new Date(utc);
}

/** Wochentag (0 = Sonntag … 6 = Samstag) eines Kalenderdatums. */
export function weekday(date: string): number {
  return new Date(`${date}T00:00:00Z`).getUTCDay();
}
