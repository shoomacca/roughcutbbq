import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { json, setCookies } from './helpers';

vi.mock('next/headers', async () => (await import('./helpers')).headersMock);

// Chainable supabase stub: every call is recorded and the chain resolves to { data, error }.
const calls: string[] = [];
function chain(result: { data: unknown; error: unknown }) {
  const proxy: unknown = new Proxy(function () {}, {
    get(_t, prop) {
      if (prop === 'then') return (res: (v: unknown) => void) => res(result);
      return (...args: unknown[]) => {
        calls.push(String(prop) + '(' + args.map((a) => JSON.stringify(a)).join(',') + ')');
        return proxy;
      };
    },
  });
  return proxy;
}
vi.mock('@/lib/supabase', () => ({
  getSupabase: () => ({
    from: (t: string) => {
      calls.push('from:' + t);
      return chain({ data: { id: 1, result_json: '{}' }, error: null });
    },
    rpc: () => chain({ data: 1, error: null }),
    storage: { from: () => ({ upload: async () => ({ error: null }), remove: async () => ({}) }) },
  }),
  galleryPublicUrl: (n: string) => 'https://x/' + n,
}));

import { signAdminToken, signToken } from '@/lib/auth';
import { calculateCook, getMeatCategories } from '@/lib/calculator';
import { MAX_RESULT_JSON_BYTES } from '@/lib/api-schemas';
import * as comments from '@/app/api/gallery/comments/route';
import * as saves from '@/app/api/saves/route';
import * as sync from '@/app/api/saves/sync/route';
import * as adminGear from '@/app/api/admin/gear/route';
import * as signup from '@/app/api/auth/signup/route';
import * as login from '@/app/api/auth/login/route';
import * as upload from '@/app/api/gallery/upload/route';
import * as star from '@/app/api/gallery/star/route';
import * as me from '@/app/api/auth/me/route';
import * as galleryDelete from '@/app/api/gallery/delete/route';

const U = 'http://t/api/x';
const goodCook = { method: 'smoker', cutName: 'Brisket', categoryName: 'Beef', weightKg: 5 };

beforeAll(() => {
  process.env.JWT_SECRET = 'test-secret-rc-1-4';
});
beforeEach(() => {
  calls.length = 0;
  setCookies({ session: signToken({ userId: 9, email: 'u@x.co' }) });
});

describe('gallery comments', () => {
  it('unauthenticated -> 401', async () => {
    setCookies({});
    const r = await comments.POST(json(U, 'POST', { postId: 'abc', commentText: 'hi' }));
    expect(r.status).toBe(401);
  });
  it('> 1000 chars -> 400, nothing written', async () => {
    const r = await comments.POST(json(U, 'POST', { postId: 'abc', commentText: 'a'.repeat(1001) }));
    expect(r.status).toBe(400);
    expect(calls).toEqual([]);
  });
  it('whitespace only -> 400', async () => {
    const r = await comments.POST(json(U, 'POST', { postId: 'abc', commentText: '   ' }));
    expect(r.status).toBe(400);
  });
  it('exactly 1000 chars passes and is trimmed in the response', async () => {
    const r = await comments.POST(json(U, 'POST', { postId: 'abc', commentText: ' ' + 'a'.repeat(1000) + ' ' }));
    expect(r.status).toBe(200);
    const b = await r.json();
    expect(b.success).toBe(true);
    expect(b.comment.text).toHaveLength(1000);
  });
});

describe('saves', () => {
  it('weightKg 1000 -> 400', async () => {
    const r = await saves.POST(json(U, 'POST', { ...goodCook, weightKg: 1000 }));
    expect(r.status).toBe(400);
    expect(calls).toEqual([]);
  });
  it('unknown method -> 400', async () => {
    const r = await saves.POST(json(U, 'POST', { ...goodCook, method: 'microwave' }));
    expect(r.status).toBe(400);
  });
  it('result_json over 16 KB -> 400', async () => {
    const r = await saves.POST(json(U, 'POST', { ...goodCook, tips: ['x'.repeat(MAX_RESULT_JSON_BYTES)] }));
    expect(r.status).toBe(400);
  });
  it('valid cook -> success shape', async () => {
    const r = await saves.POST(json(U, 'POST', goodCook));
    expect(r.status).toBe(200);
    expect(await r.json()).toEqual({ success: true, id: 1 });
  });
  it('rating 6 and notes > 2000 -> 400', async () => {
    expect((await saves.PATCH(json(U, 'PATCH', { saveId: '3', rating: 6 }))).status).toBe(400);
    expect((await saves.PATCH(json(U, 'PATCH', { saveId: '3', notes: 'n'.repeat(2001) }))).status).toBe(400);
  });
  it('client PATCH payload (string saveId + rating) passes', async () => {
    expect((await saves.PATCH(json(U, 'PATCH', { saveId: '3', rating: 4 }))).status).toBe(200);
  });
  it('every real calculator result fits the 16 KB cap', () => {
    let max = 0;
    let n = 0;
    for (const cat of getMeatCategories()) {
      for (const cut of cat.cuts) {
        for (const method of cut.methods) {
          const res = calculateCook({ method, categoryId: cat.id, cutId: cut.id, weightKg: 30 });
          max = Math.max(max, JSON.stringify(res).length);
          n++;
        }
      }
    }
    expect(n).toBeGreaterThan(50);
    expect(max).toBeLessThan(MAX_RESULT_JSON_BYTES);
  });
});

describe('saves/sync', () => {
  it('> 50 items -> 400', async () => {
    const cooks = Array.from({ length: 51 }, () => goodCook);
    expect((await sync.POST(json(U, 'POST', { cooks }))).status).toBe(400);
  });
  it('50 items ok; invalid items dropped, not rejected', async () => {
    const cooks = [...Array.from({ length: 49 }, () => goodCook), { method: 'bogus' }];
    const r = await sync.POST(json(U, 'POST', { cooks }));
    expect(r.status).toBe(200);
    const insert = calls.find((c) => c.startsWith('insert('))!;
    expect(JSON.parse(insert.slice('insert('.length, -1)).length).toBe(49);
  });
  it('no session -> 401', async () => {
    setCookies({});
    expect((await sync.POST(json(U, 'POST', { cooks: [] }))).status).toBe(401);
  });
});

describe('admin gear', () => {
  const gear = {
    slug: 'my-gear', name: 'Gear', category: 'tools',
    affiliate_url: 'https://amzn.to/x', sort_order: 100, description: '',
  };
  it('POST without admin cookie -> 401, nothing written', async () => {
    const r = await adminGear.POST(json(U, 'POST', gear));
    expect(r.status).toBe(401);
    expect(calls).toEqual([]);
  });
  it('a user session is not admin -> 401', async () => {
    expect((await adminGear.PATCH(json(U, 'PATCH', { id: 1 }))).status).toBe(401);
  });
  it('with admin cookie: valid -> 200; bad slug / http url -> 400', async () => {
    setCookies({ admin_token: signAdminToken() });
    expect((await adminGear.POST(json(U, 'POST', gear))).status).toBe(200);
    expect((await adminGear.POST(json(U, 'POST', { ...gear, slug: 'Bad Slug' }))).status).toBe(400);
    expect((await adminGear.POST(json(U, 'POST', { ...gear, affiliate_url: 'http://x.co' }))).status).toBe(400);
  });
  it('gallery delete without admin -> 401', async () => {
    expect((await galleryDelete.DELETE(json(U, 'DELETE', { postId: 'abc' }))).status).toBe(401);
  });
});

describe('auth routes', () => {
  it('signup keeps the 6-char minimum (RC-1.8 owns the change); caps enforced', async () => {
    expect((await signup.POST(json(U, 'POST', { email: 'a@b.co', password: '12345' }))).status).toBe(400);
    expect((await signup.POST(json(U, 'POST', { email: 'a@b.co', password: 'x'.repeat(201) }))).status).toBe(400);
    expect((await signup.POST(json(U, 'POST', { email: 'a'.repeat(250) + '@b.co', password: '123456' }))).status).toBe(400);
  });
  it('login with non-string password -> 400', async () => {
    expect((await login.POST(json(U, 'POST', { email: 'a@b.co', password: { $ne: 1 } }))).status).toBe(400);
  });
  it('/me: no cookie -> user null; valid -> user', async () => {
    setCookies({});
    expect(await (await me.GET()).json()).toEqual({ user: null });
    setCookies({ session: signToken({ userId: 5, email: 'q@w.er' }) });
    expect(await (await me.GET()).json()).toEqual({ user: { userId: 5, email: 'q@w.er' } });
  });
  it('star: bad postId -> 400', async () => {
    expect((await star.POST(json(U, 'POST', { postId: '../etc' }))).status).toBe(400);
  });
});

describe('gallery upload (multipart)', () => {
  function form(fields: Record<string, string>) {
    const f = new FormData();
    f.append('before', new File(['x'], 'b.jpg', { type: 'image/jpeg' }));
    f.append('after', new File(['x'], 'a.jpg', { type: 'image/jpeg' }));
    for (const [k, v] of Object.entries(fields)) f.append(k, v);
    return new Request(U, { method: 'POST', body: f });
  }
  it('valid fields (enum method and UI label) -> 200', async () => {
    expect((await upload.POST(form({ cut: 'Brisket', method: 'smoker' }))).status).toBe(200);
    expect((await upload.POST(form({ cut: 'Brisket', method: 'Pellet Grill', name: 'Bob', gearUsed: 'x' }))).status).toBe(200);
  });
  it('name > 80, gearUsed > 200, cut > 80, unknown method -> 400', async () => {
    expect((await upload.POST(form({ cut: 'B', method: 'smoker', name: 'n'.repeat(81) }))).status).toBe(400);
    expect((await upload.POST(form({ cut: 'B', method: 'smoker', gearUsed: 'g'.repeat(201) }))).status).toBe(400);
    expect((await upload.POST(form({ cut: 'c'.repeat(81), method: 'smoker' }))).status).toBe(400);
    expect((await upload.POST(form({ cut: 'B', method: 'nuke' }))).status).toBe(400);
  });
  it('missing cut -> 400', async () => {
    expect((await upload.POST(form({ method: 'smoker' }))).status).toBe(400);
  });
});
