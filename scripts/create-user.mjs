#!/usr/bin/env node
// Legt ein Konto für NinAI an (Spielerin oder Admin).
//
//   node --env-file=.env.local scripts/create-user.mjs \
//     --email nina@example.com --password '...' --name Nina --role player
//
// Braucht NEXT_PUBLIC_SUPABASE_URL und SUPABASE_SECRET_KEY (nur lokal/serverseitig!).
// Die Rolle wird in app_metadata gesetzt; ein DB-Trigger legt daraus Profil
// (und für die Spielerin die Streak) an.
import { parseArgs } from "node:util";
import { createClient } from "@supabase/supabase-js";

const { values } = parseArgs({
  options: {
    email: { type: "string" },
    password: { type: "string" },
    name: { type: "string" },
    role: { type: "string", default: "player" },
  },
});

const { email, password, name, role } = values;
if (!email || !password || !name || !["player", "admin"].includes(role)) {
  console.error(
    "Aufruf: create-user.mjs --email <mail> --password <pw> --name <Name> --role player|admin",
  );
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY;
if (!url || !secret) {
  console.error("NEXT_PUBLIC_SUPABASE_URL und SUPABASE_SECRET_KEY müssen gesetzt sein.");
  process.exit(1);
}

const supabase = createClient(url, secret, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data, error } = await supabase.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
  user_metadata: { name },
  app_metadata: { role },
});

if (error) {
  console.error("Fehler:", error.message);
  process.exit(1);
}

console.log(`Konto angelegt: ${data.user.email} (${role}), id ${data.user.id}`);
