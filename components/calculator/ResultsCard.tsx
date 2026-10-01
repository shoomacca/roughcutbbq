'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { formatCookTime } from '@/lib/calculator';
import { useDragScroll } from '@/lib/useDragScroll';
import { m } from 'framer-motion';
import { fadeUp, stagger, useCountUp } from '@/lib/motion';
import type { CalculatorResult, CookingMethod } from '@/types/calculator';

const METHOD_LABELS: Record<CookingMethod, string> = {
  smoker:          'Smoker',
  oven:            'Oven',
  rotisserie:      'Rotisserie',
  dehydrator:      'Dehydrator',
  kamado:          'Kamado',
  charcoal_kettle: 'Charcoal Kettle',
  wood_fire:       'Wood Fire',
  slow_cooker:     'Slow Cooker',
  pressure_cooker: 'Pressure Cooker',
};

const METHOD_ICONS: Record<CookingMethod, string> = {
  smoker:          '💨',
  oven:            '🔥',
  rotisserie:      '🔄',
  dehydrator:      '🌬️',
  kamado:          '🥚',
  charcoal_kettle: '⚫',
  wood_fire:       '🪵',
  slow_cooker:     '🫕',
  pressure_cooker: '⚡',
};

const SMOKE_METHODS: CookingMethod[] = ['smoker', 'kamado', 'charcoal_kettle', 'wood_fire'];

/* ─── Swipeable options section ──────────────────────────────────────────── */
function OptionSwiper({ title, icon, items }: { title: string; icon: string; items: string[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [idx, setIdx] = useState(0);

  // Mouse drag + momentum and wheel-to-horizontal; touch stays native.
  const { animateTo } = useDragScroll(containerRef, {
    getSnapPoints: () => {
      const el = containerRef.current;
      return el ? items.map((_, i) => i * el.clientWidth) : [];
    },
  });

  const updateIdx = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    setIdx(Math.round(el.scrollLeft / el.clientWidth));
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('scroll', updateIdx, { passive: true });
    return () => el.removeEventListener('scroll', updateIdx);
  }, [updateIdx]);

  const goTo = (i: number) => {
    const el = containerRef.current;
    if (!el) return;
    // rAF tween: native behavior:'smooth' measured as a single-frame jump here.
    animateTo(i * el.clientWidth);
  };

  if (!items || items.length === 0) return null;

  const label = items.length > 1
    ? `${icon} ${title} — Option ${idx + 1} of ${items.length}`
    : `${icon} ${title}`;

  return (
    <m.div variants={fadeUp} className="bg-brand-surface rounded-xl overflow-hidden">
      {/* Header row */}
      <div className="px-4 pt-3 pb-1 flex items-center justify-between">
        <span className="font-semibold text-brand-text text-xs uppercase tracking-wide">
          {label}
        </span>
        {items.length > 1 && (
          <span className="text-brand-muted text-[10px]">swipe for more →</span>
        )}
      </div>

      {/* Slides — one per option */}
      <div
        ref={containerRef}
        className="flex overflow-x-auto no-scrollbar cursor-grab active:cursor-grabbing select-none"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {items.map((item, i) => (
          <div
            key={i}
            className="px-4 pb-4 pt-2 text-brand-muted text-xs leading-relaxed"
            style={{ scrollSnapAlign: 'start', flexShrink: 0, width: '100%' }}
          >
            {item}
          </div>
        ))}
      </div>

      {/* Dot nav */}
      {items.length > 1 && (
        <div className="flex justify-center gap-2 pb-3">
          {items.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`rounded-full transition-[width,background-color] duration-(--motion-base) ease-(--ease-out-soft) ${
                i === idx ? 'w-5 h-1.5 bg-brand-primary' : 'w-1.5 h-1.5 bg-brand-muted/30 hover:bg-brand-muted/60'
              }`}
            />
          ))}
        </div>
      )}
    </m.div>
  );
}

/* ─── Stat tile ───────────────────────────────────────────────────────────── */
const COUNTABLE = /^(\d+)(°C| min)$/;

/** "95°C" / "60 min" count up from 0; anything else ("~4 hrs 30 min", "LOW setting") is shown as-is. */
function CountUpValue({ value }: { value: string }) {
  const match = value.match(COUNTABLE);
  const target = match ? Number(match[1]) : 0;
  const n = useCountUp(target);
  if (!match) return <>{value}</>;
  return <>{n}{match[2]}</>;
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <m.div variants={fadeUp} className="flex flex-col gap-0.5 bg-brand-dark rounded-xl p-4">
      <span className="text-brand-muted text-xs font-medium uppercase tracking-wide">{label}</span>
      <span className="text-brand-text text-2xl font-bold tabular-nums"><CountUpValue value={value} /></span>
      {sub && <span className="text-brand-muted text-xs">{sub}</span>}
    </m.div>
  );
}

/* ─── Main card ───────────────────────────────────────────────────────────── */
interface Props {
  result: CalculatorResult;
}

export default function ResultsCard({ result }: Props) {
  const {
    cutName, method, weightKg, cookTimeHours, applianceTempC,
    internalTempC, safeMinTempC, restMinutes, isFlat,
    cutCategory, donenessCue, preheatTempC, rubs, woods, tips,
  } = result;

  const isVeggie = cutCategory === 'veggie';
  const isJerky  = cutCategory === 'jerky';
  const showSafetyNote = internalTempC !== null && internalTempC < safeMinTempC;
  const showWood = SMOKE_METHODS.includes(method);

  return (
    <m.div variants={stagger(0.06)} initial="hidden" animate="show" className="flex flex-col gap-4">
      {/* Header */}
      <m.div variants={fadeUp} className="flex items-center gap-3">
        <m.span
          className="text-3xl inline-block"
          initial={{ scale: 0.6, rotate: -12 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 18 }}
        >
          {METHOD_ICONS[method]}
        </m.span>
        <div>
          <h2 className="text-xl font-bold text-brand-text">{cutName}</h2>
          <span className="inline-block bg-brand-primary/20 text-brand-primary text-xs font-semibold px-2 py-0.5 rounded-full">
            {METHOD_LABELS[method]}
          </span>
        </div>
      </m.div>

      {/* Jerky safety warning */}
      {isJerky && preheatTempC && (
        <m.div variants={fadeUp} className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-xs text-red-400">
          🌡️ <span className="font-semibold">Safety step required:</span> Bring strips to{' '}
          {preheatTempC}°C internal before or at the start of drying.
        </m.div>
      )}

      {/* Stats grid — each tile is its own stagger child */}
      <m.div variants={stagger(0.05)} className="grid grid-cols-2 gap-3">
        <Stat
          label={isJerky ? 'Drying Time' : 'Cook Time'}
          value={`~${formatCookTime(cookTimeHours)}`}
          sub={isFlat ? 'flat estimate · use doneness cues' : `based on ${weightKg} kg`}
        />
        <Stat
          label="Appliance Temp"
          value={
            method === 'slow_cooker' ? 'LOW setting' :
            method === 'pressure_cooker' ? 'High pressure' :
            `${applianceTempC}°C`
          }
          sub={
            method === 'slow_cooker' ? '~8–10 hrs on LOW' :
            method === 'pressure_cooker' ? '121°C / 15 PSI' :
            `Set your ${METHOD_LABELS[method].toLowerCase()} to this`
          }
        />

        {isVeggie ? (
          <m.div variants={fadeUp} className="col-span-2 flex flex-col gap-0.5 bg-brand-dark rounded-xl p-4">
            <span className="text-brand-muted text-xs font-medium uppercase tracking-wide">Doneness Cue</span>
            <span className="text-brand-text text-sm font-semibold leading-snug mt-1">
              {donenessCue ?? "Test with a skewer — no resistance means it's ready"}
            </span>
          </m.div>
        ) : isJerky ? (
          <>
            <Stat label="Pre-heat To" value={`${preheatTempC}°C`} sub="internal — required safety step" />
            <Stat label="Dry Until" value="Leathery" sub="bends & cracks, no wet spots" />
          </>
        ) : (
          <>
            <Stat label="Pull At"   value={`${internalTempC}°C`} sub="internal temperature" />
            <Stat
              label="Rest Time"
              value={restMinutes > 0 ? `${restMinutes} min` : 'None'}
              sub={restMinutes > 0 ? 'cover loosely with foil' : undefined}
            />
          </>
        )}
      </m.div>

      {/* Wood — prominently visible for smoke methods, right after stats */}
      {showWood && woods.length > 0 && (
        <m.div variants={fadeUp} className="bg-brand-dark rounded-xl px-4 py-3 flex items-start gap-3">
          <span className="text-xl leading-none mt-0.5">🪵</span>
          <div>
            <span className="text-brand-muted text-xs font-medium uppercase tracking-wide block mb-1">Recommended Wood</span>
            <span className="text-brand-text text-sm font-semibold leading-snug">
              {woods[0].split('.')[0]}.
            </span>
          </div>
        </m.div>
      )}

      {/* Safety note */}
      {showSafetyNote && (
        <m.div variants={fadeUp} className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3 text-xs text-amber-400">
          ⚠️ Food safety minimum is {safeMinTempC}°C — the pull temp above is for ideal doneness
          on intact whole cuts. Always rest for at least 3 minutes after pulling.
        </m.div>
      )}

      {/* 3 swipeable sections — each slide is a DIFFERENT option */}
      <OptionSwiper title="Rub & Seasoning" icon="🧂" items={rubs} />

      {showWood && woods.length > 0 && (
        <OptionSwiper title="Wood Recommendation" icon="🪵" items={woods} />
      )}

      {showWood && woods.length === 0 && (
        <m.div variants={fadeUp} className="bg-brand-surface rounded-xl px-4 py-3 text-xs text-brand-muted">
          <span className="font-semibold text-brand-text">🪵 Wood: </span>
          No wood recommendation for this cut — use a mild fruitwood if desired.
        </m.div>
      )}

      <OptionSwiper title="Pit Tips" icon="💡" items={tips} />
    </m.div>
  );
}
