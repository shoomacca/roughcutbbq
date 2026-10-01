'use client';

import { useEffect, useRef, type ElementType, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  /** Position in its group — staggers the start (capped so long lists never wait). */
  index?: number;
  /** Stagger step in ms. */
  step?: number;
  as?: ElementType;
  className?: string;
}

const MAX_STAGGER_ITEMS = 8;

let observer: IntersectionObserver | null = null;
function getObserver() {
  if (observer) return observer;
  observer = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        (e.target as HTMLElement).dataset.inview = '';
        observer?.unobserve(e.target); // run once
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.05 }
  );
  return observer;
}

/**
 * Fade-up once when scrolled into view. CSS does the animating (`.reveal` in
 * app/globals.css); this only flags visibility, so it costs nothing per frame and
 * degrades to "just visible" without JS. Reduced motion: opacity-only, via the CSS policy.
 */
export default function Reveal({ children, index = 0, step = 60, as: Tag = 'div', className = '' }: Props) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!('IntersectionObserver' in window)) {
      el.dataset.inview = '';
      return;
    }
    const io = getObserver();
    io.observe(el);
    return () => io.unobserve(el);
  }, []);

  const delay = Math.min(index, MAX_STAGGER_ITEMS) * step;

  return (
    <Tag
      ref={ref}
      className={`reveal ${className}`.trim()}
      style={delay ? ({ '--reveal-delay': `${delay}ms` } as React.CSSProperties) : undefined}
    >
      {children}
    </Tag>
  );
}
