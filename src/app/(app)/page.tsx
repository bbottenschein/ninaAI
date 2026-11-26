import { after } from "next/server";
import { berlinDate } from "@/lib/date";
import { vapidConfig } from "@/lib/env.server";
import { PushSettings } from "@/features/notifications/push-settings";
import { getCurrentUser } from "@/features/auth/session";
import { ensureLesson } from "@/features/lesson/ensure";
import { loadToday } from "@/features/today/queries";
import { TodayView } from "@/features/today/today-view";

// Reicht für den On-Demand-Fallback, der nach der Antwort weiterläuft.
export const maxDuration = 300;

export default async function TodayPage() {
  const user = await getCurrentUser();
  const date = berlinDate();
  const data = await loadToday(date, user);

  // On-Demand-Fallback (SPEC › Tagesablauf): Fehlt die Lektion noch (vor 05:00 oder
  // nach einem Fehler), wird sie jetzt erzeugt. Die Seite zeigt solange den Status
  // und lädt sich selbst neu. ensureLesson verhindert doppelte Erzeugung.
  if (data.lessonPhase === "start") {
    after(() => ensureLesson(date, "on-demand"));
  }

  return (
    <>
      <TodayView date={date} greetingName={user.name} data={data} />
      {user.role === "player" && (
        <PushSettings
          publicKey={vapidConfig()?.publicKey ?? null}
          title="Tägliche Erinnerung"
          description="Um 19 Uhr, falls die Lektion noch offen ist."
        />
      )}
    </>
  );
}
