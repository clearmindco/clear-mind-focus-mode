import { NextResponse } from "next/server";
import { serverGetQuote, serverGetCandles } from "@/lib/server-data";
import { calcSMA, calcRSI, calcATR, calcEquilibrium } from "@/lib/ict-analysis";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = (searchParams.get("symbol") ?? "SPY").trim().toUpperCase().slice(0, 8);

  const toTs = Math.floor(Date.now() / 1000);
  const fromTs = toTs - 60 * 86400;

  const [quote, candles] = await Promise.all([
    serverGetQuote(symbol),
    serverGetCandles(symbol, "D", fromTs, toTs),
  ]);

  if (quote.isPlaceholder || !candles.length) {
    return NextResponse.json({
      symbol, isPlaceholder: true,
      message: "No data — configure FINNHUB_API_KEY",
    });
  }

  const currentPrice = quote.price ?? candles[candles.length - 1].close;
  const sma20 = candles.length >= 20 ? calcSMA(candles, 20) : null;
  const sma50 = candles.length >= 50 ? calcSMA(candles, 50) : null;
  const rsi14 = candles.length >= 15 ? calcRSI(candles, 14) : null;
  const atr = calcATR(candles, 14);
  const eq = calcEquilibrium(candles, currentPrice, 50);

  const fairValues = {
    sma20: sma20 ? Math.round(sma20 * 100) / 100 : null,
    sma50: sma50 ? Math.round(sma50 * 100) / 100 : null,
    equilibrium: Math.round(eq.equilibrium * 100) / 100,
  };

  // Consensus fair value: average of available estimates
  const fvList = [sma20, sma50, eq.equilibrium].filter(v => v != null) as number[];
  const consensusFV = fvList.length ? Math.round((fvList.reduce((a, b) => a + b, 0) / fvList.length) * 100) / 100 : null;
  const edgePct = consensusFV && currentPrice ? ((consensusFV - currentPrice) / currentPrice) * 100 : null;

  return NextResponse.json({
    symbol,
    currentPrice,
    fairValues,
    consensusFairValue: consensusFV,
    edgePercent: edgePct ? Math.round(edgePct * 10) / 10 : null,
    rsi: rsi14,
    atr: Math.round(atr * 100) / 100,
    equilbrium: eq,
    isPlaceholder: false,
  });
}
