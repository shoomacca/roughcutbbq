import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '');

  return [
    { url: base, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/ideas`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.9 },
    { url: `${base}/calculator`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.9 },
    { url: `${base}/gallery`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${base}/gear`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/guides`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    // Guide articles — added in shard 9.2
    { url: `${base}/guides/how-to-smoke-a-brisket`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/guides/pork-shoulder-the-stall-explained`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/guides/how-long-to-smoke-ribs`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/guides/spatchcock-chicken-on-the-smoker`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/guides/how-to-use-a-meat-thermometer`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
  ];
}
