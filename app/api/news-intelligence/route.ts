import { NextResponse } from "next/server";
import { serverGetNewsIntelligence } from "@/lib/server-data";

export async function GET() {
  const items = await serverGetNewsIntelligence();
  return NextResponse.json({ items });
}
