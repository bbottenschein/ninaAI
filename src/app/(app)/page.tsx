import { after } from "next/server";
import { berlinDate } from "@/lib/date";
import { vapidConfig } from "@/lib/env.server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/features/auth/session";
import { HomeHeader } from "@/features/home/home-view";
import { HomeTodos } from "@/features/home/home-todos";
import { JournalHomeCard } from "@/features/journal/home-card";
import { journalAccess } from "@/features/journal/lock";
import { showHomeCard } from "@/features/journal/logic";
import { loadEntries } from "@/features/journal/queries";
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

  const [data, todos, lists, journal, access] = await Promise.all([
    loadToday(date, user),
    isPlayer ? loadHomeTodos(date) : Promise.resolve([]),
    isPlayer
      ? createClient().then(async (s) => ((await s.from("todo_lists").select("id, area, name, sort_order").order("sort_order")).data ?? []) as TodoList[])
      : Promise.resolve([]),
    isPlayer ? loadEntries([date]) : Promise.resolve([]),
    isPlayer ? journalAccess(user.id) : Promise.resolve(null),
  ]);
  const journalEntry = journal[0] ?? null;

  // Fehlt die Lektion noch, wird sie jetzt erzeugt (On-Demand-Fallback).
  if (data.lessonPhase === "start") after(() => ensureLesson(date, "on-demand"));

  return (
    <>
      <HomeHeader date={date} name={user.name} data={data} />
      {isPlayer && showHomeCard(new Date(), Boolean(journalEntry)) && <JournalHomeCard entry={journalEntry} hideRating={Boolean(access?.pinSet)} />}
      {isPlayer && <HomeTodos todos={todos} lists={lists} today={date} weekend={isWeekend(date)} />}
      {isPlayer && (
        <PushSettings
          publicKey={vapidConfig()?.publicKey ?? null}
          title="Benachrichtigungen"
          description="Deine Erinnerungen aus Remind me und um 19 Uhr die Lern-Erinnerung."
        />
      )}
    </>
  );
}
