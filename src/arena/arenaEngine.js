// ══════════════════════════════════════════════════════
//  Trading Arena Engine
//  GBM price simulation, event generation, behavior scoring
// ══════════════════════════════════════════════════════

// ── Geometric Brownian Motion tick ──────────────────────────────
export function gbmTick(price, drift, volatility, dt = 1 / 252) {
  const z = randomNormal();
  const factor = Math.exp((drift - 0.5 * volatility * volatility) * dt + volatility * Math.sqrt(dt) * z);
  return Math.max(price * factor, 0.01);
}

// Box–Muller standard normal variate
function randomNormal() {
  let u, v, s;
  do {
    u = Math.random() * 2 - 1;
    v = Math.random() * 2 - 1;
    s = u * u + v * v;
  } while (s >= 1 || s === 0);
  return u * Math.sqrt((-2 * Math.log(s)) / s);
}

// ── Initialize Arena Stocks ──────────────────────────────────────
export function initArenaStocks(scenario) {
  return scenario.stocks.map((s, idx) => ({
    id: idx,
    symbol: s.symbol,
    name: s.name,
    sector: s.sector,
    currentPrice: s.price,
    startPrice: s.price,
    priceHistory: [s.price],
    drift: scenario.drift + (Math.random() - 0.5) * 0.0003,
    volatility: scenario.volatility + (Math.random() - 0.5) * 0.005,
    holdings: 0,
    avgBuyPrice: 0,
  }));
}

// ── Tick all stock prices ────────────────────────────────────────
export function tickAllStocks(stocks, eventMultiplier = 1) {
  return stocks.map(s => {
    const rawDrift = s.drift * eventMultiplier;
    const rawVol = s.volatility * Math.abs(eventMultiplier);
    const newPrice = gbmTick(s.currentPrice, rawDrift, rawVol, 1 / 10000);
    const clamped = Math.max(newPrice, s.startPrice * 0.05);
    return {
      ...s,
      currentPrice: parseFloat(clamped.toFixed(2)),
      priceHistory: [...s.priceHistory, clamped].slice(-200),
    };
  });
}

// ── Market Events ────────────────────────────────────────────────
const EVENT_TYPES = [
  {
    id: 'rally',
    label: '🚀 MARKET RALLY',
    description: 'Institutional buying detected — prices surging across sectors.',
    severity: 'positive',
    driftMultiplier: 4,
    volumeSpike: true,
    probability: 0.12,
  },
  {
    id: 'dip',
    label: '📉 SUDDEN DIP',
    description: 'Sudden sell-off triggered. Weak hands exiting positions.',
    severity: 'negative',
    driftMultiplier: -3,
    volumeSpike: true,
    probability: 0.14,
  },
  {
    id: 'news_positive',
    label: '📰 BULLISH NEWS',
    description: 'Analyst upgrades sector outlook. Q3 earnings beat expectations.',
    severity: 'positive',
    driftMultiplier: 2.5,
    volumeSpike: false,
    probability: 0.1,
  },
  {
    id: 'news_negative',
    label: '⚠️ BEARISH NEWS',
    description: 'Regulatory concerns flash. Market sentiment turns cautious.',
    severity: 'negative',
    driftMultiplier: -2,
    volumeSpike: false,
    probability: 0.1,
  },
  {
    id: 'rumor',
    label: '🔮 UNVERIFIED RUMOR',
    description: 'Whispers of a major acquisition spreading. Unconfirmed.',
    severity: 'neutral',
    driftMultiplier: 1.8,
    volumeSpike: false,
    probability: 0.08,
  },
  {
    id: 'crash',
    label: '💥 MINI CRASH',
    description: 'Circuit breaker triggered. Panic selling in progress.',
    severity: 'danger',
    driftMultiplier: -5,
    volumeSpike: true,
    probability: 0.06,
  },
  {
    id: 'volatility_spike',
    label: '⚡ VOLATILITY SPIKE',
    description: 'VIX surges. Market is entering high-uncertainty territory.',
    severity: 'negative',
    driftMultiplier: -1,
    volumeSpike: true,
    probability: 0.1,
  },
  {
    id: 'recovery',
    label: '💚 RECOVERY SIGNAL',
    description: 'Oversold conditions. Smart money re-entering market.',
    severity: 'positive',
    driftMultiplier: 3,
    volumeSpike: false,
    probability: 0.1,
  },
];

export function maybeGenerateEvent(elapsedPct, scenarioProbability) {
  // More events appear as session progresses
  const timeBoost = 0.5 + elapsedPct * 1.5;
  const baseRoll = Math.random();
  if (baseRoll > scenarioProbability * timeBoost * 0.06) return null;

  // Pick weighted event
  const totalWeight = EVENT_TYPES.reduce((sum, e) => sum + e.probability, 0);
  let roll = Math.random() * totalWeight;
  for (const evt of EVENT_TYPES) {
    roll -= evt.probability;
    if (roll <= 0) return { ...evt, timestamp: Date.now(), id: `${evt.id}-${Date.now()}` };
  }
  return null;
}

// ── Buy / Sell Logic (arena-sandboxed) ──────────────────────────
export function arenaBuy(stocks, stockId, quantity, balance) {
  const stock = stocks.find(s => s.id === stockId);
  if (!stock) return { success: false, message: 'Stock not found' };
  const cost = stock.currentPrice * quantity;
  if (cost > balance) return { success: false, message: 'Insufficient balance' };

  const newStocks = stocks.map(s => {
    if (s.id !== stockId) return s;
    const totalQty = s.holdings + quantity;
    const newAvg = totalQty === quantity
      ? stock.currentPrice
      : (s.avgBuyPrice * s.holdings + stock.currentPrice * quantity) / totalQty;
    return { ...s, holdings: totalQty, avgBuyPrice: parseFloat(newAvg.toFixed(2)) };
  });

  return {
    success: true,
    stocks: newStocks,
    newBalance: parseFloat((balance - cost).toFixed(2)),
    cost,
  };
}

export function arenaSell(stocks, stockId, quantity, balance) {
  const stock = stocks.find(s => s.id === stockId);
  if (!stock) return { success: false, message: 'Stock not found' };
  if (stock.holdings < quantity) return { success: false, message: 'Insufficient holdings' };

  const saleValue = stock.currentPrice * quantity;
  const pnl = (stock.currentPrice - stock.avgBuyPrice) * quantity;

  const newStocks = stocks.map(s => {
    if (s.id !== stockId) return s;
    const newQty = s.holdings - quantity;
    return { ...s, holdings: newQty, avgBuyPrice: newQty === 0 ? 0 : s.avgBuyPrice };
  });

  return {
    success: true,
    stocks: newStocks,
    newBalance: parseFloat((balance + saleValue).toFixed(2)),
    saleValue,
    pnl,
  };
}

// ── Portfolio Value ──────────────────────────────────────────────
export function computePortfolioValue(stocks, cashBalance) {
  const holdingsValue = stocks.reduce((sum, s) => sum + s.holdings * s.currentPrice, 0);
  return {
    holdingsValue: parseFloat(holdingsValue.toFixed(2)),
    totalValue: parseFloat((holdingsValue + cashBalance).toFixed(2)),
    cashBalance: parseFloat(cashBalance.toFixed(2)),
  };
}

export function computePnL(stocks, startBalance, cashBalance) {
  const portfolio = computePortfolioValue(stocks, cashBalance);
  const pnl = portfolio.totalValue - startBalance;
  const pnlPct = ((pnl / startBalance) * 100);
  return {
    pnl: parseFloat(pnl.toFixed(2)),
    pnlPct: parseFloat(pnlPct.toFixed(2)),
    totalValue: portfolio.totalValue,
  };
}

// ── Behavior Scoring ─────────────────────────────────────────────
export function scoreBehavior(actions, stocks, startBalance, finalBalance, scenario, sessionDurationMs) {
  const totalActions = actions.length;
  const buyActions = actions.filter(a => a.type === 'BUY');
  const sellActions = actions.filter(a => a.type === 'SELL');
  const holdActions = actions.filter(a => a.type === 'HOLD');

  // Detect panic selling: sell within 5s of a negative event
  const panicSells = actions.filter(a => a.type === 'SELL' && a.afterNegativeEvent && a.hesitationMs < 5000);

  // Detect overtrading: >8 actions per minute
  const actionsPerMin = (totalActions / (sessionDurationMs / 60000));
  const overtrading = actionsPerMin > 8;

  // Detect hesitation: avg decision time > 30s
  const avgHesitation = totalActions > 0
    ? actions.reduce((sum, a) => sum + (a.hesitationMs || 0), 0) / totalActions
    : 0;
  const hesitant = avgHesitation > 30000;

  // Diversification: held 3+ different stocks
  const uniqueStocksBought = new Set(buyActions.map(a => a.stockId)).size;
  const diversified = uniqueStocksBought >= 3;

  // PnL performance
  const { pnl, pnlPct } = computePnL(stocks, startBalance, finalBalance);
  const profitable = pnl > 0;

  // Max drawdown
  const allPortfolioValues = actions.map(a => a.portfolioValue || startBalance);
  const maxVal = Math.max(startBalance, ...allPortfolioValues);
  const minVal = Math.min(...allPortfolioValues, finalBalance + stocks.reduce((s, st) => s + st.holdings * st.currentPrice, 0));
  const maxDrawdownPct = maxVal > 0 ? ((maxVal - minVal) / maxVal * 100) : 0;

  // Behavior tags
  const tags = [];
  if (panicSells.length >= 2) tags.push({ label: 'Panic Seller', color: '#ff0040', icon: '😱' });
  if (overtrading) tags.push({ label: 'Overtrade Risk', color: '#ff6b00', icon: '⚡' });
  if (hesitant) tags.push({ label: 'Hesitant', color: '#f59e0b', icon: '🕰️' });
  if (diversified) tags.push({ label: 'Diversified', color: '#00ff88', icon: '🌐' });
  if (pnlPct > 10) tags.push({ label: 'High Performer', color: '#00f5ff', icon: '🏆' });
  if (holdActions.length > 0) tags.push({ label: 'Disciplined Hold', color: '#34d399', icon: '🧘' });
  if (panicSells.length === 0 && scenario.id === 'panic') tags.push({ label: 'Panic Conquered', color: '#c084fc', icon: '💜' });
  if (buyActions.length === 0) tags.push({ label: 'Overly Cautious', color: '#94a3b8', icon: '🐢' });

  // Star rating (0–5, with 0.5 increments)
  let rawScore = 0;
  if (profitable) rawScore += 2;
  else if (pnlPct > -10) rawScore += 1;
  if (diversified) rawScore += 1;
  if (!overtrading) rawScore += 0.5;
  if (panicSells.length === 0) rawScore += 0.5;
  if (!hesitant) rawScore += 0.5;
  if (maxDrawdownPct < 20) rawScore += 0.5;
  if (totalActions >= 3) rawScore += 0.5;

  const stars = Math.min(5, Math.max(0.5, parseFloat(rawScore.toFixed(1))));

  // Coin reward
  let coinReward = 0;
  if (stars >= 5) coinReward = 750;
  else if (stars >= 4) coinReward = 400;
  else if (stars >= 3) coinReward = 200;

  // Fear delta (negative = reducing fear)
  const fearDelta = stars >= 5 ? -8 : stars >= 4 ? -5 : stars >= 3 ? -3 : 0;

  return {
    stars,
    coinReward,
    fearDelta,
    tags,
    pnl,
    pnlPct,
    maxDrawdownPct: parseFloat(maxDrawdownPct.toFixed(1)),
    totalActions,
    buyCount: buyActions.length,
    sellCount: sellActions.length,
    holdCount: holdActions.length,
    panicSellCount: panicSells.length,
    diversificationScore: uniqueStocksBought,
    avgDecisionMs: parseFloat(avgHesitation.toFixed(0)),
    actionsPerMin: parseFloat(actionsPerMin.toFixed(1)),
  };
}

// ── Gemini Arena Feedback ────────────────────────────────────────
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

export async function generateArenaFeedback({ apiKey, scoreResult, scenario, onToken }) {
  const prompt = buildArenaPrompt(scoreResult, scenario);

  const streamFeedback = async (text) => {
    if (onToken) {
      for (let i = 0; i < text.length; i++) {
        await new Promise(r => setTimeout(r, 10 + Math.random() * 12));
        onToken(text.slice(0, i + 1));
      }
    }
    return text;
  };

  if (!apiKey) return streamFeedback(getFallbackFeedback(scoreResult, scenario));

  try {
    const res = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.8, maxOutputTokens: 350 },
      }),
    });
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || getFallbackFeedback(scoreResult, scenario);
    return streamFeedback(text);
  } catch {
    return streamFeedback(getFallbackFeedback(scoreResult, scenario));
  }
}

function buildArenaPrompt(result, scenario) {
  const tagNames = result.tags.map(t => t.label).join(', ');
  return `You are SimVesto's Trading Arena AI coach. A user just completed a ${scenario.role} simulation.

Session Results:
- Role: ${scenario.role} (${scenario.id})
- P&L: ${result.pnlPct > 0 ? '+' : ''}${result.pnlPct}%
- Stars earned: ${result.stars}/5
- Behavioral tags: ${tagNames || 'None detected'}
- Total decisions: ${result.totalActions} (${result.buyCount} buys, ${result.sellCount} sells, ${result.holdCount} holds)
- Panic sells: ${result.panicSellCount}
- Diversification score: ${result.diversificationScore} unique stocks
- Max drawdown: ${result.maxDrawdownPct}%
- Avg decision time: ${Math.round(result.avgDecisionMs / 1000)}s
- Actions/min: ${result.actionsPerMin}

Write a performance debrief in exactly 3 parts:
1. ONE sentence: What they did well (find something positive, even if minor)
2. ONE sentence: Their key weakness or behavioral pattern to work on
3. ONE sentence: A specific, actionable improvement suggestion for their next session

Be direct, insightful, and slightly tough-but-fair. Speak in second person. No emojis. Under 80 words total.`;
}

function getFallbackFeedback(result, scenario) {
  const { stars, pnlPct, panicSellCount, diversificationScore, totalActions } = result;

  if (stars >= 4) {
    return `You showed excellent composure under pressure, making ${totalActions} well-timed decisions with strong results. Your main area to refine is holding positions through volatility instead of exiting early. Next session, try setting a mental stop-loss before entering a trade rather than deciding in the heat of the moment.`;
  }
  if (panicSellCount >= 2) {
    return `You showed the courage to enter the market which is the hardest step for new traders. However, panic selling cost you measurable returns — emotional decisions triggered by red candles. Next time, write down your exit strategy before you buy, so fear doesn't dictate your actions.`;
  }
  if (diversificationScore < 2) {
    return `You stayed focused and didn't overtrade, which shows discipline. The challenge is you concentrated too heavily in a single position, amplifying your risk exposure. Next session, try spreading investments across sectors — no more than 35% in one stock.`;
  }
  return `You completed the session with ${pnlPct > 0 ? 'modest gains' : 'some losses'} — every session is data. Your decision-making tempo was reasonable, but you could be more decisive when opportunities arise. Set a pre-session goal: at least 3 intentional trades with clear reasoning before each entry.`;
}

// ── Dynamic Scenario Generation (Gemini-powered) ─────────────────
const SCENARIO_COLORS = ['#00f5ff','#ff6b00','#c084fc','#ff0040','#00ff88','#fbbf24','#38bdf8','#fb7185'];
const EXCLUDED_ROLES = ['The Rookie','The Overconfident Trader','The Startup Founder','The Long-Term Investor','The Panic Seller'];

export async function generateScenarioDynamic({ apiKey, difficulty, userName, fearScore }) {
  if (!apiKey) return null;

  const color = SCENARIO_COLORS[Math.floor(Math.random() * SCENARIO_COLORS.length)];
  const driftRange = difficulty === 'easy' ? '0.0001 to 0.0004' :
                     difficulty === 'medium' ? '-0.0002 to 0.0003' :
                     '-0.0005 to 0.0001';
  const volRange = difficulty === 'easy' ? '0.012 to 0.020' :
                   difficulty === 'medium' ? '0.018 to 0.026' :
                   '0.025 to 0.038';
  const balRange = difficulty === 'easy' ? '4000 to 12000' :
                   difficulty === 'medium' ? '15000 to 35000' :
                   '5000 to 60000';

  const prompt = `You are generating a unique trader persona for a stock market simulation game.

Difficulty: ${difficulty}
Player name: ${userName || 'Trader'}
Player fear score (0-100, higher = more fearful): ${fearScore || 35}

Create a creative, real-world inspired trader identity. Avoid these roles: ${EXCLUDED_ROLES.join(', ')}.
Good examples: "The Crypto Convert", "The Divorce Settlement Investor", "The TikTok Finance Bro", "The Anxious Teacher", "The Retired Engineer", "The FOMO Chaser", "The Tax Refund Gambler", "The Influencer Investor", "The Inherited Wealth Kid", "The Day-Trading Pharmacist".

Return ONLY valid JSON with NO markdown fences:
{
  "role": "2-4 word role title",
  "avatar": "single emoji matching the character",
  "tagline": "one punchy sentence about their trading psychology",
  "startBalance": <integer in range ${balRange}>,
  "narrative": ["setup sentence 1", "setup sentence 2", "setup sentence 3", "goal sentence"],
  "goals": ["goal 1", "goal 2", "goal 3"],
  "constraints": ["constraint 1", "constraint 2"],
  "drift": <float in range ${driftRange}>,
  "volatility": <float in range ${volRange}>,
  "eventProbability": <float between 0.25 and 0.70>,
  "color": "${color}",
  "stocks": [
    {"name": "fictional company", "symbol": "3-4 LETTERS", "price": <50 to 2000>, "sector": "sector"},
    {"name": "fictional company", "symbol": "3-4 LETTERS", "price": <50 to 2000>, "sector": "sector"},
    {"name": "fictional company", "symbol": "3-4 LETTERS", "price": <50 to 2000>, "sector": "sector"}
  ]
}`;

  try {
    const res = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 1.1, maxOutputTokens: 700 },
      }),
    });
    const data = await res.json();
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return null;
    const sc = JSON.parse(match[0]);
    // Validate minimal fields
    if (!sc.role || !sc.stocks || sc.stocks.length < 2 || !sc.narrative) return null;
    sc.id = `dynamic_${Date.now()}`;
    sc.difficulty = difficulty;
    sc.color = sc.color || color;
    return sc;
  } catch {
    return null;
  }
}

