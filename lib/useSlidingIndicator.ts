'use client';

import { useLayoutEffect, useRef } from 'react';

/**
 * A single indicator element (underline, pill) that glides to the active item.
 *
 * Mark each item with `data-tab={key}` inside the container, render one indicator
 * element with the `.slide-indicator` class, and pass the active key. The hook writes
 * transform/size straight to the indicator's style (no React state, no layout
 * animation library), so this costs a rect read per change and nothing per frame.
 *
 * The first placement is instant; later moves use the motion tokens
 * (`.slide-indicator` in app/globals.css). Reduced motion: moves are instant.
 */
export function useSlidingIndicator<C extends HTMLElement = HTMLDivElement, I extends HTMLElement = HTMLSpanElement>(
  activeKey: string | null,
) {
  const containerRef = useRef<C>(null);
  const indicatorRef = useRef<I>(null);
  const placed = useRef(false);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const indicator = indicatorRef.current;
    if (!container || !indicator) return;

    const place = () => {
      const target = activeKey === null
        ? null
        : container.querySelector<HTMLElement>(`[data-tab="${CSS.escape(activeKey)}"]`);
      if (!target) {
        delete indicator.dataset.placed; // CSS hides an unplaced indicator
        return;
      }
      const c = container.getBoundingClientRect();
      const t = target.getBoundingClientRect();
      if (!placed.current) indicator.style.transition = 'none';
      indicator.dataset.placed = '';
      indicator.style.transform = `translate(${t.left - c.left + container.scrollLeft}px, ${t.top - c.top + container.scrollTop}px)`;
      indicator.style.width = `${t.width}px`;
      indicator.style.height = `${t.height}px`;
      if (!placed.current) {
        // Commit the instant placement, then hand transitions back to the stylesheet.
        void indicator.offsetWidth;
        indicator.style.transition = '';
        placed.current = true;
      }
    };

    place();
    const ro = new ResizeObserver(place);
    ro.observe(container);
    return () => ro.disconnect();
  }, [activeKey]);

  return { containerRef, indicatorRef };
}
