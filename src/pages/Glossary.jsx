import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { GLOSSARY_TERMS } from '../data/glossaryTerms';

export default function Glossary() {
  const [query, setQuery] = useState('');

  const filteredTerms = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return GLOSSARY_TERMS;
    return GLOSSARY_TERMS.filter((item) => {
      const haystack = [item.term, item.meaning, item.relevance, ...(item.aliases || [])]
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [query]);

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '4px' }}>Market Glossary</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
          Decode market terms in simple language so you can trade with more confidence.
        </p>
      </motion.div>

      <motion.div className="card glossary-hero" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div>
          <h3>Switch on Glossary Mode in the toolbar</h3>
          <p>
            Once enabled, key finance words across the app get highlighted. Hover on any highlighted term for an instant explain-like-I-am-new pop-up.
          </p>
        </div>
        <div className="glossary-hero-chip">{GLOSSARY_TERMS.length} terms live</div>
      </motion.div>

      <div className="card" style={{ marginTop: '16px', marginBottom: '20px' }}>
        <input
          type="text"
          className="form-input"
          placeholder="Search terms like volatility, P&L, Nifty..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          style={{ width: '100%' }}
        />
      </div>

      <div className="glossary-grid">
        {filteredTerms.map((term, idx) => (
          <motion.article
            key={term.key}
            className="glossary-card"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.03 }}
          >
            <div className="glossary-card-header">
              <h3>{term.term}</h3>
              {term.aliases?.length > 0 && (
                <span>{term.aliases.slice(0, 2).join(' / ')}</span>
              )}
            </div>
            <p className="glossary-card-meaning">{term.meaning}</p>
            <div className="glossary-card-divider" />
            <p className="glossary-card-relevance">{term.relevance}</p>
          </motion.article>
        ))}
      </div>

      {filteredTerms.length === 0 && (
        <div className="card" style={{ marginTop: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
          No matches found. Try a broader term.
        </div>
      )}
    </div>
  );
}
