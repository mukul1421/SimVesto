import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import useStore from '../../store/useStore';
import { GLOSSARY_TERMS } from '../../data/glossaryDictionary';

export default function GlossaryText({ text, children }) {
  const glossaryMode = useStore(s => s.glossaryMode);
  const navigate = useNavigate();
  const [hoveredTerm, setHoveredTerm] = useState(null);

  const content = text || children;
  
  if (typeof content !== 'string') {
    return <>{content}</>;
  }

  if (!glossaryMode) {
    return <>{content}</>;
  }

  const keys = Object.keys(GLOSSARY_TERMS);
  const regexPattern = new RegExp(`\\b(${keys.join('|')})\\b`, 'gi');

  const parts = content.split(regexPattern);

  return (
    <span style={{ position: 'relative' }}>
      {parts.map((part, i) => {
        const lowerPart = part.toLowerCase();
        if (GLOSSARY_TERMS[lowerPart]) {
          const dict = GLOSSARY_TERMS[lowerPart];
          return (
            <span 
              key={i} 
              style={{ position: 'relative', display: 'inline-block' }}
              onMouseEnter={() => setHoveredTerm(i)}
              onMouseLeave={() => setHoveredTerm(null)}
            >
              <span 
                style={{ 
                  borderBottom: '2px dashed #a855f7', 
                  cursor: 'help',
                  color: '#c084fc',
                  fontWeight: 600,
                  transition: 'all 0.2s',
                  backgroundColor: hoveredTerm === i ? 'rgba(168, 85, 247, 0.15)' : 'transparent',
                  padding: '0 2px',
                  borderRadius: '4px'
                }}
              >
                {part}
              </span>

              <AnimatePresence>
                {hoveredTerm === i && (
                  <div style={{ position: 'absolute', bottom: '100%', left: '50%', zIndex: 9999 }}>
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: -8, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      style={{
                        position: 'relative',
                        left: '-50%',
                        width: '260px',
                        backgroundColor: '#18181b', // Solid dark for z-index overlapping safety
                        border: '1px solid #27272a',
                        padding: '16px',
                        borderRadius: '12px',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)',
                        pointerEvents: 'auto',
                        textAlign: 'left'
                      }}
                    >
                      <div style={{ fontSize: '15px', fontWeight: 800, marginBottom: '6px', color: '#f4f4f5' }}>
                        {dict.term} <span style={{ fontSize: '11px', fontWeight: 500, color: '#71717a', marginLeft: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>vibe check</span>
                      </div>
                      <div style={{ fontSize: '13px', color: '#a1a1aa', lineHeight: 1.5, marginBottom: '14px' }}>
                        {dict.description}
                      </div>
                      
                      <div 
                        onClick={(e) => { e.stopPropagation(); navigate('/app/glossary'); }}
                        style={{ 
                          fontSize: '12px', 
                          color: '#a855f7', 
                          cursor: 'pointer', 
                          fontWeight: 'bold',
                          textAlign: 'center',
                          padding: '8px',
                          background: '#27272a',
                          borderRadius: '6px',
                          transition: 'background 0.2s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = '#3f3f46'}
                        onMouseLeave={e => e.currentTarget.style.background = '#27272a'}
                      >
                        learn more terms? 🧠
                      </div>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>
            </span>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
}
