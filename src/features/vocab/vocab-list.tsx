import { createClient } from "@/lib/supabase/server";
import { ComingSoon, PageHeader } from "@/features/shell/page-header";

export async function VocabList({ userId }: { userId: string }) {
  const supabase = await createClient();
  const { data: words } = await supabase
    .from("vocab")
    .select("id, word_en, translation_de, learned")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <>
      <PageHeader title="Vokabeln" subtitle={`${words?.length ?? 0} Wörter`} />
      {words && words.length > 0 ? (
        <ul className="card mb-6 divide-y divide-border p-0">
          {words.map((w) => (
            <li key={w.id} className="flex items-center justify-between px-5 py-3">
              <span className="font-medium">{w.word_en}</span>
              <span className="text-sm text-muted">
                {w.translation_de}
                {w.learned && " ✓"}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mb-6 text-muted">
          Noch keine Wörter. Neue Vokabeln aus den News landen automatisch hier.
        </p>
      )}
      <ComingSoon phase={5}>Vokabel-Quiz, Suche und Filter</ComingSoon>
    </>
  );
}
