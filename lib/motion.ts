'use client';

import { useEffect, useRef, useState } from 'react';
import type { Transition, Variants } from 'framer-motion';

/**
 * Motion tokens — the JS side. Numbers mirror the CSS custom properties in
 * app/globals.css (`--motion-*`, `--ease-*`); change both together.
 *
 * Reduced-motion policy lives in two coordinated places and nowhere else:
 *   - CSS:   the `@media (prefers-reduced-motion: reduce)` block in app/globals.css
 *   - JS:    <MotionConfig reducedMotion="user"> in components/MotionProvider.tsx
 * Both keep opacity animation and drop movement. Direct manipulation
 * (lib/useDragScroll.ts) is never gated — it answers the user's own hand.
 */
export const DURATION = {
  fast: 0.15,
  base: 0.22,
  slow: 0.32,
  hero: 0.65,
} as const;

/** translate distance (px) for enter/reveal motion */
export const DIST = { base: 16, sm: 8 } as const;

export const EASE = {
  out: [0.2, 0, 0, 1] as const,
  in: [0.4, 0, 1, 1] as const,
  spring: [0.34, 1.3, 0.64, 1] as const,
};

/** True when the OS asks for less motion (Windows: Settings > Accessibility > Animation effects off). */
export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/* ── framer-motion presets ─────────────────────────────────────────────────── */

export const enterTransition: Transition = { duration: DURATION.slow, ease: EASE.out };
export const exitTransition: Transition = { duration: DURATION.fast, ease: EASE.in };
export const uiTransition: Transition = { duration: DURATION.base, ease: EASE.out };
/** Sliding indicators (tabs, nav underline). */
export const indicatorTransition: Transition = { type: 'spring', stiffness: 500, damping: 40, mass: 0.8 };

/** Fade + rise. Use with `initial="hidden" animate="show"`. */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: DIST.base },
  show: { opacity: 1, y: 0, transition: enterTransition },
  exit: { opacity: 0, y: -DIST.sm, transition: exitTransition },
};

/** Parent that staggers its `fadeUp` children. */
export const stagger = (step = 0.06, delayChildren = 0): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: step, delayChildren } },
});

/** Horizontal step change. `custom` = direction (1 forward, -1 back). */
export const slideStep: Variants = {
  enter: (dir: number) => ({ opacity: 0, x: dir * DIST.base * 2 }),
  center: { opacity: 1, x: 0, transition: enterTransition },
  exit: (dir: number) => ({ opacity: 0, x: dir * -DIST.base, transition: exitTransition }),
};

/** Overlay backdrop. On exit it stops catching pointer events at once, so the page beneath is clickable while it fades. */
export const backdrop: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, pointerEvents: 'auto', transition: uiTransition },
  exit: { opacity: 0, pointerEvents: 'none', transition: exitTransition },
};

/** Dialog panel: slides up as a sheet on small screens, scales in on larger ones. */
export const sheet: Variants = {
  hidden: { opacity: 0, y: DIST.base * 2, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1, transition: enterTransition },
  exit: { opacity: 0, y: DIST.base, scale: 0.98, transition: exitTransition },
};

/* ── Count-up ──────────────────────────────────────────────────────────────── */

/**
 * Animates an integer from 0 to `target` over `durationMs` (ease-out cubic) on rAF.
 * Under reduced motion it is `target` from the first frame.
 *
 * For client-rendered content only (e.g. the results card, which never renders on
 * the server): on the server the value is `target`, so SSR'd markup would not match
 * the client's starting 0.
 */
export function useCountUp(target: number, durationMs = 900): number {
  const [value, setValue] = useState(() => (typeof window === 'undefined' || prefersReducedMotion() ? target : 0));
  const raf = useRef<number | null>(null);

  useEffect(() => {
    if (prefersReducedMotion()) return; // already showing `target`
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(eased * target));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current !== null) cancelAnimationFrame(raf.current);
    };
  }, [target, durationMs]);

  return value;
}
