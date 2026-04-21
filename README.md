# SimVesto — AI-Powered Investment Simulation Platform

> **Trade Without Fear. Learn Without Risk.**

SimVesto is an advanced, gamified trading simulation platform designed to conquer the psychological barriers young investors face. It provides a **zero-risk, highly realistic virtual trading environment** augmented with Machine Learning models, Monte Carlo simulations, and AI-powered insights to teach financial literacy while eliminating investment anxiety.

---

## 🎯 The Problem

The modern stock market is highly accessible, yet fundamentally intimidating for beginners. Young and first-time investors face severe financial anxiety, leading to:
- **Analysis paralysis** (unable to make investment decisions)
- **Dangerous, uneducated gambles** (overconfident, risky trades)
- **Emotional decision-making** (panic selling, FOMO buying)

They lack a **safe, realistic environment** to:
- Practice managing emotions during market volatility
- Understand key market indicators (NIFTY, SENSEX, etc.)
- Build fundamentally sound portfolios
- Learn without risking real capital

The primary obstacle to wealth generation is **not access to trading platforms**, but the **fear of execution** stemming from a lack of practical experience.

---

## 💡 The Solution

SimVesto eliminates financial anxiety through a **zero-risk, highly realistic virtual trading terminal** with 100,000 "IQ Coins" for practice trading. The platform combines:

- **Realistic market simulation** using Geometric Brownian Motion
- **Real-time behavioral analysis** and fear quantification
- **AI-powered portfolio optimization** tailored to risk appetite
- **Live market sentiment analysis** from global news feeds
- **Intelligent counterparty matching** (the winning differentiator)

---

## 🏆 The Winning Feature: Behavioral Counterparty Matching

### **What It Does**
An innovative AI system that identifies investors with **opposite behavioral patterns** and **matches their trades directly**, allowing users to:
- Exit panic positions at fair market prices
- Find natural buyers/sellers aligned with their sentiment
- Eliminate market-maker spreads through peer-to-peer trading
- Learn from observing opposing investor psychology

### **Why It's Revolutionary**
✅ **Completely novel** — No fintech platform has this  
✅ **Mathematically elegant** — Based on behavioral psychology + market dynamics  
✅ **Actually profitable** — Reduces friction costs and emotional decision-making  
✅ **Educationally powerful** — Users learn by trading against similar investors  

---

## 🚀 Key Features

### **1. Market Intelligence & Sentiment Analysis**
- **FinBERT-powered News Sentinel**: Scans live global news feeds and calculates real-time market sentiment (bullish/bearish)
- Dynamic sentiment scoring influencing simulated asset prices
- Real-time alerts for market-moving news events

### **2. AI Portfolio Optimizer**
- Leverages Modern Portfolio Theory (MPT) and `scipy.optimize`
- Algorithmically balanced asset allocation strategies:
  - **Conservative**: Lower risk, steady growth
  - **Moderate**: Balanced approach
  - **Aggressive**: Higher risk, higher upside
- Personalized recommendations based on user risk appetite

### **3. Behavioral "Fear Score" Engine**
- Automatically analyzes trading behavior and decision patterns
- Generates quantifiable "Fear Score" (0-100)
- Triggers personalized badges and ML-driven coaching
- Tracks behavioral evolution over time

### **4. Market Anomaly Detection**
- `IsolationForest` ML model detecting unusual market patterns
- Real-time multi-variate analysis over WebSocket streams
- Instant visual alerts and market anomaly injections
- Simulates realistic market stress scenarios

### **5. Modern UI/UX**
- **Global Dark/Light Theme**: Seamless transitions via CSS variables
- **Dynamic "3D" Neumorphic Design**: Professional trading terminal aesthetics
- **Glossary Mode**: Gen-Z accessible finance jargon tooltips
- **Real-time Analytics Dashboard**: Comprehensive portfolio and performance tracking

---

## 🛠 Technical Architecture

### **Frontend Stack**
- **Framework**: React 19 with Vite V8 (lightning-fast dev server)
- **State Management**: Zustand (lightweight, powerful)
- **Data Visualization**: Recharts (interactive charts & analytics)
- **Styling**: Vanilla CSS with CSS variables (no dependencies)
  - Neumorphic 3D rendering for premium trading terminal feel
  - Real-time theme switching (Dark/Light mode)

### **Backend API** (`/backend`)
- **Runtime**: Node.js (v18+) with Express.js
- **Features**:
  - RESTful API for all trading operations
  - Authentication & authorization middleware
  - WebSocket support for real-time updates
  - Integration with LLM-powered chatbot (Groq)

### **ML Microservice** (`/ml_service`)
- **Framework**: FastAPI (Python)
- **Key Libraries**:
  - `transformers` (FinBERT for sentiment analysis)
  - `scikit-learn` (IsolationForest for anomaly detection)
  - `scipy` (optimization algorithms)
  - `yfinance` (real market data fallback)
  - `websockets` (real-time streaming)
- **Communication**: REST API + WebSocket streams

### **Simulation Engine** (`/src/engine`)
- **Custom `stockEngine.js`**: Geometric Brownian Motion simulation
- **Realistic price movements** with configurable volatility
- **Independent of external APIs** (works fully offline)
- **Deterministic randomness** for reproducible scenarios

---

## 📦 Project Structure

```
SimVesto/
├── src/                          # Frontend React application
│   ├── components/               # Reusable UI components
│   │   ├── analytics/           # Dashboard & charts
│   │   ├── fear/                # Fear score visualizations
│   │   └── ...
│   ├── pages/                   # Page components (Dashboard, Trade, etc.)
│   ├── services/                # API & WebSocket clients
│   ├── store/                   # Zustand state management
│   ├── engine/                  # Core simulation engines
│   │   ├── stockEngine.js       # Price simulation
│   │   ├── fearEngine.js        # Behavioral analysis
│   │   ├── counterpartyEngine.js# Matching algorithm
│   │   ├── monteCarlo.js        # Probability models
│   │   └── aiNarrator.js        # AI insights
│   ├── data/                    # Static data (glossary, etc.)
│   └── App.jsx, main.jsx        # Entry point
│
├── backend/                      # Node.js/Express API
│   ├── server.js                # Main server
│   ├── controllers/             # Route handlers
│   ├── models/                  # Data models (User, Portfolio, etc.)
│   ├── routes/                  # API routes
│   ├── middleware/              # Auth, validation
│   ├── config/                  # Database config
│   └── utils/                   # Helpers (coinLedger, etc.)
│
├── ml_service/                  # Python FastAPI microservice
│   ├── main.py                  # FastAPI app & WebSocket server
│   ├── behavior_model.py        # Behavioral analysis
│   ├── sentiment.py             # FinBERT sentiment analysis
│   ├── anomaly.py               # IsolationForest anomaly detection
│   ├── optimizer.py             # Portfolio optimization (MPT)
│   ├── sandbox.py               # Testing utilities
│   └── requirements.txt         # Python dependencies
│
└── Documentation files
    ├── README.md                # This file
    ├── THE_WINNING_FEATURE.md   # Counterparty matching explanation
    ├── BEHAVIORAL_MATCHING_*.md # Detailed matching mechanics
    └── SIMPLE_EXPLANATION.txt   # Quick-start guides
```

---

## 🚀 Quick Start

### **Prerequisites**
- **Node.js** v18 or higher
- **Python** 3.9 or higher (for ML service)
- **Git**

### **Installation & Setup**

**Terminal 1: Start the Node.js Backend**
```bash
cd backend
npm install
npm run dev
# Backend runs on http://localhost:5000
```

**Terminal 2: Start the Python ML Microservice**
```bash
cd ml_service
pip install -r requirements.txt
python -m uvicorn main:app --reload
# ML service runs on http://localhost:8000
```

**Terminal 3: Start the Frontend**
```bash
npm install
npm run dev
# Frontend runs on http://localhost:5173
```

### **Access the Application**
Navigate to **http://localhost:5173** in your browser.

---

## 🔑 API Configuration (Optional)

The platform operates fully **offline** using mock data. For enhanced features with real API data:

### **Google Gemini (Frontend Chatbot)**
1. Get a free API key at [Google AI Studio](https://aistudio.google.com/apikey)
2. In the app: Navigate to **Profile → Settings**
3. Paste your API key to enable AI-powered chatbot insights

### **Groq (Backend LLM)**
1. Create `.env` file in `/backend`:
   ```env
   GROQ_API_KEY=your_key_here
   GROQ_MODEL=llama-3.3-70b-versatile
   ```
2. Restart the backend server

### **NewsAPI (Real Market News)**
1. Get a free key at [NewsAPI.org](https://newsapi.org)
2. Add to `/ml_service/.env`:
   ```env
   NEWS_API_KEY=your_key_here
   ```
3. Restart ML service for live sentiment analysis

---

## 🎮 Using the Platform

### **Getting Started**
1. **Sign Up** with email and password
2. **Receive** 100,000 IQ Coins virtual currency
3. **Explore** the dashboard and understand your current holdings

### **Trading**
1. Navigate to the **Trade** page
2. **View** live simulated asset prices
3. **Analyze** price charts and market sentiment
4. **Execute** buy/sell orders
5. **Monitor** your behavioral Fear Score

### **Key Pages**
- **Dashboard**: Portfolio overview, net worth, performance
- **Trade**: Buy/sell stocks with real-time prices
- **Analytics**: Detailed performance charts and statistics
- **Portfolio**: View holdings, cost basis, gains/losses
- **Glossary**: Interactive finance education with tooltips
- **Arena**: Competitive trading scenarios
- **Advisor**: AI-powered portfolio recommendations
- **Chatbot**: Ask the AI any investment-related questions

---

## 📊 Core Metrics

- **Virtual Currency**: 100,000 IQ Coins per user
- **Simulated Assets**: 50+ stocks (NIFTY 50 + international stocks)
- **Market Hours**: 24/7 simulated trading (no real market hours constraint)
- **Latency**: <100ms real-time updates via WebSocket
- **Offline Support**: 100% functional without external APIs

---

## 🔬 Machine Learning Models

### **Sentiment Analysis (FinBERT)**
- Pre-trained on financial news and earnings calls
- Real-time classification: Bullish/Neutral/Bearish
- Confidence scores (0-1) for decision-making

### **Anomaly Detection (IsolationForest)**
- Monitors: Price volatility, volume, unusual patterns
- Detection threshold: Configurable sensitivity
- Response: Instant visual alerts + market shock simulation

### **Portfolio Optimization (Modern Portfolio Theory)**
- Input: Risk tolerance, available assets, historical returns
- Output: Optimal asset weights for three strategies
- Basis: Markowitz efficient frontier calculation

### **Behavioral Analysis (Custom Ensemble)**
- Tracks: Trade frequency, hold duration, loss-aversion bias
- Generates: Fear Score, behavioral flags, personalized badges
- Evolution: Updates daily based on trading activity

---

## 🎓 Educational Value

SimVesto teaches:
- **Technical Analysis**: Chart patterns, indicators, support/resistance
- **Fundamental Analysis**: P/E ratios, earnings, market news impact
- **Risk Management**: Portfolio diversification, position sizing
- **Behavioral Finance**: Emotional triggers, cognitive biases, Fear Score
- **Market Mechanics**: Order types, bid-ask spreads, volume analysis
- **Wealth Building**: Long-term investing vs. speculation

---

## 🤝 Contributing

Contributions are welcome! Areas for enhancement:
- Additional ML models (price prediction, clustering)
- More trading strategies and backtesting tools
- Mobile app version
- Real broker API integration
- International market support
- Advanced charting tools

---

## 📝 License

This project is provided as-is for educational and hackathon purposes.

---

## 👥 About

SimVesto is built to make investment education accessible, engaging, and anxiety-free for the next generation of investors. By combining cutting-edge AI, behavioral science, and game mechanics, we're transforming how people learn to invest.

**Ready to trade without fear?** Start your journey at [http://localhost:5173](http://localhost:5173)
- **ML Service (News API)**: Formulate a `.env` file within the `/ml_service` folder for live global news analysis:
  ```env
  NEWS_API_KEY=01c5c651841440f3ae52ff4bbaa63ff5
  ```

---

## Project Structure
```
SimVesto/
├── backend/               # Node/Express Groq Model Processor
├── ml_service/            # Python FastAPI ML Processing (FinBERT, Scipy, IsolationForest)
├── src/
│   ├── engine/            # The Brain (GBM, Monte Carlo, Fear Engine)
│   ├── store/             # Zustand State Configuration
│   ├── pages/             # Neumorphic Dashboard, Explore, AI Engine Views
│   ├── components/        # Toolbars, Glossary Highlighters, App Layouts
│   ├── App.jsx            # Dynamic Router 
│   └── index.css          # Core Global CSS variables, Dark Mode styles & Components
└── vite.config.js
```
