import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { GLOSSARY_TERMS } from '../data/glossaryDictionary';

export default function Glossary() {
  const [searchTerm, setSearchTerm] = useState('');
  
  const entries = Object.values(GLOSSARY_TERMS).filter(entry => 
    entry.term.toLowerCase().includes(searchTerm.toLowerCase()) || 
    entry.description.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => a.term.localeCompare(b.term));

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px', color: 'var(--text-primary)' }}>
          Market Glossary 🧠
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', maxWidth: '600px', lineHeight: 1.5 }}>
          Welcome to the ultimate vibe check on stock market jargon. Confused about what people are saying? 
          Search below to instantly translate wall street boomer talk into plain english.
        </p>
      </motion.div>

      <div style={{ marginBottom: '24px' }}>
        <input 
          type="text" 
          placeholder="Search for terms like 'bull', 'holding', 'nifty'..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%', maxWidth: '400px', padding: '12px 16px', borderRadius: '12px',
            backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)',
            color: 'var(--text-primary)', outline: 'none'
          }}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        {entries.map((entry, index) => (
          <motion.div 
            key={entry.term}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            style={{ 
              backgroundColor: 'var(--bg-surface)', 
              border: '1px solid var(--border-default)', 
              borderRadius: '16px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--accent-purple-light)', marginBottom: '8px' }}>
              {entry.term}
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {entry.description}
            </p>
          </motion.div>
        ))}
        
        {entries.length === 0 && (
          <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', padding: '20px 0' }}>
            No terms found for "{searchTerm}". 
          </div>
        )}
      </div>
    </div>
  );
}
