'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error === 'user_exists' ? 'An account with this email already exists.' : 'Something went wrong.');
        setLoading(false);
        return;
      }

      // Sync offline cooks from localStorage to database
      try {
        const rawHistory = localStorage.getItem('bbq_history');
        if (rawHistory) {
          const history = JSON.parse(rawHistory);
          if (Array.isArray(history) && history.length > 0) {
            await fetch('/api/saves/sync', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ cooks: history }),
            });
            // Clear local history after sync
            localStorage.setItem('bbq_history', JSON.stringify([]));
          }
        }
      } catch (syncErr) {
        console.error('Failed to sync offline cooks:', syncErr);
      }

      // Force refresh layout to pick up new session cookie and redirect to Saves
      router.refresh();
      router.push('/saves');
    } catch (err) {
      console.error(err);
      setError('Failed to connect to server.');
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-16 bg-brand-dark">
      <div className="w-full max-w-md bg-brand-surface border border-brand-muted/10 rounded-3xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <span className="text-4xl">🍖</span>
          <h1 className="text-3xl font-bold text-brand-text mt-3" style={{ fontFamily: 'var(--font-display, Georgia, serif)' }}>
            Create Account
          </h1>
          <p className="text-brand-muted text-sm mt-2">
            Save your cooks and access history from any device
          </p>
        </div>

        {error && (
          <div className="bg-brand-primary/10 border border-brand-primary/20 text-brand-primary text-sm rounded-xl p-4 mb-6">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label className="block text-xs font-bold text-brand-muted uppercase tracking-wider mb-2" htmlFor="email">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full bg-brand-dark border border-brand-muted/20 rounded-xl px-4 py-3 text-brand-text placeholder-brand-muted/50 focus:outline-none focus:border-brand-secondary transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-brand-muted uppercase tracking-wider mb-2" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 6 characters"
              className="w-full bg-brand-dark border border-brand-muted/20 rounded-xl px-4 py-3 text-brand-text placeholder-brand-muted/50 focus:outline-none focus:border-brand-secondary transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-brand-muted uppercase tracking-wider mb-2" htmlFor="confirmPassword">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter password"
              className="w-full bg-brand-dark border border-brand-muted/20 rounded-xl px-4 py-3 text-brand-text placeholder-brand-muted/50 focus:outline-none focus:border-brand-secondary transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-primary hover:bg-brand-secondary disabled:opacity-50 transition-colors text-white font-bold py-3.5 rounded-xl text-sm mt-2 cursor-pointer"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-xs text-brand-muted mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-brand-secondary hover:underline font-semibold">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
