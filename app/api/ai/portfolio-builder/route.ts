import { NextResponse } from "next/server";
import { extractJson, generateWithFallback } from "@/lib/gemini";
import {
  buildPrompt,
  isComplete,
  validateRecommendation,
  type BuilderAnswers,
} from "@/lib/builder";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: Request) {
  let body: { answers?: BuilderAnswers };
  try {
    body = (await req.json()) as { answers?: BuilderAnswers };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const answers = body.answers;
  if (!answers || !isComplete(answers)) {
    return NextResponse.json(
      { error: "Incomplete questionnaire" },
      { status: 400 }
    );
  }
  if (!process.env.GOOGLE_AI_API_KEY) {
    return NextResponse.json(
      { error: "GOOGLE_AI_API_KEY not configured" },
      { status: 503 }
    );
  }

  const system = `You are a portfolio construction assistant generating educational sample allocations.
Respond ONLY with a single JSON object. No markdown, no prose, no fences. Tickers must be real US-listed instruments.`;

  let text: string;
  try {
    text = await generateWithFallback({
      contents: buildPrompt(answers),
      config: { systemInstruction: system, maxOutputTokens: 4096, temperature: 0.4, responseMimeType: "application/json", thinkingConfig: { thinkingBudget: 0 } },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Gemini error" },
      { status: 502 }
    );
  }

  let parsed: unknown;
  try {
    parsed = extractJson(text);
  } catch {
    return NextResponse.json(
      { error: "AI returned malformed JSON" },
      { status: 502 }
    );
  }

  const rec = validateRecommendation(parsed);
  if (!rec) {
    return NextResponse.json(
      { error: "AI response failed validation" },
      { status: 502 }
    );
  }

  return NextResponse.json(rec);
}
