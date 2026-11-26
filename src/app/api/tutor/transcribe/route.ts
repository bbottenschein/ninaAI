import { berlinDate } from "@/lib/date";
import { TranscriptionUnavailableError, transcribe } from "@/lib/openai";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { MAX_RECORDING_SECONDS, VOICE_LIMIT_SECONDS } from "@/features/tutor/logic";

const MAX_BYTES = 5 * 1024 * 1024;
const EXTENSIONS: Record<string, string> = {
  "audio/webm": "webm",
  "audio/mp4": "mp4",
  "audio/mpeg": "mp3",
  "audio/ogg": "ogg",
  "audio/wav": "wav",
  "audio/x-m4a": "m4a",
};

/**
 * Nimmt eine Sprachaufnahme der Spielerin entgegen, bucht die Sekunden aufs
 * Tageslimit und liefert den erkannten Text.
 * Antworten: 200 {text} · 401 · 413 · 429 {error:"limit"} · 503 {error:"unavailable"}
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const userId = auth?.claims?.sub;
  if (!userId) return Response.json({ error: "unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", userId).maybeSingle();
  if (profile?.role !== "player") return Response.json({ error: "forbidden" }, { status: 403 });

  const form = await request.formData().catch(() => null);
  const audio = form?.get("audio");
  const seconds = Math.min(Number(form?.get("seconds")) || 0, MAX_RECORDING_SECONDS);
  if (!(audio instanceof Blob) || audio.size === 0 || seconds <= 0) {
    return Response.json({ error: "bad-request" }, { status: 400 });
  }
  if (audio.size > MAX_BYTES) return Response.json({ error: "too-large" }, { status: 413 });

  const { data: booked, error: bookError } = await createAdminClient().rpc("consume_voice_seconds", {
    p_user_id: userId,
    p_date: berlinDate(),
    p_seconds: Math.ceil(seconds),
    p_limit_seconds: VOICE_LIMIT_SECONDS,
  });
  if (bookError) {
    console.error("[tutor] Sprachlimit buchen", bookError);
    return Response.json({ error: "unavailable" }, { status: 503 });
  }
  if (!booked) return Response.json({ error: "limit" }, { status: 429 });

  const type = audio.type.split(";")[0];
  try {
    const text = await transcribe(audio, `answer.${EXTENSIONS[type] ?? "webm"}`);
    return Response.json({ text });
  } catch (error) {
    if (!(error instanceof TranscriptionUnavailableError)) console.error("[tutor] Transkription", error);
    return Response.json({ error: "unavailable" }, { status: 503 });
  }
}
