'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import meatsData from '@/data/meats.json';
import { RECIPES, type Recipe } from '@/data/recipes';
import { GEAR } from '@/data/gear';
import Reveal from '@/components/Reveal';
import { RUBS } from '@/data/rubs';

type MethodId =
  | 'smoker'
  | 'oven'
  | 'rotisserie'
  | 'dehydrator'
  | 'kamado'
  | 'charcoal_kettle'
  | 'wood_fire'
  | 'slow_cooker'
  | 'pressure_cooker';

interface CutData {
  id: string;
  name: string;
  methods: string[];
  timeMode: Record<string, 'per_kg' | 'flat'>;
  hoursPerKg?: Record<string, number>;
  flatCookHours?: Record<string, number>;
  applianceTempC?: Record<string, number>;
  internalTempC?: Record<string, number | null>;
  restMinutes?: number;
  rubs?: string[];
  woods?: string[];
  tips?: string[];
}

interface CategoryData {
  id: string;
  name: string;
  cuts: CutData[];
}

const CATEGORIES = meatsData as unknown as CategoryData[];

const METHOD_META: Record<MethodId, { label: string; emoji: string; recipeKeywords: string[] }> = {
  smoker: { label: 'Smoker', emoji: '💨', recipeKeywords: ['smoker', 'smoke'] },
  kamado: { label: 'Kamado', emoji: '🥚', recipeKeywords: ['kamado', 'smoker', 'smoke'] },
  charcoal_kettle: { label: 'Charcoal Kettle', emoji: '⚫', recipeKeywords: ['kettle', 'charcoal', 'grill', 'smoker'] },
  wood_fire: { label: 'Wood Fire', emoji: '🪵', recipeKeywords: ['wood', 'fire', 'coals'] },
  oven: { label: 'Oven', emoji: '🔥', recipeKeywords: ['oven', 'roast'] },
  rotisserie: { label: 'Rotisserie', emoji: '🍗', recipeKeywords: ['rotisserie', 'spit'] },
  slow_cooker: { label: 'Slow Cooker', emoji: '🍲', recipeKeywords: ['slow cooker', 'braise'] },
  pressure_cooker: { label: 'Pressure Cooker', emoji: '⚡', recipeKeywords: ['pressure'] },
  dehydrator: { label: 'Dehydrator', emoji: '🌵', recipeKeywords: ['dehydrator', 'jerky', 'dried'] },
};

const CATEGORY_EMOJI: Record<string, string> = {
  pork: '🐷',
  beef: '🐄',
  chicken: '🐔',
  lamb: '🐑',
  fish: '🐟',
  veggies: '🥦',
  jerky: '🥩',
  game: '🦌',
};

// Which recipe categories map to which meats.json category ids
const RECIPE_CATEGORY_MAP: Record<string, string[]> = {
  pork: ['Pork'],
  beef: ['Beef'],
  chicken: ['Chicken'],
  lamb: ['Lamb'],
  fish: ['Fish'],
  jerky: ['Jerky'],
  veggies: [],
  game: [],
};

// Rub shop categories per meat category
const RUB_CATEGORY_MAP: Record<string, string[]> = {
  pork: ['Pork & Ribs'],
  beef: ['Beef & Brisket'],
  chicken: ['Poultry & Chicken'],
  lamb: ['Lamb & Game'],
  fish: ['Fish & Seafood'],
  jerky: ['Beef & Brisket'],
  veggies: ['Pork & Ribs'],
  game: ['Lamb & Game'],
};

// Gear shop categories per cooking method
const GEAR_CATEGORY_MAP: Record<MethodId, string[]> = {
  smoker: ['Thermometers', 'Charcoal & Wood', 'Cookware & Storage'],
  kamado: ['Thermometers', 'Charcoal & Wood'],
  charcoal_kettle: ['Thermometers', 'Charcoal & Wood', 'Tools & Accessories'],
  wood_fire: ['Thermometers', 'Charcoal & Wood', 'Safety & Protection'],
  oven: ['Thermometers', 'Cookware & Storage'],
  rotisserie: ['Thermometers', 'Safety & Protection'],
  slow_cooker: ['Thermometers', 'Cookware & Storage'],
  pressure_cooker: ['Thermometers', 'Cookware & Storage'],
  dehydrator: ['Dehydrators', 'Cookware & Storage'],
};

function timeLabel(cut: CutData, method: string): string {
  const mode = cut.timeMode?.[method];
  if (mode === 'flat') {
    const h = cut.flatCookHours?.[method];
    if (!h) return '';
    return h < 1 ? `~${Math.round(h * 60)} min` : `~${h} h`;
  }
  const perKg = cut.hoursPerKg?.[method];
  if (!perKg) return '';
  return `~${perKg} h/kg`;
}

function matchRecipes(categoryId: string, method: MethodId): Recipe[] {
  const recipeCats = RECIPE_CATEGORY_MAP[categoryId] ?? [];
  if (!recipeCats.length) return [];
  const keywords = METHOD_META[method].recipeKeywords;
  return RECIPES.filter(
    (r) =>
      recipeCats.includes(r.category) &&
      keywords.some((k) => r.method.toLowerCase().includes(k))
  ).slice(0, 3);
}

export default function IdeasClient() {
  const router = useRouter();
  const [method, setMethod] = useState<MethodId | null>(null);
  const [selectedCats, setSelectedCats] = useState<Set<string>>(new Set());

  const toggleCat = (id: string) => {
    setSelectedCats((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const results = useMemo(() => {
    if (!method) return [];
    const cats = CATEGORIES.filter(
      (c) => selectedCats.size === 0 || selectedCats.has(c.id)
    );
    return cats
      .map((cat) => ({
        category: cat,
        cuts: cat.cuts.filter((cut) => cut.methods.includes(method)),
        recipes: matchRecipes(cat.id, method),
        rubs: RUBS.filter((r) => (RUB_CATEGORY_MAP[cat.id] ?? []).includes(r.category)).slice(0, 2),
      }))
      .filter((r) => r.cuts.length > 0);
  }, [method, selectedCats]);

  const gearPicks = useMemo(() => {
    if (!method) return [];
    const cats = GEAR_CATEGORY_MAP[method];
    const picks: typeof GEAR = [];
    for (const c of cats) {
      const item = GEAR.find((g) => g.category === c && !picks.includes(g));
      if (item) picks.push(item);
    }
    return picks.slice(0, 3);
  }, [method]);

  const planCook = (categoryId: string) => {
    try {
      sessionStorage.setItem('bbq_initial_cat', categoryId);
    } catch {}
    router.push('/calculator');
  };

  return (
    <div className="max-w-5xl mx-auto w-full px-4 md:px-8 py-8">
      <h1 className="text-3xl md:text-4xl font-black mb-2">
        What can I cook with what I&rsquo;ve got?
      </h1>
      <p className="text-brand-muted mb-8">
        Pick your cooker and what&rsquo;s in the fridge — get matched cuts with times, temps,
        woods, rubs and recipes. No account, no ads.
      </p>

      {/* Step 1 — equipment */}
      <h2 className="text-sm font-bold uppercase tracking-wider text-brand-muted mb-3">
        1 · My cooker
      </h2>
      <div className="flex flex-wrap gap-2 mb-8">
        {(Object.keys(METHOD_META) as MethodId[]).map((m) => (
          <button
            key={m}
            onClick={() => setMethod(m === method ? null : m)}
            className={`px-4 py-2.5 rounded-2xl text-sm font-bold border transition-ui cursor-pointer ${
              method === m
                ? 'bg-brand-secondary text-white border-brand-secondary'
                : 'bg-brand-surface text-brand-text border-brand-muted/30 hover:border-brand-secondary/60'
            }`}
          >
            {METHOD_META[m].emoji} {METHOD_META[m].label}
          </button>
        ))}
      </div>

      {/* Step 2 — ingredients */}
      <h2 className="text-sm font-bold uppercase tracking-wider text-brand-muted mb-3">
        2 · In my fridge <span className="normal-case font-normal">(optional — leave empty for everything)</span>
      </h2>
      <div className="flex flex-wrap gap-2 mb-10">
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            onClick={() => toggleCat(c.id)}
            className={`px-4 py-2.5 rounded-2xl text-sm font-bold border transition-ui cursor-pointer ${
              selectedCats.has(c.id)
                ? 'bg-brand-primary text-white border-brand-primary'
                : 'bg-brand-surface text-brand-text border-brand-muted/30 hover:border-brand-primary/60'
            }`}
          >
            {CATEGORY_EMOJI[c.id] ?? '🍽️'} {c.name}
          </button>
        ))}
      </div>

      {/* Results */}
      {!method && (
        <div className="text-center text-brand-muted py-16 border border-dashed border-brand-muted/30 rounded-2xl">
          👆 Pick your cooker to see what you can make tonight (or this weekend).
        </div>
      )}

      {method && results.length === 0 && (
        <div className="text-center text-brand-muted py-16 border border-dashed border-brand-muted/30 rounded-2xl">
          Nothing matches that combo — try another cooker or add more categories.
        </div>
      )}

      {method &&
        results.map(({ category, cuts, recipes, rubs }, i) => (
          <Reveal key={`${method}-${category.id}`} index={i} as="section" className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-black">
                {CATEGORY_EMOJI[category.id] ?? ''} {category.name}
                <span className="text-brand-muted font-normal text-sm ml-2">
                  {cuts.length} cut{cuts.length === 1 ? '' : 's'} for your {METHOD_META[method].label.toLowerCase()}
                </span>
              </h3>
              <button
                onClick={() => planCook(category.id)}
                className="bg-brand-secondary hover:opacity-90 text-white text-xs font-black px-4 py-2 rounded-xl transition-ui cursor-pointer shrink-0"
              >
                Plan this cook →
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              {cuts.map((cut) => (
                <div
                  key={cut.id}
                  className="bg-brand-surface border border-brand-muted/20 rounded-2xl p-4"
                >
                  <div className="font-bold mb-1">{cut.name}</div>
                  <div className="text-xs text-brand-muted flex flex-wrap gap-x-4 gap-y-1">
                    {timeLabel(cut, method) && <span>⏱ {timeLabel(cut, method)}</span>}
                    {cut.applianceTempC?.[method] != null && (
                      <span>🌡 {cut.applianceTempC[method]}°C pit</span>
                    )}
                    {cut.internalTempC?.[method] != null && (
                      <span>🎯 {cut.internalTempC[method]}°C internal</span>
                    )}
                    {cut.woods && cut.woods.length > 0 && (
                      <span>🪵 {cut.woods.slice(0, 2).join(', ')}</span>
                    )}
                  </div>
                  {cut.tips && cut.tips[0] && (
                    <div className="text-xs text-brand-muted/80 mt-2 italic">💡 {cut.tips[0]}</div>
                  )}
                </div>
              ))}
            </div>

            {recipes.length > 0 && (
              <div className="text-sm text-brand-muted mb-2">
                <span className="font-bold text-brand-text">Recipe ideas: </span>
                {recipes.map((r, i) => (
                  <span key={r.slug}>
                    {i > 0 && ' · '}
                    <Link href="/recipes" className="underline hover:text-brand-secondary">
                      {r.name}
                    </Link>
                  </span>
                ))}
              </div>
            )}

            {rubs.length > 0 && (
              <div className="text-sm text-brand-muted">
                <span className="font-bold text-brand-text">Rubs that work: </span>
                {rubs.map((r, i) => (
                  <span key={r.slug}>
                    {i > 0 && ' · '}
                    <a
                      href={`/go/${r.slug}`}
                      target="_blank"
                      rel="noopener noreferrer sponsored"
                      className="underline hover:text-brand-secondary"
                    >
                      {r.name} ↗
                    </a>
                  </span>
                ))}
              </div>
            )}
          </Reveal>
        ))}

      {/* Gear for this method */}
      {method && gearPicks.length > 0 && (
        <section className="mt-4 border-t border-brand-muted/20 pt-6">
          <h3 className="text-sm font-bold uppercase tracking-wider text-brand-muted mb-3">
            Handy for your {METHOD_META[method].label.toLowerCase()}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {gearPicks.map((g) => (
              <a
                key={g.slug}
                href={`/go/${g.slug}`}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="bg-brand-surface border border-brand-muted/20 rounded-2xl p-4 hover:border-brand-secondary/60 hover:shadow-lg transition-ui lift"
              >
                <div className="font-bold text-sm mb-1">{g.name} ↗</div>
                <div className="text-xs text-brand-muted">{g.description}</div>
              </a>
            ))}
          </div>
          <p className="text-[11px] text-brand-muted mt-3">
            As an Amazon Associate, RoughCut BBQ earns from qualifying purchases. It never costs
            you extra — it&rsquo;s how we keep this site free and ad-free.
          </p>
        </section>
      )}
    </div>
  );
}
