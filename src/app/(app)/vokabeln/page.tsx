import type { Metadata } from "next";
import { getCurrentUser } from "@/features/auth/session";
import { VocabList } from "@/features/vocab/vocab-list";

export const metadata: Metadata = { title: "Vokabeln" };

export default async function VocabPage() {
  const user = await getCurrentUser();
  return <VocabList userId={user.id} />;
}
