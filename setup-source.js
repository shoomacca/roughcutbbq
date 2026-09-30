/**
 * Vercel install hook: pulls the full RoughCut BBQ source tree
 * (deployed out-of-band because it exceeds inline deploy limits)
 * and extracts it into the build root before npm install runs.
 */
const { execSync } = require('child_process');
const URL = 'https://yvavflxtjzlbatrqdyai.supabase.co/storage/v1/object/public/deploy/roughcut-source.tgz';
execSync(`curl -fsSL "${URL}" -o /tmp/roughcut-source.tgz`, { stdio: 'inherit' });
execSync('tar -xzf /tmp/roughcut-source.tgz -C .', { stdio: 'inherit' });
console.log('RoughCut source tree extracted OK');
