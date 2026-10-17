'use client';

import { useEffect, useRef } from 'react';
import { getBrowserSession } from '../../lib/client/session';
import { mountFloatingDots } from '../effects/floating-dots/floating-dots-engine.js';
import styles from './HeroDots.module.css';

const backgrounds = { light: '#ffffff', dark: '#0f172a' };

export default function HeroDots() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const session = getBrowserSession();
    let theme = session.getSnapshot().theme;
    const compact = window.matchMedia('(max-width: 767px)');
    let effect: ReturnType<typeof mountFloatingDots>;
    try {
      effect = mountFloatingDots(container, {
        background: backgrounds[theme],
        density: compact.matches ? 150 : 190,
        particlesScale: compact.matches ? 1.1 : 0.8,
        pixelRatioCap: 2,
      });
    } catch {
      // Keep the readable theme background if this browser cannot draw a canvas.
      console.error('Hero floating dots could not initialize');
      return;
    }

    const unsubscribe = session.subscribe(() => {
      const next = session.getSnapshot().theme;
      if (next === theme) return;
      theme = next;
      effect.setOptions({ background: backgrounds[theme] });
    });
    const resize = () => effect.setOptions({
      density: compact.matches ? 150 : 190,
      particlesScale: compact.matches ? 1.1 : 0.8,
    });
    compact.addEventListener('change', resize);
    return () => {
      unsubscribe();
      compact.removeEventListener('change', resize);
      effect.dispose();
    };
  }, []);

  return (
    <div aria-hidden="true" className="absolute inset-0 pointer-events-none bg-white dark:bg-slate-900">
      <div ref={containerRef} data-hero-dots className={styles.field} />
    </div>
  );
}
