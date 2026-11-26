import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Role } from "@/features/auth/session";
import type { LoveNote } from "./love-notes";

export type Compliment = { id: string; text_en: string; created_by: "system" | "admin"; active: boolean; created_at: string };

/** Alle Komplimente für den Admin-Bereich, eigene zuerst. */
export async function loadCompliments(): Promise<Compliment[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("compliments")
    .select("id, text_en, created_by, active, created_at")
    .order("created_by")
    .order("created_at", { ascending: false });
  return (data ?? []) as Compliment[];
}

/** Das andere Konto (Nina ↔ Benedikt). Profile anderer sind per RLS nicht lesbar, daher Admin-Client. */
export async function loveNotePartner(role: Role): Promise<{ id: string; name: string } | null> {
  const { data } = await createAdminClient()
    .from("profiles")
    .select("id, name")
    .neq("role", role)
    .order("created_at")
    .limit(1)
    .maybeSingle();
  return data ? { id: data.id as string, name: data.name as string } : null;
}

/** Alle Love Notes in beide Richtungen, neueste oben (RLS: nur eigene). */
export async function loadLoveNotes(): Promise<LoveNote[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("love_notes")
    .select("id, sender_id, recipient_id, text, created_at, read_at, is_favorite_sender, is_favorite_recipient")
    .order("created_at", { ascending: false })
    .limit(500);
  return (data ?? []) as LoveNote[];
}

/** Gibt es eine ungelesene Love Note für mich? (Punkt am Briefumschlag) */
export async function hasUnreadLoveNote(userId: string): Promise<boolean> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("love_notes")
    .select("id", { count: "exact", head: true })
    .eq("recipient_id", userId)
    .is("read_at", null);
  return (count ?? 0) > 0;
}
