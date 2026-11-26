import { berlinDate } from "@/lib/date";
import { sniffAudioExtension } from "@/lib/audio-format";
import { TranscriptionError, transcribe } from "@/lib/openai";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { MAX_RECORDING_SECONDS, VOICE_LIMIT_SECONDS } from "@/features/tutor/logic";

const MAX_BYTES = 5 * 1024 * 1024;

/**
 * Nimmt eine Sprachaufnahme der Spielerin entgegen, bucht die Sekunden aufs
 * Tageslimit und liefert den erkannten Text.
 * Antworten: 200 {text} · 401 · 413 · 429 {error:"limit"} · 503 {error:"unavailable", detail}
 * `detail` nennt die Ursache, damit sie in der App sichtbar ist (private App).
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
    return Response.json(
      { error: "unavailable", detail: `Sprachlimit nicht buchbar: ${bookError.message}`.slice(0, 200) },
      { status: 503 },
    );
  }
  if (!booked) return Response.json({ error: "limit" }, { status: 429 });

  // Endung nach dem echten Inhalt (iPhone: mp4, auch wenn der Typ fehlt oder abweicht).
  const head = new Uint8Array(await audio.slice(0, 16).arrayBuffer());
  const filename = `answer.${sniffAudioExtension(head, audio.type)}`;
  try {
    const text = await transcribe(audio, filename);
    return Response.json({ text });
  } catch (error) {
    console.error("[tutor] Transkription", filename, audio.type, audio.size, error);
    const detail = error instanceof TranscriptionError ? error.reason : "Unerwarteter Fehler";
    return Response.json({ error: "unavailable", detail }, { status: 503 });
  }
}
