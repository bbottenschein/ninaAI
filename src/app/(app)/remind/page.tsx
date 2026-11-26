import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { berlinDate } from "@/lib/date";
import { vapidConfig } from "@/lib/env.server";
import { PushSettings } from "@/features/notifications/push-settings";
import { getCurrentUser } from "@/features/auth/session";
import { loadRemind } from "@/features/remind/queries";
import { REMIND_AREA_COOKIE, parseAreaFilter } from "@/features/remind/area-cookie";
import { OverviewToggle } from "@/features/remind/overview-toggle";
import { RemindScreen } from "@/features/remind/remind-screen";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Remind me" };

export default async function RemindPage({ searchParams }: PageProps<"/remind">) {
  const user = await getCurrentUser();
  // „Remind me“ ist privat – der Admin hat hier keinen Zugang.
  if (user.role !== "player") redirect("/");

  const today = berlinDate();
  const [data, cookieStore, settings] = await Promise.all([
    loadRemind(today),
    cookies(),
    createClient().then((s) => s.from("user_settings").select("daily_overview").eq("user_id", user.id).maybeSingle()),
  ]);
  const initialArea = parseAreaFilter(cookieStore.get(REMIND_AREA_COOKIE)?.value);
  const { todo } = await searchParams;

  return (
    <>
      <RemindScreen
        {...data}
        today={today}
        initialArea={initialArea}
        focusId={typeof todo === "string" ? todo : undefined}
      />
      <PushSettings
        publicKey={vapidConfig()?.publicKey ?? null}
        title="Erinnerungen aufs Handy"
        description="Push zur eingestellten Zeit. Für Kritisches (Medikamente, Flug) lieber zusätzlich den Handy-Wecker nutzen."
      />
      <OverviewToggle initial={settings.data?.daily_overview ?? false} />
    </>
  );
}
