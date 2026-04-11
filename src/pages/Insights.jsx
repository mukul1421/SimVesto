import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import useStore from '../store/useStore';
import { getFearColor, getFearLabel } from '../engine/fearEngine';

export default function Insights() {
  const user = useStore(s => s.user);
  const fearScore = useStore(s => s.fearScore);
  const fearHistory = useStore(s => s.fearHistory);
  const orders = useStore(s => s.orders);
  const holdings = useStore(s => s.holdings);
  const portfolioHistory = useStore(s => s.portfolioHistory);
  const milestones = useStore(s => s.milestones);

  const fearColor = getFearColor(fearScore.score);
  const fearLabel = getFearLabel(fearScore.fearClass);

  const fearChartData = useMemo(() => {
    if (fearHistory.length < 2) {
      return Array.from({ length: 10 }, (_, i) => ({
        session: i + 1,
        score: Math.max(20, 70 - i * 4 + Math.random() * 10),
      }));
    }
    return fearHistory.map((f, i) => ({ session: i + 1, score: f.score }));
  }, [fearHistory]);

  const tradingStats = useMemo(() => {
    const buyOrders = orders.filter(o => o.type === 'BUY');
    const sellOrders = orders.filter(o => o.type === 'SELL');
    const profitTrades = sellOrders.filter(o => (o.pnl || 0) > 0);
    const lossTrades = sellOrders.filter(o => (o.pnl || 0) < 0);
    const totalPnL = sellOrders.reduce((s, o) => s + (o.pnl || 0), 0);
    const sectorCounts = {};
    orders.forEach(o => {
      const stock = useStore.getState().stocks.find(s => s.symbol === o.symbol);
      if (stock) sectorCounts[stock.sector] = (sectorCounts[stock.sector] || 0) + 1;
    });

    return {
      totalTrades: orders.length,
      buyCount: buyOrders.length,
      sellCount: sellOrders.length,
      profitCount: profitTrades.length,
      lossCount: lossTrades.length,
      winRate: sellOrders.length > 0 ? ((profitTrades.length / sellOrders.length) * 100).toFixed(0) : '—',
      totalPnL: totalPnL.toFixed(2),
      sectorCounts,
    };
  }, [orders]);

  const sectorChartData = useMemo(() => {
    return Object.entries(tradingStats.sectorCounts).map(([sector, count]) => ({ sector, count })).sort((a, b) => b.count - a.count);
  }, [tradingStats]);

  const fearDropMsg = useMemo(() => {
    if (fearHistory.length >= 2) {
      const first = fearHistory[0].score;
      const last = fearHistory[fearHistory.length - 1].score;
      const drop = first - last;
      if (drop > 0) return `Your fear score dropped ${drop} points since your first session. You're getting braver! 💪`;
      if (drop < 0) return `Your fear score increased by ${Math.abs(drop)} points. That's okay—learning takes time.`;
    }
    return 'Complete more sessions to see your fear score trend.';
  }, [fearHistory]);

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '4px' }}>Insights 📈</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Your behavioral analytics and confidence journey</p>
      </motion.div>

      {/* Fear Score Hero */}
      <motion.div className="card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: '20px', padding: '24px', borderLeft: `4px solid ${fearColor}` }}>
        <div style={{ display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', width: '100px', height: '100px', flexShrink: 0 }}>
            <svg viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="50" cy="50" r="42" fill="none" stroke="var(--bg-surface-3)" strokeWidth="8" />
              <circle cx="50" cy="50" r="42" fill="none" stroke={fearColor} strokeWidth="8"
                strokeDasharray={`${(fearScore.score / 100) * 264} 264`}
                strokeLinecap="round" style={{ transition: 'stroke-dasharray 1s ease' }} />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '28px', fontWeight: 700, color: fearColor }}>{fearScore.score}</div>
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '18px', fontWeight: 700, marginBottom: '4px' }}>{fearLabel}</div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>{fearDropMsg}</div>
          </div>
        </div>
      </motion.div>

      <div className="grid-2" style={{ gap: '20px', marginBottom: '20px' }}>
        {/* Fear Score Timeline */}
        <motion.div className="card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>Fear Score Over Time</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={fearChartData}>
              <defs>
                <linearGradient id="fearGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={fearColor} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={fearColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="session" tick={{ fontSize: 10, fill: '#5a5a72' }} axisLine={false} tickLine={false} label={{ value: 'Session', position: 'insideBottom', offset: -5, fill: '#5a5a72', fontSize: 10 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#5a5a72' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#111118', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '8px', fontSize: '12px' }} />
              <Area type="monotone" dataKey="score" stroke={fearColor} fill="url(#fearGrad)" strokeWidth={2} dot={{ r: 3, fill: fearColor }} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Trading Stats */}
        <motion.div className="card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px' }}>Trading Statistics</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {[
              { label: 'Total Trades', value: tradingStats.totalTrades, color: 'var(--text-primary)' },
              { label: 'Win Rate', value: `${tradingStats.winRate}%`, color: 'var(--green)' },
              { label: 'Buy Orders', value: tradingStats.buyCount, color: 'var(--green)' },
              { label: 'Sell Orders', value: tradingStats.sellCount, color: 'var(--red)' },
              { label: 'Profitable', value: tradingStats.profitCount, color: 'var(--green)' },
              { label: 'Loss-making', value: tradingStats.lossCount, color: 'var(--red)' },
            ].map((s, i) => (
              <div key={i} style={{ background: 'var(--bg-surface-2)', borderRadius: 'var(--radius-md)', padding: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>{s.label}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '20px', fontWeight: 700, color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="grid-2" style={{ gap: '20px', marginBottom: '20px' }}>
        {/* Sector Distribution */}
        <motion.div className="card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>Most Traded Sectors</h3>
          {sectorChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={sectorChartData} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 10, fill: '#5a5a72' }} axisLine={false} tickLine={false} />
                <YAxis dataKey="sector" type="category" tick={{ fontSize: 11, fill: '#a0a0b8' }} axisLine={false} tickLine={false} width={100} />
                <Tooltip contentStyle={{ background: '#111118', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '8px', fontSize: '12px' }} />
                <Bar dataKey="count" fill="#7c3aed" radius={[0, 4, 4, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontSize: '13px' }}>Make some trades to see sector data</div>
          )}
        </motion.div>

        {/* Achievements */}
        <motion.div className="card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>🏆 Milestones</h3>
          {milestones.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {milestones.map(m => (
                <div key={m.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 12px', background: 'var(--bg-surface-2)', borderRadius: 'var(--radius-md)',
                }}>
                  <div style={{ fontSize: '13px', fontWeight: 500 }}>{m.label}</div>
                  <span className="badge badge-green">+{m.reward} IQ</span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', fontSize: '13px' }}>
              Start trading to unlock milestones and earn IQ Coins!
            </div>
          )}

          {/* Locked milestones */}
          <div style={{ marginTop: '12px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 600 }}>LOCKED</div>
            {[
              { label: 'First Trade', reward: 200 },
              { label: '10 Trades', reward: 500 },
              { label: 'First Profit', reward: 300 },
              { label: 'Diversified Portfolio (5 stocks)', reward: 400 },
              { label: 'Fearless (Score < 40)', reward: 1000 },
            ].filter(m => !milestones.find(um => um.label === m.label)).slice(0, 3).map((m, i) => (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '8px 12px', opacity: 0.4, fontSize: '12px',
              }}>
                <span>🔒 {m.label}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>+{m.reward} IQ</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
