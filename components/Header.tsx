"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { AnimatePresence, m } from "framer-motion";
import { collapse } from "@/lib/motion";
import { useSlidingIndicator } from "@/lib/useSlidingIndicator";

const NAV = [
  ["/", "Home"], ["/ideas", "Cook Ideas"], ["/cook", "Cook Times"], ["/recipes", "Recipes"],
  ["/gallery", "Gallery"], ["/gear", "Gear"], ["/guides", "Guides"], ["/rubs", "Rubs"],
  ["/wood-chart", "Wood Chart"], ["/saves", "My Saves"],
] as const;

export default function Header() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [checked, setChecked] = useState(false);
  // Desktop nav: one underline glides between links as the route changes.
  const { containerRef: navRef, indicatorRef: underlineRef } = useSlidingIndicator<HTMLElement>(
    NAV.some(([href]) => href === pathname) ? pathname : null,
  );

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setUser(data.user);
        }
        setChecked(true);
      })
      .catch(() => setChecked(true));
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      window.location.reload();
    } catch (e) {
      console.error('Logout error:', e);
    }
  };

  const linkClass = (path: string) => {
    const isExact = pathname === path;
    return isExact 
      ? "text-brand-secondary font-bold transition-ui" 
      : "text-brand-muted hover:text-brand-text transition-ui";
  };


  return (
    <header className="sticky top-0 z-50 bg-brand-surface border-b border-brand-muted/20">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="text-brand-text font-bold text-lg tracking-tight hover:text-brand-secondary transition-ui"
        >
          🔥 RoughCut BBQ
        </Link>

        {/* Desktop nav */}
        <nav ref={navRef} className="relative hidden md:flex items-center gap-6 text-sm font-medium">
          <span
            ref={underlineRef}
            aria-hidden
            className="slide-indicator"
            // The hook sizes it to the active link; this draws only a 2px bar at the link's foot.
            style={{ borderBottom: '2px solid var(--color-brand-secondary)', boxSizing: 'border-box', marginTop: '2px' }}
          />
          {NAV.map(([href, label]) => (
            <Link key={href} href={href} data-tab={href} className={`relative py-1 ${linkClass(href)}`}>
              {label}
            </Link>
          ))}

          {checked && (
            user ? (
              <div className="flex items-center gap-4 pl-4 border-l border-brand-muted/20">
                <span className="text-brand-muted text-xs truncate max-w-[120px]" title={user.email}>
                  👤 {user.email.split('@')[0]}
                </span>
                <button
                  onClick={handleLogout}
                  className="bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary text-xs font-bold px-3 py-1.5 rounded-lg border border-brand-primary/20 transition-ui cursor-pointer"
                >
                  Log Out
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="bg-brand-primary hover:bg-brand-secondary text-white text-xs font-bold px-4 py-2 rounded-xl transition-ui"
              >
                Log In
              </Link>
            )
          )}
        </nav>

        {/* Mobile hamburger */}
        <button
          className="md:hidden text-brand-muted hover:text-brand-text transition-ui p-1"
          aria-label="Toggle menu"
          onClick={() => setMenuOpen((o) => !o)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {menuOpen ? (
              <>
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </>
            ) : (
              <>
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </>
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence initial={false}>
      {menuOpen && (
        <m.div key="mobile-menu" variants={collapse} initial="hidden" animate="show" exit="exit" className="md:hidden overflow-hidden">
        <nav className="bg-brand-surface border-t border-brand-muted/20 px-4 py-3 flex flex-col gap-3 text-sm font-medium">
          <Link
            href="/"
            className={linkClass("/")}
            onClick={() => setMenuOpen(false)}
          >
            Home
          </Link>
          <Link
            href="/ideas"
            className={linkClass("/ideas")}
            onClick={() => setMenuOpen(false)}
          >
            Cook Ideas
          </Link>
          <Link
            href="/cook"
            className={linkClass("/cook")}
            onClick={() => setMenuOpen(false)}
          >
            Cook Times
          </Link>
          <Link
            href="/recipes"
            className={linkClass("/recipes")}
            onClick={() => setMenuOpen(false)}
          >
            Recipes
          </Link>
          <Link
            href="/gallery"
            className={linkClass("/gallery")}
            onClick={() => setMenuOpen(false)}
          >
            Gallery
          </Link>
          <Link
            href="/gear"
            className={linkClass("/gear")}
            onClick={() => setMenuOpen(false)}
          >
            Gear
          </Link>
          <Link
            href="/guides"
            className={linkClass("/guides")}
            onClick={() => setMenuOpen(false)}
          >
            Guides
          </Link>
          <Link
            href="/rubs"
            className={linkClass("/rubs")}
            onClick={() => setMenuOpen(false)}
          >
            Rubs
          </Link>
          <Link
            href="/wood-chart"
            className={linkClass("/wood-chart")}
            onClick={() => setMenuOpen(false)}
          >
            Wood Chart
          </Link>
          <Link
            href="/saves"
            className={linkClass("/saves")}
            onClick={() => setMenuOpen(false)}
          >
            My Saves
          </Link>

          {checked && (
            user ? (
              <div className="flex flex-col gap-2 pt-2 border-t border-brand-muted/20 mt-1">
                <span className="text-brand-muted text-xs px-1">
                  👤 Logged in as: {user.email}
                </span>
                <button
                  onClick={() => { setMenuOpen(false); handleLogout(); }}
                  className="w-full bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary text-xs font-bold py-2.5 rounded-xl border border-brand-primary/20 transition-ui text-center cursor-pointer"
                >
                  Log Out
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="bg-brand-primary hover:bg-brand-secondary text-white text-xs font-bold py-2.5 rounded-xl transition-ui text-center mt-2"
                onClick={() => setMenuOpen(false)}
              >
                Log In
              </Link>
            )
          )}
        </nav>
        </m.div>
      )}
      </AnimatePresence>
    </header>
  );
}
