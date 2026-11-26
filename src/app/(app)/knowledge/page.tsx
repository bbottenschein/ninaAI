import type { Metadata } from "next";
import { getCurrentUser } from "@/features/auth/session";
import { createClient } from "@/lib/supabase/server";
import { KnowledgeScreen, type Nugget } from "@/features/knowledge/knowledge-screen";

export const metadata: Metadata = { title: "Knowledge" };

export default async function KnowledgePage() {
  const user = await getCurrentUser();
  const supabase = await createClient();
  const { data } = await supabase
    .from("knowledge_nuggets")
    .select("id, name, nugget, created_at, source_date")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  return <KnowledgeScreen nuggets={(data ?? []) as Nugget[]} />;
}
