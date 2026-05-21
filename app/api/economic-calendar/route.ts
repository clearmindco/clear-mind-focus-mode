import { NextResponse } from "next/server";
import { serverGetEconomicCalendar } from "@/lib/server-data";

export async function GET() {
  const events = await serverGetEconomicCalendar();
  return NextResponse.json({ events });
}
