import { useEffect, useRef } from 'react';

// Particle colors matching green/cyan/teal theme
const COLORS = [
  'rgba(16,185,129,0.85)',   // emerald
  'rgba(6,182,212,0.85)',    // cyan
  'rgba(52,211,153,0.85)',   // teal-green
  'rgba(34,197,94,0.85)',    // green
  'rgba(251,191,36,0.85)',   // gold accent
  'rgba(139,92,246,0.85)',   // purple accent
];

function spawnParticles(x, y) {
  const count = 22;
  const particles = [];
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.6;
    const speed = 40 + Math.random() * 80;
    const el = document.createElement('div');
    el.className = 'click-fx-particle';
    el.style.cssText = `
      position: fixed;
      left: ${x}px;
      top: ${y}px;
      width: ${4 + Math.random() * 5}px;
      height: ${4 + Math.random() * 5}px;
      border-radius: 50%;
      background: ${COLORS[Math.floor(Math.random() * COLORS.length)]};
      pointer-events: none;
      z-index: 99999;
      transform: translate(-50%, -50%);
      transition: none;
    `;
    document.body.appendChild(el);
    particles.push({ el, angle, speed, born: performance.now() });
  }

  const DURATION = 650;
  const animate = (now) => {
    const alive = particles.filter(p => {
      const t = (now - p.born) / DURATION;
      if (t >= 1) { p.el.remove(); return false; }
      const ease = 1 - t * t; // ease-out
      const px = x + Math.cos(p.angle) * p.speed * t;
      const py = y + Math.sin(p.angle) * p.speed * t;
      p.el.style.transform = `translate(${px - x - 2}px, ${py - y - 2}px) scale(${ease})`;
      p.el.style.opacity = `${ease * 0.9}`;
      return true;
    });
    if (alive.length > 0) requestAnimationFrame(animate);
  };
  requestAnimationFrame(animate);
}

function twirl(el) {
  el.animate(
    [
      { transform: 'rotate(0deg) scale(1)' },
      { transform: 'rotate(360deg) scale(1.3)' },
      { transform: 'rotate(720deg) scale(1)' },
    ],
    { duration: 500, easing: 'cubic-bezier(0.34,1.56,0.64,1)', fill: 'forwards' }
  );
}

export default function ClickFX() {
  useEffect(() => {
    const handler = (e) => {
      // Walk up the DOM to find a data-fx target
      let node = e.target;
      while (node && node !== document.body) {
        const fx = node.dataset?.fx;
        if (fx === 'confetti') {
          spawnParticles(e.clientX, e.clientY);
          break;
        }
        if (fx === 'twirl') {
          twirl(node);
          break;
        }
        node = node.parentElement;
      }
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  return null; // no DOM output of its own
}
