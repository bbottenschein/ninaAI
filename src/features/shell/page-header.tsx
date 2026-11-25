import type { ReactNode } from "react";

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <header className="mb-6 flex items-start justify-between gap-4">
      <div>
        {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
        <h1 className="text-2xl font-semibold">{title}</h1>
      </div>
      {action}
    </header>
  );
}

export function ComingSoon({ phase, children }: { phase: number; children: ReactNode }) {
  return (
    <div className="card border-dashed text-center text-muted">
      <p className="text-xs font-semibold uppercase tracking-wide">Phase {phase}</p>
      <p className="mt-1">{children}</p>
    </div>
  );
}
