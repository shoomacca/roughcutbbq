import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import sharp from 'sharp';
import { json, setCookies } from './helpers';

vi.mock('next/headers', async () => (await import('./helpers')).headersMock);

// In-memory fake of the pieces of supabase these routes touch.
const state = {
  reports: new Set<string>(),
  post: { report_count: 0, reported: false },
  uploads: [] as { name: string; body: Buffer; contentType: string }[],
  removed: [] as string[][],
  insertError: null as unknown,
};
vi.mock('@/lib/supabase', () => ({
  galleryPublicUrl: (n: string) => 'https://x/' + n,
  getSupabase: () => ({
    storage: {
      from: () => ({
        upload: async (name: string, body: Buffer, o: { contentType: string }) => {
          state.uploads.push({ name, body, contentType: o.contentType });
          return { error: null };
        },
        remove: async (names: string[]) => {
          state.removed.push(names);
          return { error: null };
        },
      }),
    },
    from: (table: string) => {
      if (table === 'post_reports') {
        const api = {
          upsert: async (row: { reporter_key: string }) => {
            state.reports.add(row.reporter_key);
            return { error: null };
          },
          select: () => api,
          eq: async () => ({ count: state.reports.size, error: null }),
        };
        return api;
      }
      // gallery_posts
      return {
        select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { id: 'p1' } }) }) }),
        update: (patch: { report_count: number; reported: boolean }) => ({
          eq: async () => {
            state.post = patch;
            return { error: null };
          },
        }),
        insert: async () => ({ error: state.insertError }),
      };
    },
  }),
}));

import { signToken } from '@/lib/auth';
import * as gallery from '@/app/api/gallery/route';
import * as report from '@/app/api/gallery/report/route';
import * as upload from '@/app/api/gallery/upload/route';

beforeAll(() => {
  process.env.JWT_SECRET = 'test-secret-rc-1-7';
});
beforeEach(() => {
  setCookies({ session: signToken({ userId: 9, email: 'u@x.co' }) });
  state.reports.clear();
  state.post = { report_count: 0, reported: false };
  state.uploads = [];
  state.removed = [];
  state.insertError = null;
});

describe('RC-1.7 flagged list', () => {
  it('?flagged=true without admin cookie -> 401', async () => {
    const r = await gallery.GET(new Request('http://t/api/gallery?flagged=true'));
    expect(r.status).toBe(401);
  });
});

describe('RC-1.7 report dedupe', () => {
  it('same anonymous reporter 3 times -> report_count 1, not hidden', async () => {
    setCookies({});
    for (let i = 0; i < 3; i++) {
      const r = await report.POST(
        json('http://t/api/gallery/report', 'POST', { postId: 'p1' }, { 'x-forwarded-for': '1.2.3.4', 'user-agent': 'ua' })
      );
      expect(r.status).toBe(200);
    }
    expect(state.post).toEqual({ report_count: 1, reported: false });
  });
  it('3 distinct reporters -> hidden', async () => {
    setCookies({});
    for (const ip of ['1.1.1.1', '2.2.2.2', '3.3.3.3']) {
      await report.POST(json('http://t/api/gallery/report', 'POST', { postId: 'p1' }, { 'x-forwarded-for': ip }));
    }
    expect(state.post).toEqual({ report_count: 3, reported: true });
  });
});

describe('RC-1.7 upload hardening', () => {
  const U = 'http://t/api/gallery/upload';
  function form(before: Buffer, after: Buffer, type = 'image/jpeg') {
    const f = new FormData();
    f.append('before', new File([new Uint8Array(before)], 'b.jpg', { type }));
    f.append('after', new File([new Uint8Array(after)], 'a.jpg', { type }));
    f.append('cut', 'Brisket');
    f.append('method', 'smoker');
    return new Request(U, { method: 'POST', body: f });
  }
  const gpsJpeg = () =>
    sharp({ create: { width: 3000, height: 1500, channels: 3, background: '#0a0' } })
      .withExif({ IFD0: { Copyright: 'secret' }, IFD3: { GPSLatitudeRef: 'S', GPSLatitude: '33/1 51/1 0/1' } })
      .jpeg()
      .toBuffer();

  it('text file renamed .jpg (declared image/jpeg) -> 400, nothing stored', async () => {
    const txt = Buffer.from('definitely not an image');
    const r = await upload.POST(form(txt, txt));
    expect(r.status).toBe(400);
    expect(state.uploads).toHaveLength(0);
  });

  it('JPEG with EXIF GPS -> stored as webp, <=2000px, no EXIF', async () => {
    const src = await gpsJpeg();
    expect((await sharp(src).metadata()).exif).toBeTruthy(); // fixture really has EXIF
    const r = await upload.POST(form(src, src));
    expect(r.status).toBe(200);
    expect(state.uploads).toHaveLength(2);
    for (const u of state.uploads) {
      expect(u.name.endsWith('.webp')).toBe(true);
      expect(u.contentType).toBe('image/webp');
      const meta = await sharp(u.body).metadata();
      expect(meta.format).toBe('webp');
      expect(meta.exif).toBeUndefined();
      expect(Math.max(meta.width!, meta.height!)).toBeLessThanOrEqual(2000);
    }
  });

  it('failed insert -> uploaded objects removed', async () => {
    state.insertError = { message: 'boom' };
    const src = await gpsJpeg();
    const r = await upload.POST(form(src, src));
    expect(r.status).toBe(500);
    expect(state.removed).toHaveLength(1);
    expect(state.removed[0]).toHaveLength(2);
  });
});
