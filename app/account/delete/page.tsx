'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function DeleteAccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: number; email: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Check if user is logged in
  useEffect(() => {
    async function checkUser() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        }
      } catch (err) {
        console.error('Error fetching user', err);
      } finally {
        setLoading(false);
      }
    }
    checkUser();
  }, []);

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmed) {
      setError('Please check the confirmation box.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/account/delete', {
        method: 'POST',
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error === 'unauthorized' ? 'You must be logged in to delete your account.' : 'An error occurred while deleting your account.');
        setSubmitting(false);
        return;
      }

      // Success
      setSuccess(true);
      setUser(null);
      // Refresh router state and redirect after delay
      setTimeout(() => {
        router.refresh();
        router.push('/');
      }, 3000);
    } catch (err) {
      console.error(err);
      setError('Failed to connect to the server.');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="page-shell flex-1 flex flex-col items-center bg-brand-dark">
        <div className="text-brand-text font-semibold flex items-center gap-2">
          <span>🔥</span> Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell flex-1 flex flex-col items-center bg-brand-dark">
      <div className="w-full max-w-md bg-brand-surface border border-brand-primary/20 rounded-3xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <span className="text-4xl">⚠️</span>
          {success ? (
            <>
              <h1 className="page-title mt-3">
                Account Deleted
              </h1>
              <p className="text-brand-muted text-sm mt-2">
                Your account and all associated data have been permanently removed. Redirecting you to home...
              </p>
            </>
          ) : (
            <>
              <h1 className="page-title mt-3">
                Delete Account
              </h1>
              <p className="text-brand-primary text-sm mt-2 font-semibold">
                This action is permanent and cannot be undone.
              </p>
            </>
          )}
        </div>

        {error && (
          <div className="bg-brand-primary/10 border border-brand-primary/20 text-brand-primary text-sm rounded-xl p-4 mb-6">
            ⚠️ {error}
          </div>
        )}

        {success ? null : user ? (
          <form onSubmit={handleDelete} className="flex flex-col gap-6">
            <div className="bg-brand-dark/40 border border-brand-muted/10 rounded-xl p-4 text-sm text-brand-text z-0">
              <p className="font-semibold text-brand-muted mb-1">Authenticated as:</p>
              <p className="font-mono text-brand-secondary break-all">{user.email}</p>
              <p className="mt-3 text-xs text-brand-muted/80 leading-relaxed">
                Deleting your account will result in the permanent removal of your email, authentication logs, saved cook results, and your gallery photos, comments and stars.
              </p>
            </div>

            <div className="flex items-start gap-3">
              <input
                id="confirm"
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="mt-1 w-4 h-4 rounded border-brand-muted/30 text-brand-primary focus:ring-brand-primary"
              />
              <label htmlFor="confirm" className="text-xs text-brand-text cursor-pointer leading-relaxed">
                I understand this is permanent. Please delete all my personal information, saves, gallery photos, comments and stars immediately.
              </label>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-brand-primary hover:bg-red-700 disabled:opacity-50 transition-ui text-white font-bold py-3.5 rounded-xl text-sm cursor-pointer"
            >
              {submitting ? 'Deleting Account...' : 'Permanently Delete My Account'}
            </button>
          </form>
        ) : (
          <div className="text-center">
            <div className="bg-brand-dark/40 border border-brand-muted/10 rounded-xl p-6 text-sm text-brand-muted z-0 mb-6">
              You must be logged in to delete your account. If you do not have an account, no data has been collected.
            </div>
            <Link
              href="/login"
              className="inline-block w-full bg-brand-primary hover:bg-brand-secondary text-white font-bold py-3.5 rounded-xl text-sm transition-ui"
            >
              Log In
            </Link>
            <p className="text-center text-xs text-brand-muted mt-6">
              <Link href="/" className="hover:underline">
                Return to Home
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
