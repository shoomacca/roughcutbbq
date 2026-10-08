'use client';

import { useRef, useState, useCallback, useEffect, useLayoutEffect } from 'react';
import { useDragScroll, prefersReducedMotion } from '@/lib/useDragScroll';
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
  // The headline only animates on later changes: server HTML must ship fully visible.
  const [textChanged, setTextChanged] = useState(false);
  // Set by the user's own pointer/wheel/tap/dot click; the initial positioning and the
  // entrance glide also move the centre, and must not restart the text animation.
  const userMoved = useRef(false);
  const markUserMoved = () => { userMoved.current = true; };
  const centeredIdxRef = useRef(0);

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
      if (userMoved.current) setTextChanged(true);
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
  // Mouse drag + momentum, wheel-to-horizontal, and the rAF tween all live in the hook.
  const { animateTo: animateScrollTo } = useDragScroll(containerRef, {
    getSnapPoints: () => {
      const container = containerRef.current;
      if (!container) return [];
      return itemRefs.current
        .filter((el): el is HTMLDivElement => !!el)
        .map((el) => el.offsetLeft + el.offsetWidth / 2 - container.clientWidth / 2);
    },
  });

  const scrollToIdx = (idx: number) => {
    markUserMoved();
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
    // Unprompted decorative motion: skip it when the OS asks for reduced motion.
    if (from <= 0 || prefersReducedMotion()) return;
    container.style.scrollSnapType = 'none';
    container.scrollLeft = from;
    animateScrollTo(0, 650);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Click / double-click ───────────────────────────────────────────── */
  const proceed = useCallback(() => {
    sessionStorage.setItem('bbq_initial_cat', CATEGORIES[centeredIdxRef.current].id);
    router.push('/calculator');
  }, [router]);

  const handleCardClick = (i: number) => {
    markUserMoved();
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
    <div className="flex flex-col w-full flex-1" style={{ gap: 0 }}>
      {/* Dot navigation */}
      <div className="flex justify-center gap-2 py-3">
        {CATEGORIES.map((_, i) => (
          <button
            key={i}
            onClick={() => scrollToIdx(i)}
            className={`rounded-full transition-[width,background-color] duration-(--motion-base) ease-(--ease-out-soft) ${
              i === centeredIdx ? 'w-6 h-2 bg-brand-secondary' : 'w-2 h-2 bg-white/25 hover:bg-white/50'
            }`}
          />
        ))}
      </div>

      {/* Carousel */}
      <div
        ref={containerRef}
        onPointerDown={markUserMoved}
        onWheel={markUserMoved}
        onTouchStart={markUserMoved}
        onKeyDown={markUserMoved}
        className="flex overflow-x-auto no-scrollbar cursor-grab active:cursor-grabbing select-none"
        style={{
          scrollSnapType: 'x mandatory',
          paddingLeft: `calc(50% - ${halfCard}px)`,
          paddingRight: `calc(50% - ${halfCard}px)`,
          gap: `${GAP}px`,
          paddingTop: '2rem',
          paddingBottom: '2.5rem',
        }}
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
                  transition: 'border var(--motion-base) var(--ease-out-soft), box-shadow var(--motion-base) var(--ease-out-soft)',
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
        <h2
          key={centered.id}
          className={`text-2xl sm:text-3xl font-black text-brand-text italic leading-tight ${textChanged ? 'animate-fade-up' : ''}`}
          style={textChanged ? { animationDuration: 'var(--motion-base)' } : undefined}
        >
          {centered.headline}
        </h2>
        <p
          key={`${centered.id}-body`}
          className={`text-brand-muted text-sm ${textChanged ? 'animate-fade-in' : ''}`}
          style={textChanged ? { animationDelay: '50ms' } : undefined}
        >
          {centered.body}
        </p>
        {!isTouch() && (
          <p className="text-brand-muted/50 text-xs mt-1">Double-click to start cooking</p>
        )}
      </div>

      {/* CTA */}
      <div className="px-6 pt-2 pb-6">
        <button
          onClick={proceed}
          className="w-full bg-brand-secondary hover:bg-brand-primary transition-ui text-white font-black text-lg px-8 py-4 rounded-2xl tracking-wide"
        >
          Cook {centered.label} →
        </button>
      </div>
    </div>
  );
}
