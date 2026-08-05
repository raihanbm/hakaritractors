import { readFile, writeFile, stat, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => readFile(path.join(root, relative), 'utf8');
const json = async (relative) => JSON.parse(await read(relative));

async function walk(directory) {
  const rows = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) rows.push(...await walk(full));
    else rows.push(full);
  }
  return rows;
}

const [html, css, app, runtimeConfig, robots, catalog, sheetIndex, sheetSearch, control] = await Promise.all([
  read('index.html'), read('assets/css/main.css'), read('assets/js/app.js'), read('assets/js/runtime-config.js'), read('robots.txt'),
  json('assets/data/drive-catalog.json'), json('assets/data/sheets-index.json'),
  json('assets/data/sheets-search.json'), json('assets/data/catalog-control-state.json')
]);
const files = await walk(root);
const totalBytes = (await Promise.all(files.map((file) => stat(file)))).reduce((sum, info) => sum + info.size, 0);
const inlineHandler = /<[^>]*\son(?:click|change|input|submit|load|error)\s*=/i;
const models = [...new Set(catalog.products.map((product) => product.model))].sort();
const categories = [...new Set(catalog.products.map((product) => product.category))].sort();
const partRows = catalog.products.reduce((sum, product) => sum + Number(product.partCount || 0), 0);
const staticIds = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
const secretPattern = /SUPABASE_SERVICE_ROLE_KEY|service[_-]?role|sk-[A-Za-z0-9_-]{16,}|eyJhbGci[A-Za-z0-9_-]+/i;
const checks = {
  storefrontV4Assets: html.includes('main.css?v=storefront-v4') && html.includes('app.js?v=storefront-v4'),
  noInlineEventHandlers: !inlineHandler.test(html) && !inlineHandler.test(app),
  uniqueStaticElementIds: staticIds.length === new Set(staticIds).size,
  noEmbeddedSecretMarkers: !secretPattern.test(`${html}\n${app}\n${runtimeConfig}`),
  robotsAllowsHomepage: /Allow:\s*\//i.test(robots) && !/Disallow:\s*\/$/im.test(robots),
  catalogAndSheetIndexAligned: catalog.products.length === Object.keys(sheetIndex).length,
  searchIndexPresent: Object.keys(sheetSearch.partNumbers || {}).length > 0 && Object.keys(sheetSearch.sheets || {}).length > 0,
  modelFirstNavigation: html.includes('SHOP BY TRACTOR MODEL') && app.includes('state.models = [...new Set'),
  diagramPartsTable: app.includes('Parts List') && app.includes('data-add-part'),
  rfqSubmissionAndFallback: app.includes('/api/public-orders') && app.includes('RFQ draft prepared'),
  adminControlMapping: app.includes('applyControlState') && app.includes('applySheetControls'),
  fiveMinuteRefresh: app.includes('300_000') && app.includes('visibilitychange'),
  responsiveBreakpoints: css.includes('@media(max-width:820px)') && css.includes('@media(max-width:520px)'),
  allCatalogRowsHaveImages: catalog.products.every((product) => product.previewImage && product.fullImage),
  allCatalogRowsHaveParts: catalog.products.every((product) => Number(product.partCount) > 0)
};
const passed = Object.values(checks).filter(Boolean).length;
const report = {
  generatedAt: new Date().toISOString(),
  release: 'storefront-v4',
  status: passed === Object.keys(checks).length ? 'PASS' : 'REVIEW',
  checks: { passed, total: Object.keys(checks).length, details: checks },
  inventory: {
    files: files.length,
    bytes: totalBytes,
    assemblyDiagrams: catalog.products.length,
    sheetMetadataRecords: Object.keys(sheetIndex).length,
    orderablePartRows: partRows,
    models,
    categories: categories.length,
    partNumberIndexKeys: Object.keys(sheetSearch.partNumbers || {}).length,
    controlledProducts: (control.products || []).length,
    controlledPartEntries: Object.keys(control.parts || {}).length
  },
  knownProductionConnections: [
    'Replace phone, email and currency values in assets/js/runtime-config.js.',
    'Confirm catalogApiBase and its public-catalog, public-media and public-orders routes.',
    'Connect customer authentication; current account button is an explicit placeholder.',
    'Connect newsletter endpoint; current form only shows an honest local notice.',
    'Add analytics/consent only after selecting the production provider.',
    'Perform final visual QA in a normal browser at desktop, tablet and mobile widths.'
  ]
};
const output = path.join(root, 'docs/hermes/AUDIT_SUMMARY.json');
await writeFile(output, `${JSON.stringify(report, null, 2)}\n`);
console.log(`Storefront v4 audit: ${report.status} (${passed}/${Object.keys(checks).length} checks)`);
console.log(`Catalog: ${catalog.products.length} diagrams, ${partRows.toLocaleString()} part rows, ${models.length} models`);
console.log(`Wrote ${path.relative(root, output)}`);
