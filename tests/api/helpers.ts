/** Mutable cookie jar backing the mocked `next/headers` cookies(). */
export const jar = new Map<string, string>();

export function setCookies(c: Record<string, string>) {
  jar.clear();
  for (const [k, v] of Object.entries(c)) jar.set(k, v);
}

export const headersMock = {
  cookies: async () => ({
    get: (name: string) => (jar.has(name) ? { name, value: jar.get(name)! } : undefined),
    set: (name: string, value: string) => void jar.set(name, value),
    delete: (name: string) => void jar.delete(name),
  }),
};

export function json(url: string, method: string, body: unknown, headers: Record<string, string> = {}) {
  return new Request(url, {
    method,
    headers: { 'content-type': 'application/json', ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}
