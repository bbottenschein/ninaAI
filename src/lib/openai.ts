import "server-only";
import { openaiApiKey } from "@/lib/env.server";

/**
 * Spracherkennung über OpenAI. `gpt-transcribe` ist der aktuelle Nachfolger von
 * Whisper. Lehnt OpenAI ein Modell ab (z. B. noch nicht für das Konto freigeschaltet),
 * wird das nächste versucht. OPENAI_TRANSCRIBE_MODEL setzt das bevorzugte Modell.
 */
const MODELS = [
  ...(process.env.OPENAI_TRANSCRIBE_MODEL ? [process.env.OPENAI_TRANSCRIBE_MODEL] : []),
  "gpt-transcribe",
  "gpt-4o-mini-transcribe", // Abschaltung 26.02.2027
  "whisper-1", // Abschaltung 26.02.2027
].filter((m, i, all) => all.indexOf(m) === i);

/** Fehler mit kurzer, anzeigbarer Ursache (für die Diagnose in der App). */
export class TranscriptionError extends Error {
  constructor(
    public readonly reason: string,
    message?: string,
  ) {
    super(message ?? reason);
  }
}

export async function transcribe(audio: Blob, filename: string): Promise<string> {
  const key = openaiApiKey();
  if (!key) throw new TranscriptionError("OPENAI_API_KEY fehlt in Vercel");

  const failures: string[] = [];
  for (const model of MODELS) {
    const form = new FormData();
    form.append("file", audio, filename);
    form.append("model", model);
    form.append("response_format", "json");

    const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}` },
      body: form,
      signal: AbortSignal.timeout(30_000),
    });
    if (res.ok) {
      const data = (await res.json()) as { text?: string };
      return (data.text ?? "").trim();
    }

    const body = await res.text().catch(() => "");
    let detail = body.slice(0, 200);
    try {
      detail = (JSON.parse(body) as { error?: { message?: string } }).error?.message ?? detail;
    } catch {}
    failures.push(`${model}: ${res.status} ${detail}`);

    // Schlüssel, Guthaben oder Limit: ein anderes Modell hilft nicht.
    if (res.status === 401) throw new TranscriptionError("OpenAI-Schlüssel ungültig (401)", failures.join(" | "));
    if (res.status === 429) throw new TranscriptionError("OpenAI-Limit oder kein Guthaben (429)", failures.join(" | "));
  }
  throw new TranscriptionError(`OpenAI lehnt ab: ${failures[0]?.slice(0, 160) ?? "unbekannt"}`, failures.join(" | "));
}
