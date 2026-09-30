import meatsData from '@/data/meats.json';
import type { CookingMethod, Cut, MeatCategory } from '@/types/calculator';

const meats = meatsData as MeatCategory[];

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://app.roughcut.com.au').replace(/\/$/, '');

// ── Method display data ──────────────────────────────────────────────────────
export interface MethodInfo {
  /** URL segment, e.g. "charcoal-kettle" */
  slug: string;
  /** Display label, e.g. "Charcoal Kettle" */
  label: string;
  /** Verb for titles, e.g. "Smoke" → "How Long to Smoke Brisket" */
  verb: string;
  /** Gerund for copy, e.g. "smoking" */
  gerund: string;
}

export const METHOD_INFO: Record<CookingMethod, MethodInfo> = {
  smoker: { slug: 'smoker', label: 'Smoker', verb: 'Smoke', gerund: 'smoking' },
  oven: { slug: 'oven', label: 'Oven', verb: 'Slow-Roast', gerund: 'slow-roasting' },
  kamado: { slug: 'kamado', label: 'Kamado', verb: 'Kamado-Smoke', gerund: 'kamado smoking' },
  charcoal_kettle: { slug: 'charcoal-kettle', label: 'Charcoal Kettle', verb: 'BBQ', gerund: 'barbecuing' },
  slow_cooker: { slug: 'slow-cooker', label: 'Slow Cooker', verb: 'Slow-Cook', gerund: 'slow cooking' },
  pressure_cooker: { slug: 'pressure-cooker', label: 'Pressure Cooker', verb: 'Pressure-Cook', gerund: 'pressure cooking' },
  wood_fire: { slug: 'wood-fire', label: 'Wood Fire', verb: 'Wood-Fire', gerund: 'wood-fire cooking' },
  rotisserie: { slug: 'rotisserie', label: 'Rotisserie', verb: 'Rotisserie', gerund: 'rotisserie cooking' },
  dehydrator: { slug: 'dehydrator', label: 'Dehydrator', verb: 'Dehydrate', gerund: 'dehydrating' },
};

const METHOD_BY_SLUG: Record<string, CookingMethod> = Object.fromEntries(
  (Object.keys(METHOD_INFO) as CookingMethod[]).map((m) => [METHOD_INFO[m].slug, m])
);

export function methodFromSlug(slug: string): CookingMethod | null {
  return METHOD_BY_SLUG[slug] ?? null;
}

// ── Cut slugs ────────────────────────────────────────────────────────────────
export function cutToSlug(cutId: string): string {
  return cutId.replace(/_/g, '-');
}

export function cutFromSlug(slug: string): string {
  return slug.replace(/-/g, '_');
}

// ── Lookups ──────────────────────────────────────────────────────────────────
export interface CutEntry {
  category: MeatCategory;
  cut: Cut;
}

export function findCut(cutId: string): CutEntry | null {
  for (const category of meats) {
    const cut = category.cuts.find((c) => c.id === cutId);
    if (cut) return { category, cut };
  }
  return null;
}

/** Every valid cut × method combination, for generateStaticParams. */
export function allCookPages(): { method: string; cut: string }[] {
  const pages: { method: string; cut: string }[] = [];
  for (const category of meats) {
    for (const cut of category.cuts) {
      for (const m of cut.methods) {
        const info = METHOD_INFO[m as CookingMethod];
        if (info) pages.push({ method: info.slug, cut: cutToSlug(cut.id) });
      }
    }
  }
  return pages;
}

export function allCategories(): MeatCategory[] {
  return meats;
}
