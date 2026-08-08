import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

test('storefront keeps the approved pixel-exact production shell with current cache markers', async () => {
  const html = await read('index.html');
  assert.match(html, /assets\/css\/main\.css\?v=hikari-parts-illustrations-v10/);
  assert.match(html, /assets\/css\/pixel-exact-home\.css\?v=hikari-parts-illustrations-v10/);
  assert.match(html, /assets\/js\/app\.js\?v=hikari-parts-illustrations-v10/);
  assert.doesNotMatch(html, /preview-data\.js/);
  for (const id of ['globalSearchForm', 'modelStripLinks', 'app', 'cartDrawer', 'modalBackdrop']) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
  assert.match(html, /SHOP BY TRACTOR MODEL/);
  assert.match(html, /Request a Quote \(RFQ\)/);
});

test('responsive catalog and diagram layouts match the approved dense marketplace direction', async () => {
  const css = await read('assets/css/main.css');
  assert.match(css, /\.catalog-layout\{[^}]*grid-template-columns:218px minmax\(0,1fr\)/);
  assert.match(css, /\.assembly-grid\{[^}]*grid-template-columns:repeat\(4,minmax\(0,1fr\)/);
  assert.match(css, /\.detail-grid\{[^}]*grid-template-columns:minmax\(0,1\.12fr\) minmax\(500px,\.88fr\)/);
  assert.match(css, /\.parts-table\{/);
  assert.match(css, /\.hero-search-panel\{/);
  assert.match(css, /@media\(max-width:820px\)[\s\S]*?\.assembly-grid\{grid-template-columns:repeat\(2,1fr\)/);
  assert.match(css, /@media\(max-width:520px\)[\s\S]*?\.assembly-grid\{grid-template-columns:1fr/);
  assert.match(css, /@media\(max-width:520px\)[\s\S]*?\.brand span\{display:none\}/);
});

test('storefront remains one coherent stylesheet without stale card overrides', async () => {
  const css = await read('assets/css/main.css');
  for (const selector of ['.product-card', '.product-card-image', '.product-info', '.detail-grid']) {
    assert.ok(css.includes(selector), `${selector} should be owned by main.css`);
  }
});

test('published diagram and PDF assets stay on the storefront instead of a lagging API proxy', async () => {
  const js = await read('assets/js/app.js');
  assert.match(js, /assets\/diagrams\//);
  assert.match(js, /assets\/documents\//);
});

test('catalog uses clean parts illustrations with inline filters and no fake gallery or list mode', async () => {
  const html = await read('index.html');
  const js = await read('assets/js/app.js');
  const css = await read('assets/css/main.css');
  const cropScript = await read('scripts/generate-card-diagram-crops.py');
  assert.match(html, />Parts Illustrations</);
  assert.doesNotMatch(html, /data-nav="catalog">Parts <svg/);
  assert.match(js, /showAllModels/);
  assert.match(js, /data-toggle-models/);
  assert.match(js, /data-toggle-categories/);
  assert.doesNotMatch(js, /id="listViewButton"/);
  assert.doesNotMatch(js, /class="diagram-nav/);
  assert.doesNotMatch(js, /class="diagram-thumbs/);
  assert.match(js, /ILUSTRASI KOMPONEN/);
  assert.match(js, /Download Source PDF/);
  assert.match(css, /\.product-card-image img\{[^}]*object-fit:contain!important/);
  assert.match(css, /\.diagram-stage img\{[^}]*object-fit:contain/);
  assert.match(cropScript, /CANVAS = \(760, 420\)/);
  assert.match(cropScript, /product\.get\("fullImage"\)/);
});

test('Indonesian homepage localizes hero and trust copy instead of mixing English', async () => {
  const js = await read('assets/js/app.js');
  const css = await read('assets/css/pixel-exact-home.css');
  for (const source of [
    'Find Kubota tractor parts.',
    'Order with confidence.',
    'Browse Parts Catalog',
    'Search Part Number',
    'Model & part references',
    'Freight by quotation',
    'Fitment support',
    'RFQ-based ordering'
  ]) {
    assert.match(js, new RegExp(`'${source.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}':\\s*'[^']+'`), `${source} needs curated Indonesian copy`);
  }
  assert.match(css, /\.px-hero-copy\{[^}]*top:18px/);
  assert.match(css, /\.px-hero-copy p\{[^}]*margin:6px 0 8px/);
  assert.match(css, /\.px-hero-actions button\{[^}]*white-space:nowrap/);
});

test('API catalog presentation is overlaid with stable static card previews', async () => {
  const js = await read('assets/js/app.js');
  assert.match(js, /function applyStaticPreviewImages\(/);
  assert.match(js, /applyStaticPreviewImages\(localCatalog\)/);
  assert.match(js, /model\.startsWith\('l4018dt'\)/);
  assert.match(js, /model.*diagramCode|diagramCode.*model/);
});

test('card crop detects the parts-table boundary instead of using one fixed cutoff', async () => {
  const cropScript = await read('scripts/generate-card-diagram-crops.py');
  assert.match(cropScript, /def detect_table_top\(/);
  assert.match(cropScript, /table_top = detect_table_top\(page\)/);
  assert.doesNotMatch(cropScript, /round\(height \* 0\.52\)/);
});

test('source PDF actions open real PDFs in a new tab and never fall back to WEBP downloads', async () => {
  const js = await read('assets/js/app.js');
  assert.match(js, /function openSourcePdf\(\)/);
  assert.match(js, /window\.open\(href, '_blank', 'noopener,noreferrer'\)/);
  const sourcePdfFunction = js.match(/function openSourcePdf\(\) \{[\s\S]*?\n  \}/)?.[0] || '';
  assert.doesNotMatch(sourcePdfFunction, /sheet\.full_image|sheet\.preview_image/);
  assert.doesNotMatch(sourcePdfFunction, /\.download\s*=/);
  assert.match(js, /id="openPdfSource"[^>]*aria-label="Open source PDF in new tab"/);
  assert.match(js, /id="openSourcePdf"/);
  assert.match(js, /previewImageUrl\(product\)/);
});

test('every published tractor assembly has a real static PDF source', async () => {
  const catalog = JSON.parse(await read('assets/data/drive-catalog.json'));
  assert.equal(catalog.products.length, 1664);
  for (const product of catalog.products) {
    assert.match(product.pdfUrl || '', /^assets\/documents\/.+\.pdf$/i, `${product.model} ${product.diagramCode} needs a PDF URL`);
    const pdf = await readFile(new URL(product.pdfUrl, root));
    assert.equal(pdf.subarray(0, 5).toString('ascii'), '%PDF-', `${product.pdfUrl} must be a real PDF`);
  }
});

test('parts table keeps price visible in a compact part-name cell', async () => {
  const js = await read('assets/js/app.js');
  const css = await read('assets/css/main.css');
  assert.match(js, /const priceLabel = Number\(part\.estimated_usd\)/);
  assert.match(js, /class="part-price"/);
  assert.match(css, /\.part-price\{/);
  assert.match(css, /\.part-name>span\{[^}]*text-overflow:ellipsis/);
});

test('homepage SEO identifies Hikari Tractors Indonesia and Kubota references safely', async () => {
  const html = await read('index.html');
  assert.match(html, /<title>Hikari Tractors Indonesia \| Kubota Tractor Parts Reference<\/title>/);
  assert.match(html, /Find Kubota tractor parts by model, part number, and exploded diagram/);
  assert.match(html, /Hikari Tractors Indonesia/);
  assert.match(html, /assets\/images\/hikari-logo\.png/);
  assert.match(html, /application\/ld\+json/);
  assert.doesNotMatch(html, /100% Genuine|Official Kubota|Authorized Kubota/);
});

test('mobile navigation escapes the hidden desktop header and closes predictably', async () => {
  const css = await read('assets/css/pixel-exact-home.css');
  const mainCss = await read('assets/css/main.css');
  const js = await read('assets/js/app.js');
  assert.match(css, /@media\(max-width:760px\)[\s\S]*?\.header-nav-wrap\{display:block!important/);
  assert.match(css, /\.main-nav\.open\{position:fixed!important;top:56px!important/);
  assert.match(mainCss, /@media\(max-width:760px\)[\s\S]*?\.parts-table\{min-width:0!important;width:100%;table-layout:fixed!important/);
  assert.match(mainCss, /\.parts-table th:nth-child\(8\),\.parts-table td:nth-child\(8\)\{width:52px/);
  assert.match(js, /const setMobileNav = open =>/);
  assert.match(js, /setMobileNav\(false\); if \(parseRoute\(\)\.name !== 'home'\)/);
});

test('mobile buyer homepage uses sorted models, real tractor icons, and no clipped horizontal strips', async () => {
  const js = await read('assets/js/app.js');
  const css = await read('assets/css/pixel-exact-home.css');
  const catalog = JSON.parse(await read('assets/data/drive-catalog.json'));
  const models = [...new Set(catalog.products.map((product) => product.model))].sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
  assert.deepEqual(models.slice(0, 6), ['L3218DT-ID', 'L3608', 'L3800D', 'L4018DT-ID/L4018TK-ID', 'L4028', 'L4400DT']);
  assert.match(js, /function modelSortKey\(/);
  assert.match(js, /function tractorIconForModel\(/);
  assert.match(js, /assets\/images\/tractor-icons\/tractor-icon-/);
  assert.doesNotMatch(js, /assets\/images\/tractor-card\.webp/);
  assert.match(css, /@media\(max-width:760px\)[\s\S]*?\.px-model-strip\{display:grid;grid-template-columns:repeat\(2,minmax\(0,1fr\)\);overflow:visible/);
  assert.match(css, /@media\(max-width:760px\)[\s\S]*?\.px-product-strip\{display:grid;grid-template-columns:1fr;overflow:visible/);
  assert.match(css, /@media\(max-width:760px\)[\s\S]*?\.px-diagram-strip\{display:grid;grid-template-columns:1fr;overflow:visible/);
});

test('homepage model picker uses one clear all-models CTA and never wraps a duplicate model card', async () => {
  const [js, css] = await Promise.all([
    read('assets/js/app.js'),
    read('assets/css/pixel-exact-home.css'),
  ]);
  assert.match(js, /models\.slice\(0, 6\)\.map/);
  assert.match(js, /<div class="px-section-title"><h2>Pilih Model Traktor<\/h2><button type="button" data-all-models>Lihat Semua/);
  assert.doesNotMatch(js, /px-model-more/);
  assert.doesNotMatch(css, /\.px-model-more/);
});
