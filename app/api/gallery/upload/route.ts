import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { nanoid } from 'nanoid';
import { cookies } from 'next/headers';
import pool from '@/lib/db';
import { verifyToken } from '@/lib/auth';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'gallery');
const BASE_URL = 'https://app.roughcut.com.au/uploads/gallery';
const MAX_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];

function ext(file: File): string {
  return file.type.split('/')[1].replace('jpeg', 'jpg');
}

async function ensureBucketExists(supabaseUrl: string, supabaseKey: string, bucket: string) {
  try {
    const cleanUrl = supabaseUrl.replace(/\/$/, '');
    await fetch(`${cleanUrl}/storage/v1/bucket`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: bucket,
        name: bucket,
        public: true,
      }),
    });
  } catch (e) {
    console.error('Failed to ensure bucket exists:', e);
  }
}

async function uploadFile(file: File, filename: string): Promise<string> {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (supabaseUrl && supabaseKey) {
    const bucket = 'gallery';
    await ensureBucketExists(supabaseUrl, supabaseKey, bucket);

    const cleanUrl = supabaseUrl.replace(/\/$/, '');
    const uploadUrl = `${cleanUrl}/storage/v1/object/${bucket}/${filename}`;
    
    try {
      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': file.type,
        },
        body: Buffer.from(await file.arrayBuffer()),
      });

      if (response.ok) {
        return `${cleanUrl}/storage/v1/object/public/${bucket}/${filename}`;
      } else {
        console.error('Supabase upload failed:', await response.text());
      }
    } catch (e) {
      console.error('Error uploading to Supabase Storage:', e);
    }
  }

  // Fallback to local file system
  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(
    path.join(UPLOAD_DIR, filename),
    Buffer.from(await file.arrayBuffer())
  );
  return `${BASE_URL}/${filename}`;
}

export async function POST(req: Request) {
  const form = await req.formData();
  const before = form.get('before') as File | null;
  const after = form.get('after') as File | null;
  const cut = (form.get('cut') as string | null) ?? '';
  const method = (form.get('method') as string | null) ?? '';
  const name = (form.get('name') as string | null) || null;
  const gearUsed = (form.get('gearUsed') as string | null) || null;

  if (!before || !after || !cut || !method) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  for (const file of [before, after]) {
    if (!ALLOWED.includes(file.type)) {
      return NextResponse.json({ error: 'Images only (jpeg/png/webp)' }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'Max 10MB per image' }, { status: 400 });
    }
  }

  const postId = nanoid();

  const beforeFilename = `${postId}-before.${ext(before)}`;
  const afterFilename = `${postId}-after.${ext(after)}`;

  const beforeUrl = await uploadFile(before, beforeFilename);
  const afterUrl = await uploadFile(after, afterFilename);

  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session');
  let userId: number | null = null;
  if (sessionCookie) {
    const user = verifyToken(sessionCookie.value);
    if (user) {
      userId = user.userId;
    }
  }

  await pool.execute(
    `INSERT INTO gallery_posts (id, before_url, after_url, name, cut, method, gear_used, user_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [postId, beforeUrl, afterUrl, name, cut, method, gearUsed, userId]
  );

  return NextResponse.json({ ok: true, postId });
}
