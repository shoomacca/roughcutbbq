import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'BBQ Calculator — Plan Your Cook',
  description:
    'Select your cut, cooking method, and weight to get cook time, temperatures, and a step-by-step timeline.',
};

export default function CalculatorLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
