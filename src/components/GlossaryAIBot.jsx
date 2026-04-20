import { useState, useEffect, useRef } from 'react';
import useStore from '../store/useStore';

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

const SYSTEM_PROMPT = `You are SimVesto's friendly market education assistant. When asked about a financial term, give a clear, jargon-free explanation in 3 parts:
1. What it means in simple words (1-2 sentences)
2. A real-world example relevant to Indian markets (1 sentence)
3. Why a new investor should care about it (1 sentence)
Keep total response under 100 words. Be warm, encouraging, and use simple language.`;

export default function GlossaryAIBot({ term, onClose }) {
  const geminiApiKey = useStore(s => s.geminiApiKey);
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState([
    {
      role: 'assistant',
      text: `Hi! I'm your glossary guide. I'll explain **${term}** right now — and you can ask me anything after!`,
    },
  ]);
  const endRef = useRef(null);
  const hasFetched = useRef(false);

  // Auto-scroll on new messages
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, loading]);

  // Auto-fetch explanation on mount
  useEffect(() => {
    if (!term || hasFetched.current) return;
    hasFetched.current = true;
    fetchExplanation(`I want to learn more about: ${term}`);
  }, [term]);

  const fetchExplanation = async (question) => {
    if (!geminiApiKey) {
      setHistory(prev => [...prev, {
        role: 'assistant',
        text: `**${term}** is a key market term. To get AI-powered explanations, please add your Gemini API key in Settings. For now, check the Glossary page for a written explanation!`,
      }]);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${GEMINI_URL}?key=${geminiApiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [{ parts: [{ text: question }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 300 },
        }),
      });
      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I couldn\'t generate a response right now.';

      // Typewriter effect
      let shown = '';
      setHistory(prev => [...prev, { role: 'assistant', text: '' }]);
      for (let i = 0; i < text.length; i++) {
        shown += text[i];
        await new Promise(r => setTimeout(r, 8 + Math.random() * 6));
        setHistory(prev => {
          const next = [...prev];
          next[next.length - 1] = { role: 'assistant', text: shown };
          return next;
        });
      }
    } catch {
      setHistory(prev => [...prev, { role: 'assistant', text: 'Network error — please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e) => {
    e?.preventDefault();
    const q = (input || '').trim();
    if (!q || loading) return;
    setInput('');
    setHistory(prev => [...prev, { role: 'user', text: q }]);
    await fetchExplanation(q);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const renderText = (text) => {
    // Basic markdown: **bold**, newlines
    return text
      .split('\n')
      .map((line, i) => {
        const parts = line.split(/\*\*(.+?)\*\*/g);
        return (
          <span key={i}>
            {parts.map((p, j) => j % 2 === 1 ? <strong key={j}>{p}</strong> : p)}
            {i < text.split('\n').length - 1 && <br />}
          </span>
        );
      });
  };

  return (
    <div className="gab-overlay" onClick={onClose}>
      <div className="gab-panel" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="gab-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="gab-robot-icon" data-fx="twirl">🤖</span>
            <div>
              <div className="gab-title">AI Glossary Guide</div>
              <div className="gab-subtitle">Explaining: <strong>{term}</strong></div>
            </div>
          </div>
          <button className="gab-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {/* Messages */}
        <div className="gab-messages">
          {history.map((msg, i) => (
            <div key={i} className={`gab-msg gab-msg-${msg.role}`}>
              {msg.role === 'assistant' && <span className="gab-msg-bot-icon">🤖</span>}
              <div className="gab-msg-bubble">
                {renderText(msg.text)}
                {loading && i === history.length - 1 && msg.role === 'assistant' && (
                  <span className="gab-cursor">▊</span>
                )}
              </div>
            </div>
          ))}
          {loading && history[history.length - 1]?.role !== 'assistant' && (
            <div className="gab-msg gab-msg-assistant">
              <span className="gab-msg-bot-icon">🤖</span>
              <div className="gab-msg-bubble gab-thinking">
                <span /><span /><span />
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {/* Quick prompts */}
        <div className="gab-quick-row">
          {[`Give me an example of ${term}`, `How does ${term} affect me as a beginner?`].map(q => (
            <button key={q} className="gab-quick-btn" onClick={() => { setInput(q); }} disabled={loading}>
              {q}
            </button>
          ))}
        </div>

        {/* Input */}
        <form className="gab-input-row" onSubmit={handleSend}>
          <input
            className="gab-input"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything about this term..."
            disabled={loading}
            autoFocus
          />
          <button type="submit" className="gab-send" disabled={loading || !input.trim()}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}
