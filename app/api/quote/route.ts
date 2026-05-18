import { type NextRequest, NextResponse } from "next/server";
import { serverGetQuote } from "@/lib/server-data";

export async function GET(req: NextRequest) {
  const ticker = req.nextUrl.searchParams.get("ticker")?.toUpperCase();
  if (!ticker) {
    return NextResponse.json({ error: "ticker query param required" }, { status: 400 });
  }
  const data = await serverGetQuote(ticker);
  return NextResponse.json(data);
}
