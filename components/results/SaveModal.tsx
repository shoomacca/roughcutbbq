'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function SaveModal({ open, onClose }: Props) {
  const firstFocusRef = useRef<HTMLAnchorElement>(null);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Lock body scroll
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  // Focus first CTA when modal opens
  useEffect(() => {
    if (open) firstFocusRef.current?.focus();
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.72)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="save-modal-title"
        className="w-full max-w-sm rounded-2xl p-6 flex flex-col gap-5"
        style={{ backgroundColor: '#1C2A1E' }}
      >
        {/* Icon */}
        <div className="text-4xl text-center select-none">🔖</div>

        {/* Copy */}
        <div className="text-center">
          <h2 id="save-modal-title" className="text-xl font-bold text-brand-text">
            Save your cook plan
          </h2>
          <p className="text-brand-muted text-sm mt-2 leading-relaxed">
            Create a free account to save cooks, access your history, and recalculate anytime.
          </p>
        </div>

        {/* CTAs */}
        <div className="flex flex-col gap-3">
          <Link
            ref={firstFocusRef}
            href="/signup"
            className="w-full bg-brand-primary hover:bg-brand-secondary transition-colors text-white font-bold px-6 py-3 rounded-xl text-center text-sm"
          >
            Create free account
          </Link>
          <Link
            href="/login"
            className="w-full border border-brand-muted/25 hover:border-brand-muted/50 transition-colors text-brand-text font-semibold px-6 py-3 rounded-xl text-center text-sm"
          >
            Log in
          </Link>
        </div>

        {/* Dismiss */}
        <button
          onClick={onClose}
          className="text-brand-muted hover:text-brand-text text-xs text-center transition-colors"
        >
          Maybe later
        </button>
      </div>
    </div>
  );
}
