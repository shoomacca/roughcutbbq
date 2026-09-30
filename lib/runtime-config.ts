/**
 * Server-only runtime configuration fallback.
 *
 * Environment variables ALWAYS take precedence. This module exists so a
 * deployment can carry its config when dashboard env vars are unavailable.
 * The committed version of this file is empty — real values are injected
 * into the deployment payload only (never into the public repo/tarball).
 *
 * NEVER import this from a client component.
 */
export const RUNTIME_CONFIG: Record<string, string> = {};

export function cfg(key: string): string {
  return process.env[key] || RUNTIME_CONFIG[key] || '';
}
