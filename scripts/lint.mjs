import { readFile, stat } from 'node:fs/promises';
import { extname, join } from 'node:path';

const files = [
  'index.html', '404.html', 'robots.txt', 'sitemap.xml', 'vercel.json', '.htaccess',
  'assets/js/app.js', 'assets/js/runtime-config.js', 'assets/css/main.css', 'assets/css/trust-pages.css',
  'scripts/dev-server.mjs', 'scripts/verify.mjs', 'scripts/audit-v4.mjs',
  ...['about','contact','privacy-policy','terms-and-conditions','shipping-policy','returns-and-refunds','warranty','help-center'].map(route => `${route}/index.html`)
];
const failures = [];
for (const file of files) {
  try {
    const text = await readFile(file, 'utf8');
    if (/\u0000/.test(text)) failures.push(`${file}: NUL character`);
    if (extname(file) === '.html' && !/<!doctype html>/i.test(text)) failures.push(`${file}: missing doctype`);
    if (file.endsWith('.xml') && !/^<\?xml/.test(text)) failures.push(`${file}: invalid XML declaration`);
    if (file.endsWith('.js') || file.endsWith('.mjs')) await stat(file);
  } catch (error) { failures.push(`${file}: ${error.message}`); }
}
if (failures.length) { console.error(failures.join('\n')); process.exit(1); }
console.log(`Static lint passed (${files.length} audited source files).`);
