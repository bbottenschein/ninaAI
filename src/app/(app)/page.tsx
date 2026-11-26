import { after } from "next/server";
import { berlinDate } from "@/lib/date";
import { vapidConfig } from "@/lib/env.server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/features/auth/session";
import { HomeHeader } from "@/features/home/home-view";
import { HomeTodos } from "@/features/home/home-todos";
import { ensureLesson } from "@/features/lesson/ensure";
import { PushSettings } from "@/features/notifications/push-settings";
import { isWeekend, type TodoList } from "@/features/remind/logic";
import { loadHomeTodos } from "@/features/remind/queries";
import { loadToday } from "@/features/today/queries";

// Reicht für den On-Demand-Fallback der Lektion, der nach der Antwort weiterläuft.
export const maxDuration = 300;

export default async function HomePage() {
  const user = await getCurrentUser();
  const date = berlinDate();
  const isPlayer = user.role === "player";

  const [data, todos, lists] = await Promise.all([
    loadToday(date, user),
    isPlayer ? loadHomeTodos(date) : Promise.resolve([]),
    isPlayer
      ? createClient().then(async (s) => ((await s.from("todo_lists").select("id, area, name, sort_order").order("sort_order")).data ?? []) as TodoList[])
      : Promise.resolve([]),
  ]);

  // Fehlt die Lektion noch, wird sie jetzt erzeugt (On-Demand-Fallback).
  if (data.lessonPhase === "start") after(() => ensureLesson(date, "on-demand"));

  return (
    <>
      <HomeHeader date={date} name={user.name} data={data} />
      {isPlayer && <HomeTodos todos={todos} lists={lists} today={date} weekend={isWeekend(date)} />}
      {isPlayer && (
        <PushSettings
          publicKey={vapidConfig()?.publicKey ?? null}
          title="Tägliche Lern-Erinnerung"
          description="Um 19 Uhr, falls die Lektion noch offen ist."
        />
      )}
    </>
  );
}
