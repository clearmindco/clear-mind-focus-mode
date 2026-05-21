export interface TermDefinition {
  term: string;
  short: string;       // 1-line plain English
  advanced: string;    // technical definition
  example?: string;
}

export const EDUCATION_TERMS: Record<string, TermDefinition> = {
  vwap: {
    term: "VWAP",
    short: "Average price weighted by volume — institutions use it as a fair value benchmark.",
    advanced: "Volume-Weighted Average Price = Σ(price × volume) / Σvolume, reset at market open. Price above VWAP = bullish bias; below = bearish bias.",
    example: "If price dips to VWAP and bounces with rising volume, institutions may be defending it.",
  },
  fvg: {
    term: "FVG",
    short: "A price gap where trading happened too fast, leaving an unfilled zone that price tends to revisit.",
    advanced: "Fair Value Gap: a 3-candle pattern where candle[1] gaps away from candle[0]'s wick and candle[2]'s wick — creating imbalance between buyers and sellers.",
    example: "Price gaps up through $150–$153 with no wicks filling that zone. That $150–$153 FVG is a likely revisit target.",
  },
  ob: {
    term: "Order Block",
    short: "The last candle before a big move — institutions likely built their position here.",
    advanced: "An Order Block is the final consolidation candle (often the last down-candle before a bullish displacement, or last up-candle before bearish displacement) where institutional orders were placed.",
    example: "Price drops hard from $160 — the last green candle at $158–$160 is the Order Block. If price returns there, it may bounce.",
  },
  bos: {
    term: "BOS",
    short: "Price broke through a previous high or low, confirming the trend is continuing.",
    advanced: "Break of Structure: price closes beyond a prior swing high (bullish BOS) or swing low (bearish BOS), confirming trend continuation. Different from MSS (which signals reversal).",
  },
  mss: {
    term: "MSS",
    short: "A sign the trend may be reversing — price broke structure in the opposite direction.",
    advanced: "Market Structure Shift: in an uptrend, price creates a lower low (or vice versa), suggesting momentum reversal. Often precedes a trend change when confirmed with volume.",
  },
  orb: {
    term: "ORB",
    short: "The price range in the first 15–30 minutes after market open — breakouts from this range are high-probability setups.",
    advanced: "Opening Range Breakout: defines the high and low of the first N minutes (5/15/30m). A close above the ORB high (with volume confirmation) is a long signal; below the ORB low is short.",
    example: "SPY opens at 9:30. By 9:45 (15m ORB), the range is $523–$525. A breakout above $525 on volume is a potential long entry.",
  },
  liquidity_sweep: {
    term: "Liquidity Sweep",
    short: "Price briefly spikes past a key level to trigger stop-losses, then snaps back — a reversal signal.",
    advanced: "Institutions hunt stop orders clustered at equal highs/lows. A sweep wicks through the level and closes back inside — signaling the move was manufactured to grab liquidity, not a genuine breakout.",
    example: "Prior high at $520. Price wicks to $520.50 (triggering long stops), then reverses hard. That's a sweep.",
  },
  rr: {
    term: "R:R",
    short: "How much you can make vs. how much you risk. 2:1 means risking $1 to potentially gain $2.",
    advanced: "Risk-to-Reward ratio = (Target - Entry) / (Entry - Stop). Most institutional setups require minimum 2:1 R:R. A 2:1 ratio means you only need to be right 34% of the time to break even.",
  },
  atr: {
    term: "ATR",
    short: "Average daily price movement — tells you how volatile the stock is.",
    advanced: "Average True Range (14 periods): measures average daily price range including gaps. Used for stop placement (e.g., 1×ATR stop), position sizing, and volatility filters.",
  },
  relative_volume: {
    term: "Relative Volume",
    short: "Today's volume compared to the average — high relative volume means unusual interest.",
    advanced: "relVol = today's volume / 20-day average volume. relVol > 1.5 = above-average activity. relVol > 2.0 = significant institutional involvement or catalyst.",
  },
  rsi: {
    term: "RSI",
    short: "Momentum indicator from 0–100. Above 70 = overbought (possibly overextended). Below 30 = oversold (possibly cheap).",
    advanced: "Relative Strength Index (14 periods). Measures speed/magnitude of price changes. RSI divergence (price makes new high but RSI doesn't) is a reversal warning.",
  },
  sma20: {
    term: "SMA20",
    short: "The 20-day average price — a widely-watched level used as near-term support/resistance.",
    advanced: "Simple Moving Average (20 days). In uptrends, price tends to bounce from SMA20. Crosses above = bullish; crosses below = bearish. Used as a fair value proxy in the Edge Scanner.",
  },
  ict: {
    term: "ICT",
    short: "A methodology focused on how institutions (banks, hedge funds) move price — using their footprints to find high-probability entries.",
    advanced: "Inner Circle Trader: framework analyzing smart money concepts — Order Blocks, Fair Value Gaps, liquidity hunts, optimal trade entries, and session-based timing. Not an indicator-based system.",
  },
  confluence: {
    term: "Confluence",
    short: "Multiple signals pointing the same direction — increases trade confidence.",
    advanced: "When independent factors (VWAP, Order Block, FVG, session time, volume) all align on the same setup, the probability of follow-through increases. Requires at least 3 independent confluences for institutional-grade setups.",
  },
  session: {
    term: "Session",
    short: "Different trading periods (London, NY, Asia) have distinct characteristics and volume profiles.",
    advanced: "Market sessions: Asian (quiet, range-bound) / London (volatility injection, trend initiation) / NY Open (highest volume, ORB setups) / Overlap (London+NY, strongest moves) / NY Close (position squaring). Each session has different institutional participants.",
  },
};
