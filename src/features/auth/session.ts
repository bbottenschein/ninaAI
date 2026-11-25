import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type Role = "player" | "admin";

export type CurrentUser = {
  id: string;
  name: string;
  role: Role;
};

/**
 * Data Access Layer: liest den angemeldeten Nutzer samt Profil.
 * Pro Request nur einmal ausgeführt (React cache).
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser> => {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const userId = auth?.claims?.sub;
  if (!userId) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, name, role")
    .eq("id", userId)
    .single();

  if (!profile) {
    // Konto ohne Profil (sollte durch den DB-Trigger nie passieren).
    redirect("/login?error=profile");
  }

  return { id: profile.id, name: profile.name, role: profile.role as Role };
});

/** Für Seiten, die nur Benedikt sehen darf. */
export async function requireAdmin(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (user.role !== "admin") redirect("/");
  return user;
}
