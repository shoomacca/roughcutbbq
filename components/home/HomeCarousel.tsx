'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import TallyCounter from '@/components/TallyCounter';

/* ─── Asset map ──────────────────────────────────────────────────────────────
 *
 *  scene.png   → /public/images/coals.png     Full-screen coal fire background
 *  brisket.jpg → /public/images/brisket.jpg   Cinematic brisket hero
 *  fish.png    → /public/images/fish.png       Whole smoked fish hero
 *  rumptip.png → /public/images/rumptip.png   Rump tip hero
 *  grid.png    → /public/images/grid.png       4×2 sprite sheet:
 *
 *    col→  0            1            2         3
 *  row 0:  Ribs       Pulled Pork  Sausage    Chicken
 *  row 1:  Corn       Asparagus    Peppers    Mushrooms
 *
 * ────────────────────────────────────────────────────────────────────────── */

interface Cut {
  id: string;
  category: string;
  label: string;
  sublabel: string;
  headline: string;
  body: string;
  hero: { type: 'image'; src: string } | { type: 'grid'; col: number; row: number };
}

const CUTS: Cut[] = [
  {
    id: 'brisket',
    category: 'beef',
    label: 'Brisket',
    sublabel: 'Beef',
    headline: 'Brisket? Say less.',
    body: 'Melt-in-your-mouth beef, every single time.',
    hero: { type: 'image', src: '/images/brisket.jpg' },
  },
  {
    id: 'ribs',
    category: 'pork',
    label: 'Ribs',
    sublabel: 'Pork',
    headline: 'Low & slow forever.',
    body: 'Fall-off-the-bone or bite-through — you choose.',
    hero: { type: 'grid', col: 0, row: 0 },
  },
  {
    id: 'pulled-pork',
    category: 'pork',
    label: 'Pulled Pork',
    sublabel: 'Pork',
    headline: 'Low & slow pork glory.',
    body: 'Shoulder, belly — all day in the smoke.',
    hero: { type: 'grid', col: 1, row: 0 },
  },
  {
    id: 'chicken',
    category: 'chicken',
    label: 'Chicken',
    sublabel: 'Poultry',
    headline: 'From rubbery to legendary.',
    body: "Never serve dry chicken again. Promise.",
    hero: { type: 'grid', col: 3, row: 0 },
  },
  {
    id: 'fish',
    category: 'fish',
    label: 'Smoked Fish',
    sublabel: 'Seafood',
    headline: "Yes, you can smoke fish.",
    body: "Hot-smoked whole fish. Absolutely stunning.",
    hero: { type: 'image', src: '/images/fish.jpg' },
  },
  {
    id: 'rumptip',
    category: 'beef',
    label: 'Rump Tip',
    sublabel: 'Beef',
    headline: 'The dark horse of BBQ.',
    body: 'Bark like brisket. A fraction of the price.',
    hero: { type: 'image', src: '/images/rumptip.jpg' },
  },
  {
    id: 'corn',
    category: 'veggies',
    label: 'Corn',
    sublabel: 'Vegetables',
    headline: 'Plants deserve smoke too.',
    body: 'Smoked corn hits different. Every time.',
    hero: { type: 'grid', col: 0, row: 1 },
  },
  {
    id: 'mushrooms',
    category: 'veggies',
    label: 'Mushrooms',
    sublabel: 'Vegetables',
    headline: "Smoky. Meaty. Surprising.",
    body: 'Portobellos that convert even the carnivores.',
    hero: { type: 'grid', col: 3, row: 1 },
  },
];

const NAV_ITEMS = [
  { icon: '📖', label: 'Recipes' },
  { icon: '🔧', label: 'Techniques' },
  { icon: '🛠️', label: 'Tools' },
  { icon: '🛒', label: 'Cart' },
  { icon: '📍', label: 'Location' },
];

/* Spring — heavy, premium */
const SPRING = { type: 'spring' as const, stiffness: 280, damping: 32, mass: 1 };

/* Card dimensions */
const CARD_W = 112;
const CARD_H = 116;
const CARD_GAP = 14;
const CARD_STRIDE = CARD_W + CARD_GAP;

/* ─── Sprite crop helper ──────────────────────────────────────────────────── */
function GridCrop({
  col,
  row,
  width,
  height,
  className = '',
}: {
  col: number;
  row: number;
  width: number;
  height: number;
  className?: string;
}) {
  /* background-size: 400% wide, 200% tall (4 cols × 2 rows) */
  const bgX = col === 0 ? '0%' : col === 3 ? '100%' : `${(col / 3) * 100}%`;
  const bgY = row === 0 ? '0%' : '100%';
  return (
    <div
      className={className}
      style={{
        width,
        height,
        backgroundImage: "url('/images/grid.jpg')",
        backgroundSize: '400% 200%',
        backgroundPosition: `${bgX} ${bgY}`,
        backgroundRepeat: 'no-repeat',
      }}
    />
  );
}

/* ─── Card face ───────────────────────────────────────────────────────────── */
function CardFace({ cut, isActive }: { cut: Cut; isActive: boolean }) {
  return (
    <div
      className="relative overflow-hidden flex flex-col"
      style={{
        width: CARD_W,
        height: CARD_H,
        borderRadius: 20,
        background: '#F2EDD7',
        border: isActive ? '2.5px solid #f97316' : '2px solid rgba(58,107,74,0.55)',
        boxShadow: isActive
          ? '0 14px 44px rgba(249,115,22,0.52), 0 4px 16px rgba(0,0,0,0.5)'
          : '0 4px 22px rgba(0,0,0,0.42)',
      }}
    >
      {/* Photo area */}
      <div className="relative flex-1 overflow-hidden" style={{ borderRadius: '18px 18px 0 0' }}>
        {cut.hero.type === 'image' ? (
          <Image
            src={cut.hero.src}
            alt={cut.label}
            fill
            className="object-cover object-center"
            sizes="112px"
          />
        ) : (
          <GridCrop
            col={cut.hero.col}
            row={cut.hero.row}
            width={CARD_W}
            height={CARD_H - 28}
          />
        )}
      </div>

      {/* Label strip */}
      <div
        className="flex-none flex flex-col items-center justify-center"
        style={{
          height: 28,
          background: '#F2EDD7',
          borderTop: '1px solid rgba(26,40,24,0.12)',
        }}
      >
        <span
          className="text-[10px] font-black leading-none"
          style={{ color: '#1b2d1d' }}
        >
          {cut.label}
        </span>
        <span
          className="text-[8px] font-semibold mt-0.5"
          style={{ color: '#4a7a5a' }}
        >
          {cut.sublabel}
        </span>
      </div>
    </div>
  );
}

/* ─── Hero image (plinth) ─────────────────────────────────────────────────── */
function HeroImage({ cut }: { cut: Cut }) {
  if (cut.hero.type === 'image') {
    return (
      <div className="relative w-full h-full">
        <Image
          src={cut.hero.src}
          alt={cut.label}
          fill
          priority
          className="object-cover object-center"
          sizes="340px"
        />
      </div>
    );
  }
  /* Grid crop — scale up for hero display */
  return (
    <GridCrop
      col={cut.hero.col}
      row={cut.hero.row}
      width={340}
      height={220}
      className="rounded-xl"
    />
  );
}

/* ─── Page ────────────────────────────────────────────────────────────────── */
export default function HomeCarousel() {
  const router = useRouter();
  const [activeIdx, setActiveIdx] = useState(0);
  const [heroKey, setHeroKey] = useState(0);

  const handleSelect = (i: number) => {
    if (i === activeIdx) return;
    setActiveIdx(i);
    setHeroKey((k) => k + 1);
  };

  const handleCook = () => {
    sessionStorage.setItem('bbq_initial_cat', CUTS[activeIdx].category);
    router.push('/calculator');
  };

  const activeCut = CUTS[activeIdx];

  return (
    <div
      className="relative w-full min-h-screen overflow-hidden flex flex-col"
      style={{ background: '#0d1208' }}
    >
      {/* ── Background: real coal fire photo ───────────────────────────── */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/coals.jpg"
          alt="Glowing coals and fire"
          fill
          priority
          className="object-cover object-bottom"
          sizes="100vw"
        />
        {/* Dark gradient overlay — preserves text readability at top */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to bottom, rgba(10,18,8,0.88) 0%, rgba(10,18,8,0.55) 40%, rgba(10,18,8,0.20) 75%, rgba(10,18,8,0.0) 100%)',
          }}
        />
        {/* Extra ember warmth from bottom-centre */}
        <div
          className="absolute bottom-0 left-1/2 pointer-events-none ember-glow"
          style={{
            transform: 'translateX(-50%)',
            width: '80%',
            height: '40%',
            background:
              'radial-gradient(ellipse at center bottom, rgba(255,120,0,0.28) 0%, transparent 65%)',
            filter: 'blur(20px)',
          }}
        />
      </div>

      {/* ── UI layer ───────────────────────────────────────────────────── */}
      <div className="relative z-10 flex flex-col min-h-screen">

        {/* Top bar */}
        <div className="flex items-start justify-between px-5 pt-6">
          <div>
            <p
              className="text-white leading-none tracking-tight"
              style={{
                fontFamily: 'var(--font-display, Georgia, serif)',
                fontSize: '22px',
                textShadow: '0 2px 14px rgba(0,0,0,0.7)',
              }}
            >
              Smokemaster BBQ
            </p>
            <p className="text-orange-400 text-[10px] font-bold tracking-[0.2em] uppercase mt-0.5">
              Cook Calculator
            </p>
          </div>

          {/* Pill nav */}
          <div
            className="flex items-center gap-0.5 px-2 py-1.5 rounded-full"
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.15)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
            }}
          >
            {NAV_ITEMS.map((item) => (
              <button
                key={item.label}
                title={item.label}
                className="w-9 h-9 rounded-full flex flex-col items-center justify-center gap-0.5 hover:bg-white/10 transition-colors"
              >
                <span className="text-base leading-none">{item.icon}</span>
                <span className="text-[8px] text-white/50 font-medium leading-none hidden sm:block">
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Headline */}
        <div className="text-center mt-5 px-4">
          <h1
            className="text-white leading-[1.0]"
            style={{
              fontFamily: 'var(--font-display, Georgia, serif)',
              fontSize: 'clamp(34px, 7vw, 58px)',
              textShadow: '0 4px 28px rgba(0,0,0,0.85)',
            }}
          >
            Choose Your Cut
          </h1>
          <p
            className="font-bold tracking-wide mt-1"
            style={{
              color: '#fb923c',
              fontSize: 'clamp(13px, 2.5vw, 18px)',
              textShadow: '0 1px 10px rgba(0,0,0,0.6)',
            }}
          >
            &amp; We&apos;ll Handle the Rest
          </p>
          <p className="text-orange-300/50 text-xs font-semibold tracking-widest uppercase mt-2">
            <TallyCounter suffix="cooks planned" />
          </p>
        </div>

        {/* ── Center scene + cards ──────────────────────────────────────── */}
        <div className="flex-1 flex flex-col items-center justify-end pb-5 gap-4">

          {/* Hero image — swaps on selection */}
          <div className="relative w-full flex justify-center">
            <AnimatePresence mode="popLayout">
              <motion.div
                key={heroKey}
                className="relative overflow-hidden"
                style={{ width: 340, height: 220, borderRadius: 16 }}
                initial={{ opacity: 0, scale: 0.92, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: -10 }}
                transition={{ ...SPRING, stiffness: 320, damping: 26 }}
              >
                <HeroImage cut={activeCut} />
                {/* Subtle vignette so it blends into the background */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    boxShadow: 'inset 0 0 40px rgba(10,18,8,0.5)',
                    borderRadius: 16,
                  }}
                />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Active cut copy */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeCut.id + '-text'}
              className="text-center px-8"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.2 }}
            >
              <p
                className="text-white font-bold text-xl italic leading-snug"
                style={{
                  fontFamily: 'var(--font-display, Georgia, serif)',
                  textShadow: '0 2px 14px rgba(0,0,0,0.8)',
                }}
              >
                {activeCut.headline}
              </p>
              <p className="text-orange-200/75 text-sm mt-1">{activeCut.body}</p>
            </motion.div>
          </AnimatePresence>

          {/* ── Card Tray ────────────────────────────────────────────────── */}
          <div
            className="relative w-full overflow-hidden"
            style={{ height: CARD_H + 16 }}
          >
            {/* Left + right fade masks */}
            <div
              className="absolute left-0 top-0 bottom-0 w-12 z-10 pointer-events-none"
              style={{
                background:
                  'linear-gradient(to right, rgba(10,18,8,0.85), transparent)',
              }}
            />
            <div
              className="absolute right-0 top-0 bottom-0 w-12 z-10 pointer-events-none"
              style={{
                background:
                  'linear-gradient(to left, rgba(10,18,8,0.85), transparent)',
              }}
            />

            {/* Cards — spring-slide on selection */}
            <div className="absolute inset-0 flex items-center justify-center">
              {CUTS.map((cut, i) => {
                const offset = i - activeIdx;
                const absOff = Math.abs(offset);
                const x = offset * CARD_STRIDE;
                const scale = absOff === 0 ? 1.0 : absOff === 1 ? 0.87 : 0.75;
                const opacity = absOff > 3 ? 0 : absOff === 0 ? 1 : absOff === 1 ? 0.82 : 0.5;
                const zIndex = 20 - absOff;
                const rotateY = offset * -5;

                return (
                  <motion.div
                    key={cut.id}
                    className="absolute cursor-pointer"
                    style={{ zIndex }}
                    animate={{ x, scale, opacity, rotateY }}
                    transition={SPRING}
                    onClick={() => handleSelect(i)}
                  >
                    <CardFace cut={cut} isActive={absOff === 0} />
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Dot nav */}
          <div className="flex gap-2 items-center">
            {CUTS.map((_, i) => (
              <button
                key={i}
                onClick={() => handleSelect(i)}
                className="rounded-full transition-all duration-200"
                style={{
                  width: i === activeIdx ? 22 : 7,
                  height: 7,
                  background:
                    i === activeIdx ? '#f97316' : 'rgba(255,255,255,0.3)',
                }}
              />
            ))}
          </div>

          {/* CTA */}
          <motion.button
            onClick={handleCook}
            className="flex items-center gap-2.5"
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.18)',
              backdropFilter: 'blur(14px)',
              WebkitBackdropFilter: 'blur(14px)',
              borderRadius: 999,
              padding: '12px 24px',
              color: 'white',
              fontSize: 14,
              fontWeight: 600,
              boxShadow: '0 8px 32px rgba(0,0,0,0.45)',
            }}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            transition={SPRING}
          >
            <span style={{ fontSize: 18 }}>🔥</span>
            <span>Smokemaster Guide &amp; Shop</span>
            <span
              style={{
                marginLeft: 4,
                background: 'rgba(249,115,22,0.22)',
                border: '1px solid rgba(249,115,22,0.45)',
                borderRadius: 6,
                padding: '2px 8px',
                fontSize: 12,
                color: '#fb923c',
                fontWeight: 700,
              }}
            >
              {activeCut.label}
            </span>
          </motion.button>
        </div>
      </div>
    </div>
  );
}
