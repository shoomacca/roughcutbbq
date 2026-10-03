import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { setCookies } from './helpers';

vi.mock('next/headers', async () => (await import('./helpers')).headersMock);

// users table stub: `userRow` is what the id lookup returns; `dbError` simulates an outage.
let userRow: { id: number; email: string } | null = null;
let dbError = false;
let lookups = 0;
vi.mock('@/lib/supabase', () => ({
  getSupabase: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => {
            lookups++;
            return dbError ? { data: null, error: { message: 'down' } } : { data: userRow, error: null };
          },
        }),
      }),
    }),
  }),
}));

import { isAdminRequest, isAllowedAdminEmail, parseAdminEmails, signAdminToken, signToken } from '@/lib/auth';
import { requireAdmin } from '@/lib/api';
import * as loginRoute from '@/app/api/admin/login/route';

beforeAll(() => {
  process.env.JWT_SECRET = 'test-secret-admin-emails';
});
beforeEach(() => {
  setCookies({});
  userRow = null;
  dbError = false;
  lookups = 0;
  delete process.env.ADMIN_EMAILS;
});
afterEach(() => {
  delete process.env.ADMIN_EMAILS;
});

describe('ADMIN_EMAILS matching', () => {
  it('parses comma list with whitespace, case and blanks', () => {
    expect([...parseAdminEmails(' Chris@BSBSBS.au , ,other@x.co,')]).toEqual(['chris@bsbsbs.au', 'other@x.co']);
  });
  it('empty or unset env => nobody', () => {
    expect(isAllowedAdminEmail('chris@bsbsbs.au', '')).toBe(false);
    expect(isAllowedAdminEmail('chris@bsbsbs.au', ' , ')).toBe(false);
    expect(isAllowedAdminEmail('chris@bsbsbs.au')).toBe(false); // env unset
  });
  it('matches case-insensitively and ignores surrounding whitespace', () => {
    expect(isAllowedAdminEmail('CHRIS@bsbsbs.AU', 'chris@bsbsbs.au')).toBe(true);
    expect(isAllowedAdminEmail('  chris@bsbsbs.au ', 'x@y.co,  Chris@Bsbsbs.au')).toBe(true);
  });
  it('no partial / substring matches', () => {
    expect(isAllowedAdminEmail('hris@bsbsbs.au', 'chris@bsbsbs.au')).toBe(false);
    expect(isAllowedAdminEmail('chris@bsbsbs.au.evil', 'chris@bsbsbs.au')).toBe(false);
    expect(isAllowedAdminEmail('', 'chris@bsbsbs.au')).toBe(false);
    expect(isAllowedAdminEmail(undefined, 'chris@bsbsbs.au')).toBe(false);
  });
});

describe('isAdminRequest with ADMIN_EMAILS', () => {
  const chris = () => signToken({ userId: 6, email: 'chris@bsbsbs.au' });

  it('shared-password admin_token still works with ADMIN_EMAILS unset', async () => {
    setCookies({ admin_token: signAdminToken() });
    expect(await isAdminRequest()).toBe(true);
    expect(lookups).toBe(0);
  });
  it('allow-listed user session whose DB row matches => admin', async () => {
    process.env.ADMIN_EMAILS = 'Chris@bsbsbs.au';
    userRow = { id: 6, email: 'chris@bsbsbs.au' };
    setCookies({ session: chris() });
    expect(await isAdminRequest()).toBe(true);
    expect((await requireAdmin()).ok).toBe(true);
    const res = await loginRoute.GET();
    expect(await res.json()).toEqual({ authed: true });
  });
  it('allow-listed email but env unset => not admin (no DB lookup)', async () => {
    userRow = { id: 6, email: 'chris@bsbsbs.au' };
    setCookies({ session: chris() });
    expect(await isAdminRequest()).toBe(false);
    expect(lookups).toBe(0);
  });
  it('logged-in non-allowed user => 401 from admin guard, no DB lookup', async () => {
    process.env.ADMIN_EMAILS = 'chris@bsbsbs.au';
    setCookies({ session: signToken({ userId: 9, email: 'someone@else.com' }) });
    const g = await requireAdmin();
    expect(g.ok).toBe(false);
    if (!g.ok) expect(g.res.status).toBe(401);
    expect(lookups).toBe(0);
    expect(await (await loginRoute.GET()).json()).toEqual({ authed: false });
  });
  it('user deleted from DB => not admin', async () => {
    process.env.ADMIN_EMAILS = 'chris@bsbsbs.au';
    userRow = null;
    setCookies({ session: chris() });
    expect(await isAdminRequest()).toBe(false);
  });
  it('user id now has a different email => not admin', async () => {
    process.env.ADMIN_EMAILS = 'chris@bsbsbs.au';
    userRow = { id: 6, email: 'someone@else.com' };
    setCookies({ session: chris() });
    expect(await isAdminRequest()).toBe(false);
  });
  it('DB error fails closed', async () => {
    process.env.ADMIN_EMAILS = 'chris@bsbsbs.au';
    dbError = true;
    setCookies({ session: chris() });
    expect(await isAdminRequest()).toBe(false);
  });
  it('forged / tampered session token => not admin', async () => {
    process.env.ADMIN_EMAILS = 'chris@bsbsbs.au';
    userRow = { id: 6, email: 'chris@bsbsbs.au' };
    const t = chris();
    setCookies({ session: t.slice(0, -2) + 'xx' });
    expect(await isAdminRequest()).toBe(false);
    expect(lookups).toBe(0);
  });
});
