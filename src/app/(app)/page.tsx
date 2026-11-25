import { berlinDate } from "@/lib/date";
import { getCurrentUser } from "@/features/auth/session";
import { loadToday } from "@/features/today/queries";
import { TodayView } from "@/features/today/today-view";

export default async function TodayPage() {
  const user = await getCurrentUser();
  const date = berlinDate();
  const data = await loadToday(date, user);

  return <TodayView date={date} greetingName={user.name} data={data} />;
}
