/** Designs der App (SPEC-settings › Design). Reine Daten, auch im Browser nutzbar. */
export type Theme = "flower" | "clean" | "dark" | "cat" | "auto";

export const DEFAULT_THEME: Theme = "flower";
export const THEME_COOKIE = "ninaai_theme";

export const THEMES: { key: Theme; emoji: string; label: string; hint: string }[] = [
  { key: "flower", emoji: "🌸", label: "Flower", hint: "Rosa und blumig" },
  { key: "clean", emoji: "◻️", label: "Clean Light", hint: "Beige, ruhig, schlicht" },
  { key: "dark", emoji: "🌙", label: "Dark", hint: "Dunkel mit rosa Akzent" },
  { key: "cat", emoji: "🐾", label: "Cozy Cat", hint: "Warmes Braun und Creme" },
  { key: "auto", emoji: "🌓", label: "Automatisch", hint: "Hell: Flower · Dunkel: Dark" },
];

/** Farbe der Statusleiste je Design (Hintergrundfarbe). */
export const THEME_COLOR: Record<Exclude<Theme, "auto">, string> = {
  flower: "#fff7fa",
  clean: "#f7f4ef",
  dark: "#141216",
  cat: "#f6efe6",
};

export function parseTheme(value: unknown): Theme {
  return THEMES.some((t) => t.key === value) ? (value as Theme) : DEFAULT_THEME;
}
