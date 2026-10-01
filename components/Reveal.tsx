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
    // Any part of the item entering the viewport reveals it: nothing on screen stays hidden.
    { rootMargin: '0px', threshold: 0 }
  );
  return observer;
}

/**
 * Fade-up once when scrolled into view. CSS does the animating (`.reveal` in
 * app/globals.css); this only flags visibility, so it costs nothing per frame.
 *
 * Server HTML is fully visible. Anything already on screen when this mounts is
 * marked instant (visible, no fade); only items below the fold hide — and only
 * after hydration (html[data-hydrated]) — then animate in once as they scroll up.
 * Reduced motion: opacity-only, via the CSS policy.
 */
export default function Reveal({ children, index = 0, step = 60, as: Tag = 'div', className = '' }: Props) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const onScreen = r.bottom > 0 && r.top < window.innerHeight;
    if (onScreen || !('IntersectionObserver' in window)) {
      // Already visible to the user: keep it that way, no fade.
      el.dataset.inview = '';
      el.dataset.instant = '';
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
