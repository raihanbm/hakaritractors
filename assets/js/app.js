'use strict';

(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const app = $('#app');
  const API_BASE = String(window.HIKARI_CONFIG?.catalogApiBase || '').replace(/\/$/, '');
  const FALLBACK_IMAGE = 'assets/images/tractor.webp';
  const HERO_IMAGE = 'assets/images/hero-reference.webp';
  const SITE = window.HIKARI_CONFIG?.storefront || {};
  const configuredCurrency = SITE.currency || {};
  const CURRENCY = { code: configuredCurrency.code || 'THB', symbol: configuredCurrency.symbol || '฿', rate: Number(configuredCurrency.usdRate) || 35.8 };
  const PAGE_SIZE = 20;
  let catalogRefreshPromise = null;
  let lastCatalogRefreshAt = 0;

  const state = {
    loading: true,
    products: [],
    baseProducts: [],
    productMap: new Map(),
    sheetIndex: {},
    sheetSearch: { partNumbers: {}, partNames: {}, sheets: {} },
    partControls: {},
    partMap: new Map(),
    models: [],
    categories: [],
    selectedModel: '',
    selectedCategory: '',
    query: '',
    stock: new Set(),
    sort: 'recommended',
    view: readLocal('hikari_view', 'grid'),
    page: 1,
    wishlist: new Set(readLocal('hikari_wishlist', [])),
    cart: readLocal('hikari_cart_v4', []),
    currentProduct: null,
    currentSheet: null,
    detailZoom: 1,
    detailVisibleParts: 10,
    selectedPartKeys: new Set(),
    filterOpen: false,
    source: 'local'
  };

  function readLocal(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
  }
  function writeLocal(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage may be blocked */ }
  }
  function esc(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[char]));
  }
  function icon(name, size = 16) {
    return `<svg width="${size}" height="${size}" aria-hidden="true"><use href="#${name}"/></svg>`;
  }
  function api(path) { return `${API_BASE}${path}`; }
  function publicAssetUrl(mediaId, sourcePath) {
    if (mediaId) return api(`/api/public-media?id=${encodeURIComponent(mediaId)}`);
    if (!sourcePath) return '';
    if (/^https?:\/\//i.test(sourcePath)) return sourcePath;
    return api(`/api/public-assets?path=${encodeURIComponent(String(sourcePath).replace(/^\/+/, ''))}`);
  }
  function usdPrice(part, field = 'retail_price') {
    const raw = Number(part?.[field] ?? part?.retail_price ?? 0);
    return part?.currency === 'IDR' ? raw / 16300 : raw;
  }
  function money(usd) {
    const value = Math.max(0, Number(usd) || 0) * CURRENCY.rate;
    return `${CURRENCY.symbol}${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  function productPrice(product) {
    return Number(product?.price) || 0;
  }
  function stockMeta(product) {
    if (product?.stock === 'in') return { label: 'In Stock', className: 'in', color: 'green' };
    if (product?.stock === 'low') return { label: 'Limited Stock', className: 'low', color: 'amber' };
    return { label: 'Pre-order', className: 'out', color: 'muted' };
  }
  function categoryIcon(name = '') {
    const value = name.toLowerCase();
    if (value.includes('engine')) return 'i-engine';
    if (value.includes('transmission') || value.includes('clutch')) return 'i-gear';
    if (value.includes('hydraulic')) return 'i-hydraulic';
    if (value.includes('electric')) return 'i-bolt';
    if (value.includes('axle') || value.includes('steering')) return 'i-axle';
    if (value.includes('fuel') || value.includes('filter')) return 'i-filter';
    return 'i-box';
  }
  function normalize(value) { return String(value || '').toLowerCase().replace(/[^a-z0-9]/g, ''); }
  function titleCase(value) {
    return String(value || '').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
  }
  function cleanTitle(value) { return String(value || '').replace(/\s*##\s*.*/, '').trim(); }
  function routeHash(name, params = {}) {
    const query = new URLSearchParams(Object.entries(params).filter(([, value]) => value !== '' && value != null));
    return `#${name}${query.toString() ? `?${query}` : ''}`;
  }
  function go(name, params = {}) {
    const target = routeHash(name, params);
    if (location.hash === target) route(); else location.hash = target;
  }
  function parseRoute() {
    const raw = location.hash.replace(/^#/, '') || 'home';
    const [name, search = ''] = raw.split('?');
    return { name, params: new URLSearchParams(search) };
  }
  function toast(title, message = '') {
    const node = document.createElement('div');
    node.className = 'toast';
    node.innerHTML = `<b>${esc(title)}</b>${message ? `<small>${esc(message)}</small>` : ''}`;
    $('#toastStack').append(node);
    setTimeout(() => node.remove(), 3200);
  }
  function setBusy(content = 'Loading…') {
    app.innerHTML = `<div class="page-loading"><span></span><p>${esc(content)}</p></div>`;
  }

  function mapPublicCatalog(tree) {
    const products = [];
    const mappedSheets = {};
    const numbers = {};
    const names = {};
    const sheetMatches = {};
    const partMap = new Map();
    const models = Array.isArray(tree) ? tree : [];

    models.forEach(model => (model.categories || []).forEach(category => (category.subcategories || []).forEach(subcategory => (subcategory.assemblies || []).forEach(assembly => {
      const parts = Array.isArray(assembly.spare_parts) ? assembly.spare_parts : [];
      const previewImage = publicAssetUrl(assembly.thumbnail_media_id, assembly.source_thumbnail_url) || FALLBACK_IMAGE;
      const fullImage = publicAssetUrl(assembly.full_diagram_media_id, assembly.source_full_diagram_url || assembly.source_thumbnail_url) || previewImage;
      const pdfUrl = publicAssetUrl(assembly.pdf_media_id, assembly.source_pdf_path);
      const sheetId = String(assembly.id);
      const searchable = [];
      const mappedParts = parts.map(part => {
        const match = { part_number: part.part_number, name: part.name, callout: part.callout };
        searchable.push(match);
        const raw = String(part.part_number || '').toLowerCase();
        const normal = normalize(raw);
        [raw, normal].filter(Boolean).forEach(key => { (numbers[key] ??= []).push(sheetId); });
        const nameKey = String(part.name || '').toLowerCase();
        if (nameKey) (names[nameKey] ??= []).push(sheetId);
        const mapped = {
          id: part.id,
          callout: part.callout || '-',
          part_number: part.part_number,
          name: part.name,
          quantity: Number(part.quantity) || 1,
          notes: part.notes || part.location_description || '',
          estimated_usd: usdPrice(part),
          b2b_usd: usdPrice(part, 'b2b_price'),
          export_usd: usdPrice(part, 'export_price'),
          admin_stock: Number(part.stock_quantity || 0),
          admin_publish_status: 'published',
          currency: part.currency || 'IDR'
        };
        if (mapped.id) partMap.set(String(mapped.id), mapped);
        return mapped;
      });
      sheetMatches[sheetId] = { matches: searchable };
      mappedSheets[sheetId] = { data: {
        sheet_id: sheetId,
        model_code: model.code,
        diagram_code: assembly.code,
        title: assembly.title,
        category_label: category.name,
        category_slug: category.slug,
        page_count: Math.max(1, Number(assembly.source_page_count) || 1),
        preview_image: previewImage,
        full_image: fullImage,
        pdf_url: pdfUrl,
        crop_config: assembly.crop_config || null,
        parts: mappedParts,
        hotspots: (assembly.hotspots || []).map(h => ({ id: h.id, callout: h.callout, x: Number(h.x_pct), y: Number(h.y_pct), spare_part_id: h.spare_part_id }))
      }};
      const stockTotal = parts.reduce((sum, part) => sum + Number(part.stock_quantity || 0), 0);
      const lowest = parts.reduce((value, part) => {
        const next = usdPrice(part);
        return next > 0 && (!value || next < value) ? next : value;
      }, 0);
      const tierMinimum = tier => {
        const values = parts.map(part => usdPrice(part, tier)).filter(value => value > 0);
        return values.length ? Math.min(...values) : lowest;
      };
      products.push({
        id: sheetId,
        sku: assembly.code,
        name: assembly.title,
        category: category.name,
        machine: 'Tractor',
        model: model.code,
        engine: '',
        grade: 'Catalog',
        diagramCode: assembly.code,
        sheetId,
        partCount: parts.length,
        pageCount: Math.max(1, Number(assembly.source_page_count) || 1),
        price: lowest,
        b2b: tierMinimum('b2b_price'),
        export: tierMinimum('export_price'),
        stock: stockTotal > 8 ? 'in' : stockTotal > 0 ? 'low' : 'out',
        qty: stockTotal,
        featured: false,
        previewImage,
        fullImage
      });
    }))));

    state.sheetIndex = mappedSheets;
    state.sheetSearch = { partNumbers: numbers, partNames: names, sheets: sheetMatches };
    state.partMap = partMap;
    state.baseProducts = products;
    state.products = products;
    state.source = 'remote';
  }

  function applyControlState(control) {
    const factor = control?.currency === 'IDR' ? 1 / 16300 : 1;
    const productControls = new Map((control?.products || []).map(item => [String(item.id), {
      ...item,
      price: item.price == null ? item.price : Number(item.price) * factor,
      b2b: item.b2b == null ? item.b2b : Number(item.b2b) * factor,
      export: item.export == null ? item.export : Number(item.export) * factor
    }]));
    state.partControls = control?.parts || {};
    state.controlCurrency = control?.currency || 'USD';
    state.products = state.baseProducts
      .map(product => ({ ...product, ...(productControls.get(String(product.id)) || {}) }))
      .filter(product => !product.publishStatus || product.publishStatus === 'published');
  }

  function applySheetControls(sheet) {
    if (!sheet) return sheet;
    const factor = state.controlCurrency === 'IDR' ? 1 / 16300 : 1;
    const source = (sheet.parts || []).map((part, index) => {
      const control = state.partControls[`${sheet.sheet_id}:${index}`];
      const sourcePrice = part.source_estimated_usd ?? part.estimated_usd;
      return {
        ...part,
        source_estimated_usd: sourcePrice,
        estimated_usd: control?.price == null ? sourcePrice : Number(control.price) * factor,
        admin_stock: control?.stock ?? part.admin_stock,
        admin_publish_status: control?.publishStatus ?? part.admin_publish_status,
        name: control?.name ?? part.name,
        part_number: control?.partNumber ?? part.part_number,
        callout: control?.callout ?? part.callout,
        quantity: control?.quantity ?? part.quantity,
        notes: control?.notes ?? part.notes,
        deleted: control?.deleted
      };
    }).filter(part => !part.deleted);
    const custom = Object.entries(state.partControls)
      .filter(([key, control]) => key.startsWith(`${sheet.sheet_id}:custom:`) && control?.custom && !control.deleted)
      .map(([, control]) => ({
        id: control.id,
        callout: control.callout ?? '-',
        part_number: control.partNumber ?? '',
        name: control.name ?? 'New spare part',
        quantity: control.quantity ?? 1,
        notes: control.notes || '',
        estimated_usd: (Number(control.price) || 0) * factor,
        admin_stock: control.stock,
        admin_publish_status: control.publishStatus
      }));
    return { ...sheet, parts: [...source, ...custom] };
  }

  function buildMetadata() {
    state.productMap = new Map(state.products.map(product => [String(product.id), product]));
    state.models = [...new Set(state.products.map(product => product.model).filter(Boolean))];
    const counts = new Map();
    state.products.forEach(product => counts.set(product.category, (counts.get(product.category) || 0) + 1));
    state.categories = [...counts.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([name, count]) => ({ name, count }));
  }

  async function loadCatalog() {
    try {
      if (!API_BASE) throw new Error('Catalog API is not configured');
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 4000);
      const response = await fetch(api('/api/public-catalog'), { cache: 'no-store', signal: controller.signal });
      clearTimeout(timer);
      if (!response.ok) throw new Error(`Catalog API ${response.status}`);
      const payload = await response.json();
      mapPublicCatalog(payload.data || []);
    } catch (remoteError) {
      console.warn('[catalog-api-fallback]', remoteError);
      const [catalog, sheetIndex, sheetSearch, control] = await Promise.all([
        fetch('assets/data/drive-catalog.json', { cache: 'no-store' }).then(response => {
          if (!response.ok) throw new Error(`Local catalog ${response.status}`);
          return response.json();
        }),
        fetch('assets/data/sheets-index.json', { cache: 'no-store' }).then(response => response.ok ? response.json() : {}),
        fetch('assets/data/sheets-search.json', { cache: 'no-store' }).then(response => response.ok ? response.json() : ({ partNumbers: {}, partNames: {}, sheets: {} })),
        fetch('assets/data/catalog-control-state.json', { cache: 'no-store' }).then(response => response.ok ? response.json() : null).catch(() => null)
      ]);
      state.baseProducts = Array.isArray(catalog.products) ? catalog.products : [];
      state.products = state.baseProducts;
      state.sheetIndex = sheetIndex || {};
      state.sheetSearch = sheetSearch || { partNumbers: {}, partNames: {}, sheets: {} };
      state.source = 'local';
      applyControlState(control);
    }
    buildMetadata();
    state.loading = false;
    lastCatalogRefreshAt = Date.now();
    hydrateHeader();
    updateCartUi();
  }

  async function refreshCatalogControl({ force = false, rerender = true } = {}) {
    if (catalogRefreshPromise) return catalogRefreshPromise;
    if (!force && Date.now() - lastCatalogRefreshAt < 60_000) return false;
    catalogRefreshPromise = (async () => {
      try {
        if (API_BASE) {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 4000);
          const response = await fetch(api('/api/public-catalog'), { cache: 'no-store', signal: controller.signal });
          clearTimeout(timer);
          if (!response.ok) throw new Error(`Catalog API ${response.status}`);
          const payload = await response.json();
          mapPublicCatalog(payload.data || []);
        } else {
          const response = await fetch('assets/data/catalog-control-state.json', { cache: 'no-store' });
          const control = response.ok ? await response.json() : null;
          applyControlState(control);
        }
        buildMetadata();
        lastCatalogRefreshAt = Date.now();
        hydrateHeader();
        updateCartUi();
        if (rerender && !state.loading) await route();
        return true;
      } catch (error) {
        console.warn('[catalog-control-refresh]', error);
        return false;
      } finally {
        catalogRefreshPromise = null;
      }
    })();
    return catalogRefreshPromise;
  }

  function hydrateHeader() {
    $('#supportPhone').textContent = SITE.phone || '+66 2 123 4567';
    $('#supportEmail').textContent = SITE.email || 'support@hikaritractors.com';
    $('#genuineLabel').textContent = SITE.genuineLabel || 'Genuine Parts for Kubota Tractors';
    $('#currencyButton').childNodes[0].textContent = `${CURRENCY.code} ${CURRENCY.symbol} `;
    const categorySelect = $('#globalCategorySelect');
    categorySelect.innerHTML = `<option value="">All Categories</option>${state.categories.map(category => `<option value="${esc(category.name)}">${esc(category.name)}</option>`).join('')}`;
    const strip = $('#modelStripLinks');
    strip.innerHTML = state.models.slice(0, 7).map(model => `<button type="button" data-header-model="${esc(model)}">${esc(model.replace('DT-NES', '').replace('DT', ''))}</button>`).join('');
    updateHeaderActiveState();
  }

  function updateHeaderActiveState() {
    const { name, params } = parseRoute();
    const model = params.get('model') || state.selectedModel;
    $$('[data-header-model]').forEach(button => button.classList.toggle('active', button.dataset.headerModel === model));
    $$('[data-nav]').forEach(link => link.classList.toggle('active', link.dataset.nav === (name === 'diagram' ? 'catalog' : name)));
  }

  function partMatches(product, query) {
    const raw = String(query || '').toLowerCase().trim();
    const normal = normalize(raw);
    if (!raw || !normal) return [];
    const sheet = state.sheetSearch.sheets?.[product.sheetId];
    if (!sheet?.matches) return [];
    return sheet.matches.filter(match => {
      const haystack = [match.part_number, match.name, match.callout].join(' ').toLowerCase();
      return haystack.includes(raw) || normalize(haystack).includes(normal);
    }).slice(0, 5);
  }

  function searchProducts(query, limit = 10) {
    const raw = String(query || '').toLowerCase().trim();
    if (!raw) return [];
    const normal = normalize(raw);
    return state.products.filter(product => {
      const haystack = [product.sku, product.name, product.category, product.model, product.engine, product.diagramCode].join(' ').toLowerCase();
      return haystack.includes(raw) || normalize(haystack).includes(normal) || partMatches(product, raw).length;
    }).slice(0, limit);
  }

  function renderSearchSuggestions(query) {
    const popover = $('#globalSearchPopover');
    if (String(query).trim().length < 2) { popover.classList.remove('open'); return; }
    const results = searchProducts(query, 8);
    if (!results.length) { popover.classList.remove('open'); return; }
    popover.innerHTML = results.map(product => {
      const match = partMatches(product, query)[0];
      return `<button class="search-suggestion" type="button" data-suggestion-id="${esc(product.id)}">
        <img src="${esc(product.previewImage || FALLBACK_IMAGE)}" alt="">
        <span><b>${esc(match ? `${match.part_number} — ${match.name}` : cleanTitle(product.name))}</b><small>${esc(product.model)} · ${esc(product.category)} · Diagram ${esc(product.diagramCode)}</small></span>
        <em>${match ? 'Part match' : 'Open diagram'}</em>
      </button>`;
    }).join('');
    popover.classList.add('open');
  }

  function homeProductCard(product) {
    const stock = stockMeta(product);
    return `<article class="assembly-card">
      <button class="assembly-image" data-open-product="${esc(product.id)}"><img loading="lazy" src="${esc(product.previewImage || FALLBACK_IMAGE)}" alt="${esc(cleanTitle(product.name))}"></button>
      <div class="assembly-copy"><small>${esc(product.category)}</small><h3>${esc(titleCase(cleanTitle(product.name)))}</h3><code>${esc(product.diagramCode)}</code><div class="assembly-badges"><span>${esc(product.model)}</span></div><div class="assembly-meta"><span>⬡ ${Number(product.partCount || 0)} Parts</span><span>↻ Updated catalog</span></div></div>
      <div class="assembly-buy"><small>From</small><b>${money(productPrice(product))}</b><span class="status">${esc(stock.label)}</span><button class="btn btn-orange" data-open-product="${esc(product.id)}">View Diagram</button></div>
    </article>`;
  }

  function renderHome() {
    const models = state.models.slice(0, 6);
    const topCategories = state.categories.slice(0, 7);
    const preferred = state.products.filter(product => /engine/i.test(product.category)).slice(0, 4);
    const featured = preferred.length >= 4 ? preferred : state.products.slice(0, 4);
    app.innerHTML = `
      <section class="hero">
        <div class="hero-bg"><img src="${HERO_IMAGE}" alt="Orange tractor in the field"></div>
        <div class="container hero-content"><div class="hero-copy"><h1>Genuine Parts.<span>Peak Performance.</span></h1><p>High-quality tractor parts for lasting reliability and maximum productivity.</p><div class="hero-actions"><button class="btn btn-orange" data-home-browse>Browse Parts ${icon('i-chevron', 15)}</button><button class="btn btn-outline" data-home-part-search>Find by Part Number ${icon('i-search', 15)}</button></div></div></div>
        <form class="hero-search-panel" id="heroSearchPanel">
          <div class="hero-field">${icon('i-truck', 20)}<span><label>Model</label><select id="heroModel"><option value="">Select model</option>${state.models.map(model => `<option value="${esc(model)}">${esc(model)}</option>`).join('')}</select></span></div>
          <div class="hero-field">${icon('i-grid', 20)}<span><label>Category</label><select id="heroCategory"><option value="">Select category</option>${state.categories.map(category => `<option value="${esc(category.name)}">${esc(category.name)}</option>`).join('')}</select></span></div>
          <div class="hero-field">${icon('i-bolt', 20)}<span><label>Part Number</label><input id="heroPartNumber" placeholder="e.g. 1A107-04022"></span></div>
          <div class="hero-field">${icon('i-box', 20)}<span><label>Diagram Code</label><input id="heroDiagramCode" placeholder="e.g. 1GBS1-809-10"></span></div>
          <button type="submit">${icon('i-search', 16)}Search Parts</button>
        </form>
      </section>
      <div class="home-content">
        <section class="page-section home-section models-section"><div class="container"><div class="section-headline"><div><div class="section-label">FEATURED MODELS</div></div><button class="view-all" data-all-models>View All Models ${icon('i-chevron', 13)}</button></div><div class="model-cards">${models.map(model => { const count = state.products.filter(product => product.model === model).length; return `<button class="model-card" data-model-card="${esc(model)}"><img src="assets/images/tractor-card.webp" alt="${esc(model)} tractor"><span class="model-card-copy"><b>${esc(model)}</b><small>${count} assembly diagrams</small><em>View Parts</em></span><span class="model-arrow">→</span></button>`; }).join('')}</div></div></section>
        <section class="page-section home-section systems-section"><div class="container"><div class="section-headline"><div><div class="section-label">BROWSE BY SYSTEM</div></div><button class="view-all" data-all-categories>View All Systems ${icon('i-chevron', 13)}</button></div><div class="system-grid">${topCategories.map(category => `<button class="system-card" data-system-card="${esc(category.name)}">${icon(categoryIcon(category.name), 25)}${esc(category.name)}</button>`).join('')}</div></div></section>
        <section class="page-section home-section assemblies-section"><div class="container"><div class="section-headline"><div><div class="section-label">FEATURED ASSEMBLY DIAGRAMS</div></div><button class="view-all" data-all-diagrams>View All Diagrams ${icon('i-chevron', 13)}</button></div><div class="assembly-row">${featured.map(homeProductCard).join('')}</div></div></section>
      </div>`;

    $('#heroSearchPanel').addEventListener('submit', event => {
      event.preventDefault();
      const model = $('#heroModel').value;
      const category = $('#heroCategory').value;
      const part = $('#heroPartNumber').value.trim();
      const diagram = $('#heroDiagramCode').value.trim();
      go('catalog', { model, category, q: part || diagram });
    });
    $('[data-home-browse]').onclick = () => go('catalog');
    $('[data-home-part-search]').onclick = () => { $('#globalSearchInput').focus(); window.scrollTo({ top: 0, behavior: 'smooth' }); };
    $$('[data-model-card]').forEach(button => button.onclick = () => go('catalog', { model: button.dataset.modelCard }));
    $$('[data-system-card]').forEach(button => button.onclick = () => go('catalog', { category: button.dataset.systemCard }));
    $$('[data-open-product]').forEach(button => button.onclick = () => go('diagram', { id: button.dataset.openProduct }));
    $('[data-all-models]').onclick = () => go('models');
    $('[data-all-categories]').onclick = () => go('catalog');
    $('[data-all-diagrams]').onclick = () => go('catalog');
  }

  function filteredProducts() {
    const query = state.query.toLowerCase().trim();
    let rows = state.products.filter(product => {
      const selectedModel = !state.selectedModel || product.model === state.selectedModel;
      const selectedCategory = !state.selectedCategory || product.category === state.selectedCategory;
      const selectedStock = !state.stock.size || state.stock.has(product.stock);
      const haystack = [product.name, product.sku, product.diagramCode, product.model, product.category].join(' ').toLowerCase();
      const matchesQuery = !query || haystack.includes(query) || normalize(haystack).includes(normalize(query)) || partMatches(product, query).length;
      return selectedModel && selectedCategory && selectedStock && matchesQuery;
    });
    if (state.sort === 'price-low') rows.sort((a, b) => productPrice(a) - productPrice(b));
    if (state.sort === 'price-high') rows.sort((a, b) => productPrice(b) - productPrice(a));
    if (state.sort === 'name') rows.sort((a, b) => cleanTitle(a.name).localeCompare(cleanTitle(b.name)));
    if (state.sort === 'parts') rows.sort((a, b) => Number(b.partCount || 0) - Number(a.partCount || 0));
    if (state.sort === 'recommended') rows.sort((a, b) => Number(b.featured) - Number(a.featured) || Number(b.partCount || 0) - Number(a.partCount || 0));
    return rows;
  }

  function productCard(product, index) {
    const stock = stockMeta(product);
    const saved = state.wishlist.has(String(product.id));
    const matched = partMatches(product, state.query)[0];
    const tags = index < 2 ? 'BEST SELLER' : index === 2 ? 'FEATURED' : '';
    const models = [product.model];
    return `<article class="product-card">
      ${tags ? `<span class="product-card-tag">${tags}</span>` : ''}
      <button class="product-heart ${saved ? 'active' : ''}" data-wishlist="${esc(product.id)}" aria-label="Save assembly">${icon('i-heart', 17)}</button>
      <button class="product-card-image" data-open-product="${esc(product.id)}"><img loading="lazy" src="${esc(product.previewImage || FALLBACK_IMAGE)}" alt="${esc(cleanTitle(product.name))}"></button>
      <div class="product-card-body">
        <div class="product-info-list"><div class="product-kicker">${esc(product.category)}</div><h3>${esc(titleCase(cleanTitle(product.name)))}</h3><div class="product-code">${esc(product.diagramCode)}</div>${matched ? `<div class="badge orange" title="Matched part">Part: ${esc(matched.part_number)}</div>` : ''}<div class="product-models">${models.map(model => `<span>${esc(model)}</span>`).join('')}</div><div class="product-data"><span>⬡ ${Number(product.partCount || 0)} Parts</span><span>▱ ${Number(product.pageCount || 1)} Page${Number(product.pageCount || 1) > 1 ? 's' : ''}</span></div></div>
        <div class="product-action-list"><div class="product-price-row"><b>From ${money(productPrice(product))}</b><span class="status">${esc(stock.label)}</span></div><button class="btn btn-orange" data-open-product="${esc(product.id)}">View Diagram</button></div>
      </div>
    </article>`;
  }

  function filterSidebarHtml(rows) {
    const modelCounts = new Map();
    const categoryCounts = new Map();
    state.products.forEach(product => {
      modelCounts.set(product.model, (modelCounts.get(product.model) || 0) + 1);
      categoryCounts.set(product.category, (categoryCounts.get(product.category) || 0) + 1);
    });
    return `<aside class="filter-sidebar ${state.filterOpen ? 'open' : ''}" id="filterSidebar">
      <div class="filter-group"><div class="filter-head"><b>Tractor Model</b><button data-clear-filter="model">Clear</button></div>${state.models.slice(0, 7).map(model => `<label class="filter-option"><input type="radio" name="filter-model" value="${esc(model)}" ${state.selectedModel === model ? 'checked' : ''}><span>${esc(model)}</span><em>(${modelCounts.get(model) || 0})</em></label>`).join('')}<button class="filter-more" data-models-page>Show more ${icon('i-down', 11)}</button></div>
      <div class="filter-group"><div class="filter-head"><b>System Category</b><button data-clear-filter="category">Clear</button></div>${state.categories.slice(0, 7).map(category => `<label class="filter-option"><input type="radio" name="filter-category" value="${esc(category.name)}" ${state.selectedCategory === category.name ? 'checked' : ''}><span>${esc(category.name)}</span><em>(${categoryCounts.get(category.name) || 0})</em></label>`).join('')}<button class="filter-more" data-all-categories-filter>Show more ${icon('i-down', 11)}</button></div>
      <div class="filter-group"><div class="filter-head"><b>Stock Status</b><button data-clear-filter="stock">Clear</button></div><label class="filter-option"><input type="checkbox" name="filter-stock" value="in" ${state.stock.has('in') ? 'checked' : ''}><span class="status">In Stock</span></label><label class="filter-option"><input type="checkbox" name="filter-stock" value="low" ${state.stock.has('low') ? 'checked' : ''}><span>🟠 Available</span></label><label class="filter-option"><input type="checkbox" name="filter-stock" value="out" ${state.stock.has('out') ? 'checked' : ''}><span>🔴 Pre-order</span></label></div>
      <div class="filter-group"><div class="filter-head"><b>Price Range (THB)</b><button>Clear</button></div><div class="price-slider"><span></span><span></span></div><div class="price-labels"><span>฿0</span><span>฿25,000+</span></div></div>
      <div class="filter-group"><div class="filter-head"><b>Compatibility</b><button data-clear-filter="model">Clear</button></div><input class="compat-input" id="compatInput" placeholder="Search model compatibility..."><div class="filter-chips">${state.selectedModel ? `<span>${esc(state.selectedModel)} <button data-clear-filter="model">×</button></span>` : '<span>All models</span>'}</div></div>
      <div class="filter-group"><button class="btn btn-orange" id="applyMobileFilters" style="width:100%">Show ${rows.length} diagrams</button></div>
    </aside>`;
  }

  function activeFilterHtml() {
    const filters = [];
    if (state.selectedModel) filters.push({ key: 'model', label: `Model: ${state.selectedModel}` });
    if (state.selectedCategory) filters.push({ key: 'category', label: `System: ${state.selectedCategory}` });
    state.stock.forEach(value => filters.push({ key: `stock:${value}`, label: value === 'in' ? 'In Stock' : value === 'low' ? 'Available' : 'Pre-order' }));
    if (state.query) filters.push({ key: 'query', label: `Search: ${state.query}` });
    return filters.map(filter => `<span class="active-filter">${esc(filter.label)}<button data-remove-filter="${esc(filter.key)}">×</button></span>`).join('');
  }

  function renderCatalog() {
    const rows = filteredProducts();
    const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
    if (state.page > pages) state.page = pages;
    const start = (state.page - 1) * PAGE_SIZE;
    const pageRows = rows.slice(start, start + PAGE_SIZE);
    const title = state.selectedCategory ? `${state.selectedCategory} Parts` : state.selectedModel ? `${state.selectedModel} Parts` : 'Tractor Parts & Assembly Diagrams';
    const context = state.selectedModel ? `Browse system diagrams and find the exact parts you need for your ${state.selectedModel}.` : 'Browse official assembly diagrams, then order exact spare parts by callout and part number.';
    app.innerHTML = `<section class="page-section"><div class="container"><nav class="breadcrumbs"><a href="#home">Home</a><a href="#catalog">Parts</a>${state.selectedModel ? `<a href="${routeHash('catalog', { model: state.selectedModel })}">${esc(state.selectedModel)}</a>` : ''}${state.selectedCategory ? `<span>${esc(state.selectedCategory)}</span>` : ''}</nav>
      <div class="catalog-title-row"><div class="catalog-title"><h1>${esc(title)} <span>${rows.length} Assembly Diagrams Found</span></h1><p>${esc(context)}</p></div><div class="help-card">${icon('i-engine', 34)}<span><b>Need help finding parts?</b><small>Our parts experts are here for you.</small></span><button data-contact>Contact Us</button></div></div>
      <div class="catalog-layout">${filterSidebarHtml(rows)}<div class="catalog-main"><div class="catalog-toolbar"><button class="mobile-filter-trigger" id="mobileFilterTrigger">${icon('i-filter', 15)}Filters</button><span class="toolbar-label">Sort by:</span><select class="sort-select" id="catalogSort"><option value="recommended">Recommended</option><option value="parts">Most parts</option><option value="price-low">Price: Low to High</option><option value="price-high">Price: High to Low</option><option value="name">Name A–Z</option></select><div class="active-filters"><span>Active Filters:</span>${activeFilterHtml()}${activeFilterHtml() ? '<button class="clear-all" id="clearAllFilters">Clear All</button>' : ''}</div><div class="view-controls"><span>View:</span><button id="gridViewButton" class="${state.view === 'grid' ? 'active' : ''}">${icon('i-grid', 16)}</button><button id="listViewButton" class="${state.view === 'list' ? 'active' : ''}">${icon('i-list', 16)}</button></div></div>
      <div class="assembly-grid ${state.view === 'list' ? 'product-list' : ''}">${pageRows.length ? pageRows.map(productCard).join('') : `<div class="empty-state">${icon('i-search', 48)}<div><h3>No matching diagrams</h3><p>Try a broader model, system or part-number search.</p><button class="btn btn-orange" id="emptyReset" style="margin-top:15px">Reset filters</button></div></div>`}</div>
      <div class="catalog-results-summary">Showing ${rows.length ? start + 1 : 0} to ${Math.min(start + PAGE_SIZE, rows.length)} of ${rows.length} diagrams</div>${paginationHtml(pages)}</div></div></div></section>`;

    $('#catalogSort').value = state.sort;
    $('#catalogSort').onchange = event => { state.sort = event.target.value; state.page = 1; renderCatalog(); };
    $('#gridViewButton').onclick = () => { state.view = 'grid'; writeLocal('hikari_view', state.view); renderCatalog(); };
    $('#listViewButton').onclick = () => { state.view = 'list'; writeLocal('hikari_view', state.view); renderCatalog(); };
    $$('[data-open-product]').forEach(button => button.onclick = () => go('diagram', { id: button.dataset.openProduct, q: state.query }));
    $$('[data-wishlist]').forEach(button => button.onclick = event => { event.stopPropagation(); toggleWishlist(button.dataset.wishlist); renderCatalog(); });
    $$('input[name="filter-model"]').forEach(input => input.onchange = () => { state.selectedModel = input.value; state.page = 1; syncCatalogHash(); });
    $$('input[name="filter-category"]').forEach(input => input.onchange = () => { state.selectedCategory = input.value; state.page = 1; syncCatalogHash(); });
    $$('input[name="filter-stock"]').forEach(input => input.onchange = () => { input.checked ? state.stock.add(input.value) : state.stock.delete(input.value); state.page = 1; renderCatalog(); });
    $$('[data-clear-filter]').forEach(button => button.onclick = () => { clearFilter(button.dataset.clearFilter); syncCatalogHash(); });
    $$('[data-remove-filter]').forEach(button => button.onclick = () => { removeFilter(button.dataset.removeFilter); syncCatalogHash(); });
    $('#clearAllFilters')?.addEventListener('click', () => { clearAllFilters(); syncCatalogHash(); });
    $('#emptyReset')?.addEventListener('click', () => { clearAllFilters(); syncCatalogHash(); });
    $('#mobileFilterTrigger').onclick = () => { state.filterOpen = true; $('#filterSidebar').classList.add('open'); $('#drawerBackdrop').classList.add('open'); document.body.classList.add('no-scroll'); };
    $('#applyMobileFilters').onclick = () => closeFilterDrawer();
    $('[data-contact]').onclick = () => go('contact');
    $('[data-models-page]')?.addEventListener('click', () => go('models'));
    $('[data-all-categories-filter]')?.addEventListener('click', () => openCategoryModal());
    $$('.pagination button[data-page]').forEach(button => button.onclick = () => { state.page = Number(button.dataset.page); renderCatalog(); window.scrollTo({ top: 120, behavior: 'smooth' }); });
  }

  function paginationHtml(pages) {
    if (pages <= 1) return '';
    const current = state.page;
    const numbers = [];
    for (let page = Math.max(1, current - 2); page <= Math.min(pages, current + 2); page += 1) numbers.push(page);
    return `<div class="pagination"><button data-page="${current - 1}" ${current === 1 ? 'disabled' : ''}>‹</button>${numbers.map(page => `<button data-page="${page}" class="${page === current ? 'active' : ''}">${page}</button>`).join('')}<button data-page="${current + 1}" ${current === pages ? 'disabled' : ''}>›</button></div>`;
  }

  function syncCatalogHash() {
    go('catalog', { model: state.selectedModel, category: state.selectedCategory, q: state.query });
  }
  function clearFilter(type) {
    if (type === 'model') state.selectedModel = '';
    if (type === 'category') state.selectedCategory = '';
    if (type === 'stock') state.stock.clear();
    if (type === 'query') state.query = '';
    state.page = 1;
  }
  function removeFilter(key) {
    if (key.startsWith('stock:')) state.stock.delete(key.split(':')[1]); else clearFilter(key);
    state.page = 1;
  }
  function clearAllFilters() {
    state.selectedModel = '';
    state.selectedCategory = '';
    state.query = '';
    state.stock.clear();
    state.page = 1;
  }
  function closeFilterDrawer() {
    state.filterOpen = false;
    $('#filterSidebar')?.classList.remove('open');
    if (!$('#cartDrawer').classList.contains('open')) $('#drawerBackdrop').classList.remove('open');
    document.body.classList.remove('no-scroll');
  }

  async function loadSheet(product) {
    const entry = state.sheetIndex[product.sheetId];
    if (!entry) throw new Error('Diagram metadata is missing');
    let raw = entry.data;
    if (!raw) {
      const response = await fetch(entry.path, { cache: 'no-store' });
      if (!response.ok) throw new Error(`Diagram ${response.status}`);
      raw = await response.json();
    }
    return applySheetControls(raw);
  }

  function partPrice(part) {
    return Number(part?.estimated_usd) || 0;
  }
  function partKey(sheet, index) { return `${sheet.sheet_id}:${index}`; }
  function cartItemForKey(key) { return state.cart.find(item => item.key === key); }
  function visibleSheetParts(sheet) {
    return (sheet.parts || []).map((part, index) => ({ part, index })).filter(({ part }) => !part.admin_publish_status || part.admin_publish_status === 'published');
  }

  async function renderDetail(productId, query = '') {
    const product = state.productMap.get(String(productId));
    if (!product) { renderNotFound('Diagram not found'); return; }
    setBusy('Loading diagram and spare-parts list…');
    try {
      const sheet = await loadSheet(product);
      state.currentProduct = product;
      state.currentSheet = sheet;
      state.detailZoom = 1;
      state.detailVisibleParts = 10;
      state.selectedPartKeys.clear();
      const queryMatch = query ? visibleSheetParts(sheet).find(({ part }) => [part.part_number, part.name, part.callout].join(' ').toLowerCase().includes(query.toLowerCase())) : null;
      if (queryMatch) state.selectedPartKeys.add(partKey(sheet, queryMatch.index));
      drawDetail();
      if (queryMatch) setTimeout(() => $(`[data-part-row="${queryMatch.index}"]`)?.scrollIntoView({ block: 'center', behavior: 'smooth' }), 300);
    } catch (error) {
      console.error('[diagram]', error);
      renderNotFound('Diagram could not be loaded', 'Please retry or contact Hikari support with the diagram code.');
    }
  }

  function drawDetail() {
    const product = state.currentProduct;
    const sheet = state.currentSheet;
    const parts = visibleSheetParts(sheet);
    const shown = parts.slice(0, state.detailVisibleParts);
    const related = state.products.filter(item => item.id !== product.id && item.model === product.model && item.category === product.category).slice(0, 5);
    const stock = stockMeta(product);
    app.innerHTML = `<section class="detail-page"><div class="container"><nav class="breadcrumbs"><a href="#home">Home</a><a href="#catalog">Parts</a><a href="${routeHash('catalog', { model: product.model })}">${esc(product.model)}</a><a href="${routeHash('catalog', { model: product.model, category: product.category })}">${esc(product.category)}</a><span>${esc(cleanTitle(product.name))}</span></nav>
      <div class="detail-grid"><article class="diagram-panel" id="diagramPanel"><header class="diagram-head"><div><h2>${esc(sheet.diagram_code)} ${esc(cleanTitle(sheet.title))}</h2><p>${esc(sheet.model_code)} · ${esc(sheet.category_label || product.category)}</p></div><div class="page-indicator"><span>Page 1 / ${Number(sheet.page_count || 1)}</span><button class="btn" id="detailFullscreen" style="width:34px;padding:0">${icon('i-expand', 17)}</button></div></header><div class="diagram-stage" id="diagramStage"><div class="diagram-tools"><button id="zoomIn" aria-label="Zoom in">${icon('i-plus', 18)}</button><button id="zoomOut" aria-label="Zoom out">${icon('i-minus', 18)}</button><button id="zoomReset" aria-label="Reset zoom">${icon('i-refresh', 18)}</button><button id="downloadImage" aria-label="Download diagram">${icon('i-download', 18)}</button><button id="printDiagram" aria-label="Print diagram">${icon('i-print', 18)}</button></div><button class="diagram-nav prev" aria-label="Previous page">${icon('i-chevron', 17)}</button><img id="diagramImage" src="${esc(sheet.preview_image || sheet.full_image || product.previewImage || product.fullImage || FALLBACK_IMAGE)}" alt="${esc(cleanTitle(sheet.title))} exploded parts diagram"><button class="diagram-nav next" aria-label="Next page">${icon('i-chevron', 17)}</button></div><div class="diagram-thumbs"><button class="diagram-thumb active"><img src="${esc(sheet.preview_image || product.previewImage || FALLBACK_IMAGE)}" alt="Diagram preview"></button>${Number(sheet.page_count || 1) > 1 ? `<button class="diagram-thumb"><img src="${esc(sheet.full_image || product.fullImage || product.previewImage || FALLBACK_IMAGE)}" alt="Parts list preview"></button>` : ''}</div></article>
      <article class="detail-side"><div class="detail-summary"><div class="detail-summary-grid"><div><span class="official-label">OFFICIAL DIAGRAM</span><h1>${esc(titleCase(cleanTitle(sheet.title)))}</h1><div class="detail-code">Diagram Code: ${esc(sheet.diagram_code)}</div><div class="compatibility"><small>Compatible Models</small><div class="compatibility-row"><span class="badge">${esc(product.model)}</span><a href="${routeHash('catalog', { model: product.model })}">View all compatible models</a></div></div></div><div class="detail-summary-side"><div class="stock-box"><b>● ${esc(stock.label)}</b><small>${product.stock === 'out' ? 'Availability confirmed during RFQ' : 'Ships after stock verification'}</small></div><div class="help-box"><b>Need a part not listed?</b><small>Our experts can help you find it.</small><button data-contact>Request Help / RFQ</button></div></div></div><div class="detail-actions"><button class="btn" id="downloadDiagram">${icon('i-download', 15)}Download Diagram</button><button class="btn btn-orange" id="addAllVisible">${icon('i-list', 15)}Add All Visible to RFQ</button></div></div>
      <div class="parts-tabs"><button class="active">Parts List</button><button>Compatibility</button><button>Notes</button><button>Shipping</button><button class="expand-all" id="expandParts">${icon('i-expand', 13)}Expand All</button></div><div class="parts-table-wrap"><table class="parts-table"><thead><tr><th></th><th>Callout</th><th>Part Number</th><th>Part Name</th><th>Qty</th><th>Notes / Compatibility</th><th>Stock</th><th>Action</th></tr></thead><tbody>${shown.map(({ part, index }) => partRowHtml(sheet, part, index)).join('')}</tbody></table></div><div class="parts-footer"><span>Showing 1 to ${Math.min(state.detailVisibleParts, parts.length)} of ${parts.length} parts</span>${state.detailVisibleParts < parts.length ? '<button id="viewMoreParts">View More Parts⌄</button>' : '<span>All published parts shown</span>'}</div></article></div>
      <section class="related-section"><div class="section-headline"><div><div class="section-label">Related Assemblies for ${esc(product.category)}</div></div><button class="view-all" data-view-related>View All ${esc(product.category)} Diagrams ${icon('i-chevron', 13)}</button></div><div class="related-grid">${related.map(item => `<button class="related-card" data-open-product="${esc(item.id)}"><img src="${esc(item.previewImage || FALLBACK_IMAGE)}" alt=""><span><b>${esc(titleCase(cleanTitle(item.name)))}</b><small>Diagram Code: ${esc(item.diagramCode)}</small><span class="status">${esc(stockMeta(item).label)}</span></span></button>`).join('') || '<div class="empty-state"><p>No related assemblies found.</p></div>'}</div></section>
      </div></section>`;
    bindDetailEvents(parts);
  }

  function partRowHtml(sheet, part, index) {
    const key = partKey(sheet, index);
    const selected = state.selectedPartKeys.has(key);
    const inCart = cartItemForKey(key);
    const stock = Number(part.admin_stock || 0);
    const stockLabel = stock > 0 ? `${stock} In Stock` : 'Pre-order';
    const action = inCart
      ? `<div class="part-qty-control" aria-label="RFQ quantity for ${esc(part.part_number)}"><button type="button" data-part-qty="minus" data-part-index="${index}" aria-label="Decrease quantity">−</button><output>${Number(inCart.qty)}</output><button type="button" data-part-qty="plus" data-part-index="${index}" aria-label="Increase quantity">+</button><button type="button" class="part-remove" data-part-qty="remove" data-part-index="${index}" aria-label="Remove from RFQ">×</button></div>`
      : `<button class="part-add" data-add-part="${index}">${icon('i-cart', 12)} Add to RFQ</button>`;
    return `<tr class="${selected ? 'selected' : ''}" data-part-row="${index}"><td><input type="checkbox" data-select-part="${index}" ${selected ? 'checked' : ''}></td><td>${esc(part.callout)}</td><td class="part-number">${esc(part.part_number)}</td><td>${esc(part.name)}</td><td>${Number(part.quantity) || 1}</td><td>${esc(part.notes || '—')}</td><td class="part-stock">● ${esc(stockLabel)}</td><td class="part-action-cell">${action}</td></tr>`;
  }

  function bindDetailEvents(parts) {
    $('#zoomIn').onclick = () => updateZoom(.2);
    $('#zoomOut').onclick = () => updateZoom(-.2);
    $('#zoomReset').onclick = () => { state.detailZoom = 1; applyZoom(); };
    $('#downloadImage').onclick = downloadCurrentDiagram;
    $('#downloadDiagram').onclick = downloadCurrentDiagram;
    $('#printDiagram').onclick = () => window.print();
    $('#detailFullscreen').onclick = () => { $('#diagramPanel').classList.toggle('diagram-fullscreen'); document.body.classList.toggle('no-scroll', $('#diagramPanel').classList.contains('diagram-fullscreen')); };
    $('#viewMoreParts')?.addEventListener('click', () => { state.detailVisibleParts = Math.min(parts.length, state.detailVisibleParts + 18); drawDetail(); });
    $('#expandParts').onclick = () => { state.detailVisibleParts = parts.length; drawDetail(); };
    $$('[data-select-part]').forEach(input => input.onchange = () => {
      const index = Number(input.dataset.selectPart);
      const key = partKey(state.currentSheet, index);
      input.checked ? state.selectedPartKeys.add(key) : state.selectedPartKeys.delete(key);
      input.closest('tr').classList.toggle('selected', input.checked);
    });
    $$('[data-add-part]').forEach(button => button.onclick = () => { addPartToCart(Number(button.dataset.addPart)); drawDetail(); });
    $$('[data-part-qty]').forEach(button => button.onclick = () => updatePartCartQuantity(Number(button.dataset.partIndex), button.dataset.partQty));
    $('#addAllVisible').onclick = () => {
      const targets = state.selectedPartKeys.size
        ? parts.filter(({ index }) => state.selectedPartKeys.has(partKey(state.currentSheet, index)))
        : parts.slice(0, state.detailVisibleParts);
      targets.forEach(({ index }) => addPartToCart(index, false));
      updateCartUi();
      toast('Parts added to RFQ', `${targets.length} spare-part line${targets.length === 1 ? '' : 's'} added.`);
      drawDetail();
    };
    $$('[data-open-product]').forEach(button => button.onclick = () => go('diagram', { id: button.dataset.openProduct }));
    $('[data-view-related]')?.addEventListener('click', () => go('catalog', { model: state.currentProduct.model, category: state.currentProduct.category }));
    $('[data-contact]').onclick = () => go('rfq');
  }

  function updatePartCartQuantity(index, action) {
    const key = partKey(state.currentSheet, index);
    const item = cartItemForKey(key);
    if (action === 'plus') {
      addPartToCart(index, false);
    } else if (item && action === 'minus') {
      item.qty -= 1;
      if (item.qty <= 0) state.cart = state.cart.filter(row => row.key !== key);
    } else if (item && action === 'remove') {
      state.cart = state.cart.filter(row => row.key !== key);
    }
    writeLocal('hikari_cart_v4', state.cart);
    updateCartUi();
    drawDetail();
  }

  function updateZoom(delta) {
    state.detailZoom = Math.max(.6, Math.min(2.5, state.detailZoom + delta));
    applyZoom();
  }
  function applyZoom() { const image = $('#diagramImage'); if (image) image.style.transform = `scale(${state.detailZoom})`; }
  function downloadCurrentDiagram() {
    const sheet = state.currentSheet;
    const href = sheet.pdf_url || sheet.full_image || sheet.preview_image;
    if (!href) { toast('Diagram unavailable', 'No downloadable source is attached to this assembly.'); return; }
    const anchor = document.createElement('a');
    anchor.href = href;
    anchor.target = '_blank';
    anchor.rel = 'noopener';
    anchor.download = sheet.pdf_url ? '' : `${sheet.model_code}-${sheet.diagram_code}-diagram.webp`;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
  }

  function addPartToCart(index, announce = true) {
    const sheet = state.currentSheet;
    const product = state.currentProduct;
    const part = sheet?.parts?.[index];
    if (!part) return;
    const key = partKey(sheet, index);
    const existing = cartItemForKey(key);
    if (existing) existing.qty += 1;
    else state.cart.push({
      key,
      kind: 'part',
      partId: part.id || null,
      sheetId: sheet.sheet_id,
      partIndex: index,
      sku: part.part_number,
      name: part.name,
      price: partPrice(part),
      image: sheet.preview_image || product.previewImage || FALLBACK_IMAGE,
      meta: `${sheet.model_code} · ${sheet.diagram_code} · Callout ${part.callout} · Diagram qty ${Number(part.quantity) || 1}`,
      qty: 1
    });
    writeLocal('hikari_cart_v4', state.cart);
    updateCartUi();
    if (announce) toast('Added to RFQ', `${part.part_number} · ${part.name}`);
  }

  function toggleWishlist(productId) {
    const key = String(productId);
    if (state.wishlist.has(key)) state.wishlist.delete(key); else state.wishlist.add(key);
    writeLocal('hikari_wishlist', [...state.wishlist]);
    toast(state.wishlist.has(key) ? 'Assembly saved' : 'Removed from saved', state.productMap.get(key)?.name || '');
  }

  function updateCartUi() {
    const count = state.cart.reduce((sum, item) => sum + Number(item.qty || 0), 0);
    const subtotal = state.cart.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.qty || 0), 0);
    $('#cartCount').textContent = String(count);
    $('#cartTotal').textContent = money(subtotal);
    $('#drawerSubtitle').textContent = `${count} item${count === 1 ? '' : 's'}`;
    $('#drawerSubtotal').textContent = money(subtotal);
    renderDrawerItems();
  }

  function renderDrawerItems() {
    const container = $('#drawerItems');
    if (!state.cart.length) {
      container.innerHTML = `<div class="drawer-empty"><div>${icon('i-cart', 50)}<h3>Your RFQ cart is empty</h3><p>Open a diagram and add exact spare parts by callout.</p></div></div>`;
      return;
    }
    container.innerHTML = state.cart.map(item => `<div class="cart-line" data-cart-key="${esc(item.key)}"><img src="${esc(item.image || FALLBACK_IMAGE)}" alt=""><div><b>${esc(item.name)}</b><small>${esc(item.sku)} · ${esc(item.meta)} · ${money(item.price)} each</small><div class="qty-control"><button data-cart-action="minus">−</button><span>${Number(item.qty)}</span><button data-cart-action="plus">+</button></div></div><button class="cart-line-remove" data-cart-action="remove">${icon('i-close', 15)}</button></div>`).join('');
    $$('.cart-line').forEach(line => line.onclick = event => {
      const button = event.target.closest('[data-cart-action]');
      if (!button) return;
      const item = state.cart.find(row => row.key === line.dataset.cartKey);
      if (!item) return;
      if (button.dataset.cartAction === 'plus') item.qty += 1;
      if (button.dataset.cartAction === 'minus') { item.qty -= 1; if (item.qty <= 0) state.cart = state.cart.filter(row => row.key !== item.key); }
      if (button.dataset.cartAction === 'remove') state.cart = state.cart.filter(row => row.key !== item.key);
      writeLocal('hikari_cart_v4', state.cart);
      updateCartUi();
      if (parseRoute().name === 'diagram' && state.currentSheet) drawDetail();
    });
  }

  function openCart() {
    $('#drawerBackdrop').classList.add('open');
    $('#cartDrawer').classList.add('open');
    document.body.classList.add('no-scroll');
    updateCartUi();
  }
  function closeCart() {
    $('#cartDrawer').classList.remove('open');
    if (!state.filterOpen) $('#drawerBackdrop').classList.remove('open');
    document.body.classList.remove('no-scroll');
  }

  async function submitRfq() {
    const name = $('#rfqName').value.trim();
    const email = $('#rfqEmail').value.trim();
    const destination = $('#rfqDestination').value.trim();
    const incoterm = $('#rfqTerm').value;
    const note = $('#rfqNote').value.trim();
    if (!state.cart.length) { toast('RFQ cart is empty', 'Add at least one spare part.'); return; }
    if (!name || !email || !destination) { toast('Complete quotation details', 'Name, email and destination are required.'); return; }
    const button = $('#submitRfqButton');
    button.disabled = true;
    button.textContent = 'Submitting…';
    const rfqSnapshot = state.cart.map(item => ({ ...item }));
    const itemSummary = rfqSnapshot.map(item => `${item.qty}× ${item.sku} ${item.name} (${item.meta})`).join('\n');
    const payload = {
      buyerName: name,
      buyerEmail: email,
      destination,
      incoterm,
      accountType: 'retail',
      message: [note, 'RFQ cart:', itemSummary].filter(Boolean).join('\n\n'),
      items: rfqSnapshot.filter(item => item.partId).map(item => ({ partId: item.partId, quantity: item.qty }))
    };
    let reference = `HT-RFQ-${Date.now().toString().slice(-8)}`;
    let submitted = false;
    try {
      if (!API_BASE) throw new Error('Live order API is not configured');
      const response = await fetch(api('/api/public-orders'), { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || `RFQ API ${response.status}`);
      reference = result.data?.reference || reference;
      submitted = true;
    } catch (error) {
      console.warn('[rfq-draft-fallback]', error);
    }
    openModal(submitted ? 'Quotation request submitted' : 'RFQ draft prepared', submitted ? `Reference ${reference}` : 'Live API unavailable — this draft was prepared locally', `<div class="content-card" style="border:0;padding:4px;max-width:none"><h2>${submitted ? 'Thank you — our team received your RFQ.' : 'Your RFQ draft is ready.'}</h2><p><b>Reference:</b> ${esc(reference)}</p><p><b>Buyer:</b> ${esc(name)} · ${esc(email)}<br><b>Destination:</b> ${esc(destination)} · ${esc(incoterm)}</p><div style="border:1px solid var(--line);border-radius:6px;padding:12px;white-space:pre-wrap;font-size:10px">${esc(itemSummary)}</div>${submitted ? '' : '<p style="color:#b65012">No submission was claimed. Connect the storefront to the Internal Hikari public-order API, then retry.</p>'}<button class="btn btn-orange" id="downloadRfqDraft" style="margin-top:12px">Download RFQ CSV</button></div>`);
    $('#downloadRfqDraft')?.addEventListener('click', () => downloadRfqCsv(rfqSnapshot, reference));
    if (submitted) {
      state.cart = [];
      writeLocal('hikari_cart_v4', state.cart);
      updateCartUi();
      closeCart();
    }
    button.disabled = false;
    button.textContent = 'Submit RFQ';
  }

  function downloadRfqCsv(items = state.cart, reference = 'draft') {
    const rows = [['part_number', 'description', 'quantity', 'fitment'], ...items.map(item => [item.sku, item.name, item.qty, item.meta])];
    const csv = rows.map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Hikari-RFQ-${String(reference).replace(/[^a-z0-9-]/gi, '_')}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  function renderModels() {
    app.innerHTML = `<section class="content-page"><div class="container"><nav class="breadcrumbs"><a href="#home">Home</a><span>Models</span></nav><div class="content-card"><h1>Shop by Tractor Model</h1><p>Select the exact model before opening system diagrams. This keeps every spare-part lookup inside the correct fitment context.</p><div class="model-cards" style="margin-top:20px">${state.models.map(model => `<button class="model-card" data-model-card="${esc(model)}"><img src="assets/images/tractor-card.webp" alt=""><span><b>${esc(model)}</b><small>${state.products.filter(product => product.model === model).length} diagrams</small></span><span>›</span></button>`).join('')}</div></div></div></section>`;
    $$('[data-model-card]').forEach(button => button.onclick = () => go('catalog', { model: button.dataset.modelCard }));
  }

  function renderRfqPage() {
    app.innerHTML = `<section class="content-page"><div class="container"><nav class="breadcrumbs"><a href="#home">Home</a><span>Request a Quote</span></nav><div class="content-card"><h1>Request a Parts Quotation</h1><p>Upload or paste your parts list. Include the tractor model, serial range, destination and required quantities whenever possible.</p><div class="rfq-page-grid"><div class="rfq-upload">${icon('i-download', 54)}<div><h3>Bulk parts-list upload</h3><p>CSV, XLSX and PDF can be connected to Internal Hikari's signed upload flow.</p><button class="btn" id="downloadTemplate">Download CSV Template</button></div></div><form class="rfq-form" id="rfqPageForm"><label>Name / Company<input name="name" required></label><label>Email<input name="email" type="email" required></label><label>Destination<input name="destination" required></label><label>Buyer Type<select name="buyerType"><option>Retail / Workshop</option><option>B2B Distributor</option><option>Fleet Operator</option></select></label><label class="full">Parts, model or engine details<textarea name="message" required placeholder="Example: L3608, diagram 050101, 2× 1A021-73036, destination Jakarta..."></textarea></label><button class="btn btn-orange full" type="submit">Create RFQ</button></form></div></div></div></section>`;
    $('#downloadTemplate').onclick = () => {
      const blob = new Blob(['part_number,description,quantity,tractor_model,buyer_note\n'], { type: 'text/csv' });
      const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = 'Hikari-bulk-order-template.csv'; link.click(); URL.revokeObjectURL(link.href);
    };
    $('#rfqPageForm').onsubmit = event => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      $('#rfqName').value = form.get('name'); $('#rfqEmail').value = form.get('email'); $('#rfqDestination').value = form.get('destination'); $('#rfqNote').value = form.get('message');
      if (!state.cart.length) toast('Add parts to your RFQ', 'Open a diagram and choose exact spare parts first.');
      openCart();
    };
  }

  function renderContentPage(name) {
    const pages = {
      help: ['Help Center', 'Find the right part faster', [
        ['i-search', 'Part-number search', 'Search by exact part number, part name, model, category or diagram code.'],
        ['i-engine', 'Model-first navigation', 'Choose the tractor model first to avoid opening diagrams from the wrong machine.'],
        ['i-help', 'Human fitment review', 'Use RFQ support when serial range, supersession or market variant needs confirmation.']
      ]],
      contact: ['Contact Hikari Tractors', 'Parts support and quotation desk', [
        ['i-phone', 'Phone', SITE.phone || '+66 2 123 4567'], ['i-mail', 'Email', SITE.email || 'support@hikaritractors.com'], ['i-globe', 'Worldwide supply', 'Freight terms and destination requirements are confirmed in the quotation.']
      ]],
      deals: ['Deals & Service Kits', 'Commercial offers are quote-controlled', [
        ['i-box', 'Maintenance kits', 'Bundle high-frequency filters, seals and service items by model.'], ['i-gear', 'Mixed-carton orders', 'Combine multiple small SKUs into one freight-ready quotation.'], ['i-truck', 'Distributor pricing', 'B2B price tiers and MOQs remain server-authoritative.']
      ]],
      about: ['About Hikari Tractors', 'Independent tractor-parts supplier', [
        ['i-shield', 'Genuine-parts workflow', 'Catalog references, fitment and availability are reviewed before shipment.'], ['i-box', 'Deep diagram catalog', `${state.products.length.toLocaleString()} published assembly records across ${state.models.length} models.`], ['i-globe', 'Export support', 'EXW, FOB, CIF and delivered terms can be quoted based on destination.']
      ]],
      terms: ['Terms & Conditions', 'Important storefront notices', [
        ['i-shield', 'Fitment confirmation', 'The buyer is responsible for providing accurate model and serial information.'], ['i-box', 'Quotation basis', 'Displayed prices and stock are not final until a quotation is accepted.'], ['i-truck', 'Freight and taxes', 'Shipping, duties, tax and destination charges are quoted separately unless stated otherwise.']
      ]]
    };
    const [title, subtitle, tiles] = pages[name] || pages.help;
    app.innerHTML = `<section class="content-page"><div class="container"><nav class="breadcrumbs"><a href="#home">Home</a><span>${esc(title)}</span></nav><div class="content-card"><h1>${esc(title)}</h1><p>${esc(subtitle)}</p><div class="info-grid">${tiles.map(([iconName, heading, copy]) => `<div class="info-tile">${icon(iconName, 30)}<h3>${esc(heading)}</h3><p>${esc(copy)}</p></div>`).join('')}</div>${name === 'contact' ? '<button class="btn btn-orange" id="contactRfq" style="margin-top:22px">Start an RFQ</button>' : ''}</div></div></section>`;
    $('#contactRfq')?.addEventListener('click', () => go('rfq'));
  }

  function renderNotFound(title, copy = 'The requested page or diagram is not available.') {
    app.innerHTML = `<section class="content-page"><div class="container"><div class="content-card" style="text-align:center"><h1>${esc(title)}</h1><p>${esc(copy)}</p><button class="btn btn-orange" data-back-catalog>Back to Catalog</button></div></div></section>`;
    $('[data-back-catalog]').onclick = () => go('catalog');
  }

  function openModal(title, subtitle, html) {
    $('#modalTitle').textContent = title;
    $('#modalSubtitle').textContent = subtitle || '';
    $('#modalBody').innerHTML = html;
    $('#modalBackdrop').classList.add('open');
    document.body.classList.add('no-scroll');
  }
  function closeModal() {
    $('#modalBackdrop').classList.remove('open');
    document.body.classList.remove('no-scroll');
  }
  function openCategoryModal() {
    openModal('Browse all systems', `${state.categories.length} categories`, `<div class="system-grid">${state.categories.map(category => `<button class="system-card" data-modal-category="${esc(category.name)}">${icon(categoryIcon(category.name), 25)}${esc(category.name)} <small>(${category.count})</small></button>`).join('')}</div>`);
    $$('[data-modal-category]').forEach(button => button.onclick = () => { closeModal(); go('catalog', { category: button.dataset.modalCategory }); });
  }

  async function route() {
    if (state.loading) return;
    closeFilterDrawer();
    const { name, params } = parseRoute();
    updateHeaderActiveState();
    if (name === 'home') renderHome();
    else if (name === 'catalog') {
      state.selectedModel = params.get('model') || '';
      state.selectedCategory = params.get('category') || '';
      state.query = params.get('q') || '';
      state.page = 1;
      $('#globalSearchInput').value = state.query;
      renderCatalog();
    } else if (name === 'diagram') await renderDetail(params.get('id'), params.get('q') || '');
    else if (name === 'models') renderModels();
    else if (name === 'rfq') renderRfqPage();
    else if (['help', 'contact', 'deals', 'about', 'terms'].includes(name)) renderContentPage(name);
    else renderNotFound('Page not found');
    updateHeaderActiveState();
    requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'auto' }));
  }

  function bindShell() {
    $('#globalSearchForm').addEventListener('submit', event => {
      event.preventDefault();
      const query = $('#globalSearchInput').value.trim();
      const category = $('#globalCategorySelect').value;
      $('#globalSearchPopover').classList.remove('open');
      go('catalog', { category, q: query });
    });
    $('#globalSearchInput').addEventListener('input', event => renderSearchSuggestions(event.target.value));
    $('#globalSearchInput').addEventListener('keydown', event => { if (event.key === 'Escape') $('#globalSearchPopover').classList.remove('open'); });
    $('#globalSearchPopover').addEventListener('click', event => {
      const button = event.target.closest('[data-suggestion-id]');
      if (!button) return;
      $('#globalSearchPopover').classList.remove('open');
      go('diagram', { id: button.dataset.suggestionId, q: $('#globalSearchInput').value.trim() });
    });
    document.addEventListener('click', event => {
      if (!event.target.closest('.global-search')) $('#globalSearchPopover').classList.remove('open');
    });
    $('#cartButton').onclick = openCart;
    $('#drawerClose').onclick = closeCart;
    $('#drawerBackdrop').onclick = () => { closeCart(); closeFilterDrawer(); };
    $('#submitRfqButton').onclick = submitRfq;
    $('#modalClose').onclick = closeModal;
    $('#modalBody').addEventListener('click', event => { if (event.target.closest('[data-modal-close]')) closeModal(); });
    $('#modalBackdrop').onclick = event => { if (event.target === $('#modalBackdrop')) closeModal(); };
    $('#mobileMenuButton').onclick = () => $('.main-nav').classList.toggle('open');
    $('#browseCategoriesButton').onclick = openCategoryModal;
    $('#viewAllModelsButton').onclick = () => go('models');
    $('#modelStripLinks').addEventListener('click', event => { const button = event.target.closest('[data-header-model]'); if (button) go('catalog', { model: button.dataset.headerModel }); });
    $('#accountButton').onclick = () => openModal('My Account', 'Account integration', '<div class="content-card" style="border:0;padding:4px"><h2>Customer account area</h2><p>Connect this button to your authentication provider and customer profile API. Cart and saved assemblies currently persist locally for guest users.</p><button class="btn btn-orange" data-modal-close>Continue as Guest</button></div>');
    $('#langButton').onclick = () => toast('Language selector', 'English is active. Add translated catalog content through the CMS.');
    $('#currencyButton').onclick = () => toast('Currency', `${CURRENCY.code} display is active. Server quotations remain authoritative.`);
    $('#newsletterForm').onsubmit = event => { event.preventDefault(); toast('Subscription captured', 'Connect this form to your email-marketing endpoint.'); event.currentTarget.reset(); };
    document.addEventListener('keydown', event => { if (event.key === 'Escape') { closeModal(); closeCart(); closeFilterDrawer(); $('.main-nav').classList.remove('open'); } });
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && Date.now() - lastCatalogRefreshAt >= 300_000) refreshCatalogControl();
    });
    window.addEventListener('hashchange', route);
    window.setInterval(() => refreshCatalogControl(), 300_000);
  }

  async function boot() {
    bindShell();
    try {
      await loadCatalog();
      await route();
    } catch (error) {
      console.error('[boot]', error);
      state.loading = false;
      renderNotFound('Catalog failed to load', 'Check the static data files or Internal Hikari public catalog API configuration.');
    }
  }

  boot();
})();
