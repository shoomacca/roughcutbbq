'use client';

import { useEffect, useState } from 'react';
import { trackEvent } from '@/lib/posthog';

interface GearItem {
  id: number;
  slug: string;
  name: string;
  category: string;
  description: string | null;
  recommended_for: string | null;
  sort_order: number;
}

interface Props {
  method?: string;
  limit?: number;
  title?: string;
}

export default function GearRecommendation({ method, limit = 1, title = 'Recommended Gear' }: Props) {
  const [items, setItems] = useState<GearItem[]>([]);

  useEffect(() => {
    fetch('/api/gear')
      .then((r) => r.json())
      .then(({ gear }: { gear: GearItem[] }) => {
        if (!gear?.length) return;

        let pool = gear;

        // Filter by method match if provided
        if (method) {
          const methodLower = method.toLowerCase();
          const matched = gear.filter((g) => {
            const rf = (g.recommended_for ?? '').toLowerCase();
            return rf.includes(methodLower) || rf.includes('all');
          });
          if (matched.length > 0) pool = matched;
        }

        setItems(pool.slice(0, limit));
      })
      .catch(() => {});
  }, [method, limit]);

  if (items.length === 0) return null;

  return (
    <div className="rounded-xl border border-white/8 bg-brand-surface p-4">
      <p className="text-brand-muted text-xs font-semibold uppercase tracking-wide mb-3">{title}</p>
      <div className="flex flex-col gap-3">
        {items.map((item) => (
          <div key={item.id} className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-brand-text text-sm font-semibold leading-snug">{item.name}</p>
              {item.description && (
                <p className="text-brand-muted text-xs mt-0.5 leading-relaxed line-clamp-1">{item.description}</p>
              )}
            </div>
            <a
              href={`/go/${item.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackEvent('gear_clicked', { slug: item.slug, name: item.name, method })}
              className="flex-none inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-opacity hover:opacity-80 whitespace-nowrap"
              style={{ background: '#f97316' }}
            >
              Shop →
            </a>
          </div>
        ))}
      </div>
      <p className="text-brand-muted/30 text-[10px] mt-3">
        Rough Cut BBQ may earn a commission from qualifying purchases.
      </p>
    </div>
  );
}
