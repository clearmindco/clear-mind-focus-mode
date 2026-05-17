export interface QuizQuestion {
  id: string;
  question: string;
  type: "multiple-choice" | "true-false" | "scenario";
  options: string[];
  correct: number;
  explanation: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
}

export interface LessonSection {
  title: string;
  content: string;
}

export interface Lesson {
  id: string;
  moduleId: string;
  moduleNumber: number;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  estimatedMinutes: number;
  sections: LessonSection[];
  analogy: string;
  webullExample: string;
  commonMistakes: string[];
  realTradingMeaning: string;
  checklist: ChecklistItem[];
  quiz: QuizQuestion[];
  passingScore: number;
}

export const LESSONS: Lesson[] = [
  {
    id: "what-is-trading",
    moduleId: "foundations",
    moduleNumber: 1,
    title: "What Is Trading?",
    subtitle: "Stocks, ETFs, markets, and how prices actually move",
    icon: "📈",
    color: "#00d4ff",
    estimatedMinutes: 20,
    sections: [
      {
        title: "What Is a Stock?",
        content: "A stock is a small piece of ownership in a real company. When Apple builds the next iPhone, they need money. So they sell tiny slices of the company to the public — those slices are called shares. When you buy one share of Apple (AAPL), you literally own a tiny fraction of Apple Inc.\n\nThe price of a stock goes up when more people want to buy it than sell it. It goes down when more people want to sell than buy. That's the entire engine of the market."
      },
      {
        title: "What Is an ETF?",
        content: "An ETF (Exchange-Traded Fund) is a basket of stocks you can buy in one trade. Instead of buying 500 individual companies, you can buy SPY — which tracks the S&P 500 and moves with all 500 top US companies at once.\n\nETFs are popular because they spread your risk. If one company crashes, the others cushion the fall. QQQ tracks the Nasdaq 100 (heavy tech). IWM tracks small-cap stocks. TLT tracks long-term US Treasury bonds."
      },
      {
        title: "What Is 'The Market'?",
        content: "When people say 'the market,' they usually mean the US stock market — specifically the S&P 500, which is the 500 largest publicly-traded US companies. The market is open Monday–Friday from 9:30 AM to 4:00 PM Eastern Time.\n\nPre-market trading runs 4:00–9:30 AM ET. After-hours runs 4:00–8:00 PM ET. Price moves in these sessions can be sharp because fewer traders are active — spreads are wider and liquidity is thinner."
      },
      {
        title: "Buyers vs. Sellers",
        content: "Every trade requires two people: a buyer and a seller. If you buy 100 shares of NVDA, someone else is selling you those 100 shares.\n\nThe 'bid' is the highest price a buyer will pay. The 'ask' is the lowest price a seller will accept. The gap between them is the 'spread.' When you click buy, you pay the ask. When you click sell, you get the bid. This spread is a hidden cost every trader pays."
      },
      {
        title: "Why Do Prices Move?",
        content: "Prices move because of imbalance between supply and demand — between buyers and sellers. Anything that makes more people want to buy (good earnings, FDA approval, a government contract) drives the price up. Anything that makes people want to sell (bad news, market fear, rising rates) drives it down.\n\nBig moves often come from catalysts: news, earnings reports, economic data, Fed announcements, or industry events. Understanding what moves a stock is 80% of trading."
      },
      {
        title: "Investing vs. Trading",
        content: "Investing means buying and holding for months or years. You buy because you believe in the long-term growth of a company. Warren Buffett is an investor.\n\nTrading means buying and selling over shorter time frames — days, hours, or even minutes — to profit from price swings. Traders don't care if a company is good long-term. They care where the price is going in the next few hours.\n\nThis course teaches trading — not investing. The skills are different, the mindset is different, and the risks are different."
      }
    ],
    analogy: "Think of the stock market like a giant auction house that's open every weekday. Sellers list items (shares) at a price they'll accept. Buyers bid what they'll pay. When a bid meets an ask, a trade happens. If a famous athlete endorses a sneaker brand, suddenly everyone wants their stock — bids flood in, sellers raise their ask, and the price goes up. Simple supply and demand.",
    webullExample: "Open Webull and search for SPY. The price you see updating every few seconds? That's the last price someone paid for one share of the S&P 500 ETF. The 'bid' and 'ask' numbers just below it? Those are the current buyer/seller prices. The green/red number shows how much it's moved from yesterday's close. Every number tells a story about supply and demand right now.",
    commonMistakes: [
      "Confusing investing with trading — they require completely different approaches and time horizons",
      "Ignoring the bid-ask spread as a real cost, especially on low-volume stocks",
      "Thinking 'the market' is one thing — it's millions of individual stocks, each with its own story",
      "Believing price movement is random — it's driven by real-world events and human psychology"
    ],
    realTradingMeaning: "Before you place a single trade, you need to know: what is this company, why would its stock move today, and who is on the other side of my trade? Every buy has a seller who thinks the price is going down. Someone is always wrong. Your job is to be right more often than wrong, and to lose less when you're wrong.",
    checklist: [
      { id: "c1", text: "I understand that a stock represents ownership in a real company" },
      { id: "c2", text: "I know what an ETF is and can name two examples (SPY, QQQ)" },
      { id: "c3", text: "I understand that prices move because of supply and demand imbalance" },
      { id: "c4", text: "I know the difference between the bid and the ask" },
      { id: "c5", text: "I understand the difference between trading and long-term investing" },
      { id: "c6", text: "I know the US market is open 9:30 AM – 4:00 PM Eastern Time" }
    ],
    quiz: [
      {
        id: "q1",
        question: "What does buying one share of a company actually give you?",
        type: "multiple-choice",
        options: ["A loan to the company", "A small piece of ownership in that company", "Guaranteed dividends every quarter", "The right to vote on every business decision"],
        correct: 1,
        explanation: "A share is literally a fractional ownership stake in the company. You own a tiny piece of its assets, earnings, and future."
      },
      {
        id: "q2",
        question: "SPY is an ETF that tracks the S&P 500. If Apple's stock drops 5% but the other 499 companies are flat, what happens to SPY?",
        type: "multiple-choice",
        options: ["SPY drops 5%", "SPY drops a small fraction (Apple is ~7% of the index)", "SPY is not affected at all", "SPY rises because money moves to other stocks"],
        correct: 1,
        explanation: "ETFs are diversified baskets. Apple is roughly 7% of the S&P 500, so a 5% drop in Apple would drag SPY down only about 0.35%. This is the power of diversification."
      },
      {
        id: "q3",
        question: "You want to buy 100 shares of a stock. The bid is $50.00, the ask is $50.10. What price do you pay?",
        type: "multiple-choice",
        options: ["$50.00 — the bid price", "$50.05 — the midpoint", "$50.10 — the ask price", "Whatever price you enter"],
        correct: 2,
        explanation: "When you place a market buy order, you pay the ask — the lowest price a seller will accept. The spread ($0.10 here) is an instant cost you absorb on every trade."
      },
      {
        id: "q4",
        question: "True or False: A trader and a long-term investor use the same strategy and mindset.",
        type: "true-false",
        options: ["True", "False"],
        correct: 1,
        explanation: "False. Investors buy and hold based on fundamental business quality over years. Traders buy and sell based on price action, momentum, and catalysts over hours or days. Completely different skill sets."
      },
      {
        id: "q5",
        question: "NVDA reports better-than-expected earnings. What most likely happens to the stock?",
        type: "scenario",
        options: ["Price drops because investors take profits", "Price rises because more buyers enter on good news", "Price stays flat because earnings were already expected", "Price drops because the company spent money on R&D"],
        correct: 1,
        explanation: "Positive earnings surprises create demand spikes. More people want to buy the stock on the good news, bids increase, and sellers raise their ask — price moves up."
      },
      {
        id: "q6",
        question: "When does the US stock market officially open for regular trading?",
        type: "multiple-choice",
        options: ["8:00 AM Eastern", "9:00 AM Eastern", "9:30 AM Eastern", "10:00 AM Eastern"],
        correct: 2,
        explanation: "Regular market hours are 9:30 AM to 4:00 PM Eastern. Pre-market starts at 4:00 AM but has much lower volume and wider spreads."
      }
    ],
    passingScore: 80
  },
  {
    id: "reading-charts",
    moduleId: "charts",
    moduleNumber: 2,
    title: "Reading Charts",
    subtitle: "Candles, support, resistance, trends, and volume",
    icon: "🕯️",
    color: "#00d4ff",
    estimatedMinutes: 25,
    sections: [
      {
        title: "What Is a Candlestick?",
        content: "A candlestick shows four pieces of information for a time period: the Open (where price started), the High (highest point reached), the Low (lowest point reached), and the Close (where price ended). Traders call these OHLC.\n\nThe 'body' of the candle is the rectangle between open and close. The thin lines above and below are called 'wicks' or 'shadows' — they show how far price moved before reversing back."
      },
      {
        title: "Green vs. Red Candles",
        content: "A green candle means price closed HIGHER than it opened — buyers won that period. The bottom of the body is the open, the top is the close.\n\nA red candle means price closed LOWER than it opened — sellers won. The top of the body is the open, the bottom is the close.\n\nLong green candles show strong buying pressure. Long red candles show strong selling pressure. Small bodies (called doji) show indecision — neither buyers nor sellers dominate."
      },
      {
        title: "Wicks: The Hidden Story",
        content: "Wicks tell you where price tested and got rejected. A long upper wick means buyers pushed price up, but sellers overwhelmed them and price fell back — a sign of selling pressure. A long lower wick means sellers pushed price down, but buyers stepped in and pushed it back up — a sign of buying interest.\n\nA candle with a very long lower wick and small body is called a 'hammer' — often signals a reversal at a low. These wick patterns are some of the most reliable signals in technical analysis."
      },
      {
        title: "Support and Resistance",
        content: "Support is a price level where buyers historically step in — where price keeps bouncing up. Think of it as a floor. Resistance is where sellers historically appear — a ceiling price keeps bouncing off.\n\nThese levels exist because of human psychology. Traders remember where price reversed before and make decisions based on those memories. When support is broken, it often becomes new resistance. When resistance is broken, it often becomes new support. This is called a 'role reversal.'"
      },
      {
        title: "Trends",
        content: "An uptrend is a series of higher highs and higher lows. Each bounce goes higher than the last. An downtrend is a series of lower highs and lower lows. A sideways trend (consolidation) means price is coiling between support and resistance.\n\nThe most powerful rule in trading: the trend is your friend. Trading with the trend dramatically increases your odds. Fighting the trend is one of the most common ways beginners lose money."
      },
      {
        title: "Breakouts and Fake Breakouts",
        content: "A breakout happens when price moves above a resistance level or below a support level with strong momentum. Breakouts attract buyers (or sellers for breakdowns) because the old ceiling has been removed.\n\nBut fake breakouts (also called 'fakeouts') are extremely common. Price pierces through a level, triggers stop orders, then snaps back. This is why experienced traders often wait for a candle to CLOSE above resistance before entering — not just touch it."
      },
      {
        title: "Volume: The Conviction Meter",
        content: "Volume is the number of shares traded in a period. A price move on high volume has conviction — real buyers or sellers are participating. A move on low volume is suspicious — it can reverse easily.\n\nBreakouts need volume to be valid. If a stock breaks resistance on triple its average volume, that's a real breakout. If it breaks out on 10% of average volume, it's likely a fake. Always check volume before trusting a breakout."
      }
    ],
    analogy: "A candlestick is like a weather report for a stock's day. The body tells you if bulls (buyers) or bears (sellers) won the session. The wicks show the extremes they fought to. Support is like a trampoline — price keeps bouncing off it. Resistance is like a ceiling — price keeps hitting its head. Volume is how loud the crowd is — a move on high volume is a roar, a move on low volume is a whisper.",
    webullExample: "In Webull, tap any stock and select 'Chart.' Switch to a 1-day or 5-minute view. You'll see a series of green and red candles. Find a price level the stock bounced off multiple times — that's support. Find a level it got rejected from multiple times — that's resistance. The volume bars at the bottom show which candles had the most activity. A breakout candle with tall volume bars is worth watching.",
    commonMistakes: [
      "Acting on a breakout the moment price touches resistance — wait for a candle CLOSE above",
      "Ignoring volume entirely — a breakout without volume is a trap",
      "Drawing support/resistance too precisely — they are zones, not exact lines",
      "Fighting the trend by buying into downtrends hoping for a reversal"
    ],
    realTradingMeaning: "Chart reading is your primary skill as a trader. Every entry and exit decision should be based on what the chart is telling you. Support and resistance levels are where you set your stops and targets. Volume tells you if the move is real. Before you buy anything, spend 2 minutes reading the chart — identify the trend, find the key levels, and check the volume.",
    checklist: [
      { id: "c1", text: "I can identify a green vs. red candle and what each means" },
      { id: "c2", text: "I understand what wicks represent and what long wicks signal" },
      { id: "c3", text: "I can identify support and resistance levels on a chart" },
      { id: "c4", text: "I understand the difference between an uptrend, downtrend, and consolidation" },
      { id: "c5", text: "I know what a breakout is and why fake breakouts occur" },
      { id: "c6", text: "I understand that volume confirms whether a move is real or suspect" }
    ],
    quiz: [
      {
        id: "q1",
        question: "A green candlestick means:",
        type: "multiple-choice",
        options: ["The stock went up compared to yesterday", "The closing price was higher than the opening price", "More buyers exist than sellers overall", "The stock will continue higher tomorrow"],
        correct: 1,
        explanation: "A green candle simply means the close was higher than the open for that specific time period. It says nothing about tomorrow — it's one data point."
      },
      {
        id: "q2",
        question: "A stock has a candle with a very long lower wick and a small green body near the top. What does this most likely signal?",
        type: "multiple-choice",
        options: ["Strong selling pressure — the stock is going down", "Buying rejection — buyers tried and failed", "Buying support — sellers pushed price down but buyers reclaimed it", "Indecision — nobody knows what happens next"],
        correct: 2,
        explanation: "A long lower wick means sellers drove price down during that candle, but buyers stepped in aggressively and pushed it back up. This 'hammer' pattern often signals buyer support at that level."
      },
      {
        id: "q3",
        question: "AAPL has bounced off $175 three times in the past two weeks. What is $175?",
        type: "scenario",
        options: ["A resistance level", "A support level", "A breakout level", "A random price level"],
        correct: 1,
        explanation: "A price that has been tested multiple times and held is a support level. Buyers keep stepping in at $175, making it a recognized floor in the market's memory."
      },
      {
        id: "q4",
        question: "True or False: A stock breaking above resistance on very low volume is a strong buy signal.",
        type: "true-false",
        options: ["True", "False"],
        correct: 1,
        explanation: "False. Low-volume breakouts are often fakeouts. Real breakouts need volume to confirm that genuine buying interest — not just a few stray orders — is driving the move."
      },
      {
        id: "q5",
        question: "A stock has been making higher highs and higher lows for 3 weeks. You want to trade it. What is the correct bias?",
        type: "scenario",
        options: ["Short (sell) it — it's overextended and due for a drop", "Wait for it to crash, then buy the bottom", "Buy on pullbacks to support — trade with the uptrend", "Avoid it — trending stocks are too risky"],
        correct: 2,
        explanation: "The trend is your friend. In an uptrend, the smart play is buying pullbacks to support levels — joining the trend rather than fighting it."
      },
      {
        id: "q6",
        question: "What is a 'role reversal' in support/resistance?",
        type: "multiple-choice",
        options: ["When buyers become sellers at the same level", "When a broken support level becomes new resistance (and vice versa)", "When price reverses direction three times at the same level", "When the market opens gap up after a downtrend"],
        correct: 1,
        explanation: "Role reversal is a key concept: once support is broken, price often retests that level from below — and it now acts as resistance. This is one of the most reliable chart patterns."
      }
    ],
    passingScore: 80
  },
  {
    id: "webull-setup",
    moduleId: "platform",
    moduleNumber: 3,
    title: "Webull Setup",
    subtitle: "Watchlists, charts, timeframes, indicators, paper trading, and alerts",
    icon: "📱",
    color: "#f59e0b",
    estimatedMinutes: 20,
    sections: [
      {
        title: "Setting Up Your Watchlist",
        content: "A watchlist is your personal list of stocks you monitor every day. In Webull, tap the '+' on the main screen to add stocks. Build a focused watchlist — 10 to 20 stocks max. More than that becomes noise.\n\nOrganize by theme: have one list for large-cap tech (AAPL, MSFT, NVDA, META), one for ETFs (SPY, QQQ, IWM, TLT), and one for whatever sector is hot. Review your watchlist before the market opens to plan your day."
      },
      {
        title: "Reading the Chart in Webull",
        content: "Open any stock and tap 'Chart.' You'll see candlesticks by default. The x-axis is time, the y-axis is price. The green/red bars at the bottom are volume.\n\nThe most useful chart features: tap and hold on any candle to see its exact OHLC values. Use two fingers to pinch-zoom in or out. The horizontal line tool lets you draw support and resistance levels manually."
      },
      {
        title: "Changing Timeframes",
        content: "Timeframes determine how much time each candle represents. Common timeframes:\n• 1-minute (1M): Day traders watching every tick\n• 5-minute (5M): Best for active day trading setups\n• 15-minute (15M): Good for entry confirmation\n• 1-hour (1H): Swing trade context and mid-term trends\n• Daily (1D): The most important — shows the big picture\n• Weekly (1W): Long-term trend, major support/resistance\n\nAlways check the daily chart first. Then zoom into the 5-minute for entry timing."
      },
      {
        title: "Adding Indicators",
        content: "Indicators are math calculations displayed on top of price. The most useful for beginners:\n• VWAP (Volume Weighted Average Price): The average price weighted by volume — the most important intraday indicator. Price above VWAP = bullish, below = bearish.\n• 9 EMA: The 9-period exponential moving average — shows short-term momentum\n• 20 EMA: Medium-term momentum line\n• 200 EMA: Long-term trend — if price is above it, the stock is in long-term uptrend\n• Volume: Always have this on\n\nIn Webull: tap the indicator icon (lines symbol) and add from the list."
      },
      {
        title: "Paper Trading",
        content: "Paper trading is simulated trading with fake money. It's essential before you trade with real capital. In Webull: tap the menu, find 'Paper Trading,' and start with the default $100,000 virtual account.\n\nTreat paper trading seriously. Use the same position sizes you'd use with real money. Follow your rules. The goal is to prove your strategy works BEFORE risking real dollars. Most beginners skip paper trading and pay for it with real losses."
      },
      {
        title: "Stop Loss and Take Profit Orders",
        content: "A stop loss is an automatic sell order that triggers if price drops to your predetermined level — it limits your maximum loss. ALWAYS set a stop loss before entering a trade.\n\nIn Webull: when placing an order, select 'Stop Loss' and enter your price. Better yet, use a bracket order — it sets both your stop loss AND take profit simultaneously.\n\nA take profit (limit sell) is where you plan to exit with your gain locked in. Set both before you enter. Once in a trade, emotions take over — let your orders manage it."
      },
      {
        title: "Price Alerts",
        content: "Alerts notify you when a stock reaches a price you care about — a breakout level, a support test, or a target. In Webull: tap any stock → three dots → 'Set Alert' → choose your price.\n\nSet alerts on your watchlist every day. If NVDA is approaching a key resistance at $900, set an alert at $897 so you're ready when it gets there — not scrambling to find your phone when it's already breaking out."
      }
    ],
    analogy: "Webull is your trading cockpit. The watchlist is your radar — showing what's moving. The chart is your flight instruments — showing where you are and where you might go. Timeframes are like zooming in and out on a map — the weekly is a satellite view, the 5-minute is street level. Indicators are overlays that highlight things your eyes might miss. Paper trading is the flight simulator — you practice crashing there so you don't crash for real.",
    webullExample: "Morning routine in Webull: 1) Check your watchlist — what moved overnight? 2) Open SPY daily chart — what's the big picture? Up or down trend? 3) Check TLT (bonds) — if it's falling, rates are rising, which often pressures tech stocks. 4) Open your top 3 setups on the 5-minute chart. 5) Add VWAP and 9 EMA to each. 6) Set alerts at the levels you'll trade. You're now prepared, not reactive.",
    commonMistakes: [
      "Skipping paper trading entirely — this is the most expensive mistake beginners make",
      "Using only one timeframe — always check the daily chart before the 5-minute",
      "Adding too many indicators — three quality indicators beat ten conflicting ones",
      "Not setting stop loss orders before entering — emotions will prevent you from cutting losses manually"
    ],
    realTradingMeaning: "The setup you use matters less than the discipline you bring to it. Webull is a tool. A carpenter with great tools still needs to know what they're building. Master the basics here — watchlist, charts, timeframes, and stops — before adding complexity. The traders who lose are usually the ones who skip the boring fundamentals in favor of exciting indicators.",
    checklist: [
      { id: "c1", text: "I have set up a focused watchlist with 10-20 stocks in Webull" },
      { id: "c2", text: "I can switch between timeframes and understand what each shows" },
      { id: "c3", text: "I have added VWAP and volume to my charts" },
      { id: "c4", text: "I have activated paper trading and placed at least one practice trade" },
      { id: "c5", text: "I know how to set a stop loss order in Webull" },
      { id: "c6", text: "I have set at least one price alert on a stock in my watchlist" }
    ],
    quiz: [
      {
        id: "q1",
        question: "You're watching a day trade setup on a 5-minute chart. Before entering, you should FIRST check:",
        type: "multiple-choice",
        options: ["The 1-minute chart for precision entry", "The daily chart for the bigger picture and trend", "Twitter for news about the stock", "The options chain for unusual activity"],
        correct: 1,
        explanation: "Always check higher timeframes first. The daily chart tells you the overall trend. If the daily is in a downtrend, shorting the 5-minute breakdown aligns with the bigger picture — a much higher-probability setup."
      },
      {
        id: "q2",
        question: "VWAP stands for Volume Weighted Average Price. If a stock is trading BELOW VWAP, what does that indicate?",
        type: "multiple-choice",
        options: ["The stock is cheap — a good buy", "Sellers are in control for the day — bearish bias", "The stock will definitely go lower", "The indicator is not working correctly"],
        correct: 1,
        explanation: "Price below VWAP means the average trader who bought today is in a loss. Sellers are in control. This is a bearish bias — not a guarantee, but a meaningful signal."
      },
      {
        id: "q3",
        question: "Why is paper trading important before live trading?",
        type: "multiple-choice",
        options: ["It makes you eligible for special account features", "It lets you practice your strategy without real financial risk", "Paper trading results directly predict live trading results", "It's required by law before trading stocks"],
        correct: 1,
        explanation: "Paper trading lets you test strategies, build discipline, and make mistakes without losing real money. It's your free education period."
      },
      {
        id: "q4",
        question: "True or False: You should set your stop loss AFTER entering a trade, once you see how price is moving.",
        type: "true-false",
        options: ["True", "False"],
        correct: 1,
        explanation: "False. Always set your stop loss BEFORE or AT entry. Once you're in a trade, emotions (hope, fear) will prevent rational decisions. Pre-committed stops remove emotion from the equation."
      },
      {
        id: "q5",
        question: "You buy NVDA at $880 and set a stop loss at $870 and a take profit at $900. NVDA drops to $870. What happens?",
        type: "scenario",
        options: ["Nothing — you need to manually sell", "Your stop loss triggers and you exit at approximately $870", "Your take profit triggers and you exit at $900", "Webull cancels both orders and closes your position at market"],
        correct: 1,
        explanation: "Your stop loss order is already in the system. When price hits $870, it automatically executes — protecting you from further losses without requiring any action from you."
      }
    ],
    passingScore: 80
  },
  {
    id: "risk-management",
    moduleId: "risk",
    moduleNumber: 4,
    title: "Risk Management",
    subtitle: "Stops, position sizing, risk/reward, and the 1% rule",
    icon: "🛡️",
    color: "#ef4444",
    estimatedMinutes: 25,
    sections: [
      {
        title: "The Iron Law: Never Trade Without a Stop",
        content: "This is non-negotiable. Before you enter any trade, you must know the exact price at which you will exit if you are wrong. This is your stop loss. Without it, a bad trade can become a catastrophic loss.\n\nMost beginners think 'I'll just watch it and sell if it drops.' That never works. When a trade goes against you, the brain generates hope ('it'll come back'), denial ('I'm not really losing'), and paralysis. A pre-set stop loss overrides all of that."
      },
      {
        title: "Risk/Reward Ratio",
        content: "Risk/Reward (R:R) measures how much you could make versus how much you could lose on a trade. If you risk $100 to make $300, your R:R is 1:3.\n\nNever take a trade with less than 1:2 risk/reward. This means if you're right only 40% of the time, you still make money:\n• 10 trades, 4 winners at $200 = +$800\n• 10 trades, 6 losers at $100 = -$600\n• Net profit: +$200 with a 40% win rate\n\nThis is the math that separates professionals from gamblers."
      },
      {
        title: "The 1% Rule",
        content: "Never risk more than 1% of your total trading account on a single trade. If your account is $10,000, you should never lose more than $100 on any single trade.\n\nThis keeps you in the game. Even 10 consecutive losing trades only cost you 10% of your account — a bad run, not a disaster. Traders who risk 10-20% per trade blow up their accounts in a few bad weeks.\n\nThe 1% rule is not about being timid. It's about survival. You can't make money from an empty account."
      },
      {
        title: "Position Sizing",
        content: "Position sizing tells you how many shares to buy based on your risk. Formula:\n\nShares = (Account × Risk %) ÷ (Entry − Stop Loss)\n\nExample: Account = $10,000. Risk = 1% = $100. Entry = $50. Stop = $48. Risk per share = $2.\nShares = $100 ÷ $2 = 50 shares.\n\nYou buy exactly 50 shares. If stopped out, you lose $100 (1%). If you hit a 2:1 target at $54, you gain $200. This math is what professional traders run automatically."
      },
      {
        title: "Target 1 and Target 2",
        content: "Experienced traders use multiple targets. Target 1 is a conservative level — the first major resistance. Target 2 is the extended target if the move continues.\n\nStrategy: Exit half your position at Target 1 (lock in profit), move your stop to breakeven on the remaining shares, and let the second half run toward Target 2.\n\nThis approach guarantees that once Target 1 is hit, the worst case is breakeven on the full trade — you cannot lose. The second half is essentially a 'free trade.'"
      },
      {
        title: "Scaling Out",
        content: "Scaling out means selling portions of your position as it moves in your favor — not all at once. You might sell 25% at Target 1, 25% at Target 2, and let 50% run as a 'runner.'\n\nThis removes the agonizing decision of when to sell everything. You're locking in wins along the way while maintaining exposure to further upside."
      },
      {
        title: "Cost-Removal Strategy",
        content: "The cost-removal strategy means selling enough shares at Target 1 to recover your original investment (your 'cost basis'), then letting the remaining shares ride — essentially for free.\n\nExample: You buy 100 shares at $50 = $5,000 total cost. At Target 1 ($60), you sell 84 shares × $60 = $5,040 — your full cost is recovered. Now your remaining 16 shares are pure profit no matter what happens. Your downside is zero."
      },
      {
        title: "Runner Trades",
        content: "A 'runner' is the portion of your position you keep after hitting your initial targets — a smaller slice you let run as far as the momentum carries it, with a very loose stop.\n\nRunners are how big trades happen. The key is having removed enough cost to make the runner stress-free. When a runner hits 5x, 10x your original risk, it changes your week. But you can only hold runners when your psychology is right — and that only happens after your cost is covered."
      }
    ],
    analogy: "Risk management is like driving a car with seatbelts and airbags. The seatbelt (stop loss) limits how badly you get hurt in a crash. The 1% rule is the car insurance — the premium you pay to protect your life savings. Position sizing is driving at the right speed for conditions — you don't drive 100 mph in a school zone. Scaling out is like cashing your paycheck in parts — some today, some saved for later.",
    webullExample: "In Webull paper trading, before every entry: 1) Write down your stop level. 2) Calculate (account × 0.01) ÷ (entry - stop) = number of shares. 3) Place a bracket order: entry + stop loss + take profit. 4) Write in your trade log: entry, stop, target, R:R, size, and your reason. Do this for every paper trade before going live. The habit saves accounts.",
    commonMistakes: [
      "Widening stop losses when a trade goes against you ('giving it more room') — this breaks the entire system",
      "Sizing up on revenge trades after a loss — this is how accounts blow up",
      "Taking trades with less than 1:2 R:R — the math doesn't work over time",
      "Not adjusting stop to breakeven after hitting Target 1 — giving back profits unnecessarily"
    ],
    realTradingMeaning: "Risk management is not optional. It IS the difference between traders who survive and traders who blow up. Every professional trader has strict risk rules. Losses are inevitable — the market will be wrong about you regularly. The only question is whether those losses are controlled and survivable, or catastrophic and account-ending.",
    checklist: [
      { id: "c1", text: "I will never enter a trade without a pre-defined stop loss" },
      { id: "c2", text: "I understand risk/reward and will only take trades with at least 1:2 R:R" },
      { id: "c3", text: "I understand the 1% rule and will apply it to every trade" },
      { id: "c4", text: "I can calculate position size using the formula" },
      { id: "c5", text: "I understand the concept of Target 1 / Target 2 and scaling out" },
      { id: "c6", text: "I understand what a runner is and when to use the cost-removal strategy" }
    ],
    quiz: [
      {
        id: "q1",
        question: "You buy NVDA at $100. Your stop is $95. Your target is $115. What is your risk/reward ratio?",
        type: "scenario",
        options: ["1:1", "1:2", "1:3", "3:1"],
        correct: 2,
        explanation: "Risk = $100 - $95 = $5. Reward = $115 - $100 = $15. R:R = $5 : $15 = 1:3. You're risking $1 to potentially make $3. This is a favorable setup."
      },
      {
        id: "q2",
        question: "Your account is $5,000. Following the 1% rule, what is the maximum you should lose on a single trade?",
        type: "multiple-choice",
        options: ["$5", "$50", "$100", "$500"],
        correct: 1,
        explanation: "$5,000 × 0.01 = $50. The 1% rule caps your loss at $50 per trade, regardless of how strong the setup looks."
      },
      {
        id: "q3",
        question: "Account: $10,000. Entry: $50. Stop: $47. Risk 1%. How many shares should you buy?",
        type: "scenario",
        options: ["100 shares", "67 shares", "33 shares", "10 shares"],
        correct: 2,
        explanation: "Risk = $10,000 × 1% = $100. Risk per share = $50 - $47 = $3. Shares = $100 ÷ $3 = 33 shares. You risk exactly $99 (≈1%) with 33 shares."
      },
      {
        id: "q4",
        question: "You're in a trade that hits Target 1. What should you do with your stop loss?",
        type: "multiple-choice",
        options: ["Leave it at the original stop loss level", "Move it to your breakeven (entry price)", "Remove it — you're in profit now, no risk", "Move it to a tighter level just below Target 1"],
        correct: 1,
        explanation: "Move your stop to breakeven after hitting Target 1. This guarantees the worst case on the remaining position is zero loss. You're now playing with 'house money.'"
      },
      {
        id: "q5",
        question: "True or False: If a trade is going against you, it's smart to widen your stop loss to give the trade more room.",
        type: "true-false",
        options: ["True", "False"],
        correct: 1,
        explanation: "False. Moving a stop loss wider after entering is one of the most dangerous habits in trading. Your stop was placed based on your analysis. If price is breaking that level, the trade idea is wrong. Widen the stop, and small losses become large losses."
      },
      {
        id: "q6",
        question: "What is the 'cost-removal strategy'?",
        type: "multiple-choice",
        options: ["Selling your entire position at Target 1 to eliminate all risk", "Selling enough shares at Target 1 to recover your full original cost basis", "Removing your stop loss once you're in profit", "Buying more shares if the trade goes against you to lower your average cost"],
        correct: 1,
        explanation: "Cost-removal means selling enough at Target 1 to get your original investment back. The remaining shares cost you nothing — they're pure profit regardless of what happens next."
      }
    ],
    passingScore: 80
  },
  {
    id: "market-drivers",
    moduleId: "macro",
    moduleNumber: 5,
    title: "Market Drivers",
    subtitle: "What actually moves markets: earnings, Fed, CPI, oil, and geopolitics",
    icon: "🌐",
    color: "#f59e0b",
    estimatedMinutes: 20,
    sections: [
      {
        title: "Earnings",
        content: "Every public company reports financial results four times a year — quarterly earnings. These reports are the most powerful single-stock catalysts. A stock can gap up 10-30% on a great earnings beat, or crash 20-40% on a miss.\n\nKey numbers: EPS (earnings per share) vs. expectations, and Revenue vs. expectations. 'Beat and raise' (beat expectations AND raise future guidance) drives the biggest moves. 'Miss and lower' causes the biggest crashes."
      },
      {
        title: "The Federal Reserve (The Fed)",
        content: "The Federal Reserve is the US central bank. Its most powerful tool is the Federal Funds Rate — the interest rate it sets. When the Fed raises rates, borrowing becomes more expensive, economic growth slows, and stocks often fall. When it cuts rates, money flows more freely and stocks often rise.\n\nThe Fed meets 8 times per year. Every meeting is a major market event. Fed Chair speeches are market-moving. The phrase 'Don't fight the Fed' is one of the truest rules in trading."
      },
      {
        title: "CPI (Consumer Price Index)",
        content: "CPI measures inflation — how much prices are rising. It's released monthly and is one of the most market-moving economic reports.\n\nHigh inflation = Fed raises rates = bad for stocks (especially growth/tech). Low inflation = Fed might cut rates = good for stocks. When CPI comes in hotter than expected, markets often sell off sharply. When it comes in cooler than expected, markets often rally. Watch the 8:30 AM ET CPI release carefully."
      },
      {
        title: "Interest Rates and TLT",
        content: "TLT is the ETF that tracks 20+ year US Treasury bonds. Bond prices move OPPOSITE to interest rates. When rates rise, TLT falls. When rates fall, TLT rises.\n\nWhy does this matter for stocks? Technology stocks and high-growth companies are valued on future earnings. When rates rise, those future earnings are worth less today (discounted at a higher rate). So rising rates → TLT falling → tech stocks under pressure.\n\nWatching TLT in real time tells you the interest rate story every day."
      },
      {
        title: "Geopolitics: War and Energy",
        content: "Wars and geopolitical tensions create immediate market reactions. Conflict in oil-producing regions → oil prices spike → energy stocks rally → airlines and transportation stocks fall.\n\nOil (tracked by USO or crude oil futures) affects almost every sector. When oil rises, energy companies (XOM, CVX) profit. Consumer spending slows as gas prices increase. Transportation and manufacturing costs rise.\n\nAlways watch where oil is trading and what geopolitical events might move it."
      },
      {
        title: "China and Global Markets",
        content: "China is the world's second-largest economy. Its economic data, trade policies, and market movements ripple across global markets. A Chinese economic slowdown → less demand for commodities → raw material stocks fall. US-China trade tensions → semiconductor stocks (NVDA, AMD) react sharply — many chips are made in or for China.\n\nHang Seng (Hong Kong market) and Shanghai Composite are worth checking when Asian markets are in the news."
      },
      {
        title: "AI News and Government Contracts",
        content: "In recent years, AI news has been one of the most powerful sector catalysts. An announcement of a major AI partnership, GPU order, or data center deal can send semiconductor stocks up 5-15% in a day.\n\nGovernment contracts are similarly powerful for defense (LMT, RTX, NOC), space (RKLB), and technology companies. A single DoD contract announcement can be a major catalyst.\n\nSpeculation and hype: In hot sectors, stocks move on rumors, tweets, and narratives — not just fundamentals. This is why AI stocks can trade at 50-100x earnings. Hype creates opportunity but also enormous risk when it reverses."
      }
    ],
    analogy: "Market drivers are like weather systems that affect every ship at sea. The Fed is the climate — it sets the overall environment. Earnings are local storms — they hit specific stocks hard. CPI is a pressure system — it determines whether the Fed changes the climate. TLT is the barometer — it tells you if rates are rising or falling before the official announcement. Oil is fuel — when it's expensive, everything costs more.",
    webullExample: "Build a macro watchlist in Webull: SPY (market), QQQ (tech), IWM (small caps), TLT (bonds), USO (oil), GLD (gold). Every morning before open, check these six. Are bonds falling (rates rising)? Bearish tech. Is oil spiking? Good for energy, bad for airlines. Is SPY gapping up? Bullish day for everything. This 30-second check gives you the macro context for all your day trades.",
    commonMistakes: [
      "Trading earnings without understanding the implied move — options price in expected volatility, and stocks can gap huge either way",
      "Ignoring macro on volatile news days — great chart setup means nothing if CPI just came in hot",
      "Chasing AI hype without understanding the underlying business",
      "Not realizing that 'good news' can still cause stocks to sell off if expectations were already priced in"
    ],
    realTradingMeaning: "The best chart setups in the world fail against macro headwinds. A perfect breakout pattern on a tech stock means nothing if the Fed just raised rates and TLT is crashing. Always know the macro context before entering individual trades. Is today a risk-on or risk-off day? Is the sector your stock is in in favor or under pressure? Context determines whether setups work or fail.",
    checklist: [
      { id: "c1", text: "I understand how earnings reports move stocks and what to watch" },
      { id: "c2", text: "I understand what the Fed does and why rate decisions move markets" },
      { id: "c3", text: "I know what CPI is and how it affects the Fed and markets" },
      { id: "c4", text: "I understand the relationship between TLT and interest rates" },
      { id: "c5", text: "I know how oil prices affect different sectors" },
      { id: "c6", text: "I have added SPY, QQQ, TLT, and USO to a macro watchlist in Webull" }
    ],
    quiz: [
      {
        id: "q1",
        question: "The Fed announces a surprise 0.5% interest rate hike. What is the most likely immediate reaction in tech stocks?",
        type: "scenario",
        options: ["Tech stocks rally — higher rates mean a strong economy", "Tech stocks fall — higher borrowing costs and lower present value of future earnings", "Tech stocks are unaffected — earnings drive tech, not rates", "Tech stocks gap up then reverse lower"],
        correct: 1,
        explanation: "Higher rates increase the discount rate used to value future earnings. Tech and growth stocks — valued on far-future earnings — see the sharpest devaluations when rates rise."
      },
      {
        id: "q2",
        question: "TLT is falling sharply today. What does this tell you about interest rates?",
        type: "multiple-choice",
        options: ["Interest rates are falling", "Interest rates are rising", "The Fed just cut rates", "Bond markets are closed"],
        correct: 1,
        explanation: "Bond prices move opposite to interest rates. TLT falling = bond prices dropping = interest rates rising. This is your real-time rates signal."
      },
      {
        id: "q3",
        question: "A company beats both EPS and revenue estimates AND raises future guidance. What typically happens?",
        type: "multiple-choice",
        options: ["Stock falls — investors sell on the news", "Stock gaps up — 'beat and raise' is the strongest earnings outcome", "Stock is flat — the market already priced it in", "Depends entirely on sector rotation"],
        correct: 1,
        explanation: "Beat and raise is the best possible earnings outcome. Beating estimates shows strong current performance, and raising guidance signals confidence in future performance — the most bullish combination."
      },
      {
        id: "q4",
        question: "True or False: You can safely ignore macroeconomic data on days when you have a strong technical chart setup.",
        type: "true-false",
        options: ["True", "False"],
        correct: 1,
        explanation: "False. Macro always matters. A CPI print, Fed speech, or geopolitical event can override any technical setup in seconds. Always know what economic events are scheduled on the days you plan to trade."
      },
      {
        id: "q5",
        question: "Oil spikes 8% due to Middle East tensions. Which of the following is the most likely sector reaction?",
        type: "scenario",
        options: ["Airlines rally — more people travel during uncertainty", "Energy stocks (XOM, CVX) rally; airline stocks fall", "Technology stocks rally — unrelated to oil", "All stocks fall equally"],
        correct: 1,
        explanation: "Energy producers profit directly from oil price spikes. Airlines are hurt by rising fuel costs. Sectors have very different sensitivities to commodity prices — understanding these relationships is essential."
      }
    ],
    passingScore: 80
  },
  {
    id: "options-basics",
    moduleId: "options",
    moduleNumber: 6,
    title: "Options Basics",
    subtitle: "Calls, puts, Greeks, and why defined risk matters",
    icon: "⚙️",
    color: "#a855f7",
    estimatedMinutes: 30,
    sections: [
      {
        title: "What Is an Options Contract?",
        content: "An option is a contract that gives you the RIGHT — but not the obligation — to buy or sell 100 shares of a stock at a specific price before a specific date. You pay a premium for this right.\n\nOptions are powerful because they provide leverage — a small move in the stock creates a large percentage move in the option. But they can also expire worthless, losing 100% of your investment. They are NOT for beginners who haven't mastered stocks first."
      },
      {
        title: "Calls",
        content: "A call option gives you the right to BUY 100 shares at the strike price before expiration. You buy calls when you expect the stock to go UP.\n\nExample: AAPL is at $180. You buy a call with a $185 strike expiring next Friday for $2 per share ($200 total for 100 shares). If AAPL rises to $195 before Friday, your call is worth at least $10 per share ($1,000) — a 5x return. If AAPL stays at $180 or falls, your $200 premium expires worthless."
      },
      {
        title: "Puts",
        content: "A put option gives you the right to SELL 100 shares at the strike price before expiration. You buy puts when you expect the stock to go DOWN.\n\nPuts can be used to profit from falling stocks OR to hedge a position you already own. Buying a put on a stock you own is like buying insurance — if the stock crashes, your put gains value and offsets your loss."
      },
      {
        title: "Strike Price and Expiration",
        content: "The strike price is the price at which you can buy (call) or sell (put) the underlying stock. A call is 'in the money' (ITM) when the stock is above the strike. A call is 'out of the money' (OTM) when the stock is below the strike.\n\nExpiration is the date the option contract ends. After expiration, the contract is worthless if it's out of the money. Weekly options expire every Friday. Monthly options expire the third Friday of each month."
      },
      {
        title: "Premium, Theta, and Delta",
        content: "Premium is what you pay for the option — its price.\n\nTheta is 'time decay' — the amount of value an option loses every day simply due to passing time. The closer to expiration, the faster theta erodes premium. THIS IS WHY WEEKLY OPTIONS ARE DANGEROUS FOR BEGINNERS. You're fighting the clock every day.\n\nDelta measures how much the option's price moves for every $1 move in the stock. A delta of 0.50 means the option gains $0.50 for every $1 the stock rises. Deep ITM options have deltas near 1.0 (move dollar-for-dollar with stock). OTM options have deltas near 0.1-0.2."
      },
      {
        title: "Implied Volatility (IV)",
        content: "Implied Volatility (IV) measures how much the market EXPECTS a stock to move. High IV = expensive options. Low IV = cheap options.\n\nIV spikes before earnings or major events — this is why buying options right before earnings is dangerous. You pay a premium for uncertainty. After the event, IV 'crush' happens — even if the stock moves in your direction, the option can lose value because IV collapses.\n\nBuy options when IV is low. Be very careful buying options when IV is high."
      },
      {
        title: "Why Weekly Options Are Dangerous",
        content: "Weekly options expire Friday. You have 5 days for your thesis to work. Every day that passes, theta eats your premium — even if the stock barely moves. A stock can be flat for 3 days, move in your direction on day 4, but theta may have already eaten 40% of your option's value.\n\nWeeklies are cheap for a reason — they're designed to expire worthless. Professional traders sell weekly options; beginners buy them. Until you fully understand options mechanics, avoid weeklies."
      },
      {
        title: "Debit Spreads and Defined Risk",
        content: "A debit spread (also called a vertical spread) is a safer options strategy for beginners. You buy one option and simultaneously sell another at a different strike. This limits both your maximum profit AND your maximum loss to known amounts.\n\nExample: Buy a $185 call on AAPL, sell a $190 call. Net cost: $150. Maximum profit: $350. You know exactly what you can lose before you enter — $150. Defined risk = you can't lose more than you paid. This is how to use options responsibly."
      }
    ],
    analogy: "A call option is like putting a deposit on a house. You pay $5,000 to lock in the purchase price at $300,000 for 30 days. If prices rise to $350,000, your deposit is now worth $50,000+ in value. If prices fall, you lose your $5,000 deposit — but nothing more. Theta is the monthly rent you pay while holding that deposit — every day that passes, some value drains away. IV is how 'in demand' the house market is — in a hot market, deposits cost more.",
    webullExample: "In Webull, tap any stock → Options → select an expiration date. You'll see calls and puts listed by strike price. The 'bid/ask' is the premium. Look for options that are slightly in the money (ITM). Check the 'IV' column — avoid earnings week if IV is very high. For your first options trade, use paper trading mode and try a simple call on a stock you've already analyzed with your chart skills.",
    commonMistakes: [
      "Buying cheap weekly OTM options hoping for a quick 10x — these expire worthless most of the time",
      "Buying options right before earnings without understanding IV crush",
      "Not using defined-risk spreads — naked options can lose 100% of premium",
      "Trading options before mastering stock chart reading and risk management"
    ],
    realTradingMeaning: "Options are tools, not lottery tickets. Used correctly with defined risk (spreads), they let you express a directional view with less capital. Used incorrectly (buying cheap weeklies on hope), they're one of the fastest ways to lose money in trading. Master stocks first. Then add options only after you have consistent chart-reading and risk management habits.",
    checklist: [
      { id: "c1", text: "I understand the difference between calls and puts" },
      { id: "c2", text: "I understand what strike price and expiration mean" },
      { id: "c3", text: "I understand theta (time decay) and why it hurts option buyers daily" },
      { id: "c4", text: "I understand delta and how it affects option price movement" },
      { id: "c5", text: "I understand IV and why buying options before earnings can be dangerous" },
      { id: "c6", text: "I understand what a debit spread is and why defined risk matters" },
      { id: "c7", text: "I will not trade weekly options until I fully understand time decay mechanics" }
    ],
    quiz: [
      {
        id: "q1",
        question: "You buy a call option on NVDA with a $900 strike expiring Friday. NVDA closes flat all week at $895 and never reaches $900. What happens to your option?",
        type: "scenario",
        options: ["It expires worthless — you lose your premium", "You keep the premium since NVDA didn't go down", "It automatically converts to 100 shares at $900", "You can roll it to next week for free"],
        correct: 0,
        explanation: "An out-of-the-money option (stock below strike price for a call) expires worthless at expiration. You lose your entire premium. This is why buying OTM weeklies is so risky."
      },
      {
        id: "q2",
        question: "What does theta represent in options trading?",
        type: "multiple-choice",
        options: ["How much the option moves per $1 stock move", "The daily loss in option value due to time passing", "The implied volatility of the option", "The break-even price at expiration"],
        correct: 1,
        explanation: "Theta is time decay — the daily erosion of an option's value simply from time passing. If everything else is equal, your option is worth less tomorrow than today. Theta accelerates dramatically in the final week before expiration."
      },
      {
        id: "q3",
        question: "True or False: Buying put options is one way to profit when a stock price falls.",
        type: "true-false",
        options: ["True", "False"],
        correct: 0,
        explanation: "True. Puts increase in value as the underlying stock falls. Traders buy puts to profit from declining prices or to hedge existing stock positions against losses."
      },
      {
        id: "q4",
        question: "An option has a delta of 0.30. AAPL stock rises $2. How much does the option's price approximately change?",
        type: "multiple-choice",
        options: ["$2.00", "$0.60", "$0.30", "$3.00"],
        correct: 1,
        explanation: "Delta 0.30 × $2 stock move = $0.60 change in option price. Delta tells you the option's sensitivity to stock price movement."
      },
      {
        id: "q5",
        question: "What is a debit spread and what makes it safer than buying a single option?",
        type: "multiple-choice",
        options: ["Buying two options at once for double the profit", "Buying one option and selling another at a different strike, creating a known maximum loss", "Spreading trades across multiple stocks to reduce risk", "A broker fee structure for options trading"],
        correct: 1,
        explanation: "A debit spread (vertical spread) buys one option and sells another, creating defined maximum profit AND defined maximum loss. You know exactly what you can lose before you enter — unlike a naked option which can lose 100% of premium."
      },
      {
        id: "q6",
        question: "IV (implied volatility) is extremely high on a stock right before earnings. You buy a call option. Earnings come out — the stock rises 5% as expected. But your call option LOSES value. Why?",
        type: "scenario",
        options: ["Your call should have been a put — you had the direction wrong", "IV crush — the high IV priced into the option collapsed after the event, offsetting the stock's gain", "The market maker made an error", "5% is not enough move to make the option profitable"],
        correct: 1,
        explanation: "IV crush is the phenomenon where implied volatility collapses after an anticipated event (like earnings). High IV inflated your option's premium. After earnings, uncertainty is resolved, IV drops sharply, and your option loses value from the IV collapse — even though the stock moved in your direction."
      }
    ],
    passingScore: 80
  },
  {
    id: "trade-setups",
    moduleId: "setups",
    moduleNumber: 7,
    title: "Trade Setups",
    subtitle: "Breakouts, pullbacks, trend continuation, failed breakouts, and catalysts",
    icon: "🎯",
    color: "#00d4ff",
    estimatedMinutes: 25,
    sections: [
      {
        title: "The Breakout Setup",
        content: "A breakout occurs when a stock clears a well-defined resistance level on strong volume. This is the most classic trade setup. The stock has been coiling below resistance, building energy, and finally breaks through — attracting new buyers.\n\nEntry: On the candle close above resistance, or on the first pullback to that level after the break. Stop: Below the breakout level. Target: Measure the height of the consolidation and project it above the breakout point (measured move).\n\nKey rule: Volume must be at least 1.5x average on the breakout candle. Low-volume breakouts fail frequently."
      },
      {
        title: "The Pullback Setup",
        content: "In an established uptrend, price pulls back to a moving average or support level before resuming higher. This is often a safer entry than chasing a breakout because you're getting a better price.\n\nEntry: Buy near the support level — either the 9 EMA, 20 EMA, or a prior resistance-turned-support level. Stop: Below the support level or recent swing low. Target: Prior high or next resistance level.\n\nThe pullback setup requires patience — waiting for price to come to you rather than chasing."
      },
      {
        title: "Trend Continuation",
        content: "Trend continuation setups occur when a trending stock pauses (consolidates), then breaks out of that consolidation in the direction of the original trend. These are often called 'bull flags' (in uptrends) or 'bear flags' (in downtrends).\n\nA bull flag: Strong upward move, then a brief 3-5 candle pullback forming a tight channel (the 'flag'), then a breakout above the flag on volume. Entry: Above the top of the flag. Stop: Below the bottom of the flag. Target: The height of the initial pole added to the breakout point."
      },
      {
        title: "Failed Breakout (Short Setup)",
        content: "A failed breakout — also called a 'fakeout' or 'trap' — is when price breaks above resistance, attracts eager buyers, then immediately reverses back below the level. This traps buyers at the high and creates urgent selling.\n\nEntry: Short (sell) on the reversal back below the breakout level. Stop: Above the failed breakout high. Target: Back to the base of the consolidation.\n\nFailed breakouts can be powerful setups because trapped buyers are forced to sell, accelerating the downward move. They require short-selling capability."
      },
      {
        title: "News Catalyst Trade",
        content: "A news catalyst trade is entering a position based on a real-world event: FDA approval, earnings beat, government contract, partnership announcement. The catalyst creates immediate demand imbalance.\n\nKey rules: 1) Act fast — catalyst moves are often front-loaded. 2) Use a wider stop — news-driven stocks are volatile. 3) Watch for the initial spike and retest. Many news trades have a 'pop and drop' pattern — initial spike, pullback, then continuation. Wait for the retest rather than chasing the initial pop.\n\nNever trade a catalyst you don't understand. Know what the news means for the business."
      },
      {
        title: "TLT/Rates Trade",
        content: "The TLT/rates trade is a macro setup. When TLT is falling sharply (rates rising), tech stocks tend to underperform. When TLT is rising (rates falling), tech often rallies.\n\nSetup: TLT breaks a key support level and accelerates lower → short QQQ (tech ETF) or buy puts on high-multiple tech stocks. The inverse trade also works: TLT breaking above resistance → long QQQ or tech calls.\n\nThis is a sector-rotation macro trade, not a stock-specific play."
      },
      {
        title: "Energy/Oil Trade",
        content: "Oil is one of the most reliable commodity-to-stock correlations. USO (oil ETF) rising → energy stocks (XOM, CVX, OXY, FANG) tend to follow. Geopolitical tension in oil regions creates immediate oil spikes.\n\nSetup: USO breaks above recent resistance on a news catalyst (supply cut, conflict, demand data) → buy energy stocks near their own breakout levels. Stop: Below the energy stock's recent support. The correlation between oil and energy stocks is strong but not instantaneous — use the lag to your advantage."
      }
    ],
    analogy: "Trade setups are recipes. You don't cook by dumping random ingredients together — you follow a specific recipe that has worked before. The breakout setup is a steak recipe — straightforward, classic, reliable. The pullback is a slow-cooked roast — requires patience but produces consistent results. The failed breakout is a spicy dish — higher risk, powerful when it works. You need to master the basic recipes before improvising.",
    webullExample: "Build a setup checklist in your trade log. Before every trade, write: 1) Setup type (breakout/pullback/catalyst). 2) Entry price and reason. 3) Stop loss level and reason. 4) Target 1 and Target 2. 5) Volume confirmation (yes/no). 6) Macro context (risk-on or risk-off day). If you can't fill in all 6, don't take the trade. In paper trading, track which setup types you win most often — that's your edge.",
    commonMistakes: [
      "Chasing the initial move on news catalysts — wait for the first pullback/retest",
      "Taking breakout trades on stocks with no volume confirmation",
      "Trading setups against the macro environment — a breakout in a market selloff often fails",
      "Not identifying the setup type before entering — trading randomly with no repeatable process"
    ],
    realTradingMeaning: "Professional traders don't take random trades. They wait for their specific, tested setups to appear — and only trade those. Having 2-3 setups you know well is far more profitable than trying 10 setups you've never practiced. Paper trade each setup type 20+ times before using real money. Track your win rate by setup type. Your edge lives in the setups that work for your personality and schedule.",
    checklist: [
      { id: "c1", text: "I can identify a breakout setup and its key entry, stop, and target levels" },
      { id: "c2", text: "I understand the pullback setup and can identify it on a chart" },
      { id: "c3", text: "I understand the bull flag continuation pattern" },
      { id: "c4", text: "I know what a failed breakout looks like and why it moves fast" },
      { id: "c5", text: "I understand the TLT/rates trade and the macro correlation" },
      { id: "c6", text: "I have paper traded at least one complete setup from entry to exit" }
    ],
    quiz: [
      {
        id: "q1",
        question: "A stock has been consolidating between $48 and $52 for 2 weeks. It breaks above $52 on 3x average volume with a strong green candle close. What setup is this?",
        type: "multiple-choice",
        options: ["A pullback setup", "A breakout setup", "A trend continuation (bull flag)", "A failed breakout"],
        correct: 1,
        explanation: "Classic breakout: defined consolidation range, price clears the upper boundary (resistance at $52) on strong volume. This is the textbook breakout setup."
      },
      {
        id: "q2",
        question: "An uptrending stock pulls back to its 20 EMA on lighter volume and forms a small hammer candle. What is the best play?",
        type: "multiple-choice",
        options: ["Short the stock — it's showing weakness by pulling back", "Buy the pullback — price has returned to support in an uptrend", "Wait for the stock to break to new lows before entering", "Only watch — this setup has no edge"],
        correct: 1,
        explanation: "In an uptrend, a pullback to the 20 EMA on lighter volume with a reversal candle (hammer) is a textbook long entry. You're buying support with the trend."
      },
      {
        id: "q3",
        question: "What is a bull flag pattern?",
        type: "multiple-choice",
        options: ["A stock making all-time highs on high volume", "A sharp move up (the pole) followed by a tight pullback (the flag), then continuation", "A reversal pattern at a major resistance level", "When the SPY is in a bullish trend"],
        correct: 1,
        explanation: "A bull flag has two parts: the pole (strong initial move) and the flag (brief, tight consolidation that drifts slightly lower). The breakout above the flag continues the original move."
      },
      {
        id: "q4",
        question: "You see a stock break above resistance at $100, triggering a bunch of buy orders. Then it immediately reverses and closes back below $100 with a large red candle. What likely just happened?",
        type: "scenario",
        options: ["A successful breakout — price will revisit $100 soon", "A failed breakout — trapped buyers will now be forced to sell, potentially driving price lower", "Normal volatility — this happens on all breakouts", "A sign of unusual institutional buying"],
        correct: 1,
        explanation: "A failed breakout traps buyers who chased the move above $100. They're now losing money and will need to sell, adding to downward pressure. This is why failed breakouts can become strong short setups."
      },
      {
        id: "q5",
        question: "True or False: The best time to buy a stock on a news catalyst is immediately when the news hits, at the very first spike.",
        type: "true-false",
        options: ["True", "False"],
        correct: 1,
        explanation: "False. News catalysts often create an initial spike that retests. Chasing the very first tick is dangerous — you buy at the worst price with the widest spread. Waiting for the first pullback/retest gives a better entry, tighter stop, and more favorable risk/reward."
      }
    ],
    passingScore: 80
  },
  {
    id: "psychology",
    moduleId: "mindset",
    moduleNumber: 8,
    title: "Trading Psychology",
    subtitle: "FOMO, revenge trading, fear, greed, and staying disciplined",
    icon: "🧠",
    color: "#a855f7",
    estimatedMinutes: 20,
    sections: [
      {
        title: "FOMO: Fear of Missing Out",
        content: "FOMO is one of the most destructive forces in trading. It's the overwhelming urge to jump into a trade because it's moving fast and you're not in it. FOMO trades are almost always bad — you're chasing extended moves without a proper setup, stop, or plan.\n\nFOMO enters after the setup has already played out. You're buying the peak, not the base. The move you're chasing is often the blow-off top — the last buyers before a sharp reversal.\n\nThe cure: Always wait for your setup. Miss the trade, accept it. Another one comes tomorrow."
      },
      {
        title: "Revenge Trading",
        content: "Revenge trading is taking an impulsive, oversized trade immediately after a loss — trying to 'get back' your money quickly. This is the single fastest way to blow up an account.\n\nAfter a loss, your emotional brain wants to recover immediately. But it bypasses rational thinking: you trade larger, ignore your rules, and chase setups that aren't there. One bad trade becomes two, then three — and the account gets smaller fast.\n\nRule: After a losing trade, STOP. Take 15 minutes away from the screen. Only re-enter the market with your full plan and normal position size."
      },
      {
        title: "Greed",
        content: "Greed manifests as: not taking profits when your target is hit, doubling position size after a winner, holding a trade 'just a little longer' after it's already moved far. Greed turns winners into breakevens or losses.\n\nThe antidote to greed is your pre-trade plan. You decided your target before the trade — honor it. If the setup changes (new catalyst, volume spike), you can adjust. But changing targets purely because you want more money is greed, and it usually ends badly."
      },
      {
        title: "Fear",
        content: "Fear causes you to: exit winners too early (cutting profits before the target), hesitate on valid setups (missing entries), tighten stops to a level that gets hit by normal volatility, or not trade at all after a losing streak.\n\nFear and greed are both managed the same way: with a pre-defined, written plan. When you know exactly what you're doing before you enter, fear has no foothold. You're following a process, not reacting to price fluctuations."
      },
      {
        title: "Overtrading",
        content: "Overtrading is taking too many trades — usually from boredom, a desire to be 'active,' or trying to recover losses. Each additional trade carries commission costs, emotional energy costs, and statistical risk.\n\nLess is more in trading. A professional trader might take 1-3 trades per day, only when A+ setups appear. A beginner might take 15, most of them impulsive. More trades = more fees + more mistakes + more emotional exhaustion.\n\nSet a maximum daily trade limit (3-5 trades). When you hit it, stop."
      },
      {
        title: "Why Beginners Lose",
        content: "Studies consistently show 70-80% of retail traders lose money. The reasons aren't primarily about chart-reading skill — they're behavioral:\n1. No stop losses — letting losses run until catastrophic\n2. Taking profits too early — fear of losing gains\n3. Revenge trading after losses — emotional decisions\n4. Overtrading — commission and mental energy drain\n5. No edge — trading random setups without testing\n6. Under-capitalization — too little capital to survive the learning curve\n7. Ignoring macro — trading against the market environment"
      },
      {
        title: "Staying Disciplined",
        content: "Discipline is not a personality trait — it's a system. Disciplined traders:\n1. Write down every trade plan before entry\n2. Review their trades weekly — track what worked and what didn't\n3. Set daily loss limits (max down 2% for the day, then stop trading)\n4. Never touch position size in the middle of a trade\n5. Never trade when sick, tired, angry, or distracted\n6. Keep a trading journal — it's your most valuable tool\n\nTreating trading like a business — with rules, reviews, and continuous improvement — is what separates the few who succeed from the many who don't."
      }
    ],
    analogy: "Trading psychology is like playing poker in a casino. The cards (setups) matter, but the players who win long-term are the ones who stay emotionally flat. A bad poker player tilts after losing a hand and starts making wild bets. A professional folds 70% of hands and waits patiently for strong cards. Trading requires the same discipline — you're playing against your own emotions as much as the market.",
    webullExample: "Before every trading session: 1) Write your max loss for the day ($X). 2) Write 1-3 setups you're watching. 3) Write your rules for today. After every session: 1) Review each trade. 2) Note what was plan vs. emotion. 3) Calculate your win rate this week. The act of writing forces your rational brain to stay in control. Traders who journal consistently outperform those who don't.",
    commonMistakes: [
      "Taking 'one more trade' after hitting your daily loss limit",
      "Holding onto losers hoping they recover — hope is not a strategy",
      "Not reviewing losing trades — losses you don't analyze, you repeat",
      "Trading when emotionally compromised — tired, angry, or overconfident after a big winner"
    ],
    realTradingMeaning: "Your biggest enemy in trading is not the market — it's yourself. The market is just a mirror that shows you your psychological weaknesses. Impatience, greed, fear, ego — all of these show up in your P&L. Mastering the technical skills in this course is important, but sustainable profitability comes from mastering your psychology. Build the habits now in paper trading — they will define your results in live trading.",
    checklist: [
      { id: "c1", text: "I understand what FOMO is and how to avoid chasing extended moves" },
      { id: "c2", text: "I understand revenge trading and will stop for 15 minutes after any loss" },
      { id: "c3", text: "I will set a daily max loss limit and stop trading when I hit it" },
      { id: "c4", text: "I will keep a trading journal for every paper trade" },
      { id: "c5", text: "I understand why most beginners lose and how to avoid those patterns" },
      { id: "c6", text: "I commit to only trading when I have a written plan for each trade" }
    ],
    quiz: [
      {
        id: "q1",
        question: "You miss a breakout setup and watch the stock run 8% without you. You feel the urge to buy it anyway. What should you do?",
        type: "scenario",
        options: ["Buy immediately — the momentum is clearly there", "Wait for a pullback to a logical entry with a defined stop", "Short the stock because it's overextended", "Nothing — accept the missed opportunity and wait for the next setup"],
        correct: 3,
        explanation: "The right answer depends on the situation: wait for a pullback (option B) is valid if the setup re-forms. But accepting the miss (option D) is equally valid — FOMO chasing at +8% is almost always wrong. Never trade purely from FOMO."
      },
      {
        id: "q2",
        question: "You just lost $200 on a bad trade. You feel the urge to immediately take a large position to recover. What is this called and why is it dangerous?",
        type: "multiple-choice",
        options: ["Position sizing — adjusting your size based on recent performance", "Revenge trading — emotional decisions that usually make losses worse", "Risk management — trying to recover losses within your account", "Trend following — taking your next setup immediately"],
        correct: 1,
        explanation: "Revenge trading is the impulsive response to loss. You're not thinking clearly, you're likely taking larger sizes than normal, and you're forcing setups that aren't there. It compounds losses rather than recovering them."
      },
      {
        id: "q3",
        question: "True or False: The primary reason most retail traders lose money is poor chart reading ability.",
        type: "true-false",
        options: ["True", "False"],
        correct: 1,
        explanation: "False. Studies show most retail losses are behavioral — holding losers, cutting winners, revenge trading, overtrading, and ignoring stop losses. The technical skills can be learned in weeks; the psychology takes years to master."
      },
      {
        id: "q4",
        question: "You're in a winning trade and hit your Target 1. Greed says 'hold it, it's going higher.' Your plan says 'sell half here.' What do you do?",
        type: "multiple-choice",
        options: ["Trust the greed — winners keep winning", "Follow your plan and sell half at Target 1, move stop to breakeven", "Hold everything because Target 1 was too conservative", "Exit completely — take all profits immediately"],
        correct: 1,
        explanation: "Follow your pre-trade plan. You made that plan with a clear head before emotions entered. Changing targets mid-trade based on greed is how winners become breakevens. Sell half at T1, move stop to breakeven, let the rest run."
      },
      {
        id: "q5",
        question: "What is a daily loss limit and why is it essential?",
        type: "multiple-choice",
        options: ["A limit set by your broker on how much you can lose", "A personal rule to stop trading after losing a specific amount per day", "The maximum loss allowed by the pattern day trader rule", "A tax concept for reporting trading losses"],
        correct: 1,
        explanation: "A daily loss limit is a self-imposed rule: 'If I lose $X today, I stop trading.' This prevents one bad day from becoming catastrophic. Most professional traders use daily stop-outs of 1-2% of their account."
      }
    ],
    passingScore: 80
  },
  {
    id: "paper-trading-lab",
    moduleId: "practice",
    moduleNumber: 9,
    title: "Paper Trading Lab",
    subtitle: "Practice finding setups, writing a thesis, and logging your results",
    icon: "🔬",
    color: "#10b981",
    estimatedMinutes: 30,
    sections: [
      {
        title: "What You'll Do in the Lab",
        content: "The Paper Trading Lab is where everything you've learned gets applied in practice. You'll find a real stock on Webull, identify the setup, write your trade thesis, choose entry/stop/target, paper trade it, and log the result.\n\nThis is not optional. No professional trader skips this phase. You must build the habits of process-based trading before real money is involved. Your job here is not to make money — it's to practice the process correctly."
      },
      {
        title: "Finding Support and Resistance",
        content: "For any stock in your watchlist: 1) Open the daily chart. 2) Find the most obvious price level that has been tested 2+ times. 3) Mark it with the horizontal line tool. 4) Switch to the 5-minute chart. 5) Find the nearest intraday support and resistance.\n\nRule: Strong levels are the ones you can see immediately. If you have to squint to find it, it's not a strong level. Your support and resistance should be obvious."
      },
      {
        title: "Choosing Your Entry",
        content: "Your entry should have a specific reason: 'I'm buying at $185 because price is retesting the $185 support level with a hammer candle on the 5-minute chart, and volume is declining on the pullback (indicating weak selling).'\n\nRandom entries — 'I bought because it looked like it was going up' — produce random results. Every entry needs a reason based on your setup type and the evidence on the chart."
      },
      {
        title: "Choosing Your Stop Loss",
        content: "Your stop is set at the level where your trade idea is WRONG. If you're buying support at $185, your stop goes just below that support — say $183.50. If support breaks, the trade is wrong. Out.\n\nNever set a stop based on dollar amount alone ('I'll stop if I lose $200'). Set it at the technical level — the level that, if broken, invalidates your trade thesis."
      },
      {
        title: "Writing Your Trade Thesis",
        content: "Before every paper trade, write 3-5 sentences answering: 1) What is the setup? 2) What is the catalyst (if any)? 3) Why am I entering here? 4) What happens if I'm wrong? 5) What is my target and why?\n\nExample thesis: 'AAPL is pulling back to the 20 EMA on the daily chart after a strong uptrend. Volume on the pullback is declining — this is a healthy rest, not distribution. I'm buying the 20 EMA touch at $185 with a stop below the recent swing low at $183. Target is the prior high at $193. R:R is 1:4.'"
      },
      {
        title: "Logging Your Results",
        content: "After every trade, log: Date, Ticker, Setup Type, Entry, Stop, Target 1, Target 2, Result (profit/loss), What went right, What went wrong, Did I follow my plan? (Y/N).\n\nAfter 20 trades, review: What setup types have the highest win rate? What time of day do I trade best? What mistakes repeat? Your journal is your personal trading manual — the most valuable data you'll ever generate."
      }
    ],
    analogy: "Paper trading is flight simulator school. No passenger airline pilot flies a real plane without 100+ hours in the simulator first. The simulator looks real, feels real, and teaches real skills — but crashing doesn't cost lives. Your paper trading account is the simulator. Treat every paper trade with the same discipline you'd bring to a $10,000 real trade.",
    webullExample: "Paper trading workflow in Webull: 1) Pre-market (9:00-9:30 AM): Review watchlist, identify 2-3 setups, write each thesis. 2) First 30 minutes of market open: Watch but don't trade — observe how your setups develop. 3) 10:00 AM onwards: If setup triggers, execute in paper trading. 4) End of day: Log every trade. 5) Friday: Weekly review of all trades.",
    commonMistakes: [
      "Treating paper trading as a game — use real position sizes and real discipline",
      "Not writing a thesis before each trade — random entries in paper trading create random habits in live trading",
      "Ignoring the results review — the data from your trades is your feedback loop",
      "Rushing to live trading after just a few paper trades — minimum 30 paper trades before considering live"
    ],
    realTradingMeaning: "The traders who succeed in live markets are the ones who built disciplined habits in paper trading. The ones who fail are usually the ones who rushed — 'paper trading isn't real.' Your habits are exactly the same in live trading. Build good ones now.",
    checklist: [
      { id: "c1", text: "I have completed at least 5 paper trades in Webull" },
      { id: "c2", text: "Each trade had a written thesis before entry" },
      { id: "c3", text: "I used position sizing based on the 1% rule for each trade" },
      { id: "c4", text: "I set stop loss and take profit orders before entry on each trade" },
      { id: "c5", text: "I logged all trades with entry, stop, target, and result" },
      { id: "c6", text: "I reviewed my trades and identified at least one thing to improve" }
    ],
    quiz: [
      {
        id: "q1",
        question: "Why should you treat paper trades with the same seriousness as real trades?",
        type: "multiple-choice",
        options: ["Because paper trading results count toward your brokerage account", "Because the habits you build in paper trading are the habits you bring to live trading", "Because paper trading has real tax implications", "Because your broker monitors paper trading performance"],
        correct: 1,
        explanation: "Habits are formed through repetition. If you practice sloppy, undisciplined paper trading, those habits follow you into live trading. The goal is to build process discipline — not just to win fake money."
      },
      {
        id: "q2",
        question: "Before entering a paper trade, you MUST write down: (select the complete list)",
        type: "multiple-choice",
        options: ["Just the entry price", "Entry, stop loss, and target", "Entry, stop, target, setup type, and trade thesis", "Entry, target, and the name of the company"],
        correct: 2,
        explanation: "A complete pre-trade plan includes: setup type, entry price and reason, stop loss level and reason, targets (T1 and T2), and a brief thesis. Partial plans lead to partial discipline."
      },
      {
        id: "q3",
        question: "True or False: After 5 profitable paper trades in a row, you're ready for live trading.",
        type: "true-false",
        options: ["True", "False"],
        correct: 1,
        explanation: "False. Five trades is a tiny statistical sample. You need a minimum of 30+ paper trades across different market conditions — trending markets, choppy markets, news days — to have meaningful data about your edge. Readiness comes from the Final Readiness Test in Module 10."
      },
      {
        id: "q4",
        question: "You enter a paper trade that hits your stop loss. What is the MOST important thing to do after?",
        type: "multiple-choice",
        options: ["Immediately re-enter hoping it reverses", "Log the trade, note what happened, and identify what (if anything) you would do differently", "Ignore it — it was just paper money", "Double your position size on the next trade to recover"],
        correct: 1,
        explanation: "Losing trades are your most valuable learning opportunities. Log them immediately: what was the setup, did you follow your plan, did the stop level make technical sense? Each loss should teach something."
      }
    ],
    passingScore: 75
  }
];

export type ModuleStatus = "locked" | "unlocked" | "completed";

export interface ModuleInfo {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  lessonId: string;
}

export const MODULES: ModuleInfo[] = LESSONS.map(l => ({
  id: l.moduleId,
  number: l.moduleNumber,
  title: l.title,
  subtitle: l.subtitle,
  icon: l.icon,
  color: l.color,
  lessonId: l.id
}));
