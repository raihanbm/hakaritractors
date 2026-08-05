import { execFileSync } from 'node:child_process';
const files = ['assets/js/app.js', 'assets/js/runtime-config.js', 'scripts/dev-server.mjs', 'scripts/verify.mjs', 'scripts/audit-v4.mjs', 'scripts/lint.mjs'];
for (const file of files) execFileSync(process.execPath, ['--check', file], { stdio: 'inherit' });
console.log(`Static type/syntax check passed (${files.length} JavaScript files).`);
