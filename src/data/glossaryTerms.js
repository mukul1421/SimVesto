export const GLOSSARY_TERMS = [
  {
    key: 'stock',
    term: 'Stock',
    aliases: ['stocks', 'equity'],
    meaning: 'A stock is a tiny slice of a company. Buy it, and you own a small piece of that business.',
    relevance: 'This is the core thing you trade in SimVesto. Stock prices moving up or down directly impact your portfolio value.',
  },
  {
    key: 'share',
    term: 'Share',
    aliases: ['shares'],
    meaning: 'A share is one unit of stock. Think of it like one ticket to a company ownership party.',
    relevance: 'Your profit or loss scales with how many shares you hold, so position size matters a lot.',
  },
  {
    key: 'market sentiment',
    term: 'Market Sentiment',
    aliases: ['sentiment', 'investor sentiment'],
    meaning: 'Market sentiment is the overall vibe of traders, like fear, excitement, or confidence.',
    relevance: 'Even before hard data drops, sentiment can move prices fast and influence buy or sell pressure.',
  },
  {
    key: 'portfolio',
    term: 'Portfolio',
    aliases: ['portfolios'],
    meaning: 'Your portfolio is your full collection of investments, not just one stock.',
    relevance: 'A balanced portfolio usually handles market swings better than going all-in on one pick.',
  },
  {
    key: 'holdings',
    term: 'Holdings',
    aliases: ['holding'],
    meaning: 'Holdings are the positions you currently own in your account.',
    relevance: 'Your holdings page shows where your money is parked and which positions are carrying risk.',
  },
  {
    key: 'buy',
    term: 'Buy',
    aliases: ['bought', 'buying'],
    meaning: 'Buy means you enter a position by purchasing shares.',
    relevance: 'Buying at the right price and quantity shapes your average cost and future returns.',
  },
  {
    key: 'sell',
    term: 'Sell',
    aliases: ['sold', 'selling'],
    meaning: 'Sell means you exit some or all of a position to lock in profit or cut loss.',
    relevance: 'Your sell timing decides realized P&L, so exits are as important as entries.',
  },
  {
    key: 'sensex',
    term: 'Sensex',
    aliases: [],
    meaning: 'Sensex is a major Indian stock market index tracking 30 large, established companies.',
    relevance: 'It gives a quick pulse check of how big Indian market leaders are performing overall.',
  },
  {
    key: 'nifty',
    term: 'Nifty',
    aliases: ['nifty 50'],
    meaning: 'Nifty (Nifty 50) is an index of 50 leading companies listed on NSE.',
    relevance: 'When people say the market was up or down today, they are often referring to Nifty moves.',
  },
  {
    key: 'volatility',
    term: 'Volatility',
    aliases: ['volatile'],
    meaning: 'Volatility is how sharply and frequently prices move.',
    relevance: 'Higher volatility can create bigger opportunities and bigger risk, both at once.',
  },
  {
    key: 'bull market',
    term: 'Bull Market',
    aliases: ['bullish'],
    meaning: 'A bull market is when prices trend upward and confidence is high.',
    relevance: 'Bull phases reward patience, but they can still include quick pullbacks.',
  },
  {
    key: 'bear market',
    term: 'Bear Market',
    aliases: ['bearish'],
    meaning: 'A bear market is when prices trend downward and fear dominates.',
    relevance: 'Risk control becomes extra important in bear phases to protect capital.',
  },
  {
    key: 'diversification',
    term: 'Diversification',
    aliases: ['diversified'],
    meaning: 'Diversification means spreading money across different assets instead of one basket.',
    relevance: 'It helps reduce damage when one sector or stock gets hit hard.',
  },
  {
    key: 'liquidity',
    term: 'Liquidity',
    aliases: ['liquid'],
    meaning: 'Liquidity is how easily you can buy or sell without causing a big price jump.',
    relevance: 'More liquid stocks usually mean smoother entries and exits with less slippage.',
  },
  {
    key: 'pnl',
    term: 'P&L',
    aliases: ['profit and loss', 'profit', 'loss'],
    meaning: 'P&L means profit and loss, basically your scoreboard for how your trades are doing.',
    relevance: 'Tracking P&L helps you audit decisions and spot patterns in your strategy.',
  },
];

export const GLOSSARY_MAP = GLOSSARY_TERMS.reduce((acc, item) => {
  acc[item.key] = item;
  return acc;
}, {});
