import { GoogleGenAI, type GenerateContentParameters } from "@google/genai";

export const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_FALLBACK_MODEL = "gemini-2.0-flash";

let cached: GoogleGenAI | null = null;

export function getGemini(): GoogleGenAI {
  if (cached) return cached;
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_AI_API_KEY is not set");
  cached = new GoogleGenAI({ apiKey });
  return cached;
}

// Tracks when gemini-2.5-flash was rate-limited so we can restore it after cooldown.
let flashRateLimitedUntil = 0;

function isRateLimitError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED");
}

function parseRetryDelayMs(err: unknown): number {
  const msg = err instanceof Error ? err.message : String(err);
  const match = msg.match(/retry[^\d]*(\d+(?:\.\d+)?)\s*s/i);
  // Add a small buffer on top of the server's suggested delay.
  return match?.[1] ? Math.ceil(parseFloat(match[1]) + 5) * 1000 : 65_000;
}

/**
 * Calls generateContent using gemini-2.5-flash. If it hits a rate limit, falls
 * back to gemini-2.0-flash for the duration of the cooldown, then restores
 * gemini-2.5-flash automatically on the next call.
 */
export async function generateWithFallback(
  params: Omit<GenerateContentParameters, "model">
): Promise<string> {
  const now = Date.now();
  const useFlash = now >= flashRateLimitedUntil;
  const model = useFlash ? GEMINI_MODEL : GEMINI_FALLBACK_MODEL;

  try {
    const result = await getGemini().models.generateContent({ ...params, model });
    return result.text ?? "";
  } catch (err) {
    if (isRateLimitError(err) && model === GEMINI_MODEL) {
      // Mark 2.5-flash as rate-limited and retry immediately with fallback.
      flashRateLimitedUntil = Date.now() + parseRetryDelayMs(err);
      const result = await getGemini().models.generateContent({ ...params, model: GEMINI_FALLBACK_MODEL });
      return result.text ?? "";
    }
    throw err;
  }
}

export function extractJson(text: string): unknown {
  // Try fenced code block first
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) {
    try { return JSON.parse(fenced[1].trim()); } catch {}
  }
  // Try to find a JSON object anywhere in the text
  const objMatch = text.match(/(\{[\s\S]*\})/);
  if (objMatch?.[1]) {
    try { return JSON.parse(objMatch[1]); } catch {}
  }
  // Fall back to raw text
  return JSON.parse(text.trim());
}
