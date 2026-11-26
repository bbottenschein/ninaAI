import { berlinDate } from "@/lib/date";
import { createClient } from "@/lib/supabase/server";
import { journalToMarkdown } from "@/features/journal/export";
import { journalAccess } from "@/features/journal/lock";
import type { JournalEntry } from "@/features/journal/logic";

/** Export des ganzen Journals als Markdown-Datei (nur für die Besitzerin, ggf. entsperrt). */
export async function GET() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const userId = auth?.claims?.sub;
  if (!userId) return new Response("Nicht angemeldet", { status: 401 });
  if (!(await journalAccess(userId)).unlocked) return new Response("Journal gesperrt", { status: 403 });

  const [{ data: entries }, { data: reviews }] = await Promise.all([
    supabase.from("journal_entries").select("id, date, rating, mood_word, day_text, gratitude, highlight, tomorrow_focus, feedback, created_at, updated_at"),
    supabase.from("journal_reviews").select("month, summary_en"),
  ]);
  const today = berlinDate();
  const body = journalToMarkdown((entries ?? []) as JournalEntry[], reviews ?? [], today);
  return new Response(body, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="ninaai-journal-${today}.md"`,
      "Cache-Control": "private, no-store",
    },
  });
}
