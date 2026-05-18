import { type NextRequest, NextResponse } from "next/server";
import { serverGetCompanyNews, serverGetMarketNews } from "@/lib/server-data";

export async function GET(req: NextRequest) {
  const ticker = req.nextUrl.searchParams.get("ticker")?.toUpperCase();
  const data = ticker
    ? await serverGetCompanyNews(ticker)
    : await serverGetMarketNews();
  return NextResponse.json(data);
}
