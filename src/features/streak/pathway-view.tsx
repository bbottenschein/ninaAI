import { Mouse } from "@/features/shell/mouse";
import { REWARD_EMOJI } from "@/features/rewards/labels";
import type { PathNode } from "./pathway";

// Schlangenlinie: seitlicher Versatz je Feld (in rem).
const OFFSETS = [0, 2.5, 4, 2.5, 0, -2.5, -4, -2.5];

export function PathwayView({ nodes, hiddenPast }: { nodes: PathNode[]; hiddenPast: number }) {
  return (
    <div className="relative py-2">
      {hiddenPast > 0 && (
        <p className="mb-3 text-center text-xs font-bold text-muted">… {hiddenPast} frühere Tage geschafft</p>
      )}
      <ol className="flex flex-col items-center gap-3">
        {nodes.map((node, i) => (
          <li
            key={node.key}
            className="relative flex items-center"
            style={{ transform: `translateX(${OFFSETS[i % OFFSETS.length]}rem)` }}
          >
            <Node node={node} />
            {node.milestones.length > 0 && (
              <span
                className={`absolute left-full ml-2 flex items-center gap-0.5 rounded-full px-2 py-1 text-lg shadow-soft ${
                  node.kind === "future" || node.kind === "today" ? "bg-surface" : "bg-sun-soft"
                }`}
                title="Belohnung"
              >
                {node.milestones.map((m) => REWARD_EMOJI[m] ?? "🎁").join("")}
              </span>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}

function Node({ node }: { node: PathNode }) {
  if (node.kind === "today") {
    return (
      <div className="flex size-20 items-center justify-center rounded-full border-4 border-accent bg-surface shadow-soft">
        <Mouse className="size-14 animate-float" />
        <span className="sr-only">Heute, Tag {node.streakDay}</span>
      </div>
    );
  }
  if (node.kind === "joker") {
    return (
      <div
        className="flex size-14 items-center justify-center rounded-full bg-lavender-soft text-2xl shadow-soft"
        title="Joker eingesetzt"
      >
        🃏
      </div>
    );
  }
  if (node.kind === "done") {
    return (
      <div
        className={`flex items-center justify-center rounded-full bg-accent font-extrabold text-on-accent shadow-soft ${
          node.isToday ? "size-20 border-4 border-accent-soft text-2xl" : "size-14 text-lg"
        }`}
      >
        {node.isToday ? "✓" : node.streakDay}
      </div>
    );
  }
  return (
    <div className="flex size-14 items-center justify-center rounded-full border-2 border-dashed border-border bg-surface/60 text-lg font-extrabold text-muted">
      {node.streakDay}
    </div>
  );
}
