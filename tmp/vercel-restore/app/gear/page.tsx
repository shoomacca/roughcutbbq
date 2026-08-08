'use client';

import { useEffect, useState, useMemo } from 'react';
import { GEAR, GEAR_CATEGORIES, type GearItem } from '@/data/gear';

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
      <div className="w-20 h-20 rounded-xl bg-brand-dark flex items-center justify-center flex-shrink-0 animate-pulse" />
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
      href={item.affiliateUrl}
      target="_blank"
      rel="noopener noreferrer nofollow"
      className="group flex items-center gap-4 bg-brand-surface border border-white/8 rounded-xl px-4 py-4 hover:border-white/20 hover:bg-brand-surface/80 transition-all"
    >
      <ProductImage url={item.affiliateUrl} fallback={CAT_EMOJI[item.category] ?? '🛒'} />

      <div className="flex-1 min-w-0">
        <p className="text-brand-text font-semibold text-sm leading-snug group-hover:text-brand-secondary transition-colors">
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

  const filtered = useMemo(
    () => activeCategory === 'All' ? GEAR : GEAR.filter((g) => g.category === activeCategory),
    [activeCategory]
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
          Kit we actually recommend — every link supports Rough Cut BBQ
        </p>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 flex-wrap mb-6">
        {GEAR_CATEGORIES.map(({ id, emoji }) => (
          <button
            key={id}
            onClick={() => setActiveCategory(id)}
            className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
            style={{
              background: activeCategory === id ? '#f97316' : 'rgba(255,255,255,0.07)',
              color: activeCategory === id ? 'white' : undefined,
              border: activeCategory === id ? 'none' : '1px solid rgba(255,255,255,0.12)',
            }}
          >
            {emoji ? `${emoji} ` : ''}{id}
          </button>
        ))}
      </div>

      {/* All — grouped with section headers */}
      {grouped && (
        <div className="flex flex-col gap-10">
          {GEAR_CATEGORIES.slice(1).filter(({ id }) => grouped[id]?.length).map(({ id, emoji }) => (
            <section key={id}>
              <h2 className="text-brand-text font-bold text-base mb-3">{emoji} {id}</h2>
              <div className="flex flex-col gap-3">
                {grouped[id].map((item) => <GearRow key={item.slug} item={item} />)}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* Single category — flat list */}
      {!grouped && (
        <div className="flex flex-col gap-3">
          {filtered.map((item) => <GearRow key={item.slug} item={item} />)}
        </div>
      )}

      <p className="text-brand-muted/40 text-xs text-center mt-12">
        As an Amazon Associate, Rough Cut BBQ earns from qualifying purchases made via links on this page.
      </p>
    </div>
  );
}
