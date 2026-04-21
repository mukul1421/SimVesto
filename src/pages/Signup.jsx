import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import useStore from '../store/useStore';
import BackgroundGrid from '../components/BackgroundGrid';
import Logo from '../components/Logo';

// ─── Three adaptive question banks ────────────────────────────────
const BEGINNER_QUESTIONS = [
  {
    id: 'b1',
    text: "What do you think happens when a stock price goes up?",
    options: [
      { label: '📈 The company is doing well and investors want to own it', value: 'correct', fearWeight: 1, litScore: 4 },
      { label: '🤔 The government increases its price somehow', value: 'wrong1', fearWeight: 2, litScore: 2 },
      { label: '😕 Honestly not sure — that\'s why I\'m here!', value: 'unsure', fearWeight: 3, litScore: 1 },
    ],
  },
  {
    id: 'b2',
    text: "You put ₹2,000 into a stock and it drops to ₹1,700. What do you feel?",
    options: [
      { label: '😰 Panic — I want to sell before it drops more', value: 'panic', fearWeight: 3 },
      { label: '😐 A bit nervous, but I\'d wait and watch', value: 'wait', fearWeight: 2 },
      { label: '🤷 It happens — I\'d research before deciding', value: 'calm', fearWeight: 1 },
    ],
  },
  {
    id: 'b3',
    text: "Why do you want to start investing?",
    options: [
      { label: '🌱 Grow my savings for the future', value: 'save', fearWeight: 1 },
      { label: '⚡ Make quick money fast', value: 'quick', fearWeight: 2 },
      { label: '📚 Learn about markets first, money second', value: 'learn', fearWeight: 2 },
    ],
  },
  {
    id: 'b4',
    text: "Your friend says they doubled their money in stocks in 3 months. You think:",
    options: [
      { label: '🎰 That\'s amazing — I want to try the same thing!', value: 'fomo', fearWeight: 3 },
      { label: '🧐 Lucky, but markets can go both ways', value: 'balanced', fearWeight: 1 },
      { label: '😟 That sounds risky — I\'d be scared', value: 'scared', fearWeight: 3 },
    ],
  },
  {
    id: 'b5',
    text: "How much are you thinking of starting with?",
    type: 'slider',
    min: 500, max: 100000, step: 500, default: 3000,
  },
];

const INTERMEDIATE_QUESTIONS = [
  {
    id: 'i1',
    text: "Your portfolio dropped 15% in a month. What do you do?",
    options: [
      { label: '😰 Sell immediately to cut my losses', value: 'sell', fearWeight: 3 },
      { label: '⏳ Wait it out and review fundamentals', value: 'wait', fearWeight: 2 },
      { label: '💪 Buy more at the dip if financials are solid', value: 'buy_more', fearWeight: 1 },
    ],
  },
  {
    id: 'i2',
    text: "Which investing approach do you most identify with?",
    options: [
      { label: '📊 Fundamental analysis — buy strong businesses', value: 'fundamental', fearWeight: 1, litScore: 6 },
      { label: '📉 Technical analysis — follow charts and trends', value: 'technical', fearWeight: 2, litScore: 6 },
      { label: '🎯 Mix of both, adapts to the situation', value: 'mixed', fearWeight: 1, litScore: 7 },
    ],
  },
  {
    id: 'i3',
    text: "What does 'diversification' mean to you in practice?",
    options: [
      { label: '🌐 Spread across sectors, assets, and geographies', value: 'spread', fearWeight: 1, litScore: 7 },
      { label: '📂 Owning 5+ different stocks', value: 'stocks', fearWeight: 2, litScore: 5 },
      { label: '🤔 I know the word but haven\'t done it yet', value: 'know', fearWeight: 2, litScore: 4 },
    ],
  },
  {
    id: 'i4',
    text: "When markets are volatile, you typically...",
    options: [
      { label: '😤 Feel anxious and check prices constantly', value: 'anxious', fearWeight: 3 },
      { label: '📅 Stick to my plan and review weekly', value: 'plan', fearWeight: 1 },
      { label: '🔎 Look for opportunities in the chaos', value: 'opportunity', fearWeight: 1 },
    ],
  },
  {
    id: 'i5',
    text: "How much are you thinking of starting with?",
    type: 'slider',
    min: 5000, max: 500000, step: 1000, default: 25000,
  },
];

const ADVANCED_QUESTIONS = [
  {
    id: 'a1',
    text: "The VIX spikes above 30. Your portfolio is 60% equities. You:",
    options: [
      { label: '🛡️ Rotate to defensives and hedge with puts', value: 'hedge', fearWeight: 1, litScore: 9 },
      { label: '💸 Hold firm — volatility is noise', value: 'hold', fearWeight: 1, litScore: 8 },
      { label: '🔥 Reduce exposure — capital preservation mode', value: 'reduce', fearWeight: 2, litScore: 7 },
    ],
  },
  {
    id: 'a2',
    text: "Your position is down 8%. Pre-planned stop-loss is -10%. You:",
    options: [
      { label: '✂️ Exit at -10% exactly as planned — no emotion', value: 'discipline', fearWeight: 1, litScore: 9 },
      { label: '🤞 Move the stop-loss to -15% hoping for recovery', value: 'move_sl', fearWeight: 3, litScore: 5 },
      { label: '📊 Re-evaluate fundamentals first, then decide', value: 'evaluate', fearWeight: 2, litScore: 7 },
    ],
  },
  {
    id: 'a3',
    text: "What's your typical equity:debt:gold asset allocation?",
    options: [
      { label: '80:15:5 — Aggressive growth', value: 'aggressive', fearWeight: 2, litScore: 9 },
      { label: '60:30:10 — Balanced with safety net', value: 'balanced', fearWeight: 1, litScore: 9 },
      { label: '45:45:10 — Conservative, capital protection first', value: 'conservative', fearWeight: 1, litScore: 8 },
    ],
  },
  {
    id: 'a4',
    text: "A bear market begins. Markets are down 25%. Your move:",
    options: [
      { label: '🛒 Deploy dry powder systematically via SIP/lump sum', value: 'deploy', fearWeight: 1, litScore: 9 },
      { label: '⏸️ Pause investments, wait for confirmation', value: 'pause', fearWeight: 2, litScore: 7 },
      { label: '🔁 Rebalance portfolio to pre-set target weights', value: 'rebalance', fearWeight: 1, litScore: 9 },
    ],
  },
  {
    id: 'a5',
    text: "How much are you thinking of deploying in this sandbox?",
    type: 'slider',
    min: 10000, max: 1000000, step: 5000, default: 100000,
  },
];

const SKILL_LEVELS = [
  {
    id: 'beginner',
    label: 'Beginner',
    emoji: '🌱',
    desc: 'New to investing. Learning what stocks even are.',
    color: '#10b981',
    dim: 'rgba(16,185,129,0.08)',
    questions: BEGINNER_QUESTIONS,
  },
  {
    id: 'intermediate',
    label: 'Intermediate',
    emoji: '📊',
    desc: 'Know the basics. Made some trades but still learning.',
    color: '#06b6d4',
    dim: 'rgba(6,182,212,0.08)',
    questions: INTERMEDIATE_QUESTIONS,
  },
  {
    id: 'advanced',
    label: 'Advanced',
    emoji: '🎯',
    desc: 'Read charts, know the jargon, understand risk.',
    color: '#8b5cf6',
    dim: 'rgba(139,92,246,0.08)',
    questions: ADVANCED_QUESTIONS,
  },
];

export default function Signup() {
  const [step, setStep] = useState('form'); // form | skill | quiz | analyzing
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [registeredUserId, setRegisteredUserId] = useState(null);

  const [skillLevel, setSkillLevel] = useState(null); // SKILL_LEVELS entry
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});
  const [sliderValue, setSliderValue] = useState(5000);

  const setUser = useStore(s => s.setUser);
  const logout = useStore(s => s.logout);
  const updateFearScore = useStore(s => s.updateFearScore);
  const navigate = useNavigate();

  const questions = skillLevel?.questions || BEGINNER_QUESTIONS;

  // ── Form submit → register → go to skill picker ──────────────────
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) { setError('Please fill in all fields.'); return; }
    if (password.length < 4) { setError('Password must be at least 4 characters.'); return; }
    setError('');
    try {
      const { api } = await import('../services/api.js');
      
      // Clear any previous session before registering new account
      logout();
      
      const data = await api.register(email, password);
      if (data.token) {
        localStorage.setItem('token', data.token);
        setRegisteredUserId(data._id || null);
        setStep('skill');
      } else {
        setError(data.message || 'Registration failed');
      }
    } catch {
      setError('Server connection failed');
    }
  };

  // ── Skill picker → quiz ───────────────────────────────────────────
  const handleSkillSelect = (level) => {
    setSkillLevel(level);
    setSliderValue(level.questions.find(q => q.type === 'slider')?.default || 5000);
    setCurrentQ(0);
    setAnswers({});
    setTimeout(() => setStep('quiz'), 0);
  };

  // ── Answer option ─────────────────────────────────────────────────
  const selectOption = (qIndex, option) => {
    const updated = { ...answers, [qIndex]: option };
    setAnswers(updated);
    setTimeout(() => {
      if (qIndex < questions.length - 1) setCurrentQ(qIndex + 1);
      else finishQuiz(updated);
    }, 300);
  };

  const handleSliderSubmit = () => {
    const updated = { ...answers, [currentQ]: { value: sliderValue } };
    finishQuiz(updated);
  };

  // ── Finish → analyze ──────────────────────────────────────────────
  const finishQuiz = (finalAnswers) => {
    setStep('analyzing');
    let totalFear = 0, litScore = 5, count = 0;
    Object.values(finalAnswers).forEach(a => {
      if (a.fearWeight) { totalFear += a.fearWeight; count++; }
      if (a.litScore) litScore = Math.max(litScore, a.litScore);
    });

    // Adjust literacy base by skill level
    if (skillLevel?.id === 'intermediate') litScore = Math.max(litScore, 5);
    if (skillLevel?.id === 'advanced') litScore = Math.max(litScore, 8);

    const avgFear = count > 0 ? totalFear / count : 2;
    const fearScore = Math.min(100, Math.round((avgFear / 3) * 100));

    setTimeout(async () => {
      let walletBalance = 100000;
      try {
        const { api } = await import('../services/api.js');
        const wallet = await api.getWallet();
        if (Number.isFinite(Number(wallet?.balance))) walletBalance = Number(wallet.balance);
      } catch { }

      const user = {
        _id: registeredUserId || undefined,
        id: Date.now(), name, email,
        iqCoins: walletBalance, fearScore,
        fearClass: fearScore >= 65 ? 'HIGH' : fearScore >= 35 ? 'MEDIUM' : 'LOW',
        literacyScore: litScore,
        skillLevel: skillLevel?.id || 'beginner',
        totalTrades: 0, totalPnL: 0, sessionCount: 1,
        startingAmount: sliderValue,
        questionnaireAnswers: finalAnswers,
        createdAt: Date.now(),
      };
      setUser(user);
      updateFearScore({ quizFearAnswers: avgFear, sessionCount: 1 });
      navigate('/app');
    }, 2500);
  };

  // ── Modal width per step ──────────────────────────────────────────
  const modalWidth = step === 'skill' ? '680px' : step === 'quiz' ? '600px' : '440px';

  return (
    <div style={{ minHeight: '100vh', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ position: 'fixed', inset: 0, zIndex: 0 }}>
        <BackgroundGrid cameraOffset />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at center, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.4) 100%)', pointerEvents: 'none' }} />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -8 }}
          transition={{ duration: 0.35, ease: [0.34, 1.56, 0.64, 1] }}
          style={{
            position: 'relative', zIndex: 10,
            background: 'rgba(255,255,255,0.88)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            padding: step === 'skill' ? '48px 48px 40px' : '48px',
            borderRadius: '24px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.1), 0 1px 0 rgba(255,255,255,0.6) inset',
            border: '1px solid rgba(0,0,0,0.06)',
            width: '100%', maxWidth: modalWidth,
          }}
        >
          {/* ── STEP: FORM ── */}
          {step === 'form' && (
            <div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '32px' }}>
                <Logo width="48" height="48" className="mb-4" />
                <h1 style={{ fontSize: '28px', fontWeight: 800, marginTop: '16px', letterSpacing: '-0.02em' }}>Create account</h1>
                <p style={{ color: 'var(--text-muted)' }}>Start trading fearlessly in under 60 seconds.</p>
              </div>
              <form onSubmit={handleFormSubmit}>
                {[
                  { label: 'Name', type: 'text', placeholder: 'Your name', value: name, set: setName },
                  { label: 'Email', type: 'email', placeholder: 'you@example.com', value: email, set: setEmail },
                  { label: 'Password', type: 'password', placeholder: '••••••••', value: password, set: setPassword },
                ].map(f => (
                  <div key={f.label} style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>{f.label}</label>
                    <input type={f.type} placeholder={f.placeholder} value={f.value}
                      onChange={e => f.set(e.target.value)}
                      style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1.5px solid rgba(0,0,0,0.1)', background: '#fff', fontSize: 15, outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                ))}
                {error && <div style={{ color: 'var(--red)', fontSize: '13px', marginBottom: '16px', textAlign: 'center' }}>{error}</div>}
                <button className="btn-groww" type="submit" style={{ width: '100%', padding: '14px', fontSize: '16px', marginTop: 8 }}>
                  Continue →
                </button>
              </form>
              <div style={{ marginTop: '24px', textAlign: 'center', display: 'flex', justifyContent: 'center', gap: '16px' }}>
                <Link to="/" style={{ fontSize: '14px', color: 'var(--text-muted)', textDecoration: 'none' }}>← Home</Link>
                <span style={{ color: 'rgba(0,0,0,0.1)' }}>|</span>
                <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                  Have an account? <Link to="/login" style={{ color: 'var(--groww-teal)', fontWeight: 600 }}>Log in</Link>
                </span>
              </div>
            </div>
          )}

          {/* ── STEP: SKILL PICKER ── */}
          {step === 'skill' && (
            <div>
              <div style={{ textAlign: 'center', marginBottom: 36 }}>
                <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.2em', color: 'var(--groww-teal)', marginBottom: 10 }}>STEP 1 OF 2</div>
                <h1 style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '-0.02em', marginBottom: 8 }}>How experienced are you?</h1>
                <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>We'll tailor your 5-question profile to your level.</p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
                {SKILL_LEVELS.map(level => (
                  <motion.button
                    key={level.id}
                    onClick={() => handleSkillSelect(level)}
                    whileHover={{ y: -6, scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    style={{
                      padding: '28px 20px',
                      borderRadius: '18px',
                      border: `2px solid ${level.color}33`,
                      background: level.dim,
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'box-shadow 0.2s',
                      fontFamily: 'var(--font-body)',
                    }}
                  >
                    <div style={{ fontSize: 44, marginBottom: 12, lineHeight: 1 }}>{level.emoji}</div>
                    <div style={{ fontSize: 16, fontWeight: 900, color: level.color, marginBottom: 8, letterSpacing: '-.01em' }}>{level.label}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5, fontWeight: 500 }}>{level.desc}</div>
                  </motion.button>
                ))}
              </div>
              <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)' }}>
                You'll answer 5 questions tailored to your level. Honest answers = better setup.
              </div>
            </div>
          )}

          {/* ── STEP: QUIZ ── */}
          {step === 'quiz' && (
            <div>
              {/* Level badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24,
                padding: '8px 14px', borderRadius: 100, background: skillLevel?.dim,
                border: `1px solid ${skillLevel?.color}33`, width: 'fit-content' }}>
                <span>{skillLevel?.emoji}</span>
                <span style={{ fontSize: 11, fontWeight: 800, color: skillLevel?.color, letterSpacing: '.12em' }}>
                  {skillLevel?.label?.toUpperCase()} TRACK
                </span>
              </div>

              <AnimatePresence mode="wait">
                <motion.div key={currentQ}
                  initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.28 }}>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--groww-teal)', letterSpacing: '.08em', marginBottom: 8 }}>
                    QUESTION {currentQ + 1} OF {questions.length}
                  </div>
                  <div style={{ fontSize: '22px', fontWeight: 800, marginBottom: 28, lineHeight: 1.3, color: 'var(--groww-text)' }}>
                    {questions[currentQ].text}
                  </div>

                  {questions[currentQ].type === 'slider' ? (
                    <div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '36px', fontWeight: 800, color: 'var(--groww-teal)', marginBottom: 20, textAlign: 'center' }}>
                        ₹{sliderValue.toLocaleString()}
                      </div>
                      <input type="range" className="question-slider"
                        min={questions[currentQ].min} max={questions[currentQ].max} step={questions[currentQ].step}
                        value={sliderValue} onChange={e => setSliderValue(Number(e.target.value))}
                        style={{ width: '100%', accentColor: skillLevel?.color || 'var(--groww-teal)' }} />
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)', margin: '8px 0 28px', fontWeight: 600 }}>
                        <span>₹{questions[currentQ].min.toLocaleString()}</span>
                        <span>₹{questions[currentQ].max.toLocaleString()}</span>
                      </div>
                      <button className="btn-groww" onClick={handleSliderSubmit} style={{ width: '100%', padding: '14px', background: skillLevel?.color }}>
                        Complete Profile →
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {questions[currentQ].options.map((opt, i) => (
                        <motion.button key={i}
                          style={{
                            width: '100%', textAlign: 'left', padding: '16px 20px', borderRadius: '12px',
                            border: answers[currentQ]?.value === opt.value
                              ? `2px solid ${skillLevel?.color}` : '1.5px solid rgba(0,0,0,0.09)',
                            background: answers[currentQ]?.value === opt.value ? skillLevel?.dim : '#fff',
                            color: 'var(--groww-text)', fontWeight: 600, cursor: 'pointer', fontSize: '15px',
                            fontFamily: 'var(--font-body)',
                          }}
                          onClick={() => selectOption(currentQ, opt)}
                          whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.975 }}>
                          {opt.label}
                        </motion.button>
                      ))}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Progress dots */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 28 }}>
                {questions.map((_, i) => (
                  <div key={i} style={{
                    width: i === currentQ ? 20 : 8, height: 8,
                    borderRadius: 4, transition: 'all .3s',
                    background: i === currentQ ? (skillLevel?.color || 'var(--groww-teal)')
                      : i < currentQ ? (skillLevel?.color + '55') : 'rgba(0,0,0,0.1)'
                  }} />
                ))}
              </div>
            </div>
          )}

          {/* ── STEP: ANALYZING ── */}
          {step === 'analyzing' && (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div className="analyzing-spinner" style={{ width: '64px', height: '64px', borderWidth: '3px', margin: '0 auto 24px', borderTopColor: skillLevel?.color || 'var(--groww-teal)' }} />
              <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '8px' }}>Building your profile...</h2>
              <p style={{ color: 'var(--text-muted)', marginBottom: '28px' }}>Calibrating your {skillLevel?.label?.toLowerCase()} sandbox</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
                {['Fear Matrix', 'Literacy Score', 'Risk Engine', 'Persona Setup'].map((item, i) => (
                  <motion.div key={i}
                    style={{
                      padding: '6px 14px', borderRadius: '100px',
                      background: skillLevel?.dim || 'var(--groww-teal-dim)',
                      border: `1px solid ${skillLevel?.color || 'var(--groww-teal)'}33`,
                      fontSize: '12px', color: skillLevel?.color || 'var(--groww-teal)', fontWeight: 700,
                    }}
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + i * 0.35 }}>
                    ✓ {item}
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
