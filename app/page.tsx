import type { Metadata } from 'next';
import HeroCarousel from '@/components/home/HeroCarousel';
import ProgressBar from '@/components/ProgressBar';

export const metadata: Metadata = {
  title: 'RoughCut BBQ — Free BBQ & Slow Cook Calculator',
  description:
    'Calculate exact cook times, rest periods, and internal temperatures for brisket, ribs, pulled pork, chicken, fish, and more. Free, no ads, no account needed.',
  openGraph: {
    title: 'RoughCut BBQ — Free BBQ & Slow Cook Calculator',
    description:
      'Precise cook times and temperatures for every cut. Brisket, ribs, pork shoulder, chicken, and more.',
    type: 'website',
  },
};

export default function HomePage() {
  return (
    <div className="flex flex-col flex-1">
      <div className="max-w-2xl mx-auto w-full px-4 pt-4 pb-3">
        <ProgressBar current={1} />
      </div>
      <div className="flex-1 flex flex-col justify-center">
        <HeroCarousel />
      </div>
    </div>
  );
}
