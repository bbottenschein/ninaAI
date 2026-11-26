"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/** „Dein Joker hat … gerettet“ gesehen. */
export async function dismissJokerNotice() {
  const supabase = await createClient();
  await supabase.rpc("dismiss_joker_notice");
  revalidatePath("/", "layout");
}
