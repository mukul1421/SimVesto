// ══════════════════════════════════════════════════════
//  Trading Arena — Scenario Definitions
//  5 role-based trader identities with unique traits
// ══════════════════════════════════════════════════════

export const ARENA_SCENARIOS = [
  {
    id: 'beginner',
    role: 'The Rookie',
    avatar: '🧑‍💼',
    tagline: 'First time in the market. Every decision feels huge.',
    startBalance: 5000,
    narrative: [
      "You've just received ₹5,000 from your first salary.",
      "Your friend keeps talking about stocks. You finally decide to try.",
      "You don't know much — but you know you want to make this money grow.",
      "Goal: Don't panic. Make at least one sensible trade.",
      "Constraint: You can't afford to lose more than 30% of your balance.",
    ],
    goals: ['Survive without panic selling', 'Make at least 2 trades', 'End with >₹3,500'],
    constraints: ['Max 30% loss tolerance', 'No shorting', 'Limited to 3 stocks'],
    drift: 0.0003,
    volatility: 0.018,
    eventProbability: 0.3,
    difficulty: 'easy',
    color: '#00f5ff',
    stocks: [
      { name: 'StableCore Ltd', symbol: 'SCL', price: 250, sector: 'Utilities' },
      { name: 'TechRise Pvt', symbol: 'TRP', price: 180, sector: 'Technology' },
      { name: 'GrowthBond Co', symbol: 'GBC', price: 320, sector: 'Finance' },
    ],
  },
  {
    id: 'overconfident',
    role: 'The Overconfident Trader',
    avatar: '😎',
    tagline: 'Big balance. Bigger ego. The market always owes you.',
    startBalance: 50000,
    narrative: [
      "You've had a great run this month. ₹50,000 sitting in your account.",
      "You KNOW this market. You've read every chart, every signal.",
      "Everyone around you seems scared. That's their loss.",
      "Goal: 20% return in this session. Nothing less.",
      "Constraint: Your confidence is your risk. Don't let it become your downfall.",
    ],
    goals: ['Achieve +20% returns', 'Make decisive trades without hesitation', 'Beat market average'],
    constraints: ['Must trade aggressively', 'No holding cash >40% of balance', 'Volatility is your friend'],
    drift: -0.0002,
    volatility: 0.028,
    eventProbability: 0.55,
    difficulty: 'hard',
    color: '#ff6b00',
    stocks: [
      { name: 'VolatileVentures', symbol: 'VVT', price: 890, sector: 'Crypto-Adjacent' },
      { name: 'MomentumMax', symbol: 'MMX', price: 450, sector: 'Growth' },
      { name: 'HighBeta Corp', symbol: 'HBC', price: 1200, sector: 'Tech' },
      { name: 'RiskyRocket Inc', symbol: 'RRI', price: 600, sector: 'Biotech' },
    ],
  },
  {
    id: 'founder',
    role: 'The Startup Founder',
    avatar: '🚀',
    tagline: 'You built a company. Now it\'s time to learn investing.',
    startBalance: 20000,
    narrative: [
      "Your startup just broke even. You have ₹20,000 to spare.",
      "Everyone says diversify. But you only know one thing: bet big.",
      "The market is noisy — almost like your early days raising money.",
      "Goal: Learn to think like an investor, not just a builder.",
      "Constraint: No putting all eggs in one basket.",
    ],
    goals: ['Diversify across 3+ stocks', 'Avoid single-stock over-concentration', 'Generate steady returns'],
    constraints: ['Max 40% in any single stock', 'Must hold positions >30 seconds before selling', 'No panic reversals'],
    drift: 0.0001,
    volatility: 0.022,
    eventProbability: 0.4,
    difficulty: 'medium',
    color: '#c084fc',
    stocks: [
      { name: 'TechVenture A', symbol: 'TVA', price: 340, sector: 'SaaS' },
      { name: 'MarketMover B', symbol: 'MMB', price: 210, sector: 'Fintech' },
      { name: 'ScaleUp Corp', symbol: 'SUC', price: 560, sector: 'Infrastructure' },
      { name: 'DisruptX Ltd', symbol: 'DXL', price: 420, sector: 'AI' },
    ],
  },
  {
    id: 'longterm',
    role: 'The Long-Term Investor',
    avatar: '🧓',
    tagline: 'You believe in the slow game. But right now, the market isn\'t cooperating.',
    startBalance: 30000,
    narrative: [
      "You believe in fundamentals, not noise.",
      "But today something is different — the market is swinging wildly.",
      "Your portfolio, built over years, is suddenly bleeding.",
      "Goal: Stay disciplined. Don't let short-term chaos destroy a long-term plan.",
      "Constraint: You're not allowed to sell everything. Hold your conviction.",
    ],
    goals: ['Hold positions through volatility', 'Avoid panic selling', 'End with <15% max drawdown'],
    constraints: ['Cannot sell >50% of any position at once', 'Must HOLD at least 2 stocks till session end'],
    drift: 0.0005,
    volatility: 0.015,
    eventProbability: 0.6,
    difficulty: 'medium',
    color: '#34d399',
    stocks: [
      { name: 'BluechipPrime', symbol: 'BCP', price: 1800, sector: 'FMCG' },
      { name: 'SteadyGrowth Ltd', symbol: 'SGL', price: 950, sector: 'Banking' },
      { name: 'DividendKing Co', symbol: 'DKC', price: 2200, sector: 'Energy' },
      { name: 'IndexTrack ETF', symbol: 'ITF', price: 430, sector: 'Diversified' },
    ],
  },
  {
    id: 'panic',
    role: 'The Panic Seller',
    avatar: '😱',
    tagline: 'Every red candle is a disaster. Every dip feels like a crash.',
    startBalance: 15000,
    narrative: [
      "You've been watching the news. Everything sounds terrible.",
      "Your portfolio is red. Your palms are sweating.",
      "The news just said: 'Market nears correction territory.'",
      "Goal: Overcome your instincts. Don't sell at the bottom.",
      "Constraint: Panic selling will be scored against you. Resist the urge.",
    ],
    goals: ['Resist panic selling during dips', 'Make at least 3 calm, non-reactive decisions', 'Recover from a dip'],
    constraints: ['Heavy penalty for rapid sell-offs', 'Must wait 15 seconds after a dip before selling', 'Fear score tracked real-time'],
    drift: -0.0004,
    volatility: 0.032,
    eventProbability: 0.7,
    difficulty: 'hard',
    color: '#ff0040',
    stocks: [
      { name: 'CrashCorp Intl', symbol: 'CCI', price: 380, sector: 'Retail' },
      { name: 'VolatileX', symbol: 'VLX', price: 290, sector: 'Crypto' },
      { name: 'NewsShock Ltd', symbol: 'NSL', price: 520, sector: 'Media' },
    ],
  },
];

export const getScenarioById = (id) => ARENA_SCENARIOS.find(s => s.id === id);

export const getRandomScenario = () => {
  const idx = Math.floor(Math.random() * ARENA_SCENARIOS.length);
  return ARENA_SCENARIOS[idx];
};

export const DIFFICULTY_MAP = {
  easy: ['beginner'],
  medium: ['founder', 'longterm'],
  hard: ['overconfident', 'panic'],
};
