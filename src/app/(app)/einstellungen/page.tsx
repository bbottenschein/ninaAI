import type { Metadata } from "next";
import Link from "next/link";
import { vapidConfig } from "@/lib/env.server";
import { logout } from "@/features/auth/actions";
import { getCurrentUser } from "@/features/auth/session";
import { MotionPermission } from "@/features/extras/motion-permission";
import { PushSettings } from "@/features/notifications/push-settings";
import { PageHeader } from "@/features/shell/page-header";
import { PushPreferences } from "@/features/settings/push-preferences";
import { prefsFor } from "@/features/settings/prefs";
import { loadPushPrefs, loadTheme } from "@/features/settings/queries";
import { ThemePicker } from "@/features/settings/theme-picker";

export const metadata: Metadata = { title: "Einstellungen" };

export default async function SettingsPage() {
  const user = await getCurrentUser();
  const [prefs, theme] = await Promise.all([loadPushPrefs(user), loadTheme(user.id)]);

  return (
    <>
      <PageHeader
        icon={<span className="text-5xl" aria-hidden>⚙️</span>}
        subtitle={user.name}
        title="Einstellungen"
        action={
          <Link href="/" className="rounded-full border-2 border-border bg-surface px-3 py-1 text-xs font-bold text-muted">
            ‹ Home
          </Link>
        }
      />

      <h2 className="mb-1 px-1 text-sm font-extrabold tracking-wide text-muted uppercase">🔔 Benachrichtigungen</h2>
      <PushSettings
        publicKey={vapidConfig()?.publicKey ?? null}
        title="Auf diesem Gerät"
        description="Erst einschalten, dann unten wählen, welche Pushes kommen sollen."
        compact
      />
      <PushPreferences prefs={prefsFor(user.role)} initial={prefs} />
      {user.role === "player" && <MotionPermission variant="row" />}

      <h2 className="mt-8 mb-1 px-1 text-sm font-extrabold tracking-wide text-muted uppercase">🎨 Design</h2>
      <ThemePicker initial={theme} />

      <h2 className="mt-8 mb-1 px-1 text-sm font-extrabold tracking-wide text-muted uppercase">👤 Konto</h2>
      <section className="card mt-3 flex items-center gap-3">
        <p className="min-w-0 flex-1 font-bold">Angemeldet als {user.name}</p>
        <form action={logout}>
          <button className="btn-secondary px-4 py-1.5 text-sm">Abmelden</button>
        </form>
      </section>
    </>
  );
}
