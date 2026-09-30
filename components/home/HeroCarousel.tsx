'use client';

import { useRef, useState, useCallback, useEffect, useLayoutEffect } from 'react';
import { useRouter } from 'next/navigation';

const CATEGORIES = [
  { id: 'pork',    icon: '🐷', label: 'Pork',         headline: 'Low & slow pork glory',      body: 'Shoulder, ribs, belly — all day in the smoke.' },
  { id: 'beef',    icon: '🐄', label: 'Beef',         headline: 'Brisket? Say less.',          body: 'Melt-in-your-mouth beef, every single time.' },
  { id: 'chicken', icon: '🐔', label: 'Chicken',      headline: 'From rubbery to legendary',   body: "Never serve dry chicken again. Promise." },
  { id: 'lamb',    icon: '🐑', label: 'Lamb',         headline: 'The fancy option',            body: "Smoky shoulder, perfect leg — looks hard, isn't." },
  { id: 'fish',    icon: '🐟', label: 'Fish',         headline: 'Yes, you can smoke fish',     body: "Hot-smoked salmon that'll genuinely blow minds." },
  { id: 'veggies', icon: '🥦', label: 'Vegetables',   headline: 'Plants deserve smoke too',    body: 'Smoked cauliflower. Smoked garlic paste. Trust us.' },
  { id: 'jerky',   icon: '🥩', label: 'Jerky & Dried', headline: 'DIY snack game activated',  body: 'Make your own jerky. Surprisingly not complicated.' },
];

const GAP = 20;

/* ── Responsive card size ──────────────────────────────────────────────── */
function useCardSize() {
  const [cardW, setCardW] = useState(180);
  useLayoutEffect(() => {
    const update = () => {
      if (window.innerWidth >= 1024) setCardW(268);
      else if (window.innerWidth >= 768) setCardW(220);
      else setCardW(180);
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);
  return cardW;
}

/* ── Pointer type (coarse = touch, fine = mouse) ───────────────────────── */
function isTouch() {
  return typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;
}

export default function HeroCarousel() {
  const router = useRouter();
  const cardW = useCardSize();
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const innerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [centeredIdx, setCenteredIdx] = useState(0);
  const centeredIdxRef = useRef(0);

  // Drag state
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const scrollStartX = useRef(0);
  const hasDragged = useRef(false);

  // Double-click state
  const clickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastClickIdx = useRef<number | null>(null);

  /* ── rAF smooth transform loop ─────────────────────────────────────── */
  const rafId = useRef<number>(0);
  const STRIDE = cardW + GAP;

  const tick = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const scrollLeft = container.scrollLeft;
    const viewW = container.clientWidth;
    const center = scrollLeft + viewW / 2;

    let closestIdx = 0;
    let closestDist = Infinity;

    itemRefs.current.forEach((el, i) => {
      if (!el) return;
      const inner = innerRefs.current[i];
      if (!inner) return;

      const elCenter = el.offsetLeft + el.offsetWidth / 2;
      const rawOffset = (elCenter - center) / STRIDE;
      const absOff = Math.abs(rawOffset);

      const scale = absOff < 0.5
        ? 1.1 - absOff * 0.12
        : Math.max(0.6, 1.04 - absOff * 0.14);
      const rotate = Math.max(-22, Math.min(22, rawOffset * 11));
      const opacity = absOff > 3.5 ? 0 : Math.max(0.2, 1 - absOff * 0.24);

      inner.style.transform = `scale(${scale}) rotate(${rotate}deg)`;
      inner.style.opacity = String(opacity);

      const dist = Math.abs(elCenter - center);
      if (dist < closestDist) { closestDist = dist; closestIdx = i; }
    });

    if (closestIdx !== centeredIdxRef.current) {
      centeredIdxRef.current = closestIdx;
      setCenteredIdx(closestIdx);
    }
  }, [STRIDE]);

  /* Run tick synchronously after first DOM paint — eliminates the flash frame */
  useLayoutEffect(() => {
    rafId.current = requestAnimationFrame(tick);
  }, [tick]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const onScroll = () => {
      cancelAnimationFrame(rafId.current);
      rafId.current = requestAnimationFrame(tick);
    };
    container.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(rafId.current);
    };
  }, [tick]);

  /* Re-run tick when cardW changes (resize) */
  useEffect(() => {
    rafId.current = requestAnimationFrame(tick);
  }, [cardW, tick]);

  /* ── Scroll helpers ─────────────────────────────────────────────────── */
  const animRef = useRef(0);

  const animateScrollTo = useCallback((target: number, duration?: number) => {
    const container = containerRef.current;
    if (!container) return;
    const start = container.scrollLeft;
    const dist  = target - start;
    if (Math.abs(dist) < 1) return;
    cancelAnimationFrame(animRef.current);
    // Chrome snaps instantly when scroll-snap is active during programmatic
    // scrolling — disable it for the duration of the tween.
    container.style.scrollSnapType = 'none';
    const dur = duration ?? Math.min(700, 300 + Math.abs(dist) * 0.3);
    const t0  = performance.now();
    const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
    const step = (now: number) => {
      const p = Math.min(1, (now - t0) / dur);
      container.scrollLeft = start + dist * ease(p);
      if (p < 1) {
        animRef.current = requestAnimationFrame(step);
      } else {
        container.style.scrollSnapType = 'x mandatory';
      }
    };
    animRef.current = requestAnimationFrame(step);
  }, []);

  const scrollToIdx = (idx: number) => {
    const container = containerRef.current;
    const el = itemRefs.current[idx];
    if (!container || !el) return;
    animateScrollTo(el.offsetLeft + el.offsetWidth / 2 - container.clientWidth / 2);
  };

  /* Entrance — cards glide in from the right so each step feels animated */
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const from = Math.min(STRIDE * 1.4, container.scrollWidth - container.clientWidth);
    if (from <= 0) return;
    container.style.scrollSnapType = 'none';
    container.scrollLeft = from;
    animateScrollTo(0, 650);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Mouse drag ─────────────────────────────────────────────────────── */
  const onMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    hasDragged.current = false;
    dragStartX.current = e.clientX;
    scrollStartX.current = containerRef.current?.scrollLeft ?? 0;
    e.preventDefault();
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - dragStartX.current;
    if (Math.abs(dx) > 6) hasDragged.current = true;
    if (containerRef.current) containerRef.current.scrollLeft = scrollStartX.current - dx;
  };

  const onMouseUp = () => { isDragging.current = false; };

  /* ── Click / double-click ───────────────────────────────────────────── */
  const proceed = useCallback(() => {
    sessionStorage.setItem('bbq_initial_cat', CATEGORIES[centeredIdxRef.current].id);
    router.push('/calculator');
  }, [router]);

  const handleCardClick = (i: number) => {
    if (hasDragged.current) { hasDragged.current = false; return; }

    if (isTouch()) {
      // Touch: single tap = centre it; if already centred, proceed
      if (i === centeredIdxRef.current) {
        proceed();
      } else {
        scrollToIdx(i);
      }
    } else {
      // Desktop: single click = centre; double click = proceed
      if (clickTimer.current !== null && lastClickIdx.current === i) {
        clearTimeout(clickTimer.current);
        clickTimer.current = null;
        lastClickIdx.current = null;
        proceed();
      } else {
        scrollToIdx(i);
        lastClickIdx.current = i;
        clickTimer.current = setTimeout(() => {
          clickTimer.current = null;
          lastClickIdx.current = null;
        }, 350);
      }
    }
  };

  const centered = CATEGORIES[centeredIdx];
  const emojiSize = cardW >= 268 ? '8.5rem' : cardW >= 220 ? '7rem' : '5.5rem';
  const halfCard = cardW / 2;

  return (
    <div className="flex flex-col w-full flex-1 justify-center" style={{ gap: 0 }}>
      {/* Dot navigation */}
      <div className="flex justify-center gap-2 py-3">
        {CATEGORIES.map((_, i) => (
          <button
            key={i}
            onClick={() => scrollToIdx(i)}
            className={`rounded-full transition-all duration-200 ${
              i === centeredIdx ? 'w-6 h-2 bg-brand-secondary' : 'w-2 h-2 bg-white/25 hover:bg-white/50'
            }`}
          />
        ))}
      </div>

      {/* Carousel */}
      <div
        ref={containerRef}
        className="flex overflow-x-auto no-scrollbar cursor-grab active:cursor-grabbing select-none"
        style={{
          scrollSnapType: 'x mandatory',
          paddingLeft: `calc(50% - ${halfCard}px)`,
          paddingRight: `calc(50% - ${halfCard}px)`,
          gap: `${GAP}px`,
          paddingTop: '2rem',
          paddingBottom: '2.5rem',
        }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
      >
        {CATEGORIES.map((cat, i) => (
          <div
            key={cat.id}
            ref={(el) => { itemRefs.current[i] = el; }}
            onClick={() => handleCardClick(i)}
            style={{ scrollSnapAlign: 'center', flexShrink: 0, width: `${cardW}px` }}
            className="cursor-pointer"
          >
            {/* Inner — transforms managed directly by rAF loop via innerRefs */}
            <div
              ref={(el) => { innerRefs.current[i] = el; }}
              style={{
                transformOrigin: 'center bottom',
                willChange: 'transform, opacity',
              }}
            >
              <div
                className="rounded-3xl flex flex-col items-center justify-center gap-2 select-none"
                style={{
                  width: cardW,
                  height: cardW,
                  background: '#F2EDD7',
                  border: i === centeredIdx ? '3px solid #2A5236' : '2px solid #3A6B4A',
                  boxShadow: i === centeredIdx
                    ? '0 24px 64px rgba(230,126,34,0.35), 0 8px 24px rgba(0,0,0,0.5)'
                    : '0 4px 16px rgba(0,0,0,0.35)',
                  transition: 'border 0.2s ease, box-shadow 0.2s ease',
                }}
              >
                <span style={{ fontSize: emojiSize, lineHeight: 1 }}>{cat.icon}</span>
                <span className="font-bold text-sm" style={{ color: '#162818' }}>{cat.label}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Dynamic headline */}
      <div className="flex flex-col items-center text-center px-6 pt-2 pb-6 gap-2 min-h-[80px]">
        <h2 className="text-2xl sm:text-3xl font-black text-brand-text italic leading-tight">
          {centered.headline}
        </h2>
        <p className="text-brand-muted text-sm">{centered.body}</p>
        {!isTouch() && (
          <p className="text-brand-muted/50 text-xs mt-1">Double-click to start cooking</p>
        )}
      </div>

      {/* CTA */}
      <div className="px-6 pt-2 pb-6">
        <button
          onClick={proceed}
          className="w-full bg-brand-secondary hover:bg-brand-primary transition-colors text-white font-black text-lg px-8 py-4 rounded-2xl tracking-wide"
        >
          Cook {centered.label} →
        </button>
      </div>
    </div>
  );
}
