'use client';

import React, { useRef, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface MagneticProps {
  children: React.ReactNode;
  strength?: number;
  className?: string;
  as?: 'div' | 'span';
}

export function Magnetic({
  children,
  strength = 0.3,
  className,
  as: Tag = 'div',
}: MagneticProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    setPos({
      x: (e.clientX - cx) * strength,
      y: (e.clientY - cy) * strength,
    });
  }, [strength]);

  const handleMouseLeave = useCallback(() => {
    setPos({ x: 0, y: 0 });
  }, []);

  return (
    <Tag
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={cn('inline-block transition-[transform] duration-200 ease-out', className)}
      style={{ transform: `translate(${pos.x}px, ${pos.y}px)` }}
    >
      {children}
    </Tag>
  );
}

interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
  maxTilt?: number;
  glareColor?: string;
}

export function TiltCard({
  children,
  className,
  maxTilt = 8,
  glareColor = 'conic-gradient(from 0deg at 50% 50%, rgba(139,92,246,0.15), rgba(34,211,238,0.15), rgba(255,122,89,0.15), rgba(236,72,153,0.15), rgba(163,230,53,0.15), rgba(251,191,36,0.15), rgba(139,92,246,0.15))',
}: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState('');
  const [glow, setGlow] = useState({ x: 50, y: 50, opacity: 0 });

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const rx = ((y - cy) / cy) * -maxTilt;
    const ry = ((x - cx) / cx) * maxTilt;
    setStyle(`perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg) scale3d(1.02,1.02,1.02)`);
    setGlow({ x: (x / rect.width) * 100, y: (y / rect.height) * 100, opacity: 1 });
  }, [maxTilt]);

  const handleMouseLeave = useCallback(() => {
    setStyle('perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)');
    setGlow((g) => ({ ...g, opacity: 0 }));
  }, []);

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={cn('relative', className)}
      style={{
        transform: style,
        transition: 'transform 0.15s ease-out',
        transformStyle: 'preserve-3d',
      }}
    >
      {children}
      <div
        className="pointer-events-none absolute inset-0 rounded-[inherit]"
        style={{
          background: glareColor,
          opacity: glow.opacity,
          WebkitMask: `radial-gradient(circle at ${glow.x}% ${glow.y}%, black 0%, transparent 60%)`,
          mask: `radial-gradient(circle at ${glow.x}% ${glow.y}%, black 0%, transparent 60%)`,
          transition: 'opacity 0.2s ease-out',
        }}
      />
    </div>
  );
}
