import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { json, setCookies } from './helpers';

vi.mock('next/headers', async () => (await import('./helpers')).headersMock);

import { signAdminToken, signToken } from '@/lib/auth';
import { parseBody, parseQuery, requireAdmin, requireUser, optionalUser } from '@/lib/api';

beforeAll(() => {
  process.env.JWT_SECRET = 'test-secret-rc-1-4';
});
beforeEach(() => setCookies({}));

describe('requireUser', () => {
  it('no cookie -> 401', async () => {
    const g = await requireUser();
    expect(g.ok).toBe(false);
    if (!g.ok) {
      expect(g.res.status).toBe(401);
      expect(await g.res.json()).toEqual({ error: 'unauthorized' });
    }
  });
  it('bad token -> 401', async () => {
    setCookies({ session: 'not.a.token' });
    const g = await requireUser();
    expect(g.ok).toBe(false);
    if (!g.ok) expect(g.res.status).toBe(401);
  });
  it('tampered signature -> 401', async () => {
    const t = signToken({ userId: 1, email: 'a@b.co' });
    setCookies({ session: t.slice(0, -2) + 'xx' });
    expect((await requireUser()).ok).toBe(false);
  });
  it('valid token -> passes with userId and email', async () => {
    setCookies({ session: signToken({ userId: 42, email: 'a@b.co' }) });
    const g = await requireUser();
    expect(g.ok).toBe(true);
    if (g.ok) expect(g.user).toEqual({ userId: 42, email: 'a@b.co' });
  });
  it('optionalUser returns null without a cookie, user with one', async () => {
    expect(await optionalUser()).toBeNull();
    setCookies({ session: signToken({ userId: 7, email: 'x@y.zz' }) });
    expect(await optionalUser()).toEqual({ userId: 7, email: 'x@y.zz' });
  });
});

describe('requireAdmin', () => {
  it('no cookie -> 401; valid admin cookie -> ok', async () => {
    const no = await requireAdmin();
    expect(no.ok).toBe(false);
    if (!no.ok) expect(no.res.status).toBe(401);
    setCookies({ admin_token: signAdminToken() });
    expect((await requireAdmin()).ok).toBe(true);
  });
});

describe('parseBody', () => {
  const schema = z.object({ n: z.number() });
  it('invalid JSON -> 400 invalid_input', async () => {
    const g = await parseBody(json('http://t/x', 'POST', '{nope'), schema);
    expect(g.ok).toBe(false);
    if (!g.ok) {
      expect(g.res.status).toBe(400);
      expect((await g.res.json()).error).toBe('invalid_input');
    }
  });
  it('schema failure -> 400 invalid_input with field paths', async () => {
    const g = await parseBody(json('http://t/x', 'POST', { n: 'x' }), schema);
    expect(g.ok).toBe(false);
    if (!g.ok) {
      expect(g.res.status).toBe(400);
      expect(await g.res.json()).toEqual({ error: 'invalid_input', fields: ['n'] });
    }
  });
  it('oversize by measured text -> 400 body_too_large', async () => {
    const g = await parseBody(json('http://t/x', 'POST', { n: 1, pad: 'a'.repeat(70 * 1024) }), schema);
    expect(g.ok).toBe(false);
    if (!g.ok) {
      expect(g.res.status).toBe(400);
      expect((await g.res.json()).error).toBe('body_too_large');
    }
  });
  it('oversize by declared content-length -> 400 body_too_large', async () => {
    const g = await parseBody(json('http://t/x', 'POST', { n: 1 }, { 'content-length': '999999' }), schema);
    expect(g.ok).toBe(false);
    if (!g.ok) expect((await g.res.json()).error).toBe('body_too_large');
  });
  it('valid -> data', async () => {
    const g = await parseBody(json('http://t/x', 'POST', { n: 3 }), schema);
    expect(g.ok && g.data).toEqual({ n: 3 });
  });
});

describe('parseQuery', () => {
  it('validates query params', () => {
    const s = z.object({ a: z.string().max(3) });
    expect(parseQuery('http://t/x?a=abc', s).ok).toBe(true);
    const bad = parseQuery('http://t/x?a=abcd', s);
    expect(bad.ok).toBe(false);
    if (!bad.ok) expect(bad.res.status).toBe(400);
  });
});

describe('no route calls verifyToken directly', () => {
  function walk(dir: string): string[] {
    return readdirSync(dir).flatMap((f) => {
      const p = path.join(dir, f);
      return statSync(p).isDirectory() ? walk(p) : [p];
    });
  }
  it('app/ has zero verifyToken references', () => {
    const offenders = walk(path.join(__dirname, '..', '..', 'app')).filter(
      (f) => /\.(ts|tsx)$/.test(f) && readFileSync(f, 'utf8').includes('verifyToken')
    );
    expect(offenders).toEqual([]);
  });
});
