import type { Metadata } from 'next';
import Reveal from '@/components/Reveal';
import Link from 'next/link';
import { METHOD_INFO, SITE_URL, allCategories, cutToSlug } from '@/lib/seo';
import type { CookingMethod } from '@/types/calculator';

export const metadata: Metadata = {
  title: 'BBQ Cooking Times & Temperatures — Every Cut, in kg & °C',
  description:
    'Complete metric cooking-time charts for smoker, oven, kamado, charcoal kettle, slow cooker and more. Pick your cut and method for exact times, temps, stall and wrap advice.',
  alternates: { canonical: `${SITE_URL}/cook` },
};

export default function CookHubPage() {
  const categories = allCategories();

  return (
    <div className="page-shell-wide">
      <h1 className="page-title">BBQ Cooking Times &amp; Temperatures</h1>
      <p className="text-brand-muted mt-3 leading-relaxed max-w-2xl">
        Every cut, every method — in kilograms and Celsius. Pick a combination below for exact times,
        temperatures, stall and wrap advice, or jump straight to the{' '}
        <Link href="/calculator" className="text-brand-secondary hover:underline">calculator</Link> with your exact weight.
      </p>

      {categories.map((category, i) => (
        <Reveal key={category.id} index={i} as="section" className="mt-10">
          <h2 className="text-brand-text text-xl font-bold border-b border-white/10 pb-2">{category.name}</h2>
          <div className="mt-4 flex flex-col gap-4">
            {category.cuts.map((cut) => (
              <div key={cut.id}>
                <h3 className="text-brand-text font-semibold text-sm">{cut.name}</h3>
                <div className="mt-1.5 flex flex-wrap gap-2">
                  {(cut.methods as CookingMethod[]).map((m) =>
                    METHOD_INFO[m] ? (
                      <Link
                        key={m}
                        href={`/cook/${METHOD_INFO[m].slug}/${cutToSlug(cut.id)}`}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-brand-muted border border-white/10 hover:border-white/30 hover:text-brand-text transition-ui"
                      >
                        {METHOD_INFO[m].label}
                      </Link>
                    ) : null
                  )}
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      ))}
    </div>
  );
}
