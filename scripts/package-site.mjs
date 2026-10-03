// Upload package for roughcut.com.au (RC-13.6; plan: .planning/HOME-AND-SITE-PLAN.md §5).
//
//   npm run site:package            ->  builds site/dist, then writes OUTSIDE the repo:
//     ../_upload/roughcut.com.au-<date>/        unzipped copy of site/dist (incl. hidden .htaccess)
//     ../_upload/roughcut.com.au-<date>.zip     the same files at the ZIP ROOT (not nested in a folder)
//     ../_upload/README-UPLOAD.md               copy of site/README-UPLOAD.md (the owner's steps)
//
//   node scripts/package-site.mjs [YYYY-MM-DD]  (date defaults to today, local time)
//
// Why outside the repo: `npm run site:build` wipes site/dist, so a package kept inside it would
// vanish on the next build. Why our own zip writer: Node has no zip in the standard library,
// PowerShell's Compress-Archive and bsdtar differ per machine, and the owner uploads the one zip
// to Hostinger File Manager and presses Extract, so the entries MUST sit at the zip root and MUST
// include the dot-file. Node built-ins only (zlib deflate, CRC-32 computed here). Deterministic:
// entries sorted, timestamps from the files themselves.

import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync, copyFileSync } from 'node:fs';
import { join, dirname, relative, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { deflateRawSync } from 'node:zlib';
import { execFileSync } from 'node:child_process';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'site', 'dist');
const README = join(ROOT, 'site', 'README-UPLOAD.md');
export const UPLOAD_DIR = join(ROOT, '..', '_upload');

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// ── zip writer ─────────────────────────────────────────────────────────────────────────────────

const CRC_TABLE = new Uint32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
export function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function dosDateTime(mtime) {
  const d = new Date(mtime);
  const time = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1);
  const date = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
  return { time, date };
}

/** All files under `dir`, as forward-slash paths relative to it, sorted. Dot-files included. */
export function listFiles(dir, base = dir) {
  const out = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const abs = join(dir, e.name);
    if (e.isDirectory()) out.push(...listFiles(abs, base));
    else out.push(relative(base, abs).split(sep).join('/'));
  }
  return out.sort();
}

/** Build a zip (deflate) of `files` (relative paths) rooted at `dir`. Returns the zip as a Buffer. */
export function zipDirectory(dir, files = listFiles(dir)) {
  const locals = [];
  const centrals = [];
  let offset = 0;
  for (const rel of files) {
    const abs = join(dir, rel);
    const data = readFileSync(abs);
    const { time, date } = dosDateTime(statSync(abs).mtime);
    const name = Buffer.from(rel, 'utf8');
    const crc = crc32(data);
    const deflated = deflateRawSync(data, { level: 9 });
    const method = deflated.length < data.length ? 8 : 0;
    const body = method === 8 ? deflated : data;

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4); // version needed: 2.0
    local.writeUInt16LE(0x0800, 6); // flags: UTF-8 names
    local.writeUInt16LE(method, 8);
    local.writeUInt16LE(time, 10);
    local.writeUInt16LE(date, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(body.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(name.length, 26);
    local.writeUInt16LE(0, 28);
    locals.push(local, name, body);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(0x0314, 4); // made by: UNIX, zip 2.0 (so Extract keeps plain file modes)
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0x0800, 8);
    central.writeUInt16LE(method, 10);
    central.writeUInt16LE(time, 12);
    central.writeUInt16LE(date, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(body.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt16LE(0, 30); // extra
    central.writeUInt16LE(0, 32); // comment
    central.writeUInt16LE(0, 34); // disk
    central.writeUInt16LE(0, 36); // internal attrs
    central.writeUInt32LE((0o100644 << 16) >>> 0, 38); // external attrs: -rw-r--r-- (>>> 0: unsigned)
    central.writeUInt32LE(offset, 42);
    centrals.push(central, name);

    offset += local.length + name.length + body.length;
  }
  const cd = Buffer.concat(centrals);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(cd.length, 12);
  end.writeUInt32LE(offset, 16);
  end.writeUInt16LE(0, 20);
  return Buffer.concat([...locals, cd, end]);
}

/** Read back a zip's central directory: [{ name, size, compressed, method }]. Used for the proof listing. */
export function listZip(buf) {
  const eocd = buf.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  if (eocd < 0) throw new Error('not a zip: no end-of-central-directory record');
  const count = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);
  const out = [];
  for (let i = 0; i < count; i++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) throw new Error(`bad central header at ${p}`);
    const method = buf.readUInt16LE(p + 10);
    const compressed = buf.readUInt32LE(p + 20);
    const size = buf.readUInt32LE(p + 24);
    const n = buf.readUInt16LE(p + 28);
    const extra = buf.readUInt16LE(p + 30);
    const comment = buf.readUInt16LE(p + 32);
    out.push({ name: buf.toString('utf8', p + 46, p + 46 + n), size, compressed, method });
    p += 46 + n + extra + comment;
  }
  return out;
}

// ── main ───────────────────────────────────────────────────────────────────────────────────────

export function packageSite(date = today()) {
  if (!existsSync(join(DIST, 'index.html')) || !existsSync(join(DIST, '.htaccess'))) {
    throw new Error('site/dist is incomplete: run `npm run site:build` first (site:package does this for you)');
  }
  if (!existsSync(README)) throw new Error(`missing ${README}`);

  const folder = join(UPLOAD_DIR, `roughcut.com.au-${date}`);
  const zipPath = `${folder}.zip`;
  mkdirSync(UPLOAD_DIR, { recursive: true });
  rmSync(folder, { recursive: true, force: true });
  cpSync(DIST, folder, { recursive: true });

  const files = listFiles(DIST);
  const zip = zipDirectory(DIST, files);
  writeFileSync(zipPath, zip);
  copyFileSync(README, join(UPLOAD_DIR, 'README-UPLOAD.md'));

  // Prove the zip: every dist file present, at the root, nothing else, .htaccess included.
  const entries = listZip(zip).map((e) => e.name).sort();
  const missing = files.filter((f) => !entries.includes(f));
  const extra = entries.filter((e) => !files.includes(e));
  if (missing.length || extra.length) throw new Error(`zip mismatch: missing ${missing} extra ${extra}`);
  if (!entries.includes('.htaccess')) throw new Error('zip has no .htaccess');
  if (entries.some((e) => e.startsWith('dist/') || e.startsWith('/'))) throw new Error('zip entries are nested');

  return { folder, zipPath, files, zipBytes: zip.length, readme: join(UPLOAD_DIR, 'README-UPLOAD.md') };
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  // Always build first so the package can never be older than the sources.
  execFileSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'site:build'], { stdio: 'inherit', cwd: ROOT, shell: process.platform === 'win32' });
  const r = packageSite(process.argv[2]);
  const kb = (n) => `${(n / 1024).toFixed(1)} KB`;
  console.log(`\nsite:package ->`);
  console.log(`  folder : ${r.folder}`);
  console.log(`  zip    : ${r.zipPath}  (${r.files.length} files, ${kb(r.zipBytes)})`);
  console.log(`  readme : ${r.readme}`);
  console.log(`\nzip listing (entries at the zip root):`);
  for (const e of listZip(readFileSync(r.zipPath))) console.log(`  ${String(e.size).padStart(8)}  ${e.name}`);
}
