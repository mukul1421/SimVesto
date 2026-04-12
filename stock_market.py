import yfinance as yf
from fastapi import FastAPI
from fastapi import HTTPException
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

FRONTEND_TO_BACKEND_SYMBOL = {
    "IQTCS": "TCS.NS",
    "IQREL": "RELIANCE.NS",
    "IQHDFC": "HDFCBANK.NS",
    "IQINFY": "INFY.NS",
    "IQTAT": "TATAMOTORS.NS",
    "IQSBI": "SBIN.NS",
    "IQWIP": "WIPRO.NS",
    "IQSUN": "SUNPHARMA.NS",
    "IQAIR": "BHARTIARTL.NS",
    "IQITC": "ITC.NS",
    "IQADNI": "ADANIPORTS.NS",
    "IQMRF": "MRF.NS",
    "IQLTM": "LTIM.NS",
    "IQDRR": "DRREDDY.NS",
    "IQNTPC": "NTPC.NS",
    "IQBAJ": "BAJFINANCE.NS",
    "IQNEST": "NESTLEIND.NS",
    "IQZOM": "ZOMATO.NS",
    "IQPAY": "PAYTM.NS",
    "IQCRYP": "BTC-INR",
}


def get_quote(symbol: str):
    stock = yf.Ticker(symbol)

    price = None
    previous_close = None

    # Prefer fast_info to avoid quoteSummary/info 404 issues.
    try:
        fast_info = stock.fast_info
        price = fast_info.get("lastPrice") or fast_info.get("regularMarketPrice")
        previous_close = fast_info.get("previousClose")
    except Exception:
        pass

    # Fallback to daily close history when fast_info is unavailable.
    if price is None or previous_close is None:
        try:
            history = stock.history(period="5d", interval="1d", auto_adjust=False)
            if not history.empty:
                closes = history["Close"].dropna()
                if price is None and len(closes) >= 1:
                    price = float(closes.iloc[-1])
                if previous_close is None and len(closes) >= 2:
                    previous_close = float(closes.iloc[-2])
        except Exception:
            pass

    if price is None:
        raise ValueError(f"No market data available for symbol: {symbol}")

    if previous_close in (None, 0):
        change = 0
        percent = 0
    else:
        change = float(price) - float(previous_close)
        percent = (change / float(previous_close)) * 100

    return {
        "symbol": symbol,
        "price": round(float(price), 2),
        "change": round(change, 2),
        "percent": round(percent, 2)
    }

@app.get("/stock/{symbol}")
def get_stock(symbol: str):
    try:
        return get_quote(symbol)
    except Exception as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@app.get("/stocks")
def get_stocks():
    quotes = []
    for backend_symbol in FRONTEND_TO_BACKEND_SYMBOL.values():
        try:
            quote = get_quote(backend_symbol)
            if quote.get("price") is not None:
                quotes.append(quote)
        except Exception:
            continue
    return quotes

