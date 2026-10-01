'use client';

import { useCallback, useEffect, useRef, type RefObject } from 'react';
import {
  MOMENTUM_MS,
  clamp,
  easeOutCubic,
  glideDuration,
  nearestPoint,
  nextPoint,
  releaseVelocity,
  wheelPixels,
} from './dragScrollMath';

/**
 * Desktop parity for horizontal strips that already swipe nicely on touch.
 *
 * - Mouse click-and-drag follows the pointer 1:1, then glides with momentum on release
 *   and settles on a snap point (scroll-snap is switched off while we drive the scroll,
 *   because Chrome snaps every programmatic scrollLeft write to the nearest card).
 * - A vertical mouse wheel over the strip scrolls it sideways, animated, while the strip
 *   can still move that way; at an edge the page scrolls as normal.
 * - Horizontal wheel / trackpad swipes, touch and pen are left entirely to the browser,
 *   so mobile behaviour is unchanged.
 * - A click that ends a drag is swallowed so dragging never selects a card.
 *
 * Direct manipulation is not gated on prefers-reduced-motion: the motion is the response
 * to the user's own hand, and removing it is exactly the "instant" feel being fixed.
 */

const DRAG_THRESHOLD = 6;
const WHEEL_IDLE_MS = 140;
const DEFAULT_EASE = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

interface Options {
  /** scrollLeft values the strip may rest on. Omit for a free-scrolling strip. */
  getSnapPoints?: () => number[];
  /** The inline scroll-snap-type to restore once we stop driving the scroll. */
  snapType?: string;
}

export function useDragScroll(ref: RefObject<HTMLElement | null>, options: Options = {}) {
  const { snapType = 'x mandatory' } = options;
  const snapPointsRef = useRef(options.getSnapPoints);
  useEffect(() => { snapPointsRef.current = options.getSnapPoints; });

  const animId = useRef(0);
  const animTarget = useRef<number | null>(null);

  const maxScroll = (el: HTMLElement) => Math.max(0, el.scrollWidth - el.clientWidth);
  const points = (el: HTMLElement) => {
    const max = maxScroll(el);
    return snapPointsRef.current?.().map((p) => clamp(p, 0, max));
  };

  const stop = useCallback((restoreSnap: boolean) => {
    cancelAnimationFrame(animId.current);
    animId.current = 0;
    animTarget.current = null;
    if (restoreSnap && ref.current) ref.current.style.scrollSnapType = snapType;
  }, [ref, snapType]);

  /** Tween scrollLeft to `target` on rAF (independent of the browser's smooth-scroll setting). */
  const animateTo = useCallback((target: number, duration?: number, ease: (t: number) => number = DEFAULT_EASE) => {
    const el = ref.current;
    if (!el) return;
    const to = clamp(target, 0, maxScroll(el));
    const start = el.scrollLeft;
    const dist = to - start;
    cancelAnimationFrame(animId.current);
    if (Math.abs(dist) < 1) { stop(true); return; }
    el.style.scrollSnapType = 'none';
    animTarget.current = to;
    const dur = duration ?? Math.min(700, 300 + Math.abs(dist) * 0.3);
    const t0 = performance.now();
    const step = (now: number) => {
      const p = Math.min(1, (now - t0) / dur);
      el.scrollLeft = start + dist * ease(p);
      if (p < 1) animId.current = requestAnimationFrame(step);
      else stop(true);
    };
    animId.current = requestAnimationFrame(step);
  }, [ref, stop]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    /* ── Mouse drag with momentum ─────────────────────────────────────── */
    let pointerId: number | null = null;
    let startX = 0;
    let startScroll = 0;
    let dragged = false;
    let suppressClick = false;
    let samples: Array<[number, number]> = [];

    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      stop(false);
      pointerId = e.pointerId;
      startX = e.clientX;
      startScroll = el.scrollLeft;
      dragged = false;
      suppressClick = false;
      samples = [[e.timeStamp, e.clientX]];
      el.style.scrollSnapType = 'none';
      e.preventDefault(); // no text selection / native drag ghost
    };

    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerId !== pointerId) return;
      const dx = e.clientX - startX;
      if (!dragged && Math.abs(dx) > DRAG_THRESHOLD) {
        dragged = true;
        try { el.setPointerCapture(e.pointerId); } catch { /* pointer already gone */ }
      }
      if (!dragged) return;
      el.scrollLeft = startScroll - dx;
      samples.push([e.timeStamp, e.clientX]);
      if (samples.length > 20) samples.shift();
    };

    const onPointerUp = (e: PointerEvent) => {
      if (e.pointerId !== pointerId) return;
      pointerId = null;
      if (!dragged) { el.style.scrollSnapType = snapType; return; }
      suppressClick = true;
      const v = -releaseVelocity(samples, e.timeStamp); // px/ms in scrollLeft terms
      const projected = clamp(el.scrollLeft + v * MOMENTUM_MS, 0, maxScroll(el));
      const pts = points(el);
      const target = pts && pts.length ? nearestPoint(pts, projected) : projected;
      animateTo(target, glideDuration(target - el.scrollLeft, v), easeOutCubic);
    };

    const onPointerCancel = (e: PointerEvent) => {
      if (e.pointerId !== pointerId) return;
      pointerId = null;
      const pts = points(el);
      if (pts && pts.length) animateTo(nearestPoint(pts, el.scrollLeft), undefined, easeOutCubic);
      else el.style.scrollSnapType = snapType;
    };

    const onClickCapture = (e: MouseEvent) => {
      if (!suppressClick) return;
      suppressClick = false;
      e.preventDefault();
      e.stopPropagation();
    };

    /* ── Vertical wheel -> horizontal scroll ──────────────────────────── */
    let wheelIdle: ReturnType<typeof setTimeout> | null = null;
    let wheelDir: 1 | -1 = 1;

    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey) return; // pinch-zoom
      const dx = wheelPixels(e.deltaX, e.deltaMode, el.clientWidth);
      const dy = wheelPixels(e.deltaY, e.deltaMode, el.clientWidth);
      if (Math.abs(dx) >= Math.abs(dy)) {
        // Trackpad / tilt-wheel horizontal: native. Hand control back if we were animating.
        if (animId.current) stop(true);
        // Measured: a native horizontal wheel within ~1s of a vertical wheel we prevented
        // is latched into that gesture and Chrome never snaps it. Settle it ourselves once
        // the stream goes quiet (a no-op when the browser already snapped).
        const pts = points(el);
        if (pts && pts.length && dx !== 0) {
          if (wheelIdle) clearTimeout(wheelIdle);
          wheelIdle = setTimeout(() => {
            if (pointerId !== null || animId.current) return;
            const near = nearestPoint(pts, el.scrollLeft);
            if (Math.abs(near - el.scrollLeft) >= 2) animateTo(near, 320, easeOutCubic);
          }, 300);
        }
        return;
      }
      const max = maxScroll(el);
      if (max <= 0 || dy === 0) return;
      const dir: 1 | -1 = dy > 0 ? 1 : -1;
      const base = animTarget.current ?? el.scrollLeft;
      if ((dir > 0 && base >= max - 1) || (dir < 0 && base <= 1)) return; // let the page scroll
      e.preventDefault();
      wheelDir = dir;
      const pts = points(el);
      const notch = e.deltaMode !== 0 || Math.abs(dy) >= 50; // mouse wheel click vs trackpad stream
      if (pts && pts.length && notch) {
        animateTo(nextPoint(pts, base, dir), 380, easeOutCubic);
        return;
      }
      animateTo(base + dy, 200, easeOutCubic);
      if (pts && pts.length) {
        if (wheelIdle) clearTimeout(wheelIdle);
        wheelIdle = setTimeout(() => {
          const from = animTarget.current ?? el.scrollLeft;
          const near = nearestPoint(pts, from);
          const settle = Math.abs(near - from) < 2 ? near : nextPoint(pts, from - wheelDir * 30, wheelDir);
          animateTo(settle, 320, easeOutCubic);
        }, WHEEL_IDLE_MS);
      }
    };

    el.addEventListener('pointerdown', onPointerDown);
    el.addEventListener('pointermove', onPointerMove);
    el.addEventListener('pointerup', onPointerUp);
    el.addEventListener('pointercancel', onPointerCancel);
    el.addEventListener('click', onClickCapture, true);
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      el.removeEventListener('pointerdown', onPointerDown);
      el.removeEventListener('pointermove', onPointerMove);
      el.removeEventListener('pointerup', onPointerUp);
      el.removeEventListener('pointercancel', onPointerCancel);
      el.removeEventListener('click', onClickCapture, true);
      el.removeEventListener('wheel', onWheel);
      if (wheelIdle) clearTimeout(wheelIdle);
      stop(false);
    };
    // points() reads refs only; animateTo/stop are stable per ref+snapType.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref, snapType, animateTo, stop]);

  return { animateTo };
}

/** True when the OS asks for less motion (Windows: Settings > Accessibility > Animation effects off). */
export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
