import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { calculateCook, formatCookTime } from '@/lib/calculator';
import { cookPlanJsonLd, faqJsonLd, breadcrumbJsonLd } from '@/lib/jsonld';
import {
  METHOD_INFO,
  SITE_URL,
  allCookPages,
  cutFromSlug,
  cutToSlug,
  findCut,
  methodFromSlug,
} from '@/lib/seo';
import { GEAR } from '@/data/gear';
import { RECIPES } from '@/data/recipes';
import type { CookingMethod } from '@/types/calculator';

export const dynamicParams = false;

export function generateStaticParams() {
  return allCookPages();
}

const WEIGHTS_KG = [1, 1.5, 2, 2.5, 3, 4];
const REFERENCE_KG = 2;

interface PageProps {
  params: Promise<{ method: string; cut: string }>;
}

function loadPage(methodSlug: string, cutSlug: string) {
  const method = methodFromSlug(methodSlug);
  if (!method) return null;
  const entry = findCut(cutFromSlug(cutSlug));
  if (!entry || !entry.cut.methods.includes(method)) return null;
  const result = calculateCook({
    method,
    categoryId: entry.category.id,
    cutId: entry.cut.id,
    weightKg: REFERENCE_KG,
  });
  return { method, entry, result };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { method: methodSlug, cut: cutSlug } = await params;
  const data = loadPage(methodSlug, cutSlug);
  if (!data) return {};
  const { method, entry, result } = data;
  const info = METHOD_INFO[method];
  const url = `${SITE_URL}/cook/${methodSlug}/${cutSlug}`;

  const timePhrase = result.isFlat
    ? `about ${formatCookTime(result.cookTimeHours)}`
    : `${formatCookTime(result.cookTimeHours / REFERENCE_KG)} per kg`;

  return {
    title: `How Long to ${info.verb} ${entry.cut.name} — Times & Temps (°C)`,
    description: `${entry.cut.name} in the ${info.label.toLowerCase()}: ${result.applianceTempC}°C, ${timePhrase}${result.internalTempC ? `, pull at ${result.internalTempC}°C internal` : ''}. Metric cook times, stall and wrap advice, rubs and wood pairings.`,
    alternates: { canonical: url },
    openGraph: {
      title: `How Long to ${info.verb} ${entry.cut.name}`,
      description: `Exact ${info.label.toLowerCase()} times and temps for ${entry.cut.name}, in kg and °C.`,
      url,
      siteName: 'Rough Cut BBQ',
      type: 'article',
    },
  };
}

export default async function CookPage({ params }: PageProps) {
  const { method: methodSlug, cut: cutSlug } = await params;
  const data = loadPage(methodSlug, cutSlug);
  if (!data) notFound();

  const { method, entry, result } = data;
  const { category, cut } = entry;
  const info = METHOD_INFO[method];
  const url = `${SITE_URL}/cook/${methodSlug}/${cutSlug}`;

  // Weight table (only meaningful for per-kg cuts)
  const weightRows = result.isFlat
    ? []
    : WEIGHTS_KG.map((kg) => {
        const r = calculateCook({ method, categoryId: category.id, cutId: cut.id, weightKg: kg });
        return { kg, time: formatCookTime(r.cookTimeHours) };
      });

  // FAQs — also rendered visibly so schema matches page content
  const perKgHours = cut.hoursPerKg[method];
  const faqs: { question: string; answer: string }[] = [
    {
      question: `What temperature should the ${info.label.toLowerCase()} be for ${cut.name.toLowerCase()}?`,
      answer: `Set your ${info.label.toLowerCase()} to ${result.applianceTempC}°C and keep it steady for the whole cook.`,
    },
    {
      question: `How long does ${cut.name.toLowerCase()} take in the ${info.label.toLowerCase()}?`,
      answer: result.isFlat
        ? `Allow about ${formatCookTime(result.cookTimeHours)} regardless of weight. Always confirm doneness with a thermometer rather than the clock.`
        : `Allow roughly ${formatCookTime(perKgHours ?? 0)} per kilogram at ${result.applianceTempC}°C — a ${REFERENCE_KG} kg piece takes about ${formatCookTime(result.cookTimeHours)}. Always confirm with internal temperature, not time.`,
    },
  ];
  if (result.internalTempC) {
    faqs.push({
      question: `What internal temperature is ${cut.name.toLowerCase()} done at?`,
      answer: `Pull it off the heat at ${result.internalTempC}°C internal, then rest for ${cut.restMinutes} minutes.${cut.safeMinTempC ? ` The food-safety minimum is ${cut.safeMinTempC}°C.` : ''}`,
    });
  }
  const wrapTemp = cut.wrapTempC[method];
  if (wrapTemp) {
    faqs.push({
      question: `When should I wrap ${cut.name.toLowerCase()}?`,
      answer: `Wrap in butcher paper or foil when the internal temperature reaches ${wrapTemp}°C — this powers through the stall and keeps moisture in.`,
    });
  }

  // Contextual gear: thermometer + one more item
  const gearPicks = [
    GEAR.find((g) => g.category === 'Thermometers'),
    GEAR.find((g) => g.category !== 'Thermometers'),
  ].filter((g): g is (typeof GEAR)[number] => Boolean(g));

  // Related recipes — loose match on cut or category name
  const cutWords = cut.name.toLowerCase().split(/[\s(/]+/).filter((w) => w.length > 3);
  const relatedRecipes = RECIPES.filter((r) => {
    const hay = `${r.cut} ${r.name} ${r.category}`.toLowerCase();
    return cutWords.some((w) => hay.includes(w));
  }).slice(0, 4);

  // Other methods for this cut (internal linking)
  const otherMethods = cut.methods.filter((m) => m !== method) as CookingMethod[];

  const resultsHref = `/results?method=${method}&cat=${category.id}&cut=${cut.id}&kg=${REFERENCE_KG}`;

  const jsonLd = [
    cookPlanJsonLd(cut.name, info.label, Math.round(result.cookTimeHours * 60), result.applianceTempC, result.internalTempC),
    faqJsonLd(faqs),
    breadcrumbJsonLd([
      { name: 'Cooking Times', url: `${SITE_URL}/cook` },
      { name: category.name, url: `${SITE_URL}/cook` },
      { name: `${info.label}: ${cut.name}`, url },
    ]),
  ];

  return (
    <div className="page-shell">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Breadcrumb */}
      <nav className="text-xs text-brand-muted mb-4">
        <Link href="/cook" className="hover:text-brand-text">Cooking Times</Link>
        <span className="mx-1.5">/</span>
        <span>{category.name}</span>
        <span className="mx-1.5">/</span>
        <span className="text-brand-text">{cut.name}</span>
      </nav>

      <h1 className="page-title">
        How Long to {info.verb} {cut.name}
      </h1>
      <p className="text-brand-muted mt-3 leading-relaxed">
        Metric times and temperatures for {cut.name.toLowerCase()} in the {info.label.toLowerCase()} — kilograms and Celsius,
        no conversions needed. Numbers below come from the same engine as our{' '}
        <Link href="/calculator" className="text-brand-secondary hover:underline">cook calculator</Link>.
      </p>

      {/* Quick answer */}
      <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <QuickStat label={`${info.label} temp`} value={`${result.applianceTempC}°C`} />
        <QuickStat
          label={result.isFlat ? 'Cook time' : 'Time per kg'}
          value={result.isFlat ? formatCookTime(result.cookTimeHours) : formatCookTime(perKgHours ?? 0)}
        />
        {result.internalTempC ? <QuickStat label="Pull at" value={`${result.internalTempC}°C`} /> : null}
        <QuickStat label="Rest" value={`${cut.restMinutes} min`} />
      </div>

      {/* Weight table */}
      {weightRows.length > 0 && (
        <section className="mt-8">
          <h2 className="text-brand-text text-xl font-bold">Cook times by weight</h2>
          <p className="text-brand-muted text-sm mt-1">
            At {result.applianceTempC}°C. Treat these as planning estimates — always cook to internal temperature.
          </p>
          <table className="w-full mt-3 text-sm">
            <thead>
              <tr className="border-b border-white/10 text-brand-muted text-xs uppercase tracking-wide">
                <th className="text-left py-2">Weight</th>
                <th className="text-left py-2">Estimated time</th>
              </tr>
            </thead>
            <tbody>
              {weightRows.map((row) => (
                <tr key={row.kg} className="border-b border-white/5">
                  <td className="py-2 text-brand-text font-medium">{row.kg} kg</td>
                  <td className="py-2 text-brand-muted">{row.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* Milestones */}
      {result.milestones.length > 0 && (
        <section className="mt-8">
          <h2 className="text-brand-text text-xl font-bold">Key moments in the cook</h2>
          <div className="mt-3 flex flex-col gap-3">
            {result.milestones.map((m) => (
              <div key={m.label} className="bg-brand-surface border border-white/8 rounded-xl p-4">
                <p className="text-brand-text font-semibold text-sm">{m.icon} {m.label}</p>
                <p className="text-brand-muted text-sm mt-1 leading-relaxed">{m.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Rubs / woods / tips from cut data */}
      {(cut.rubs?.length || cut.woods?.length || cut.tips?.length) ? (
        <section className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {cut.rubs?.length ? <ListCard title="Rub ideas" items={cut.rubs} /> : null}
          {cut.woods?.length ? <ListCard title="Wood pairings" items={cut.woods} /> : null}
          {cut.tips?.length ? <ListCard title="Pit tips" items={cut.tips} /> : null}
        </section>
      ) : null}

      {/* FAQs (rendered so FAQ schema matches visible content) */}
      <section className="mt-8">
        <h2 className="text-brand-text text-xl font-bold">FAQs</h2>
        <div className="mt-3 flex flex-col gap-4">
          {faqs.map((f) => (
            <div key={f.question}>
              <h3 className="text-brand-text font-semibold text-sm">{f.question}</h3>
              <p className="text-brand-muted text-sm mt-1 leading-relaxed">{f.answer}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mt-8 bg-brand-surface border border-white/8 rounded-xl p-5">
        <h2 className="text-brand-text text-lg font-bold">Get your exact cook plan</h2>
        <p className="text-brand-muted text-sm mt-1">
          Enter your actual weight and get a full timeline — stall, wrap, pull, and rest — down to the minute.
        </p>
        <div className="flex flex-wrap gap-3 mt-4">
          <Link
            href={resultsHref}
            className="px-4 py-2.5 rounded-xl font-bold text-sm text-white"
            style={{ background: '#f97316' }}
          >
            Plan a {REFERENCE_KG} kg cook →
          </Link>
          <Link
            href="/calculator"
            className="px-4 py-2.5 rounded-xl font-bold text-sm text-brand-text border border-white/15 hover:border-white/30 transition-ui"
          >
            Open the calculator
          </Link>
        </div>
      </section>

      {/* Gear */}
      {gearPicks.length > 0 && (
        <section className="mt-8">
          <h2 className="text-brand-text text-xl font-bold">Gear that helps</h2>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {gearPicks.map((g) => (
              <a
                key={g.slug}
                href={`/go/${g.slug}`}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="bg-brand-surface border border-white/8 rounded-xl p-4 hover:border-white/20 transition-ui"
              >
                <p className="text-brand-text font-semibold text-sm">{g.name}</p>
                <p className="text-brand-muted text-xs mt-1 leading-relaxed">{g.description}</p>
              </a>
            ))}
          </div>
          <p className="text-brand-muted text-xs mt-2">
            As an Amazon Associate, Rough Cut BBQ earns from qualifying purchases.
          </p>
        </section>
      )}

      {/* Related recipes */}
      {relatedRecipes.length > 0 && (
        <section className="mt-8">
          <h2 className="text-brand-text text-xl font-bold">Recipes for {cut.name.toLowerCase()}</h2>
          <ul className="mt-3 flex flex-col gap-2">
            {relatedRecipes.map((r) => (
              <li key={r.slug}>
                <Link href={`/recipes/${r.slug}`} className="text-brand-secondary text-sm hover:underline">
                  {r.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Other methods */}
      {otherMethods.length > 0 && (
        <section className="mt-8">
          <h2 className="text-brand-text text-xl font-bold">Other ways to cook {cut.name.toLowerCase()}</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {otherMethods.map((m) => (
              <Link
                key={m}
                href={`/cook/${METHOD_INFO[m].slug}/${cutToSlug(cut.id)}`}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-brand-text border border-white/15 hover:border-white/30 transition-ui"
              >
                {METHOD_INFO[m].label}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function QuickStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-brand-surface border border-white/8 rounded-xl p-4">
      <p className="text-brand-muted text-[10px] uppercase tracking-wider font-semibold">{label}</p>
      <p className="text-brand-text text-lg font-bold mt-0.5">{value}</p>
    </div>
  );
}

function ListCard({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="bg-brand-surface border border-white/8 rounded-xl p-4">
      <p className="text-brand-muted text-[10px] uppercase tracking-wider font-semibold mb-2">{title}</p>
      <ul className="flex flex-col gap-1.5">
        {items.map((item) => (
          <li key={item} className="text-brand-text text-sm leading-snug">{item}</li>
        ))}
      </ul>
    </div>
  );
}
