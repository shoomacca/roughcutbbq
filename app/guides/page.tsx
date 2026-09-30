import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'BBQ Guides — Rough Cut BBQ',
  description: 'Step-by-step guides for smoking brisket, ribs, pork shoulder, chicken, and more.',
};

const GUIDES = [
  {
    slug: 'how-to-smoke-a-brisket',
    title: 'How to Smoke a Brisket',
    description: 'Everything you need to know — trim, rub, the stall, wrapping, target temp, and rest time.',
    readTime: '6 min read',
    emoji: '🥩',
  },
  {
    slug: 'pork-shoulder-the-stall-explained',
    title: 'Pork Shoulder: the Stall Explained',
    description: "What is the stall, why does it happen, and how to push through without ruining your cook.",
    readTime: '5 min read',
    emoji: '🐷',
  },
  {
    slug: 'how-long-to-smoke-ribs',
    title: 'How Long to Smoke Ribs (3-2-1 Method)',
    description: 'Baby back vs spare ribs, the 3-2-1 method, the bend test, and why time is a guide not a rule.',
    readTime: '5 min read',
    emoji: '🍖',
  },
  {
    slug: 'spatchcock-chicken-on-the-smoker',
    title: 'Spatchcock Chicken on the Smoker',
    description: 'Why spatchcock works, how to do it, and how to get crispy skin on the smoker.',
    readTime: '4 min read',
    emoji: '🍗',
  },
  {
    slug: 'how-to-use-a-meat-thermometer',
    title: 'How to Use a Meat Thermometer',
    description: 'Instant-read vs probe, where to insert, when to check, and how to calibrate.',
    readTime: '4 min read',
    emoji: '🌡️',
  },
];

export default function GuidesPage() {
  return (
    <>
      <h1 className="text-3xl font-bold text-brand-text mb-2">BBQ Guides</h1>
      <p className="text-brand-muted mb-8">
        Step-by-step guides to help you cook better BBQ — every time.
      </p>
      <div className="flex flex-col gap-4">
        {GUIDES.map((guide) => (
          <Link
            key={guide.slug}
            href={`/guides/${guide.slug}`}
            className="block rounded-xl border border-white/8 bg-brand-surface px-5 py-4 hover:border-amber-500/30 transition-colors group"
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl mt-0.5">{guide.emoji}</span>
              <div className="min-w-0">
                <h2 className="text-brand-text font-semibold group-hover:text-amber-400 transition-colors leading-snug">
                  {guide.title}
                </h2>
                <p className="text-brand-muted text-sm mt-1 leading-relaxed">{guide.description}</p>
                <p className="text-brand-muted/50 text-xs mt-2">{guide.readTime}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
