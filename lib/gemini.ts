import { GoogleGenAI } from "@google/genai";

export const GEMINI_MODEL = "gemini-2.5-flash";

let cached: GoogleGenAI | null = null;

export function getGemini(): GoogleGenAI {
  if (cached) return cached;
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_AI_API_KEY is not set");
  cached = new GoogleGenAI({ apiKey });
  return cached;
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
