import { bloom } from "./logic";

const PETALS = 8;

function mix(a: string, b: string, t: number): string {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `#${pa.map((v, i) => Math.round(v + (pb[i] - v) * t).toString(16).padStart(2, "0")).join("")}`;
}

/**
 * Tagesbewertung als Blume (SPEC-journal › Tagesbewertung): bei 1 eine geschlossene
 * Knospe, bis 10 voll erblüht und kräftig rosa.
 */
export function RatingFlower({ rating, className = "size-40" }: { rating: number; className?: string }) {
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
