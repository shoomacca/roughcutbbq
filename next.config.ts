import type { NextConfig } from 'next';
import createMDX from '@next/mdx';

const withMDX = createMDX({});

// Supabase project host (xdiapmnocyibpfrfgdcw, Sydney). Derived from SUPABASE_URL when set;
// falls back to the known host because CI builds run without env.
const FALLBACK_SUPABASE_HOST = 'xdiapmnocyibpfrfgdcw.supabase.co';

function supabaseHost(): string {
  const raw = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!raw) return FALLBACK_SUPABASE_HOST;
  try {
    return new URL(raw).hostname || FALLBACK_SUPABASE_HOST;
  } catch {
    return FALLBACK_SUPABASE_HOST;
  }
}

/** next/image may only optimise objects in the public `gallery` bucket. */
export const imageRemotePatterns = [
  {
    protocol: 'https' as const,
    hostname: supabaseHost(),
    pathname: '/storage/v1/object/public/gallery/**',
  },
];

const nextConfig: NextConfig = {
  pageExtensions: ['ts', 'tsx', 'md', 'mdx'],
  images: { remotePatterns: imageRemotePatterns },
};

export default withMDX(nextConfig);
