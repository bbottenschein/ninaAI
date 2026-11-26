"use client";

import { useState, useTransition } from "react";
import { setTodoDone, snoozeTodo } from "./actions";
import { AREA_STYLE, dueLabel } from "./format";
import type { Area, Todo } from "./logic";
import { snoozeLabel, type SnoozeOption } from "./schedule";

const OPTIONS: SnoozeOption[] = ["hour", "evening", "tomorrow"];

/**
 * Öffnet sich, wenn Nina auf eine Erinnerung tippt (SPEC-remind-me ›
 * Benachrichtigungen): „Erledigt“ oder „Später“ (1 Stunde, Abend, morgen).
 */
export function ReminderSheet({
  todo,
  area,
  today,
  onEdit,
  onClose,
}: {
  todo: Todo;
  area: Area;
  today: string;
  onEdit: () => void;
  onClose: () => void;
}) {
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [now] = useState(() => new Date());
  const due = dueLabel(todo.due_date, todo.due_time, today);

  function done() {
    startTransition(async () => {
      const result = await setTodoDone(todo.id, true);
      if (result.error) setMessage(result.error);
      else onClose();
    });
  }

  function later(option: SnoozeOption) {
    startTransition(async () => {
      const result = await snoozeTodo(todo.id, option);
      if (result.error) setMessage(result.error);
      else onClose();
    });
  }

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center" role="dialog" aria-modal="true" aria-label="Erinnerung">
      <button type="button" aria-label="Schließen" onClick={onClose} className="absolute inset-0 bg-foreground/25 backdrop-blur-[2px]" />
      <div className="relative w-full max-w-lg animate-pop rounded-t-[2rem] border border-border bg-surface px-5 pt-3 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] shadow-soft">
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-border" aria-hidden />
        <span className={`chip ${AREA_STYLE[area].chip}`}>🔔 {AREA_STYLE[area].label}</span>
        <h2 className="mt-2 text-2xl font-extrabold">
          {todo.priority && <span className="mr-1 text-sun">★</span>}
          {todo.title}
        </h2>
        {due && <p className="mt-1 text-sm text-muted">📅 {due}</p>}
        {todo.note && <p className="mt-2 text-sm">{todo.note}</p>}

        <button type="button" onClick={done} disabled={pending} className="btn-primary mt-5 w-full text-lg">
          ✓ Erledigt
        </button>

        <p className="mt-4 mb-2 text-xs font-extrabold text-muted">Später erinnern</p>
        <div className="grid grid-cols-3 gap-2">
          {OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => later(option)}
              disabled={pending}
              className="btn-secondary px-2 py-2.5 text-sm"
            >
              {snoozeLabel(option, now)}
            </button>
          ))}
        </div>

        {message && <p className="mt-3 text-sm text-danger">{message}</p>}
        <div className="mt-4 flex justify-between text-sm font-bold">
          <button type="button" onClick={onEdit} className="text-accent-ink">
            Bearbeiten
          </button>
          <button type="button" onClick={onClose} className="text-muted">
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
}
