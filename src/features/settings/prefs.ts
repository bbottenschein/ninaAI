import type { Role } from "@/features/auth/session";

/** Einzeln abschaltbare Pushes (SPEC-settings). Spaltenname in user_settings. */
export type PushPrefKey = "push_love_notes" | "push_learning" | "push_reminders" | "daily_overview" | "push_rewards";

export type PushPref = { key: PushPrefKey; emoji: string; label: string; hint: string; defaultOn: boolean; roles: Role[] };

export const PUSH_PREFS: PushPref[] = [
  { key: "push_love_notes", emoji: "💌", label: "Love Notes", hint: "Sofort, wenn eine neue Nachricht da ist.", defaultOn: true, roles: ["player", "admin"] },
  { key: "push_learning", emoji: "📚", label: "Lern-Erinnerung", hint: "Um 19 Uhr, wenn die Lektion noch offen ist.", defaultOn: true, roles: ["player"] },
  { key: "push_reminders", emoji: "⏰", label: "Erinnerungen", hint: "Zur eingestellten Zeit aus Remind me.", defaultOn: true, roles: ["player"] },
  { key: "daily_overview", emoji: "☀️", label: "Tagesüberblick 07:30", hint: "„Heute: 3 Aufgaben, 1 überfällig“. Am Wochenende nur Life Mode.", defaultOn: false, roles: ["player"] },
  { key: "push_rewards", emoji: "🎁", label: "Gutscheine", hint: "Wenn Nina einen Gutschein verdient oder einlöst.", defaultOn: true, roles: ["admin"] },
];

export function prefsFor(role: Role): PushPref[] {
  return PUSH_PREFS.filter((p) => p.roles.includes(role));
}

/** Gespeicherte Werte mit Standardwerten auffüllen. */
export function resolvePrefs(role: Role, row: Partial<Record<PushPrefKey, boolean | null>> | null): Record<PushPrefKey, boolean> {
  return Object.fromEntries(prefsFor(role).map((p) => [p.key, row?.[p.key] ?? p.defaultOn])) as Record<PushPrefKey, boolean>;
}
