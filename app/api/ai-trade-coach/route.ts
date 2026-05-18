/**
 * /api/ai-trade-coach
 *
 * POST handler for AI trade thesis review.
 * Uses OpenAI via native fetch — no npm package required.
 * Server-only: OPENAI_API_KEY is never exposed to the client.
 * Output is educational only. Not financial advice.
 */

interface TradeCoachRequest {
  ticker: string;
  thesis: string;
  direction: string;
  setupType: string;
  entry: string;
  stop: string;
  target1: string;
  target2?: string;
  riskNotes?: string;
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

export async function POST(request: Request) {
  const key = process.env.OPENAI_API_KEY;
  if (!key || key.startsWith("your_") || key.length <= 10) {
    return Response.json(
      { error: "OpenAI not configured on this server" },
      { status: 503 }
    );
  }

  const body = (await request.json()) as TradeCoachRequest;

  if (!body.thesis || body.thesis.trim().length < 20) {
    return Response.json(
      { error: "Thesis too short — please write at least 20 characters" },
      { status: 400 }
    );
  }

  const systemPrompt = `You are an educational trading coach for beginner paper traders. You give structured, honest, educational feedback on trade ideas. You NEVER recommend buying or selling real securities. You NEVER claim any trade will be profitable. You ALWAYS recommend paper trading first. You NEVER give financial advice. All output is clearly labeled as educational only.

Respond ONLY with a JSON object matching this exact structure:
{
  "thesisScore": <number 1-10>,
  "clarityFeedback": "<one paragraph: is the thesis clear, specific, and actionable?>",
  "riskFeedback": "<one paragraph: risk/reward assessment, stop placement quality, position discipline>",
  "bullishCase": "<one paragraph: what conditions would make this work>",
  "bearishCase": "<one paragraph: what conditions would make this fail>",
  "questionsToAnswerBeforeTrade": ["<question 1>", "<question 2>", "<question 3>"],
  "finalEducationalDecision": "<one of exactly: 'Needs more research' | 'Paper trade only' | 'Reasonable to watch'>",
  "disclaimer": "Educational feedback only. Not financial advice. Not a recommendation to buy or sell. Paper trade first."
}`;

  const userMessage = `Ticker: ${body.ticker}
Direction: ${body.direction}
Setup type: ${body.setupType}
Entry: $${body.entry}
Stop loss: $${body.stop}
Target 1: $${body.target1}
Target 2: $${body.target2 ?? "not set"}
Risk notes: ${body.riskNotes ?? "none"}

Trade thesis:
${body.thesis}

Please review this trade thesis and provide educational feedback.`;

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
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
      }),
    });
  } catch {
    return Response.json(
      { error: "AI review failed — try again in a moment" },
      { status: 502 }
    );
  }

  if (!openAiResponse.ok) {
    return Response.json(
      { error: "AI review failed — try again in a moment" },
      { status: 502 }
    );
  }

  const data = (await openAiResponse.json()) as OpenAIResponse;
  const content = data.choices[0]?.message?.content ?? "{}";
  const parsed: unknown = JSON.parse(content);

  return Response.json(parsed, { status: 200 });
}
