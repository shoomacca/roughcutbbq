import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { RECIPES } from '@/data/recipes';
import { recipeJsonLd, breadcrumbJsonLd } from '@/lib/jsonld';
import { SITE_URL } from '@/lib/seo';

export const dynamicParams = false;

export function generateStaticParams() {
  return RECIPES.map((r) => ({ slug: r.slug }));
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const recipe = RECIPES.find((r) => r.slug === slug);
  if (!recipe) return {};
  const url = `${SITE_URL}/recipes/${slug}`;
  return {
    title: `${recipe.name} — Recipe & Cook Plan`,
    description: `${recipe.name}: ${recipe.method}, target ${recipe.targetInternal} internal, ${recipe.time}. ${recipe.notes}`.slice(0, 155),
    alternates: { canonical: url },
    openGraph: {
      title: recipe.name,
      description: recipe.notes,
      url,
      siteName: 'Rough Cut BBQ',
      type: 'article',
    },
  };
}

export default async function RecipePage({ params }: PageProps) {
  const { slug } = await params;
  const recipe = RECIPES.find((r) => r.slug === slug);
  if (!recipe) notFound();

  const url = `${SITE_URL}/recipes/${slug}`;
  const related = RECIPES.filter((r) => r.category === recipe.category && r.slug !== recipe.slug).slice(0, 5);

  const jsonLd = [
    recipeJsonLd({
      name: recipe.name,
      description: recipe.notes,
      category: recipe.category,
      method: recipe.method,
      cut: recipe.cut,
      url,
    }),
    breadcrumbJsonLd([
      { name: 'Recipes', url: `${SITE_URL}/recipes` },
      { name: recipe.name, url },
    ]),
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <nav className="text-xs text-brand-muted mb-4">
        <Link href="/recipes" className="hover:text-brand-text">Recipes</Link>
        <span className="mx-1.5">/</span>
        <span className="text-brand-text">{recipe.name}</span>
      </nav>

      <h1 className="text-brand-text text-3xl font-bold leading-tight">{recipe.name}</h1>
      <p className="text-brand-muted mt-2 text-sm">{recipe.category} · {recipe.cut}</p>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Detail label="Method" value={recipe.method} />
        <Detail label="Style / Rub" value={recipe.style} />
        <Detail label="Target internal" value={recipe.targetInternal} />
        <Detail label="Time" value={recipe.time} />
        {recipe.wood !== 'N/A' && <Detail label="Wood" value={recipe.wood} />}
      </div>

      <section className="mt-6 bg-brand-surface border border-white/8 rounded-xl p-5">
        <h2 className="text-brand-text text-lg font-bold">Pit notes</h2>
        <p className="text-brand-muted text-sm mt-2 leading-relaxed">{recipe.notes}</p>
      </section>

      <section className="mt-6 bg-brand-surface border border-white/8 rounded-xl p-5">
        <h2 className="text-brand-text text-lg font-bold">Plan this cook to the minute</h2>
        <p className="text-brand-muted text-sm mt-1">
          Enter your weight in the calculator for a full timeline — temps, stall, wrap, and rest.
        </p>
        <Link
          href="/calculator"
          className="inline-block mt-4 px-4 py-2.5 rounded-xl font-bold text-sm text-white"
          style={{ background: '#f97316' }}
        >
          Open the calculator →
        </Link>
      </section>

      {related.length > 0 && (
        <section className="mt-8">
          <h2 className="text-brand-text text-xl font-bold">More {recipe.category.toLowerCase()} recipes</h2>
          <ul className="mt-3 flex flex-col gap-2">
            {related.map((r) => (
              <li key={r.slug}>
                <Link href={`/recipes/${r.slug}`} className="text-brand-secondary text-sm hover:underline">
                  {r.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-brand-surface border border-white/8 rounded-xl p-4">
      <p className="text-brand-muted text-[10px] uppercase tracking-wider font-semibold">{label}</p>
      <p className="text-brand-text text-sm mt-1 leading-relaxed">{value}</p>
    </div>
  );
}
