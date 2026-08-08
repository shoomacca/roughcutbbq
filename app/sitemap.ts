import { MetadataRoute } from 'next';
import { allCookPages } from '@/lib/seo';
import { RECIPES } from '@/data/recipes';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://roughcut.com.au').replace(/\/$/, '');
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: base, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/calculator`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${base}/cook`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${base}/gallery`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${base}/gear`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/rubs`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/recipes`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/techniques`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/wood-chart`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/guides`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/guides/how-to-smoke-a-brisket`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/guides/pork-shoulder-the-stall-explained`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/guides/how-long-to-smoke-ribs`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/guides/spatchcock-chicken-on-the-smoker`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/guides/how-to-use-a-meat-thermometer`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
  ];

  const cookPages: MetadataRoute.Sitemap = allCookPages().map(({ method, cut }) => ({
    url: `${base}/cook/${method}/${cut}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.8,
  }));

  const recipePages: MetadataRoute.Sitemap = RECIPES.map((r) => ({
    url: `${base}/recipes/${r.slug}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  return [...staticPages, ...cookPages, ...recipePages];
}
