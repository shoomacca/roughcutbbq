import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'BBQ Gear Recommendations — Rough Cut BBQ',
  description:
    'Thermometers, smokers, charcoal, rubs, and accessories recommended by Rough Cut BBQ for better results.',
};

export default function GearLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
