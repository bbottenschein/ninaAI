import { REWARD_EMOJI } from "@/features/rewards/labels";
import { MOTIFS, motifClass, type Motif } from "@/features/shell/motif";
import { MotifText } from "@/features/shell/motif-text";
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
      <Twinkles />
      {hiddenPast > 0 && (
        <p className="mb-2 text-center text-xs font-bold text-muted">
          <MotifText
            flower={`🌸 … und ${hiddenPast} ${hiddenPast === 1 ? "Blume" : "Blumen"} weiter vorne auf der Wiese`}
            clean={`🍃 … und ${hiddenPast} ${hiddenPast === 1 ? "Blatt" : "Blätter"} weiter vorne am Pfad`}
            dark={`⭐ … und ${hiddenPast} ${hiddenPast === 1 ? "Stern" : "Sterne"} weiter vorne am Himmel`}
            cat={`🐾 … und ${hiddenPast} ${hiddenPast === 1 ? "Pfote" : "Pfoten"} weiter vorne auf dem Weg`}
          />
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
              {MOTIFS.map((m) => (
                <Plant key={m} node={node} motif={m} />
              ))}
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
      <div className="motif-clean absolute inset-x-6 bottom-6 h-0.5 rounded-full bg-border" aria-hidden />
      <div className="motif-cat absolute inset-x-6 bottom-6 h-0.5 rounded-full bg-border" aria-hidden />
    </div>
  );
}

/** Eine Station des Pfads im Motiv des Designs (nur die passende Variante ist sichtbar). */
function Plant({ node, motif }: { node: PathNode; motif: Motif }) {
  return <div className={`${motifClass(motif)} flex items-end justify-center`}>{plantFor(node, motif)}</div>;
}

function plantFor(node: PathNode, motif: Motif) {
  if (motif === "clean") return <LeafStation node={node} />;
  if (motif === "dark") return <StarStation node={node} />;
  if (motif === "cat") return <PawStation node={node} />;
  return <FlowerStation node={node} />;
}

function FlowerStation({ node }: { node: PathNode }) {
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
      className="motif-flower absolute inset-x-0 bottom-0 h-8 w-full"
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

/* ---------- Clean Light: Blätter am Pfad ---------- */

const LEAVES = ["#8fa088", "#a8b59f", "#6f8268", "#b8c4b0", "#c9c0b3"];

function LeafStation({ node }: { node: PathNode }) {
  const tilt = Math.round((seeded(node.streakDay, 6) - 0.5) * 50);
  if (node.kind === "done") {
    const big = node.milestones.length > 0 || node.isToday;
    const color = LEAVES[Math.floor(seeded(node.streakDay, 2) * LEAVES.length)];
    return <Leaf color={color} tilt={tilt} className={big ? "h-14 w-12" : "h-11 w-9"} />;
  }
  if (node.kind === "joker") return <Leaf color="#c9a24a" tilt={tilt} className="h-12 w-10" />;
  if (node.kind === "today") {
    return (
      <div className="relative flex items-end justify-center">
        <span className="absolute bottom-2 size-11 animate-ping rounded-full bg-accent/15" aria-hidden />
        <Leaf color="none" stroke="#3f3a35" tilt={0} className="relative h-12 w-10 animate-float" />
      </div>
    );
  }
  return <Leaf color="none" stroke="#c4b8a8" tilt={tilt} className="h-8 w-7 opacity-70" />;
}

function Leaf({ color, stroke, tilt, className }: { color: string; stroke?: string; tilt: number; className: string }) {
  return (
    <svg viewBox="-20 -24 40 48" className={className} aria-hidden>
      <g transform={`rotate(${tilt})`}>
        <path d="M0 -20 C14 -10 14 10 0 20 C-14 10 -14 -10 0 -20Z" fill={color} stroke={stroke} strokeWidth={stroke ? 2 : 0} />
        <path d="M0 -17 L0 20" stroke={stroke ?? "#fff"} strokeOpacity={stroke ? 0.6 : 0.6} strokeWidth="1.5" />
      </g>
    </svg>
  );
}

/* ---------- Dark: Sterne am Himmel ---------- */

function StarStation({ node }: { node: PathNode }) {
  if (node.kind === "done") {
    const big = node.milestones.length > 0 || node.isToday;
    return <Star color={big ? "#ffc867" : seeded(node.streakDay, 2) > 0.5 ? "#ff8fb3" : "#ffb3cd"} className={big ? "size-12" : "size-9"} />;
  }
  if (node.kind === "joker") {
    return (
      <svg viewBox="-20 -20 40 40" className="size-10" aria-hidden>
        <path d="M6 -16 A16 16 0 1 0 14 10 A13 13 0 1 1 6 -16Z" fill="#ffc867" />
      </svg>
    );
  }
  if (node.kind === "today") {
    return (
      <div className="relative flex items-end justify-center">
        <span className="absolute size-11 animate-ping rounded-full bg-accent/20" aria-hidden />
        <Star color="none" stroke="#ff8fb3" className="relative size-10 animate-float" />
      </div>
    );
  }
  return <Star color="#5a4a63" className="size-5 opacity-80" />;
}

function Star({ color, stroke, className }: { color: string; stroke?: string; className: string }) {
  return (
    <svg viewBox="-20 -20 40 40" className={className} aria-hidden>
      <path
        d="M0 -17 L5 -6 L17 -5 L8 3 L10.5 15 L0 9 L-10.5 15 L-8 3 L-17 -5 L-5 -6Z"
        fill={color}
        stroke={stroke}
        strokeWidth={stroke ? 2.4 : 0}
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Ein paar ferne Sterne im Hintergrund (nur Dark). */
function Twinkles() {
  return (
    <svg className="motif-dark pointer-events-none absolute inset-0 h-full w-full" aria-hidden>
      {[
        [8, 12], [22, 70], [37, 30], [55, 82], [68, 18], [83, 55], [94, 28], [47, 55],
      ].map(([x, y], i) => (
        <circle key={i} cx={`${x}%`} cy={`${y}%`} r={i % 3 ? 1.2 : 1.8} fill="#f2eef3" opacity={0.35} />
      ))}
    </svg>
  );
}

/* ---------- Cozy Cat: Pfotenpfad mit Wollknäueln ---------- */

const PAWS = ["#b67d4e", "#8b5a3c", "#c98b5a", "#a0522d"];

function PawStation({ node }: { node: PathNode }) {
  const tilt = Math.round((seeded(node.streakDay, 6) - 0.5) * 40);
  if (node.kind === "done") {
    if (node.milestones.length > 0 || node.isToday) return <Yarn color={PAWS[node.streakDay % PAWS.length]} />;
    return <Paw color={PAWS[Math.floor(seeded(node.streakDay, 2) * PAWS.length)]} tilt={tilt} className="size-9" />;
  }
  if (node.kind === "joker") {
    return (
      <svg viewBox="-22 -14 44 28" className="h-8 w-12" aria-hidden>
        <path d="M-16 0 C-8 -12 10 -12 14 0 C10 12 -8 12 -16 0Z M14 0 L22 -8 L22 8Z" fill="#7aa0b8" />
        <circle cx="-6" cy="-2" r="2" fill="#2b3a45" />
      </svg>
    );
  }
  if (node.kind === "today") {
    return (
      <div className="relative flex items-end justify-center">
        <span className="absolute bottom-1 size-11 animate-ping rounded-full bg-accent/15" aria-hidden />
        <Paw color="none" stroke="#8b5a3c" tilt={0} className="relative size-10 animate-float" />
      </div>
    );
  }
  return <Paw color="#e9cba8" tilt={tilt} className="size-7 opacity-70" />;
}

function Paw({ color, stroke, tilt, className }: { color: string; stroke?: string; tilt: number; className: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden>
      <g transform={`rotate(${tilt} 20 20)`} fill={color} stroke={stroke} strokeWidth={stroke ? 2 : 0}>
        <ellipse cx="20" cy="27" rx="9" ry="8" />
        <ellipse cx="9" cy="16" rx="4" ry="5" />
        <ellipse cx="16" cy="9" rx="4" ry="5" />
        <ellipse cx="24" cy="9" rx="4" ry="5" />
        <ellipse cx="31" cy="16" rx="4" ry="5" />
      </g>
    </svg>
  );
}

function Yarn({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 44 44" className="size-12" aria-hidden>
      <circle cx="20" cy="22" r="16" fill={color} />
      <path d="M7 16 Q20 25 34 13 M6 24 Q20 33 35 21 M11 34 Q22 28 31 34 M14 8 Q12 22 18 37" stroke="#fff" strokeOpacity=".5" strokeWidth="2" fill="none" />
      <path d="M35 28 q7 4 5 12" stroke={color} strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </svg>
  );
}
