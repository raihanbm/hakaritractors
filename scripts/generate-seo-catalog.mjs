import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const ROOT = process.cwd();
const DOMAIN = 'https://hikaritractors.com';
const CATALOG_ROOT = join(ROOT, 'assets', 'data');
const OG_IMAGE = `${DOMAIN}/assets/images/og-hikari-tractors.jpg`;
const WHATSAPP_NUMBER = '6285287551869';

const readJson = async relative => JSON.parse(await readFile(join(ROOT, relative), 'utf8'));
const esc = value => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');
const jsonLd = value => JSON.stringify(value).replaceAll('<', '\\u003c');
const slugify = value => {
  const slug = String(value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'reference';
};
const partKey = value => String(value ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
const cleanTitle = value => String(value ?? '').replace(/\s+/g, ' ').trim();
const absoluteAsset = value => value ? `/${String(value).replace(/^\/+/, '')}` : '';
const modelPath = model => `/kubota-tractor-parts/${slugify(model)}/`;
const assemblyPath = (model, sheetId) => `${modelPath(model)}${slugify(sheetId)}/`;
const partPath = key => `/spare-parts/${key}/`;
const waLink = text => `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
const unique = values => [...new Set(values.filter(Boolean))];

const shell = ({ title, description, canonical, body, schema, breadcrumbs = [] }) => `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  <meta name="robots" content="index, follow, max-image-preview:large">
  <link rel="canonical" href="${canonical}">
  <link rel="icon" href="/assets/images/favicon.png" type="image/png">
  <meta property="og:type" content="website">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:image" content="${OG_IMAGE}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(title)}">
  <meta name="twitter:description" content="${esc(description)}">
  <meta name="twitter:image" content="${OG_IMAGE}">
  <link rel="stylesheet" href="/assets/css/seo-catalog.css?v=seo-catalog-v1">
  <script type="application/ld+json">${jsonLd(schema)}</script>
</head>
<body>
  <header class="seo-header">
    <div class="seo-container seo-header-inner">
      <a class="seo-brand" href="/">HIKARI TRACTORS <span>INDONESIA</span></a>
      <nav aria-label="Primary navigation">
        <a href="/">Home</a>
        <a href="/kubota-tractor-parts/">Kubota Parts</a>
        <a href="/cara-cari-sparepart-kubota/">Part Guide</a>
        <a href="/tractor-parts-rfq-indonesia-international/">International RFQ</a>
      </nav>
    </div>
  </header>
  <main class="seo-container">
    <nav class="seo-breadcrumbs" aria-label="Breadcrumb"><a href="/">Hikari Tractors Indonesia</a>${breadcrumbs.map(item => item.href ? `<span>/</span><a href="${item.href}">${esc(item.label)}</a>` : `<span>/</span><span>${esc(item.label)}</span>`).join('')}</nav>
    ${body}
  </main>
  <footer class="seo-footer">
    <div class="seo-container seo-footer-grid">
      <div><strong>Hikari Tractors Indonesia</strong><p>Independent supplier and catalog reference for Kubota tractor spare-part identification, diagram lookup, and quotation support.</p></div>
      <div><strong>Buyer support</strong><a href="/contact/">Contact Hikari</a><a href="/tractor-parts-rfq-indonesia-international/">Indonesia &amp; international RFQ</a><a href="${waLink('Hello Hikari Tractors Indonesia, I need help with a Kubota tractor spare part.')}">Ask via WhatsApp</a></div>
    </div>
    <div class="seo-container seo-disclosure">Catalog references do not by themselves confirm fitment, stock, price, freight, or delivery terms. These are checked through the RFQ process. Hikari is not presented as an official Kubota website or authorized dealer.</div>
  </footer>
</body>
</html>
`;

const breadcrumbSchema = items => ({
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, index) => ({ '@type': 'ListItem', position: index + 1, name: item.name, item: `${DOMAIN}${item.href}` }))
});

const makeSchema = (title, description, canonical, breadcrumbs, extra = {}) => ({
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: title,
  description,
  url: canonical,
  isPartOf: { '@type': 'WebSite', name: 'Hikari Tractors Indonesia', url: `${DOMAIN}/` },
  breadcrumb: breadcrumbSchema(breadcrumbs),
  ...extra
});

const rowHtml = (part, partHref) => `<tr><td>${esc(part.callout || '—')}</td><td><a href="${partHref}"><strong>${esc(part.part_number || 'Reference by quotation')}</strong></a></td><td>${esc(part.name || 'Kubota tractor spare part')}</td><td>${esc(part.quantity || 1)}</td><td>${esc(part.notes || 'Fitment and availability confirmed through RFQ.')}</td></tr>`;

const modelBody = ({ model, sheets }) => {
  const title = `Kubota ${model} Tractor Spare Parts Catalog | Hikari Tractors Indonesia`;
  const description = `Browse Kubota ${model} tractor spare parts by system, exploded diagram, and part reference. Check model fitment and request an RFQ from Hikari Tractors Indonesia.`;
  const canonical = `${DOMAIN}${modelPath(model)}`;
  const links = sheets.map(({ sheet, product }) => `<li><a href="${assemblyPath(model, sheet.sheet_id)}"><strong>${esc(sheet.diagram_code)}</strong> ${esc(cleanTitle(sheet.title))}</a><span>${esc(sheet.category_label || product?.category || 'Tractor parts')} · ${sheet.parts.length} indexed parts</span></li>`).join('');
  const body = `<section class="seo-hero"><p class="seo-kicker">KUBOTA TRACTOR PARTS REFERENCE</p><h1>Kubota ${esc(model)} tractor spare parts</h1><p>Find model-specific exploded diagrams and spare-part references for the Kubota ${esc(model)} tractor. Open a diagram to review callouts, part numbers, names, and RFQ options.</p><div class="seo-actions"><a class="seo-button seo-button-primary" href="/#catalog?model=${encodeURIComponent(model)}">Open interactive catalog</a><a class="seo-button" href="${waLink(`Hello Hikari Tractors Indonesia, I need a spare part for Kubota ${model}.`)}">Ask for an RFQ</a></div></section>
<section class="seo-section"><div class="seo-section-heading"><div><p class="seo-kicker">${sheets.length} MODEL-SCOPED DIAGRAMS</p><h2>${esc(model)} systems and exploded diagrams</h2></div><p>Use the diagram code or system name to open a reference page. Each page lists the real indexed spare-part rows from the Hikari catalog.</p></div><ul class="seo-diagram-list">${links}</ul></section>
<section class="seo-note"><strong>Fitment note:</strong> model and diagram references are useful starting points. Serial range, variant, quantity, stock, price, freight, and availability should be confirmed through RFQ before ordering.</section>`;
  return { title, description, canonical, body, schema: makeSchema(title, description, canonical, [{ name: 'Hikari Tractors Indonesia', href: '/' }, { name: `Kubota ${model} parts`, href: modelPath(model) }], { about: { '@type': 'ProductModel', name: `Kubota ${model} tractor` } }), breadcrumbs: [{ label: `Kubota ${model} parts` }] };
};

const assemblyBody = ({ model, sheet, product, partPages, related }) => {
  const sheetTitle = cleanTitle(sheet.title) || 'Tractor parts diagram';
  const title = `Kubota ${model} ${sheet.diagram_code} ${sheetTitle} Spare Parts | Hikari`;
  const description = `Kubota ${model} ${sheet.diagram_code} ${sheetTitle} exploded diagram with ${sheet.parts.length} spare-part references, callouts, and RFQ support from Hikari Tractors Indonesia.`;
  const canonical = `${DOMAIN}${assemblyPath(model, sheet.sheet_id)}`;
  const rows = sheet.parts.map(part => rowHtml(part, partPath(partPages.get(partKey(part.part_number)) || partKey(part.part_number)))).join('');
  const relatedHtml = related.slice(0, 8).map(item => `<li><a href="${assemblyPath(model, item.sheet.sheet_id)}">${esc(item.sheet.diagram_code)} ${esc(cleanTitle(item.sheet.title))}</a></li>`).join('');
  const body = `<section class="seo-hero seo-hero-compact"><p class="seo-kicker">EXPLODED DIAGRAM · ${esc(sheet.category_label || product?.category || 'TRACTOR PARTS')}</p><h1>Kubota ${esc(model)} ${esc(sheet.diagram_code)} ${esc(sheetTitle)} spare parts</h1><p>Model-specific reference page for the ${esc(sheetTitle)} diagram. Review the indexed callouts and part numbers below, then open the interactive catalog or send an RFQ for fitment and availability confirmation.</p><div class="seo-actions"><a class="seo-button seo-button-primary" href="/#diagram?id=${encodeURIComponent(product?.id || '')}">Open interactive diagram</a><a class="seo-button" href="${absoluteAsset(sheet.pdf_url || product?.pdfUrl)}" target="_blank" rel="noopener">Open source PDF</a><a class="seo-button" href="${waLink(`Hello Hikari Tractors Indonesia, please quote Kubota ${model} diagram ${sheet.diagram_code} ${sheetTitle}.`)}">Ask via WhatsApp</a></div></section>
<div class="seo-two-column"><section class="seo-section"><p class="seo-kicker">${sheet.parts.length} INDEXED ROWS</p><h2>${esc(sheetTitle)} part references</h2><div class="seo-table-wrap"><table class="seo-parts"><thead><tr><th>Callout</th><th>Part number</th><th>Part name</th><th>Qty</th><th>Notes</th></tr></thead><tbody>${rows}</tbody></table></div></section><aside class="seo-aside"><h2>Reference details</h2><dl><dt>Model</dt><dd>${esc(model)}</dd><dt>System</dt><dd>${esc(sheet.category_label || product?.category || 'Kubota tractor parts')}</dd><dt>Diagram code</dt><dd>${esc(sheet.diagram_code)}</dd><dt>Catalog rows</dt><dd>${sheet.parts.length}</dd></dl><p>Search a part number to see related model and diagram references.</p><a class="seo-button seo-button-primary seo-button-block" href="/#catalog?q=${encodeURIComponent(sheet.parts[0]?.part_number || sheet.diagram_code)}">Search this reference</a></aside></div>
${relatedHtml ? `<section class="seo-section"><p class="seo-kicker">RELATED ${esc(model)} REFERENCES</p><h2>More ${esc(sheet.category_label || 'tractor')} diagrams</h2><ul class="seo-related-list">${relatedHtml}</ul></section>` : ''}
<section class="seo-note"><strong>RFQ guidance:</strong> send the tractor model, diagram code, callout or part number, quantity, destination, and any serial-range detail. Hikari confirms fitment, stock, price, freight, and lead time through quotation.</section>`;
  return { title, description, canonical, body, schema: makeSchema(title, description, canonical, [{ name: 'Hikari Tractors Indonesia', href: '/' }, { name: `Kubota ${model} parts`, href: modelPath(model) }, { name: `${sheet.diagram_code} ${sheetTitle}`, href: assemblyPath(model, sheet.sheet_id) }], { mainEntity: { '@type': 'ItemList', numberOfItems: sheet.parts.length, itemListElement: sheet.parts.slice(0, 50).map((part, index) => ({ '@type': 'ListItem', position: index + 1, name: `${part.part_number || 'Part'} ${part.name || ''}`.trim() })) } }), breadcrumbs: [{ label: `Kubota ${model} parts`, href: modelPath(model) }, { label: `${sheet.diagram_code} ${sheetTitle}` }] };
};

const partBody = ({ key, part, occurrences, partPages }) => {
  const display = part.part_number || key.toUpperCase();
  const names = unique(occurrences.map(item => cleanTitle(item.part.name))).filter(Boolean);
  const models = unique(occurrences.map(item => item.model));
  const title = `${display} Kubota Tractor Spare Part Reference | Hikari`;
  const description = `Reference ${display} for Kubota tractor spare parts${names[0] ? ` (${names[0]})` : ''}. See related models, exploded diagrams, callouts, and RFQ support from Hikari Tractors Indonesia.`;
  const canonical = `${DOMAIN}${partPath(key)}`;
  const refs = occurrences.map(item => `<tr><td>${esc(item.model)}</td><td><a href="${assemblyPath(item.model, item.sheet.sheet_id)}">${esc(item.sheet.diagram_code)} ${esc(cleanTitle(item.sheet.title))}</a></td><td>${esc(item.part.callout || '—')}</td><td>${esc(item.part.quantity || 1)}</td><td>${esc(item.part.notes || '—')}</td></tr>`).join('');
  const aliases = unique(occurrences.map(item => item.part.part_number)).filter(value => value !== display).slice(0, 20);
  const aliasText = aliases.length ? `<p><strong>Catalog variants:</strong> ${aliases.map(esc).join(', ')}</p>` : '';
  const body = `<section class="seo-hero seo-hero-compact"><p class="seo-kicker">UNIQUE PART REFERENCE · ${models.length} RELATED MODEL${models.length === 1 ? '' : 'S'}</p><h1>${esc(display)}${names[0] ? ` · ${esc(names[0])}` : ''}</h1><p>This page groups the real Hikari catalog references for part number <strong>${esc(display)}</strong>. It may appear in more than one model or diagram; use the table below to confirm the correct tractor context before requesting a quotation.</p><div class="seo-actions"><a class="seo-button seo-button-primary" href="/#catalog?q=${encodeURIComponent(display)}">Search interactive catalog</a><a class="seo-button" href="${waLink(`Hello Hikari Tractors Indonesia, please check Kubota tractor spare part ${display}${names[0] ? ` ${names[0]}` : ''}.`)}">Request RFQ</a></div></section>
<section class="seo-section"><p class="seo-kicker">${occurrences.length} CATALOG REFERENCES</p><h2>${esc(display)} model and diagram references</h2>${aliasText}<div class="seo-table-wrap"><table class="seo-parts"><thead><tr><th>Model</th><th>Diagram</th><th>Callout</th><th>Qty</th><th>Notes</th></tr></thead><tbody>${refs}</tbody></table></div></section>
<section class="seo-note"><strong>Important:</strong> this reference page does not by itself confirm exact fitment, current stock, price, freight, or delivery. Send the model, serial/variant detail, destination, and required quantity through RFQ for confirmation.</section>`;
  return { title, description, canonical, body, schema: makeSchema(title, description, canonical, [{ name: 'Hikari Tractors Indonesia', href: '/' }, { name: 'Kubota spare parts', href: '/kubota-tractor-parts/' }, { name: display }], { about: { '@type': 'Product', name: `${display}${names[0] ? ` ${names[0]}` : ''}`, productID: display } }), breadcrumbs: [{ label: 'Kubota spare parts', href: '/kubota-tractor-parts/' }, { label: display }] };
};

const writeRoute = async (route, page) => {
  const file = join(ROOT, route.replace(/^\//, ''), 'index.html');
  await mkdir(join(file, '..'), { recursive: true });
  await writeFile(file, shell(page), 'utf8');
};

const main = async () => {
  const catalog = await readJson('assets/data/drive-catalog.json');
  const sheetIndex = await readJson('assets/data/sheets-index.json');
  const searchIndex = await readJson('assets/data/sheets-search.json');
  const productsBySheet = new Map((catalog.products || []).map(product => [String(product.sheetId), product]));
  const sheets = [];
  for (const [sheetId, meta] of Object.entries(sheetIndex)) {
    const sheet = await readJson(meta.path);
    if (String(sheet.sheet_id) !== sheetId) throw new Error(`Sheet ID mismatch: ${sheetId}`);
    if (!Array.isArray(sheet.parts)) throw new Error(`Sheet has no parts array: ${sheetId}`);
    sheets.push({ sheet, product: productsBySheet.get(sheetId) || null });
  }
  if (sheets.length !== 1664) throw new Error(`Expected 1664 diagrams, got ${sheets.length}`);

  const byModel = new Map();
  const parts = new Map();
  for (const item of sheets) {
    const model = item.sheet.model_code || item.product?.model || 'Kubota tractor';
    if (!byModel.has(model)) byModel.set(model, []);
    byModel.get(model).push(item);
    for (const rawPart of item.sheet.parts) {
      const key = partKey(rawPart.part_number);
      if (!key) continue;
      if (!parts.has(key)) parts.set(key, { part_number: rawPart.part_number, occurrences: [] });
      parts.get(key).occurrences.push({ ...item, model, part: rawPart });
    }
  }
  const expectedIndexKeys = Object.keys(searchIndex.partNumbers || {}).length;
  const partPages = new Map([...parts.keys()].map(key => [key, key]));
  const routes = new Set(['/']);
  const modelLinks = [...byModel.keys()].sort((a, b) => a.localeCompare(b, undefined, { numeric: true })).map(model => `<li><a href="${modelPath(model)}">Kubota ${esc(model)} tractor spare parts</a><span>${byModel.get(model).length} indexed diagrams</span></li>`).join('');
  const catalogTitle = 'Kubota Tractor Spare Parts Catalog | Hikari Tractors Indonesia';
  const catalogDescription = 'Browse Hikari Tractors Indonesia model-first references for Kubota tractor spare parts, exploded diagrams, part numbers, and RFQ support.';
  const catalogCanonical = `${DOMAIN}/kubota-tractor-parts/`;
  await writeRoute('/kubota-tractor-parts/', {
    title: catalogTitle,
    description: catalogDescription,
    canonical: catalogCanonical,
    body: `<section class="seo-hero"><p class="seo-kicker">MODEL-FIRST KUBOTA PARTS CATALOG</p><h1>Kubota tractor spare parts reference</h1><p>Browse model-specific diagrams and real spare-part references from Hikari Tractors Indonesia. Start with a tractor model, open a system diagram, and review the exact part numbers before requesting an RFQ.</p><div class="seo-actions"><a class="seo-button seo-button-primary" href="/#catalog">Open interactive catalog</a><a class="seo-button" href="/cara-cari-sparepart-kubota/">How to find a part</a></div></section><section class="seo-section"><p class="seo-kicker">12 MODEL REFERENCES</p><h2>Browse Kubota tractor parts by model</h2><ul class="seo-model-list">${modelLinks}</ul></section><section class="seo-note"><strong>Independent reference:</strong> Hikari provides catalog lookup and quotation support. Fitment, price, stock, freight, and availability are confirmed per RFQ; Hikari is not presented as an official Kubota website or authorized dealer.</section>`,
    schema: makeSchema(catalogTitle, catalogDescription, catalogCanonical, [{ name: 'Hikari Tractors Indonesia', href: '/' }, { name: 'Kubota tractor parts' }], { mainEntity: { '@type': 'ItemList', numberOfItems: byModel.size, itemListElement: [...byModel.keys()].sort().map((model, index) => ({ '@type': 'ListItem', position: index + 1, name: `Kubota ${model} tractor parts`, url: `${DOMAIN}${modelPath(model)}` })) } }),
    breadcrumbs: [{ label: 'Kubota tractor parts' }]
  });
  routes.add('/kubota-tractor-parts/');
  for (const model of [...byModel.keys()].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))) {
    const modelSheets = byModel.get(model).sort((a, b) => String(a.sheet.diagram_code).localeCompare(String(b.sheet.diagram_code), undefined, { numeric: true }));
    const modelPage = modelBody({ model, sheets: modelSheets });
    const route = modelPath(model);
    await writeRoute(route, modelPage);
    routes.add(route);
    for (const item of modelSheets) {
      const related = modelSheets.filter(other => other !== item && other.sheet.category_label === item.sheet.category_label);
      const page = assemblyBody({ model, sheet: item.sheet, product: item.product, partPages, related });
      const assemblyRoute = assemblyPath(model, item.sheet.sheet_id);
      await writeRoute(assemblyRoute, page);
      routes.add(assemblyRoute);
    }
  }
  for (const [key, record] of parts) {
    const page = partBody({ key, part: record, occurrences: record.occurrences, partPages });
    const route = partPath(key);
    await writeRoute(route, page);
    routes.add(route);
  }
  const staticRoutes = [
    '/', '/cara-cari-sparepart-kubota/', '/tractor-parts-rfq-indonesia-international/', '/about/', '/contact/',
    '/help-center/', '/privacy-policy/', '/terms-and-conditions/', '/shipping-policy/', '/returns-and-refunds/', '/warranty/',
    '/import-export-kubota-tractor-parts-indonesia/'
  ];
  for (const route of staticRoutes) routes.add(route);
  const urls = [...routes].sort();
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(url => `  <url><loc>${DOMAIN}${url}</loc></url>`).join('\n')}\n</urlset>\n`;
  await writeFile(join(ROOT, 'sitemap.xml'), sitemap, 'utf8');
  const manifest = {
    generatedAt: new Date().toISOString(),
    source: 'assets/data/sheets-index.json + assets/data/sheets/*.json',
    models: byModel.size,
    diagrams: sheets.length,
    sourcePartRows: sheets.reduce((sum, item) => sum + item.sheet.parts.length, 0),
    partIndexKeys: expectedIndexKeys,
    partPages: parts.size,
    urlCount: urls.length,
    sampleRoutes: ['/kubota-tractor-parts/l3608/', '/kubota-tractor-parts/l3608/l3608-c10100-clutch/', '/spare-parts/tc42214500/']
  };
  await writeFile(join(CATALOG_ROOT, 'seo-catalog-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  console.log(JSON.stringify(manifest, null, 2));
};

main().catch(error => { console.error(error.stack || error); process.exitCode = 1; });
