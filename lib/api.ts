import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import type { ZodType, ZodTypeDef } from 'zod';
import { isAdminRequest, SESSION_COOKIE, verifyToken } from './auth';

/**
 * Shared API guard layer (RC-1.4). Routes call these helpers instead of
 * re-implementing cookie -> token checks and ad-hoc body parsing.
 *
 * Pattern: every guard returns a `Guard<T>` - either `{ ok: true, ... }` or
 * `{ ok: false, res }` where `res` is the ready-to-return error Response.
 *
 *   const auth = await requireUser();
 *   if (!auth.ok) return auth.res;
 */

export { SESSION_COOKIE };
/** Default cap on a JSON request body. Oversize -> 400 `body_too_large`. */
export const DEFAULT_MAX_BODY_BYTES = 64 * 1024;

export type Guard<T> = ({ ok: true } & T) | { ok: false; res: NextResponse };

export interface SessionUser {
  userId: number;
  email: string;
}

type Schema<T> = ZodType<T, ZodTypeDef, unknown>;

export function errorResponse(status: number, code: string, extra?: Record<string, unknown>) {
  return NextResponse.json({ error: code, ...extra }, { status });
}

/** The logged-in user from the `session` cookie, or null. Never responds. */
export async function optionalUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const decoded = verifyToken(token);
  if (!decoded || !decoded.userId) return null;
  return { userId: decoded.userId, email: decoded.email };
}

/** 401 `unauthorized` unless a valid session cookie is present. */
export async function requireUser(): Promise<Guard<{ user: SessionUser }>> {
  const user = await optionalUser();
  if (!user) return { ok: false, res: errorResponse(401, 'unauthorized') };
  return { ok: true, user };
}

/** 401 `unauthorized` unless isAdminRequest() (admin_token cookie or allow-listed session). */
export async function requireAdmin(): Promise<Guard<object>> {
  if (!(await isAdminRequest())) return { ok: false, res: errorResponse(401, 'unauthorized') };
  return { ok: true };
}

/** Validate already-parsed input (JSON, multipart text fields, query, params). */
export function validate<T>(schema: Schema<T>, input: unknown): Guard<{ data: T }> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    const fields = parsed.error.issues.map((i) => i.path.join('.') || '(root)');
    return { ok: false, res: errorResponse(400, 'invalid_input', { fields }) };
  }
  return { ok: true, data: parsed.data };
}

/**
 * Parse a JSON body with a size cap and a zod schema.
 * Bad JSON or schema failure -> 400 `invalid_input` (with `fields`);
 * oversize (content-length or measured text) -> 400 `body_too_large`.
 */
export async function parseBody<T>(
  req: Request,
  schema: Schema<T>,
  opts: { maxBytes?: number } = {}
): Promise<Guard<{ data: T }>> {
  const maxBytes = opts.maxBytes ?? DEFAULT_MAX_BODY_BYTES;
  const tooLarge = () => ({ ok: false as const, res: errorResponse(400, 'body_too_large') });

  const declared = Number(req.headers.get('content-length'));
  if (Number.isFinite(declared) && declared > maxBytes) return tooLarge();

  let text: string;
  try {
    text = await req.text();
  } catch {
    return { ok: false, res: errorResponse(400, 'invalid_input') };
  }
  if (Buffer.byteLength(text, 'utf8') > maxBytes) return tooLarge();

  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return { ok: false, res: errorResponse(400, 'invalid_input') };
  }
  return validate(schema, json);
}

/** Parse URL query params with a zod schema. Failure -> 400 `invalid_input`. */
export function parseQuery<T>(url: string, schema: Schema<T>): Guard<{ data: T }> {
  return validate(schema, Object.fromEntries(new URL(url).searchParams));
}
