"use client";

import Link from "next/link";
import { useState } from "react";
import { TodoCard, type TodoDraft } from "@/features/remind/todo-card";
import { TodoRow } from "@/features/remind/todo-row";
import type { TodoList } from "@/features/remind/logic";
import type { HomeTodo } from "@/features/remind/queries";

/** „Heute fällig“ auf Home: direkt abhakbar, Tipp öffnet die Karte. */
export function HomeTodos({
  todos,
  lists,
  today,
  weekend,
}: {
  todos: HomeTodo[];
  lists: TodoList[];
  today: string;
  weekend: boolean;
}) {
  const [card, setCard] = useState<TodoDraft | null>(null);
  const overdue = todos.filter((t) => t.due_date! < today).length;

  return (
    <section className="mb-6">
      <div className="mb-2 flex items-baseline justify-between">
        <h2 className="font-extrabold">
          Heute fällig {todos.length > 0 && <span className="text-muted">({todos.length})</span>}
        </h2>
        <Link href="/remind" className="text-sm font-bold text-accent-ink">
          Alle Aufgaben ›
        </Link>
      </div>
      {weekend && <p className="mb-2 text-xs text-muted">Wochenende – nur Life Mode 🌿</p>}
      {todos.length === 0 ? (
        <p className="card py-5 text-center text-muted">Nichts fällig. Genieß den Tag 🌸</p>
      ) : (
        <>
          {overdue > 0 && <p className="mb-2 text-xs font-bold text-danger">{overdue} überfällig</p>}
          <ul className="card flex flex-col gap-1 p-1.5">
            {todos.map((t) => (
              <TodoRow
                key={`${t.id}-${t.due_date}`}
                todo={t}
                area={t.area}
                listName={t.listName}
                today={today}
                onOpen={() => setCard(t)}
              />
            ))}
          </ul>
        </>
      )}
      {card && <TodoCard key={card.id} lists={lists} draft={card} today={today} onClose={() => setCard(null)} />}
    </section>
  );
}
