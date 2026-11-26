import type { Metadata } from "next";
import { after } from "next/server";
import { berlinDate } from "@/lib/date";
import { getCurrentUser } from "@/features/auth/session";
import { ensureLesson } from "@/features/lesson/ensure";
import { loadToday } from "@/features/today/queries";
import { TodayView } from "@/features/today/today-view";

export const metadata: Metadata = { title: "Lektion" };

// Reicht für den On-Demand-Fallback, der nach der Antwort weiterläuft.
export const maxDuration = 300;

export default async function LessonPage() {
  const user = await getCurrentUser();
  const date = berlinDate();
  const data = await loadToday(date, user);

  // On-Demand-Fallback (SPEC › Tagesablauf): Fehlt die Lektion noch (vor 05:00 oder
  // nach einem Fehler), wird sie jetzt erzeugt. ensureLesson verhindert doppelte Erzeugung.
  if (data.lessonPhase === "start") {
    after(() => ensureLesson(date, "on-demand"));
  }

  return <TodayView date={date} data={data} />;
}
