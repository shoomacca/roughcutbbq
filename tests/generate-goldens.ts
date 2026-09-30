// Regenerate on purpose: npm run test:update-goldens
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { buildGoldens } from './golden-shape';

const file = path.join(__dirname, '__golden__', 'engine.json');
const goldens = buildGoldens();
writeFileSync(file, JSON.stringify(goldens, null, 2) + '\n');
console.log(`Wrote ${Object.keys(goldens).length} golden entries to ${file}`);
