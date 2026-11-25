import type { Metadata } from "next";
import { getCurrentUser } from "@/features/auth/session";
import { KnowledgeList } from "@/features/knowledge/knowledge-list";

export const metadata: Metadata = { title: "Knowledge" };

export default async function KnowledgePage() {
  const user = await getCurrentUser();
  return <KnowledgeList userId={user.id} />;
}
