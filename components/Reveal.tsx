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
/** This many items arriving in one observer callback means a fast scroll: no stagger. */
const FAST_SCROLL_BATCH = 3;

function show(el: Element, instant: boolean) {
  const h = el as HTMLElement;
  h.dataset.inview = '';
  if (instant) h.dataset.instant = '';
  observer?.unobserve(el);
}

/** Anything still unrevealed that sits above the viewport is shown at once (after a jump, Back, End). */
function revealEverythingAbove() {
  for (const el of document.querySelectorAll<HTMLElement>('.reveal:not([data-inview])')) {
    if (el.getBoundingClientRect().bottom < 0) show(el, true);
  }
}

let observer: IntersectionObserver | null = null;
function getObserver() {
  if (observer) return observer;
  observer = new IntersectionObserver(
    (entries) => {
      const incoming = entries.filter((e) => e.isIntersecting);
      const fast = incoming.length >= FAST_SCROLL_BATCH;
      let cameFromAbove = false;
      for (const e of incoming) {
        const fromAbove = e.boundingClientRect.top < 0;
        cameFromAbove ||= fromAbove;
        // Entering from above (scrolling back up) or in a fast batch: no stagger, no fade.
        show(e.target, fromAbove || fast);
      }
      if (cameFromAbove) revealEverythingAbove();
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
 * Items reached by scrolling back up, or many at once in a fast scroll, appear
 * without stagger. Reduced motion: opacity-only, via the CSS policy.
 */
export default function Reveal({ children, index = 0, step = 60, as: Tag = 'div', className = '' }: Props) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const onScreenOrAbove = r.top < window.innerHeight; // only items below the fold wait
    if (onScreenOrAbove || !('IntersectionObserver' in window)) {
      show(el, true);
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
