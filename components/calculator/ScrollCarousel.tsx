'use client';

import { useRef, useState, useCallback, useEffect, useLayoutEffect } from 'react';
import { useDragScroll, prefersReducedMotion } from '@/lib/useDragScroll';

export interface CarouselItem {
  id: string;
  icon: string;
  label: string;
  sublabel?: string;
}

interface Props {
  items: CarouselItem[];
  onSelect: (id: string) => void;
  title: string;
  subtitle?: string;
  onBack?: () => void;
  ctaPrefix?: string;
}

const GAP = 24;

/* ── Responsive card size ──────────────────────────────────────────────────── */
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

function isTouch() {
  return typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;
}

export default function ScrollCarousel({
  items,
  onSelect,
  onBack,
  ctaPrefix = 'Choose',
}: Props) {
  const cardW = useCardSize();
  const containerRef   = useRef<HTMLDivElement>(null);
  const itemRefs       = useRef<(HTMLDivElement | null)[]>([]);
  const innerRefs      = useRef<(HTMLDivElement | null)[]>([]);
  const [centeredIdx, setCenteredIdx] = useState(0);
  // The label only animates on later changes: first paint ships fully visible.
  const [textChanged, setTextChanged] = useState(false);
  // Set by the user's own pointer/wheel/tap/dot click; the initial positioning and the
  // entrance glide also move the centre, and must not restart the text animation.
  const userMoved = useRef(false);
  const markUserMoved = () => { userMoved.current = true; };
  const centeredIdxRef = useRef(0);

  const clickTimer   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastClickIdx = useRef<number | null>(null);

  const rafId = useRef<number>(0);
  const STRIDE = cardW + GAP;

  /* ── rAF transform loop ────────────────────────────────────────────────── */
  const tick = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const center = container.scrollLeft + container.clientWidth / 2;

    let closestIdx  = 0;
    let closestDist = Infinity;

    itemRefs.current.forEach((el, i) => {
      if (!el) return;
      const inner = innerRefs.current[i];
      if (!inner) return;

      const elCenter = el.offsetLeft + el.offsetWidth / 2;
      const rawOff   = (elCenter - center) / STRIDE;
      const absOff   = Math.abs(rawOff);

      const scale   = absOff < 0.5 ? 1.08 - absOff * 0.1 : Math.max(0.6, 1.03 - absOff * 0.13);
      const rotate  = Math.max(-20, Math.min(20, rawOff * 10));
      const opacity = absOff > 3.5 ? 0 : Math.max(0.2, 1 - absOff * 0.22);

      inner.style.transform = `scale(${scale}) rotate(${rotate}deg)`;
      inner.style.opacity   = String(opacity);

      const dist = Math.abs(elCenter - center);
      if (dist < closestDist) { closestDist = dist; closestIdx = i; }
    });

    if (closestIdx !== centeredIdxRef.current) {
      centeredIdxRef.current = closestIdx;
      setCenteredIdx(closestIdx);
      if (userMoved.current) setTextChanged(true);
    }
  }, [STRIDE]);

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

  useEffect(() => {
    rafId.current = requestAnimationFrame(tick);
  }, [cardW, tick]);

  /* ── Helpers ────────────────────────────────────────────────────────────── */
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

  const handleCardClick = (i: number) => {
    markUserMoved();
    if (isTouch()) {
      if (i === centeredIdxRef.current) onSelect(items[i].id);
      else scrollToIdx(i);
    } else {
      if (clickTimer.current !== null && lastClickIdx.current === i) {
        clearTimeout(clickTimer.current);
        clickTimer.current   = null;
        lastClickIdx.current = null;
        scrollToIdx(i);
        setCenteredIdx(i);
        centeredIdxRef.current = i;
        onSelect(items[i].id);
      } else {
        scrollToIdx(i);
        lastClickIdx.current = i;
        clickTimer.current = setTimeout(() => {
          clickTimer.current   = null;
          lastClickIdx.current = null;
        }, 350);
      }
    }
  };

  const centeredItem = items[centeredIdx];
  const emojiSize    = cardW >= 268 ? '8.5rem' : cardW >= 220 ? '7rem' : '5.5rem';
  const halfCard     = cardW / 2;

  return (
    <div className="flex flex-col w-full">

      {/* ── Back button only — above dots, matches homepage which has no header above carousel */}
      <div className="px-6 pb-1 h-6">
          {onBack && (
          <button
            onClick={onBack}
            className="text-brand-muted hover:text-brand-text text-sm flex items-center gap-1 transition-ui"
          >
            ← Back
          </button>
          )}
      </div>

      {/* ── Dot nav ─────────────────────────────────────────────────────── */}
      <div className="flex justify-center gap-2 mb-2">
        {items.map((_, i) => (
          <button
            key={i}
            onClick={() => scrollToIdx(i)}
            className={`rounded-full transition-[width,background-color] duration-(--motion-base) ease-(--ease-out-soft) ${
              i === centeredIdx
                ? 'w-6 h-2 bg-brand-secondary'
                : 'w-2 h-2 bg-white/25 hover:bg-white/50'
            }`}
          />
        ))}
      </div>

      {/* ── Carousel — full width ─────────────────────────────────────────── */}
      <div
        ref={containerRef}
        onPointerDown={markUserMoved}
        onWheel={markUserMoved}
        onTouchStart={markUserMoved}
        onKeyDown={markUserMoved}
        className="flex overflow-x-auto no-scrollbar cursor-grab active:cursor-grabbing select-none"
        style={{
          scrollSnapType: 'x mandatory',
          paddingLeft:  `calc(50% - ${halfCard}px)`,
          paddingRight: `calc(50% - ${halfCard}px)`,
          gap: `${GAP}px`,
          paddingTop:    '1.5rem',
          paddingBottom: '1.5rem',
        }}
      >
        {items.map((item, i) => (
          <div
            key={item.id}
            ref={(el) => { itemRefs.current[i] = el; }}
            onClick={() => handleCardClick(i)}
            style={{ scrollSnapAlign: 'center', flexShrink: 0, width: `${cardW}px` }}
            className="cursor-pointer"
          >
            {/* Rotating card — emoji only, no text inside */}
            <div
              ref={(el) => { innerRefs.current[i] = el; }}
              style={{ transformOrigin: 'center bottom', willChange: 'transform, opacity' }}
            >
              <div
                className="rounded-3xl flex items-center justify-center select-none"
                style={{
                  width:     cardW,
                  height:    cardW,
                  background: '#F2EDD7',
                  border:    i === centeredIdx ? '3px solid #2A5236' : '2px solid #3A6B4A',
                  boxShadow: i === centeredIdx
                    ? '0 24px 64px rgba(230,126,34,0.35), 0 8px 24px rgba(0,0,0,0.5)'
                    : '0 4px 16px rgba(0,0,0,0.35)',
                  transition: 'border var(--motion-base) var(--ease-out-soft), box-shadow var(--motion-base) var(--ease-out-soft)',
                }}
              >
                <span style={{ fontSize: emojiSize, lineHeight: 1 }}>{item.icon}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Label — static centred text below carousel (like homepage headline) */}
      <div className="flex flex-col items-center text-center px-6 pt-2 pb-4 min-h-[88px]">
        {centeredItem && (
          <>
            <p
              key={centeredItem.id}
              className={`text-brand-text font-black text-xl italic leading-tight ${textChanged ? 'animate-fade-up' : ''}`}
              style={textChanged ? { animationDuration: 'var(--motion-base)' } : undefined}
            >
              {centeredItem.label}
            </p>
            {centeredItem.sublabel && (
              <p
                key={`${centeredItem.id}-sub`}
                className={`text-brand-muted text-sm mt-1 ${textChanged ? 'animate-fade-in' : ''}`}
                style={textChanged ? { animationDelay: '50ms' } : undefined}
              >
                {centeredItem.sublabel}
              </p>
            )}
          </>
        )}
      </div>

      {/* ── CTA — full width, same as homepage button ───────────────────── */}
      {centeredItem && (
        <div className="px-6 pt-2 pb-6">
          <button
            onClick={() => onSelect(centeredItem.id)}
            className="w-full bg-brand-secondary hover:bg-brand-primary transition-ui text-white font-black text-lg px-8 py-4 rounded-2xl tracking-wide"
          >
            {ctaPrefix} {centeredItem.label} →
          </button>
        </div>
      )}
    </div>
  );
}
