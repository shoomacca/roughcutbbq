'use client';

import { useEffect, useState, useMemo } from 'react';
import { useSlidingIndicator } from '@/lib/useSlidingIndicator';
import Reveal from '@/components/Reveal';
import { GEAR, type GearItem } from '@/data/gear';
import { RUB_CATEGORIES } from '@/data/rubs';

const RUB_CAT_IDS = new Set(RUB_CATEGORIES.filter((c) => c.id !== 'All').map((c) => c.id));

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
    // loading
    return (
      <div className="w-20 h-20 rounded-xl skeleton flex items-center justify-center flex-shrink-0" />
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

/* ── Category emoji map ─────────────────────────────────────────────────────── */
const CAT_EMOJI: Record<string, string> = {
  'Thermometers':        '🌡️',
  'Tools & Accessories': '🛠️',
  'Safety & Protection': '🧤',
  'Charcoal & Wood':     '🪵',
  'Rubs & Seasonings':   '🧂',
  'Cookware':            '🍳',
};

function GearRow({ item }: { item: GearItem }) {
  return (
    <a
      href={`/go/${item.slug}`}
      target="_blank"
      rel="noopener noreferrer nofollow"
      className="group flex items-center gap-4 bg-brand-surface border border-white/8 rounded-xl px-4 py-4 hover:border-white/20 hover:bg-brand-surface/80 hover:shadow-lg transition-ui lift"
    >
      <ProductImage url={item.affiliateUrl} fallback={CAT_EMOJI[item.category] ?? '🛒'} />

      <div className="flex-1 min-w-0">
        <p className="text-brand-text font-semibold text-sm leading-snug group-hover:text-brand-secondary transition-ui">
          {item.name}
        </p>
        <p className="text-brand-muted text-xs mt-1 leading-relaxed line-clamp-2">
          {item.description}
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

export default function GearPage() {
  const [activeCategory, setActiveCategory] = useState('All');
  const { containerRef: tabsRef, indicatorRef: pillRef } = useSlidingIndicator(activeCategory);
  const [items, setItems] = useState<GearItem[]>(GEAR);

  // Live catalogue from the database (managed at /admin/gear); static list is the fallback
  useEffect(() => {
    fetch('/api/gear?limit=100')
      .then((r) => r.json())
      .then(({ gear }: { gear: DbGearRow[] }) => {
        const rows = (gear ?? [])
          .filter((g) => !RUB_CAT_IDS.has(g.category))
          .map((g) => ({
            slug: g.slug,
            name: g.name,
            category: g.category,
            description: g.description ?? '',
            affiliateUrl: g.affiliate_url,
          }));
        if (rows.length) setItems(rows);
      })
      .catch(() => {});
  }, []);

  const tabs = useMemo(
    () => [
      { id: 'All', emoji: '' },
      ...Array.from(new Set(items.map((i) => i.category))).map((id) => ({ id, emoji: CAT_EMOJI[id] ?? '🛒' })),
    ],
    [items]
  );

  const filtered = useMemo(
    () => activeCategory === 'All' ? items : items.filter((g) => g.category === activeCategory),
    [activeCategory, items]
  );

  const grouped = useMemo(() => {
    if (activeCategory !== 'All') return null;
    const map: Record<string, GearItem[]> = {};
    for (const item of filtered) {
      if (!map[item.category]) map[item.category] = [];
      map[item.category].push(item);
    }
    return map;
  }, [filtered, activeCategory]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-brand-text text-2xl font-bold">BBQ Gear</h1>
        <p className="text-brand-muted text-sm mt-1">
          Kit we actually recommend — every link supports BBQ Calculator
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

      {/* All — grouped with section headers */}
      {grouped && (
        <div className="flex flex-col gap-10">
          {tabs.slice(1).filter(({ id }) => grouped[id]?.length).map(({ id, emoji }) => (
            <section key={id}>
              <h2 className="text-brand-text font-bold text-base mb-3">{emoji} {id}</h2>
              <div className="flex flex-col gap-3">
                {grouped[id].map((item, i) => <Reveal key={item.slug} index={i}><GearRow item={item} /></Reveal>)}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* Single category — flat list */}
      {!grouped && (
        <div className="flex flex-col gap-3">
          {filtered.map((item, i) => <Reveal key={item.slug} index={i}><GearRow item={item} /></Reveal>)}
        </div>
      )}

      <p className="text-brand-muted/40 text-xs text-center mt-12">
        BBQ Calculator earns a commission from qualifying Amazon purchases via links on this page.
      </p>
    </div>
  );
}
