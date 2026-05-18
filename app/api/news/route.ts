import { type NextRequest, NextResponse } from "next/server";
import { serverGetCompanyNews, serverGetMarketNews, serverGetNewsApiArticles } from "@/lib/server-data";

export async function GET(req: NextRequest) {
  const ticker = req.nextUrl.searchParams.get("ticker")?.toUpperCase();
  const query = req.nextUrl.searchParams.get("query");

  if (query) {
    const data = await serverGetNewsApiArticles(query);
    return NextResponse.json(data);
  }
  if (ticker) {
    const data = await serverGetCompanyNews(ticker);
    return NextResponse.json(data);
  }
  const data = await serverGetMarketNews();
  return NextResponse.json(data);
}
