import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { cfg } from './runtime-config';

/**
 * Server-side Supabase client (service key — bypasses RLS).
 * Never import this from client components.
 */
let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!client) {
    const url = cfg('SUPABASE_URL') || cfg('NEXT_PUBLIC_SUPABASE_URL');
    const key = cfg('SUPABASE_SECRET_KEY') || cfg('SUPABASE_SERVICE_ROLE_KEY');
    if (!url || !key) {
      throw new Error('Missing SUPABASE_URL / SUPABASE_SECRET_KEY environment variables');
    }
    client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}

/** Public base URL for objects in the `gallery` storage bucket. */
export function galleryPublicUrl(objectName: string): string {
  const url = (cfg('SUPABASE_URL') || cfg('NEXT_PUBLIC_SUPABASE_URL')).replace(/\/$/, '');
  return `${url}/storage/v1/object/public/gallery/${objectName}`;
}
