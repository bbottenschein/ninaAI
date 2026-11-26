"use client";

import { useRef, useState, useTransition } from "react";
import { deleteTodo, postponeTodo, setTodoDone } from "./actions";
import { AREA_STYLE, dueLabel, reminderLabel } from "./format";
import type { Area, Todo } from "./logic";
import { repeatLabel } from "./repeat";

const POSTPONE_AT = 90; // px nach rechts
const REVEAL_AT = 60; // px nach links
const DELETE_WIDTH = 96;

/**
 * Eine Aufgabe: Kreis = abhaken, Tipp = Karte öffnen,
 * nach rechts wischen = auf morgen, nach links wischen = „Löschen“ zeigen.
 */
export function TodoRow({
  todo,
  area,
  listName,
  today,
  onOpen,
  onAiEdit,
}: {
  todo: Todo;
  area: Area;
  listName?: string;
  today: string;
  onOpen: () => void;
  /** „Mit KI ändern“ (z. B. bei überfälligen Aufgaben). */
  onAiEdit?: () => void;
}) {
  const [done, setDone] = useState(Boolean(todo.completed_at));
  const [offset, setOffset] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [pending, startTransition] = useTransition();
  const start = useRef<{ x: number; y: number; base: number; swiping: boolean } | null>(null);
  // Nach einem Wischen kein „Tipp“ auslösen.
  const justSwiped = useRef(false);

  const overdue = !done && todo.due_date !== null && todo.due_date < today;
  const due = dueLabel(todo.due_date, todo.due_time, today);
  const reminder = reminderLabel(todo.snoozed_until ?? todo.remind_at, today);
  const repeat = repeatLabel(todo.repeat_rule);

  function toggle() {
    const next = !done;
    setDone(next);
    startTransition(async () => {
      const result = await setTodoDone(todo.id, next);
      if (result.error) setDone(!next);
    });
  }

  function onPointerDown(e: React.PointerEvent) {
    start.current = { x: e.clientX, y: e.clientY, base: revealed ? -DELETE_WIDTH : 0, swiping: false };
  }

  function onPointerMove(e: React.PointerEvent) {
    const s = start.current;
    if (!s) return;
    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;
    if (!s.swiping) {
      if (Math.abs(dx) < 10 || Math.abs(dx) < Math.abs(dy)) return;
      s.swiping = true;
      setDragging(true);
      (e.target as Element).setPointerCapture?.(e.pointerId);
    }
    setOffset(Math.max(-DELETE_WIDTH - 20, Math.min(140, s.base + dx)));
  }

  function onPointerUp() {
    const s = start.current;
    start.current = null;
    setDragging(false);
    if (!s?.swiping) return;
    justSwiped.current = true;
    setTimeout(() => (justSwiped.current = false), 0);
    if (offset > POSTPONE_AT && !done) {
      setOffset(0);
      setHidden(true);
      startTransition(async () => {
        const result = await postponeTodo(todo.id);
        if (result.error) setHidden(false);
      });
    } else if (offset < -REVEAL_AT) {
      setOffset(-DELETE_WIDTH);
      setRevealed(true);
    } else {
      setOffset(0);
      setRevealed(false);
    }
  }

  function remove() {
    setHidden(true);
    startTransition(async () => {
      const result = await deleteTodo(todo.id);
      if (result.error) setHidden(false);
    });
  }

  if (hidden) return null;

  return (
    <li className="relative overflow-hidden rounded-2xl">
      {/* Hintergrund beim Wischen */}
      <div className="absolute inset-0 flex items-center justify-between" aria-hidden={offset === 0}>
        <span className="flex h-full items-center bg-mint-soft pl-4 text-sm font-extrabold text-mint" style={{ width: Math.max(offset, 0) }}>
          {offset > 40 && "→ Morgen"}
        </span>
        <button
          type="button"
          onClick={remove}
          tabIndex={revealed ? 0 : -1}
          className="h-full bg-danger px-4 text-sm font-extrabold text-white"
          style={{ width: DELETE_WIDTH }}
        >
          Löschen
        </button>
      </div>

      <div
        className={`relative flex touch-pan-y items-start gap-3 bg-surface px-3 py-3 ${dragging ? "" : "transition-transform"}`}
        style={{ transform: `translateX(${offset}px)` }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <button
          type="button"
          onClick={toggle}
          disabled={pending}
          aria-label={done ? "Als offen markieren" : "Abhaken"}
          aria-pressed={done}
          className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border-2 text-xs font-extrabold transition ${
            done ? "border-accent bg-accent text-on-accent" : "border-border bg-surface"
          }`}
        >
          {done && "✓"}
        </button>
        <button
          type="button"
          onClick={() => {
            if (justSwiped.current) return;
            if (revealed) {
              setOffset(0);
              setRevealed(false);
            } else onOpen();
          }}
          className="min-w-0 flex-1 text-left"
        >
          <p className={`font-bold ${done ? "text-muted line-through" : ""}`}>
            {todo.priority && <span className="mr-1 text-sun">★</span>}
            {todo.title}
          </p>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted">
            <span className={`chip px-2 py-0.5 ${AREA_STYLE[area].chip}`}>{AREA_STYLE[area].short}</span>
            {listName && area === "life" && <span>{listName}</span>}
            {due && <span className={overdue ? "font-bold text-danger" : ""}>📅 {due}</span>}
            {reminder && <span>🔔 {reminder}</span>}
            {repeat && <span>🔁 {repeat}</span>}
          </p>
          {todo.note && <p className="mt-1 line-clamp-1 text-xs text-muted">{todo.note}</p>}
        </button>
        {onAiEdit && !done && (
          <button
            type="button"
            onClick={onAiEdit}
            className="shrink-0 self-center rounded-full bg-accent-soft px-2.5 py-1 text-xs font-extrabold text-accent-ink"
          >
            ✨ Mit KI ändern
          </button>
        )}
      </div>
    </li>
  );
}
