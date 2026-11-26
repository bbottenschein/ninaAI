"use client";

import { useEffect, useState, useTransition } from "react";
import { deleteTodo, saveTodo } from "./actions";
import { AREA_STYLE } from "./format";
import { reminderChoiceOf, type Area, type ReminderChoice, type Todo, type TodoList } from "./logic";
import { WEEKDAY_ORDER, WEEKDAY_SHORT, buildRepeat, parseRepeat, type Freq } from "./repeat";

export type TodoDraft = Partial<Todo> & { area?: Area };

type RepeatKind = "none" | Freq | "CUSTOM";

/**
 * Korrektur-Karte: alle Felder einer Aufgabe direkt bearbeitbar (SPEC-remind-me ›
 * Korrektur-Karte). Datum und Uhrzeit per Auswahl, nicht per Tippen.
 */
export function TodoCard({
  lists,
  draft,
  today,
  onClose,
}: {
  lists: TodoList[];
  draft: TodoDraft;
  today: string;
  onClose: () => void;
}) {
  const existing = Boolean(draft.id);
  const initialList = lists.find((l) => l.id === draft.list_id);
  const [title, setTitle] = useState(draft.title ?? "");
  const [area, setArea] = useState<Area>(initialList?.area ?? draft.area ?? "life");
  const [listId, setListId] = useState(
    initialList?.area === "life" ? initialList.id : (lists.find((l) => l.area === "life" && l.name === "Allgemein")?.id ?? ""),
  );
  const [note, setNote] = useState(draft.note ?? "");
  const [dueDate, setDueDate] = useState(draft.due_date ?? "");
  const [dueTime, setDueTime] = useState(draft.due_time?.slice(0, 5) ?? "");
  const initialReminder = reminderChoiceOf({
    due_date: draft.due_date ?? null,
    due_time: draft.due_time ?? null,
    remind_at: draft.remind_at ?? null,
  });
  const [reminderKind, setReminderKind] = useState<ReminderChoice["kind"]>(initialReminder.kind);
  const [customDate, setCustomDate] = useState(initialReminder.kind === "custom" ? initialReminder.date : today);
  const [customTime, setCustomTime] = useState(initialReminder.kind === "custom" ? initialReminder.time : "19:00");
  const initialRepeat = parseRepeat(draft.repeat_rule);
  const [repeatKind, setRepeatKind] = useState<RepeatKind>(
    !initialRepeat ? "none" : initialRepeat.freq === "WEEKLY" && initialRepeat.byDay.length > 1 ? "CUSTOM" : initialRepeat.freq,
  );
  const [byDay, setByDay] = useState<number[]>(initialRepeat?.byDay ?? []);
  const [priority, setPriority] = useState(draft.priority ?? false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const lifeLists = lists.filter((l) => l.area === "life");
  const needsDue = reminderKind === "due" || reminderKind === "day_before";

  function repeatRule(): string | null {
    if (repeatKind === "none") return null;
    if (repeatKind === "WEEKLY") {
      // Wöchentlich am Wochentag der Fälligkeit (sonst heute).
      const day = new Date(`${dueDate || today}T00:00:00Z`).getUTCDay();
      return buildRepeat({ freq: "WEEKLY", byDay: [day] });
    }
    if (repeatKind === "CUSTOM") return byDay.length ? buildRepeat({ freq: "WEEKLY", byDay }) : null;
    return buildRepeat({ freq: repeatKind, byDay: [] });
  }

  function save() {
    setError(null);
    if (needsDue && !dueDate) {
      setError("Für diese Erinnerung braucht die Aufgabe ein Fälligkeitsdatum.");
      return;
    }
    const reminder: ReminderChoice =
      reminderKind === "custom" ? { kind: "custom", date: customDate, time: customTime } : { kind: reminderKind };
    startTransition(async () => {
      const result = await saveTodo({
        id: draft.id,
        title,
        area,
        listId: area === "life" ? listId : null,
        note,
        dueDate: dueDate || null,
        dueTime: dueTime || null,
        reminder,
        repeatRule: repeatRule(),
        priority,
      });
      if (result.error) setError(result.error);
      else onClose();
    });
  }

  function remove() {
    if (!draft.id) return;
    startTransition(async () => {
      const result = await deleteTodo(draft.id!);
      if (result.error) setError(result.error);
      else onClose();
    });
  }

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center" role="dialog" aria-modal="true" aria-label="Aufgabe">
      <button type="button" aria-label="Schließen" onClick={onClose} className="absolute inset-0 bg-foreground/25 backdrop-blur-[2px]" />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
        className="relative max-h-[92dvh] w-full max-w-lg animate-pop overflow-y-auto rounded-t-[2rem] border border-border bg-surface px-5 pt-3 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] shadow-soft"
      >
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-border" aria-hidden />
        <div className="mb-3 flex items-center justify-between">
          <p className="font-extrabold">{existing ? "Aufgabe bearbeiten" : "Neue Aufgabe"}</p>
          <button
            type="button"
            onClick={() => setPriority(!priority)}
            aria-pressed={priority}
            aria-label="Wichtig"
            className={`rounded-full px-3 py-1 text-sm font-bold transition ${priority ? "bg-sun-soft text-sun" : "text-muted"}`}
          >
            {priority ? "★ Wichtig" : "☆ Wichtig"}
          </button>
        </div>

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Was steht an?"
          maxLength={200}
          required
          autoFocus={!existing}
          className="input text-lg font-bold"
          aria-label="Titel"
        />

        {/* Bereich */}
        <div role="group" aria-label="Bereich" className="mt-3 grid grid-cols-2 gap-2">
          {(["work", "life"] as const).map((a) => (
            <button
              key={a}
              type="button"
              aria-pressed={area === a}
              onClick={() => setArea(a)}
              className={`rounded-full border-2 py-2 text-sm font-extrabold transition ${
                area === a ? `${AREA_STYLE[a].chip} border-transparent` : "border-border text-muted"
              }`}
            >
              {AREA_STYLE[a].label}
            </button>
          ))}
        </div>

        {/* Liste */}
        <Field label="Liste">
          {area === "work" ? (
            <p className="input bg-background text-muted">Job</p>
          ) : (
            <select value={listId} onChange={(e) => setListId(e.target.value)} className="input">
              {lifeLists.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          )}
        </Field>

        {/* Fälligkeit */}
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <Field label="Fällig am">
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="input" />
          </Field>
          <Field label="Uhrzeit">
            <input
              type="time"
              value={dueTime}
              onChange={(e) => setDueTime(e.target.value)}
              disabled={!dueDate}
              className="input w-32 disabled:opacity-50"
            />
          </Field>
        </div>
        {dueDate && (
          <button
            type="button"
            onClick={() => {
              setDueDate("");
              setDueTime("");
            }}
            className="-mt-1 mb-1 text-xs font-bold text-muted underline"
          >
            Ohne Datum
          </button>
        )}

        {/* Erinnerung */}
        <Field label="Erinnerung">
          <select
            value={reminderKind}
            onChange={(e) => setReminderKind(e.target.value as ReminderChoice["kind"])}
            className="input"
          >
            <option value="none">Keine</option>
            <option value="due">Zur Fälligkeit{dueTime ? "" : " (09:00)"}</option>
            <option value="day_before">1 Tag vorher</option>
            <option value="custom">Eigene Zeit …</option>
          </select>
        </Field>
        {reminderKind === "custom" && (
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <input type="date" value={customDate} onChange={(e) => setCustomDate(e.target.value)} className="input" aria-label="Erinnerung am" />
            <input type="time" value={customTime} onChange={(e) => setCustomTime(e.target.value)} className="input w-32" aria-label="Erinnerung um" />
          </div>
        )}

        {/* Wiederholung */}
        <Field label="Wiederholung">
          <select value={repeatKind} onChange={(e) => setRepeatKind(e.target.value as RepeatKind)} className="input">
            <option value="none">Keine</option>
            <option value="DAILY">Täglich</option>
            <option value="WEEKLY">Wöchentlich</option>
            <option value="MONTHLY">Monatlich</option>
            <option value="YEARLY">Jährlich</option>
            <option value="CUSTOM">Eigene Wochentage …</option>
          </select>
        </Field>
        {repeatKind === "CUSTOM" && (
          <div role="group" aria-label="Wochentage" className="mb-1 flex flex-wrap gap-1.5">
            {WEEKDAY_ORDER.map((d) => (
              <button
                key={d}
                type="button"
                aria-pressed={byDay.includes(d)}
                onClick={() => setByDay(byDay.includes(d) ? byDay.filter((x) => x !== d) : [...byDay, d])}
                className={`size-10 rounded-full text-sm font-extrabold transition ${
                  byDay.includes(d) ? "bg-accent text-on-accent" : "border-2 border-border text-muted"
                }`}
              >
                {WEEKDAY_SHORT[d]}
              </button>
            ))}
          </div>
        )}

        <Field label="Notiz">
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} maxLength={2000} className="input" />
        </Field>

        {error && (
          <p role="alert" className="mb-2 text-sm text-danger">
            {error}
          </p>
        )}

        <div className="mt-2 flex gap-2">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">
            Abbrechen
          </button>
          <button disabled={pending} className="btn-primary flex-1">
            {pending ? "Speichern …" : "Speichern"}
          </button>
        </div>
        {existing &&
          (confirmDelete ? (
            <div className="mt-3 flex items-center justify-center gap-4 text-sm">
              <span>Wirklich löschen?</span>
              <button type="button" onClick={() => setConfirmDelete(false)} className="font-bold">
                Nein
              </button>
              <button type="button" onClick={remove} disabled={pending} className="font-bold text-danger">
                Ja, löschen
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => setConfirmDelete(true)} className="mt-3 w-full text-sm font-bold text-danger">
              Aufgabe löschen
            </button>
          ))}
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="mt-3 mb-2 flex flex-col gap-1">
      <span className="text-xs font-bold text-muted">{label}</span>
      {children}
    </label>
  );
}
