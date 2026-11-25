import type { ReactNode } from "react";

export function PageHeader({
  title,
  subtitle,
  action,
  icon,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  /** Optional links neben dem Titel, z. B. das Maskottchen. */
  icon?: ReactNode;
}) {
  return (
    <header className="mb-6 flex items-center justify-between gap-4">
      <div className="flex min-w-0 items-center gap-3">
        {icon}
        <div className="min-w-0">
          {subtitle && <p className="text-sm font-semibold text-muted">{subtitle}</p>}
          <h1 className="text-[1.75rem] leading-tight font-extrabold tracking-tight">{title}</h1>
        </div>
      </div>
      {action}
    </header>
  );
}

export function ComingSoon({ phase, children }: { phase: number; children: ReactNode }) {
  return (
    <div className="rounded-3xl border-2 border-dashed border-border p-5 text-center text-muted">
      <p className="chip bg-lavender-soft text-lavender">Kommt in Phase {phase}</p>
      <p className="mt-2 text-sm">{children}</p>
    </div>
  );
}

/** Kleiner, runder Abmelden-Button für die Kopfzeile. */
export function HeaderButton({ children }: { children: ReactNode }) {
  return (
    <button className="rounded-full border-2 border-border bg-surface px-3 py-1 text-xs font-bold text-muted transition active:scale-95">
      {children}
    </button>
  );
}
