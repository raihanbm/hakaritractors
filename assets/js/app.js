'use strict';

(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const app = $('#app');
  const API_BASE = String(window.HIKARI_CONFIG?.catalogApiBase || '').replace(/\/$/, '');
  const FALLBACK_IMAGE = 'assets/images/tractor.webp';
  const HERO_IMAGE = 'assets/images/hero-kubota-cover.webp';
  const SITE = window.HIKARI_CONFIG?.storefront || {};
  const REGION_DEFAULT = regionalDefault();
  const initialLanguage = readLocal('hikari_language', REGION_DEFAULT.language);
  const initialCurrency = readLocal('hikari_currency', REGION_DEFAULT.currency);
  let CURRENCY = currencyProfile(initialCurrency);
  const PAGE_SIZE = 20;
  let catalogRefreshPromise = null;
  let lastCatalogRefreshAt = 0;

  const state = {
    loading: true,
    language: initialLanguage === 'id' ? 'id' : 'en',
    currency: CURRENCY.code,
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
    priceMin: Number(readLocal('hikari_price_min_usd', 0)) || 0,
    priceMax: Number(readLocal('hikari_price_max_usd', 0)) || 0,
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

  const ID_COPY = Object.freeze({
    'Genuine Parts for Kubota Tractors': 'Suku Cadang Asli untuk Traktor Kubota',
    'English': 'English', 'Home': 'Beranda', 'Parts': 'Suku Cadang', 'Diagrams': 'Diagram', 'Models': 'Model Traktor',
    'Request a Quote (RFQ)': 'Minta Penawaran (RFQ)', 'Request a Quote': 'Minta Penawaran', 'Deals': 'Penawaran',
    'Help Center': 'Pusat Bantuan', 'Contact Us': 'Hubungi Kami', 'Browse Categories': 'Jelajahi Kategori',
    'SHOP BY TRACTOR MODEL': 'CARI BERDASARKAN MODEL TRAKTOR', 'View All Models': 'Lihat Semua Model',
    'My Account': 'Akun Saya', 'Sign in / Register': 'Masuk / Daftar', 'Cart': 'Keranjang',
    'All Categories': 'Semua Kategori', 'Search': 'Cari', 'View Diagram': 'Lihat Diagram',
    '100% Genuine Parts': 'Suku Cadang 100% Asli', 'Authentic parts for reliable performance': 'Suku cadang asli untuk performa yang andal',
    'RFQ Support': 'Bantuan Penawaran', 'Need help? Our experts are here for you.': 'Butuh bantuan? Tim ahli kami siap membantu.',
    'Diagram Based Ordering': 'Pesan Berdasarkan Diagram', 'Accurate parts with official diagrams': 'Suku cadang tepat berdasarkan diagram resmi',
    'Worldwide Shipping': 'Pengiriman Internasional', 'Fast & secure delivery to your location': 'Pengiriman aman dan cepat ke lokasi Anda',
    'SHOP': 'BELANJA', 'SUPPORT': 'BANTUAN', 'COMPANY': 'PERUSAHAAN', 'NEWSLETTER': 'NEWSLETTER',
    'All Categories': 'Semua Kategori', 'Tractor Models': 'Model Traktor', 'Parts by Diagram': 'Suku Cadang per Diagram',
    'Special Deals': 'Penawaran Khusus', 'How to Order': 'Cara Memesan', 'Shipping & Delivery': 'Pengiriman',
    'Returns & Warranty': 'Pengembalian & Garansi', 'About Us': 'Tentang Kami', 'Terms & Conditions': 'Syarat & Ketentuan',
    'Get updates on new parts, deals and more.': 'Dapatkan kabar suku cadang baru, penawaran, dan informasi lainnya.',
    'Enter your email': 'Masukkan email Anda', 'Subscribe': 'Berlangganan',
    'Quotation details': 'Detail Penawaran', 'Name / Company': 'Nama / Perusahaan', 'Destination': 'Tujuan Pengiriman',
    'Trade term': 'Ketentuan Pengiriman', 'Buyer note': 'Catatan Pembeli', 'Submit RFQ': 'Kirim Permintaan Penawaran',
    'Estimated parts subtotal': 'Perkiraan subtotal suku cadang', 'Need help?': 'Butuh bantuan?',
    'Hikari Support Online': 'Tim Hikari Siap Membantu', 'Need help finding the right part?': 'Butuh bantuan mencari suku cadang yang tepat?',
    'Send your tractor model, diagram code, or part number. Our team will help check fitment before you request a quote.': 'Kirim model traktor, kode diagram, atau nomor part. Tim kami akan membantu memeriksa kecocokan sebelum Anda meminta penawaran.',
    'Chat via WhatsApp': 'Hubungi via WhatsApp', 'Close support chat': 'Tutup bantuan',
    'Your RFQ cart is empty': 'Keranjang penawaran Anda masih kosong',
    'Open a diagram and add exact spare parts by callout.': 'Buka diagram dan tambahkan suku cadang sesuai nomor penunjuk.',
    'Add to RFQ': 'Tambah ke Penawaran', 'Download Diagram': 'Unduh Diagram', 'Add All Visible to RFQ': 'Tambah Semua ke Penawaran',
    'Official Diagram': 'DIAGRAM RESMI', 'Compatible Models': 'Model yang Sesuai', 'In Stock': 'Tersedia', 'Limited Stock': 'Stok Terbatas', 'Pre-order': 'Pre-order',
    'Need a part not listed?': 'Belum menemukan suku cadang yang dicari?', 'Request Help / RFQ': 'Minta Bantuan / Penawaran',
    'Parts List': 'Daftar Suku Cadang', 'Compatibility': 'Kecocokan', 'Notes': 'Catatan', 'Shipping': 'Pengiriman',
    'Expand All': 'Tampilkan Semua', 'Callout': 'Penunjuk', 'Part Number': 'Nomor Part', 'Part Name': 'Nama Suku Cadang',
    'Qty': 'Jumlah', 'Stock': 'Stok', 'Action': 'Aksi', 'Related Assemblies': 'Rangkaian Terkait',
    'From': 'Mulai', 'Assembly Diagrams Found': 'Diagram Rangkaian Ditemukan',
    'Need help finding parts?': 'Butuh bantuan mencari suku cadang?', 'Our parts experts are here for you.': 'Tim spesialis kami siap membantu.',
    'Contact Us': 'Hubungi Kami', 'Tractor Model': 'Model Traktor', 'System Category': 'Kategori Sistem',
    'Stock Status': 'Status Stok', 'Clear': 'Hapus', 'Show more': 'Tampilkan lainnya', 'All models': 'Semua model',
    'Filters': 'Filter', 'Sort by:': 'Urutkan:', 'Recommended': 'Rekomendasi', 'Most parts': 'Part terbanyak',
    'Price: Low to High': 'Harga: Terendah ke Tertinggi', 'Price: High to Low': 'Harga: Tertinggi ke Terendah',
    'Active Filters:': 'Filter Aktif:', 'Clear All': 'Hapus Semua', 'View:': 'Tampilan:',
    'No matching diagrams': 'Diagram yang sesuai tidak ditemukan', 'Try a broader model, system or part-number search.': 'Coba gunakan model, sistem, atau nomor part yang lebih umum.',
    'Reset filters': 'Atur Ulang Filter', 'Showing': 'Menampilkan', 'to': 'sampai', 'of': 'dari', 'diagrams': 'diagram',
    'Page': 'Halaman', 'Pages': 'Halaman', 'Price Range': 'Rentang Harga',
    'GENUINE KUBOTA TRACTOR PARTS': 'SUKU CADANG ASLI TRAKTOR KUBOTA',
    'Find the correct spare part by tractor model, system, part number, or official exploded diagram.': 'Temukan suku cadang yang tepat berdasarkan model traktor, sistem, nomor part, atau diagram resmi.',
    'Browse Parts': 'Jelajahi Suku Cadang', 'Find Part Number': 'Cari Nomor Part',
    'Model': 'Model', 'Select model': 'Pilih model', 'Category': 'Kategori', 'Select category': 'Pilih kategori',
    'Diagram Code': 'Kode Diagram', 'Search Parts': 'Cari Suku Cadang',
    'SHOP BY TRACTOR MODEL': 'PILIH BERDASARKAN MODEL TRAKTOR',
    'Start from the exact model to avoid ordering the wrong fitment.': 'Mulai dari model yang tepat agar tidak salah memilih kecocokan suku cadang.',
    'assembly diagrams': 'diagram rangkaian', 'View Parts': 'Lihat Suku Cadang',
    'I know the part number': 'Saya tahu nomor part', 'Search exact part number': 'Cari nomor part secara tepat', 'Search': 'Cari',
    'I know the tractor model': 'Saya tahu model traktor', 'Browse matching systems': 'Jelajahi sistem yang sesuai', 'Choose model': 'Pilih model',
    'I am not sure which part': 'Saya belum tahu suku cadangnya', 'Open an exploded diagram': 'Buka diagram rangkaian', 'Browse diagram': 'Jelajahi diagram',
    'BROWSE BY SYSTEM': 'JELAJAHI BERDASARKAN SISTEM', 'Choose the tractor area where the part is installed.': 'Pilih bagian traktor tempat suku cadang dipasang.',
    'View All Systems': 'Lihat Semua Sistem',
    'POPULAR CATALOG PICKS': 'PILIHAN KATALOG POPULER', 'Useful shortcuts generated from the real published Hikari catalog.': 'Pilihan cepat dari katalog Hikari yang benar-benar dipublikasikan.',
    'View Complete Catalog': 'Lihat Katalog Lengkap', 'Popular Picks': 'Pilihan Populer', 'Best Starting Price': 'Harga Mulai Terbaik', 'Most Detailed Diagrams': 'Diagram Terlengkap',
    'Popular': 'Populer', 'Value': 'Harga Baik', 'Detailed': 'Terlengkap', 'For You': 'Untuk Anda', 'parts': 'part',
    'FEATURED EXPLODED DIAGRAMS': 'DIAGRAM RANGKAIAN UNGGULAN', 'Open a diagram, identify the callout, then add the exact row to your RFQ.': 'Buka diagram, temukan nomor penunjuk, lalu tambahkan baris yang tepat ke RFQ.',
    'Based on the latest model selected in this browser.': 'Berdasarkan model terakhir yang dipilih pada browser ini.',
    'Still not sure which part is correct?': 'Masih belum yakin suku cadang yang tepat?',
    'Send the tractor model, serial number, photo, or diagram code. Hikari Support can help check fitment before RFQ.': 'Kirim model traktor, nomor seri, foto, atau kode diagram. Tim Hikari dapat membantu memeriksa kecocokan sebelum RFQ.',
    'Ask Hikari Support': 'Tanya Tim Hikari', 'From': 'Mulai dari'
  });
  const textSource = new WeakMap();
  const placeholderSource = new WeakMap();

  function regionalDefault() {
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    return /^Asia\/(Jakarta|Makassar|Jayapura)$/.test(zone) ? { language: 'id', currency: 'IDR' } : { language: 'en', currency: 'USD' };
  }
  function currencyProfile(code) {
    const preset = SITE.currencies?.[code] || SITE.currencies?.USD || { code: 'USD', symbol: '$', usdRate: 1, locale: 'en-US', fractionDigits: 2 };
    return { code: preset.code, symbol: preset.symbol, rate: Number(preset.usdRate) || 1, locale: preset.locale || 'en-US', fractionDigits: Number.isInteger(preset.fractionDigits) ? preset.fractionDigits : 2 };
  }
  function t(value) {
    const source = String(value ?? '');
    return state?.language === 'id' ? (ID_COPY[source] || source) : source;
  }
  function translateTextNode(node) {
    const source = textSource.get(node) ?? node.nodeValue;
    textSource.set(node, source);
    const match = source.match(/^(\s*)([\s\S]*?)(\s*)$/);
    node.nodeValue = `${match?.[1] || ''}${t(match?.[2] || source)}${match?.[3] || ''}`;
  }
  function localizeVisibleCopy() {
    document.documentElement.lang = state.language === 'id' ? 'id' : 'en';
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const parent = node.parentElement;
        return parent && !/^(SCRIPT|STYLE|NOSCRIPT|OPTION)$/i.test(parent.tagName) && node.nodeValue.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    });
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(translateTextNode);
    document.querySelectorAll('[placeholder]').forEach(element => {
      const source = placeholderSource.get(element) ?? element.getAttribute('placeholder');
      placeholderSource.set(element, source);
      element.setAttribute('placeholder', t(source));
    });
  }
  function syncPreferencesUi() {
    $('#languageLabel').textContent = state.language === 'id' ? 'Bahasa Indonesia' : 'English';
    $('#currencyLabel').textContent = `${CURRENCY.code} ${CURRENCY.symbol}`;
    $$('[data-language]').forEach(button => button.classList.toggle('active', button.dataset.language === state.language));
    $$('[data-currency]').forEach(button => button.classList.toggle('active', button.dataset.currency === CURRENCY.code));
    localizeVisibleCopy();
  }
  function closePreferenceMenus() {
    $$('.preference-menu.open').forEach(menu => menu.classList.remove('open'));
    $$('#langButton, #currencyButton').forEach(button => button.setAttribute('aria-expanded', 'false'));
  }
  function setLanguage(language, manual = false) {
    state.language = language === 'id' ? 'id' : 'en';
    writeLocal('hikari_language', state.language);
    if (manual) writeLocal('hikari_language_locked', true);
    syncPreferencesUi();
    if (!state.loading) route();
  }
  function setCurrency(code, manual = false) {
    CURRENCY = currencyProfile(code === 'IDR' ? 'IDR' : 'USD');
    state.currency = CURRENCY.code;
    writeLocal('hikari_currency', state.currency);
    if (manual) writeLocal('hikari_currency_locked', true);
    updateCartUi();
    syncPreferencesUi();
    if (!state.loading) route();
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
    const formatted = value.toLocaleString(CURRENCY.locale, { minimumFractionDigits: CURRENCY.fractionDigits, maximumFractionDigits: CURRENCY.fractionDigits });
    return CURRENCY.code === 'IDR' ? `Rp${formatted}` : `${CURRENCY.symbol}${formatted}`;
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
    node.innerHTML = `<b>${esc(t(title))}</b>${message ? `<small>${esc(t(message))}</small>` : ''}`;
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
        additional_media: assembly.additional_media || [],
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
        fullImage,
        additional_media: assembly.additional_media || []
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
    if (window.HIKARI_PREVIEW_DATA?.products?.length) {
      state.baseProducts = window.HIKARI_PREVIEW_DATA.products;
      state.products = state.baseProducts;
      state.sheetIndex = window.HIKARI_PREVIEW_DATA.sheetIndex || {};
      state.sheetSearch = window.HIKARI_PREVIEW_DATA.sheetSearch || { partNumbers: {}, partNames: {}, sheets: {} };
      state.source = 'preview-inline';
      applyControlState(window.HIKARI_PREVIEW_DATA.control || null);
      buildMetadata();
      state.loading = false;
      lastCatalogRefreshAt = Date.now();
      hydrateHeader();
      updateCartUi();
      return;
    }
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
    $('#supportPhone').textContent = SITE.phone || '+62 852-8755-1869';
    $('#supportEmail').textContent = SITE.email || 'info@hikaritractors.com';
    $('#genuineLabel').textContent = SITE.genuineLabel || 'Genuine Parts for Kubota Tractors';
    const whatsapp = String(SITE.whatsapp || SITE.phone || '').replace(/\D/g, '');
    $('#supportWhatsappLink').href = `https://wa.me/${whatsapp}?text=${encodeURIComponent('Hello Hikari Tractors, I need help finding a spare part.')}`;
    $('#supportEmailLink').href = `mailto:${SITE.email || 'info@hikaritractors.com'}`;
    $('#supportEmailLink span').textContent = SITE.email || 'info@hikaritractors.com';
    const categorySelect = $('#globalCategorySelect');
    categorySelect.innerHTML = `<option value="">All Categories</option>${state.categories.map(category => `<option value="${esc(category.name)}">${esc(category.name)}</option>`).join('')}`;
    const strip = $('#modelStripLinks');
    strip.innerHTML = state.models.slice(0, 7).map(model => `<button type="button" data-header-model="${esc(model)}">${esc(model)}</button>`).join('');
    updateHeaderActiveState();
    syncPreferencesUi();
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

  function homeMarketCard(product, badge = '') {
    const stock = stockMeta(product);
    return `<article class="home-market-card">
      <button class="home-market-image" data-open-product="${esc(product.id)}" aria-label="Open ${esc(cleanTitle(product.name))}">
        ${badge ? `<span class="home-market-badge">${esc(badge)}</span>` : ''}
        <img loading="lazy" src="${esc(product.previewImage || FALLBACK_IMAGE)}" alt="${esc(cleanTitle(product.name))}">
      </button>
      <div class="home-market-body">
        <span class="home-market-category">${esc(product.category)}</span>
        <h3>${esc(titleCase(cleanTitle(product.name)))}</h3>
        <code>${esc(product.diagramCode)}</code>
        <div class="home-market-fitment"><span>${esc(product.model)}</span><small>${Number(product.partCount || 0)} parts</small></div>
        <div class="home-market-price"><span><small>From</small><b>${money(productPrice(product))}</b></span><em class="${product.stock === 'out' ? 'is-preorder' : ''}">${esc(stock.label)}</em></div>
        <button class="home-market-cta" data-open-product="${esc(product.id)}">View Diagram ${icon('i-chevron', 12)}</button>
      </div>
    </article>`;
  }

  function homeProductSets() {
    const byScore = [...state.products].sort((a, b) => {
      const score = product => (product.stock === 'in' ? 150 : product.stock === 'low' ? 80 : 0) + Math.min(120, Number(product.partCount || 0)) + Math.min(50, Number(product.qty || 0));
      return score(b) - score(a);
    });
    const bestValue = [...state.products].filter(product => productPrice(product) > 0).sort((a, b) => productPrice(a) - productPrice(b) || Number(b.partCount || 0) - Number(a.partCount || 0));
    const detailed = [...state.products].sort((a, b) => Number(b.partCount || 0) - Number(a.partCount || 0));
    const recentModel = state.selectedModel || readLocal('hikari_recent_model', '') || state.models[0] || '';
    let recommended = state.products.filter(product => product.model === recentModel && product.stock !== 'out');
    if (recommended.length < 6) recommended = state.products.filter(product => product.model === recentModel);
    if (recommended.length < 6) recommended = byScore;
    return {
      popular: byScore.slice(0, 6),
      value: bestValue.slice(0, 6),
      detailed: detailed.slice(0, 6),
      recommended: recommended.slice(0, 6),
      recentModel
    };
  }

  function bindHomeProductLinks(root = document) {
    $$('[data-open-product]', root).forEach(button => button.onclick = () => go('diagram', { id: button.dataset.openProduct }));
  }

  function activateHomePanel(name) {
    $$('[data-home-tab]').forEach(button => {
      const active = button.dataset.homeTab === name;
      button.classList.toggle('active', active);
      button.setAttribute('aria-selected', String(active));
    });
    $$('[data-home-panel]').forEach(panel => { panel.hidden = panel.dataset.homePanel !== name; });
  }

  function renderHome() {
    const modelCounts = state.models.map(model => ({ model, count: state.products.filter(product => product.model === model).length }));
    const preferredModelOrder = ['L3608', 'L4400DT', 'L5018DT-NES', 'M9000DT', 'M9540DT', 'MX5000DT', 'MX5100DT'];
    const models = preferredModelOrder.map(model => modelCounts.find(item => item.model === model)).filter(Boolean);
    modelCounts.filter(item => !preferredModelOrder.includes(item.model)).forEach(item => models.push(item));
    const categories = [...state.categories].sort((a, b) => b.count - a.count);
    const categoryOrder = ['Engine', 'Cooling System', 'Electrical System', 'Clutch & Transmission', 'Front Axle & Chassis', 'Hydraulic System', 'Fuel System', 'Steering System'];
    const systems = categoryOrder.map(name => categories.find(category => normalize(category.name).includes(normalize(name).split(' ')[0]))).filter(Boolean);
    categories.filter(category => !systems.includes(category)).forEach(category => systems.push(category));

    const pick = (patterns, fallbackIndex = 0) => {
      const list = Array.isArray(patterns) ? patterns : [patterns];
      return state.products.find(product => list.some(pattern => pattern.test(`${product.name} ${product.category} ${product.diagramCode}`))) || state.products[fallbackIndex % Math.max(1, state.products.length)];
    };
    const promoProduct = pick([/fuel filter/i, /oil filter/i, /filter/i], 0);
    const bestSellers = [
      { product: pick([/oil filter/i, /filter/i], 1), title: 'Oil Filter', image: 'assets/images/reference-products/oil-filter.jpg' },
      { product: pick([/fuel filter/i, /separator/i], 2), title: 'Fuel Filter', image: 'assets/images/reference-products/fuel-filter.jpg' },
      { product: pick([/air cleaner/i, /air filter/i], 3), title: 'Air Filter', image: 'assets/images/reference-products/air-filter.jpg' },
      { product: pick([/element/i, /cleaner/i], 4), title: 'Element Assy', image: 'assets/images/reference-products/element-assy.jpg' }
    ];
    const latest = [
      { product: pick([/o-ring/i, /ring/i], 10), title: 'O-Ring', image: 'assets/images/reference-products/oring.jpg' },
      { product: pick([/seal/i], 11), title: 'Seal Oil', image: 'assets/images/reference-products/seal-oil.jpg' },
      { product: pick([/gasket/i], 12), title: 'Gasket Head', image: 'assets/images/reference-products/gasket-head.jpg' },
      { product: pick([/bolt/i, /screw/i], 13), title: 'Bolt', image: 'assets/images/reference-products/bolt.jpg' }
    ];
    const recommendations = [
      { product: pick([/oil pump/i, /hydraulic pump/i], 20), title: 'Oil Pump Assy', image: 'assets/images/reference-products/oil-pump.jpg' },
      { product: pick([/radiator/i], 21), title: 'Radiator Assy', image: 'assets/images/reference-products/radiator.jpg' },
      { product: pick([/fan/i], 22), title: 'Fan Blade', image: 'assets/images/reference-products/fan-blade.jpg' },
      { product: pick([/water pump/i, /pump/i], 23), title: 'Water Pump', image: 'assets/images/reference-products/water-pump.jpg' }
    ];
    const diagrams = [...state.products].sort((a, b) => Number(b.partCount || 0) - Number(a.partCount || 0)).slice(0, 3);

    const rupiah = product => {
      const raw = Math.max(0, Math.round(productPrice(product) * CURRENCY.rate));
      if (CURRENCY.code === 'IDR') return `Rp${raw.toLocaleString('id-ID')}`;
      return money(productPrice(product)).replace('.00', '');
    };
    const compactPrice = product => {
      const raw = Math.max(8000, Math.round(productPrice(product) * CURRENCY.rate));
      if (CURRENCY.code === 'IDR') return `Rp${raw.toLocaleString('id-ID')}`;
      return money(productPrice(product)).replace('.00', '');
    };
    const productCard = (item, badge = '') => `<button class="px-product-card" type="button" data-open-product="${esc(item.product.id)}">
      <span class="px-product-media">${badge ? `<em>${esc(badge)}</em>` : ''}<img src="${esc(item.image || item.product.previewImage || FALLBACK_IMAGE)}" alt="${esc(item.title)}"></span>
      <span class="px-product-copy"><b>${esc(item.title)}</b><small>${esc(item.product.diagramCode || item.product.sku || '')}</small><strong>${compactPrice(item.product)}</strong>${item.sold ? `<i>${esc(item.sold)}</i>` : ''}</span>
    </button>`;
    const diagramCard = product => `<button class="px-diagram-card" type="button" data-open-product="${esc(product.id)}">
      <img src="${esc(product.previewImage || FALLBACK_IMAGE)}" alt="${esc(cleanTitle(product.name))}">
      <span><b>${esc(titleCase(cleanTitle(product.name)))}</b><small>${esc(product.model)}</small><em>${Number(product.partCount || 0)} Part</em></span>
    </button>`;

    app.innerHTML = `<div class="px-home">
      <section class="px-hero">
        <img class="px-hero-image" src="${HERO_IMAGE}" alt="Traktor Kubota di lahan pertanian">
        <div class="px-hero-overlay"></div>
        <div class="px-container px-hero-inner">
          <div class="px-hero-copy"><h1>Find the right part.<span>Order with confidence.</span></h1><p>Model-first tractor parts references, exploded diagrams, and RFQ support for fitment and commercial confirmation.</p><div class="px-hero-actions"><button class="px-primary" type="button" data-home-browse>Browse Parts Catalog ${icon('i-chevron', 14)}</button><button class="px-secondary" type="button" data-home-part-search>Search Part Number ${icon('i-chevron', 13)}</button></div><div class="px-hero-dots" aria-hidden="true"><i class="active"></i><i></i><i></i></div></div>
          <div class="px-trust-row"><span>${icon('i-engine', 17)}Model & part references</span><span>${icon('i-truck', 17)}Freight by quotation</span><span>${icon('i-user', 17)}Fitment support</span><span>${icon('i-box', 17)}RFQ-based ordering</span></div>
        </div>
      </section>

      <main class="px-home-body">
        <section class="px-container px-models-block">
          <div class="px-section-title"><h2>Pilih Model Traktor</h2><button type="button" data-all-models>Lihat Semua ${icon('i-chevron', 11)}</button></div>
          <div class="px-model-strip">${models.slice(0, 7).map(({ model, count }) => `<button class="px-model-card" type="button" data-model-card="${esc(model)}"><img src="assets/images/tractor-card.webp" alt="${esc(model)}"><span><b>${esc(model)}</b><small>${Math.max(1245, count * 13)} part tersedia</small></span></button>`).join('')}<button class="px-model-card px-model-more" type="button" data-all-models><span><b>Lihat Semua<br>Model</b><small>Semua model</small></span>${icon('i-chevron', 15)}</button></div>
        </section>

        <section class="px-container px-finder-card">
          <h2>Temukan Part dengan Mudah</h2>
          <form id="heroSearchPanel" class="px-finder-form">
            <label><span>Pilih Model Traktor</span><select id="heroModel"><option value="">Pilih Model Traktor</option>${state.models.map(model => `<option value="${esc(model)}">${esc(model)}</option>`).join('')}</select></label>
            <label><span>Pilih Kategori / Sistem</span><select id="heroCategory"><option value="">Pilih Kategori / Sistem</option>${state.categories.map(category => `<option value="${esc(category.name)}">${esc(category.name)}</option>`).join('')}</select></label>
            <label><span>Nomor Part (Opsional)</span><input id="heroPartNumber" placeholder="Nomor Part (Opsional)"></label>
            <label><span>Kode Diagram (Opsional)</span><input id="heroDiagramCode" placeholder="Kode Diagram (Opsional)"></label>
            <button type="submit">Cari Part</button>
          </form>
        </section>

        <section class="px-container px-systems-block">
          <div class="px-section-title"><h2>Jelajahi Berdasarkan Sistem</h2><button type="button" data-all-categories>Lihat Semua ${icon('i-chevron', 11)}</button></div>
          <div class="px-system-grid">${systems.slice(0, 8).map(category => `<button type="button" data-system-card="${esc(category.name)}">${icon(categoryIcon(category.name), 27)}<b>${esc(category.name)}</b><small>${category.count.toLocaleString('id-ID')}+ Part</small></button>`).join('')}<button type="button" data-all-categories>${icon('i-grid', 26)}<b>Lihat Semua</b><small>Semua Kategori</small></button></div>
        </section>

        <section class="px-container px-market-grid">
          <div class="px-market-panel px-deals-panel">
            <div class="px-panel-title"><h2>Featured Reference</h2><button type="button" data-all-diagrams>Browse Catalog ${icon('i-chevron', 10)}</button></div>
            <button type="button" class="px-deal-card" data-open-product="${esc(promoProduct.id)}"><span class="px-sale-badge">REFERENCE</span><img src="assets/images/reference-products/promo-filter.jpg" alt="Featured tractor parts reference"><span class="px-deal-copy"><b>${esc(titleCase(cleanTitle(promoProduct.name || 'Tractor Parts Reference')))}</b><small>Diagram and fitment details</small><strong>${compactPrice(promoProduct)}</strong></span><span class="px-countdown"><small>Available for</small><b>RFQ</b></span></button>
          </div>

          <div class="px-market-panel px-bestseller-panel">
            <div class="px-panel-title"><h2>Popular References</h2><button type="button" data-all-diagrams>Browse Catalog ${icon('i-chevron', 10)}</button></div>
            <div class="px-product-strip">${bestSellers.map(item => productCard(item)).join('')}</div>
          </div>

          <div class="px-market-panel px-diagram-panel">
            <div class="px-panel-title"><h2>Diagram Populer</h2><button type="button" data-all-diagrams>Lihat Semua ${icon('i-chevron', 10)}</button></div>
            <div class="px-diagram-strip">${diagrams.map(diagramCard).join('')}</div>
          </div>

          <div class="px-market-panel px-latest-panel">
            <div class="px-panel-title"><h2>Sparepart Terbaru</h2><button type="button" data-all-diagrams>Lihat Semua ${icon('i-chevron', 10)}</button></div>
            <div class="px-product-strip">${latest.map(item => productCard(item, 'Baru')).join('')}</div>
          </div>

          <div class="px-market-panel px-recommend-panel">
            <div class="px-panel-title"><h2>Rekomendasi Untuk Anda</h2><button type="button" data-all-diagrams>Lihat Semua ${icon('i-chevron', 10)}</button></div>
            <div class="px-product-strip">${recommendations.map(item => productCard(item)).join('')}</div>
          </div>
        </section>
      </main>
    </div>`;

    $('#heroSearchPanel').addEventListener('submit', event => {
      event.preventDefault();
      const model = $('#heroModel').value;
      const category = $('#heroCategory').value;
      const part = $('#heroPartNumber').value.trim();
      const diagram = $('#heroDiagramCode').value.trim();
      if (model) writeLocal('hikari_recent_model', model);
      go('catalog', { model, category, q: part || diagram });
    });
    $('[data-home-browse]').onclick = () => go('catalog');
    $$('[data-home-part-search]').forEach(button => button.onclick = () => {
      if (window.innerWidth <= 760) {
        document.querySelector('.px-finder-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setTimeout(() => $('#heroPartNumber')?.focus(), 400);
      } else {
        $('#globalSearchInput').focus();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
    $$('[data-model-card]').forEach(button => button.onclick = () => { writeLocal('hikari_recent_model', button.dataset.modelCard); go('catalog', { model: button.dataset.modelCard }); });
    $$('[data-system-card]').forEach(button => button.onclick = () => go('catalog', { category: button.dataset.systemCard }));
    bindHomeProductLinks(app);
    $$('[data-all-models]').forEach(button => button.onclick = () => go('models'));
    $$('[data-all-categories]').forEach(button => button.onclick = () => openCategoryModal());
    $$('[data-all-diagrams]').forEach(button => button.onclick = () => go('catalog'));
  }


  function maxCatalogPrice() {
    return Math.max(1, Math.ceil(Math.max(...state.products.map(product => productPrice(product)).filter(Number.isFinite), 1)));
  }

  function filteredProducts() {
    const query = state.query.toLowerCase().trim();
    let rows = state.products.filter(product => {
      const selectedModel = !state.selectedModel || product.model === state.selectedModel;
      const selectedCategory = !state.selectedCategory || product.category === state.selectedCategory;
      const selectedStock = !state.stock.size || state.stock.has(product.stock);
      const price = productPrice(product);
      const selectedPrice = (!state.priceMin || price >= state.priceMin) && (!state.priceMax || price <= state.priceMax);
      const haystack = [product.name, product.sku, product.diagramCode, product.model, product.category].join(' ').toLowerCase();
      const matchesQuery = !query || haystack.includes(query) || normalize(haystack).includes(normalize(query)) || partMatches(product, query).length;
      return selectedModel && selectedCategory && selectedStock && selectedPrice && matchesQuery;
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
        <div class="product-info-list"><div class="product-kicker">${esc(product.category)}</div><h3>${esc(titleCase(cleanTitle(product.name)))}</h3><div class="product-code">${esc(product.diagramCode)}</div>${matched ? `<div class="badge orange" title="Matched part">Part: ${esc(matched.part_number)}</div>` : ''}<div class="product-models">${models.map(model => `<span>${esc(model)}</span>`).join('')}</div><div class="product-data"><span>⬡ ${Number(product.partCount || 0)} ${t('Parts')}</span><span>▱ ${Number(product.pageCount || 1)} ${t(Number(product.pageCount || 1) > 1 ? 'Pages' : 'Page')}</span></div></div>
        <div class="product-action-list"><div class="product-price-row"><b>${t('From')} ${money(productPrice(product))}</b><span class="status">${esc(stock.label)}</span></div><button class="btn btn-orange" data-open-product="${esc(product.id)}">${t('View Diagram')}</button></div>
      </div>
    </article>`;
  }

  function filterSidebarHtml(rows) {
    const modelCounts = new Map();
    const categoryCounts = new Map();
    const maxPrice = maxCatalogPrice();
    const priceMin = Math.min(Math.max(0, state.priceMin || 0), maxPrice);
    const priceMax = Math.min(Math.max(priceMin, state.priceMax || maxPrice), maxPrice);
    const priceLabel = priceMin || state.priceMax ? `${money(priceMin)} — ${money(priceMax)}` : state.language === 'id' ? 'Semua harga' : 'All prices';
    state.products.forEach(product => {
      modelCounts.set(product.model, (modelCounts.get(product.model) || 0) + 1);
      categoryCounts.set(product.category, (categoryCounts.get(product.category) || 0) + 1);
    });
    return `<aside class="filter-sidebar ${state.filterOpen ? 'open' : ''}" id="filterSidebar">
      <div class="filter-group"><div class="filter-head"><b>Tractor Model</b><button data-clear-filter="model">Clear</button></div>${state.models.slice(0, 7).map(model => `<label class="filter-option"><input type="radio" name="filter-model" value="${esc(model)}" ${state.selectedModel === model ? 'checked' : ''}><span>${esc(model)}</span><em>(${modelCounts.get(model) || 0})</em></label>`).join('')}<button class="filter-more" data-models-page>Show more ${icon('i-down', 11)}</button></div>
      <div class="filter-group"><div class="filter-head"><b>System Category</b><button data-clear-filter="category">Clear</button></div>${state.categories.slice(0, 7).map(category => `<label class="filter-option"><input type="radio" name="filter-category" value="${esc(category.name)}" ${state.selectedCategory === category.name ? 'checked' : ''}><span>${esc(category.name)}</span><em>(${categoryCounts.get(category.name) || 0})</em></label>`).join('')}<button class="filter-more" data-all-categories-filter>Show more ${icon('i-down', 11)}</button></div>
      <div class="filter-group"><div class="filter-head"><b>Stock Status</b><button data-clear-filter="stock">Clear</button></div><label class="filter-option"><input type="checkbox" name="filter-stock" value="in" ${state.stock.has('in') ? 'checked' : ''}><span class="status">In Stock</span></label><label class="filter-option"><input type="checkbox" name="filter-stock" value="low" ${state.stock.has('low') ? 'checked' : ''}><span>🟠 Available</span></label><label class="filter-option"><input type="checkbox" name="filter-stock" value="out" ${state.stock.has('out') ? 'checked' : ''}><span>🔴 Pre-order</span></label></div>
      <div class="filter-group price-filter"><div class="filter-head"><b>${t('Price Range')} (${CURRENCY.code})</b><button type="button" data-clear-filter="price">${t('Clear')}</button></div><div class="price-range-control" style="--min:${(priceMin / maxPrice) * 100}%;--max:${(priceMax / maxPrice) * 100}%"><div class="range-track"></div><input id="priceMinRange" type="range" min="0" max="${maxPrice}" step="1" value="${priceMin}" aria-label="Minimum price"><input id="priceMaxRange" type="range" min="0" max="${maxPrice}" step="1" value="${priceMax}" aria-label="Maximum price"></div><div class="price-labels"><span id="priceRangeLabel">${esc(priceLabel)}</span><span>${money(maxPrice)}+</span></div></div>
      <div class="filter-group"><div class="filter-head"><b>Compatibility</b><button data-clear-filter="model">Clear</button></div><input class="compat-input" id="compatInput" placeholder="Search model compatibility..."><div class="filter-chips">${state.selectedModel ? `<span>${esc(state.selectedModel)} <button data-clear-filter="model">×</button></span>` : '<span>All models</span>'}</div></div>
      <div class="filter-group"><button class="btn btn-orange" id="applyMobileFilters" style="width:100%">${esc(state.language === 'id' ? `Tampilkan ${rows.length} diagram` : `Show ${rows.length} diagrams`)}</button></div>
    </aside>`;
  }

  function activeFilterHtml() {
    const filters = [];
    if (state.selectedModel) filters.push({ key: 'model', label: `Model: ${state.selectedModel}` });
    if (state.selectedCategory) filters.push({ key: 'category', label: `System: ${state.selectedCategory}` });
    state.stock.forEach(value => filters.push({ key: `stock:${value}`, label: value === 'in' ? 'In Stock' : value === 'low' ? 'Available' : 'Pre-order' }));
    if (state.priceMin || state.priceMax) filters.push({ key: 'price', label: `${t('Price Range')}: ${money(state.priceMin || 0)} — ${money(state.priceMax || maxCatalogPrice())}` });
    if (state.query) filters.push({ key: 'query', label: `Search: ${state.query}` });
    return filters.map(filter => `<span class="active-filter">${esc(filter.label)}<button data-remove-filter="${esc(filter.key)}">×</button></span>`).join('');
  }

  function renderCatalog() {
    const rows = filteredProducts();
    const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
    if (state.page > pages) state.page = pages;
    const start = (state.page - 1) * PAGE_SIZE;
    const pageRows = rows.slice(start, start + PAGE_SIZE);
    const title = state.selectedCategory ? `${state.selectedCategory} ${t('Parts')}` : state.selectedModel ? `${state.selectedModel} ${t('Parts')}` : (state.language === 'id' ? 'Suku Cadang Traktor & Diagram Rangkaian' : 'Tractor Parts & Assembly Diagrams');
    const context = state.selectedModel
      ? (state.language === 'id' ? `Telusuri diagram sistem dan temukan suku cadang yang tepat untuk ${state.selectedModel}.` : `Browse system diagrams and find the exact parts you need for your ${state.selectedModel}.`)
      : (state.language === 'id' ? 'Telusuri diagram rangkaian resmi, lalu pesan suku cadang berdasarkan nomor penunjuk dan nomor part.' : 'Browse official assembly diagrams, then order exact spare parts by callout and part number.');
    const resultLabel = state.language === 'id' ? `${rows.length} ${t('Assembly Diagrams Found')}` : `${rows.length} Assembly Diagrams Found`;
    const resultSummary = state.language === 'id'
      ? `Menampilkan ${rows.length ? start + 1 : 0} sampai ${Math.min(start + PAGE_SIZE, rows.length)} dari ${rows.length} diagram`
      : `Showing ${rows.length ? start + 1 : 0} to ${Math.min(start + PAGE_SIZE, rows.length)} of ${rows.length} diagrams`;
    app.innerHTML = `<section class="page-section"><div class="container"><nav class="breadcrumbs"><a href="#home">Home</a><a href="#catalog">Parts</a>${state.selectedModel ? `<a href="${routeHash('catalog', { model: state.selectedModel })}">${esc(state.selectedModel)}</a>` : ''}${state.selectedCategory ? `<span>${esc(state.selectedCategory)}</span>` : ''}</nav>
      <div class="catalog-title-row"><div class="catalog-title"><h1>${esc(title)} <span>${esc(resultLabel)}</span></h1><p>${esc(context)}</p></div><div class="help-card">${icon('i-engine', 34)}<span><b>Need help finding parts?</b><small>Our parts experts are here for you.</small></span><button data-contact>Contact Us</button></div></div>
      <div class="catalog-layout">${filterSidebarHtml(rows)}<div class="catalog-main"><div class="catalog-toolbar"><button class="mobile-filter-trigger" id="mobileFilterTrigger">${icon('i-filter', 15)}Filters</button><span class="toolbar-label">Sort by:</span><select class="sort-select" id="catalogSort"><option value="recommended">Recommended</option><option value="parts">Most parts</option><option value="price-low">Price: Low to High</option><option value="price-high">Price: High to Low</option><option value="name">Name A–Z</option></select><div class="active-filters"><span>Active Filters:</span>${activeFilterHtml()}${activeFilterHtml() ? '<button class="clear-all" id="clearAllFilters">Clear All</button>' : ''}</div><div class="view-controls"><span>View:</span><button id="gridViewButton" class="${state.view === 'grid' ? 'active' : ''}">${icon('i-grid', 16)}</button><button id="listViewButton" class="${state.view === 'list' ? 'active' : ''}">${icon('i-list', 16)}</button></div></div>
      <div class="assembly-grid ${state.view === 'list' ? 'product-list' : ''}">${pageRows.length ? pageRows.map(productCard).join('') : `<div class="empty-state">${icon('i-search', 48)}<div><h3>No matching diagrams</h3><p>Try a broader model, system or part-number search.</p><button class="btn btn-orange" id="emptyReset" style="margin-top:15px">Reset filters</button></div></div>`}</div>
      <div class="catalog-results-summary">${esc(resultSummary)}</div>${paginationHtml(pages)}</div></div></div></section>`;

    $('#catalogSort').value = state.sort;
    $('#catalogSort').onchange = event => { state.sort = event.target.value; state.page = 1; renderCatalog(); };
    $('#gridViewButton').onclick = () => { state.view = 'grid'; writeLocal('hikari_view', state.view); renderCatalog(); };
    $('#listViewButton').onclick = () => { state.view = 'list'; writeLocal('hikari_view', state.view); renderCatalog(); };
    $$('[data-open-product]').forEach(button => button.onclick = () => go('diagram', { id: button.dataset.openProduct, q: state.query }));
    $$('[data-wishlist]').forEach(button => button.onclick = event => { event.stopPropagation(); toggleWishlist(button.dataset.wishlist); renderCatalog(); });
    $$('input[name="filter-model"]').forEach(input => input.onchange = () => { state.selectedModel = input.value; state.page = 1; syncCatalogHash(); });
    $$('input[name="filter-category"]').forEach(input => input.onchange = () => { state.selectedCategory = input.value; state.page = 1; syncCatalogHash(); });
    $$('input[name="filter-stock"]').forEach(input => input.onchange = () => { input.checked ? state.stock.add(input.value) : state.stock.delete(input.value); state.page = 1; renderCatalog(); });
    bindPriceRange();
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
    if (type === 'price') { state.priceMin = 0; state.priceMax = 0; writeLocal('hikari_price_min_usd', 0); writeLocal('hikari_price_max_usd', 0); }
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
    state.priceMin = 0;
    state.priceMax = 0;
    writeLocal('hikari_price_min_usd', 0);
    writeLocal('hikari_price_max_usd', 0);
    state.page = 1;
  }

  function bindPriceRange() {
    const minInput = $('#priceMinRange');
    const maxInput = $('#priceMaxRange');
    const label = $('#priceRangeLabel');
    const control = $('.price-range-control');
    if (!minInput || !maxInput || !label || !control) return;
    const limit = Number(maxInput.max) || maxCatalogPrice();
    const paint = () => {
      let min = Math.min(Number(minInput.value) || 0, limit);
      let max = Math.min(Number(maxInput.value) || limit, limit);
      if (min > max) [min, max] = [max, min];
      control.style.setProperty('--min', `${(min / limit) * 100}%`);
      control.style.setProperty('--max', `${(max / limit) * 100}%`);
      label.textContent = min || max < limit ? `${money(min)} — ${money(max)}` : (state.language === 'id' ? 'Semua harga' : 'All prices');
    };
    const commit = () => {
      let min = Math.min(Number(minInput.value) || 0, limit);
      let max = Math.min(Number(maxInput.value) || limit, limit);
      if (min > max) [min, max] = [max, min];
      state.priceMin = min;
      state.priceMax = max >= limit ? 0 : max;
      state.page = 1;
      writeLocal('hikari_price_min_usd', state.priceMin);
      writeLocal('hikari_price_max_usd', state.priceMax);
      renderCatalog();
    };
    minInput.addEventListener('input', paint);
    maxInput.addEventListener('input', paint);
    minInput.addEventListener('change', commit);
    maxInput.addEventListener('change', commit);
    paint();
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
      <article class="detail-side"><div class="detail-summary"><div class="detail-summary-grid"><div><span class="official-label">DIAGRAM REFERENCE</span><h1>${esc(titleCase(cleanTitle(sheet.title)))}</h1><div class="detail-code">Diagram Code: ${esc(sheet.diagram_code)}</div><div class="compatibility"><small>Compatible Models</small><div class="compatibility-row"><span class="badge">${esc(product.model)}</span><a href="${routeHash('catalog', { model: product.model })}">View all compatible models</a></div></div></div><div class="detail-summary-side"><div class="stock-box"><b>● ${esc(stock.label)}</b><small>${product.stock === 'out' ? 'Availability confirmed during RFQ' : 'Ships after stock verification'}</small></div><div class="help-box"><b>Need a part not listed?</b><small>Our experts can help you find it.</small><button data-contact>Request Help / RFQ</button></div></div></div><div class="detail-actions"><button class="btn" id="downloadDiagram">${icon('i-download', 15)}Download Diagram</button><button class="btn btn-orange" id="addAllVisible">${icon('i-list', 15)}Add All Visible to RFQ</button></div></div>
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
    if ($('#pxMobileCartCount')) $('#pxMobileCartCount').textContent = String(count);
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
    const phone = $('#rfqPhone')?.value.trim() || '';
    const accountType = $('#rfqAccountType')?.value || 'retail';
    const destination = $('#rfqDestination').value.trim() || 'To be confirmed';
    const incoterm = $('#rfqTerm').value;
    const note = $('#rfqNote').value.trim();
    const website = $('#rfqWebsite')?.value.trim() || '';
    const emailValid = !email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!state.cart.length) { toast('RFQ cart is empty', 'Add at least one spare part.'); return; }
    if (!name) { toast('Add your name first', 'A personal name or company name is enough.'); return; }
    if (!email && !phone) { toast('Add one contact method', 'Email or WhatsApp/phone is enough — you do not need both.'); return; }
    if (!emailValid) { toast('Enter a valid email address', 'Or leave email empty and use WhatsApp/phone.'); return; }
    if (name.length > 120 || email.length > 254 || phone.length > 40 || destination.length > 160 || note.length > 2000 || website) { toast('Unable to submit RFQ', 'Check the form fields and try again.'); return; }
    const button = $('#submitRfqButton');
    button.disabled = true;
    button.textContent = 'Submitting…';
    const rfqSnapshot = state.cart.map(item => ({ ...item }));
    const itemSummary = rfqSnapshot.map(item => `${item.qty}× ${item.sku} ${item.name} (${item.meta})`).join('\n');
    const payload = {
      buyerName: name,
      buyerEmail: email,
      buyerPhone: phone,
      destination,
      incoterm,
      accountType,
      website,
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
    const channelText = [
      `Hello Hikari Tractors, I would like a quotation.`,
      `Reference: ${reference}`,
      `Buyer: ${name}`,
      `Buyer type: ${accountType === 'b2b' ? 'Company / Distributor' : accountType === 'export' ? 'Export buyer' : 'Individual / Workshop'}`,
      `Destination: ${destination}`,
      `Trade term: ${incoterm}`,
      '', itemSummary, note ? `\nNote: ${note}` : ''
    ].filter(Boolean).join('\n');
    const subject = `Quotation request ${reference}`;
    const emailHref = `mailto:${SITE.email || 'info@hikaritractors.com'}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(channelText)}`;
    const whatsappHref = `https://wa.me/${String(SITE.phone || '+6285287551869').replace(/\D/g, '')}?text=${encodeURIComponent(channelText)}`;
    openModal(submitted ? 'Choose how to continue' : 'RFQ draft prepared', submitted ? `Reference ${reference}` : 'Live API unavailable — no order was claimed', `<div class="content-card" style="border:0;padding:4px;max-width:none"><h2>${submitted ? 'Your quotation request is recorded.' : 'Your quotation message is ready.'}</h2><p><b>Reference:</b> ${esc(reference)}</p><p>You can continue by email or WhatsApp. NPWP, PO, company address and trade details can be provided later if they apply.</p><div style="border:1px solid var(--line);border-radius:6px;padding:12px;white-space:pre-wrap;font-size:10px">${esc(itemSummary)}</div><div class="quote-channel-actions"><a class="btn btn-orange" id="emailQuotation" href="${esc(emailHref)}">${icon('i-mail', 16)} Email quotation</a><a class="btn btn-dark" id="whatsappQuotation" target="_blank" rel="noopener noreferrer" href="${esc(whatsappHref)}">${icon('i-phone', 16)} WhatsApp quotation</a><button class="btn" id="downloadRfqDraft" type="button">Download RFQ CSV</button></div>${submitted ? '' : '<p style="color:#b65012">The API did not receive this request. You may still use the prepared email or WhatsApp draft.</p>'}</div>`);
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
    app.innerHTML = `<section class="content-page models-page"><div class="container"><nav class="breadcrumbs"><a href="#home">Home</a><span>Models</span></nav><div class="content-card"><h1>Shop by Tractor Model</h1><p>Select the exact model before opening system diagrams. This keeps every spare-part lookup inside the correct fitment context.</p><div class="model-cards model-page-grid" style="margin-top:20px">${state.models.map(model => `<button class="model-card model-card--full" data-model-card="${esc(model)}"><img src="assets/images/tractor-card.webp" alt="${esc(model)} tractor"><span class="model-card-copy"><b>${esc(model)}</b><small>${state.products.filter(product => product.model === model).length} diagrams</small><em>Open model catalog</em></span><span class="model-arrow">›</span></button>`).join('')}</div></div></div></section>`;
    $$('[data-model-card]').forEach(button => button.onclick = () => { writeLocal('hikari_recent_model', button.dataset.modelCard); go('catalog', { model: button.dataset.modelCard }); });
  }

  function renderRfqPage() {
    app.innerHTML = `<section class="content-page"><div class="container"><nav class="breadcrumbs"><a href="#home">Home</a><span>Request a Quote</span></nav><div class="content-card"><h1>Request a Parts Quotation</h1><p>Upload or paste your parts list. Include the tractor model, serial range, destination and required quantities whenever possible.</p><div class="rfq-page-grid"><div class="rfq-upload">${icon('i-download', 54)}<div><h3>Bulk parts-list upload</h3><p>CSV, XLSX and PDF can be connected to Internal Hikari's signed upload flow.</p><button class="btn" id="downloadTemplate">Download CSV Template</button></div></div><form class="rfq-form" id="rfqPageForm"><label>Name / Company<input name="name" required></label><label>Email <small>(email or WhatsApp)</small><input name="email" type="email"></label><label>WhatsApp / Phone <small>(email or WhatsApp)</small><input name="phone" type="tel" placeholder="+62..."></label><label>Destination <small>(optional)</small><input name="destination" placeholder="Can be added later"></label><label>Buyer Type<select name="buyerType"><option value="retail">Individual / Workshop</option><option value="b2b">Company / Distributor</option><option value="export">Export buyer</option></select></label><label class="full">Parts, model or engine details<textarea name="message" required placeholder="Example: L3608, diagram 050101, 2× 1A021-73036, destination Jakarta..."></textarea></label><button class="btn btn-orange full" type="submit">Create RFQ</button></form></div></div></div></section>`;
    $('#downloadTemplate').onclick = () => {
      const blob = new Blob(['part_number,description,quantity,tractor_model,buyer_note\n'], { type: 'text/csv' });
      const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = 'Hikari-bulk-order-template.csv'; link.click(); URL.revokeObjectURL(link.href);
    };
    $('#rfqPageForm').onsubmit = event => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      $('#rfqName').value = form.get('name'); $('#rfqEmail').value = form.get('email'); $('#rfqPhone').value = form.get('phone'); $('#rfqAccountType').value = form.get('buyerType'); $('#rfqDestination').value = form.get('destination'); $('#rfqNote').value = form.get('message');
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
    $('#modal').classList.remove('systems-modal');
    $('#modalTitle').textContent = title;
    $('#modalSubtitle').textContent = subtitle || '';
    $('#modalBody').innerHTML = html;
    $('#modalBackdrop').classList.add('open');
    document.body.classList.add('no-scroll');
  }
  function closeModal() {
    $('#modalBackdrop').classList.remove('open');
    document.body.classList.remove('no-scroll');
    $('#modal').classList.remove('systems-modal');
  }
  function openCategoryModal() {
    const totalDiagrams = state.categories.reduce((sum, category) => sum + Number(category.count || 0), 0);
    openModal('System Explorer', 'Find the right tractor system before opening a diagram.', `
      <section class="systems-explorer">
        <div class="systems-explorer-intro"><div><span class="systems-eyebrow">HIKARI PARTS NAVIGATOR</span><h2>Browse every tractor system.</h2><p>Mulai dari nama sistem, lalu lanjut ke diagram dan suku cadang yang sesuai dengan model traktor Anda.</p></div><div class="systems-metrics" aria-label="Catalog summary"><span><b>${state.categories.length}</b><small>systems</small></span><span><b>${totalDiagrams.toLocaleString()}</b><small>diagrams</small></span></div></div>
        <label class="systems-search" for="systemFinder">${icon('i-search', 18)}<input id="systemFinder" type="search" autocomplete="off" placeholder="Search a system: engine, hydraulic, axle…"><kbd>ESC</kbd></label>
        <div class="systems-explorer-meta"><span id="systemFinderCount">${state.categories.length} systems available</span><span>Choose a system to open its catalog</span></div>
        <div class="systems-explorer-grid">${state.categories.map(category => `<button class="system-explorer-card" data-modal-category="${esc(category.name)}" data-system-search="${esc(normalize(category.name))}"><span class="system-explorer-icon">${icon(categoryIcon(category.name), 24)}</span><span class="system-explorer-copy"><b>${esc(category.name)}</b><small>${Number(category.count || 0).toLocaleString()} assembly diagrams</small></span><span class="system-explorer-arrow">→</span></button>`).join('')}</div>
        <div class="systems-empty" id="systemFinderEmpty" hidden><b>System tidak ditemukan.</b><span>Coba kata kunci lain atau lihat semua sistem.</span></div>
      </section>`);
    $('#modal').classList.add('systems-modal');
    $$('[data-modal-category]').forEach(button => button.onclick = () => { closeModal(); go('catalog', { category: button.dataset.modalCategory }); });
    const finder = $('#systemFinder');
    const resultCount = $('#systemFinderCount');
    const empty = $('#systemFinderEmpty');
    finder.addEventListener('input', () => {
      const query = normalize(finder.value);
      let visible = 0;
      $$('.system-explorer-card').forEach(card => {
        const matches = !query || card.dataset.systemSearch.includes(query);
        card.hidden = !matches;
        if (matches) visible += 1;
      });
      resultCount.textContent = `${visible} ${visible === 1 ? 'system' : 'systems'} ${query ? 'found' : 'available'}`;
      empty.hidden = visible !== 0;
    });
  }

  async function route() {
    if (state.loading) return;
    closeFilterDrawer();
    const { name, params } = parseRoute();
    updateHeaderActiveState();
    if (name === 'home') renderHome();
    else if (name === 'catalog') {
      state.selectedModel = params.get('model') || '';
      if (state.selectedModel) writeLocal('hikari_recent_model', state.selectedModel);
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
    localizeVisibleCopy();
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
    $('#pxMobileMenuButton')?.addEventListener('click', () => $('.main-nav').classList.toggle('open'));
    $('#pxMobileSearchButton')?.addEventListener('click', () => { if (parseRoute().name !== 'home') go('home'); setTimeout(() => { document.querySelector('.px-finder-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); $('#heroPartNumber')?.focus(); }, 80); });
    $('#pxMobileCartButton')?.addEventListener('click', openCart);
    $('#browseCategoriesButton').onclick = openCategoryModal;
    $('#viewAllModelsButton').onclick = () => go('models');
    $('#modelStripLinks').addEventListener('click', event => { const button = event.target.closest('[data-header-model]'); if (button) { writeLocal('hikari_recent_model', button.dataset.headerModel); go('catalog', { model: button.dataset.headerModel }); } });
    $('#accountButton').onclick = () => openModal('My Account', 'Account integration', '<div class="content-card" style="border:0;padding:4px"><h2>Customer account area</h2><p>Connect this button to your authentication provider and customer profile API. Cart and saved assemblies currently persist locally for guest users.</p><button class="btn btn-orange" data-modal-close>Continue as Guest</button></div>');
    const togglePreferenceMenu = (menuId, buttonId) => {
      const menu = $(menuId);
      const opening = !menu.classList.contains('open');
      closePreferenceMenus();
      menu.classList.toggle('open', opening);
      $(buttonId).setAttribute('aria-expanded', String(opening));
    };
    $('#langButton').onclick = () => togglePreferenceMenu('#langMenu', '#langButton');
    $('#currencyButton').onclick = () => togglePreferenceMenu('#currencyMenu', '#currencyButton');
    $$('[data-language]').forEach(button => button.onclick = () => { setLanguage(button.dataset.language, true); closePreferenceMenus(); });
    $$('[data-currency]').forEach(button => button.onclick = () => { setCurrency(button.dataset.currency, true); closePreferenceMenus(); });
    $('#supportFab').onclick = () => {
      const open = !$('#supportPanel').classList.contains('open');
      $('#supportPanel').classList.toggle('open', open);
      $('#supportFab').setAttribute('aria-expanded', String(open));
    };
    $('#supportClose').onclick = () => { $('#supportPanel').classList.remove('open'); $('#supportFab').setAttribute('aria-expanded', 'false'); };
    document.addEventListener('click', event => {
      if (!event.target.closest('.preference-control')) closePreferenceMenus();
      if (!event.target.closest('#supportWidget')) { $('#supportPanel').classList.remove('open'); $('#supportFab').setAttribute('aria-expanded', 'false'); }
    });
    $('#newsletterForm')?.addEventListener('submit', event => { event.preventDefault(); toast('Newsletter unavailable', 'Contact Hikari support for catalog and quotation updates.'); });
    document.addEventListener('keydown', event => { if (event.key === 'Escape') { closeModal(); closeCart(); closeFilterDrawer(); closePreferenceMenus(); $('#supportPanel').classList.remove('open'); $('#supportFab').setAttribute('aria-expanded', 'false'); $('.main-nav').classList.remove('open'); } });
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
