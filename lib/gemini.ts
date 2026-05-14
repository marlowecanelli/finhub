import { GoogleGenAI, type GenerateContentParameters } from "@google/genai";

export const GEMINI_MODEL = "gemini-3.1-flash-lite";

interface KeyState {
  client: GoogleGenAI;
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
  keyStates = keys.map((apiKey) => ({ client: new GoogleGenAI({ apiKey }) }));
  return keyStates;
}

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

export async function generateWithFallback(
  params: Omit<GenerateContentParameters, "model">
): Promise<string> {
  const result = await getGemini().models.generateContent({ ...params, model: GEMINI_MODEL });
  return result.text ?? "";
}
