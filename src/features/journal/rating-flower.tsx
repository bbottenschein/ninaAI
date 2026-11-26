import { MOTIFS, motifClass } from "@/features/shell/motif";
import { bloom } from "./logic";

const PETALS = 8;

function mix(a: string, b: string, t: number): string {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `#${pa.map((v, i) => Math.round(v + (pb[i] - v) * t).toString(16).padStart(2, "0")).join("")}`;
}

/**
 * Tagesbewertung als Motiv je nach Design (SPEC-journal › Tagesbewertung, SPEC-settings › Design):
 * Blume blüht auf · Zweig bekommt Blätter · Mond nimmt zu · Katze wacht auf.
 */
export function RatingFlower({ rating, className = "size-40" }: { rating: number; className?: string }) {
  return (
    <>
      {MOTIFS.map((m) => {
        const cls = `${className} ${motifClass(m)}`;
        if (m === "clean") return <Branch key={m} rating={rating} className={cls} />;
        if (m === "dark") return <Moon key={m} rating={rating} className={cls} />;
        if (m === "cat") return <WakingCat key={m} rating={rating} className={cls} />;
        return <Flower key={m} rating={rating} className={cls} />;
      })}
    </>
  );
}

/** Ein Zweig, der mit der Bewertung mehr und sattere Blätter bekommt (Clean Light). */
function Branch({ rating, className }: { rating: number; className: string }) {
  const b = bloom(rating);
  const leaves = Math.max(1, Math.round(rating * 1.2));
  const color = mix("#c9c0b3", "#6f8268", b);
  return (
    <svg viewBox="-50 -50 100 110" className={className} aria-hidden>
      <path d="M2 58 Q-4 10 4 -44" stroke="#6f6a64" strokeWidth="3" fill="none" strokeLinecap="round" />
      {Array.from({ length: leaves }, (_, i) => {
        const y = 48 - i * 8;
        const side = i % 2 ? 1 : -1;
        const x = 2 - (i * 0.25);
        return (
          <path
            key={i}
            d={`M${x} ${y} q${side * 16} -2 ${side * 22} -14 q${side * -14} -2 ${side * -22} 14z`}
            fill={color}
            opacity={0.75 + (i / leaves) * 0.25}
            style={{ transition: "fill 400ms ease" }}
          />
        );
      })}
    </svg>
  );
}

/** Mondphasen von der schmalen Sichel (1) bis zum leuchtenden Vollmond (10) (Dark). */
function Moon({ rating, className }: { rating: number; className: string }) {
  const k = 0.08 + 0.92 * bloom(rating);
  const r = 34;
  const rx = Math.max(0.01, r * Math.abs(1 - 2 * k));
  const lit = `M0 ${-r} A${r} ${r} 0 0 1 0 ${r} A${rx} ${r} 0 0 ${k > 0.5 ? 1 : 0} 0 ${-r}Z`;
  return (
    <svg viewBox="-50 -50 100 110" className={className} aria-hidden>
      {rating >= 8 && <circle r={r + 8} cy="5" fill="#ffc867" opacity={0.12 + (rating - 8) * 0.06} />}
      <g transform="translate(0 5)">
        <circle r={r} fill="#2a2532" />
        <path d={lit} fill="#ffc867" style={{ transition: "d 400ms ease" }} />
      </g>
      {rating >= 6 && <path d="M-40 -34l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="#ff8fb3" />}
      {rating >= 9 && <path d="M38 40l1.6 4 4 1.6-4 1.6-1.6 4-1.6-4-4-1.6 4-1.6z" fill="#ffc867" />}
    </svg>
  );
}

/** Eine Katze, die mit der Bewertung aufwacht: schläft (1–3), schaut (4–7), freut sich (8–10). */
function WakingCat({ rating, className }: { rating: number; className: string }) {
  const mood = rating <= 3 ? "sleepy" : rating >= 8 ? "party" : "happy";
  const ink = "#3b2a20";
  const eyes =
    mood === "happy" ? (
      <>
        <ellipse cx="-14" cy="4" rx="4.5" ry="6" fill={ink} />
        <ellipse cx="14" cy="4" rx="4.5" ry="6" fill={ink} />
        <circle cx="-12.5" cy="1.5" r="1.6" fill="#fff" />
        <circle cx="15.5" cy="1.5" r="1.6" fill="#fff" />
      </>
    ) : (
      <path
        d={mood === "sleepy" ? "M-19 5q5 4 10 0M9 5q5 4 10 0" : "M-19 6q5-6 10 0M9 6q5-6 10 0"}
        stroke={ink}
        strokeWidth="2.6"
        fill="none"
        strokeLinecap="round"
      />
    );
  return (
    <svg viewBox="-50 -50 100 110" className={className} aria-hidden>
      {/* Körper: eingerollt beim Schlafen, sitzend sonst */}
      {mood === "sleepy" ? (
        <path d="M-40 52 Q-44 20 -10 18 Q30 16 40 40 Q44 54 20 56 Q-30 58 -40 52Z" fill="#c98b5a" />
      ) : (
        <path d="M-24 56 Q-30 20 0 16 Q30 20 24 56Z" fill="#c98b5a" />
      )}
      <path d={mood === "sleepy" ? "M36 46 Q50 30 34 22" : "M22 52 Q44 50 40 26"} stroke="#c98b5a" strokeWidth="7" fill="none" strokeLinecap="round" />
      <g transform={mood === "sleepy" ? "translate(-8 22) rotate(-12) scale(0.85)" : "translate(0 -8)"}>
        <path d="M-30 -8 L-27 -38 L-8 -22Z M30 -8 L27 -38 L8 -22Z" fill="#c98b5a" />
        <path d="M-24 -14 L-23 -30 L-12 -21Z M24 -14 L23 -30 L12 -21Z" fill="#f3c9a8" />
        <ellipse cx="0" cy="4" rx="34" ry="28" fill="#d9955f" />
        <ellipse cx="0" cy="16" rx="16" ry="11" fill="#fbe9d6" />
        {eyes}
        <path d="M-3 12h6l-3 3z" fill="#d9776b" />
        <ellipse cx="-22" cy="13" rx="5" ry="3" fill="#e8a08d" opacity=".6" />
        <ellipse cx="22" cy="13" rx="5" ry="3" fill="#e8a08d" opacity=".6" />
      </g>
      {mood === "sleepy" && (
        <text x="22" y="-4" fontSize="14" fontWeight="800" fill="#a88a72">
          z
        </text>
      )}
      {mood === "party" && (
        <g fill="#e45b6b">
          <path d="M-38 -34c-3-4-9-1-6 4l6 6 6-6c3-5-3-8-6-4z" />
          <path d="M38 -40c-2.4-3.2-7.2-.8-4.8 3.2l4.8 4.8 4.8-4.8c2.4-4-2.4-6.4-4.8-3.2z" opacity=".8" />
        </g>
      )}
    </svg>
  );
}

/** Bei 1 eine geschlossene Knospe, bis 10 voll erblüht und kräftig rosa (Flower). */
function Flower({ rating, className }: { rating: number; className: string }) {
  const b = bloom(rating);
  const spread = 10 + b * 35; // Grad zwischen den Blütenblättern: 10° (zu) … 45° (offen, 8 × 45° = 360°)
  const length = 16 + b * 12;
  const width = 6 + b * 5;
  const color = mix("#ffd1e1", "#f0679b", b);
  const inner = mix("#ffe3ee", "#ff8fb6", b);

  return (
    <svg viewBox="-50 -50 100 110" className={className} aria-hidden>
      {/* Stiel und Blätter */}
      <path d="M0 8 Q-3 34 0 58" stroke="#5fb98a" strokeWidth="3.5" fill="none" strokeLinecap="round" />
      <path d="M0 40 q-15 -3 -18 -15 q13 0 18 11z" fill="#5fb98a" />
      <path d="M0 48 q14 -4 16 -14 q-12 1 -16 10z" fill="#4cc38a" />
      <g style={{ transition: "all 400ms cubic-bezier(0.34,1.56,0.64,1)" }}>
        {Array.from({ length: PETALS }, (_, i) => {
          const angle = (i - (PETALS - 1) / 2) * spread;
          return (
            <g key={i} transform={`rotate(${angle})`} style={{ transition: "transform 400ms ease" }}>
              <ellipse cx="0" cy={-length / 2 - 2} rx={width} ry={length / 2 + 2} fill={i % 2 ? color : inner} opacity={0.95} />
            </g>
          );
        })}
      </g>
      <circle r={3 + b * 5} fill="#ffc24b" style={{ transition: "r 400ms ease" }} />
    </svg>
  );
}
