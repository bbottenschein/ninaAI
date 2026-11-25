import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import type { z } from "zod";
import { anthropicApiKey } from "@/lib/env.server";

export const LESSON_MODEL = "claude-opus-5-5";

let client: Anthropic | null = null;
function getClient(): Anthropic {
  client ??= new Anthropic({ apiKey: anthropicApiKey() });
  return client;
}

/**
 * Ein Claude-Aufruf mit Structured Output: Die Antwort wird gegen das
 * Zod-Schema geprüft. Lehnt das Modell ab, springt serverseitig das
 * Ersatzmodell ein (`fallbacks: "default"`).
 */
export async function askStructured<S extends z.ZodType>(options: {
  schema: S;
  system: string;
  prompt: string;
  effort: "low" | "medium" | "high";
  maxTokens: number;
}): Promise<z.infer<S>> {
  const response = await getClient().beta.messages.parse({
    model: LESSON_MODEL,
    max_tokens: options.maxTokens,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: {
      effort: options.effort,
      format: betaZodOutputFormat(options.schema),
    },
    system: options.system,
    messages: [{ role: "user", content: options.prompt }],
  });

  if (response.stop_reason === "refusal") {
    throw new Error(`Claude hat abgelehnt (${response.stop_details?.category ?? "ohne Kategorie"})`);
  }
  if (response.stop_reason === "max_tokens") {
    throw new Error("Claude-Antwort abgeschnitten (max_tokens)");
  }
  if (response.parsed_output == null) {
    throw new Error("Claude-Antwort passt nicht zum Schema");
  }
  return response.parsed_output as z.infer<S>;
}
