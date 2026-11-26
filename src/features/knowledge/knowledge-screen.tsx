"use client";

import { useMemo, useState, useTransition } from "react";
import { Mouse } from "@/features/shell/mouse";
import { PageHeader } from "@/features/shell/page-header";
import { deleteNugget } from "./actions";
import { NuggetForm } from "./nugget-form";

export type Nugget = { id: string; name: string; nugget: string; created_at: string; source_date: string | null };

export function KnowledgeScreen({ nuggets }: { nuggets: Nugget[] }) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"new" | "abc">("new");
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = nuggets.filter(
      (n) => !q || n.name.toLowerCase().includes(q) || n.nugget.toLowerCase().includes(q),
    );
    return sort === "abc"
      ? [...filtered].sort((a, b) => a.name.localeCompare(b.name, "de"))
      : [...filtered].sort((a, b) => b.created_at.localeCompare(a.created_at));
  }, [nuggets, query, sort]);

  return (
    <>
      <PageHeader
        icon={<Mouse className="size-14 shrink-0" />}
        title="Knowledge"
        subtitle={`${nuggets.length} ${nuggets.length === 1 ? "Nugget" : "Nuggets"}`}
        action={
          editing !== "new" && (
            <button type="button" onClick={() => setEditing("new")} className="btn-primary px-4 py-2 text-sm">
              + Neu
            </button>
          )
        }
      />

      {editing === "new" && (
        <section className="card mb-6 animate-pop">
          <p className="mb-3 font-extrabold">Neues Knowledge Nugget</p>
          <NuggetForm onDone={() => setEditing(null)} onCancel={() => setEditing(null)} />
        </section>
      )}

      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Name oder Nugget suchen …"
        className="input mb-3"
        aria-label="Knowledge durchsuchen"
      />
      <div role="group" aria-label="Sortierung" className="mb-4 flex gap-2">
        {(
          [
            ["new", "Neueste zuerst"],
            ["abc", "A–Z"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            aria-pressed={sort === key}
            onClick={() => setSort(key)}
            className={`chip px-3.5 py-1.5 text-sm ${sort === key ? "bg-accent text-on-accent" : "bg-surface text-muted"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="card text-center text-muted">
          {nuggets.length === 0
            ? "Noch keine Nuggets. Tipp in den News auf eine Person, um sie direkt hier zu speichern."
            : "Keine Treffer."}
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {visible.map((n) =>
            editing === n.id ? (
              <li key={n.id} className="card">
                <NuggetForm initial={n} onDone={() => setEditing(null)} onCancel={() => setEditing(null)} />
              </li>
            ) : (
              <li key={n.id} className="card">
                <p className="font-extrabold">{n.name}</p>
                <p className="mt-1 whitespace-pre-line">{n.nugget}</p>
                <div className="mt-3 flex items-center justify-between text-xs text-muted">
                  <span>
                    {formatDate(n.created_at)}
                    {n.source_date ? " · aus den News" : ""}
                  </span>
                  {confirmDelete === n.id ? (
                    <span className="flex gap-3">
                      <button type="button" onClick={() => setConfirmDelete(null)} className="font-bold">
                        Behalten
                      </button>
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => startTransition(() => deleteNugget(n.id))}
                        className="font-bold text-danger"
                      >
                        Wirklich löschen
                      </button>
                    </span>
                  ) : (
                    <span className="flex gap-3">
                      <button type="button" onClick={() => setEditing(n.id)} className="font-bold text-accent-ink">
                        Bearbeiten
                      </button>
                      <button type="button" onClick={() => setConfirmDelete(n.id)} className="font-bold">
                        Löschen
                      </button>
                    </span>
                  )}
                </div>
              </li>
            ),
          )}
        </ul>
      )}
    </>
  );
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("de-DE", { day: "numeric", month: "short", year: "numeric", timeZone: "Europe/Berlin" }).format(
    new Date(iso),
  );
}
