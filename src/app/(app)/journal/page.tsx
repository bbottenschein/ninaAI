import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { berlinDate } from "@/lib/date";
import { getCurrentUser } from "@/features/auth/session";
import { isEditable, writableDates } from "@/features/journal/logic";
import { loadEntries, loadRecentEntries } from "@/features/journal/queries";
import { JournalScreen } from "@/features/journal/journal-screen";

export const metadata: Metadata = { title: "Journal" };

export default async function JournalPage() {
  const user = await getCurrentUser();
  // Streng privat – der Admin hat hier keinen Zugang.
  if (user.role !== "player") redirect("/");

  const now = new Date();
  const dates = writableDates(now);
  const [entries, recent] = await Promise.all([loadEntries(dates), loadRecentEntries()]);

  return (
    <JournalScreen
      today={berlinDate(now)}
      dates={dates}
      entries={entries}
      editableDates={dates.filter((d) => isEditable(d, now))}
      recent={recent}
    />
  );
}
