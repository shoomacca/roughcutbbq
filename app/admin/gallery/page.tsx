'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

interface GalleryPost {
  id: string;
  before_url: string;
  after_url: string;
  name: string | null;
  cut: string;
  method: string;
  report_count: number;
  created_at: string;
}

const SESSION_KEY = 'bbq_admin_auth';

export default function AdminGalleryPage() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [posts, setPosts] = useState<GalleryPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Restore auth from session
  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY)) {
      setAuthed(true);
    }
  }, []);

  // Fetch flagged posts once authed
  useEffect(() => {
    if (!authed) return;
    setLoading(true);
    fetch('/api/gallery?flagged=true')
      .then((r) => r.json())
      .then(({ posts }) => { setPosts(posts ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [authed]);

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (password === process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, '1');
      setAuthed(true);
      setAuthError('');
    } else {
      setAuthError('Incorrect password');
    }
  }

  async function handleDelete(postId: string) {
    if (!confirm('Delete this post and its images? This cannot be undone.')) return;
    setDeleting(postId);
    try {
      const res = await fetch('/api/gallery/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': process.env.NEXT_PUBLIC_ADMIN_PASSWORD ?? '',
        },
        body: JSON.stringify({ postId }),
      });
      if (res.ok) {
        setPosts((prev) => prev.filter((p) => p.id !== postId));
      }
    } finally {
      setDeleting(null);
    }
  }

  // ── Password gate ────────────────────────────────────────────────────────
  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#0d1208' }}>
        <form onSubmit={handleLogin} className="w-full max-w-sm flex flex-col gap-4">
          <h1 className="text-white font-bold text-xl text-center">Admin</h1>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            autoFocus
            className="bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-orange-500/50"
          />
          {authError && <p className="text-red-400 text-xs text-center">{authError}</p>}
          <button
            type="submit"
            className="py-3 rounded-xl font-bold text-sm text-white"
            style={{ background: '#f97316' }}
          >
            Enter
          </button>
        </form>
      </div>
    );
  }

  // ── Admin view ───────────────────────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-brand-text text-2xl font-bold">Gallery Admin</h1>
          <p className="text-brand-muted text-sm mt-0.5">Flagged posts (report_count &gt; 0)</p>
        </div>
        <button
          onClick={() => { sessionStorage.removeItem(SESSION_KEY); setAuthed(false); }}
          className="text-brand-muted text-sm hover:text-brand-text transition-colors"
        >
          Sign out
        </button>
      </div>

      {loading && (
        <p className="text-brand-muted text-sm text-center py-12">Loading...</p>
      )}

      {!loading && posts.length === 0 && (
        <div className="text-center py-20">
          <p className="text-brand-text font-semibold text-lg">No flagged posts</p>
          <p className="text-brand-muted text-sm mt-1">All clear.</p>
        </div>
      )}

      {!loading && posts.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-brand-muted text-xs uppercase tracking-wide">
                <th className="text-left py-3 pr-4">Photos</th>
                <th className="text-left py-3 pr-4">Cut</th>
                <th className="text-left py-3 pr-4">Method</th>
                <th className="text-left py-3 pr-4">Name</th>
                <th className="text-left py-3 pr-4">Reports</th>
                <th className="text-left py-3 pr-4">Posted</th>
                <th className="text-left py-3"></th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr key={post.id} className="border-b border-white/5 hover:bg-white/2">
                  {/* Thumbnails */}
                  <td className="py-3 pr-4">
                    <div className="flex gap-1">
                      <div className="relative w-14 h-14 rounded-lg overflow-hidden flex-none">
                        <Image src={post.before_url} alt="Before" fill className="object-cover" />
                      </div>
                      <div className="relative w-14 h-14 rounded-lg overflow-hidden flex-none">
                        <Image src={post.after_url} alt="After" fill className="object-cover" />
                      </div>
                    </div>
                  </td>
                  <td className="py-3 pr-4 text-brand-text">{post.cut}</td>
                  <td className="py-3 pr-4 text-brand-muted">{post.method}</td>
                  <td className="py-3 pr-4 text-brand-muted">{post.name ?? '—'}</td>
                  <td className="py-3 pr-4">
                    <span className="text-red-400 font-bold">{post.report_count}</span>
                  </td>
                  <td className="py-3 pr-4 text-brand-muted text-xs">
                    {new Date(post.created_at).toLocaleDateString('en-AU')}
                  </td>
                  <td className="py-3">
                    <button
                      onClick={() => handleDelete(post.id)}
                      disabled={deleting === post.id}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-red-600/80 hover:bg-red-600 disabled:opacity-40 transition-colors"
                    >
                      {deleting === post.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
