import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { addDays, berlinDate } from "@/lib/date";
import { getCurrentUser } from "@/features/auth/session";
import { isEditable, writableDates } from "@/features/journal/logic";
import { loadEntries, loadEntriesSince, loadFeedbackEnabled } from "@/features/journal/queries";
import { JournalScreen } from "@/features/journal/journal-screen";

export const metadata: Metadata = { title: "Journal" };

export default async function JournalPage() {
  const user = await getCurrentUser();
  // Streng privat – der Admin hat hier keinen Zugang.
  if (user.role !== "player") redirect("/");

  const now = new Date();
  const dates = writableDates(now);
  const today = berlinDate(now);
  // Laufendes und vergangenes Jahr für Woche / Monat / Jahr.
  const since = `${Number(today.slice(0, 4)) - 1}-01-01`;
  const [entries, history, feedbackEnabled] = await Promise.all([
    loadEntries(dates),
    loadEntriesSince(since < addDays(today, -400) ? since : addDays(today, -400)),
    loadFeedbackEnabled(user.id),
  ]);

  return (
    <JournalScreen
      today={today}
      dates={dates}
      entries={entries}
      editableDates={dates.filter((d) => isEditable(d, now))}
      history={history}
      feedbackEnabled={feedbackEnabled}
    />
  );
}
