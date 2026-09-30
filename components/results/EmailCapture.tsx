'use client';

import { useState } from 'react';
import { trackEvent } from '@/lib/posthog';

interface EmailCaptureProps {
  cut: string;
  method: string;
  weight_kg: number;
  cook_time_minutes: number;
  appliance_temp_c: number;
  internal_temp_c: number;
}

type State = 'idle' | 'loading' | 'success' | 'duplicate' | 'error';

export default function EmailCapture({
  cut,
  method,
  weight_kg,
  cook_time_minutes,
  appliance_temp_c,
  internal_temp_c,
}: EmailCaptureProps) {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<State>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState('loading');

    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          cut,
          method,
          weight_kg,
          cook_time_minutes,
          appliance_temp_c,
          internal_temp_c,
        }),
      });

      if (res.ok) {
        setState('success');
        trackEvent('email_captured', { cut, method });
      } else if (res.status === 409) {
        setState('duplicate');
      } else {
        setState('error');
      }
    } catch {
      setState('error');
    }
  };

  if (state === 'success') {
    return (
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-5 py-4 text-center">
        <p className="text-amber-400 font-semibold text-sm">📬 Check your inbox!</p>
        <p className="text-brand-muted text-xs mt-1">Your cook plan is on its way.</p>
      </div>
    );
  }

  if (state === 'duplicate') {
    return (
      <div className="rounded-xl border border-white/8 bg-brand-surface px-5 py-4 text-center">
        <p className="text-brand-text text-sm font-semibold">Already sent!</p>
        <p className="text-brand-muted text-xs mt-1">
          That email already has this plan — check your inbox.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/8 bg-brand-surface px-5 py-4">
      <p className="text-brand-muted text-xs font-semibold uppercase tracking-wide mb-3">
        Want a copy?
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          disabled={state === 'loading'}
          className="flex-1 min-w-0 bg-brand-dark border border-white/10 rounded-lg px-3 py-2.5 text-sm text-brand-text placeholder:text-brand-muted/50 focus:outline-none focus:border-amber-500/60 transition-colors disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={state === 'loading'}
          className="flex-none whitespace-nowrap px-4 py-2.5 rounded-lg text-sm font-semibold bg-amber-500 hover:bg-amber-400 text-brand-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {state === 'loading' ? 'Sending…' : 'Email me this plan'}
        </button>
      </form>
      {state === 'error' && (
        <p className="text-red-400 text-xs mt-2">
          Something went wrong.{' '}
          <button
            onClick={() => setState('idle')}
            className="underline hover:no-underline"
          >
            Try again
          </button>
        </p>
      )}
      <p className="text-brand-muted/40 text-[10px] mt-2">No account needed. One-click unsubscribe.</p>
    </div>
  );
}
