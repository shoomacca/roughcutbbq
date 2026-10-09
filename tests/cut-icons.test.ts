import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import meats from '@/data/meats.json';

// Every cut and category in meats.json must have its own entry in the icon tables,
// otherwise the wizard silently falls back to a generic steak icon.
const src = readFileSync('components/icons/BbqIcons.tsx', 'utf8');
const has = (table: string, id: string) =>
  new RegExp(`const ${table}[^=]*=\\s*\\{[\\s\\S]*?\\n\\s+${id}:`).test(src);

describe('icon coverage', () => {
  it('has an icon for every cut', () => {
    const missing = meats.flatMap((c) => c.cuts.map((k) => k.id)).filter((id) => !has('CUTS', id));
    expect(missing).toEqual([]);
  });
  it('has an icon for every category and method', () => {
    expect(meats.map((c) => c.id).filter((id) => !has('CATEGORIES', id))).toEqual([]);
    const methods = new Set(meats.flatMap((c) => c.cuts.flatMap((k) => k.methods)));
    expect([...methods].filter((id) => !has('METHODS', id))).toEqual([]);
  });
});
