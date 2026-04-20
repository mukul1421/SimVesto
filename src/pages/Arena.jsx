import { useState, useEffect, useRef, useCallback } from 'react';
import useStore from '../store/useStore';
import { ARENA_SCENARIOS } from '../arena/arenaScenarios';
import {
  initArenaStocks, tickAllStocks, maybeGenerateEvent,
  arenaBuy, arenaSell, computePortfolioValue, computePnL,
  scoreBehavior, generateArenaFeedback, generateScenarioDynamic,
} from '../arena/arenaEngine';

// ─────────────────────────────────────────────────────────
//  CONSTANTS
// ─────────────────────────────────────────────────────────
const STEPS = { SPLASH: 0, DURATION: 1, DIFFICULTY: 2, SESSION: 3, RESULTS: 4 };

const DURATIONS = [
  { label: '2 MIN', seconds: 120 },
  { label: '5 MIN', seconds: 300 },
  { label: '10 MIN', seconds: 600 },
];

const DIFFICULTIES = [
  { id: 'easy', label: 'EASY', description: 'Stable markets. Good for learning the ropes.', color: '#00ff88', scenarios: ['beginner'] },
  { id: 'medium', label: 'MEDIUM', description: 'Moderate volatility. Steady hands required.', color: '#00f5ff', scenarios: ['founder', 'longterm'] },
  { id: 'hard', label: 'HARD', description: 'High volatility. Psychology under pressure.', color: '#ff6b00', scenarios: ['overconfident'] },
  { id: 'chaotic', label: 'CHAOTIC', description: 'Market crash mode. Only the fearless survive.', color: '#ff0040', scenarios: ['panic'] },
];

const NEWS_TEMPLATES = [
  'NIFTY 50 slides 1.2% as FII outflows accelerate — analysts warn of correction',
  'RBI holds repo rate; Governor signals data-dependent stance going ahead',
  'US Fed minutes show growing concern over inflation persistence — bonds sell off',
  'Sensex futures signal gap-down open; crude oil spikes 4% overnight',
  'SEBI tightens F&O margins — short-term volatility expected in derivatives',
  'IT sector leads gains as dollar strengthens; TCS, Infosys up 2%',
  'Institutional buying resumes in PSU banks — smart money accumulating',
  'Global markets rally on China stimulus hopes — EM stocks surge',
  'Options data shows heavy Put writing at 22,000 — bulls defend key level',
  'Mid-cap rally stalls as profit-booking hits retail favourites',
  'Rupee weakens past 84 — RBI intervenes to arrest slide',
  'PCE inflation data hotter-than-expected — rate cut bets pushed to Q4',
  'HDFC Bank Q3 results disappoint — stock gaps down 3% at open',
  'Promoter stake sale detected in 3 index heavyweights — watch for pressure',
  'VIX spikes 18% intraday — market pricing in elevated uncertainty',
  'Pharma sector outperforms as defensives attract risk-off flows',
  'Block deal: Foreign fund exits ₹1,200 Cr position in Reliance',
  'Cement stocks under pressure as input costs stay elevated',
  'Retail investor SIP inflows hit record ₹21,000 Cr — mutual funds stay net buyers',
  'Tech layoffs spark fear of demand slowdown — analyst downgrades cloud stocks',
];

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

// ─────────────────────────────────────────────────────────
//  SUB-COMPONENTS
// ─────────────────────────────────────────────────────────

// Starfield backdrop
const STARS = Array.from({ length: 140 }, (_, i) => ({
  id: i,
  left: Math.random() * 100,
  top: Math.random() * 100,
  size: 1 + Math.random() * 2.5,
  dur: 1.5 + Math.random() * 4,
  delay: Math.random() * 5,
  opacity: 0.2 + Math.random() * 0.8,
}));

const MONEY = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  left: Math.random() * 100,
  symbol: ['₹', '$', '💰', '🪙', '₿', '€'][Math.floor(Math.random() * 6)],
  size: 14 + Math.random() * 22,
  dur: 5 + Math.random() * 8,
  delay: Math.random() * 6,
}));

function StarField() {
  return (
    <div className="am-starfield" aria-hidden>
      {STARS.map(s => (
        <div key={s.id} className="am-star" style={{
          left: `${s.left}%`, top: `${s.top}%`,
          width: `${s.size}px`, height: `${s.size}px`,
          animationDuration: `${s.dur}s`,
          animationDelay: `${s.delay}s`,
          opacity: s.opacity,
        }} />
      ))}
    </div>
  );
}

function FloatingMoney() {
  return (
    <div className="am-money-field" aria-hidden>
      {MONEY.map(m => (
        <div key={m.id} className="am-money-particle" style={{
          left: `${m.left}%`,
          fontSize: `${m.size}px`,
          animationDuration: `${m.dur}s`,
          animationDelay: `${m.delay}s`,
        }}>{m.symbol}</div>
      ))}
    </div>
  );
}

// SVG sparkline
function SparkLine({ data, color = '#00f5ff', height = 80 }) {
  if (!data || data.length < 2) return <div style={{ height }} />;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * 300;
    const y = height - ((v - min) / range) * height * 0.9 - height * 0.05;
    return `${x},${y}`;
  });
  const pathD = `M${pts.join(' L')}`;
  const fillD = `${pathD} L300,${height} L0,${height} Z`;
  const gradId = `g${color.replace(/[^a-z0-9]/gi, '')}`;
  return (
    <svg viewBox={`0 0 300 ${height}`} preserveAspectRatio="none" style={{ width: '100%', height, display: 'block' }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.4" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={fillD} fill={`url(#${gradId})`} />
      <path d={pathD} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

// Partial star rating
function StarRating({ stars, animate }) {
  const [filled, setFilled] = useState(animate ? 0 : stars);
  useEffect(() => {
    if (!animate) { setFilled(stars); return; }
    setFilled(0);
    let curr = 0;
    const iv = setInterval(() => {
      curr += 0.5;
      setFilled(Math.min(curr, stars));
      if (curr >= stars) clearInterval(iv);
    }, 300);
    return () => clearInterval(iv);
  }, [stars, animate]);

  return (
    <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
      {[1,2,3,4,5].map(i => {
        const pct = Math.min(1, Math.max(0, filled - (i - 1)));
        return (
          <div key={i} style={{ position: 'relative', width: 48, height: 48 }}>
            <svg viewBox="0 0 24 24" width="48" height="48" style={{ position: 'absolute' }}>
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                fill="rgba(255,255,255,0.07)" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
            </svg>
            {pct > 0 && (
              <div style={{ position: 'absolute', inset: 0, width: `${pct * 100}%`, overflow: 'hidden',
                filter: animate ? 'drop-shadow(0 0 12px #fbbf24)' : 'none' }}>
                <svg viewBox="0 0 24 24" width="48" height="48">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                    fill="#fbbf24" />
                </svg>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Coin popup
function CoinPopup({ coins, onClose }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let n = 0;
    const step = Math.ceil(coins / 60);
    const iv = setInterval(() => { n += step; if (n >= coins) { setCount(coins); clearInterval(iv); } else setCount(n); }, 16);
    return () => clearInterval(iv);
  }, [coins]);
  return (
    <div className="am-coin-overlay" onClick={onClose}>
      <div className="am-coin-popup" onClick={e => e.stopPropagation()}>
        {Array.from({length:10}).map((_,i) => <div key={i} className="am-coin-prt" style={{'--i':i}} />)}
        <div style={{fontSize:64,lineHeight:1,marginBottom:8}}>🪙</div>
        <div className="am-coin-label">ARENA REWARD</div>
        <div className="am-coin-amount">+{count.toLocaleString()}</div>
        <div style={{fontSize:13,color:'rgba(255,255,255,0.4)',marginBottom:20}}>coins added to your wallet</div>
        <button className="am-btn am-btn-primary" onClick={onClose} style={{width:'100%'}}>COLLECT REWARD</button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
//  MAIN ARENA COMPONENT (Modal)
// ─────────────────────────────────────────────────────────
export default function Arena({ isOpen, onClose }) {
  const user = useStore(s => s.user);
  const geminiApiKey = useStore(s => s.geminiApiKey);
  const updateFearScore = useStore(s => s.updateFearScore);
  const updateUser = useStore(s => s.updateUser);
  const addCoinHistoryEvent = useStore(s => s.addCoinHistoryEvent);
  const fearScore = useStore(s => s.fearScore ?? 30);

  const [step, setStep] = useState(STEPS.SPLASH);
  const [duration, setDuration] = useState(DURATIONS[1]);
  const [difficulty, setDifficulty] = useState(null);
  const [assigning, setAssigning] = useState(false);
  const [assignStatus, setAssignStatus] = useState('ASSIGNING YOUR ROLE...');

  // Session
  const [scenario, setScenario] = useState(null);
  const [stocks, setStocks] = useState([]);
  const [balance, setBalance] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [actions, setActions] = useState([]);
  const [events, setEvents] = useState([]);
  const [activeEvent, setActiveEvent] = useState(null);
  const [eventMul, setEventMul] = useState(1);
  const [lastActionTime, setLastActionTime] = useState(Date.now());
  const [sessionStarted, setSessionStarted] = useState(false);
  const [selectedStockId, setSelectedStockId] = useState(0);

  // Action modal
  const [actionMode, setActionMode] = useState(null);
  const [actionQty, setActionQty] = useState(1);
  const [feedback, setFeedback] = useState(null);

  // News
  const [newsItems, setNewsItems] = useState([]);
  const [newsIdx, setNewsIdx] = useState(0);

  // Results
  const [scoreResult, setScoreResult] = useState(null);
  const [aiFeedback, setAiFeedback] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [showCoinPopup, setShowCoinPopup] = useState(false);
  const [rewardAwarded, setRewardAwarded] = useState(false);

  // Idle guide
  const [idleHint, setIdleHint] = useState(false);
  const idleTimerRef = useRef(null);
  const IDLE_THRESHOLD = 6500; // 6.5 seconds

  const tickRef = useRef(null);
  const countdownRef = useRef(null);
  const eventRef = useRef(null);
  const newsRef = useRef(null);
  const sessionStartRef = useRef(null);

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setStep(STEPS.SPLASH);
        setDifficulty(null);
        setScenario(null);
        setStocks([]);
        setEvents([]);
        setActiveEvent(null);
        setActions([]);
        setScoreResult(null);
        setAiFeedback('');
        setShowCoinPopup(false);
        setRewardAwarded(false);
        setNewsItems([]);
        setSessionStarted(false);
      }, 400);
    }
  }, [isOpen]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // ── Start Session ──────────────────────────────────────
  const startSession = useCallback((chosenScenario, dur) => {
    const initStocks = initArenaStocks(chosenScenario);
    setStocks(initStocks);
    setBalance(chosenScenario.startBalance);
    setTimeLeft(dur.seconds);
    setActions([]);
    setEvents([]);
    setActiveEvent(null);
    setEventMul(1);
    setSelectedStockId(initStocks[0]?.id || 0);
    setLastActionTime(Date.now());
    setScoreResult(null);
    setAiFeedback('');
    setRewardAwarded(false);
    setShowCoinPopup(false);
    setSessionStarted(false);
    setNewsItems([...NEWS_TEMPLATES].sort(() => Math.random() - 0.5).slice(0, 12));
    setStep(STEPS.SESSION);
  }, []);

  // Handle difficulty selection → Gemini dynamic role → fallback → start
  const handleDifficultySelect = async (diff) => {
    setDifficulty(diff);
    setAssigning(true);
    setAssignStatus('GENERATING YOUR SCENARIO...');

    // Attempt Gemini dynamic scenario
    let sc = await generateScenarioDynamic({
      apiKey: geminiApiKey,
      difficulty: diff.id,
      userName: user?.name || user?.displayName || 'Trader',
      fearScore,
    });

    // Fallback to hardcoded
    if (!sc) {
      setAssignStatus('ASSIGNING YOUR ROLE...');
      await new Promise(r => setTimeout(r, 800));
      const id = diff.scenarios[Math.floor(Math.random() * diff.scenarios.length)];
      sc = ARENA_SCENARIOS.find(s => s.id === id);
    }

    setScenario(sc);
    setAssigning(false);
    startSession(sc, duration);
  };

  // ── Session ticking ───────────────────────────────────
  useEffect(() => {
    if (step !== STEPS.SESSION) return;
    sessionStartRef.current = Date.now();
    setSessionStarted(true);
    setLastActionTime(Date.now());

    // Idle timer
    idleTimerRef.current = setInterval(() => {
      setIdleHint(h => !h ? true : true); // keep showing once triggered
    }, IDLE_THRESHOLD);
    // Clear idle hint on first tick so it's fresh
    setIdleHint(false);

    tickRef.current = setInterval(() => {
      setStocks(prev => tickAllStocks(prev, eventMul));
    }, 800);

    countdownRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(countdownRef.current); return 0; }
        return prev - 1;
      });
    }, 1000);

    eventRef.current = setInterval(() => {
      if (!scenario) return;
      const elapsed = (Date.now() - sessionStartRef.current) / (duration.seconds * 1000);
      const evt = maybeGenerateEvent(elapsed, scenario.eventProbability);
      if (evt) {
        setActiveEvent(evt);
        setEventMul(evt.driftMultiplier);
        setEvents(prev => [evt, ...prev].slice(0, 15));
        setTimeout(() => { setActiveEvent(null); setEventMul(1); }, 5000);
      }
    }, 3500);

    newsRef.current = setInterval(() => {
      setNewsIdx(prev => (prev + 1) % 12);
    }, 4000);

    return () => {
      clearInterval(tickRef.current);
      clearInterval(countdownRef.current);
      clearInterval(eventRef.current);
      clearInterval(newsRef.current);
      clearInterval(idleTimerRef.current);
    };
  }, [step]);

  // Reset idle timer on any user action
  const resetIdle = useCallback(() => {
    setIdleHint(false);
    clearInterval(idleTimerRef.current);
    idleTimerRef.current = setInterval(() => {
      setIdleHint(true);
    }, IDLE_THRESHOLD);
  }, []);

  // End when timer hits 0
  useEffect(() => {
    if (step !== STEPS.SESSION || !sessionStarted || timeLeft > 0) return;
    endSession();
  }, [timeLeft, step, sessionStarted]);

  const endSession = useCallback(() => {
    clearInterval(tickRef.current);
    clearInterval(countdownRef.current);
    clearInterval(eventRef.current);
    clearInterval(newsRef.current);
    clearInterval(idleTimerRef.current);
    setIdleHint(false);

    setStocks(finalStocks => {
      setBalance(finalBalance => {
        const result = scoreBehavior(
          actions, finalStocks,
          scenario?.startBalance || 10000, finalBalance,
          scenario || ARENA_SCENARIOS[0],
          duration.seconds * 1000
        );
        setScoreResult(result);
        setStep(STEPS.RESULTS);
        setAiLoading(true);
        generateArenaFeedback({
          apiKey: geminiApiKey, scoreResult: result,
          scenario: scenario || ARENA_SCENARIOS[0],
          onToken: t => setAiFeedback(t),
        }).then(() => setAiLoading(false));
        return finalBalance;
      });
      return finalStocks;
    });
  }, [actions, scenario, duration, geminiApiKey]);

  // ── Coin reward ───────────────────────────────────────
  useEffect(() => {
    if (step !== STEPS.RESULTS || !scoreResult || rewardAwarded) return;
    setRewardAwarded(true);
    if (scoreResult.coinReward > 0) {
      setTimeout(async () => {
        try {
          const { api } = await import('../services/api.js');
          const reward = await api.rewardCoins({
            amount: scoreResult.coinReward,
            sourceId: `arena-${Date.now()}`,
            label: `Arena: ${scenario?.role || 'Session'} (${scoreResult.stars}★)`,
          });
          if (Number.isFinite(Number(reward?.balance))) {
            updateUser({ iqCoins: reward.balance });
            addCoinHistoryEvent({
              type: 'REWARD', subtype: 'ARENA',
              amount: scoreResult.coinReward,
              source: 'Trading Arena',
              label: `Arena ${scoreResult.stars}★ reward`,
              balanceAfter: reward.balance,
            });
          }
        } catch { updateUser({ iqCoins: (user?.iqCoins || 0) + scoreResult.coinReward }); }
        setShowCoinPopup(true);
      }, 2000);
    }
    if (scoreResult.fearDelta !== 0) {
      updateFearScore('ARENA_COMPLETE', 0, scoreResult.fearDelta < 0, Math.abs(scoreResult.fearDelta));
    }
  }, [step, scoreResult, rewardAwarded]);

  // ── Action handlers ───────────────────────────────────
  const handleBuySell = (type, stockId) => {
    resetIdle();
    setActionMode({ type, stockId });
    setActionQty(1);
  };

  const confirmAction = () => {
    resetIdle();
    if (!actionMode) return;
    const { type, stockId } = actionMode;
    const hesMs = Date.now() - lastActionTime;
    const afterNeg = activeEvent?.severity === 'negative' || activeEvent?.severity === 'danger';
    if (type === 'BUY') {
      const r = arenaBuy(stocks, stockId, actionQty, balance);
      if (r.success) {
        setStocks(r.stocks); setBalance(r.newBalance);
        const pv = computePortfolioValue(r.stocks, r.newBalance);
        setActions(prev => [...prev, { type:'BUY', stockId, qty:actionQty, timestamp:Date.now(), hesitationMs:hesMs, afterNegativeEvent:afterNeg, portfolioValue:pv.totalValue }]);
        showFeedback(true, `Bought ${actionQty} shares`);
      } else showFeedback(false, r.message);
    } else {
      const r = arenaSell(stocks, stockId, actionQty, balance);
      if (r.success) {
        setStocks(r.stocks); setBalance(r.newBalance);
        const pv = computePortfolioValue(r.stocks, r.newBalance);
        setActions(prev => [...prev, { type:'SELL', stockId, qty:actionQty, timestamp:Date.now(), hesitationMs:hesMs, afterNegativeEvent:afterNeg, portfolioValue:pv.totalValue }]);
        showFeedback(true, `Sold ${actionQty} shares`);
      } else showFeedback(false, r.message);
    }
    setLastActionTime(Date.now());
    setActionMode(null);
  };

  const holdStock = (stockId) => {
    resetIdle();
    const hesMs = Date.now() - lastActionTime;
    const afterNeg = activeEvent?.severity === 'negative';
    const pv = computePortfolioValue(stocks, balance);
    setActions(prev => [...prev, { type:'HOLD', stockId, timestamp:Date.now(), hesitationMs:hesMs, afterNegativeEvent:afterNeg, portfolioValue:pv.totalValue }]);
    setLastActionTime(Date.now());
    showFeedback(true, 'Position held — disciplined call.');
  };

  const showFeedback = (ok, msg) => {
    setFeedback({ ok, msg });
    setTimeout(() => setFeedback(null), 2200);
  };

  // Computed
  const timerPct = scenario ? (timeLeft / duration.seconds) * 100 : 100;
  const timerClass = timeLeft > 60 ? 'ok' : timeLeft > 30 ? 'warn' : 'danger';
  const formatTime = s => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
  const portfolio = computePortfolioValue(stocks, balance);
  const pnlData = scenario ? computePnL(stocks, scenario.startBalance, balance) : null;
  const activeStock = stocks.find(s => s.id === selectedStockId) || stocks[0];
  const maxBuyQty = actionMode ? Math.floor(balance / (stocks.find(s=>s.id===actionMode.stockId)?.currentPrice||1)) : 0;
  const maxSellQty = actionMode ? (stocks.find(s=>s.id===actionMode.stockId)?.holdings || 0) : 0;

  if (!isOpen) return null;

  // ═══════════════════════════════════════════════════════
  //  RENDER
  // ═══════════════════════════════════════════════════════
  return (
    <div className="am-backdrop">
      <div className={`am-modal ${step === STEPS.SESSION || step === STEPS.RESULTS ? 'am-modal-full' : ''}`}>

        {/* ──── STEP 0: SPLASH ──── */}
        {step === STEPS.SPLASH && (
          <div className="am-splash">
            <StarField />
            <FloatingMoney />
            <button className="am-close" onClick={onClose} aria-label="Close">✕</button>
            <div className="am-splash-content">
              <div className="am-splash-badge">⚔ TRADING ARENA</div>
              <h1 className="am-splash-title">ENTER THE<br />SIMULATION</h1>
              <p className="am-splash-sub">
                Take on a trader identity. Survive a synthetic market.<br />
                Scored on psychology — not just profit.
              </p>
              <button className="am-lets-go-btn" onClick={() => setStep(STEPS.DURATION)}>
                LET'S GO →
                <div className="am-lets-go-glow" />
              </button>
            </div>
          </div>
        )}

        {/* ──── STEP 1: DURATION ──── */}
        {step === STEPS.DURATION && (
          <div className="am-setup-screen">
            <StarField />
            <button className="am-close" onClick={onClose}>✕</button>
            <div className="am-setup-content">
              <div className="am-setup-badge">SELECT BATTLE DURATION</div>
              <h2 className="am-setup-title">How long can<br />you last?</h2>
              <div className="am-duration-grid">
                {DURATIONS.map(d => (
                  <button key={d.label}
                    className={`am-option-card ${duration.label === d.label ? 'selected' : ''}`}
                    onClick={() => setDuration(d)}>
                    <div className="am-option-value">{d.label}</div>
                    <div className="am-option-sub">{d.seconds / 60} minute{d.seconds > 60 ? 's' : ''}</div>
                  </button>
                ))}
              </div>
              <button className="am-continue-btn" onClick={() => setStep(STEPS.DIFFICULTY)}>
                CONTINUE →
              </button>
            </div>
          </div>
        )}

        {/* ──── STEP 2: DIFFICULTY ──── */}
        {step === STEPS.DIFFICULTY && (
          <div className="am-setup-screen">
            <StarField />
            <button className="am-close" onClick={onClose}>✕</button>
            <div className="am-setup-content">
              {assigning ? (
                <div className="am-assigning">
                  <div className="am-assigning-spinner" />
                  <div className="am-assigning-text">{assignStatus}</div>
                  {assignStatus.includes('GENERATING') && (
                    <div style={{fontSize:11,color:'rgba(255,255,255,0.3)',marginTop:-12}}>
                      Powered by Gemini AI — crafting your unique scenario
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <div className="am-setup-badge">CHOOSE YOUR DIFFICULTY</div>
                  <h2 className="am-setup-title">What kind of<br />market can you handle?</h2>
                  <div className="am-diff-grid">
                    {DIFFICULTIES.map(d => (
                      <button key={d.id}
                        className={`am-diff-card ${difficulty?.id === d.id ? 'selected' : ''}`}
                        style={{'--dc': d.color}}
                        onClick={() => handleDifficultySelect(d)}>
                        <div className="am-diff-label" style={{color: d.color}}>{d.label}</div>
                        <div className="am-diff-desc">{d.description}</div>
                      </button>
                    ))}
                  </div>
                  <div style={{marginTop:16,fontSize:12,color:'rgba(255,255,255,0.3)',textAlign:'center'}}>
                    Your role is assigned based on difficulty — each run is unique.
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* ──── STEP 3: SESSION ──── */}
        {step === STEPS.SESSION && scenario && (
          <div className={`am-session ${timerClass === 'danger' ? 'am-danger-mode' : ''}`}
            onClick={resetIdle} onKeyDown={resetIdle}>
            {/* Edge glow in danger */}
            {timerClass === 'danger' && <div className="am-edge-glow" />}

            {/* ── NEWS TICKER ── */}
            <div className="am-news-ticker">
              <span className="am-news-live">● LIVE</span>
              <div className="am-news-track">
                {newsItems.concat(newsItems).map((n, i) => (
                  <span key={i} className="am-news-item">{n}</span>
                ))}
              </div>
            </div>

            {/* ── FLASH EVENT ── */}
            {activeEvent && (
              <div className={`am-flash-event am-flash-${activeEvent.severity}`}>
                <span className="am-flash-label">{activeEvent.label}</span>
                <span className="am-flash-desc">{activeEvent.description}</span>
              </div>
            )}

            {/* ── TOP HUD ── */}
            <div className="am-session-hud">
              <div className="am-hud-left">
                <span className="am-hud-avatar">{scenario.avatar}</span>
                <div>
                  <div className="am-hud-role" style={{color:scenario.color}}>{scenario.role}</div>
                  <div className="am-hud-tag">SIMULATION ACTIVE</div>
                </div>
              </div>

              {/* TIMER */}
              <div className={`am-timer am-timer-${timerClass}`}>
                <div className="am-timer-val">{formatTime(timeLeft)}</div>
                <div className="am-timer-prog">
                  <div className="am-timer-prog-fill" style={{
                    width: `${timerPct}%`,
                    background: timerClass === 'ok' ? '#00f5ff' : timerClass === 'warn' ? '#f59e0b' : '#ff0040'
                  }} />
                </div>
                <div className="am-timer-label">TIME REMAINING</div>
              </div>

              <div className="am-hud-right">
                <div className="am-hud-stat">
                  <div className="am-hud-stat-label">PORTFOLIO</div>
                  <div className="am-hud-stat-val">₹{portfolio.totalValue.toLocaleString()}</div>
                </div>
                <div className="am-hud-stat">
                  <div className="am-hud-stat-label">P&amp;L</div>
                  <div className={`am-hud-stat-val ${pnlData?.pnl >= 0 ? 'pos' : 'neg'}`}>
                    {pnlData?.pnl >= 0 ? '+' : ''}₹{pnlData?.pnl?.toLocaleString()} ({pnlData?.pnlPct >= 0 ? '+' : ''}{pnlData?.pnlPct}%)
                  </div>
                </div>
                <button className="am-end-btn" onClick={endSession}>⏹ END</button>
              </div>
            </div>

            {/* ── MAIN CONTENT ── */}
            <div className="am-session-body">
              {/* LEFT: Charts */}
              <div className="am-charts-panel">
                {/* Main chart (selected stock) */}
                {activeStock && (
                  <div className="am-main-chart-card">
                    <div className="am-chart-header">
                      <div>
                        <div className="am-chart-symbol">{activeStock.symbol}</div>
                        <div className="am-chart-name">{activeStock.name}</div>
                        <div className="am-chart-sector">{activeStock.sector}</div>
                      </div>
                      <div style={{textAlign:'right'}}>
                        <div className="am-chart-price">₹{activeStock.currentPrice.toFixed(2)}</div>
                        <div className={`am-chart-change ${activeStock.currentPrice >= activeStock.startPrice ? 'up' : 'down'}`}>
                          {activeStock.currentPrice >= activeStock.startPrice ? '▲' : '▼'}&nbsp;
                          {Math.abs(((activeStock.currentPrice - activeStock.startPrice) / activeStock.startPrice) * 100).toFixed(2)}%
                        </div>
                      </div>
                    </div>
                    <SparkLine
                      data={activeStock.priceHistory}
                      color={activeStock.currentPrice >= activeStock.startPrice ? '#00ff88' : '#ff0040'}
                      height={120}
                    />
                    {/* Stock selector tabs */}
                    <div className="am-stock-tabs">
                      {stocks.map(s => {
                        const up = s.currentPrice >= s.startPrice;
                        return (
                          <button key={s.id}
                            className={`am-stock-tab ${s.id === selectedStockId ? 'active' : ''}`}
                            onClick={() => setSelectedStockId(s.id)}>
                            <span className="am-tab-sym">{s.symbol}</span>
                            <span className={`am-tab-chg ${up ? 'pos' : 'neg'}`}>
                              {up ? '▲' : '▼'}{Math.abs(((s.currentPrice - s.startPrice)/s.startPrice)*100).toFixed(1)}%
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    {/* Action buttons for active stock */}
                    <div className="am-action-row">
                      <button className="am-act buy" onClick={() => handleBuySell('BUY', activeStock.id)}>▲ BUY</button>
                      <button className="am-act hold" onClick={() => holdStock(activeStock.id)}>◆ HOLD</button>
                      <button className="am-act sell" disabled={activeStock.holdings === 0}
                        onClick={() => handleBuySell('SELL', activeStock.id)}>▼ SELL</button>
                    </div>
                  </div>
                )}

                {/* Mini stock list */}
                <div className="am-mini-stocks">
                  {stocks.map(s => {
                    const chg = ((s.currentPrice - s.startPrice) / s.startPrice * 100);
                    const up = chg >= 0;
                    const sPnL = s.holdings > 0 ? (s.currentPrice - s.avgBuyPrice) * s.holdings : null;
                    return (
                      <div key={s.id} className={`am-mini-card ${s.id === selectedStockId ? 'active' : ''}`}
                        onClick={() => setSelectedStockId(s.id)}>
                        <div className="am-mini-header">
                          <span className="am-mini-sym">{s.symbol}</span>
                          <span className={`am-mini-chg ${up ? 'pos' : 'neg'}`}>{up?'▲':'▼'}{Math.abs(chg).toFixed(2)}%</span>
                        </div>
                        <div className="am-mini-price">₹{s.currentPrice.toFixed(2)}</div>
                        {s.holdings > 0 && (
                          <div className={`am-mini-pnl ${sPnL >= 0 ? 'pos' : 'neg'}`}>
                            {sPnL >= 0 ? '+' : ''}₹{sPnL?.toFixed(0)} · {s.holdings} shares
                          </div>
                        )}
                        <SparkLine
                          data={s.priceHistory.slice(-30)}
                          color={up ? '#00ff88' : '#ff0040'}
                          height={32}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* RIGHT: Portfolio + Scenario + Events */}
              <div className="am-right-panel">
                {/* Portfolio card */}
                <div className="am-portfolio-card">
                  <div className="am-card-title">📊 PORTFOLIO STATUS</div>
                  <div className="am-port-value">₹{portfolio.totalValue.toLocaleString()}</div>
                  <div className={`am-port-pnl ${pnlData?.pnl >= 0 ? 'pos' : 'neg'}`}>
                    {pnlData?.pnl >= 0 ? '+' : ''}₹{pnlData?.pnl?.toLocaleString()}
                    <span style={{fontSize:11,marginLeft:6,opacity:0.7}}>
                      ({pnlData?.pnlPct >= 0 ? '+' : ''}{pnlData?.pnlPct}%)
                    </span>
                  </div>
                  <div className="am-port-row">
                    <span>Cash</span><span>₹{balance.toLocaleString()}</span>
                  </div>
                  <div className="am-port-row">
                    <span>Holdings</span><span>₹{portfolio.holdingsValue.toLocaleString()}</span>
                  </div>
                  <div className="am-port-row">
                    <span>Decisions</span>
                    <span>{actions.length} ({actions.filter(a=>a.type==='BUY').length}B {actions.filter(a=>a.type==='SELL').length}S {actions.filter(a=>a.type==='HOLD').length}H)</span>
                  </div>
                </div>

                {/* Scenario card */}
                <div className="am-scenario-card">
                  <div className="am-card-title">🎭 YOUR ROLE</div>
                  <div className="am-sc-role" style={{color:scenario.color}}>{scenario.avatar} {scenario.role}</div>
                  <div className="am-card-divider" />
                  <div className="am-card-label">📋 MISSION</div>
                  {scenario.goals.map((g, i) => (
                    <div key={i} className="am-goal-item">· {g}</div>
                  ))}
                  <div className="am-card-divider" />
                  <div className="am-card-label">⚠ CONSTRAINTS</div>
                  {scenario.constraints.map((c, i) => (
                    <div key={i} className="am-constraint-item">· {c}</div>
                  ))}
                </div>

                {/* Events log */}
                <div className="am-events-card">
                  <div className="am-card-title">🔴 MARKET FEED</div>
                  {events.length === 0 && <div className="am-no-events">Monitoring feed...</div>}
                  {events.slice(0, 5).map((e, i) => (
                    <div key={e.id} className={`am-event-row am-er-${e.severity}`}
                      style={{opacity: Math.max(0.3, 1 - i * 0.15)}}>
                      <div className="am-er-label">{e.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Feedback toast ── */}
            {feedback && (
              <div className={`am-toast ${feedback.ok ? 'ok' : 'err'}`}>{feedback.msg}</div>
            )}

            {/* ── IDLE GUIDE HINT ── */}
            {idleHint && !actionMode && (() => {
              // Smart hint logic
              const bestStock = [...stocks].sort((a, b) => {
                const aChg = (a.currentPrice - a.startPrice) / a.startPrice;
                const bChg = (b.currentPrice - b.startPrice) / b.startPrice;
                return bChg - aChg;
              })[0];
              const worstStock = [...stocks].sort((a, b) => {
                const aChg = (a.currentPrice - a.startPrice) / a.startPrice;
                const bChg = (b.currentPrice - b.startPrice) / b.startPrice;
                return aChg - bChg;
              })[0];
              const bestChg = bestStock ? ((bestStock.currentPrice - bestStock.startPrice) / bestStock.startPrice * 100) : 0;
              const heldStocks = stocks.filter(s => s.holdings > 0);
              const hasEvent = !!activeEvent;

              let title = '🎯 What to do now';
              let tips = [];

              if (actions.length === 0) {
                title = '🚀 Make your first move!';
                tips = [
                  `Look at ${bestStock?.symbol} — it's up ${bestChg.toFixed(1)}% since session start`,
                  `Click any stock tab (${stocks.map(s => s.symbol).join(', ')}) to view its chart`,
                  `Hit ▲ BUY to open a position with your ₹${balance.toLocaleString()} cash`,
                ];
              } else if (hasEvent) {
                title = `⚡ ${activeEvent.label} — React now!`;
                tips = [
                  activeEvent.severity === 'positive'
                    ? `Market rallying! ${bestStock?.symbol} could be a good BUY right now`
                    : `Dip in progress — HOLDing instead of selling earns you behavior points`,
                  `Your mission: ${scenario.goals[0]}`,
                  `Check ${scenario.constraints[0]} before acting`,
                ];
              } else if (heldStocks.length > 0) {
                const topHeld = heldStocks[0];
                const pnl = (topHeld.currentPrice - topHeld.avgBuyPrice) * topHeld.holdings;
                title = pnl > 0 ? '💰 You\'re in profit!' : '📉 Position in the red';
                tips = [
                  pnl > 0
                    ? `${topHeld.symbol} is up — you could SELL to lock in gains of ₹${pnl.toFixed(0)}`
                    : `${topHeld.symbol} is down — HOLDing avoids panic-sell penalty`,
                  `Or switch stock tabs to look at other opportunities`,
                  `${timeLeft}s left — ${actions.length} moves made so far`,
                ];
              } else {
                tips = [
                  `${bestStock?.symbol} has the strongest momentum right now`,
                  `Try HOLD to log a disciplined decision without trading`,
                  `Your goal: ${scenario.goals[0]}`,
                ];
              }

              return (
                <div className="am-idle-hint" onClick={resetIdle}>
                  <div className="am-idle-inner">
                    <div className="am-idle-header">
                      <span className="am-idle-title">{title}</span>
                      <button className="am-idle-close" onClick={resetIdle}>✕</button>
                    </div>
                    <ul className="am-idle-tips">
                      {tips.map((t, i) => (
                        <li key={i}><span className="am-idle-tip-dot">›</span>{t}</li>
                      ))}
                    </ul>
                    <div className="am-idle-actions">
                      <span className="am-idle-key">▲ BUY</span>
                      <span className="am-idle-key">◆ HOLD</span>
                      <span className="am-idle-key">▼ SELL</span>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* ── BUY/SELL MODAL ── */}
            {actionMode && (
              <div className="am-action-overlay" onClick={() => setActionMode(null)}>
                <div className="am-action-modal" onClick={e => e.stopPropagation()}>
                  {(() => {
                    const s = stocks.find(x => x.id === actionMode.stockId);
                    if (!s) return null;
                    return (
                      <>
                        <div className={`am-modal-title ${actionMode.type === 'BUY' ? 'buy' : 'sell'}`}>
                          {actionMode.type === 'BUY' ? '▲ BUY' : '▼ SELL'} {s.symbol}
                        </div>
                        <div className="am-modal-price">₹{s.currentPrice.toFixed(2)}</div>
                        <div className="am-window-bar">
                          <div className="am-window-fill" style={{
                            background: actionMode.type === 'BUY' ? '#00ff88' : '#ff0040',
                            animationDuration: '10s'
                          }} />
                        </div>
                        <div className="am-qty-row">
                          <button className="am-qty-btn" onClick={() => setActionQty(q => Math.max(1, q-1))}>−</button>
                          <div style={{textAlign:'center'}}>
                            <div style={{fontSize:48,fontWeight:900,fontFamily:'var(--font-mono)',color:'#fff'}}>{actionQty}</div>
                            <div style={{fontSize:10,letterSpacing:'0.15em',color:'rgba(255,255,255,0.35)'}}>SHARES</div>
                          </div>
                          <button className="am-qty-btn" onClick={() => setActionQty(q => {
                            const max = actionMode.type === 'BUY' ? maxBuyQty : maxSellQty;
                            return Math.min(max, q+1);
                          })}>+</button>
                        </div>
                        <div style={{textAlign:'center',fontFamily:'var(--font-mono)',fontSize:13,color:'rgba(255,255,255,0.5)',marginBottom:20}}>
                          Total: ₹{(s.currentPrice * actionQty).toFixed(2)}
                          {actionMode.type === 'BUY' && <span style={{opacity:.4,marginLeft:8}}>(Max: {maxBuyQty})</span>}
                        </div>
                        <div style={{display:'flex',gap:12}}>
                          <button className="am-btn am-btn-cancel" onClick={() => setActionMode(null)} style={{flex:1}}>CANCEL</button>
                          <button
                            className={`am-btn ${actionMode.type==='BUY' ? 'am-btn-buy' : 'am-btn-sell'}`}
                            onClick={confirmAction}
                            style={{flex:2}}
                            disabled={actionMode.type==='BUY' ? maxBuyQty < 1 : maxSellQty < 1}
                          >CONFIRM {actionMode.type}</button>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ──── STEP 4: RESULTS ──── */}
        {step === STEPS.RESULTS && scoreResult && scenario && (
          <div className="am-results">
            <StarField />
            {showCoinPopup && <CoinPopup coins={scoreResult.coinReward} onClose={() => setShowCoinPopup(false)} />}
            <div className="am-results-content">
              <div className="am-results-header">
                <div className="am-setup-badge">SESSION COMPLETE</div>
                <div style={{fontSize:28,margin:'8px 0'}}>{scenario.avatar} {scenario.role}</div>
                <h1 className="am-splash-title" style={{fontSize:'clamp(28px,4vw,48px)',marginBottom:8}}>PERFORMANCE ANALYSIS</h1>
              </div>

              <div className="am-stars-block">
                <StarRating stars={scoreResult.stars} animate />
                <div className="am-stars-label">
                  {scoreResult.stars>=5?'LEGENDARY':scoreResult.stars>=4?'EXCELLENT':scoreResult.stars>=3?'SOLID':scoreResult.stars>=2?'DEVELOPING':'NEEDS WORK'}
                </div>
              </div>

              <div className="am-metrics-grid">
                {[
                  { label:'P&L', val:`${scoreResult.pnl>=0?'+':''}₹${scoreResult.pnl.toLocaleString()}`, sub:`${scoreResult.pnlPct>=0?'+':''}${scoreResult.pnlPct}%`, color: scoreResult.pnl>=0?'#00ff88':'#ff0040' },
                  { label:'MAX DRAWDOWN', val:`${scoreResult.maxDrawdownPct}%`, sub: scoreResult.maxDrawdownPct<15?'Controlled':scoreResult.maxDrawdownPct<30?'Moderate':'High', color: scoreResult.maxDrawdownPct<15?'#00ff88':scoreResult.maxDrawdownPct<30?'#f59e0b':'#ff0040' },
                  { label:'DECISIONS', val:scoreResult.totalActions, sub:`${scoreResult.buyCount}B / ${scoreResult.sellCount}S / ${scoreResult.holdCount}H`, color:'#00f5ff' },
                  { label:'AVG DECISION', val:`${Math.round(scoreResult.avgDecisionMs/1000)}s`, sub: scoreResult.avgDecisionMs<15000?'Decisive':'Measured', color:'#c084fc' },
                  { label:'DIVERSIFICATION', val:`${scoreResult.diversificationScore} stocks`, sub: scoreResult.diversificationScore>=3?'Spread well':'Concentrated', color: scoreResult.diversificationScore>=3?'#00ff88':'#f59e0b' },
                  { label:'PANIC SELLS', val:scoreResult.panicSellCount, sub: scoreResult.panicSellCount===0?'None — great!':'Detected', color: scoreResult.panicSellCount===0?'#00ff88':'#ff0040' },
                ].map((m,i) => (
                  <div key={i} className="am-metric-card" style={{'--mc':m.color}}>
                    <div className="am-metric-label">{m.label}</div>
                    <div className="am-metric-val" style={{color:m.color}}>{m.val}</div>
                    <div className="am-metric-sub">{m.sub}</div>
                  </div>
                ))}
              </div>

              {scoreResult.tags.length > 0 && (
                <div style={{marginBottom:24}}>
                  <div className="am-setup-badge" style={{marginBottom:12}}>BEHAVIORAL PROFILE</div>
                  <div style={{display:'flex',flexWrap:'wrap',gap:10}}>
                    {scoreResult.tags.map((t,i) => (
                      <div key={i} className="am-tag" style={{'--tc':t.color,'animationDelay':`${i*0.12}s`}}>
                        {t.icon} {t.label}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="am-ai-panel">
                <div style={{fontSize:11,fontWeight:800,letterSpacing:'0.15em',color:'#00f5ff',marginBottom:12,textShadow:'0 0 10px #00f5ff'}}>
                  ⚡ AI COACH ANALYSIS {aiLoading && <span style={{color:'rgba(255,255,255,0.3)',fontWeight:400}}>· generating...</span>}
                </div>
                <div style={{fontSize:14,lineHeight:1.9,color:'rgba(255,255,255,0.8)',minHeight:48}}>
                  {aiFeedback || (aiLoading ? '' : '...')}
                  {aiLoading && <span style={{color:'#00f5ff',animation:'arenaBlink .7s ease infinite'}}>▊</span>}
                </div>
              </div>

              {scoreResult.coinReward > 0 && !showCoinPopup && (
                <div className="am-reward-banner">🪙 +{scoreResult.coinReward} coins earned!</div>
              )}
              {scoreResult.fearDelta < 0 && (
                <div className="am-fear-banner">💚 Fear score reduced by {Math.abs(scoreResult.fearDelta)} points</div>
              )}

              <div style={{display:'flex',gap:16,justifyContent:'center',marginTop:28,flexWrap:'wrap'}}>
                <button className="am-btn am-btn-secondary" onClick={() => { setStep(STEPS.SPLASH); setDifficulty(null); }}>
                  NEW SESSION
                </button>
                <button className="am-btn am-btn-primary" onClick={() => { setStep(STEPS.DIFFICULTY); setDifficulty(null); handleDifficultySelect(difficulty || DIFFICULTIES[0]); }}>
                  ⚔ SAME DIFFICULTY
                </button>
                <button className="am-btn am-btn-cancel" onClick={onClose}>BACK TO DASHBOARD</button>
              </div>
            </div>
          </div>
        )}

      </div>{/* end am-modal */}
    </div>
  );
}
