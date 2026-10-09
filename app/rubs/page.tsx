'use client';

import { useEffect, useState, useMemo } from 'react';
import { useSlidingIndicator } from '@/lib/useSlidingIndicator';
import Reveal from '@/components/Reveal';
import { RUBS, RUB_CATEGORIES, type RubItem } from '@/data/rubs';
import { RUB_RECIPES, formatParts } from '@/data/rub-recipes';

const RUB_CAT_IDS = new Set(RUB_CATEGORIES.filter((c) => c.id !== 'All').map((c) => c.id));
const RUB_EMOJI: Record<string, string> = Object.fromEntries(RUB_CATEGORIES.map((c) => [c.id, c.emoji ?? '']));

interface DbGearRow {
  slug: string; name: string; category: string;
  description: string | null; affiliate_url: string;
}

/* ── Lazy-loaded product image ─────────────────────────────────────────────── */
function ProductImage({ url, fallback }: { url: string; fallback: string }) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/og-image?url=${encodeURIComponent(url)}`)
      .then((r) => r.json())
      .then(({ image }) => setSrc(image ?? ''))
      .catch(() => setSrc(''));
  }, [url]);

  if (src === null) {
    return (
      <div className="w-20 h-20 rounded-xl skeleton flex-shrink-0" />
    );
  }

  if (src) {
    return (
      /* eslint-disable-next-line @next/next/no-img-element */
      <img
        src={src}
        alt=""
        className="w-20 h-20 rounded-xl object-contain bg-white flex-shrink-0"
      />
    );
  }

  return (
    <div className="w-20 h-20 rounded-xl bg-brand-dark flex items-center justify-center flex-shrink-0">
      <span className="text-4xl">{fallback}</span>
    </div>
  );
}

const CAT_EMOJI: Record<string, string> = {
  'Beef & Brisket':    '🥩',
  'Pork & Ribs':       '🐖',
  'Poultry & Chicken': '🐔',
  'Lamb & Game':       '🐑',
  'Fish & Seafood':    '🐟',
};

function RubRow({ item }: { item: RubItem }) {
  return (
    <a
      href={`/go/${item.slug}`}
      target="_blank"
      rel="noopener noreferrer nofollow"
      className="group flex items-center gap-4 bg-brand-surface border border-white/8 rounded-xl px-4 py-4 hover:border-white/20 hover:bg-brand-surface/80 hover:shadow-lg transition-ui lift"
    >
      <ProductImage url={item.affiliateUrl} fallback={CAT_EMOJI[item.category] ?? '🧂'} />

      <div className="flex-1 min-w-0">
        <p className="text-brand-text font-semibold text-sm leading-snug group-hover:text-brand-secondary transition-ui">
          {item.name}
        </p>
        <p className="text-brand-muted text-xs mt-1 leading-relaxed line-clamp-2">
          {item.tagline}
        </p>
      </div>

      <div className="flex-shrink-0">
        <span
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-white whitespace-nowrap"
          style={{ background: '#f97316' }}
        >
          Shop →
        </span>
      </div>
    </a>
  );
}

export default function RubsPage() {
  const [activeCategory, setActiveCategory] = useState('All');
  const { containerRef: tabsRef, indicatorRef: pillRef } = useSlidingIndicator(activeCategory);
  const [items, setItems] = useState<RubItem[]>(RUBS);

  // Live catalogue from the database (managed at /admin/gear); static list is the fallback
  useEffect(() => {
    fetch('/api/gear?limit=100')
      .then((r) => r.json())
      .then(({ gear }: { gear: DbGearRow[] }) => {
        const rows = (gear ?? [])
          .filter((g) => RUB_CAT_IDS.has(g.category))
          .map((g) => ({
            slug: g.slug,
            name: g.name,
            category: g.category,
            tagline: g.description ?? '',
            affiliateUrl: g.affiliate_url,
          }));
        if (rows.length) setItems(rows);
      })
      .catch(() => {});
  }, []);

  const tabs = useMemo(
    () => [
      { id: 'All', emoji: '' },
      ...Array.from(new Set(items.map((i) => i.category))).map((id) => ({ id, emoji: RUB_EMOJI[id] ?? '🧂' })),
    ],
    [items]
  );

  const filtered = useMemo(
    () => activeCategory === 'All' ? items : items.filter((r) => r.category === activeCategory),
    [activeCategory, items]
  );

  const grouped = useMemo(() => {
    if (activeCategory !== 'All') return null;
    const map: Record<string, RubItem[]> = {};
    for (const item of filtered) {
      if (!map[item.category]) map[item.category] = [];
      map[item.category].push(item);
    }
    return map;
  }, [filtered, activeCategory]);

  return (
    <div className="page-shell">
      <div className="mb-6">
        <h1 className="page-title">BBQ Rubs & Seasonings</h1>
        <p className="text-brand-muted text-sm mt-1">
          Rubs sorted by meat — every link supports BBQ Calculator
        </p>
      </div>

      {/* Category tabs */}
      <div ref={tabsRef} className="relative flex gap-2 flex-wrap mb-6">
        {/* One orange pill shared by all tabs: it glides to the active one (lib/useSlidingIndicator). */}
        <span ref={pillRef} aria-hidden className="slide-indicator rounded-full" style={{ background: '#f97316' }} />
        {tabs.map(({ id, emoji }) => (
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

      {/* All — grouped */}
      {grouped && (
        <div className="flex flex-col gap-10">
          {tabs.slice(1).filter(({ id }) => grouped[id]?.length).map(({ id, emoji }) => (
            <section key={id}>
              <h2 className="text-brand-text font-bold text-base mb-3">{emoji} {id}</h2>
              <div className="flex flex-col gap-3">
                {grouped[id].map((item, i) => <Reveal key={item.slug} index={i}><RubRow item={item} /></Reveal>)}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* Single category */}
      {!grouped && (
        <div className="flex flex-col gap-3">
          {filtered.map((item, i) => <Reveal key={item.slug} index={i}><RubRow item={item} /></Reveal>)}
        </div>
      )}

      {/* Scratch-made rubs by parts (RC-13.5: ported from the retired roughcut.com.au/rubs.html). */}
      <section className="mt-14" aria-labelledby="make-your-own" data-testid="rub-recipes">
        <h2 id="make-your-own" className="text-brand-text font-bold text-base mb-1">Make your own</h2>
        <p className="text-brand-muted text-sm mb-4">
          Four scratch rubs, measured by parts: use the same spoon or cup for every line and scale to the cut.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {RUB_RECIPES.map((r, i) => (
            <Reveal key={r.slug} index={i}>
              <article className="bg-brand-surface border border-white/8 rounded-xl px-4 py-4 h-full">
                <p className="text-brand-muted text-xs uppercase tracking-wider">{CAT_EMOJI[r.category] ?? '🧂'} {r.category}</p>
                <h3 className="text-brand-text font-semibold text-sm mt-1">{r.name}</h3>
                <dl className="mt-3 flex flex-col gap-1.5">
                  {r.ingredients.map((ing) => (
                    <div key={ing.item} className="flex items-baseline justify-between gap-3 text-sm">
                      <dt className="text-brand-text/90">{ing.item}</dt>
                      <dd className="text-brand-secondary font-semibold whitespace-nowrap tabular-nums">{formatParts(ing.parts)}</dd>
                    </div>
                  ))}
                </dl>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      <p className="text-brand-muted text-xs text-center mt-12">
        BBQ Calculator earns a commission from qualifying Amazon purchases via links on this page.
      </p>
    </div>
  );
}
