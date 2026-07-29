import { readFile, readdir, stat } from 'node:fs/promises';
import { extname, join } from 'node:path';

const root = process.cwd();
const html = await readFile(join(root, 'index.html'), 'utf8');
const issues = [];
if (/data:image\//i.test(html)) issues.push('index.html still contains an embedded image');
if (/<style[\s>]/i.test(html)) issues.push('index.html still contains an embedded <style> block');
if (/<script(?![^>]*\bsrc=)[^>]*>/i.test(html)) issues.push('index.html still contains inline JavaScript');

const refs = [...html.matchAll(/(?:src|href)="([^"#][^"]*)"/g)].map(m => m[1]);
for (const ref of refs) {
  if (/^(https?:|mailto:|tel:|javascript:)/i.test(ref)) continue;
  const path = join(root, ref.replace(/^\//, ''));
  try { await stat(path); } catch { issues.push(`Missing local asset: ${ref}`); }
}

async function walk(dir) {
  const rows = [];
  for (const name of await readdir(dir)) {
    if (name === '.git') continue;
    const path = join(dir, name);
    const info = await stat(path);
    if (info.isDirectory()) rows.push(...await walk(path));
    else rows.push({path, size:info.size});
  }
  return rows;
}
const files = await walk(root);
const oversized = files.filter(f => f.size > 5 * 1024 * 1024);
for (const item of oversized) issues.push(`Asset exceeds 5 MiB: ${item.path.replace(root + '/', '')}`);

if (issues.length) {
  console.error('Verification failed:\n- ' + issues.join('\n- '));
  process.exit(1);
}
console.log(`Verification passed: ${files.length} files, no embedded images, no missing local assets.`);
