'use client';

import { useState, useMemo } from 'react';
import { useSlidingIndicator } from '@/lib/useSlidingIndicator';
import Reveal from '@/components/Reveal';
import Link from 'next/link';
import { RECIPES, RECIPE_CATEGORIES, type Recipe } from '@/data/recipes';

const CAT_EMOJI: Record<string, string> = {
  Pork:    '🐷',
  Beef:    '🐄',
  Chicken: '🐔',
  Lamb:    '🐑',
  Fish:    '🐟',
  Jerky:   '🥩',
};

function RecipeRow({ item }: { item: Recipe }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="bg-brand-surface border border-white/8 rounded-xl overflow-hidden hover:border-white/20 hover:shadow-lg transition-ui lift"
    >
      {/* Summary row — always visible */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={`recipe-${item.slug}`}
        className="w-full flex items-center gap-4 px-4 py-4 text-left group"
      >
        {/* Category emoji tile */}
        <div className="w-16 h-16 rounded-xl bg-brand-dark flex items-center justify-center flex-shrink-0">
          <span className="text-4xl">{CAT_EMOJI[item.category] ?? '🍖'}</span>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-brand-text font-semibold text-sm leading-snug group-hover:text-brand-secondary transition-ui">
            {item.name}
          </p>
          <p className="text-brand-muted text-xs mt-1">
            {item.method} · {item.targetInternal}
          </p>
          <p className="text-brand-muted/60 text-xs mt-0.5 line-clamp-1">{item.notes}</p>
        </div>

        <span className="text-brand-muted text-xs flex-shrink-0 pr-1">
          {open ? '▲' : '▼'}
        </span>
      </button>

      {/* Expanded details */}
      <div id={`recipe-${item.slug}`} className="collapse-box" data-open={open ? '' : undefined}>
       <div inert={!open}>
        <div className="border-t border-white/8 px-4 py-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <Detail label="Cut" value={item.cut} />
          <Detail label="Method" value={item.method} />
          <Detail label="Style / Rub" value={item.style} />
          <Detail label="Target Internal" value={item.targetInternal} />
          <Detail label="Time" value={item.time} />
          {item.wood !== 'N/A' && <Detail label="Wood" value={item.wood} />}
          <div className="sm:col-span-2">
            <Detail label="Notes" value={item.notes} />
          </div>
          <div className="sm:col-span-2">
            <Link
              href={`/recipes/${item.slug}`}
              className="text-brand-secondary text-xs font-semibold hover:underline"
            >
              Full recipe page &rarr;
            </Link>
          </div>
        </div>
       </div>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-brand-muted uppercase tracking-wider text-[10px] font-semibold mb-0.5">{label}</p>
      <p className="text-brand-text text-xs leading-relaxed">{value}</p>
    </div>
  );
}

export default function RecipesPage() {
  const [activeCategory, setActiveCategory] = useState('All');
  const { containerRef: tabsRef, indicatorRef: pillRef } = useSlidingIndicator(activeCategory);

  const filtered = useMemo(
    () => activeCategory === 'All' ? RECIPES : RECIPES.filter((r) => r.category === activeCategory),
    [activeCategory]
  );

  const grouped = useMemo(() => {
    if (activeCategory !== 'All') return null;
    const map: Record<string, Recipe[]> = {};
    for (const item of filtered) {
      if (!map[item.category]) map[item.category] = [];
      map[item.category].push(item);
    }
    return map;
  }, [filtered, activeCategory]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-brand-text text-2xl font-bold">BBQ Recipes</h1>
        <p className="text-brand-muted text-sm mt-1">
          60 cook profiles across pork, beef, chicken, lamb, fish, and jerky — tap to expand
        </p>
      </div>

      {/* Category filter tabs */}
      <div ref={tabsRef} className="relative flex gap-2 flex-wrap mb-6">
        {/* One orange pill shared by all tabs: it glides to the active one (lib/useSlidingIndicator). */}
        <span ref={pillRef} aria-hidden className="slide-indicator rounded-full" style={{ background: '#f97316' }} />
        {RECIPE_CATEGORIES.map(({ id, emoji }) => (
          <button
            key={id}
            data-tab={id}
            data-active={activeCategory === id ? '' : undefined}
            onClick={() => setActiveCategory(id)}
            className={`relative z-10 px-3 py-1.5 rounded-full text-xs font-semibold transition-ui border ${
              activeCategory === id ? 'text-white border-transparent' : 'text-brand-text border-white/12 bg-white/7 hover:bg-white/12'
            }`}
          >
            {emoji ? `${emoji} ` : ''}{id}
          </button>
        ))}
      </div>

      {/* All — grouped with section headers */}
      {grouped && (
        <div className="flex flex-col gap-10">
          {RECIPE_CATEGORIES.slice(1).filter(({ id }) => grouped[id]?.length).map(({ id, emoji }) => (
            <section key={id}>
              <h2 className="text-brand-text font-bold text-base mb-3">{emoji} {id}</h2>
              <div className="flex flex-col gap-2">
                {grouped[id].map((item, i) => <Reveal key={item.slug} index={i}><RecipeRow item={item} /></Reveal>)}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* Single category — flat list */}
      {!grouped && (
        <div className="flex flex-col gap-2">
          {filtered.map((item, i) => <Reveal key={item.slug} index={i}><RecipeRow item={item} /></Reveal>)}
        </div>
      )}
    </div>
  );
}
