'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { isValidAmazonTag, normalizeAmazonTag } from '@/lib/amazon-tag';

export default function AdminSettingsPage() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  const [current, setCurrent] = useState('');
  const [tag, setTag] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);

  // Restore auth from the server (admin cookie or allow-listed account)
  useEffect(() => {
    fetch('/api/admin/login')
      .then((r) => r.json())
      .then(({ authed }) => { if (authed) setAuthed(true); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!authed) return;
    fetch('/api/admin/settings')
      .then((r) => r.json())
      .then(({ amazon_tag }) => {
        if (amazon_tag) { setCurrent(amazon_tag); setTag(amazon_tag); }
        setLoading(false);
      })
      .catch(() => { setLoading(false); setStatus({ kind: 'error', text: 'Could not load settings' }); });
  }, [authed]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        setAuthed(true);
        setAuthError('');
        setPassword('');
      } else {
        const { error } = await res.json().catch(() => ({ error: '' }));
        setAuthError(error || 'Incorrect password');
      }
    } catch {
      setAuthError('Could not reach the server');
    }
  }

  const normalized = normalizeAmazonTag(tag);
  const valid = isValidAmazonTag(normalized);
  const dirty = normalized !== current;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    setSaving(true);
    setStatus(null);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amazon_tag: normalized }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setCurrent(data.amazon_tag);
        setTag(data.amazon_tag);
        setStatus({ kind: 'ok', text: 'Saved. Every Amazon link now uses this tag.' });
      } else if (res.status === 401) {
        setAuthed(false);
      } else {
        setStatus({ kind: 'error', text: data.error === 'invalid_input' ? 'That is not a valid Amazon tracking ID' : `Save failed: ${data.error ?? res.status}` });
      }
    } catch {
      setStatus({ kind: 'error', text: 'Could not reach the server' });
    } finally {
      setSaving(false);
    }
  }

  if (!authed) {
    return (
      <div className="max-w-sm mx-auto px-4 py-20">
        <h1 className="text-xl font-bold mb-4">🔒 Settings</h1>
        <form onSubmit={handleLogin} className="flex flex-col gap-3">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Admin password"
            className="bg-brand-surface border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-brand-secondary"
          />
          {authError && <p className="text-red-400 text-sm">{authError}</p>}
          <button className="bg-brand-primary hover:bg-brand-secondary text-white font-bold py-3 rounded-xl text-sm transition-ui">
            Unlock
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <Link href="/admin" className="text-brand-muted text-sm hover:text-brand-text transition-ui">← Admin</Link>
      <h1 className="text-2xl font-bold mt-2 mb-6">⚙️ Settings</h1>

      <form onSubmit={save} className="bg-brand-surface border border-white/10 rounded-xl px-5 py-4 flex flex-col gap-3">
        <div>
          <label htmlFor="amazon-tag" className="font-bold block">Amazon Associates tag</label>
          <p className="text-brand-muted text-sm mt-1">
            Applied automatically to every amazon.com.au / amazon.com link on /gear, /rubs and every /go/ redirect.
            Short links (amzn.to) keep the tag they were created with.
          </p>
        </div>
        {loading ? (
          <p className="text-brand-muted text-sm">Loading…</p>
        ) : (
          <>
            <p className="text-sm">
              Current: <code className="text-brand-secondary">{current || 'unknown'}</code>
            </p>
            <input
              id="amazon-tag"
              value={tag}
              onChange={(e) => { setTag(e.target.value); setStatus(null); }}
              placeholder="e.g. roughcutbbq-22"
              autoComplete="off"
              spellCheck={false}
              aria-invalid={!valid}
              className="bg-brand-dark border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-brand-secondary"
            />
            {!valid && tag.trim() !== '' && (
              <p className="text-red-400 text-sm">
                Must look like an Amazon tracking ID: lowercase letters, digits and hyphens, ending in -2X (e.g. -22).
              </p>
            )}
            <button
              disabled={!valid || !dirty || saving}
              className={`font-bold py-3 rounded-xl text-sm transition-ui ${valid && dirty ? 'bg-brand-primary hover:bg-brand-secondary text-white' : 'bg-white/5 text-brand-muted cursor-default'}`}
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
            {status && (
              <p role="status" className={`text-sm font-bold ${status.kind === 'ok' ? 'text-brand-secondary' : 'text-red-400'}`}>
                {status.text}
              </p>
            )}
          </>
        )}
      </form>
    </div>
  );
}
