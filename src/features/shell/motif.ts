/** Motiv-Familien der Designs: Flower (Maus, Blumen), Clean (Kranich, Blätter), Dark (Eule, Sterne), Cat. */
export const MOTIFS = ["flower", "clean", "dark", "cat"] as const;
export type Motif = (typeof MOTIFS)[number];

/** CSS-Klasse, die eine Variante nur im passenden Design zeigt (siehe globals.css). */
export const motifClass = (m: Motif) => `motif-${m}`;

/** Aktuelles Motiv im Browser (für Animationen, die erst beim Auslösen entstehen). */
export function currentMotif(): Motif {
  const theme = document.documentElement.dataset.theme;
  if (theme === "auto") return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "flower";
  return (MOTIFS as readonly string[]).includes(theme ?? "") ? (theme as Motif) : "flower";
}
