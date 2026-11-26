"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Mascot } from "@/features/shell/mascot";
import { PageHeader } from "@/features/shell/page-header";
import { PinPad } from "./pin-pad";
import { unlockJournal } from "./settings-actions";

/** Sperrbildschirm, wenn eine PIN gesetzt ist (SPEC-journal › Privatsphäre). */
export function JournalLock() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  return (
    <>
      <PageHeader icon={<Mascot mood="sleepy" className="size-14 shrink-0" />} title="Journal" subtitle="Gesperrt 🔒" />
      <div className="card flex flex-col items-center gap-5 py-8">
        <p className="text-center font-bold">Gib deine PIN ein</p>
        <PinPad
          disabled={pending}
          error={error}
          onComplete={(pin) =>
            new Promise<void>((resolve) =>
              startTransition(async () => {
                const r = await unlockJournal(pin);
                if (r.error) setError(r.error);
                else router.refresh();
                resolve();
              }),
            )
          }
        />
        <p className="max-w-64 text-center text-xs text-muted">
          PIN vergessen? Benedikt kann sie im Admin-Bereich nicht sehen – frag ihn, die PIN in der Datenbank zurückzusetzen.
        </p>
      </div>
    </>
  );
}
