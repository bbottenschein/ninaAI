import "server-only";
import * as webpush from "web-push";
import { vapidConfig } from "@/lib/env.server";
import { createAdminClient } from "@/lib/supabase/admin";

export type PushPayload = { title: string; body: string; url?: string; tag?: string };

/** Push-Arten, die man in den Einstellungen einzeln abschalten kann (Spalten in user_settings). */
export type PushKind = "love_notes" | "learning" | "reminders" | "rewards";

let configured = false;
function setup(): boolean {
  const config = vapidConfig();
  if (!config) return false;
  if (!configured) {
    webpush.setVapidDetails(config.subject, config.publicKey, config.privateKey);
    configured = true;
  }
  return true;
}

/**
 * Schickt einen Push an alle Geräte der genannten Nutzer. Abgelaufene Geräte
 * (404/410) werden entfernt. Liefert die Anzahl erfolgreich zugestellter Pushes.
 */
export async function sendPush(userIds: string[], payload: PushPayload, kind?: PushKind): Promise<number> {
  if (kind) userIds = await wantsPush(userIds, kind);
  if (userIds.length === 0) return 0;
  if (!setup()) {
    console.warn("[push] VAPID-Schlüssel fehlen – Push übersprungen:", payload.title);
    return 0;
  }

  const admin = createAdminClient();
  const { data: subs, error } = await admin
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .in("user_id", userIds);
  if (error) throw error;

  let sent = 0;
  await Promise.all(
    (subs ?? []).map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          JSON.stringify(payload),
          { TTL: 60 * 60 * 6 },
        );
        sent++;
      } catch (e) {
        if (e instanceof webpush.WebPushError && (e.statusCode === 404 || e.statusCode === 410)) {
          await admin.from("push_subscriptions").delete().eq("id", s.id);
        } else {
          console.error("[push] Versand fehlgeschlagen", e);
        }
      }
    }),
  );
  return sent;
}

/** Nur die Nutzer, die diese Push-Art nicht ausgeschaltet haben (ohne Eintrag: an). */
async function wantsPush(userIds: string[], kind: PushKind): Promise<string[]> {
  if (userIds.length === 0) return [];
  const column = `push_${kind}`;
  const { data, error } = await createAdminClient().from("user_settings").select(`user_id, ${column}`).in("user_id", userIds);
  if (error) throw error;
  const off = new Set(
    ((data ?? []) as unknown as Record<string, unknown>[]).filter((r) => r[column] === false).map((r) => r.user_id as string),
  );
  return userIds.filter((id) => !off.has(id));
}

/** Ids aller Admins (Benedikt). */
export async function adminIds(): Promise<string[]> {
  const { data } = await createAdminClient().from("profiles").select("id").eq("role", "admin");
  return (data ?? []).map((p) => p.id as string);
}

/**
 * Merkt sich eine Benachrichtigung und liefert true nur beim ersten Mal –
 * so geht jede Erinnerung bzw. jeder Gutschein-Hinweis höchstens einmal raus.
 */
export async function claimNotification(userId: string, kind: string, ref: string): Promise<boolean> {
  const { data, error } = await createAdminClient()
    .from("notification_log")
    .upsert({ user_id: userId, kind, ref }, { onConflict: "user_id,kind,ref", ignoreDuplicates: true })
    .select("user_id");
  if (error) throw error;
  return (data ?? []).length > 0;
}
