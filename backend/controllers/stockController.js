import Stock from '../models/Stock.js';
import yahooFinance from 'yahoo-finance2';

const yahooClient = new yahooFinance();
// Using the stocks list from the frontend's mock to initialize backend cache
const MOCK_STOCKS = [
  { symbol: 'IQTCS', currentPrice: 3800 },
  { symbol: 'IQREL', currentPrice: 2450 },
  { symbol: 'IQHDFC', currentPrice: 1650 },
  { symbol: 'IQINFY', currentPrice: 1500 },
  { symbol: 'IQTAT', currentPrice: 950 },
  { symbol: 'IQSBI', currentPrice: 780 },
  { symbol: 'IQWIP', currentPrice: 450 },
  { symbol: 'IQSUN', currentPrice: 1200 },
  { symbol: 'IQAIR', currentPrice: 1100 },
  { symbol: 'IQITC', currentPrice: 420 },
  { symbol: 'IQADNI', currentPrice: 1320 },
  { symbol: 'IQMRF', currentPrice: 12500 },
  { symbol: 'IQLTM', currentPrice: 5200 },
  { symbol: 'IQDRR', currentPrice: 5800 },
  { symbol: 'IQNTPC', currentPrice: 340 },
  { symbol: 'IQBAJ', currentPrice: 7200 },
  { symbol: 'IQNEST', currentPrice: 2400 },
  { symbol: 'IQZOM', currentPrice: 185 },
  { symbol: 'IQPAY', currentPrice: 650 },
  { symbol: 'IQCRYP', currentPrice: 250 },
];

const MOCK_STOCK_MAP = MOCK_STOCKS.reduce((acc, s) => {
  acc[s.symbol] = s.currentPrice;
  return acc;
}, {});

export const FRONTEND_TO_YAHOO_SYMBOLS = {
  IQTCS: ['TCS.NS'],
  IQREL: ['RELIANCE.NS'],
  IQHDFC: ['HDFCBANK.NS'],
  IQINFY: ['INFY.NS'],
  IQTAT: ['TMCV.NS', 'TMCV.BO', 'TATAMOTORS.NS', 'TATAMTRDVR.NS'],
  IQSBI: ['SBIN.NS'],
  IQWIP: ['WIPRO.NS'],
  IQSUN: ['SUNPHARMA.NS'],
  IQAIR: ['BHARTIARTL.NS'],
  IQITC: ['ITC.NS'],
  IQADNI: ['ADANIPORTS.NS'],
  IQMRF: ['MRF.NS'],
  IQLTM: ['LTIM.NS'],
  IQDRR: ['DRREDDY.NS'],
  IQNTPC: ['NTPC.NS'],
  IQBAJ: ['BAJFINANCE.NS'],
  IQNEST: ['NESTLEIND.NS'],
  IQZOM: ['ZOMATO.NS', 'ETERNAL.NS'],
  IQPAY: ['PAYTM.NS'],
  IQCRYP: ['BTC-INR'],
};

const BACKEND_TO_FRONTEND = Object.entries(FRONTEND_TO_YAHOO_SYMBOLS).reduce((acc, [frontend, candidates]) => {
  candidates.forEach((ticker) => {
    acc[ticker] = frontend;
  });
  return acc;
}, {});

const normalizeQuote = (symbol, quote) => {
  const price = quote?.regularMarketPrice ?? quote?.postMarketPrice ?? quote?.preMarketPrice;
  const change = quote?.regularMarketChange ?? 0;
  const percent = quote?.regularMarketChangePercent ?? 0;

  if (price === null || price === undefined) {
    throw new Error(`No market price available for symbol ${symbol}`);
  }

  return {
    symbol,
    price: Number(Number(price).toFixed(2)),
    change: Number(Number(change).toFixed(2)),
    percent: Number(Number(percent).toFixed(2)),
  };
};

const fetchLiveByYahooTicker = async (yahooTicker) => {
  const quote = await yahooClient.quote(yahooTicker);
  return normalizeQuote(yahooTicker, quote);
};

export const fetchLiveByFrontendSymbol = async (frontendSymbol) => {
  const candidates = FRONTEND_TO_YAHOO_SYMBOLS[frontendSymbol] || [frontendSymbol];
  let lastError = null;

  for (const ticker of candidates) {
    try {
      const live = await fetchLiveByYahooTicker(ticker);
      return {
        ...live,
        symbol: frontendSymbol,
        sourceSymbol: ticker,
      };
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error(`No valid quote found for ${frontendSymbol}`);
};

export const initializeStocks = async (req, res) => {
  try {
    for (const s of MOCK_STOCKS) {
      const exists = await Stock.findOne({ symbol: s.symbol });
      if (!exists) {
        await Stock.create(s);
      }
    }
    res.json({ message: 'Stocks initialized' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getStocks = async (req, res) => {
  try {
    const stocks = await Stock.find();
    res.json(stocks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getStockBySymbol = async (req, res) => {
  try {
    const stock = await Stock.findOne({ symbol: req.params.symbol });
    if (!stock) return res.status(404).json({ message: 'Stock not found' });
    res.json(stock);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getLiveStocks = async (req, res) => {
  try {
    const symbols = Object.keys(FRONTEND_TO_YAHOO_SYMBOLS);
    const settled = await Promise.allSettled(symbols.map((symbol) => fetchLiveByFrontendSymbol(symbol)));
    const live = [];

    for (let i = 0; i < settled.length; i++) {
      const result = settled[i];
      const symbol = symbols[i];

      if (result.status === 'fulfilled') {
        live.push(result.value);
        continue;
      }

      const dbStock = await Stock.findOne({ symbol });
      if (dbStock) {
        live.push({
          symbol: dbStock.symbol,
          price: Number(Number(dbStock.currentPrice || 0).toFixed(2)),
          change: 0,
          percent: 0,
          sourceSymbol: 'fallback-db',
        });
      } else if (MOCK_STOCK_MAP[symbol] !== undefined) {
        live.push({
          symbol,
          price: Number(Number(MOCK_STOCK_MAP[symbol]).toFixed(2)),
          change: 0,
          percent: 0,
          sourceSymbol: 'fallback-mock',
        });
      }
    }

    if (live.length === 0) {
      const fallbackStocks = await Stock.find();
      const fallback = fallbackStocks.map((s) => ({
        symbol: s.symbol,
        price: Number(Number(s.currentPrice || 0).toFixed(2)),
        change: 0,
        percent: 0,
        sourceSymbol: 'fallback-db',
      }));
      if (fallback.length === 0) {
        const mockFallback = Object.keys(MOCK_STOCK_MAP).map((symbol) => ({
          symbol,
          price: Number(Number(MOCK_STOCK_MAP[symbol]).toFixed(2)),
          change: 0,
          percent: 0,
          sourceSymbol: 'fallback-mock',
        }));
        return res.json(mockFallback);
      }
      return res.json(fallback);
    }

    res.json(live);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getLiveStockBySymbol = async (req, res) => {
  try {
    const incoming = (req.params.symbol || '').toUpperCase();
    const frontendSymbol = FRONTEND_TO_YAHOO_SYMBOLS[incoming]
      ? incoming
      : (BACKEND_TO_FRONTEND[incoming] || incoming);

    try {
      const live = await fetchLiveByFrontendSymbol(frontendSymbol);
      return res.json(live);
    } catch (liveError) {
      const dbStock = await Stock.findOne({ symbol: frontendSymbol });
      if (dbStock) {
        return res.json({
          symbol: dbStock.symbol,
          price: Number(Number(dbStock.currentPrice || 0).toFixed(2)),
          change: 0,
          percent: 0,
          sourceSymbol: 'fallback-db',
        });
      }

      if (MOCK_STOCK_MAP[frontendSymbol] !== undefined) {
        return res.json({
          symbol: frontendSymbol,
          price: Number(Number(MOCK_STOCK_MAP[frontendSymbol]).toFixed(2)),
          change: 0,
          percent: 0,
          sourceSymbol: 'fallback-mock',
        });
      }
      throw liveError;
    }
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

// Simulate live price updates
export const updatePricesRandomly = async () => {
    try {
        const stocks = await Stock.find();
        for (const stock of stocks) {
            // Random change between -2% and +2%
            const changePct = (Math.random() * 0.04) - 0.02;
            stock.currentPrice = stock.currentPrice * (1 + changePct);
            stock.lastUpdated = Date.now();
            await stock.save();
        }
    } catch(err) {
        console.error("Error updating prices", err);
    }
}
