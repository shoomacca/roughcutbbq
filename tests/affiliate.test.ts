import { beforeEach, describe, expect, it, vi } from 'vitest';

// Supabase stub: `settingsRow` is what app_settings returns; `fail` simulates a missing table.
let settingsRow: { value: string } | null = null;
let fail = false;
const upserts: unknown[] = [];
vi.mock('@/lib/supabase', () => ({
  getSupabase: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () =>
            fail ? { data: null, error: { code: '42P01', message: 'relation "app_settings" does not exist' } } : { data: settingsRow, error: null },
        }),
      }),
      upsert: async (row: unknown) => {
        upserts.push(row);
        return { error: null };
      },
    }),
  }),
}));

import {
  applyAmazonTag,
  clearAmazonTagCache,
  DEFAULT_AMAZON_TAG,
  getAmazonTag,
  isValidAmazonTag,
  setAmazonTag,
} from '@/lib/affiliate';
import { settingsPutBody } from '@/lib/api-schemas';

describe('applyAmazonTag', () => {
  const T = 'roughcutbbq-22';
  it('replaces an existing tag on amazon.com.au', () => {
    expect(applyAmazonTag('https://www.amazon.com.au/s?k=MEATER+Plus&tag=bsbsbs0f-22', T)).toBe(
      'https://www.amazon.com.au/s?k=MEATER+Plus&tag=roughcutbbq-22'
    );
  });
  it('adds a tag when none is present (amazon.com.au and amazon.com)', () => {
    expect(applyAmazonTag('https://www.amazon.com.au/dp/B07H9KLFZQ', T)).toBe('https://www.amazon.com.au/dp/B07H9KLFZQ?tag=roughcutbbq-22');
    expect(applyAmazonTag('https://amazon.com/dp/B07H9KLFZQ?th=1', T)).toBe('https://amazon.com/dp/B07H9KLFZQ?th=1&tag=roughcutbbq-22');
  });
  it('collapses duplicate tag params into one', () => {
    expect(applyAmazonTag('https://www.amazon.com.au/dp/X?tag=a-22&tag=b-22', T)).toBe('https://www.amazon.com.au/dp/X?tag=roughcutbbq-22');
  });
  it('leaves an already-correct URL byte-identical', () => {
    const u = 'https://www.amazon.com.au/s?k=Big%20Green%20Egg&tag=roughcutbbq-22';
    expect(applyAmazonTag(u, T)).toBe(u);
  });
  it('leaves non-Amazon hosts untouched (including look-alikes)', () => {
    for (const u of [
      'https://www.bunnings.com.au/x?tag=bsbsbs0f-22',
      'https://amazon.com.au.evil.example/x?tag=bsbsbs0f-22',
      'https://notamazon.com/x?tag=bsbsbs0f-22',
      'https://www.amazon.co.uk/dp/X?tag=bsbsbs0f-22',
    ]) {
      expect(applyAmazonTag(u, T)).toBe(u);
    }
  });
  it('leaves short links untouched (amzn.to, amzn.asia)', () => {
    expect(applyAmazonTag('https://amzn.to/3abcDEF', T)).toBe('https://amzn.to/3abcDEF');
    expect(applyAmazonTag('https://amzn.asia/d/abc123', T)).toBe('https://amzn.asia/d/abc123');
  });
  it('leaves placeholders and garbage untouched', () => {
    expect(applyAmazonTag('#', T)).toBe('#');
    expect(applyAmazonTag('not a url', T)).toBe('not a url');
  });
  it('refuses to write an invalid tag', () => {
    const u = 'https://www.amazon.com.au/dp/X?tag=bsbsbs0f-22';
    expect(applyAmazonTag(u, 'evil&x=1')).toBe(u);
  });
});

describe('isValidAmazonTag / settingsPutBody', () => {
  it('accepts real tracking-ID shapes', () => {
    for (const t of ['roughcutbbq-22', 'bsbsbs0f-22', 'mystore-20', 'a1-21', 'my-shop-name-22']) {
      expect(isValidAmazonTag(t)).toBe(true);
    }
  });
  it('rejects malformed tags', () => {
    for (const t of ['', 'roughcutbbq', 'roughcutbbq-2', 'roughcutbbq-30', 'Rough-22', '-x-22', 'a b-22', 'x&y-22', 'x=1-22', 'a'.repeat(40) + '-22']) {
      expect(isValidAmazonTag(t)).toBe(false);
    }
  });
  it('schema trims and lowercases before validating', () => {
    const r = settingsPutBody.safeParse({ amazon_tag: '  RoughCutBBQ-22 ' });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.amazon_tag).toBe('roughcutbbq-22');
    expect(settingsPutBody.safeParse({ amazon_tag: 'nope' }).success).toBe(false);
    expect(settingsPutBody.safeParse({}).success).toBe(false);
  });
});

describe('getAmazonTag', () => {
  beforeEach(() => {
    clearAmazonTagCache();
    settingsRow = null;
    fail = false;
    upserts.length = 0;
  });
  it('falls back to the default when the table is missing', async () => {
    fail = true;
    expect(await getAmazonTag()).toBe(DEFAULT_AMAZON_TAG);
  });
  it('falls back to the default when the row is missing or malformed', async () => {
    expect(await getAmazonTag()).toBe(DEFAULT_AMAZON_TAG);
    clearAmazonTagCache();
    settingsRow = { value: 'garbage value' };
    expect(await getAmazonTag()).toBe(DEFAULT_AMAZON_TAG);
  });
  it('returns the stored tag, and setAmazonTag updates the cache', async () => {
    settingsRow = { value: 'otherstore-22' };
    expect(await getAmazonTag()).toBe('otherstore-22');
    await setAmazonTag('thirdstore-22');
    expect(upserts).toHaveLength(1);
    expect(await getAmazonTag()).toBe('thirdstore-22');
  });
});
