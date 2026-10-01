'use client';

import { useEffect } from 'react';

/**
 * Marks <html data-hydrated> once React is running on the client. CSS that hides
 * things before they animate in (`.reveal`, sliding-indicator fallbacks in
 * app/globals.css) keys off this flag, so server HTML — and any client where the
 * JS never arrives — shows everything.
 */
export default function HydrationFlag() {
  useEffect(() => {
    document.documentElement.dataset.hydrated = '';
  }, []);
  return null;
}
