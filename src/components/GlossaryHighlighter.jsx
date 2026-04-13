import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { GLOSSARY_TERMS, GLOSSARY_MAP } from '../data/glossaryTerms';

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function buildGlossaryMatcher() {
  const phraseToKey = new Map();
  const variants = [];

  GLOSSARY_TERMS.forEach((entry) => {
    const phrases = [entry.term, ...(entry.aliases || []), entry.key];
    phrases.forEach((phrase) => {
      const normalized = String(phrase || '').trim().toLowerCase();
      if (!normalized) return;
      phraseToKey.set(normalized, entry.key);
      variants.push(normalized);
    });
  });

  const uniqueVariants = [...new Set(variants)].sort((a, b) => b.length - a.length);
  const pattern = uniqueVariants
    .map((phrase) => escapeRegExp(phrase).replace(/\s+/g, '\\s+'))
    .join('|');

  return {
    regex: new RegExp(`\\b(${pattern})\\b`, 'gi'),
    phraseToKey,
  };
}

function unwrapGlossaryTerms(root) {
  const highlighted = root.querySelectorAll('span.glossary-term');
  highlighted.forEach((node) => {
    const textNode = document.createTextNode(node.textContent || '');
    node.replaceWith(textNode);
  });
  root.normalize();
}

function highlightGlossaryTerms(root, matcher) {
  const skipTags = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA', 'INPUT', 'BUTTON', 'A', 'CODE', 'PRE']);
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) => {
      const parentElement = node.parentElement;
      if (!parentElement) return NodeFilter.FILTER_REJECT;
      if (skipTags.has(parentElement.tagName)) return NodeFilter.FILTER_REJECT;
      if (parentElement.closest('.glossary-tooltip') || parentElement.closest('.glossary-term') || parentElement.closest('[data-no-glossary]')) {
        return NodeFilter.FILTER_REJECT;
      }
      const value = node.nodeValue || '';
      if (!value.trim()) return NodeFilter.FILTER_REJECT;
      matcher.regex.lastIndex = 0;
      return matcher.regex.test(value) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    },
  });

  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);

  nodes.forEach((node) => {
    const text = node.nodeValue || '';
    matcher.regex.lastIndex = 0;

    let match;
    let lastIndex = 0;
    const fragment = document.createDocumentFragment();
    let hasReplacement = false;

    while ((match = matcher.regex.exec(text)) !== null) {
      const rawMatch = match[0];
      const startIndex = match.index;
      const endIndex = startIndex + rawMatch.length;
      const normalized = rawMatch.toLowerCase().replace(/\s+/g, ' ').trim();
      const entryKey = matcher.phraseToKey.get(normalized);

      if (!entryKey) continue;

      if (startIndex > lastIndex) {
        fragment.appendChild(document.createTextNode(text.slice(lastIndex, startIndex)));
      }

      const span = document.createElement('span');
      span.className = 'glossary-term';
      span.dataset.termKey = entryKey;
      span.textContent = rawMatch;
      fragment.appendChild(span);

      lastIndex = endIndex;
      hasReplacement = true;
    }

    if (!hasReplacement) return;

    if (lastIndex < text.length) {
      fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
    }

    node.replaceWith(fragment);
  });
}

export default function GlossaryHighlighter({ enabled }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTerm, setActiveTerm] = useState(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const matcher = useMemo(() => buildGlossaryMatcher(), []);

  useEffect(() => {
    const root = document.querySelector('main');
    if (!root) return;

    unwrapGlossaryTerms(root);
    if (!enabled) {
      setActiveTerm(null);
      return;
    }

    highlightGlossaryTerms(root, matcher);

    const onMouseOver = (event) => {
      const termNode = event.target.closest('.glossary-term');
      if (!termNode) return;
      const key = termNode.dataset.termKey;
      if (!key || !GLOSSARY_MAP[key]) return;
      setActiveTerm(GLOSSARY_MAP[key]);
    };

    const onMouseMove = (event) => {
      const termNode = event.target.closest('.glossary-term');
      if (!termNode) return;
      setPosition({ x: event.clientX + 14, y: event.clientY + 14 });
    };

    const onMouseOut = (event) => {
      if (event.target.closest('.glossary-term')) {
        setTimeout(() => {
          const hoverEl = document.querySelector(':hover');
          if (!hoverEl || !hoverEl.closest('.glossary-term') && !hoverEl.closest('.glossary-tooltip')) {
            setActiveTerm(null);
          }
        }, 60);
      }
    };

    root.addEventListener('mouseover', onMouseOver);
    root.addEventListener('mousemove', onMouseMove);
    root.addEventListener('mouseout', onMouseOut);

    return () => {
      root.removeEventListener('mouseover', onMouseOver);
      root.removeEventListener('mousemove', onMouseMove);
      root.removeEventListener('mouseout', onMouseOut);
      unwrapGlossaryTerms(root);
      setActiveTerm(null);
    };
  }, [enabled, matcher, location.pathname]);

  if (!enabled || !activeTerm) return null;

  return (
    <div
      className="glossary-tooltip"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
      onMouseLeave={() => setActiveTerm(null)}
    >
      <div className="glossary-tooltip-title">{activeTerm.term}</div>
      <div className="glossary-tooltip-row">
        <span className="glossary-tooltip-label">Meaning</span>
        <p>{activeTerm.meaning}</p>
      </div>
      <div className="glossary-tooltip-row">
        <span className="glossary-tooltip-label">Why it matters</span>
        <p>{activeTerm.relevance}</p>
      </div>
      <button
        type="button"
        className="glossary-tooltip-link"
        onClick={() => {
          setActiveTerm(null);
          navigate('/app/glossary');
        }}
      >
        Learn more terms
      </button>
    </div>
  );
}
