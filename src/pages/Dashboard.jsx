import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import useStore from '../store/useStore';
import GlossaryText from '../components/glossary/GlossaryHighlighter';

const PIE_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899', '#06b6d4', '#f97316'];

export default function Dashboard() {
  const user = useStore(s => s.user);
  const stocks = useStore(s => s.stocks);
  const holdings = useStore(s => s.holdings);
  const orders = useStore(s => s.orders);
  const portfolioHistory = useStore(s => s.portfolioHistory);
  const navigate = useNavigate();

  const totalValue = useMemo(() => holdings.reduce((s, h) => s + (h.currentValue || 0), 0), [holdings]);
  const totalPnL = useMemo(() => holdings.reduce((s, h) => s + (h.pnl || 0), 0), [holdings]);
  const netWorth = (user?.iqCoins || 0) + totalValue;
  const moneySpent = useMemo(() => holdings.reduce((s, h) => s + (h.currentValue - h.pnl), 0), [holdings]);

  // Simulated Market Pulse Data
  const nifty50 = { value: 22643.40, change: 124.50, changePct: 0.55 };
  const sensex = { value: 74683.70, change: 350.20, changePct: 0.47 };

  const topGainers = useMemo(() => [...stocks].sort((a, b) => b.dayChangePct - a.dayChangePct).slice(0, 4), [stocks]);
  const topLosers = useMemo(() => [...stocks].sort((a, b) => a.dayChangePct - b.dayChangePct).slice(0, 4), [stocks]);
  const recentOrders = useMemo(() => [...orders].reverse().slice(0, 5), [orders]);
  
  const pieData = useMemo(() => {
    return holdings.map(h => ({ name: h.symbol, value: h.currentValue })).sort((a, b) => b.value - a.value);
  }, [holdings]);

  const portfolioChartData = useMemo(() => {
    let history = portfolioHistory.slice(-50);
    if (history.length > 0 && history.length < 50) {
      const padding = [];
      const firstPoint = history[0];
      for (let i = 50 - history.length; i > 0; i--) {
        padding.push({ timestamp: firstPoint.timestamp - i * 2000, netWorth: firstPoint.netWorth, padded: true });
      }
      history = [...padding, ...history];
    } else if (history.length === 0) {
      const now = Date.now();
      history = Array.from({ length: 50 }, (_, i) => ({ timestamp: now - (50 - i) * 2000, netWorth: netWorth, padded: true }));
    }
    return history.map((p) => {
      const t = p.timestamp / 1000;
      const noise = p.padded ? 0 : (Math.sin(t) * 1.5 + Math.cos(t * 1.2) * 0.8);
      return { time: p.timestamp, value: Number((p.netWorth + (totalPnL === 0 ? noise : noise * 0.1)).toFixed(2)) };
    });
  }, [portfolioHistory, netWorth, totalPnL]);

  const formatCurrency = (val) => `₹${val.toLocaleString()}`;

  return (
    <div style={{ paddingBottom: '60px', maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '40px' }}>
      
      {/* Header Area */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} style={{ marginTop: '24px' }}>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '56px', fontWeight: 400, color: '#ffffff', letterSpacing: '-0.02em', marginBottom: '8px', textShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
          Market Overview
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '16px', fontFamily: 'var(--font-mono)' }}>
          <GlossaryText text="SimVesto Terminal // Real-time simulated analytics." />
        </p>
      </motion.div>

      {/* Market Pulse Widget Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
        {[
          { label: 'NIFTY 50', data: nifty50 },
          { label: 'SENSEX', data: sensex },
        ].map((idx, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1, duration: 0.5 }}
            onClick={() => navigate('/app/explore')}
            whileHover={{ scale: 1.02 }}
            className="card-3d"
            style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', color: '#fff' }}>{idx.label}</div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '18px', fontWeight: 600, color: '#fff' }}>{idx.data.value.toLocaleString()}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--green)' }}>+{idx.data.change.toFixed(2)} (+{idx.data.changePct}%)</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Master Telemetry Hub */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px' }}>
        
        {/* Deep Net Worth Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.5 }}
          className="card-3d">
          <div style={{ fontSize: '13px', fontWeight: 600, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
            <GlossaryText text="Total Net Worth" />
          </div>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: '64px', fontWeight: 400, color: '#ffffff', letterSpacing: '-0.03em', lineHeight: 1.1, textShadow: '2px 4px 10px rgba(0,0,0,0.5)' }}>
            {formatCurrency(netWorth)}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-mono)', fontSize: '14px', marginTop: '16px', color: totalPnL >= 0 ? 'var(--green)' : 'var(--red)' }}>
            <span style={{ padding: '4px 10px', borderRadius: '4px', background: totalPnL >= 0 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', fontWeight: 700 }}>
              {totalPnL >= 0 ? '+' : '-'}{formatCurrency(Math.abs(totalPnL))}
            </span>
            <span style={{ color: 'var(--text-muted)' }}>Lifetime Return</span>
          </div>
        </motion.div>

        {/* Money Spent Sub-Hub */}
        <div style={{ display: 'grid', gridTemplateRows: '1fr 1fr', gap: '24px' }}>
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
            className="card-3d" style={{ padding: '20px 28px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
              <GlossaryText text="Total Money Spent / Invested" />
            </div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: '42px', fontWeight: 400, color: 'var(--text-primary)' }}>
              {formatCurrency(moneySpent)}
            </div>
          </motion.div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="card-3d" style={{ padding: '16px 20px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Available Cash</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '24px', fontWeight: 400, color: '#fff' }}>{formatCurrency(user?.iqCoins || 0)}</div>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
              className="card-3d" style={{ padding: '16px 20px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Total Trades</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '24px', fontWeight: 400, color: '#fff' }}>{orders.length}</div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Primary Chart Bento Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '32px' }}>
        
        {/* Main Performance Area Component */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="card-3d">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '32px', fontWeight: 400, color: '#ffffff' }}><GlossaryText text="Performance" /></h3>
          </div>
          <ResponsiveContainer width="100%" height={340}>
            <AreaChart data={portfolioChartData}>
              <defs>
                <linearGradient id="colorAcc" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={totalPnL >= 0 ? '#10b981' : '#a1a1aa'} stopOpacity={0.2}/>
                  <stop offset="95%" stopColor={totalPnL >= 0 ? '#10b981' : '#a1a1aa'} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="value" stroke={totalPnL >= 0 ? '#10b981' : '#ffffff'} strokeWidth={2} fillOpacity={1} fill="url(#colorAcc)" activeDot={{ r: 4, strokeWidth: 0, fill: '#fff' }} />
              <XAxis hide dataKey="time" />
              <YAxis hide domain={['dataMin - 100', 'dataMax + 100']} />
              <Tooltip
                contentStyle={{ background: '#0a0a0a', border: '1px solid var(--border-strong)', borderRadius: '8px', fontSize: '13px', padding: '12px 16px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}
                itemStyle={{ color: '#fff', fontWeight: 400, fontFamily: 'var(--font-mono)' }}
                labelStyle={{ display: 'none' }}
                formatter={(v) => [`₹${Number(v).toLocaleString()}`, 'Value']}
                separator=" — "
                cursor={{ stroke: 'var(--border-strong)', strokeWidth: 1, strokeDasharray: '4 4' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Asset Allocation Donut Component */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="card-3d" style={{ display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '28px', fontWeight: 400, color: '#ffffff', marginBottom: '24px' }}>
            <GlossaryText text="Allocation" />
          </h3>
          
          {pieData.length > 0 ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={pieData} innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value" stroke="none">
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ background: '#0a0a0a', border: '1px solid var(--border-strong)', borderRadius: '8px', fontFamily: 'var(--font-mono)', fontSize: '13px' }}
                    itemStyle={{ color: '#fff' }} formatter={(val) => `₹${val.toLocaleString()}`}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center', marginTop: '24px' }}>
                {pieData.slice(0, 4).map((d, i) => (
                  <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: PIE_COLORS[i % PIE_COLORS.length] }} />
                    {d.name}
                  </div>
                ))}
                {pieData.length > 4 && <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>+{pieData.length - 4} more</div>}
              </div>
            </div>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '14px', textAlign: 'center', padding: '0 20px' }}>
              No active assets in your portfolio right now. Visit Explore to buy chunks.
            </div>
          )}
        </motion.div>
      </div>

      {/* Tertiary Row: Movers & Timelines */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr) minmax(0,1.5fr)', gap: '32px' }}>
        
        {/* Top Gainers */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="card-3d">
          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', fontWeight: 400, color: '#ffffff', marginBottom: '20px' }}><GlossaryText text="Top Gainers" /></h3>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {topGainers.map((stock, idx) => (
              <div key={stock.id} onClick={() => navigate(`/app/trade/${stock.symbol}`)}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: idx !== topGainers.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none', cursor: 'pointer' }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', color: 'var(--text-primary)', fontWeight: 600 }}>{stock.symbol}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{stock.name.slice(0, 15)}...</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', color: 'var(--text-primary)' }}>₹{stock.currentPrice.toLocaleString()}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--green)', marginTop: '2px' }}>+{stock.dayChangePct.toFixed(2)}%</div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Top Losers */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 }} className="card-3d">
          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', fontWeight: 400, color: '#ffffff', marginBottom: '20px' }}><GlossaryText text="Top Losers" /></h3>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {topLosers.map((stock, idx) => (
              <div key={stock.id} onClick={() => navigate(`/app/trade/${stock.symbol}`)}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: idx !== topLosers.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none', cursor: 'pointer' }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', color: 'var(--text-primary)', fontWeight: 600 }}>{stock.symbol}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{stock.name.slice(0, 15)}...</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', color: 'var(--text-primary)' }}>₹{stock.currentPrice.toLocaleString()}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--red)', marginTop: '2px' }}>{stock.dayChangePct.toFixed(2)}%</div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Recent Activity Timeline */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="card-3d">
          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', fontWeight: 400, color: '#ffffff', marginBottom: '20px' }}>
            <GlossaryText text="Recent Orders" />
          </h3>
          
          {recentOrders.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {recentOrders.map((ord, idx) => (
                <div key={ord.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', padding: '14px 0', borderBottom: idx !== recentOrders.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: ord.type === 'buy' ? 'rgba(59,130,246,0.15)' : 'rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid rgba(255,255,255,0.1)' }}>
                    <span style={{ fontSize: '18px' }}>{ord.type === 'buy' ? '↘' : '↗'}</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 500 }}>
                        {ord.type === 'buy' ? 'Bought' : 'Sold'} <span style={{ fontFamily: 'var(--font-mono)', color: '#fff' }}>{ord.shares}</span> shares
                      </div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', color: 'var(--text-primary)', fontWeight: 600 }}>
                        {ord.type === 'buy' ? '-' : '+'}₹{(ord.shares * ord.price).toLocaleString()}
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{ord.symbol}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>@ ₹{ord.price.toLocaleString()}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '30px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
              No trading activity yet. Data will flow here soon.
            </div>
          )}
        </motion.div>

      </div>
    </div>
  );
}
