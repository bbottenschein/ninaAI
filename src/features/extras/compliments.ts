/**
 * Kompliment-Auswahl (SPEC-extras › Komplimente): zufällig unter den aktiven Komplimenten,
 * die in der aktuellen Runde am wenigsten gezeigt wurden. So wiederholt sich keins,
 * bevor alle anderen einmal dran waren – auch wenn neue dazukommen.
 */
export function pickCompliment<T extends { id: string }>(
  active: T[],
  views: Map<string, number>,
  random: () => number = Math.random,
): T | null {
  if (active.length === 0) return null;
  const min = Math.min(...active.map((c) => views.get(c.id) ?? 0));
  const candidates = active.filter((c) => (views.get(c.id) ?? 0) === min);
  return candidates[Math.min(candidates.length - 1, Math.floor(random() * candidates.length))];
}

export const COMPLIMENT_MAX = 200;

/** Ersatz, falls der Server nicht erreichbar ist. */
export const FALLBACK_COMPLIMENT = "You make the world a little brighter.";
