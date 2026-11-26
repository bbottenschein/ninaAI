import { THEME_COLOR, THEME_COOKIE, type Theme } from "./theme";

/** Design sofort im Browser anwenden: data-theme, Statusleisten-Farbe und Cookie. */
export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.dataset.theme = theme;
  const dark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const color = theme === "auto" ? (dark ? THEME_COLOR.dark : THEME_COLOR.flower) : THEME_COLOR[theme];
  document.querySelectorAll('meta[name="theme-color"]').forEach((m) => {
    m.setAttribute("content", color);
    m.removeAttribute("media");
  });
  document.cookie = `${THEME_COOKIE}=${theme}; path=/; max-age=31536000; samesite=lax`;
}
