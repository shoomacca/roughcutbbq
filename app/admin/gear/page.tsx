'use client';

import { useEffect, useState } from 'react';

const SESSION_KEY = 'bbq_admin_authed';

interface GearRow {
  id: number;
  slug: string;
  name: string;
  category: string;
  description: string | null;
  affiliate_url: string;
  recommended_for: string | null;
  sort_order: number;
}

const EMPTY_NEW = { slug: '', name: '', category: '', description: '', affiliate_url: '', sort_order: 100 };

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 60);
}

export default function AdminGearPage() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  const [items, setItems] = useState<GearRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<number | 'new' | null>(null);
  const [message, setMessage] = useState('');
  const [drafts, setDrafts] = useState<Record<number, GearRow>>({});
  const [newItem, setNewItem] = useState({ ...EMPTY_NEW });
  const [showNew, setShowNew] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY) === '1') setAuthed(true);
  }, []);

  useEffect(() => {
    if (!authed) return;
    fetch('/api/gear?limit=100')
      .then((r) => r.json())
      .then(({ gear }) => { setItems(gear ?? []); setLoading(false); })
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

  const adminHeaders = {
    'Content-Type': 'application/json',
    'x-admin-password': process.env.NEXT_PUBLIC_ADMIN_PASSWORD ?? '',
  };

  const draftFor = (row: GearRow): GearRow => drafts[row.id] ?? row;

  const setDraft = (id: number, patch: Partial<GearRow>) => {
    setDrafts((prev) => ({ ...prev, [id]: { ...(prev[id] ?? items.find((i) => i.id === id)!), ...patch } }));
  };

  const flash = (msg: string) => { setMessage(msg); setTimeout(() => setMessage(''), 2500); };

  async function saveRow(id: number) {
    const draft = drafts[id];
    if (!draft) return;
    setBusy(id);
    try {
      const res = await fetch('/api/admin/gear', { method: 'PATCH', headers: adminHeaders, body: JSON.stringify(draft) });
      const data = await res.json();
      if (res.ok) {
        setItems((prev) => prev.map((i) => (i.id === id ? data.item : i)));
        setDrafts((prev) => { const n = { ...prev }; delete n[id]; return n; });
        flash('Saved ✓');
      } else {
        flash(`Save failed: ${data.error}`);
      }
    } finally {
      setBusy(null);
    }
  }

  async function deleteRow(id: number, name: string) {
    if (!confirm(`Delete "${name}"? Its /go/ link will fall back to the built-in list if the slug exists there, otherwise it redirects to /gear.`)) return;
    setBusy(id);
    try {
      const res = await fetch(`/api/admin/gear?id=${id}`, { method: 'DELETE', headers: adminHeaders });
      if (res.ok) {
        setItems((prev) => prev.filter((i) => i.id !== id));
        flash('Deleted');
      } else {
        flash('Delete failed');
      }
    } finally {
      setBusy(null);
    }
  }

  async function createItem(e: React.FormEvent) {
    e.preventDefault();
    setBusy('new');
    try {
      const body = { ...newItem, slug: newItem.slug || slugify(newItem.name) };
      const res = await fetch('/api/admin/gear', { method: 'POST', headers: adminHeaders, body: JSON.stringify(body) });
      const data = await res.json();
      if (res.ok) {
        setItems((prev) => [...prev, data.item]);
        setNewItem({ ...EMPTY_NEW });
        setShowNew(false);
        flash('Added ✓');
      } else {
        flash(data.error === 'slug_exists' ? 'That slug already exists' : `Add failed: ${data.error}`);
      }
    } finally {
      setBusy(null);
    }
  }

  if (!authed) {
    return (
      <div className="max-w-sm mx-auto px-4 py-20">
        <h1 className="text-xl font-bold mb-4">🔒 Gear Admin</h1>
        <form onSubmit={handleLogin} className="flex flex-col gap-3">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Admin password"
            className="bg-brand-surface border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-brand-secondary"
          />
          {authError && <p className="text-red-400 text-sm">{authError}</p>}
          <button className="bg-brand-primary hover:bg-brand-secondary text-white font-bold py-3 rounded-xl text-sm transition-all">
            Unlock
          </button>
        </form>
      </div>
    );
  }

  const categories = Array.from(new Set(items.map((i) => i.category)));
  const inputCls = 'bg-brand-dark border border-white/10 rounded-lg px-2 py-1.5 text-xs w-full outline-none focus:border-brand-secondary';

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-2 flex-wrap gap-3">
        <h1 className="text-2xl font-bold">🛒 Gear & Rubs Admin</h1>
        <div className="flex items-center gap-3">
          {message && <span className="text-brand-secondary text-sm font-bold">{message}</span>}
          <button
            onClick={() => setShowNew((s) => !s)}
            className="bg-brand-primary hover:bg-brand-secondary text-white font-bold px-4 py-2 rounded-xl text-sm transition-all"
          >
            {showNew ? 'Cancel' : '+ Add product'}
          </button>
        </div>
      </div>
      <p className="text-brand-muted text-sm mb-6">
        Changes go live immediately on /gear, /rubs, /ideas gear picks and all /go/ links. Remember the
        <code className="mx-1 text-brand-secondary">tag=bsbsbs0f-22</code> on every Amazon URL.
      </p>

      {showNew && (
        <form onSubmit={createItem} className="bg-brand-surface border border-brand-secondary/40 rounded-2xl p-4 mb-6 grid grid-cols-1 md:grid-cols-2 gap-3">
          <input className={inputCls} placeholder="Name *" value={newItem.name} onChange={(e) => setNewItem({ ...newItem, name: e.target.value })} required />
          <input className={inputCls} placeholder={`Slug (auto: ${slugify(newItem.name) || 'from name'})`} value={newItem.slug} onChange={(e) => setNewItem({ ...newItem, slug: slugify(e.target.value) })} />
          <input className={inputCls} placeholder="Category * (existing or new)" value={newItem.category} onChange={(e) => setNewItem({ ...newItem, category: e.target.value })} list="cats" required />
          <datalist id="cats">{categories.map((c) => <option key={c} value={c} />)}</datalist>
          <input className={inputCls} placeholder="Sort order" type="number" value={newItem.sort_order} onChange={(e) => setNewItem({ ...newItem, sort_order: parseInt(e.target.value || '100', 10) })} />
          <input className={`${inputCls} md:col-span-2`} placeholder="Amazon affiliate URL * (include tag=bsbsbs0f-22)" value={newItem.affiliate_url} onChange={(e) => setNewItem({ ...newItem, affiliate_url: e.target.value })} required />
          <input className={`${inputCls} md:col-span-2`} placeholder="Description / tagline" value={newItem.description} onChange={(e) => setNewItem({ ...newItem, description: e.target.value })} />
          <button disabled={busy === 'new'} className="bg-brand-secondary hover:opacity-90 text-white font-bold py-2.5 rounded-xl text-sm transition-all md:col-span-2">
            {busy === 'new' ? 'Adding…' : 'Add product'}
          </button>
        </form>
      )}

      {loading && <p className="text-brand-muted">Loading…</p>}

      {!loading && categories.map((cat) => (
        <section key={cat} className="mb-8">
          <h2 className="font-bold text-base mb-3">{cat} <span className="text-brand-muted font-normal text-sm">({items.filter((i) => i.category === cat).length})</span></h2>
          <div className="flex flex-col gap-2">
            {items.filter((i) => i.category === cat).sort((a, b) => a.sort_order - b.sort_order).map((row) => {
              const d = draftFor(row);
              const dirty = !!drafts[row.id];
              return (
                <div key={row.id} className={`bg-brand-surface border rounded-xl p-3 grid grid-cols-1 md:grid-cols-12 gap-2 items-center ${dirty ? 'border-brand-secondary/60' : 'border-white/10'}`}>
                  <div className="md:col-span-3">
                    <input className={inputCls} value={d.name} onChange={(e) => setDraft(row.id, { name: e.target.value })} />
                    <p className="text-brand-muted/60 text-[10px] mt-1 truncate">/go/{row.slug}</p>
                  </div>
                  <input className={`${inputCls} md:col-span-2`} value={d.category} onChange={(e) => setDraft(row.id, { category: e.target.value })} list="cats" />
                  <input className={`${inputCls} md:col-span-3`} value={d.affiliate_url} onChange={(e) => setDraft(row.id, { affiliate_url: e.target.value })} />
                  <input className={`${inputCls} md:col-span-2`} value={d.description ?? ''} placeholder="Description" onChange={(e) => setDraft(row.id, { description: e.target.value })} />
                  <div className="md:col-span-2 flex items-center gap-1.5 justify-end">
                    <input className={`${inputCls} !w-14 text-center`} type="number" value={d.sort_order} onChange={(e) => setDraft(row.id, { sort_order: parseInt(e.target.value || '0', 10) })} />
                    <a href={d.affiliate_url} target="_blank" rel="noopener noreferrer" className="text-xs px-2 py-1.5 rounded-lg bg-white/5 hover:bg-white/15 transition-all" title="Test link">↗</a>
                    <button
                      onClick={() => saveRow(row.id)}
                      disabled={!dirty || busy === row.id}
                      className={`text-xs font-bold px-2.5 py-1.5 rounded-lg transition-all ${dirty ? 'bg-brand-secondary text-white hover:opacity-90' : 'bg-white/5 text-brand-muted cursor-default'}`}
                    >
                      {busy === row.id ? '…' : 'Save'}
                    </button>
                    <button
                      onClick={() => deleteRow(row.id, row.name)}
                      disabled={busy === row.id}
                      className="text-xs font-bold px-2 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/25 transition-all"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
