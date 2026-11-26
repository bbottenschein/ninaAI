import "server-only";
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { jobsSecret } from "@/lib/env.server";
import { createClient } from "@/lib/supabase/server";
import { UNLOCK_MINUTES } from "./pin";

/** Freischalt-Cookie für das Journal (httpOnly, läuft nach 10 Minuten ab). */
const COOKIE = "ninaai_journal_unlock";

export function hashPin(pin: string): string {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(pin, salt, 32).toString("hex")}`;
}

export function verifyPin(pin: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const actual = scryptSync(pin, salt, 32);
  const expected = Buffer.from(hash, "hex");
  return expected.length === actual.length && timingSafeEqual(actual, expected);
}

// Signatur bindet das Cookie an Nutzerin, Ablaufzeit und die aktuelle PIN:
// Nach einer PIN-Änderung sind alte Freischaltungen ungültig.
function sign(userId: string, expires: number, pinHash: string): string {
  return createHmac("sha256", `journal-unlock:${jobsSecret()}`)
    .update(`${userId}|${expires}|${pinHash}`)
    .digest("hex");
}

export async function setUnlocked(userId: string, pinHash: string) {
  const expires = Date.now() + UNLOCK_MINUTES * 60_000;
  (await cookies()).set(COOKIE, `${expires}.${sign(userId, expires, pinHash)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: UNLOCK_MINUTES * 60,
  });
}

export async function clearUnlocked() {
  (await cookies()).delete(COOKIE);
}

export type JournalAccess = { pinSet: boolean; unlocked: boolean; pinHash: string | null };

/** Ob eine PIN gesetzt ist und ob das Journal gerade freigeschaltet ist. */
export async function journalAccess(userId: string): Promise<JournalAccess> {
  const supabase = await createClient();
  const { data } = await supabase.from("user_settings").select("journal_pin_hash").eq("user_id", userId).maybeSingle();
  const pinHash = (data?.journal_pin_hash as string | null) ?? null;
  if (!pinHash) return { pinSet: false, unlocked: true, pinHash: null };

  const raw = (await cookies()).get(COOKIE)?.value ?? "";
  const [expiresText, signature] = raw.split(".");
  const expires = Number(expiresText);
  const valid =
    Number.isFinite(expires) &&
    expires > Date.now() &&
    Boolean(signature) &&
    signature === sign(userId, expires, pinHash);
  return { pinSet: true, unlocked: valid, pinHash };
}
