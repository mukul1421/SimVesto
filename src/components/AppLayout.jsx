import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import useStore from '../store/useStore';
import FearFeedbackModal from './fear/FearFeedbackModal';

const IconDashboard = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>;
const IconExplore = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>;
const IconHoldings = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>;
const IconOrders = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/><path d="M9 14h6"/><path d="M9 18h6"/><path d="M9 10h6"/></svg>;
const IconAdvisor = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8V4H8"/><rect x="4" y="8" width="16" height="12" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>;
const IconChat = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
const IconInsights = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>;
const IconProfile = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const IconGlossary = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>;

const NAV_ITEMS = [
  { path: '/app', icon: <IconDashboard />, label: 'Dashboard', end: true },
  { path: '/app/explore', icon: <IconExplore />, label: 'Explore' },
  { path: '/app/holdings', icon: <IconHoldings />, label: 'Holdings' },
  { path: '/app/orders', icon: <IconOrders />, label: 'Orders' },
  { path: '/app/advisor', icon: <IconAdvisor />, label: 'AI Advisor' },
  { path: '/app/chat', icon: <IconChat />, label: 'Market Chatbot' },
  { path: '/app/insights', icon: <IconInsights />, label: 'Insights' },
  { path: '/app/profile', icon: <IconProfile />, label: 'Profile' },
];

export default function AppLayout() {
  const user = useStore(s => s.user);
  const stocks = useStore(s => s.stocks);
  const startRealtimeSync = useStore(s => s.startRealtimeSync);
  const stopRealtimeSync = useStore(s => s.stopRealtimeSync);
  const recordPortfolioSnapshot = useStore(s => s.recordPortfolioSnapshot);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [searchReadOnly, setSearchReadOnly] = useState(true);
  
  const fearModalData = useStore(s => s.fearModalData);
  const clearFearModal = useStore(s => s.clearFearModal);

  useEffect(() => {
    startRealtimeSync(4000);
    useStore.getState().fetchFearData();
    const snapInterval = setInterval(recordPortfolioSnapshot, 2000);
    return () => {
      stopRealtimeSync();
      clearInterval(snapInterval);
    };
  }, [startRealtimeSync, stopRealtimeSync, recordPortfolioSnapshot]);

  const filteredStocks = searchQuery
    ? stocks.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.symbol.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setShowSearch(e.target.value.length > 0);
  };

  const goToStock = (symbol) => {
    setSearchQuery('');
    setShowSearch(false);
    navigate(`/app/trade/${symbol}`);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Sidebar Navigation */}
      <nav className="app-nav">
        <div className="app-nav-logo" onClick={() => navigate('/app')} title="SimVesto">SV</div>
        {NAV_ITEMS.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.end}
            className={({ isActive }) => `app-nav-item ${isActive ? 'active' : ''}`}
          >
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{item.icon}</span>
            <span className="app-nav-tooltip">{item.label}</span>
          </NavLink>
        ))}
        <div style={{ flex: 1 }}></div>
        <NavLink to="/app/glossary" className={({ isActive }) => `app-nav-item ${isActive ? 'active' : ''}`} style={{ marginTop: 'auto', marginBottom: '24px' }}>
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><IconGlossary /></span>
          <span className="app-nav-tooltip">Glossary</span>
        </NavLink>
      </nav>

      {/* Main content area */}
      <div style={{ flex: 1, marginLeft: '72px', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Top bar */}
        <header className="top-bar" style={{ left: '72px' }}>
          <div style={{ position: 'relative' }}>
            <div className="top-bar-search">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <input
                type="text"
                name="stock-search-live"
                autoComplete="new-password"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck={false}
                readOnly={searchReadOnly}
                placeholder="Search stocks..."
                value={searchQuery}
                onChange={handleSearch}
                onFocus={() => {
                  setSearchReadOnly(false);
                  if (searchQuery) setShowSearch(true);
                }}
                onBlur={() => setTimeout(() => setShowSearch(false), 200)}
              />
            </div>
            {showSearch && filteredStocks.length > 0 && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, right: 0,
                background: 'var(--bg-surface)', border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)', marginTop: '4px',
                boxShadow: 'var(--shadow-lg)', zIndex: 200, maxHeight: '300px', overflow: 'auto'
              }}>
                {filteredStocks.map(stock => (
                  <div
                    key={stock.id}
                    onClick={() => goToStock(stock.symbol)}
                    style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid var(--border-subtle)',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-surface-hover)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '13px' }}>{stock.name}</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)' }}>{stock.symbol}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: '13px' }}>₹{stock.currentPrice.toLocaleString()}</div>
                      <div className={`price-change ${stock.dayChangePct >= 0 ? 'up' : 'down'}`}>
                        {stock.dayChangePct >= 0 ? '▲' : '▼'} {Math.abs(stock.dayChangePct).toFixed(2)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="top-bar-right">
            {/* Glossary Mode Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginRight: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Glossary</span>
              <div 
                onClick={() => useStore.getState().toggleGlossaryMode()}
                style={{
                  width: '36px', height: '20px', borderRadius: '10px',
                  backgroundColor: useStore(s => s.glossaryMode) ? 'var(--accent-purple)' : 'var(--bg-surface-2)',
                  position: 'relative', cursor: 'pointer', transition: 'background 0.2s', border: '1px solid var(--border-subtle)'
                }}
              >
                <div style={{
                  width: '16px', height: '16px', borderRadius: '50%', backgroundColor: '#fff',
                  position: 'absolute', top: '1px', left: useStore(s => s.glossaryMode) ? '17px' : '1px',
                  transition: 'left 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }} />
              </div>
            </div>

            <div className="coin-display">
              <div className="coin-icon">₹</div>
              <span>{(user?.iqCoins || 0).toLocaleString()}</span>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>IQ</span>
            </div>
            <div
              style={{
                width: '36px', height: '36px', borderRadius: 'var(--radius-md)',
                background: 'var(--accent-purple-dim)', display: 'flex', alignItems: 'center',
                justifyContent: 'center', cursor: 'pointer', fontSize: '14px', fontWeight: 700,
                color: 'var(--accent-purple-light)',
              }}
              onClick={() => navigate('/app/profile')}
            >
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
          </div>
        </header>

        {/* Ticker strip */}
        <div className="ticker-strip" style={{ marginTop: '56px', overflow: 'hidden' }}>
          <div style={{
            display: 'flex', gap: '24px', animation: 'tickerScroll 60s linear infinite',
            whiteSpace: 'nowrap',
          }}>
            {stocks.concat(stocks).map((stock, i) => (
              <div key={`${stock.id}-${i}`} className="ticker-item" style={{ cursor: 'pointer' }}
                onClick={() => navigate(`/app/trade/${stock.symbol}`)}>
                <span className="symbol">{stock.symbol}</span>
                <span style={{ fontWeight: 600 }}>₹{stock.currentPrice.toLocaleString()}</span>
                <span className={`price-change ${stock.dayChangePct >= 0 ? 'up' : 'down'}`}>
                  {stock.dayChangePct >= 0 ? '▲' : '▼'}{Math.abs(stock.dayChangePct).toFixed(2)}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Page content */}
        <main style={{ padding: '24px', flex: 1, minWidth: 0 }}>
          <Outlet />
        </main>
      </div>

      <FearFeedbackModal 
        isOpen={!!fearModalData} 
        onClose={clearFearModal} 
        logData={fearModalData} 
      />

      <style>{`
        @keyframes tickerScroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
