import "server-only";
import { openaiApiKey } from "@/lib/env.server";

/**
 * Spracherkennung über OpenAI. `gpt-transcribe` ist der aktuelle Nachfolger von
 * Whisper (whisper-1 wird am 26.02.2027 abgeschaltet). Über
 * OPENAI_TRANSCRIBE_MODEL lässt sich das Modell ohne Code-Änderung tauschen.
 */
const TRANSCRIBE_MODEL = process.env.OPENAI_TRANSCRIBE_MODEL || "gpt-transcribe";

export class TranscriptionUnavailableError extends Error {}

export async function transcribe(audio: Blob, filename: string): Promise<string> {
  const key = openaiApiKey();
  if (!key) throw new TranscriptionUnavailableError("OPENAI_API_KEY fehlt");

  const form = new FormData();
  form.append("file", audio, filename);
  form.append("model", TRANSCRIBE_MODEL);
  form.append("response_format", "json");

  const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}` },
    body: form,
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`OpenAI-Transkription ${res.status}: ${body.slice(0, 300)}`);
  }
  const data = (await res.json()) as { text?: string };
  return (data.text ?? "").trim();
}
