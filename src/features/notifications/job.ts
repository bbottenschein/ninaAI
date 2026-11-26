import "server-only";
import { berlinHour } from "@/lib/date";
import { claimNotification, sendPush } from "@/lib/push";
import { createAdminClient } from "@/lib/supabase/admin";
import { reminderText, shouldRemind } from "./reminder";

/** 19-Uhr-Erinnerung an die Spielerin, höchstens einmal pro Tag. */
export async function runReminder(today: string, now = new Date()): Promise<{ sent: number; skipped: string }> {
  const hour = berlinHour(now);
  const admin = createAdminClient();
  const [{ data: lesson }, { data: players }] = await Promise.all([
    admin.from("daily_lessons").select("status").eq("date", today).maybeSingle(),
    admin.from("profiles").select("id").eq("role", "player"),
  ]);

  let sent = 0;
  for (const player of players ?? []) {
    const [{ data: progress }, { data: streak }] = await Promise.all([
      admin
        .from("lesson_progress")
        .select("news_read, quiz_done, completed_at")
        .eq("user_id", player.id)
        .eq("date", today)
        .maybeSingle(),
      admin.from("streaks").select("current_streak").eq("user_id", player.id).maybeSingle(),
    ]);

    const remind = shouldRemind({
      hour,
      lessonReady: lesson?.status === "ready",
      dayComplete: Boolean(progress?.completed_at),
    });
    if (!remind) continue;
    if (!(await claimNotification(player.id, "reminder", today))) continue;

    const text = reminderText({
      newsRead: (progress?.news_read as number[] | undefined)?.length ?? 0,
      quizDone: progress?.quiz_done ?? false,
      streak: streak?.current_streak ?? 0,
    });
    sent += await sendPush([player.id], { ...text, url: "/learn", tag: "reminder" });
  }
  return { sent, skipped: sent === 0 ? `hour=${hour}` : "" };
}
