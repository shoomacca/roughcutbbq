"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Footer() {
  const pathname = usePathname();

  // Calculator flow pages are full-viewport — no footer on any of them
  if (pathname === '/' || pathname.startsWith('/calculator') || pathname.startsWith('/results')) return null;

  const year = new Date().getFullYear();

  return (
    <footer className="bg-brand-surface border-t border-brand-muted/20 py-6">
      <div className="max-w-6xl mx-auto px-4 flex flex-col gap-3 text-sm text-brand-muted">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© {year} RoughCut BBQ — metric-first, kg &amp; °C only</p>
          <nav className="flex flex-wrap justify-center gap-4">
            <Link href="/" className="hover:text-brand-text transition-ui">
              Home
            </Link>
            <Link href="/cook" className="hover:text-brand-text transition-ui">
              Cooking Times
            </Link>
            <Link href="/guides" className="hover:text-brand-text transition-ui">
              Guides
            </Link>
            <Link href="/gear" className="hover:text-brand-text transition-ui">
              Gear
            </Link>
            <Link href="/gallery" className="hover:text-brand-text transition-ui">
              Gallery
            </Link>
          </nav>
        </div>
        <p className="text-xs text-brand-muted/70 text-center sm:text-left">
          As an Amazon Associate, RoughCut BBQ earns from qualifying purchases.
        </p>
      </div>
    </footer>
  );
}
