import { z } from 'zod';
import { isValidAmazonTag, normalizeAmazonTag } from './amazon-tag';

/** Must match `CookingMethod` in types/calculator.ts. */
export const COOKING_METHODS = [
  'smoker', 'oven', 'rotisserie', 'dehydrator', 'kamado',
  'charcoal_kettle', 'wood_fire', 'slow_cooker', 'pressure_cooker',
] as const;
export const cookingMethod = z.enum(COOKING_METHODS);

/** Labels offered by the gallery UploadFlow dropdown (stored as-is in gallery_posts.method). */
export const GALLERY_METHOD_LABELS = [
  'Smoking', 'Pellet Grill', 'Charcoal Kettle', 'Kamado', 'Gas Grill', 'Oven',
] as const;
export const galleryMethod = z.union([cookingMethod, z.enum(GALLERY_METHOD_LABELS)]);

/** nanoid-like id (default nanoid alphabet), max 64 chars. */
export const postId = z.string().regex(/^[A-Za-z0-9_-]{1,64}$/);

/** Positive integer, accepted as a number or a digit string. */
export const positiveIntLike = z.union([
  z.number().int().positive(),
  z.string().regex(/^[0-9]{1,12}$/).transform(Number).pipe(z.number().int().positive()),
]);

const email = z.string().trim().max(254).email();

export const loginBody = z.object({ email, password: z.string().min(1).max(200) });
// NOTE: min length stays 6 here; RC-1.8 changes the policy.
export const signupBody = z.object({ email, password: z.string().min(6).max(200) });
export const adminLoginBody = z.object({ password: z.string().max(200) });

export const commentBody = z.object({
  postId,
  commentText: z.string().trim().min(1).max(1000),
});
export const postIdBody = z.object({ postId });
export const commentsQuery = z.object({ postId });

export const galleryQuery = z.object({
  method: z.string().max(40).optional(),
  cut: z.string().max(80).optional(),
  flagged: z.string().max(10).optional(),
});
export const uploadFields = z.object({
  cut: z.string().trim().min(1).max(80),
  method: galleryMethod,
  name: z.string().trim().max(80).nullable(),
  gearUsed: z.string().trim().max(200).nullable(),
});

export const gearQuery = z.object({
  category: z.string().max(60).optional(),
  limit: z.string().regex(/^[0-9]{1,4}$/).optional(),
});

export const MAX_RESULT_JSON_BYTES = 16 * 1024;
const cookFields = {
  method: cookingMethod,
  cutName: z.string().min(1).max(120),
  weightKg: z.number().min(0.1).max(30),
  categoryName: z.string().max(120).optional(),
};
const resultJsonCap = (cook: object) => JSON.stringify(cook).length <= MAX_RESULT_JSON_BYTES;
export const saveBody = z
  .object(cookFields)
  .passthrough()
  .refine(resultJsonCap, { message: 'result_json too large' });
/** Sync items that fail this are dropped (as before), not rejected. */
export const syncItem = z.object(cookFields).passthrough().refine(resultJsonCap);
export const syncBody = z.object({ cooks: z.array(z.unknown()).max(50) });
export const SYNC_MAX_BODY_BYTES = 1024 * 1024;

export const savePatchBody = z.object({
  saveId: positiveIntLike,
  rating: z.number().int().min(0).max(5).optional(),
  notes: z.string().max(2000).optional(),
});
export const saveDeleteQuery = z.object({ saveId: positiveIntLike });

const affiliateUrl = z
  .string()
  .max(2048)
  .refine((u) => u === '#' || /^https:\/\/\S+$/.test(u), 'https only');
export const gearCreateBody = z.object({
  slug: z.string().regex(/^[a-z0-9-]{1,80}$/),
  name: z.string().trim().min(1).max(120),
  category: z.string().trim().min(1).max(60),
  description: z.string().max(1000).nullable().optional(),
  affiliate_url: affiliateUrl,
  recommended_for: z.string().max(200).nullable().optional(),
  sort_order: z.number().int().optional(),
});
export const gearUpdateBody = gearCreateBody.partial().extend({ id: positiveIntLike });
export const gearDeleteQuery = z.object({ id: positiveIntLike });

export const unsubscribeQuery = z.object({ token: z.string().min(1).max(200) });
export const slugParam = z.object({ slug: z.string().min(1).max(200) });

// Admin settings (RC admin settings). Tag is trimmed + lowercased, then checked
// against the Amazon tracking-ID shape in lib/amazon-tag.ts.
export const settingsPutBody = z.object({
  amazon_tag: z
    .string()
    .max(64)
    .transform(normalizeAmazonTag)
    .refine(isValidAmazonTag, 'invalid_amazon_tag'),
});
