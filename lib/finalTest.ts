import type { QuizQuestion } from "./lessons";

export const FINAL_TEST_QUESTIONS: QuizQuestion[] = [
  {
    id: "ft1",
    question: "What does the 1% rule mean in trading?",
    type: "multiple-choice",
    options: [
      "Only buy stocks that have moved more than 1% today",
      "Never risk more than 1% of your total account on a single trade",
      "Your daily profit target should be 1% of your account",
      "Allocate 1% of each trade to commissions"
    ],
    correct: 1,
    explanation: "The 1% rule means you never risk more than 1% of your total account on any single trade. This keeps you in the game even through losing streaks."
  },
  {
    id: "ft2",
    question: "Account: $8,000. Entry: $40. Stop: $38. Risk 1%. How many shares should you buy?",
    type: "scenario",
    options: ["200 shares", "40 shares", "80 shares", "100 shares"],
    correct: 1,
    explanation: "Risk = $8,000 × 1% = $80. Risk per share = $40 - $38 = $2. Shares = $80 ÷ $2 = 40 shares."
  },
  {
    id: "ft3",
    question: "A green candlestick with a very long upper wick and a small body at the bottom signals:",
    type: "multiple-choice",
    options: [
      "Strong bullish momentum — buyers overwhelmed sellers",
      "Selling pressure — buyers pushed price up but sellers rejected it and closed near the open",
      "Indecision — neither side won the session",
      "A breakout above resistance"
    ],
    correct: 1,
    explanation: "A long upper wick means buyers pushed price high during the candle, but sellers overwhelmed them and drove it back down near the open. This is a rejection signal — bearish despite the green body."
  },
  {
    id: "ft4",
    question: "True or False: You should move your stop loss wider if a trade goes against you.",
    type: "true-false",
    options: ["True", "False"],
    correct: 1,
    explanation: "False. Moving your stop wider when a trade goes against you turns controlled losses into catastrophic ones. Your stop was placed where the trade idea becomes invalid — respect it."
  },
  {
    id: "ft5",
    question: "What is theta in options trading?",
    type: "multiple-choice",
    options: [
      "The sensitivity of option price to stock price movement",
      "The daily loss of option value due to time passing",
      "The implied volatility of the option",
      "The intrinsic value of the option at expiration"
    ],
    correct: 1,
    explanation: "Theta is time decay — the amount of value an option loses every single day due to time passing. This is why weekly options are so dangerous for buyers."
  },
  {
    id: "ft6",
    question: "TLT is falling sharply today. What is the most likely implication for QQQ (tech ETF)?",
    type: "multiple-choice",
    options: [
      "QQQ will likely rise — bonds and tech move together",
      "QQQ will likely fall — rising rates pressure growth/tech stocks",
      "No relationship exists between TLT and QQQ",
      "QQQ will spike on the news"
    ],
    correct: 1,
    explanation: "TLT falling = interest rates rising. Rising rates increase the discount rate for future earnings, which hurts high-multiple tech stocks most. QQQ and TLT tend to move in the same direction."
  },
  {
    id: "ft7",
    question: "You buy AAPL at $185. Stop: $181. Target 1: $193. Target 2: $200. What is the R:R to Target 1?",
    type: "scenario",
    options: ["1:1", "1:2", "1:3", "2:1"],
    correct: 1,
    explanation: "Risk = $185 - $181 = $4. Reward to T1 = $193 - $185 = $8. R:R = 4:8 = 1:2."
  },
  {
    id: "ft8",
    question: "What is a 'failed breakout' and why can it be a trade setup?",
    type: "multiple-choice",
    options: [
      "A breakout that continues for more than 3 days — the setup exhausts itself",
      "When price breaks above resistance then reverses below it, trapping buyers who are forced to sell",
      "A technical term for a gap-and-go that fills the gap",
      "When a breakout stock fails to reach its measured target"
    ],
    correct: 1,
    explanation: "A failed breakout traps buyers above resistance. When price reverses, those trapped buyers must sell to cut losses, accelerating downward momentum. This creates a high-probability short setup."
  },
  {
    id: "ft9",
    question: "What is IV crush in options?",
    type: "multiple-choice",
    options: [
      "When delta approaches 1.0 for deep in-the-money options",
      "The sharp drop in implied volatility after a major event (like earnings), which deflates option premiums",
      "When an option's premium is crushed below intrinsic value",
      "The loss of time value in the final week before expiration"
    ],
    correct: 1,
    explanation: "IV crush is the collapse of implied volatility after an anticipated event resolves. High IV before earnings inflates option premiums. After the report, uncertainty vanishes and IV drops sharply — often making options worth less even if the stock moved in your direction."
  },
  {
    id: "ft10",
    question: "What is revenge trading?",
    type: "multiple-choice",
    options: [
      "Re-entering a trade in the same stock that stopped you out",
      "Taking impulsive, oversized trades immediately after a loss to recover quickly",
      "Trading against the institutional players who moved the market against you",
      "A strategy of averaging down on losing positions"
    ],
    correct: 1,
    explanation: "Revenge trading is the emotional impulse to trade bigger or faster after a loss to 'get back' the money. It overrides rational analysis and is one of the fastest ways to compound losses."
  },
  {
    id: "ft11",
    question: "In a bull flag pattern, what are the two components?",
    type: "multiple-choice",
    options: [
      "A downtrend and a reversal candle",
      "The pole (sharp upward move) and the flag (brief tight pullback), followed by continuation",
      "A breakout and a retest of the breakout level",
      "Two higher highs and two higher lows"
    ],
    correct: 1,
    explanation: "A bull flag has a pole (the strong initial move) and a flag (a brief, tight consolidation that drifts slightly lower). The breakout above the flag top signals continuation of the original move."
  },
  {
    id: "ft12",
    question: "True or False: Trading WITH the trend increases your probability of success.",
    type: "true-false",
    options: ["True", "False"],
    correct: 0,
    explanation: "True. 'The trend is your friend' is one of the most reliable rules in trading. Buying in uptrends and selling/shorting in downtrends dramatically increases setup reliability versus counter-trend trading."
  },
  {
    id: "ft13",
    question: "What does VWAP tell you about a stock's trading session?",
    type: "multiple-choice",
    options: [
      "The highest price the stock traded at today",
      "The average price weighted by volume — shows whether buyers or sellers are in control",
      "The volume traded compared to its 30-day average",
      "The price at which institutional orders were filled"
    ],
    correct: 1,
    explanation: "VWAP is the volume-weighted average price for the session. Price above VWAP = buyers in control, bullish bias. Price below VWAP = sellers in control, bearish bias. It's the most important intraday indicator."
  },
  {
    id: "ft14",
    question: "You hit Target 1 on a trade. What should you immediately do to the remaining position?",
    type: "multiple-choice",
    options: [
      "Exit the entire position — don't get greedy",
      "Hold without changing anything and let it run to Target 2",
      "Move your stop loss to your breakeven entry price",
      "Add more shares — the trade is working"
    ],
    correct: 2,
    explanation: "After hitting T1, move your stop to breakeven. This guarantees zero loss on the remaining shares regardless of what happens. You're now playing with 'house money' on the runner."
  },
  {
    id: "ft15",
    question: "A call option has a delta of 0.40 and NVDA rises $5. How much does the option price approximately change?",
    type: "scenario",
    options: ["$0.40", "$2.00", "$5.00", "$0.08"],
    correct: 1,
    explanation: "Delta 0.40 × $5 stock move = $2.00 change in option price. Delta tells you the option's price sensitivity to the underlying stock's movement."
  },
  {
    id: "ft16",
    question: "Which of the following is NOT a reason why beginners lose money in trading?",
    type: "multiple-choice",
    options: [
      "Letting losses run without stop losses",
      "Taking profits too early due to fear",
      "Having a written trade plan before every entry",
      "Revenge trading after losses"
    ],
    correct: 2,
    explanation: "Having a written plan before every entry is a GOOD habit — it's what professionals do. All the others (no stops, cutting winners early, revenge trading) are behavioral mistakes that drain accounts."
  },
  {
    id: "ft17",
    question: "What is the bid-ask spread and why does it matter?",
    type: "multiple-choice",
    options: [
      "The difference between today's open and close — your daily P&L",
      "The gap between the highest buy price and lowest sell price — a cost paid on every trade",
      "The commission charged by your broker on each trade",
      "The difference between your entry and your stop loss"
    ],
    correct: 1,
    explanation: "The bid-ask spread is the difference between what buyers will pay (bid) and what sellers will accept (ask). When you buy, you pay the ask. When you sell, you get the bid. This spread is an instant cost on every trade."
  },
  {
    id: "ft18",
    question: "True or False: Paper trading is optional — real learning only happens with real money.",
    type: "true-false",
    options: ["True", "False"],
    correct: 1,
    explanation: "False. Paper trading is essential for building disciplined habits without financial risk. The habits you build in paper trading are exactly what you bring to live trading. Skipping it is skipping the foundation."
  },
  {
    id: "ft19",
    question: "What does 'role reversal' mean in technical analysis?",
    type: "multiple-choice",
    options: [
      "When a bullish chart pattern reverses to bearish",
      "When a broken support level becomes new resistance (and vice versa)",
      "When a downtrending stock reverses to an uptrend",
      "When volume reverses from high to low on a breakout"
    ],
    correct: 1,
    explanation: "Role reversal: once support is broken, it often becomes resistance on retests from below. Once resistance is broken, it often becomes support. This is one of the most reliable patterns in technical analysis."
  },
  {
    id: "ft20",
    question: "You're about to enter a trade but haven't written your thesis or set your stop yet. What should you do?",
    type: "multiple-choice",
    options: [
      "Enter quickly before the move is gone, then set the stop",
      "Write your thesis, define your stop, calculate your position size — then enter",
      "Skip the thesis if the chart setup is obvious",
      "Enter half the position now, add the rest after confirming direction"
    ],
    correct: 1,
    explanation: "Always complete your full pre-trade plan before entry. Write the thesis, set the stop, calculate position size. Entering without these steps means you're trading emotionally, not systematically."
  },
  {
    id: "ft21",
    question: "CPI comes in significantly higher than expected. What is the most likely market reaction?",
    type: "scenario",
    options: [
      "Stocks rally — strong inflation means a strong economy",
      "Stocks sell off — hot inflation means the Fed may raise rates",
      "No reaction — CPI is a lagging indicator",
      "Only bond markets react to CPI data"
    ],
    correct: 1,
    explanation: "Hot CPI = inflation above expectations = Fed may need to raise rates further. Rising rate expectations hurt stock valuations, especially high-growth tech. Markets often sell off sharply on hot CPI prints."
  },
  {
    id: "ft22",
    question: "Why are weekly options particularly dangerous for beginners?",
    type: "multiple-choice",
    options: [
      "They are more expensive than monthly options",
      "Theta decay is fastest in the final days, eroding premium even if the stock moves in your favor",
      "Weekly options are only available to professional traders",
      "They have unlimited risk"
    ],
    correct: 1,
    explanation: "Weekly options expire in 5 days. Theta (time decay) accelerates sharply near expiration. Even a move in your direction can be offset by theta erosion. Weeklies are designed to expire worthless — professional traders sell them, not buy them."
  },
  {
    id: "ft23",
    question: "A stock is making a series of lower highs and lower lows. What is the correct trading bias?",
    type: "multiple-choice",
    options: [
      "Buy aggressively — it's oversold and due for a bounce",
      "Sell rallies (short bias) — the downtrend is your friend",
      "No directional bias — wait for a catalyst",
      "Buy only at major support levels with tight stops"
    ],
    correct: 1,
    explanation: "Lower highs and lower lows define a downtrend. The trend-following bias is bearish — sell rallies, not buying dips. Fighting a downtrend is one of the most common beginner mistakes."
  },
  {
    id: "ft24",
    question: "What is a debit spread and what is its main advantage over buying a single option?",
    type: "multiple-choice",
    options: [
      "It allows unlimited upside profit without any cost",
      "It defines both your maximum profit and maximum loss, limiting your risk to what you paid",
      "It eliminates theta decay entirely",
      "It provides better delta exposure than a single long option"
    ],
    correct: 1,
    explanation: "A debit spread (buying one strike, selling another) caps both max profit and max loss. You know exactly what you can lose before entering — your premium paid. This defined risk makes it far safer than naked long options."
  },
  {
    id: "ft25",
    question: "You've completed all 9 modules and are ready to paper trade. What is the MINIMUM recommended approach before live trading?",
    type: "multiple-choice",
    options: [
      "One profitable paper trade is enough to prove the strategy works",
      "Paper trade for one week with any strategy",
      "Complete 30+ paper trades across different conditions, maintaining a journal, with consistent rule-following — then review your win rate by setup type",
      "Pass the final test with 100% and immediately start live trading"
    ],
    correct: 2,
    explanation: "Minimum 30 paper trades across different market conditions, with a full trading journal, consistent rule-following, and a review of your performance by setup type. One week or one test score is not enough — you need actual trade experience with your specific setups."
  }
];
