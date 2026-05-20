/**
 * /api/ai-war-room
 *
 * POST handler for AI war room trade setup analysis.
 * Uses OpenAI via native fetch — no npm package required.
 * Server-only: OPENAI_API_KEY is never exposed to the client.
 * Output is educational only. Not financial advice.
 */

import { type NextRequest, NextResponse } from "next/server";

interface WarRoomRequest {
  session: string;
  market: string;
  direction: string;
  setupType: string;
  liquidityLocation: string;
  htfTrend: string;
  catalyst: string;
  entry: string;
  stop: string;
  target: string;
  riskPercent: string;
}

interface OpenAIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface OpenAIChoice {
  message: OpenAIMessage;
}

interface OpenAIResponse {
  choices: OpenAIChoice[];
}

const REQUIRED_FIELDS: (keyof WarRoomRequest)[] = [
  "session",
  "market",
  "direction",
  "setupType",
  "liquidityLocation",
  "htfTrend",
  "catalyst",
  "entry",
  "stop",
  "target",
  "riskPercent",
];

function computeRR(entry: string, stop: string, target: string): string {
  const e = parseFloat(entry);
  const s = parseFloat(stop);
  const t = parseFloat(target);
  if (isNaN(e) || isNaN(s) || isNaN(t) || Math.abs(e - s) === 0) {
    return "N/A";
  }
  const rr = Math.abs(t - e) / Math.abs(e - s);
  return rr.toFixed(2);
}

const SYSTEM_PROMPT = `You are an elite institutional trading coach specializing in session-based price action, liquidity theory, and ICT/SMC concepts. You review paper trade setups for educational purposes only.

Grade setups using this exact rubric:
- A+: Perfect institutional confluence — session alignment, liquidity swept, HTF aligned, clean entry structure, excellent R:R (3:1+)
- A: Strong setup with most criteria met, minor reservations, good R:R (2:1+)
- B: Tradeable setup but missing 1–2 key confluences or suboptimal R:R (1.5:1)
- C: Weak setup, multiple concerns, should only be paper traded with extreme caution
- NO TRADE: Do not take — HTF misalignment, poor R:R, chasing price, no clear liquidity target, or dangerous conditions

Respond ONLY with a JSON object matching this exact structure:
{
  "grade": "<A+ | A | B | C | NO TRADE>",
  "gradeReasoning": "<1-2 sentences explaining the grade>",
  "confluenceAnalysis": "<paragraph: analyze each confluence factor: session timing, liquidity location, HTF trend alignment, setup quality>",
  "riskAssessment": "<paragraph: R:R ratio, stop quality, position risk commentary>",
  "whatCouldGoWrong": "<paragraph: specific risks and failure scenarios for this exact setup>",
  "finalDecision": "<'Recommended for paper trading' | 'Paper trade with reduced size' | 'Skip this setup' | 'Do not trade'>",
  "disclaimer": "Educational analysis only. Not financial advice. Not a recommendation to buy or sell any security. Paper trade first."
}

NEVER recommend buying or selling real securities. NEVER claim any setup will be profitable. ALWAYS frame everything as educational only.`;

export async function POST(request: NextRequest) {
  const key = process.env.OPENAI_API_KEY;
  if (!key || key.startsWith("your_") || key.length <= 10) {
    return NextResponse.json(
      { error: "OpenAI not configured on this server" },
      { status: 503 }
    );
  }

  const body = (await request.json()) as WarRoomRequest;

  const hasAllFields = REQUIRED_FIELDS.every(
    (field) => typeof body[field] === "string" && body[field].trim() !== ""
  );
  if (!hasAllFields) {
    return NextResponse.json({ error: "All fields required" }, { status: 400 });
  }

  const rr = computeRR(body.entry, body.stop, body.target);

  const userMessage = `Session: ${body.session}
Market: ${body.market}
Direction: ${body.direction}
Setup Type: ${body.setupType}
Liquidity Location: ${body.liquidityLocation}
HTF Trend: ${body.htfTrend}
Catalyst: ${body.catalyst}
Entry: $${body.entry}
Stop Loss: $${body.stop}
Target: $${body.target}
Risk %: ${body.riskPercent}%

Calculated R:R: ${rr}

Please analyze this setup and provide your educational grade.`;

  let openAiResponse: Response;
  try {
    openAiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userMessage },
        ],
      }),
    });
  } catch {
    return NextResponse.json(
      { error: "AI analysis failed — try again in a moment" },
      { status: 502 }
    );
  }

  if (!openAiResponse.ok) {
    return NextResponse.json(
      { error: "AI analysis failed — try again in a moment" },
      { status: 502 }
    );
  }

  let parsed: unknown;
  try {
    const data = (await openAiResponse.json()) as OpenAIResponse;
    const content = data.choices[0]?.message?.content ?? "{}";
    parsed = JSON.parse(content);
  } catch {
    return NextResponse.json(
      { error: "AI analysis failed — try again in a moment" },
      { status: 502 }
    );
  }

  return NextResponse.json(parsed, { status: 200 });
}
