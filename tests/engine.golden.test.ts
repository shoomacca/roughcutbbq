import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { buildGoldens } from './golden-shape';

// Compares against the committed file. Never regenerates: use `npm run test:update-goldens`.
const golden = JSON.parse(
  readFileSync(path.join(__dirname, '__golden__', 'engine.json'), 'utf8')
) as ReturnType<typeof buildGoldens>;
const current = buildGoldens();

describe('engine goldens (calculateCook, every cut x method x 1/3/6 kg)', () => {
  it('covers the same set of cut/method/weight keys', () => {
    expect(Object.keys(current).sort()).toEqual(Object.keys(golden).sort());
  });

  it.each(Object.keys(golden))('%s', (key) => {
    expect(current[key]).toEqual(golden[key]);
  });
});
