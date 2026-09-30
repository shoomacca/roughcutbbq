import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cook Gallery — Rough Cut BBQ',
  description:
    'Before and after photos from the Rough Cut BBQ community. Filter by cut and method.',
};

export default function GalleryLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
