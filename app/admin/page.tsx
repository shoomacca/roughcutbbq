import Link from 'next/link';

export const metadata = { title: 'Admin' };

export default function AdminIndex() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-6">⚙️ RoughCut BBQ Admin</h1>
      <div className="flex flex-col gap-3">
        <Link href="/admin/gear" className="bg-brand-surface border border-white/10 rounded-xl px-5 py-4 hover:border-brand-secondary/60 transition-all">
          <span className="font-bold">🛒 Gear & Rubs</span>
          <span className="text-brand-muted text-sm block mt-1">Add, edit or remove products and affiliate links</span>
        </Link>
        <Link href="/admin/gallery" className="bg-brand-surface border border-white/10 rounded-xl px-5 py-4 hover:border-brand-secondary/60 transition-all">
          <span className="font-bold">🖼️ Gallery moderation</span>
          <span className="text-brand-muted text-sm block mt-1">Review reported posts, delete anything inappropriate</span>
        </Link>
      </div>
    </div>
  );
}
