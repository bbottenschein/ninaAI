import type { Metadata } from "next";
import { getCurrentUser } from "@/features/auth/session";
import { LoveNotesScreen } from "@/features/extras/love-notes-screen";
import { loadLoveNotes, loveNotePartner } from "@/features/extras/queries";

export const metadata: Metadata = { title: "Love Notes" };

export default async function LoveNotesPage() {
  const user = await getCurrentUser();
  const [notes, partner] = await Promise.all([loadLoveNotes(), loveNotePartner(user.role)]);
  return <LoveNotesScreen notes={notes} userId={user.id} partnerName={partner?.name ?? (user.role === "admin" ? "Nina" : "Benedikt")} />;
}
