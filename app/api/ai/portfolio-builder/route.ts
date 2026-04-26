import { NextResponse } from "next/server";
import { CLAUDE_MODEL, extractJson, getAnthropic } from "@/lib/anthropic";
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
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY not configured" },
      { status: 503 }
    );
  }

  const client = getAnthropic();
  const system = `You are a portfolio construction assistant generating educational sample allocations.
Respond ONLY with a single JSON object. No markdown, no prose, no fences. Tickers must be real US-listed instruments.`;

  let resp;
  try {
    resp = await client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1500,
      temperature: 0.4,
      system,
      messages: [{ role: "user", content: buildPrompt(answers) }],
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Anthropic error" },
      { status: 502 }
    );
  }

  const text = resp.content
    .filter((b): b is Extract<typeof b, { type: "text" }> => b.type === "text")
    .map((b) => b.text)
    .join("");

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
