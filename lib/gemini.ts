import { GoogleGenAI, type GenerateContentParameters } from "@google/genai";

export const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_FALLBACK_MODEL = "gemini-2.0-flash";

interface KeyState {
  client: GoogleGenAI;
  flashRateLimitedUntil: number;
}

let keyStates: KeyState[] | null = null;
let rrIndex = 0;

function getKeyStates(): KeyState[] {
  if (keyStates) return keyStates;
  const keys = [
    process.env.GOOGLE_AI_API_KEY,
    process.env.GOOGLE_AI_API_KEY_2,
    process.env.GOOGLE_AI_API_KEY_3,
  ].filter((k): k is string => Boolean(k));
  if (keys.length === 0) throw new Error("No GOOGLE_AI_API_KEY configured");
  keyStates = keys.map((apiKey) => ({
    client: new GoogleGenAI({ apiKey }),
    flashRateLimitedUntil: 0,
  }));
  return keyStates;
}

// Round-robins across all configured keys so every route shares the quota pool.
export function getGemini(): GoogleGenAI {
  const states = getKeyStates();
  return states[rrIndex++ % states.length]!.client;
}

export function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) {
    try { return JSON.parse(fenced[1].trim()); } catch {}
  }
  const objMatch = text.match(/(\{[\s\S]*\})/);
  if (objMatch?.[1]) {
    try { return JSON.parse(objMatch[1]); } catch {}
  }
  return JSON.parse(text.trim());
}

function isRateLimitError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED");
}

function parseRetryDelayMs(err: unknown): number {
  const msg = err instanceof Error ? err.message : String(err);
  const match = msg.match(/retry[^\d]*(\d+(?:\.\d+)?)\s*s/i);
  return match?.[1] ? Math.ceil(parseFloat(match[1]) + 5) * 1000 : 65_000;
}

/**
 * Tries gemini-2.5-flash on each key in round-robin order, skipping any key
 * that is currently rate-limited. Falls back to gemini-2.0-flash only when
 * all keys are exhausted. Restores 2.5-flash automatically after cooldown.
 */
export async function generateWithFallback(
  params: Omit<GenerateContentParameters, "model">
): Promise<string> {
  const states = getKeyStates();
  const start = rrIndex++ % states.length;

  for (let i = 0; i < states.length; i++) {
    const state = states[(start + i) % states.length]!;
    if (Date.now() < state.flashRateLimitedUntil) continue;

    try {
      const result = await state.client.models.generateContent({ ...params, model: GEMINI_MODEL });
      return result.text ?? "";
    } catch (err) {
      if (isRateLimitError(err)) {
        state.flashRateLimitedUntil = Date.now() + parseRetryDelayMs(err);
        continue;
      }
      throw err;
    }
  }

  // All keys rate-limited on 2.5-flash — fall back to 2.0-flash.
  const state = states[start]!;
  const result = await state.client.models.generateContent({ ...params, model: GEMINI_FALLBACK_MODEL });
  return result.text ?? "";
}
