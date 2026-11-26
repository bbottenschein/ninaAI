"use client";

import { useEffect, useRef, useState, useSyncExternalStore, useTransition } from "react";
import { Mascot } from "@/features/shell/mascot";
import { recorderSupported, useRecorder, type Recording } from "@/features/tutor/use-recorder";
import { deleteTodo, saveTodo, setTodoDone, type TodoInput } from "./actions";
import { interpretTodoInput } from "./ai-actions";
import { normalizeOperations, type Proposal, type ProposalDraft } from "./ai-normalize";
import { AREA_STYLE, dueLabel, reminderLabel } from "./format";
import type { Todo, TodoList } from "./logic";
import { repeatLabel } from "./repeat";
import { TodoCard } from "./todo-card";

type Via = "ai_text" | "ai_voice";

const noop = () => () => {};

function toInput(d: ProposalDraft, via: Via): TodoInput {
  return {
    id: d.id,
    title: d.title,
    area: d.area,
    listId: d.list_id,
    note: d.note,
    dueDate: d.due_date,
    dueTime: d.due_time,
    reminder: d.reminder,
    repeatRule: d.repeat_rule,
    priority: d.priority,
    createdVia: via,
  };
}

/**
 * KI-Eingabe (SPEC-remind-me › Eingabe): ein Feld, tippen oder sprechen.
 * Claude macht daraus Vorschläge, die Nina bestätigt oder auf der Karte korrigiert.
 */
export function AiInput({
  lists,
  todos,
  today,
  focus,
  onClearFocus,
  onManual,
}: {
  lists: TodoList[];
  todos: Todo[];
  today: string;
  /** „Mit KI ändern“: Bezug auf genau diese Aufgabe. */
  focus: Todo | null;
  onClearFocus: () => void;
  /** Fallback: leere Karte mit dem Text als Titel. */
  onManual: (title: string) => void;
}) {
  const [text, setText] = useState("");
  const [via, setVia] = useState<Via>("ai_text");
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [transcribing, setTranscribing] = useState(false);
  const [micOk, setMicOk] = useState(true);
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const recorder = useRecorder(handleRecording);
  // Mikrofon-Knopf erst im Browser zeigen (Server kennt MediaRecorder nicht).
  const isClient = useSyncExternalStore(noop, () => true, () => false);

  useEffect(() => {
    if (focus) inputRef.current?.focus();
  }, [focus]);

  function submit(value = text, mode: Via = via) {
    const sentence = value.trim();
    if (!sentence || pending) return;
    setMessage(null);
    startTransition(async () => {
      const result = await interpretTodoInput({ text: sentence, focusId: focus?.id });
      if ("error" in result) {
        setMessage(result.error);
        onManual(result.fallbackTitle);
      } else {
        setProposals(result.proposals.map((p) => p));
        setVia(mode);
      }
      setText("");
      onClearFocus();
    });
  }

  async function handleRecording({ blob, seconds }: Recording) {
    if (seconds < 0.8) return;
    setTranscribing(true);
    try {
      const form = new FormData();
      form.append("audio", blob);
      form.append("seconds", String(seconds));
      const res = await fetch("/api/tutor/transcribe", { method: "POST", body: form });
      const data = (await res.json().catch(() => ({}))) as { text?: string; error?: string; detail?: string };
      if (res.ok && data.text) {
        setText(data.text);
        setVia("ai_voice");
        submit(data.text, "ai_voice");
      } else if (data.error === "limit") {
        setMessage("Dein Sprach-Limit für heute ist aufgebraucht – tipp einfach.");
      } else if (res.ok) {
        setMessage("Ich habe nichts verstanden. Versuch es nochmal oder tippe.");
      } else {
        setMessage(
          `Die Spracherkennung ist gerade nicht erreichbar – tipp einfach.${data.detail ? ` (Grund: ${data.detail})` : ` (Status ${res.status})`}`,
        );
      }
    } catch {
      setMessage("Keine Verbindung – tipp einfach.");
    } finally {
      setTranscribing(false);
    }
  }

  async function toggleMic() {
    if (recorder.recording) return recorder.stop();
    try {
      await recorder.start();
    } catch {
      setMicOk(false);
      setMessage("Ohne Mikrofon-Zugriff geht es per Tippen weiter.");
    }
  }

  const busy = pending || transcribing;
  const canRecord = isClient && micOk && recorderSupported();

  return (
    <section className="mb-6">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="card p-2"
      >
        {focus && (
          <div className="mx-1 mb-2 flex items-center gap-2 rounded-2xl bg-accent-soft px-3 py-2 text-sm">
            <span className="min-w-0 flex-1 truncate">
              ✨ Ändern: <span className="font-bold">{focus.title}</span>
            </span>
            <button type="button" onClick={onClearFocus} className="font-bold text-muted" aria-label="Bezug aufheben">
              ✕
            </button>
          </div>
        )}
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setVia("ai_text");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            rows={text.length > 40 ? 2 : 1}
            maxLength={500}
            placeholder={focus ? "z. B. um einen Tag schieben" : "z. B. Zahnarzt Freitag 15 Uhr"}
            aria-label="Aufgabe eingeben"
            disabled={busy || recorder.recording}
            className="min-h-11 min-w-0 flex-1 resize-none bg-transparent px-3 py-2.5 text-base outline-none"
          />
          {canRecord && (
            <button
              type="button"
              onClick={toggleMic}
              disabled={busy}
              aria-label={recorder.recording ? "Aufnahme beenden" : "Sprechen"}
              className={`flex size-11 shrink-0 items-center justify-center rounded-full text-lg transition active:scale-90 ${
                recorder.recording ? "animate-pulse bg-accent text-on-accent" : "bg-accent-soft"
              }`}
            >
              {recorder.recording ? "■" : "🎙️"}
            </button>
          )}
          <button
            disabled={!text.trim() || busy}
            aria-label="Los"
            className="flex size-11 shrink-0 items-center justify-center rounded-full bg-accent text-lg font-extrabold text-on-accent transition active:scale-90 disabled:opacity-40"
          >
            ✨
          </button>
        </div>
        {(busy || recorder.recording) && (
          <p className="flex items-center gap-2 px-3 pt-2 text-sm text-muted" role="status">
            <Mascot mood="sleepy" className="size-6 animate-wiggle" />
            {recorder.recording ? `Ich höre zu … ${recorder.seconds}s` : transcribing ? "Ich schreibe mit …" : "Die Maus denkt mit …"}
          </p>
        )}
      </form>
      {message && <p className="mt-2 px-2 text-sm text-muted">{message}</p>}

      {proposals.length > 0 && (
        <Proposals
          proposals={proposals}
          setProposals={setProposals}
          lists={lists}
          todos={todos}
          today={today}
          via={via}
        />
      )}
    </section>
  );
}

function Proposals({
  proposals,
  setProposals,
  lists,
  todos,
  today,
  via,
}: {
  proposals: Proposal[];
  setProposals: (p: Proposal[]) => void;
  lists: TodoList[];
  todos: Todo[];
  today: string;
  via: Via;
}) {
  const [editing, setEditing] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const remove = (index: number) => setProposals(proposals.filter((_, i) => i !== index));

  async function apply(p: Proposal): Promise<string | undefined> {
    if (p.kind === "create" || p.kind === "update") return (await saveTodo(toInput(p.draft, via))).error;
    if (p.kind === "delete") return (await deleteTodo(p.todo.id)).error;
    if (p.kind === "complete") return (await setTodoDone(p.todo.id, true)).error;
  }

  function applyOne(index: number) {
    startTransition(async () => {
      const err = await apply(proposals[index]);
      if (err) setError(err);
      else remove(index);
    });
  }

  function applyAll() {
    startTransition(async () => {
      const left: Proposal[] = [];
      for (const p of proposals) {
        if (p.kind === "choose") {
          left.push(p);
          continue;
        }
        const err = await apply(p);
        if (err) {
          setError(err);
          left.push(p);
        }
      }
      setProposals(left);
    });
  }

  function choose(index: number, todo: Todo) {
    const p = proposals[index];
    if (p.kind !== "choose") return;
    const [resolved] = normalizeOperations([{ ...p.op, target_id: todo.id, candidate_ids: [] }], { lists, todos });
    setProposals(proposals.map((x, i) => (i === index ? resolved : x)).filter(Boolean));
  }

  const ready = proposals.filter((p) => p.kind !== "choose").length;
  const editingProposal = editing !== null ? proposals[editing] : null;

  return (
    <div className="mt-3 flex flex-col gap-2">
      <p className="px-1 text-xs font-extrabold text-muted">
        {proposals.length === 1 ? "Mein Vorschlag" : `${proposals.length} Vorschläge`} – passt das?
      </p>
      {proposals.map((p, i) => (
        <div key={i} className="card animate-pop border-accent/30 p-4">
          {p.kind === "choose" ? (
            <>
              <p className="font-extrabold">Welche Aufgabe meinst du?</p>
              <div className="mt-2 flex flex-col gap-1.5">
                {p.candidates.map((c) => (
                  <button key={c.id} type="button" onClick={() => choose(i, c)} className="btn-secondary py-2 text-left text-sm">
                    {c.title}
                    {c.due_date && <span className="text-muted"> · {dueLabel(c.due_date, c.due_time, today)}</span>}
                  </button>
                ))}
              </div>
              <button type="button" onClick={() => remove(i)} className="mt-2 text-sm font-bold text-muted">
                Verwerfen
              </button>
            </>
          ) : (
            <>
              <ProposalSummary p={p} lists={lists} today={today} />
              <div className="mt-3 flex items-center gap-2">
                <button type="button" onClick={() => remove(i)} className="text-sm font-bold text-muted">
                  Verwerfen
                </button>
                <span className="flex-1" />
                {(p.kind === "create" || p.kind === "update") && (
                  <button type="button" onClick={() => setEditing(i)} className="btn-secondary px-3 py-1.5 text-sm">
                    Bearbeiten
                  </button>
                )}
                <button type="button" disabled={pending} onClick={() => applyOne(i)} className="btn-primary px-3 py-1.5 text-sm">
                  {p.kind === "create" ? "Speichern" : p.kind === "delete" ? "Löschen" : p.kind === "complete" ? "Abhaken" : "Übernehmen"}
                </button>
              </div>
            </>
          )}
        </div>
      ))}
      {ready > 1 && (
        <button type="button" disabled={pending} onClick={applyAll} className="btn-primary w-full">
          Alle übernehmen ({ready})
        </button>
      )}
      {error && <p className="px-1 text-sm text-danger">{error}</p>}

      {editingProposal && (editingProposal.kind === "create" || editingProposal.kind === "update") && (
        <TodoCard
          key={editing}
          lists={lists}
          draft={{ ...editingProposal.draft, area: editingProposal.draft.area }}
          today={today}
          createdVia={via}
          heading={editingProposal.kind === "create" ? "Vorschlag anpassen" : "Änderung anpassen"}
          onSaved={() => remove(editing!)}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

function ProposalSummary({ p, lists, today }: { p: Exclude<Proposal, { kind: "choose" }>; lists: TodoList[]; today: string }) {
  if (p.kind === "delete" || p.kind === "complete") {
    return (
      <p className="font-bold">
        {p.kind === "delete" ? "🗑️ Löschen:" : "✓ Abhaken:"} {p.todo.title}
      </p>
    );
  }
  const d = p.draft;
  const list = lists.find((l) => l.id === d.list_id);
  const due = dueLabel(d.due_date, d.due_time, today);
  const reminder = reminderLabel(d.remind_at, today);
  const repeat = repeatLabel(d.repeat_rule);
  const before = p.kind === "update" ? p.before : null;
  const beforeDue = before ? dueLabel(before.due_date, before.due_time, today) : null;

  return (
    <>
      <p className="text-xs font-extrabold text-accent-ink">{p.kind === "create" ? "Neu" : "Änderung"}</p>
      <p className="mt-0.5 text-lg font-extrabold">
        {d.priority && <span className="mr-1 text-sun">★</span>}
        {d.title}
        {before && before.title !== d.title && <span className="text-sm font-semibold text-muted"> (vorher: {before.title})</span>}
      </p>
      <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
        <span className={`chip px-2 py-0.5 ${AREA_STYLE[d.area].chip}`}>{AREA_STYLE[d.area].label}</span>
        {list && <span>Liste {list.name}</span>}
        {due && (
          <span>
            📅 {before && beforeDue !== due && beforeDue ? <s className="mr-1">{beforeDue}</s> : null}
            {due}
          </span>
        )}
        {!due && before?.due_date && <span>📅 ohne Datum</span>}
        {reminder && <span>🔔 {reminder}</span>}
        {repeat && <span>🔁 {repeat}</span>}
      </p>
      {d.note && <p className="mt-1 text-xs text-muted">{d.note}</p>}
    </>
  );
}
