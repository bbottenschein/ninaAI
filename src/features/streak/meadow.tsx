import { REWARD_EMOJI } from "@/features/rewards/labels";
import type { PathNode } from "./pathway";

// Blütenfarben: Rosa-Töne mit Lavendel und Pfirsich als Abwechslung.
const PETALS = ["#ff8fb6", "#b7a9ff", "#ffb38a", "#ff6f9f", "#d8b4fe", "#ffc0d6"];
const STEM = "#5fb98a";

/** Kleine, stabile Zufallszahl aus dem Streak-Tag – jede Blume sieht immer gleich aus. */
function seeded(n: number, salt: number): number {
  const x = Math.sin(n * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

/**
 * Der Pathway als Blumenwiese: Jeder geschaffte Tag lässt eine Blume blühen,
 * ein Joker-Tag wird zum Glücksklee, heute ist eine Knospe und die kommenden Tage
 * sind Sprösslinge. Belohnungs-Tage tragen ein kleines Schild.
 */
export function Meadow({ nodes, hiddenPast }: { nodes: PathNode[]; hiddenPast: number }) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-surface via-surface to-mint-soft px-3 pt-4 pb-10">
      {hiddenPast > 0 && (
        <p className="mb-2 text-center text-xs font-bold text-muted">
          🌸 … und {hiddenPast} {hiddenPast === 1 ? "Blume" : "Blumen"} weiter vorne auf der Wiese
        </p>
      )}
      <ol className="relative grid grid-cols-5 gap-x-1 gap-y-3">
        {nodes.map((node) => (
          <li
            key={node.key}
            className="flex flex-col items-center"
            style={{ transform: `translateY(${Math.round((seeded(node.streakDay, 1) - 0.5) * 10)}px)` }}
          >
            <div className="relative flex h-16 w-full items-end justify-center">
              {node.milestones.length > 0 && <RewardSign milestones={node.milestones} reached={node.kind === "done"} />}
              <Plant node={node} />
            </div>
            <span
              className={`mt-0.5 text-[0.65rem] font-extrabold ${
                node.kind === "today" || node.isToday ? "text-accent-ink" : "text-muted"
              }`}
            >
              {node.kind === "today" || node.isToday ? "Heute" : node.kind === "joker" ? "Joker" : `Tag ${node.streakDay}`}
            </span>
          </li>
        ))}
      </ol>
      <Grass />
    </div>
  );
}

function Plant({ node }: { node: PathNode }) {
  if (node.kind === "done") {
    return <Flower day={node.streakDay} big={node.milestones.length > 0 || node.isToday} />;
  }
  if (node.kind === "joker") return <Clover />;
  if (node.kind === "today") return <Bud />;
  return <Sprout day={node.streakDay} />;
}

function Flower({ day, big }: { day: number; big: boolean }) {
  const color = PETALS[Math.floor(seeded(day, 2) * PETALS.length)];
  const petals = seeded(day, 3) > 0.5 ? 6 : 5;
  const rotate = Math.round(seeded(day, 4) * 60);
  const lean = Math.round((seeded(day, 5) - 0.5) * 8);
  return (
    <svg viewBox="-20 -22 40 62" className={big ? "h-16 w-12" : "h-14 w-10"} aria-hidden>
      <path d={`M0 6 Q${lean} 22 0 40`} stroke={STEM} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M0 26 q-9 -2 -11 -9 q8 0 11 7z" fill={STEM} />
      <g transform={`rotate(${rotate})`}>
        {Array.from({ length: petals }, (_, i) => (
          <ellipse key={i} cx="0" cy="-9" rx="6" ry="9.5" fill={color} transform={`rotate(${(360 / petals) * i})`} />
        ))}
      </g>
      <circle r="5.5" fill="#ffc24b" />
      <circle r="5.5" fill="none" stroke="#f0a91d" strokeWidth="1" opacity=".5" />
    </svg>
  );
}

function Clover() {
  return (
    <svg viewBox="-20 -20 40 58" className="h-14 w-10" aria-hidden>
      <path d="M0 4 Q3 20 0 38" stroke={STEM} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      {[0, 90, 180, 270].map((r) => (
        <path
          key={r}
          d="M0 0 C -2 -6 -10 -8 -10 -13 C -10 -17 -5 -18 -3 -15 C -2 -14 -1 -13 0 -11 C 1 -13 2 -14 3 -15 C 5 -18 10 -17 10 -13 C 10 -8 2 -6 0 0z"
          fill="#4cc38a"
          transform={`rotate(${r}) scale(0.85)`}
        />
      ))}
      <circle r="2.5" fill="#2f9e6e" />
    </svg>
  );
}

function Bud() {
  return (
    <div className="relative flex items-end justify-center">
      <span className="absolute bottom-3 size-12 animate-ping rounded-full bg-accent/20" aria-hidden />
      <svg viewBox="-20 -24 40 64" className="relative h-16 w-11 animate-float" aria-hidden>
        <path d="M0 2 Q-3 22 0 40" stroke={STEM} strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <path d="M0 24 q10 -2 12 -10 q-9 0 -12 8z" fill={STEM} />
        <path d="M0 -18 C 9 -12 9 0 0 4 C -9 0 -9 -12 0 -18z" fill="#ff6f9f" />
        <path d="M0 -18 C 4 -10 4 0 0 4" stroke="#d6336c" strokeWidth="1.5" fill="none" opacity=".5" />
        <path d="M-6 0 Q0 8 6 0 L4 4 Q0 7 -4 4z" fill={STEM} />
      </svg>
    </div>
  );
}

function Sprout({ day }: { day: number }) {
  const tilt = Math.round((seeded(day, 6) - 0.5) * 16);
  return (
    <svg viewBox="-20 -6 40 46" className="h-10 w-9 opacity-55" aria-hidden>
      <g transform={`rotate(${tilt} 0 34)`}>
        <path d="M0 34 L0 18" stroke={STEM} strokeWidth="2.5" strokeLinecap="round" />
        <path d="M0 20 q-10 -2 -11 -11 q9 1 11 9z" fill={STEM} />
        <path d="M0 18 q9 -3 10 -11 q-8 1 -10 9z" fill={STEM} />
      </g>
      <ellipse cx="0" cy="35" rx="9" ry="3" fill="#c9a27e" opacity=".45" />
    </svg>
  );
}

function RewardSign({ milestones, reached }: { milestones: PathNode["milestones"]; reached: boolean }) {
  return (
    <span
      className={`absolute -top-2 right-0 z-10 rounded-full px-1.5 py-0.5 text-sm shadow-soft ${
        reached ? "bg-sun-soft" : "bg-surface"
      }`}
      title="Belohnung"
    >
      {milestones.map((m) => REWARD_EMOJI[m] ?? "🎁").join("")}
    </span>
  );
}

function Grass() {
  return (
    <svg
      viewBox="0 0 400 40"
      preserveAspectRatio="none"
      className="absolute inset-x-0 bottom-0 h-8 w-full"
      aria-hidden
    >
      <path
        d="M0 40 L0 22 Q10 6 18 24 Q24 10 32 24 Q42 2 50 22 Q58 12 66 24 Q76 4 86 22 Q94 12 102 24 Q112 0 122 22 Q130 10 140 24 Q150 4 160 22 Q168 12 176 24 Q186 2 196 22 Q204 12 212 24 Q222 6 232 22 Q240 10 248 24 Q258 0 268 22 Q276 12 284 24 Q294 4 304 22 Q312 12 320 24 Q330 2 340 22 Q348 10 356 24 Q366 4 376 22 Q384 12 392 24 L400 22 L400 40 Z"
        fill="#8fd6ad"
        opacity=".55"
      />
    </svg>
  );
}
