import { useEffect, useRef } from 'react';

// Lazy lagging cursor aura — pastel green, non-distracting
export default function CursorAura() {
  const auraRef = useRef(null);
  const target = useRef({ x: -300, y: -300 });
  const current = useRef({ x: -300, y: -300 });
  const rafId = useRef(null);
  const hidden = useRef(false);

  useEffect(() => {
    const SIZE = 280;

    const onMove = (e) => {
      target.current = { x: e.clientX, y: e.clientY };
      if (hidden.current && auraRef.current) {
        auraRef.current.style.opacity = '1';
        hidden.current = false;
      }
    };
    const onLeave = () => {
      if (auraRef.current) { auraRef.current.style.opacity = '0'; hidden.current = true; }
    };
    const onEnter = () => {
      if (auraRef.current) { auraRef.current.style.opacity = '1'; hidden.current = false; }
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    document.addEventListener('mouseleave', onLeave);
    document.addEventListener('mouseenter', onEnter);

    const animate = () => {
      const LERP = 0.07;
      current.current.x += (target.current.x - current.current.x) * LERP;
      current.current.y += (target.current.y - current.current.y) * LERP;
      if (auraRef.current) {
        auraRef.current.style.transform =
          `translate3d(${current.current.x - SIZE / 2}px, ${current.current.y - SIZE / 2}px, 0)`;
      }
      rafId.current = requestAnimationFrame(animate);
    };
    rafId.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseleave', onLeave);
      document.removeEventListener('mouseenter', onEnter);
      cancelAnimationFrame(rafId.current);
    };
  }, []);

  return (
    <div
      ref={auraRef}
      className="cursor-aura"
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: 0, left: 0,
        width: 280, height: 280,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(134,239,172,0.07) 0%, rgba(52,211,153,0.04) 40%, transparent 70%)',
        pointerEvents: 'none',
        zIndex: 9998,
        willChange: 'transform',
        transition: 'opacity 0.4s ease',
        mixBlendMode: 'normal',
      }}
    />
  );
}
