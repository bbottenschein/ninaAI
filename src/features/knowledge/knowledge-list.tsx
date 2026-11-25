import { createClient } from "@/lib/supabase/server";
import { ComingSoon, PageHeader } from "@/features/shell/page-header";

export async function KnowledgeList({ userId }: { userId: string }) {
  const supabase = await createClient();
  const { data: nuggets } = await supabase
    .from("knowledge_nuggets")
    .select("id, name, nugget")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  return (
    <>
      <PageHeader title="Knowledge" subtitle="Deine Notizen zu Personen & Begriffen" />
      {nuggets && nuggets.length > 0 ? (
        <ul className="mb-6 flex flex-col gap-3">
          {nuggets.map((n) => (
            <li key={n.id} className="card">
              <p className="font-semibold">{n.name}</p>
              <p className="text-sm text-muted">{n.nugget}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mb-6 text-muted">Noch keine Knowledge Nuggets.</p>
      )}
      <ComingSoon phase={5}>Anlegen, Bearbeiten, Suche und Schnell-Anlage aus den News</ComingSoon>
    </>
  );
}
