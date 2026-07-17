'use client';

import { useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';

interface BlobState {
  el: HTMLDivElement | null;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  vx: number;
  vy: number;
  baseX: number;
  baseY: number;
  freqX: number;
  freqY: number;
  ampX: number;
  ampY: number;
  phaseX: number;
  phaseY: number;
  color: string;
  size: number;
}

const BLOBS = [
  { color: '#8b5cf6', size: 360, freqX: 0.3, freqY: 0.4, ampX: 140, ampY: 100, phaseX: 0, phaseY: 1.2 },
  { color: '#22d3ee', size: 300, freqX: 0.2, freqY: 0.5, ampX: 120, ampY: 140, phaseX: 1.5, phaseY: 0.8 },
  { color: '#ff7a59', size: 420, freqX: 0.4, freqY: 0.25, ampX: 160, ampY: 110, phaseX: 0.7, phaseY: 2.1 },
  { color: '#ec4899', size: 320, freqX: 0.25, freqY: 0.35, ampX: 130, ampY: 100, phaseX: 2.3, phaseY: 0.5 },
  { color: '#a3e635', size: 280, freqX: 0.35, freqY: 0.2, ampX: 100, ampY: 130, phaseX: 1.1, phaseY: 3.0 },
  { color: '#fbbf24', size: 380, freqX: 0.15, freqY: 0.45, ampX: 150, ampY: 90, phaseX: 3.2, phaseY: 1.8 },
];

const INFLUENCE_RADIUS = 750;
const SPRING_STIFFNESS = 0.04;
const DAMPING = 0.85;
const MAX_VELOCITY = 30;

export function FluidBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const blobsRef = useRef<BlobState[]>([]);
  const cursorRef = useRef({ x: -9999, y: -9999, px: -9999, py: -9999 });
  const rafRef = useRef(0);
  const timeRef = useRef(0);
  const { resolvedTheme } = useTheme();
  const isDarkRef = useRef(true);

  useEffect(() => {
    isDarkRef.current = resolvedTheme !== 'light';
  }, [resolvedTheme]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const initialW = window.innerWidth;
    const initialH = window.innerHeight;

    blobsRef.current = BLOBS.map((cfg, i) => {
      const baseX = (initialW / (BLOBS.length + 1)) * (i + 1) + (Math.random() - 0.5) * 80;
      const baseY = (initialH / 4) * (1 + (i % 3)) + (Math.random() - 0.5) * 60;
      const el = container.children[i] as HTMLDivElement;
      return {
        el,
        x: baseX,
        y: baseY,
        targetX: baseX,
        targetY: baseY,
        vx: 0,
        vy: 0,
        baseX,
        baseY,
        ...cfg,
      };
    });

    const handleMouseMove = (e: MouseEvent) => {
      const { px, py } = cursorRef.current;
      cursorRef.current.px = cursorRef.current.x;
      cursorRef.current.py = cursorRef.current.y;
      cursorRef.current.x = e.clientX;
      cursorRef.current.y = e.clientY;
    };

    const handleResize = () => {
      BLOBS.forEach((_, i) => {
        const b = blobsRef.current[i];
        if (!b) return;
        const w = window.innerWidth;
        const h = window.innerHeight;
        b.baseX = (w / (BLOBS.length + 1)) * (i + 1) + (Math.random() - 0.5) * 80;
        b.baseY = (h / 4) * (1 + (i % 3)) + (Math.random() - 0.5) * 60;
      });
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('resize', handleResize, { passive: true });

    const animate = (now: number) => {
      timeRef.current = now / 1000;
      const { x: cx, y: cy, px, py } = cursorRef.current;
      const cVx = Math.min(Math.abs(cx - px) * 2, MAX_VELOCITY);
      const cVy = Math.min(Math.abs(cy - py) * 2, MAX_VELOCITY);
      const speed = Math.min(Math.sqrt(cVx * cVx + cVy * cVy), MAX_VELOCITY);

      for (const b of blobsRef.current) {
        if (!b) continue;

        const waveX = b.baseX + Math.sin(timeRef.current * b.freqX + b.phaseX) * b.ampX;
        const waveY = b.baseY + Math.cos(timeRef.current * b.freqY + b.phaseY) * b.ampY;
        b.targetX = waveX;
        b.targetY = waveY;

        const dx = cx - b.x;
        const dy = cy - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < INFLUENCE_RADIUS) {
          const strength = (1 - dist / INFLUENCE_RADIUS) * speed * 2;
          const pushX = -(dx / dist) * strength;
          const pushY = -(dy / dist) * strength;
          b.targetX += pushX;
          b.targetY += pushY;
        }

        const springDx = b.targetX - b.x;
        const springDy = b.targetY - b.y;
        b.vx += springDx * SPRING_STIFFNESS;
        b.vy += springDy * SPRING_STIFFNESS;
        b.vx *= DAMPING;
        b.vy *= DAMPING;
        b.x += b.vx;
        b.y += b.vy;

        if (b.el) {
          b.el.style.transform = `translate(${b.x - b.size / 2}px, ${b.y - b.size / 2}px)`;
        }
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const prefersReducedMotion =
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false;

  if (prefersReducedMotion) return null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
      aria-hidden="true"
    >
      {BLOBS.map((cfg, i) => (
        <div
          key={i}
          className="absolute rounded-full opacity-70"
          style={{
            width: cfg.size,
            height: cfg.size,
            background: `radial-gradient(circle at center, ${cfg.color}80 0%, ${cfg.color}40 40%, ${cfg.color}10 70%, transparent 100%)`,
            filter: 'blur(25px)',
            willChange: 'transform',
          }}
        />
      ))}
    </div>
  );
}
