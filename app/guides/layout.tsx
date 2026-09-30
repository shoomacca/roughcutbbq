import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'BBQ Guides — Rough Cut BBQ',
  description: 'Step-by-step guides for smoking brisket, ribs, pork shoulder, chicken, and more.',
};

export default function GuidesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      {children}
    </div>
  );
}
