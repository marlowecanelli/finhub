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
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = fenced?.[1]?.trim() ?? text.trim();
  return JSON.parse(raw);
}
