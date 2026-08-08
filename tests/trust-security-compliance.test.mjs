import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const read = file => readFileSync(join(root, file), 'utf8');
const publicPathExists = href => {
  const path = href.split(/[?#]/)[0];
  if (!path || path === '/') return existsSync(join(root, 'index.html'));
  const relative = path.replace(/^\//, '');
  return existsSync(join(root, relative)) || existsSync(join(root, `${relative}.html`)) || existsSync(join(root, relative, 'index.html'));
};
const trustRoutes = ['about', 'contact', 'privacy-policy', 'terms-and-conditions', 'shipping-policy', 'returns-and-refunds', 'warranty', 'help-center'];
const discoveryRoutes = ['cara-cari-sparepart-kubota', 'tractor-parts-rfq-indonesia-international'];
const crawlableRoutes = [...trustRoutes, ...discoveryRoutes];

test('trust and discovery pages are crawlable static documents with unique metadata and correct canonical URLs', () => {
  const seenTitles = new Set();
  const seenDescriptions = new Set();
  for (const route of crawlableRoutes) {
    const html = read(`${route}/index.html`);
    assert.match(html, /<main id="main"/);
    const title = html.match(/<title>([^<]+)<\/title>/)?.[1];
    const description = html.match(/<meta name="description" content="([^"]+)"/)?.[1];
    assert.ok(title, `${route} requires a title`);
    assert.ok(description, `${route} requires a meta description`);
    assert.ok(!seenTitles.has(title), `${route} requires a unique title`);
    assert.ok(!seenDescriptions.has(description), `${route} requires a unique description`);
    seenTitles.add(title); seenDescriptions.add(description);
    assert.match(html, new RegExp(`<link rel="canonical" href="https://hikaritractors\\.com/${route}">`));
    for (const property of ['og:type', 'og:title', 'og:description', 'og:url', 'og:image', 'og:image:width', 'og:image:height']) assert.match(html, new RegExp(`property="${property}"`));
    assert.match(html, /name="twitter:card" content="summary_large_image"/);
    assert.doesNotMatch(html, /noindex/i, `${route} must stay indexable`);
  }
});

test('homepage has canonical social metadata and a public absolute Open Graph image', () => {
  const html = read('index.html');
  for (const fragment of [
    '<link rel="canonical" href="https://hikaritractors.com/">',
    'property="og:title"', 'property="og:description"', 'property="og:url"',
    'property="og:image" content="https://hikaritractors.com/assets/images/og-hikari-tractors.jpg"',
    'property="og:image:width" content="1200"', 'property="og:image:height" content="630"',
    'name="twitter:card" content="summary_large_image"'
  ]) assert.ok(html.includes(fragment), `homepage metadata missing: ${fragment}`);
  assert.ok(statSync(join(root, 'assets/images/og-hikari-tractors.jpg')).size > 10_000, 'OG image must be a real public asset');
});

test('robots and sitemap expose public trust routes while keeping administrative paths out', () => {
  const robots = read('robots.txt');
  const sitemap = read('sitemap.xml');
  assert.match(robots, /Allow: \/\n/);
  assert.match(robots, /Disallow: \/api\//);
  assert.match(robots, /Sitemap: https:\/\/hikaritractors\.com\/sitemap\.xml/);
  for (const route of crawlableRoutes) assert.match(sitemap, new RegExp(`<loc>https://hikaritractors\\.com/${route}</loc>`));
  assert.doesNotMatch(sitemap, /\/api\/|preview|localhost|vercel\.app/i);
});

test('public internal links resolve to a concrete static route and blank anchors are absent', () => {
  for (const file of ['index.html', ...crawlableRoutes.map(route => `${route}/index.html`)]) {
    const html = read(file);
    assert.doesNotMatch(html, /href=["']#["']/i, `${file} contains a blank anchor`);
    for (const href of html.matchAll(/href="([^"]+)"/g)) {
      const value = href[1];
      if (/^(https?:\/\/|mailto:|tel:|#)/i.test(value) || value.startsWith('/#')) continue;
      assert.ok(publicPathExists(value), `${file} links to missing ${value}`);
    }
  }
});

test('RFQ client contract includes bounded fields, privacy-safe honeypot, and no payment badge claim', () => {
  const html = read('index.html');
  const app = read('assets/js/app.js');
  assert.match(html, /id="rfqWebsite"/);
  assert.match(html, /id="rfqName"[^>]*maxlength="120"/);
  assert.match(html, /id="rfqEmail"[^>]*maxlength="254"/);
  assert.match(html, /id="rfqDestination"[^>]*maxlength="160"/);
  assert.match(html, /id="rfqNote"[^>]*maxlength="2000"/);
  assert.match(app, /const emailValid/);
  assert.match(app, /const website =/);
  assert.match(app, /website,/);
  assert.doesNotMatch(html, /<span>VISA<\/span>|<span>AMEX<\/span>|<span>PayPal<\/span>/i);
  assert.match(html, /Independent supplier/);
  assert.doesNotMatch(html, /GENUINE KUBOTA PARTS|WORLDWIDE SHIPPING/i);
  assert.doesNotMatch(app, /OFFICIAL DIAGRAM/);
  assert.doesNotMatch(app, /ipapi\.co/);
  const preview = read('LIVE-PREVIEW.html');
  assert.match(preview, /name="robots" content="noindex, nofollow, noarchive"/);
});

test('discovery guides expose truthful structured data and an AI-readable route index', () => {
  for (const route of discoveryRoutes) {
    const html = read(`${route}/index.html`);
    assert.match(html, /"@type":"Article"/);
    assert.match(html, /"@type":"FAQPage"/);
    assert.match(html, /Independent supplier notice/);
    assert.match(html, /tidak dipresentasikan|not presented as an official Kubota/i);
  }
  const llms = read('llms.txt');
  for (const route of discoveryRoutes) assert.match(llms, new RegExp(`https://hikaritractors\\.com/${route}`));
  assert.match(llms, /not presented as an official Kubota website/i);
});

test('deployment configuration uses transparent canonical redirect, security headers, and publishes required public documents', () => {
  const apache = read('.htaccess');
  const vercel = read('vercel.json');
  const cpanel = read('.cpanel.yml');
  for (const expected of ['404.html', 'sitemap.xml', 'llms.txt', 'about contact privacy-policy terms-and-conditions shipping-policy returns-and-refunds warranty help-center cara-cari-sparepart-kubota tractor-parts-rfq-indonesia-international']) assert.ok(cpanel.includes(expected), `cPanel deploy missing ${expected}`);
  assert.match(apache, /HTTP_HOST} !\^hikaritractors\\\.com\$/);
  assert.match(apache, /https:\/\/hikaritractors\.com%\{REQUEST_URI\}/);
  for (const header of ['Content-Security-Policy', 'Strict-Transport-Security', 'X-Content-Type-Options', 'Referrer-Policy', 'Permissions-Policy', "frame-ancestors 'none'"]) assert.ok(apache.includes(header), `Apache missing ${header}`);
  assert.match(vercel, /www\.hikaritractors\.com/);
  assert.match(vercel, /Strict-Transport-Security/);
});
