'use client';

import { useEffect, useState, useMemo } from 'react';
import { RUBS, RUB_CATEGORIES, type RubItem } from '@/data/rubs';

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
      <div className="w-20 h-20 rounded-xl bg-brand-dark flex-shrink-0 animate-pulse" />
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
      className="group flex items-center gap-4 bg-brand-surface border border-white/8 rounded-xl px-4 py-4 hover:border-white/20 hover:bg-brand-surface/80 transition-all"
    >
      <ProductImage url={item.affiliateUrl} fallback={CAT_EMOJI[item.category] ?? '🧂'} />

      <div className="flex-1 min-w-0">
        <p className="text-brand-text font-semibold text-sm leading-snug group-hover:text-brand-secondary transition-colors">
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
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-brand-text text-2xl font-bold">BBQ Rubs & Seasonings</h1>
        <p className="text-brand-muted text-sm mt-1">
          Rubs sorted by meat — every link supports BBQ Calculator
        </p>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 flex-wrap mb-6">
        {tabs.map(({ id, emoji }) => (
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

      {/* All — grouped */}
      {grouped && (
        <div className="flex flex-col gap-10">
          {tabs.slice(1).filter(({ id }) => grouped[id]?.length).map(({ id, emoji }) => (
            <section key={id}>
              <h2 className="text-brand-text font-bold text-base mb-3">{emoji} {id}</h2>
              <div className="flex flex-col gap-3">
                {grouped[id].map((item) => <RubRow key={item.slug} item={item} />)}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* Single category */}
      {!grouped && (
        <div className="flex flex-col gap-3">
          {filtered.map((item) => <RubRow key={item.slug} item={item} />)}
        </div>
      )}

      <p className="text-brand-muted/40 text-xs text-center mt-12">
        BBQ Calculator earns a commission from qualifying Amazon purchases via links on this page.
      </p>
    </div>
  );
}
