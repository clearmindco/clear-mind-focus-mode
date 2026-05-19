/**
 * /api/status
 *
 * Returns connection status booleans for all configured APIs.
 * Never exposes key values — only reports whether a real key is present.
 */

import { NextResponse } from "next/server";

function isRealKey(val: string | undefined): boolean {
  return !!val && !val.startsWith("your_") && val.length > 10;
}

export async function GET() {
  const status = {
    finnhub: isRealKey(process.env.FINNHUB_API_KEY),
    alphaVantage: isRealKey(process.env.ALPHA_VANTAGE_API_KEY),
    newsApi: isRealKey(process.env.NEWS_API_KEY),
    openAi: isRealKey(process.env.OPENAI_API_KEY),
    supabase:
      isRealKey(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
      isRealKey(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  };

  return NextResponse.json(status);
}
