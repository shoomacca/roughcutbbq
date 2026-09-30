import { describe, it, expect } from 'vitest';
import { imageRemotePatterns } from '../next.config';

describe('next.config images.remotePatterns', () => {
  it('allows only the Supabase public gallery bucket over https', () => {
    expect(imageRemotePatterns).toHaveLength(1);
    const [p] = imageRemotePatterns;
    expect(p.protocol).toBe('https');
    expect(p.hostname).toMatch(/\.supabase\.co$/);
    expect(p.pathname).toBe('/storage/v1/object/public/gallery/**');
  });
});
