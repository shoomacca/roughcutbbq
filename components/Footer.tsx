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
      <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-brand-muted">
        <p>© {year} Metric BBQ Calculator — kg &amp; °C only</p>
        <nav className="flex gap-4">
          <Link href="/" className="hover:text-brand-text transition-colors">
            Home
          </Link>
        </nav>
      </div>
    </footer>
  );
}
