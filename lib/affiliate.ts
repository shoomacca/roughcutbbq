import { getSupabase } from './supabase';
import { AMAZON_TAG_KEY, DEFAULT_AMAZON_TAG, isValidAmazonTag, normalizeAmazonTag } from './amazon-tag';

/**
 * Amazon Associates tag handling (server-only: imports the service-key client).
 *
 * The tag lives in public.app_settings (key 'amazon_tag', edited at
 * /admin/settings). It is applied to every Amazon URL at the moment the URL
 * leaves the server (/go/[slug] redirect, /api/gear), so changing the setting
 * re-tags every link without touching the gear rows.
 */

export * from './amazon-tag';

// -- Settings read/write (short per-instance cache) --

const CACHE_MS = 60_000;
let cached: { tag: string; at: number } | null = null;

/**
 * Current Amazon tag. Falls back to DEFAULT_AMAZON_TAG if the table or row is
 * missing, the stored value is malformed, or the DB is unreachable, so links
 * never lose their tag. Cached for 60 s per server instance.
 */
export async function getAmazonTag(): Promise<string> {
  if (cached && Date.now() - cached.at < CACHE_MS) return cached.tag;
  let tag = DEFAULT_AMAZON_TAG;
  try {
    const { data, error } = await getSupabase()
      .from('app_settings')
      .select('value')
      .eq('key', AMAZON_TAG_KEY)
      .maybeSingle();
    const value = typeof data?.value === 'string' ? normalizeAmazonTag(data.value) : '';
    if (!error && isValidAmazonTag(value)) tag = value;
  } catch {
    // table missing / DB down: keep the default
  }
  cached = { tag, at: Date.now() };
  return tag;
}

/** Persist a new tag (caller validates) and refresh this instance's cache. */
export async function setAmazonTag(tag: string): Promise<void> {
  const { error } = await getSupabase()
    .from('app_settings')
    .upsert({ key: AMAZON_TAG_KEY, value: tag, updated_at: new Date().toISOString() }, { onConflict: 'key' });
  if (error) throw error;
  cached = { tag, at: Date.now() };
}

/** Test hook. */
export function clearAmazonTagCache(): void {
  cached = null;
}
