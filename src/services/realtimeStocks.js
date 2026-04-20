const REALTIME_BASE_URL = 'http://127.0.0.1:5000/api/stock';
const LIVE_SOURCE = 'live';
const FALLBACK_SOURCE = 'fallback';

const toFiniteNumber = (value, fallback = null) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const FRONTEND_TO_BACKEND_SYMBOL = {
  TCS: 'TCS.NS',
  RELIANCE: 'RELIANCE.NS',
  HDFCBANK: 'HDFCBANK.NS',
  INFY: 'INFY.NS',
  TATAMOTORS: 'TATAMOTORS.NS',
  SBIN: 'SBIN.NS',
  WIPRO: 'WIPRO.NS',
  SUNPHARMA: 'SUNPHARMA.NS',
  BHARTIARTL: 'BHARTIARTL.NS',
  ITC: 'ITC.NS',
  ADANIPORTS: 'ADANIPORTS.NS',
  MRF: 'MRF.NS',
  LTIM: 'LTIM.NS',
  DRREDDY: 'DRREDDY.NS',
  NTPC: 'NTPC.NS',
  BAJFINANCE: 'BAJFINANCE.NS',
  NESTLEIND: 'NESTLEIND.NS',
  ZOMATO: 'ZOMATO.NS',
  PAYTM: 'PAYTM.NS',
  CRYPTO: 'BTC-INR',
};

function normalizeQuote(data) {
  const sourceSymbol = String(data?.sourceSymbol || 'live');
  const sourceType = sourceSymbol.startsWith('fallback-') ? FALLBACK_SOURCE : LIVE_SOURCE;
  const currentPrice = toFiniteNumber(data?.price, null);
  const dayChange = toFiniteNumber(data?.change, 0);
  const apiDayChangePct = toFiniteNumber(data?.percent, null);

  if (!Number.isFinite(currentPrice)) {
    throw new Error('Invalid live quote payload: missing numeric price');
  }

  const derivedOpen = currentPrice - dayChange;
  const derivedDayChangePct = Number.isFinite(derivedOpen) && Math.abs(derivedOpen) > 0.000001
    ? (dayChange / derivedOpen) * 100
    : 0;
  const dayChangePct = Number.isFinite(apiDayChangePct) ? apiDayChangePct : derivedDayChangePct;

  return {
    currentPrice,
    dayChange,
    dayChangePct,
    sourceSymbol,
    sourceType,
  };
}

export async function fetchRealtimeStocks() {
  const listUrl = `${REALTIME_BASE_URL}/live`;
  try {
    const response = await fetch(listUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch live stocks: ${response.status}`);
    }

    const list = await response.json();
    if (!Array.isArray(list)) {
      throw new Error('Live stocks API returned invalid payload');
    }

    const mapped = {};
    for (const item of list) {
      if (item?.symbol) {
        mapped[item.symbol] = normalizeQuote(item);
      }
    }

    if (Object.keys(mapped).length > 0) {
      return mapped;
    }
  } catch {
    // Fall through to /api/stock fallback.
  }

  const fallbackUrl = `${REALTIME_BASE_URL}`;
  const fallbackResponse = await fetch(fallbackUrl);
  if (!fallbackResponse.ok) {
    throw new Error(`Failed to fetch fallback stocks: ${fallbackResponse.status}`);
  }
  const fallbackList = await fallbackResponse.json();
  if (!Array.isArray(fallbackList)) {
    throw new Error('Fallback stocks API returned invalid payload');
  }

  const fallbackMapped = {};
  for (const stock of fallbackList) {
    if (stock?.symbol) {
      fallbackMapped[stock.symbol] = {
        currentPrice: toFiniteNumber(stock.currentPrice, 0),
        dayChange: toFiniteNumber(stock.dayChange, 0),
        dayChangePct: toFiniteNumber(stock.dayChangePct, 0),
        sourceSymbol: 'fallback-db',
        sourceType: FALLBACK_SOURCE,
      };
    }
  }
  return fallbackMapped;
}

export async function fetchRealtimeStock(symbol) {
  const frontendSymbol = symbol;
  const fallbackSymbol = FRONTEND_TO_BACKEND_SYMBOL[symbol] || symbol;
  const candidates = [frontendSymbol, fallbackSymbol].filter((s, i, arr) => arr.indexOf(s) === i);
  const errors = [];

  for (const candidate of candidates) {
    const singleUrl = `${REALTIME_BASE_URL}/live/${encodeURIComponent(candidate)}`;
    try {
      const response = await fetch(singleUrl);
      if (response.ok) {
        const data = await response.json();
        return normalizeQuote(data);
      }
      errors.push(`${singleUrl} -> ${response.status}`);
    } catch (error) {
      errors.push(`${singleUrl} -> ${error?.message || 'network error'}`);
    }
  }

  throw new Error(`Failed to fetch ${symbol}. Tried: ${errors.join(' | ')}`);
}

export function mergeLivePrice(existingStock, liveData) {
  if (!existingStock) return existingStock;

  const now = Date.now();
  const sourceType = liveData?.sourceType || LIVE_SOURCE;
  const sourceSymbol = liveData?.sourceSymbol || 'live';
  const hasSeenLiveQuote = Boolean(existingStock.hasSeenLiveQuote || existingStock.lastQuoteSourceType === LIVE_SOURCE);
  const shouldApplyIncoming = sourceType === LIVE_SOURCE || !hasSeenLiveQuote;

  if (!shouldApplyIncoming) {
    return {
      ...existingStock,
      isDelayed: true,
      lastQuoteSourceType: sourceType,
      lastQuoteSourceSymbol: sourceSymbol,
      lastQuoteAttempt: now,
    };
  }

  const nextPrice = Number.isFinite(liveData.currentPrice) ? liveData.currentPrice : existingStock.currentPrice;
  const nextDayChange = Number.isFinite(liveData.dayChange) ? liveData.dayChange : existingStock.dayChange;
  const nextDayChangePct = Number.isFinite(liveData.dayChangePct) ? liveData.dayChangePct : existingStock.dayChangePct;

  const currentHistory = Array.isArray(existingStock.priceHistory) ? existingStock.priceHistory : [];
  const lastHistoryPoint = currentHistory.length > 0 ? currentHistory[currentHistory.length - 1] : null;
  const lastHistoryPrice = Number(lastHistoryPoint?.price);

  let adjustedHistory = currentHistory;

  // When source price scale changes sharply (e.g., mock -> live crypto),
  // rescale history so chart matches the live quote immediately.
  if (currentHistory.length > 0 && Number.isFinite(lastHistoryPrice) && lastHistoryPrice > 0) {
    const gapRatio = Math.abs(nextPrice - lastHistoryPrice) / lastHistoryPrice;
    if (gapRatio > 0.2) {
      const scale = nextPrice / lastHistoryPrice;
      adjustedHistory = currentHistory.map(point => ({
        ...point,
        price: Number((Number(point.price) * scale).toFixed(2)),
        open: Number((Number(point.open ?? point.price) * scale).toFixed(2)),
        high: Number((Number(point.high ?? point.price) * scale).toFixed(2)),
        low: Number((Number(point.low ?? point.price) * scale).toFixed(2)),
        close: Number((Number(point.close ?? point.price) * scale).toFixed(2)),
      }));
    }
  }

  const previousPrice = Number.isFinite(existingStock.currentPrice) ? existingStock.currentPrice : nextPrice;
  const livePoint = {
    time: Date.now(),
    price: Number(nextPrice.toFixed(2)),
    open: Number(previousPrice.toFixed(2)),
    high: Number(Math.max(previousPrice, nextPrice).toFixed(2)),
    low: Number(Math.min(previousPrice, nextPrice).toFixed(2)),
    close: Number(nextPrice.toFixed(2)),
    volume: adjustedHistory[adjustedHistory.length - 1]?.volume || 0,
  };

  const dayOpen = Number((nextPrice - nextDayChange).toFixed(2));
  const nextHistory = [...adjustedHistory.slice(-719), livePoint];

  return {
    ...existingStock,
    previousPrice,
    currentPrice: nextPrice,
    dayChange: nextDayChange,
    dayChangePct: nextDayChangePct,
    dayOpen: Number.isFinite(dayOpen) ? dayOpen : existingStock.dayOpen,
    dayHigh: Number(Math.max(existingStock.dayHigh ?? nextPrice, nextPrice).toFixed(2)),
    dayLow: Number(Math.min(existingStock.dayLow ?? nextPrice, nextPrice).toFixed(2)),
    priceHistory: nextHistory,
    hasSeenLiveQuote: sourceType === LIVE_SOURCE || hasSeenLiveQuote,
    isDelayed: sourceType !== LIVE_SOURCE,
    lastQuoteSourceType: sourceType,
    lastQuoteSourceSymbol: sourceSymbol,
    lastQuoteAttempt: now,
    lastLiveUpdate: sourceType === LIVE_SOURCE ? now : (existingStock.lastLiveUpdate || null),
    lastUpdate: now,
  };
}
