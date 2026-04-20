import { useEffect, useRef } from 'react';

const PARTICLE_COUNT = 48;

function createParticles(isDark) {
  return Array.from({ length: PARTICLE_COUNT }, () => ({
    x: Math.random(),
    y: Math.random(),
    vx: (Math.random() - 0.5) * 0.00012,
    vy: (Math.random() - 0.5) * 0.00008,
    r: 1 + Math.random() * 2.2,
    opacity: isDark
      ? 0.12 + Math.random() * 0.22
      : 0.08 + Math.random() * 0.14,
    hue: 155 + Math.floor(Math.random() * 40), // 155–195 = teal-cyan-green
    pulse: Math.random() * Math.PI * 2,
    pulseSpeed: 0.004 + Math.random() * 0.006,
  }));
}

export default function DashboardBg() {
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const animRef = useRef(null);
  const isDarkRef = useRef(
    document.documentElement.getAttribute('data-theme') === 'dark'
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const isDark = () =>
      document.documentElement.getAttribute('data-theme') === 'dark';

    particlesRef.current = createParticles(isDark());

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize, { passive: true });

    const draw = () => {
      const W = canvas.width;
      const H = canvas.height;
      const dark = isDark();

      ctx.clearRect(0, 0, W, H);

      // Subtle radial vignette
      const gradient = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * 0.6);
      gradient.addColorStop(0, dark ? 'rgba(16,185,129,0.025)' : 'rgba(52,211,153,0.018)');
      gradient.addColorStop(1, 'transparent');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, W, H);

      particlesRef.current.forEach((p) => {
        // Drift
        p.x += p.vx;
        p.y += p.vy;
        p.pulse += p.pulseSpeed;

        // Wrap around
        if (p.x < 0) p.x = 1;
        if (p.x > 1) p.x = 0;
        if (p.y < 0) p.y = 1;
        if (p.y > 1) p.y = 0;

        const px = p.x * W;
        const py = p.y * H;
        const r = p.r * (1 + 0.25 * Math.sin(p.pulse));
        const alpha = p.opacity * (0.7 + 0.3 * Math.sin(p.pulse + 1));

        ctx.beginPath();
        ctx.arc(px, py, r, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 72%, ${dark ? 72 : 48}%, ${alpha})`;
        ctx.fill();
      });

      animRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        opacity: 1,
      }}
    />
  );
}
