import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { setCookies } from './helpers';

vi.mock('next/headers', async () => (await import('./helpers')).headersMock);

const calls: string[] = [];
let userDeleteError: unknown = null;
const posts = [
  { id: 'a', before_url: 'https://x/storage/v1/object/public/gallery/a-before.webp', after_url: 'https://x/storage/v1/object/public/gallery/a-after.webp' },
];
vi.mock('@/lib/supabase', () => ({
  getSupabase: () => ({
    from: (t: string) => ({
      select: () => ({ eq: async () => ({ data: t === 'gallery_posts' ? posts : [], error: null }) }),
      delete: () => ({
        eq: async () => {
          calls.push('delete:' + t);
          return { error: t === 'users' ? userDeleteError : null };
        },
      }),
    }),
    storage: {
      from: () => ({
        remove: async (o: string[]) => {
          calls.push('remove:' + o.join(','));
          return { error: { message: 'boom' } }; // storage failure must not block deletion
        },
      }),
    },
  }),
}));

import { signToken } from '@/lib/auth';
import * as del from '@/app/api/account/delete/route';

beforeAll(() => {
  process.env.JWT_SECRET = 'test-secret-account-delete';
});
beforeEach(() => {
  calls.length = 0;
  userDeleteError = null;
  setCookies({ session: signToken({ userId: 9, email: 'u@x.co' }) });
});

describe('account delete', () => {
  it('removes storage, then posts, then user (storage error is non-fatal)', async () => {
    const r = await del.POST();
    expect(r.status).toBe(200);
    expect(calls).toEqual(['remove:a-before.webp,a-after.webp', 'delete:gallery_posts', 'delete:users']);
  });

  it('user delete failure -> 500', async () => {
    userDeleteError = { message: 'db' };
    expect((await del.POST()).status).toBe(500);
  });
});
