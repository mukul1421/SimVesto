import Portfolio from '../models/Portfolio.js';
import Stock from '../models/Stock.js';
import Transaction from '../models/Transaction.js';
import User from '../models/User.js';

export const getPortfolio = async (req, res) => {
  try {
    let portfolio = await Portfolio.findOne({ userId: req.user._id });
    if (!portfolio) {
      portfolio = await Portfolio.create({ userId: req.user._id, assets: [] });
    }

    // Calculate current value dynamically
    let totalValue = 0;
    const enrichedAssets = [];

    for (const asset of portfolio.assets) {
      const stock = await Stock.findOne({ symbol: asset.symbol });
      const currentPrice = stock ? stock.currentPrice : 0;
      const currentValue = currentPrice * asset.quantity;
      totalValue += currentValue;
      
      enrichedAssets.push({
        ...asset.toObject(),
        currentPrice,
        currentValue,
        returnPct: asset.avgBuyPrice > 0 ? ((currentPrice - asset.avgBuyPrice) / asset.avgBuyPrice) * 100 : 0
      });
    }

    res.json({ 
      assets: enrichedAssets,
      totalValue
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const analyzePortfolioWithGroq = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);
    const portfolio = await Portfolio.findOne({ userId });
    const transactions = await Transaction.find({ userId }).sort({ timestamp: -1 }).limit(30).lean();
    const depth = parseInt(req.query.depth || '1', 10);

    if (!portfolio || !portfolio.assets || portfolio.assets.length === 0) {
      return res.json({ 
        analysis: 'Your portfolio is empty yet. Start trading to get AI-powered insights!' 
      });
    }

    // Enrich portfolio with current prices
    let totalInvested = 0;
    let totalCurrent = 0;
    const enrichedAssets = [];

    for (const asset of portfolio.assets) {
      const stock = await Stock.findOne({ symbol: asset.symbol });
      const currentPrice = stock ? stock.currentPrice : asset.avgBuyPrice;
      const investedValue = asset.quantity * asset.avgBuyPrice;
      const currentValue = asset.quantity * currentPrice;
      
      totalInvested += investedValue;
      totalCurrent += currentValue;

      enrichedAssets.push({
        symbol: asset.symbol,
        quantity: asset.quantity,
        avgBuyPrice: asset.avgBuyPrice,
        currentPrice,
        investedValue: parseFloat(investedValue.toFixed(2)),
        currentValue: parseFloat(currentValue.toFixed(2)),
        pnl: parseFloat((currentValue - investedValue).toFixed(2)),
        pnlPct: asset.avgBuyPrice > 0 ? ((currentPrice - asset.avgBuyPrice) / asset.avgBuyPrice * 100).toFixed(2) : 0,
      });
    }

    const totalPnL = totalCurrent - totalInvested;
    const totalPnLPct = totalInvested > 0 ? ((totalCurrent - totalInvested) / totalInvested * 100).toFixed(2) : 0;

    // Calculate trading stats
    const totalTrades = transactions.length;
    const winningTrades = transactions.filter(t => t.type === 'SELL' && t.realizedPnl > 0).length;
    const winRate = totalTrades > 0 ? ((winningTrades / totalTrades) * 100).toFixed(1) : 0;
    const avgTradeSize = transactions.length > 0 
      ? (transactions.reduce((sum, t) => sum + (t.totalAmount || 0), 0) / transactions.length).toFixed(0)
      : 0;

    // Build Groq prompt based on depth
    let prompt = '';
    
    if (depth === 1) {
      prompt = `You are SimVesto's portfolio analyst. Provide comprehensive but professional analysis.

Profile: Win Rate ${winRate}% | Risk Level: ${user?.fearScore}/100 | Holdings: ${portfolio.assets.length}
P&L: ₹${totalPnL.toFixed(2)} (${totalPnLPct}%)
Total Trades: ${totalTrades} | Avg Trade Size: ₹${avgTradeSize}

Holdings: ${enrichedAssets.map(a => `${a.symbol} (${a.pnlPct}%)`).join(', ')}

Recent activity: ${transactions.slice(0, 3).map(t => `${t.type} ${t.symbol} ₹${t.totalAmount}`).join(' | ')}

Provide exactly 6 detailed sections (100-120 words total, balanced):

1. PORTFOLIO HEALTH - Current status and balance assessment
2. DIVERSIFICATION - How well spread across sectors/positions
3. WIN PATTERN - What's working in their trades (identify strengths)
4. RISK FACTOR - Main vulnerability or concern
5. TREND ANALYSIS - Where they're heading based on recent activity
6. NEXT MOVES - 2-3 specific, actionable recommendations

Use **bold** for emphasis. Professional, data-driven tone. Include specifics like ₹ amounts and percentages.`;
    } else if (depth === 2) {
      prompt = `You are SimVesto's advanced portfolio analyst. Provide DEEPER analysis than the first review.

Profile: Win Rate ${winRate}% | Risk Level: ${user?.fearScore}/100 | Holdings: ${portfolio.assets.length}
P&L: ₹${totalPnL.toFixed(2)} (${totalPnLPct}%)
Total Trades: ${totalTrades} | Avg Trade Size: ₹${avgTradeSize}

Holdings: ${enrichedAssets.map(a => `${a.symbol} (${a.pnlPct}%)`).join(', ')}

Recent activity: ${transactions.slice(0, 5).map(t => `${t.type} ${t.symbol} ₹${t.totalAmount}`).join(' | ')}

Focus on ADVANCED INSIGHTS (NOT repeating basic analysis):

1. SECTOR CORRELATION - How holdings move together; concentration risks
2. BEHAVIORAL PSYCHOLOGY - Emotional patterns in their trading history (over-trading, panic-selling, FOMO)
3. VOLATILITY EXPOSURE - High vs low beta assets; portfolio std dev implications
4. OPPORTUNITY GAPS - What sectors/asset types they're missing that fit their risk profile
5. MARGIN SAFETY - If using leverage, exposure assessment; if not, potential leverage opportunities
6. PSYCHOLOGICAL MILESTONES - Past mistakes to avoid; behavioral targets for next 3 months

Use **bold** for key metrics. Technical, forward-thinking analysis. 150+ words for deeper coverage.`;
    } else if (depth >= 3) {
      prompt = `You are SimVesto's expert portfolio strategist providing EXPERT-LEVEL analysis.

Profile: Win Rate ${winRate}% | Risk Level: ${user?.fearScore}/100 | Holdings: ${portfolio.assets.length}
P&L: ₹${totalPnL.toFixed(2)} (${totalPnLPct}%)
Total Trades: ${totalTrades} | Avg Trade Size: ₹${avgTradeSize}

Holdings: ${enrichedAssets.map(a => `${a.symbol} (${a.pnlPct}%)`).join(', ')}

Recent activity: ${transactions.slice(0, 8).map(t => `${t.type} ${t.symbol} ₹${t.totalAmount}`).join(' | ')}

Provide EXPERT-LEVEL insights (go deeper than previous levels):

1. MACRO-MICRO ALIGNMENT - How their portfolio aligns with current market cycles & economic indicators
2. HIDDEN CORRELATIONS - Complex relationships between their holdings; hidden concentration risks
3. TAX OPTIMIZATION - Tax-loss harvesting opportunities; long-term vs short-term gain planning
4. ALGORITHMIC PATTERNS - Unusual trading patterns or anomalies; potential triggers for impulsive decisions
5. RISK DECOMPOSITION - Break down portfolio risk into component factors (market, sector, idiosyncratic)
6. WEALTH TRAJECTORY - Realistic wealth projection based on current win rate, capital, and risk tolerance

Use **bold** for discoveries. Sophisticated analysis with specific mathematical insights. 180+ words.`;
    }

    // Call Groq API
    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'user',
            content: prompt,
          }
        ],
        temperature: 0.7 + (depth * 0.1),
        max_tokens: 1200 + (depth * 200),
      }),
    });

    if (!groqResponse.ok) {
      const errorData = await groqResponse.json();
      console.error('Groq API error:', errorData);
      throw new Error(errorData.error?.message || 'Groq API request failed');
    }

    const groqData = await groqResponse.json();
    const analysis = groqData.choices?.[0]?.message?.content || 'Could not generate analysis. Please try again.';

    res.json({
      analysis,
      depth,
      portfolio: {
        totalInvested,
        totalCurrent,
        totalPnL,
        totalPnLPct,
        holdings: enrichedAssets,
      },
      stats: {
        totalTrades,
        winRate,
        avgTradeSize,
      }
    });
  } catch (error) {
    console.error('Portfolio analysis error:', error);
    res.status(500).json({ 
      message: error.message || 'Failed to analyze portfolio',
      analysis: 'Error generating AI analysis. Please try again.'
    });
  }
};
