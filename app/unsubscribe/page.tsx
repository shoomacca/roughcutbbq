import Link from 'next/link';

interface Props {
  searchParams: Promise<{ token?: string }>;
}

export const metadata = { title: 'Unsubscribe' };

export default async function UnsubscribePage({ searchParams }: Props) {
  const { token } = await searchParams;

  let status: 'success' | 'not_found' | 'error' | 'missing' = 'missing';

  if (token) {
    try {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
      const res = await fetch(`${siteUrl}/api/unsubscribe?token=${encodeURIComponent(token)}`, {
        cache: 'no-store',
      });
      const data = (await res.json()) as { success?: boolean; error?: string };
      if (data.success) status = 'success';
      else if (data.error === 'not_found') status = 'not_found';
      else status = 'error';
    } catch {
      status = 'error';
    }
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-4">
        {status === 'success' && (
          <>
            <div className="text-5xl">✓</div>
            <h1 className="text-2xl font-bold text-amber-400">You&apos;ve been unsubscribed</h1>
            <p className="text-brand-muted">
              You won&apos;t receive any more cook plan emails from Rough Cut BBQ.
            </p>
          </>
        )}
        {(status === 'not_found' || status === 'missing') && (
          <>
            <div className="text-5xl">✗</div>
            <h1 className="text-2xl font-bold text-brand-text">Link not found</h1>
            <p className="text-brand-muted">
              This unsubscribe link is invalid or has already been used.
            </p>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="text-5xl">!</div>
            <h1 className="text-2xl font-bold text-brand-text">Something went wrong</h1>
            <p className="text-brand-muted">Please try again or contact us if the issue persists.</p>
          </>
        )}
        <div className="pt-2">
          <Link
            href="/calculator"
            className="inline-block px-6 py-3 bg-brand-primary hover:bg-brand-secondary transition-colors text-white font-semibold rounded-xl text-sm"
          >
            Back to calculator
          </Link>
        </div>
      </div>
    </div>
  );
}
