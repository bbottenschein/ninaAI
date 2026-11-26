"use server";

import { sendPush } from "@/lib/push";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/features/auth/session";

type SubscriptionJson = { endpoint?: string; keys?: { p256dh?: string; auth?: string } };

/** Speichert das Push-Abo dieses Geräts (ein Eintrag pro Gerät). */
export async function savePushSubscription(sub: SubscriptionJson): Promise<{ error?: string }> {
  const user = await getCurrentUser();
  const endpoint = sub.endpoint ?? "";
  const p256dh = sub.keys?.p256dh ?? "";
  const auth = sub.keys?.auth ?? "";
  if (!endpoint.startsWith("https://") || !p256dh || !auth || endpoint.length > 1000) {
    return { error: "Ungültiges Abo" };
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("push_subscriptions")
    .upsert({ user_id: user.id, endpoint, p256dh, auth }, { onConflict: "endpoint" });
  if (error) {
    console.error("[push] Abo speichern", error);
    return { error: "Konnte nicht gespeichert werden." };
  }
  return {};
}

export async function removePushSubscription(endpoint: string) {
  const user = await getCurrentUser();
  const supabase = await createClient();
  await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint).eq("user_id", user.id);
}

export async function sendTestPush(): Promise<{ sent: number }> {
  const user = await getCurrentUser();
  const sent = await sendPush([user.id], {
    title: "Es klappt! 🐭",
    body: user.role === "admin" ? "Du bekommst Bescheid, wenn Nina Gutscheine verdient oder einlöst." : "Ab jetzt erinnert dich die Maus um 19 Uhr.",
    url: user.role === "admin" ? "/admin" : "/",
    tag: "test",
  });
  return { sent };
}
