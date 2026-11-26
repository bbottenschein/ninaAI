"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { Mascot } from "@/features/shell/mascot";
import { PageHeader } from "@/features/shell/page-header";
import { clearCompleted, createList, deleteList, renameList, setTodoDone } from "./actions";
import { saveAreaFilter } from "./area-cookie";
import { AREA_STYLE } from "./format";
import { bucketOf, compareTodos, type Area, type AreaFilter, type Todo, type TodoList } from "./logic";
import { AiInput } from "./ai-input";
import { ReminderSheet } from "./reminder-sheet";
import { TodoCard, type TodoDraft } from "./todo-card";
import { TodoRow } from "./todo-row";

type View = "today" | "planned" | "lists" | "done";

const VIEWS: { key: View; label: string }[] = [
  { key: "today", label: "Heute" },
  { key: "planned", label: "Geplant" },
  { key: "lists", label: "Listen" },
  { key: "done", label: "Erledigt" },
];

export function RemindScreen({
  lists,
  open,
  done,
  today,
  initialArea,
  focusId,
}: {
  lists: TodoList[];
  open: Todo[];
  done: Todo[];
  today: string;
  initialArea: AreaFilter;
  /** Aus einer Erinnerung geöffnet (/remind?todo=…). */
  focusId?: string;
}) {
  const router = useRouter();
  const [focus, setFocus] = useState<string | null>(focusId ?? null);
  const [area, setArea] = useState<AreaFilter>(initialArea);
  const [view, setView] = useState<View>("today");
  const [card, setCard] = useState<TodoDraft | null>(null);
  const [aiFocus, setAiFocus] = useState<Todo | null>(null);
  const [listOpen, setListOpen] = useState<string | null>(null);

  const listById = useMemo(() => new Map(lists.map((l) => [l.id, l])), [lists]);
  const areaOf = (t: Todo): Area => listById.get(t.list_id)?.area ?? "life";
  const inArea = (t: Todo) => area === "all" || areaOf(t) === area;

  function chooseArea(next: AreaFilter) {
    setArea(next);
    setListOpen(null);
    saveAreaFilter(next);
  }

  function newTodo(title = "") {
    setCard({ title, area: area === "work" ? "work" : "life" });
  }

  const row = (t: Todo) => (
    <TodoRow
      onAiEdit={bucketOf(t.due_date, today) === "overdue" ? () => {
        setAiFocus(t);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } : undefined}
      key={`${t.id}-${t.completed_at ?? ""}-${t.due_date ?? ""}`}
      todo={t}
      area={areaOf(t)}
      listName={listById.get(t.list_id)?.name}
      today={today}
      onOpen={() => setCard(t)}
    />
  );

  const visibleOpen = open.filter(inArea);
  const focusTodo = focus ? open.find((t) => t.id === focus) : undefined;

  function closeFocus() {
    setFocus(null);
    router.replace("/remind", { scroll: false });
  }

  return (
    <>
      <PageHeader icon={<Mascot className="size-14 shrink-0" />} title="Remind me" />

      {/* Bereich */}
      <div role="group" aria-label="Bereich" className="mb-5 grid grid-cols-3 gap-1 rounded-full border-2 border-border bg-surface p-1">
        {(["all", "work", "life"] as const).map((a) => (
          <button
            key={a}
            type="button"
            aria-pressed={area === a}
            onClick={() => chooseArea(a)}
            className={`rounded-full py-1.5 text-sm font-extrabold transition ${
              area === a ? (a === "all" ? "bg-accent text-on-accent" : AREA_STYLE[a].chip) : "text-muted"
            }`}
          >
            {a === "all" ? "Alle" : AREA_STYLE[a].label}
          </button>
        ))}
      </div>

      {/* Eingabe: Claude füllt aus einem Satz die Karte vor (SPEC-remind-me › Eingabe) */}
      <AiInput
        lists={lists}
        todos={open}
        today={today}
        focus={aiFocus}
        onClearFocus={() => setAiFocus(null)}
        onManual={(title) => newTodo(title)}
      />

      {/* Ansichten */}
      <div role="tablist" aria-label="Ansicht" className="mb-4 flex gap-2 overflow-x-auto">
        {VIEWS.map((v) => (
          <button
            key={v.key}
            role="tab"
            type="button"
            aria-selected={view === v.key}
            onClick={() => {
              setView(v.key);
              setListOpen(null);
            }}
            className={`rounded-full px-4 py-1.5 text-sm font-extrabold whitespace-nowrap transition ${
              view === v.key ? "bg-foreground text-background" : "border-2 border-border bg-surface text-muted"
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>

      {view === "today" && <TodayView todos={visibleOpen} today={today} row={row} />}
      {view === "planned" && <PlannedView todos={visibleOpen} today={today} row={row} />}
      {view === "lists" && (
        <ListsView
          lists={lists.filter((l) => area === "all" || l.area === area)}
          open={open}
          done={done}
          openId={listOpen}
          onOpenList={setListOpen}
          showCreate={area !== "work"}
          row={row}
        />
      )}
      {view === "done" && <DoneView todos={done.filter(inArea)} listById={listById} />}

      {/* Schwebender „+“-Button */}
      <button
        type="button"
        onClick={() => newTodo()}
        aria-label="Neue Aufgabe"
        className="fixed right-5 bottom-[calc(env(safe-area-inset-bottom)+6.5rem)] z-20 flex size-14 items-center justify-center rounded-full bg-accent text-3xl font-bold text-on-accent shadow-soft transition active:scale-90"
      >
        +
      </button>

      {focusTodo && (
        <ReminderSheet
          todo={focusTodo}
          area={areaOf(focusTodo)}
          today={today}
          onEdit={() => {
            closeFocus();
            setCard(focusTodo);
          }}
          onClose={closeFocus}
        />
      )}

      {card && (
        <TodoCard
          key={card.id ?? "new"}
          lists={lists}
          draft={card}
          today={today}
          onClose={() => setCard(null)}
        />
      )}
    </>
  );
}

type RowFn = (t: Todo) => React.ReactNode;

function Group({ title, tone, children }: { title: string; tone?: "danger"; children: React.ReactNode }) {
  return (
    <section className="mb-5">
      <h2 className={`mb-2 text-sm font-extrabold ${tone === "danger" ? "text-danger" : "text-muted"}`}>{title}</h2>
      <ul className="card flex flex-col gap-1 p-1.5">{children}</ul>
    </section>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="card flex flex-col items-center gap-2 py-8 text-center text-muted">
      <Mascot mood="sleepy" className="size-16" />
      <p>{text}</p>
    </div>
  );
}

function TodayView({ todos, today, row }: { todos: Todo[]; today: string; row: RowFn }) {
  const overdue = todos.filter((t) => bucketOf(t.due_date, today) === "overdue");
  const due = todos.filter((t) => bucketOf(t.due_date, today) === "today");
  if (overdue.length === 0 && due.length === 0) return <Empty text="Heute ist nichts fällig. Genieß den Tag 🌸" />;
  return (
    <>
      {overdue.length > 0 && (
        <Group title={`Überfällig (${overdue.length})`} tone="danger">
          {overdue.map(row)}
        </Group>
      )}
      {due.length > 0 && <Group title={`Heute (${due.length})`}>{due.map(row)}</Group>}
    </>
  );
}

function PlannedView({ todos, today, row }: { todos: Todo[]; today: string; row: RowFn }) {
  const groups = [
    { key: "tomorrow", title: "Morgen" },
    { key: "week", title: "Diese Woche" },
    { key: "later", title: "Später" },
  ] as const;
  const filled = groups
    .map((g) => ({ ...g, items: todos.filter((t) => bucketOf(t.due_date, today) === g.key) }))
    .filter((g) => g.items.length > 0);
  if (filled.length === 0) return <Empty text="Nichts geplant. Mit „+“ legst du eine Aufgabe an." />;
  return (
    <>
      {filled.map((g) => (
        <Group key={g.key} title={g.title}>
          {g.items.map(row)}
        </Group>
      ))}
    </>
  );
}

function ListsView({
  lists,
  open,
  done,
  openId,
  onOpenList,
  showCreate,
  row,
}: {
  lists: TodoList[];
  open: Todo[];
  done: Todo[];
  openId: string | null;
  onOpenList: (id: string | null) => void;
  showCreate: boolean;
  row: RowFn;
}) {
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const current = lists.find((l) => l.id === openId);
  if (current) {
    return (
      <ListDetail
        list={current}
        open={open.filter((t) => t.list_id === current.id).sort(compareTodos)}
        done={done.filter((t) => t.list_id === current.id)}
        onBack={() => onOpenList(null)}
        row={row}
      />
    );
  }

  return (
    <>
      <ul className="flex flex-col gap-2">
        {lists.map((l) => {
          const count = open.filter((t) => t.list_id === l.id).length;
          return (
            <li key={l.id}>
              <button
                type="button"
                onClick={() => onOpenList(l.id)}
                className="card flex w-full items-center gap-3 py-4 text-left transition active:scale-[0.99]"
              >
                <span className={`size-3 rounded-full ${AREA_STYLE[l.area].dot}`} aria-hidden />
                <span className="flex-1 font-extrabold">{l.name}</span>
                <span className="text-sm font-bold text-muted">{count} offen ›</span>
              </button>
            </li>
          );
        })}
      </ul>
      {showCreate &&
        (creating ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              startTransition(async () => {
                const result = await createList(name);
                if (result.error) setError(result.error);
                else {
                  setCreating(false);
                  setName("");
                }
              });
            }}
            className="card mt-3 flex flex-col gap-2"
          >
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name der Liste" autoFocus maxLength={60} className="input" />
            {error && <p className="text-sm text-danger">{error}</p>}
            <div className="flex gap-2">
              <button type="button" onClick={() => setCreating(false)} className="btn-secondary flex-1">
                Abbrechen
              </button>
              <button disabled={pending} className="btn-primary flex-1">
                Anlegen
              </button>
            </div>
          </form>
        ) : (
          <button type="button" onClick={() => setCreating(true)} className="btn-secondary mt-3 w-full">
            + Neue Life-Liste
          </button>
        ))}
    </>
  );
}

function ListDetail({
  list,
  open,
  done,
  onBack,
  row,
}: {
  list: TodoList;
  open: Todo[];
  done: Todo[];
  onBack: () => void;
  row: RowFn;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(list.name);
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const run = (fn: () => Promise<{ error?: string }>, after?: () => void) =>
    startTransition(async () => {
      const result = await fn();
      if (result.error) setError(result.error);
      else after?.();
    });

  return (
    <>
      <div className="mb-3 flex items-center justify-between gap-2">
        <button type="button" onClick={onBack} className="text-sm font-bold text-accent-ink">
          ← Listen
        </button>
        {list.area === "life" && !editing && (
          <div className="flex gap-3 text-sm font-bold text-muted">
            <button type="button" onClick={() => setEditing(true)}>
              Umbenennen
            </button>
            <button type="button" onClick={() => setConfirm(true)} className="text-danger">
              Löschen
            </button>
          </div>
        )}
      </div>

      {editing ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            run(() => renameList(list.id, name), () => setEditing(false));
          }}
          className="mb-4 flex gap-2"
        >
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} autoFocus className="input" />
          <button disabled={pending} className="btn-primary px-4 text-sm">
            OK
          </button>
        </form>
      ) : (
        <h2 className="mb-4 flex items-center gap-2 text-xl font-extrabold">
          <span className={`size-3 rounded-full ${AREA_STYLE[list.area].dot}`} aria-hidden />
          {list.name}
        </h2>
      )}

      {confirm && (
        <div className="card mb-4 bg-accent-soft text-sm">
          <p className="font-bold">„{list.name}“ samt {open.length + done.length} Aufgaben löschen?</p>
          <div className="mt-3 flex gap-2">
            <button type="button" onClick={() => setConfirm(false)} className="btn-secondary flex-1 py-2">
              Behalten
            </button>
            <button type="button" disabled={pending} onClick={() => run(() => deleteList(list.id), onBack)} className="btn-primary flex-1 py-2">
              Löschen
            </button>
          </div>
        </div>
      )}
      {error && <p className="mb-3 text-sm text-danger">{error}</p>}

      {open.length > 0 ? (
        <ul className="card mb-4 flex flex-col gap-1 p-1.5">{open.map(row)}</ul>
      ) : (
        <p className="card mb-4 text-center text-muted">Alles erledigt in dieser Liste ✨</p>
      )}

      {done.length > 0 && (
        <section>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-muted">Erledigt ({done.length})</h3>
            <button type="button" disabled={pending} onClick={() => run(() => clearCompleted(list.id))} className="text-sm font-bold text-accent-ink">
              Erledigte leeren
            </button>
          </div>
          <ul className="card flex flex-col gap-1 p-1.5 opacity-80">{done.map(row)}</ul>
        </section>
      )}
    </>
  );
}

function DoneView({ todos, listById }: { todos: Todo[]; listById: Map<string, TodoList> }) {
  const [pending, startTransition] = useTransition();
  if (todos.length === 0) return <Empty text="In den letzten 30 Tagen noch nichts erledigt." />;
  return (
    <>
      <p className="mb-2 text-sm text-muted">Erledigt in den letzten 30 Tagen</p>
      <ul className="card flex flex-col divide-y divide-border p-0">
        {todos.map((t) => {
          const list = listById.get(t.list_id);
          return (
            <li key={t.id} className="flex items-center gap-3 px-4 py-3">
              <span className="text-mint" aria-hidden>
                ✓
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-muted line-through">{t.title}</p>
                <p className="text-xs text-muted">
                  {list ? `${AREA_STYLE[list.area].short} · ${list.name} · ` : ""}
                  {new Intl.DateTimeFormat("de-DE", { day: "numeric", month: "short", timeZone: "Europe/Berlin" }).format(
                    new Date(t.completed_at!),
                  )}
                </p>
              </div>
              <button
                type="button"
                disabled={pending}
                onClick={() => startTransition(async () => void (await setTodoDone(t.id, false)))}
                className="text-sm font-bold text-accent-ink"
              >
                Wiederherstellen
              </button>
            </li>
          );
        })}
      </ul>
    </>
  );
}
