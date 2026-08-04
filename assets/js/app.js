'use strict';

const IMG = {
  "hero": "assets/images/hero.webp",
  "tractor": "assets/images/tractor.webp",
  "fleet": "assets/images/fleet.webp",
  "engine": "assets/images/engine.webp",
  "piston": "assets/images/piston.webp",
  "head": "assets/images/head.webp"
};
const state = {
  page:1, perPage:24, query:"", selectedModel:null, category:new Set(), machine:new Set(), stock:new Set(), grade:new Set(),
  minPrice:null,maxPrice:null,sort:"featured",account:"retail",currency:"USD",lang:load("hikari_lang","en"),view:"grid",
  cart:load("kpx_cart",[]), wishlist:new Set(load("kpx_wishlist",[])), compare:new Set(load("kpx_compare",[])),
  garage:load("kpx_garage",[])
};
const rates={USD:1,IDR:16300,EUR:.92,SGD:1.35,AUD:1.52};
const symbols={USD:"$",IDR:"Rp ",EUR:"€",SGD:"S$",AUD:"A$"};
const ID_TEXT={
 "Export desk online":"Meja ekspor online","Jakarta warehouse":"Gudang Jakarta","Independent parts exporter":"Eksportir suku cadang independen","Indonesia · Global Supply":"Indonesia · Pasokan Global","Parts Catalog":"Katalog Produk","Model Finder":"Pencari Model","Export":"Ekspor","B2B":"B2B","Support":"Bantuan","Wishlist":"Favorit","Compare":"Bandingkan","Order / RFQ":"Order / RFQ","Catalog":"Katalog","Models":"Model","PARTS INTELLIGENCE FOR GLOBAL BUYERS":"INTELIJEN SUKU CADANG UNTUK BUYER GLOBAL","Find the exact part.":"Temukan part yang tepat.","Ship it worldwide.":"Kirim ke seluruh dunia.","A compact export catalog built for farmers, workshops, fleet operators and distributors. Search by SKU, machine model or engine series, compare price tiers, and request freight-ready quotations in one flow.":"Katalog ekspor ringkas untuk petani, bengkel, operator armada, dan distributor. Cari berdasarkan SKU, model mesin, atau seri engine, bandingkan tier harga, dan ajukan penawaran siap kirim dalam satu alur.","1,200 SKUs":"1.200 SKU","Retail + B2B tiers":"Tier retail + B2B","EXW / FOB / CIF / DDP":"EXW / FOB / CIF / DDP","Mixed-carton RFQ":"RFQ mixed-carton","Fitment-first search":"Pencarian berbasis fitment","Precision Parts Lookup":"Pencarian Part Presisi","CATALOG REVIEW · EXPORT READY":"REVIEW KATALOG · SIAP EKSPOR","Part / Keyword":"Part / Kata kunci","Machine Model":"Model Mesin","Engine Series":"Seri Engine","Search":"Cari","EQUIPMENT FAMILY":"KELUARGA UNIT","BUYER PROFILE":"PROFIL BUYER","Browse catalog":"Buka katalog","Upload parts list":"Upload daftar part","Export pricing, stock, tax, freight and payment terms are confirmed by Hikari’s sales team before invoicing.":"Harga ekspor, stok, pajak, freight, dan pembayaran dikonfirmasi tim sales Hikari sebelum invoice diterbitkan.","searchable SKUs":"SKU dapat dicari","destination markets":"pasar tujuan","Incoterm workflows":"alur Incoterm","buyer pricing levels":"level harga buyer","local catalog filtering":"filter katalog lokal","SHOP BY SYSTEM":"BELANJA BERDASARKAN SISTEM","Compact navigation for a deep catalog":"Navigasi ringkas untuk katalog besar","Product families are grouped by the way technicians actually diagnose and service equipment, not only by generic e-commerce labels.":"Kelompok produk disusun mengikuti cara teknisi mendiagnosis dan merawat unit, bukan hanya label e-commerce generik.","SEARCHABLE PRODUCT DATABASE":"DATABASE PRODUK YANG BISA DICARI","Filter by category, machine, availability, origin and export packaging across a structured tractor parts catalog.":"Filter berdasarkan kategori, unit, ketersediaan, asal, dan packing ekspor dalam katalog suku cadang traktor yang terstruktur.","Filters":"Filter","Reset all":"Reset semua","Category":"Kategori","Equipment":"Unit","Availability":"Ketersediaan","Part class":"Kelas part","USD price range":"Rentang harga USD","Export options":"Opsi ekspor","Ready stock":"Stok tersedia","Limited stock":"Stok terbatas","Pre-order":"Pre-order","OEM / Genuine class":"Kelas OEM / Genuine","Aftermarket":"Aftermarket","Remanufactured":"Remanufactured","Export packed":"Packing ekspor","Exclude regulated items":"Kecualikan barang regulasi","Retail price":"Harga retail","B2B price":"Harga B2B","Export price":"Harga ekspor","Featured":"Unggulan","Price: low to high":"Harga: rendah ke tinggi","Price: high to low":"Harga: tinggi ke rendah","Availability":"Ketersediaan","Name A–Z":"Nama A–Z","Prices exclude freight, duty and destination tax":"Harga belum termasuk freight, bea, dan pajak tujuan","Page":"Halaman","of":"dari","Prev":"Sebelumnya","Next":"Berikutnya","Equipment-first experience":"Pengalaman berbasis unit","Save your machine. Stop guessing fitment.":"Simpan unit Anda. Berhenti menebak kecocokan part.","The “My Garage” pattern keeps model and engine context attached to every search, so buyers see compatible parts first and reduce costly export returns.":"Pola “Saved Models” menyimpan konteks model dan engine pada setiap pencarian, sehingga buyer melihat part yang cocok lebih dulu dan mengurangi risiko retur ekspor.","Select equipment family":"Pilih keluarga unit","Add model / engine code":"Tambah model / kode engine","Browse verified fitment":"Lihat fitment terverifikasi","Family":"Keluarga","Model":"Model","Add to My Garage":"Tambah ke Saved Models","Saved Models":"Model Tersimpan","Fitment-first catalog":"Katalog berbasis fitment","Model · engine · serial-range ready":"Model · engine · rentang serial siap","Quote-to-shipment workflow":"Alur penawaran sampai pengiriman","Built for export, not just checkout":"Dibuat untuk ekspor, bukan sekadar checkout","The order drawer captures commercial terms, destination and buyer type before quotation, so freight and packing can be calculated correctly.":"Panel order mencatat term komersial, tujuan, dan tipe buyer sebelum penawaran, agar freight dan packing bisa dihitung dengan benar.","Export process":"Proses ekspor","Incoterm guide":"Panduan Incoterm","Documents":"Dokumen","Consolidation":"Konsolidasi","Mixed-carton B2B orders":"Order B2B mixed-carton","Combine filters, seals, bearings and maintenance kits into a single commercial quotation with carton-level packing data.":"Gabungkan filter, seal, bearing, dan maintenance kit dalam satu penawaran komersial dengan data packing per karton.","Commercial document pack":"Paket dokumen komersial","Prepare proforma invoices, packing lists, origin fields, HS-code notes and shipment references for export review.":"Siapkan proforma invoice, packing list, field origin, catatan HS code, dan referensi shipment untuk review ekspor.","Download order CSV":"Download CSV order","Operational tools":"Tools operasional","One storefront, four buying workflows":"Satu storefront, empat alur pembelian","The interface separates quick retail purchases from workshop orders, fleet replenishment and distributor RFQs without duplicating the catalog.":"Interface memisahkan pembelian retail cepat, order bengkel, replenishment armada, dan RFQ distributor tanpa menggandakan katalog.","Retail & workshop":"Retail & bengkel","Distributor B2B":"Distributor B2B","Fleet replenishment":"Replenishment armada","Secure production path":"Jalur produksi aman","Browse retail catalog →":"Buka katalog retail →","Switch to B2B price →":"Ganti ke harga B2B →","Open Saved Models →":"Buka Model Tersimpan →","Read architecture notes →":"Baca catatan arsitektur →","Buyer confidence":"Kepercayaan buyer","Support before the shipment leaves":"Dukungan sebelum shipment berangkat","Good export UX makes uncertainty visible: fitment confidence, stock status, quotation validity, packaging, documentation and destination requirements.":"UX ekspor yang baik membuat hal penting terlihat: kecocokan part, status stok, validitas penawaran, packing, dokumen, dan kebutuhan negara tujuan.","Request a parts quotation":"Minta penawaran part","Share your parts list, destination and buyer type for export quotation review.":"Kirim daftar part, tujuan, dan tipe buyer untuk review penawaran ekspor.","Name / company":"Nama / perusahaan","Email":"Email","Country":"Negara","Buyer type":"Tipe buyer","Parts, model or engine details":"Detail part, model, atau engine","Create RFQ":"Buat RFQ","Do not include payment-card details or sensitive identity documents in this form.":"Jangan masukkan detail kartu pembayaran atau dokumen identitas sensitif di formulir ini.","Retail / workshop":"Retail / bengkel","B2B distributor":"Distributor B2B","Fleet operator":"Operator armada","Tractor Parts · Export Supply":"Suku Cadang Traktor · Pasokan Ekspor","Hikari Tractors Indonesia supplies tractor spare parts, export packing support and quotation assistance for workshops, fleets and distributors.":"Hikari Tractors Indonesia menyediakan suku cadang traktor, dukungan packing ekspor, dan bantuan quotation untuk bengkel, armada, dan distributor.","All rights reserved.":"Seluruh hak cipta dilindungi.","Export terms, availability and fitment are confirmed during quotation.":"Term ekspor, ketersediaan, dan fitment dikonfirmasi saat quotation.","Order / RFQ Builder":"Builder Order / RFQ","Retail order mode":"Mode order retail","Your order list is empty":"Daftar order masih kosong","Add products from the catalog. Quantities and buyer tier are saved only in your browser.":"Tambahkan produk dari katalog. Kuantitas dan tier buyer tersimpan hanya di browser Anda.","Destination country":"Negara tujuan","Trade term":"Term perdagangan","Shipping":"Pengiriman","Reference":"Referensi","Merchandise":"Produk","Estimated packing":"Estimasi packing","Freight & destination charges":"Freight & biaya tujuan","Quoted separately":"Dikutip terpisah","Quotation base":"Basis quotation","Generate quotation":"Buat quotation","Catalog notice":"Catatan katalog","Final pricing, stock and shipping are confirmed during quotation.":"Harga final, stok, dan pengiriman dikonfirmasi saat quotation.","Done":"Selesai","No saved products yet.":"Belum ada produk tersimpan.","No matching parts":"Tidak ada part yang cocok","Try a broader model, engine or category search.":"Coba pencarian model, engine, atau kategori yang lebih luas.","Reset filters":"Reset filter","Added to order":"Ditambahkan ke order","Saved to wishlist":"Disimpan ke favorit","Removed from wishlist":"Dihapus dari favorit","Comparison limit":"Batas perbandingan","You can compare up to 4 parts.":"Anda bisa membandingkan hingga 4 part.","No comparison items":"Belum ada item perbandingan","Use the compare icon on a product card.":"Gunakan ikon compare pada kartu produk.","Saved parts":"Part tersimpan","Machine saved":"Unit tersimpan","Order list is empty":"Daftar order kosong","Quotation request prepared":"Request quotation disiapkan","Quotation draft ready":"Draft quotation siap","Thank you":"Terima kasih","Request summary":"Ringkasan request","Bulk parts-list upload":"Upload daftar part massal","Upload CSV / XLSX / PDF parts list":"Upload daftar part CSV / XLSX / PDF","Parts list upload":"Upload daftar part","Trade compliance and platform security":"Kepatuhan perdagangan dan keamanan platform","Operational safeguards":"Perlindungan operasional","Media attribution":"Atribusi media"
};
function t(text){return state.lang==="id"?(ID_TEXT[text]||text):text}
function translateText(text){
 if(state.lang!=="id")return text;
 const leading=text.match(/^\s*/)?.[0]||"", trailing=text.match(/\s*$/)?.[0]||"", clean=text.trim();
 if(ID_TEXT[clean])return leading+ID_TEXT[clean]+trailing;
 const escRe=s=>s.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
 return Object.keys(ID_TEXT).filter(k=>k.length>2).sort((a,b)=>b.length-a.length).reduce((out,key)=>out.replace(new RegExp(`(^|[^A-Za-z])(${escRe(key)})(?=$|[^A-Za-z])`,"g"),(_,pre)=>pre+ID_TEXT[key]),text);
}
function translateStatic(root=document.body){
 document.documentElement.lang=state.lang==="id"?"id":"en"; if(languageSelect)languageSelect.value=state.lang;
 const skip="script,style,svg,#productGrid,#categoryStrip,#categoryChecks";
 const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode(n){if(!n.nodeValue.trim()||n.parentElement?.closest(skip))return NodeFilter.FILTER_REJECT;return NodeFilter.FILTER_ACCEPT}});
 let n; while(n=walker.nextNode()){if(!n._en)n._en=n.nodeValue; n.nodeValue=translateText(n._en)}
 document.querySelectorAll("input[placeholder],textarea[placeholder]").forEach(el=>{if(!el.dataset.enPlaceholder)el.dataset.enPlaceholder=el.placeholder;el.placeholder=translateText(el.dataset.enPlaceholder)});
 document.querySelectorAll("[aria-label]").forEach(el=>{if(!el.dataset.enAria)el.dataset.enAria=el.getAttribute("aria-label");el.setAttribute("aria-label",t(el.dataset.enAria))});
}
Object.assign(ID_TEXT,{"catalog entries":"entri katalog","in stock":"stok tersedia","Only":"Sisa","left":"tersisa","Top match":"Cocok utama","Save":"Simpan","Fits":"Cocok untuk","Engine":"Engine","RETAIL UNIT PRICE":"HARGA UNIT RETAIL","B2B UNIT PRICE":"HARGA UNIT B2B","EXPORT UNIT PRICE":"HARGA UNIT EKSPOR","MOQ":"MOQ","unit":"unit","Add to order":"Tambah ke order","Quick view":"Lihat cepat","parts found":"part ditemukan","showing":"menampilkan","No matching parts":"Tidak ada part yang cocok","Try a broader model, engine or category search.":"Coba pencarian model, engine, atau kategori yang lebih luas.","Reset filters":"Reset filter","Retail / workshop order mode":"Mode order retail / bengkel","B2B distributor quotation mode":"Mode quotation distributor B2B","Export quotation mode":"Mode quotation ekspor","Try: oil filter, V2403, HIK-FLT-00018":"Coba: oil filter, V2403, HIK-FLT-00018","Try: L4508, M7040, U50-5":"Coba: L4508, M7040, U50-5","Try: D1105, V2403, V3800":"Coba: D1105, V2403, V3800","Try: oil filter, V2403, L4508, HIK-FLT-00018":"Coba: oil filter, V2403, L4508, HIK-FLT-00018","Example: V2403 service kit, 10 sets, destination Surabaya / Singapore / Manila...":"Contoh: service kit V2403, 10 set, tujuan Surabaya / Singapore / Manila..."});
Object.assign(ID_TEXT,{"Part match":"Pencocokan part","Fitment check":"Cek fitment","Proforma":"Proforma","Price validity":"Validitas harga","Packing":"Packing","Weight & volume":"Berat & volume","Dispatch":"Dispatch","Air / sea / courier":"Udara / laut / kurir","Delivery":"Delivery","Destination support":"Dukungan tujuan","Step":"Tahap","Seller scope":"Scope seller","Best for":"Cocok untuk","Status":"Status","Match":"Cocokkan","Model, engine and serial checked":"Model, engine, dan serial dicek","Wrong-part prevention":"Mencegah salah part","Required":"Wajib","Quote":"Quotation","Price, MOQ and validity issued":"Harga, MOQ, dan validitas diterbitkan","B2B approval":"Approval B2B","Manual":"Manual","Pack":"Packing","Carton weight and volume recorded":"Berat dan volume karton dicatat","Freight quote":"Quote freight","Ops":"Ops","Term":"Term","Quote status":"Status quote","Goods packed at warehouse":"Barang dipacking di warehouse","Buyer-appointed forwarder":"Forwarder pilihan buyer","Instant base":"Base instan","Export clearance + port delivery":"Clearance ekspor + delivery port","Sea freight consolidation":"Konsolidasi sea freight","Manual freight":"Freight manual","Ocean freight + insurance":"Ocean freight + insurance","Distributor replenishment":"Replenishment distributor","Rate request":"Request rate","Door delivery; duty depends on term":"Delivery ke alamat; duty tergantung term","Workshop / retail buyer":"Buyer bengkel / retail","Compliance review":"Review compliance","Document":"Dokumen","Purpose":"Tujuan","Needed for":"Dibutuhkan untuk","Proforma invoice":"Proforma invoice","Price, validity, payment reference":"Harga, validitas, referensi pembayaran","Buyer approval":"Approval buyer","Included":"Included","Packing list":"Packing list","Carton count, gross/net weight":"Jumlah karton, gross/net weight","Freight & customs":"Freight & customs","After pack":"Setelah packing","HS / origin":"HS / origin","Classification and origin fields":"Klasifikasi dan field origin","Import clearance":"Clearance impor","Verify":"Verifikasi","Mode":"Mode","How it works":"Cara kerja","Mixed carton":"Mixed carton","Many small SKUs packed together":"Banyak SKU kecil dipacking bersama","Service kits":"Service kit","Fast":"Cepat","Pallet build":"Pallet build","Cartons grouped for sea freight":"Karton digabung untuk sea freight","Quoted":"Quoted","Split shipment":"Split shipment","Ready stock ships first":"Stok ready dikirim dulu","Urgent repair":"Perbaikan urgent","Are the prices final export prices?":"Apakah harga ini final untuk ekspor?","No. Final export pricing is confirmed after stock, freight, destination tax, duty, banking fees and destination-specific compliance costs are reviewed.":"Belum. Harga ekspor final dikonfirmasi setelah stok, freight, pajak tujuan, duty, biaya bank, dan compliance negara tujuan direview.","Can retail and B2B customers use the same catalog?":"Apakah customer retail dan B2B bisa pakai katalog yang sama?","Yes. The same product records can expose different price tiers, MOQ rules, credit terms and quotation workflows based on the authenticated customer account.":"Bisa. Data produk yang sama dapat menampilkan tier harga, aturan MOQ, term kredit, dan alur quotation berbeda sesuai akun customer.","How should fitment be confirmed?":"Bagaimana fitment harus dikonfirmasi?","Use equipment family, exact model, engine code, serial range, market variant and superseded part numbers. High-risk assemblies should require manual approval before shipment.":"Gunakan keluarga unit, model tepat, kode engine, rentang serial, varian market, dan nomor part pengganti. Assembly berisiko tinggi perlu approval manual sebelum shipment.","Can large product catalogs be managed at scale?":"Apakah katalog besar bisa dikelola secara scale?","Yes. A production catalog should use a database, search index, PIM, image CDN and server-side APIs for reliable inventory and pricing operations.":"Bisa. Katalog production sebaiknya memakai database, search index, PIM, image CDN, dan API server-side untuk operasi inventory dan pricing yang andal.","How are export documents handled?":"Bagaimana dokumen ekspor ditangani?","The system should generate controlled commercial documents from validated order, packing, country-of-origin and classification data. HS codes and regulatory requirements need professional review.":"Sistem sebaiknya menghasilkan dokumen komersial terkontrol dari data order, packing, country-of-origin, dan klasifikasi yang sudah tervalidasi. HS code dan requirement regulasi perlu review profesional.","Is Hikari Tractors affiliated with OEM brands?":"Apakah Hikari Tractors terafiliasi dengan brand OEM?","Hikari Tractors Indonesia is an independent supplier. Brand names and trademarks belong to their respective owners.":"Hikari Tractors Indonesia adalah supplier independen. Nama brand dan trademark adalah milik pemilik masing-masing."});
Object.assign(ID_TEXT,{"Parts intelligence for global buyers":"Intelijen suku cadang untuk buyer global","Shop by system":"Belanja berdasarkan sistem","Searchable product database":"Database produk yang bisa dicari","Equipment family":"Keluarga unit","Unit family":"Keluarga unit","Buyer profile":"Profil buyer","All equipment":"Semua unit","Retail / Workshop":"Retail / Bengkel","B2B Distributor":"Distributor B2B","Fleet Account":"Akun Armada","Search SKU, part name, model or engine...":"Cari SKU, nama part, model, atau engine...","Industrial engine":"Engine industri","Combine / harvester":"Combine / harvester"});
Object.assign(ID_TEXT,{
 "Support":"Hubungi","Export desk online":"Tim ekspor siap membantu","Jakarta warehouse":"Gudang Jakarta","Independent parts exporter":"Supplier part traktor independen","Indonesia · Global Supply":"Indonesia · Suplai Global","Parts Catalog":"Katalog Part","Model Finder":"Cari Model","Catalog":"Katalog","Models":"Model","PARTS INTELLIGENCE FOR GLOBAL BUYERS":"PENCARIAN PART UNTUK PEMBELI GLOBAL","Parts intelligence for global buyers":"Pencarian part untuk pembeli global","Find the exact part.":"Cari part yang pas.","Ship it worldwide.":"Kirim ke mana saja.","A compact export catalog built for farmers, workshops, fleet operators and distributors. Search by SKU, machine model or engine series, compare price tiers, and request freight-ready quotations in one flow.":"Katalog ekspor yang ringkas untuk petani, bengkel, fleet, dan distributor. Cari lewat SKU, model unit, atau seri engine, bandingkan tier harga, lalu ajukan penawaran siap kirim dalam satu alur.","Retail + B2B tiers":"Harga retail & B2B","Mixed-carton RFQ":"RFQ campur SKU","Fitment-first search":"Cari berdasarkan kecocokan unit","Precision Parts Lookup":"Cari Part dengan Presisi","CATALOG REVIEW · EXPORT READY":"KATALOG SIAP REVIEW · SIAP EKSPOR","Part / Keyword":"Part / Keyword","Machine Model":"Model Unit","Engine Series":"Seri Engine","Search":"Cari","EQUIPMENT FAMILY":"JENIS UNIT","Equipment family":"Jenis unit","Unit family":"Jenis unit","BUYER PROFILE":"TIPE PEMBELI","Buyer profile":"Tipe pembeli","Browse catalog":"Lihat katalog","Upload parts list":"Upload daftar part","Export pricing, stock, tax, freight and payment terms are confirmed by Hikari’s sales team before invoicing.":"Harga ekspor, stok, pajak, ongkir, dan termin pembayaran tetap dikonfirmasi tim Hikari sebelum invoice diterbitkan.","searchable SKUs":"SKU siap dicari","destination markets":"negara tujuan","Incoterm workflows":"alur Incoterm","buyer pricing levels":"tier harga pembeli","local catalog filtering":"filter katalog cepat","SHOP BY SYSTEM":"PILIH BERDASARKAN SISTEM","Shop by system":"Pilih berdasarkan sistem","Compact navigation for a deep catalog":"Katalog besar, navigasi tetap simpel","Product families are grouped by the way technicians actually diagnose and service equipment, not only by generic e-commerce labels.":"Kategori disusun mengikuti cara teknisi mencari dan memperbaiki unit di lapangan, bukan sekadar label toko online.","SEARCHABLE PRODUCT DATABASE":"DATABASE PART YANG MUDAH DICARI","Searchable product database":"Database part yang mudah dicari","Filter by category, machine, availability, origin and export packaging across a structured tractor parts catalog.":"Saring berdasarkan kategori, unit, ketersediaan, asal barang, dan packing ekspor dalam katalog part traktor yang rapi.","Reset all":"Reset semua filter","Category":"Kategori","Equipment":"Unit","Part class":"Kelas part","USD price range":"Rentang harga USD","Export options":"Opsi ekspor","Ready stock":"Ready stock","Limited stock":"Stok terbatas","Export packed":"Siap packing ekspor","Exclude regulated items":"Sembunyikan item regulasi","Retail price":"Harga retail","B2B price":"Harga B2B","Export price":"Harga ekspor","Price: low to high":"Harga terendah","Price: high to low":"Harga tertinggi","Prices exclude freight, duty and destination tax":"Harga belum termasuk freight, bea masuk, dan pajak tujuan","Page":"Halaman","of":"dari","Prev":"Sebelumnya","Next":"Berikutnya","parts found":"part ditemukan","showing":"menampilkan","Equipment-first experience":"Mulai dari unitnya dulu","Save your machine. Stop guessing fitment.":"Simpan model unit. Biar tidak tebak-tebakan part.","The “My Garage” pattern keeps model and engine context attached to every search, so buyers see compatible parts first and reduce costly export returns.":"Saved Models menyimpan model dan engine yang sering dipakai, jadi pencarian berikutnya langsung mengarah ke part yang lebih cocok dan mengurangi risiko salah kirim.","Select equipment family":"Pilih jenis unit","Add model / engine code":"Masukkan model / kode engine","Browse verified fitment":"Cari part yang cocok","Family":"Jenis unit","Add to My Garage":"Simpan model","Saved Models":"Model Tersimpan","Fitment-first catalog":"Katalog berbasis kecocokan unit","Model · engine · serial-range ready":"Model · engine · range serial siap dicek","Quote-to-shipment workflow":"Dari penawaran sampai pengiriman","Built for export, not just checkout":"Bukan cuma checkout, tapi siap ekspor","The order drawer captures commercial terms, destination and buyer type before quotation, so freight and packing can be calculated correctly.":"Panel order mencatat term, negara tujuan, dan tipe pembeli sejak awal, supaya packing dan freight bisa dihitung lebih akurat.","Export process":"Alur ekspor","Incoterm guide":"Panduan Incoterm","Documents":"Dokumen","Consolidation":"Konsolidasi","Mixed-carton B2B orders":"Order B2B campur SKU","Combine filters, seals, bearings and maintenance kits into a single commercial quotation with carton-level packing data.":"Gabungkan filter, seal, bearing, dan service kit dalam satu penawaran, lengkap dengan data packing per karton.","Commercial document pack":"Paket dokumen penjualan","Prepare proforma invoices, packing lists, origin fields, HS-code notes and shipment references for export review.":"Siapkan proforma invoice, packing list, data origin, catatan HS code, dan referensi pengiriman untuk review ekspor.","Download order CSV":"Download template CSV","Operational tools":"Tools operasional","One storefront, four buying workflows":"Satu katalog untuk empat cara beli","The interface separates quick retail purchases from workshop orders, fleet replenishment and distributor RFQs without duplicating the catalog.":"Interface ini memisahkan kebutuhan retail, bengkel, fleet, dan distributor tanpa perlu membuat katalog terpisah.","Retail & workshop":"Retail & bengkel","Fleet replenishment":"Restock fleet","Secure production path":"Siap untuk jalur produksi","Browse retail catalog →":"Lihat katalog retail →","Switch to B2B price →":"Pakai harga B2B →","Open Saved Models →":"Buka model tersimpan →","Read architecture notes →":"Lihat catatan arsitektur →","Buyer confidence":"Lebih yakin sebelum order","Support before the shipment leaves":"Bereskan detail sebelum barang dikirim","Good export UX makes uncertainty visible: fitment confidence, stock status, quotation validity, packaging, documentation and destination requirements.":"UX ekspor yang baik membuat hal penting terlihat dari awal: kecocokan part, status stok, masa berlaku penawaran, packing, dokumen, sampai aturan negara tujuan.","Request a parts quotation":"Minta penawaran part","Share your parts list, destination and buyer type for export quotation review.":"Kirim daftar part, negara tujuan, dan tipe pembeli supaya tim Hikari bisa review penawaran ekspor.","Name / company":"Nama / perusahaan","Buyer type":"Tipe pembeli","Parts, model or engine details":"Detail part, model, atau engine","Create RFQ":"Kirim RFQ","Do not include payment-card details or sensitive identity documents in this form.":"Jangan masukkan detail kartu pembayaran atau dokumen identitas sensitif di form ini.","Retail / workshop":"Retail / bengkel","B2B distributor":"Distributor B2B","Fleet operator":"Operator fleet","Tractor Parts · Export Supply":"Part Traktor · Suplai Ekspor","Hikari Tractors Indonesia supplies tractor spare parts, export packing support and quotation assistance for workshops, fleets and distributors.":"Hikari Tractors Indonesia menyediakan part traktor, dukungan packing ekspor, dan bantuan penawaran untuk bengkel, fleet, dan distributor.","All rights reserved.":"Seluruh hak cipta dilindungi.","Export terms, availability and fitment are confirmed during quotation.":"Term ekspor, stok, dan kecocokan part dikonfirmasi saat penawaran.","Order / RFQ Builder":"Order / RFQ","Retail order mode":"Mode order retail","Your order list is empty":"Belum ada item di order","Add products from the catalog. Quantities and buyer tier are saved only in your browser.":"Tambahkan part dari katalog. Jumlah dan tier harga tersimpan di browser Anda.","Destination country":"Negara tujuan","Trade term":"Term dagang","Shipping":"Pengiriman","Merchandise":"Subtotal produk","Estimated packing":"Estimasi packing","Freight & destination charges":"Freight & biaya tujuan","Quoted separately":"Dikonfirmasi terpisah","Quotation base":"Estimasi penawaran","Generate quotation":"Buat penawaran","Catalog notice":"Catatan katalog","Final pricing, stock and shipping are confirmed during quotation.":"Harga final, stok, dan pengiriman akan dikonfirmasi saat penawaran.","Done":"Selesai","No saved products yet.":"Belum ada part yang disimpan.","No matching parts":"Belum ketemu part yang cocok","Try a broader model, engine or category search.":"Coba pakai kata kunci, model, engine, atau kategori yang lebih umum.","Reset filters":"Reset filter","Added to order":"Part masuk ke order","Saved to wishlist":"Disimpan ke favorit","Removed from wishlist":"Dihapus dari favorit","Comparison limit":"Batas compare tercapai","You can compare up to 4 parts.":"Maksimal 4 part untuk dibandingkan.","No comparison items":"Belum ada part untuk dibandingkan","Use the compare icon on a product card.":"Klik ikon compare di kartu produk.","Saved parts":"Part favorit","Machine saved":"Model disimpan","Order list is empty":"Order masih kosong","Quotation request prepared":"Permintaan penawaran siap","Quotation draft ready":"Draft penawaran siap","Request summary":"Ringkasan permintaan","Bulk parts-list upload":"Upload daftar part massal","Upload CSV / XLSX / PDF parts list":"Upload daftar part CSV / XLSX / PDF","Parts list upload":"Upload daftar part","Trade compliance and platform security":"Kepatuhan ekspor & keamanan platform","Operational safeguards":"Standar operasional","Media attribution":"Atribusi media","Part match":"Cek part","Fitment check":"Cek kecocokan","Price validity":"Masa berlaku harga","Weight & volume":"Berat & volume","Dispatch":"Pengiriman keluar","Destination support":"Bantuan negara tujuan","Step":"Tahap","Seller scope":"Tanggung jawab seller","Best for":"Paling cocok untuk","Match":"Cek cocok","Model, engine and serial checked":"Model, engine, dan serial ikut dicek","Wrong-part prevention":"Mengurangi risiko salah part","Required":"Wajib","Quote":"Penawaran","Price, MOQ and validity issued":"Harga, MOQ, dan masa berlaku disiapkan","B2B approval":"Approval pembeli B2B","Carton weight and volume recorded":"Berat dan volume karton dicatat","Freight quote":"Estimasi freight","Term":"Term","Quote status":"Status penawaran","Goods packed at warehouse":"Barang dipacking di gudang","Buyer-appointed forwarder":"Forwarder dari pembeli","Instant base":"Base cepat","Export clearance + port delivery":"Clearance ekspor + antar ke port","Sea freight consolidation":"Konsolidasi via laut","Manual freight":"Freight manual","Distributor replenishment":"Restock distributor","Rate request":"Request rate","Door delivery; duty depends on term":"Kirim sampai alamat; duty mengikuti term","Workshop / retail buyer":"Bengkel / pembeli retail","Compliance review":"Review compliance","Purpose":"Kegunaan","Needed for":"Dipakai untuk","Price, validity, payment reference":"Harga, masa berlaku, referensi pembayaran","Buyer approval":"Approval pembeli","Carton count, gross/net weight":"Jumlah karton, gross/net weight","Classification and origin fields":"Klasifikasi dan data origin","How it works":"Cara kerjanya","Many small SKUs packed together":"Banyak SKU kecil dipacking bersama","Ready stock ships first":"Stok ready dikirim dulu","Urgent repair":"Perbaikan urgent","Are the prices final export prices?":"Apakah harga ini sudah final untuk ekspor?","No. Final export pricing is confirmed after stock, freight, destination tax, duty, banking fees and destination-specific compliance costs are reviewed.":"Belum. Harga final baru dikunci setelah stok, freight, pajak tujuan, bea masuk, biaya bank, dan kebutuhan compliance negara tujuan direview.","Can retail and B2B customers use the same catalog?":"Retail dan B2B bisa pakai katalog yang sama?","How should fitment be confirmed?":"Cara memastikan part cocok bagaimana?","Can large product catalogs be managed at scale?":"Katalog besar bisa dikelola rapi?","How are export documents handled?":"Dokumen ekspor disiapkan seperti apa?","Is Hikari Tractors affiliated with OEM brands?":"Apakah Hikari Tractors terafiliasi dengan brand OEM?","All equipment":"Semua unit","Retail / Workshop":"Retail / Bengkel","B2B Distributor":"Distributor B2B","Fleet Account":"Akun Fleet","Search SKU, part name, model or engine...":"Cari SKU, nama part, model, atau engine...","Industrial engine":"Engine industri"});
Object.assign(ID_TEXT,{
 "Support":"Konsultasi","Parts Catalog":"Katalog Suku Cadang","Model Finder":"Pencarian Model","Catalog":"Katalog","Models":"Model","Export desk online":"Layanan ekspor aktif","Independent parts exporter":"Pemasok suku cadang traktor independen","Indonesia · Global Supply":"Indonesia · Global Supply","PARTS INTELLIGENCE FOR GLOBAL BUYERS":"SOLUSI PENCARIAN SUKU CADANG UNTUK PASAR GLOBAL","Parts intelligence for global buyers":"Solusi pencarian suku cadang untuk pasar global","Find the exact part.":"Temukan suku cadang yang tepat.","Ship it worldwide.":"Siap dikirim ke berbagai negara.","A compact export catalog built for farmers, workshops, fleet operators and distributors. Search by SKU, machine model or engine series, compare price tiers, and request freight-ready quotations in one flow.":"Katalog ekspor yang dirancang untuk petani, bengkel, operator armada, dan distributor. Cari berdasarkan SKU, model unit, atau seri engine; bandingkan tier harga; lalu ajukan penawaran yang siap diproses untuk pengiriman.","Retail + B2B tiers":"Harga retail dan B2B","Mixed-carton RFQ":"RFQ multi-SKU","Fitment-first search":"Pencarian berbasis kecocokan unit","Precision Parts Lookup":"Pencarian Suku Cadang Presisi","CATALOG REVIEW · EXPORT READY":"KATALOG TERKURASI · SIAP EKSPOR","Part / Keyword":"Part / Kata Kunci","Machine Model":"Model Unit","Engine Series":"Seri Engine","EQUIPMENT FAMILY":"JENIS UNIT","Equipment family":"Jenis unit","Unit family":"Jenis unit","BUYER PROFILE":"PROFIL PEMBELI","Buyer profile":"Profil pembeli","Browse catalog":"Jelajahi katalog","Upload parts list":"Unggah daftar part","Export pricing, stock, tax, freight and payment terms are confirmed by Hikari’s sales team before invoicing.":"Harga ekspor, ketersediaan stok, pajak, biaya pengiriman, dan ketentuan pembayaran akan dikonfirmasi oleh tim Hikari sebelum invoice diterbitkan.","searchable SKUs":"SKU siap dicari","destination markets":"pasar tujuan","buyer pricing levels":"level harga pembeli","local catalog filtering":"filter katalog instan","SHOP BY SYSTEM":"PILIH BERDASARKAN SISTEM","Shop by system":"Pilih berdasarkan sistem","Compact navigation for a deep catalog":"Navigasi ringkas untuk katalog berskala besar","Product families are grouped by the way technicians actually diagnose and service equipment, not only by generic e-commerce labels.":"Kategori disusun mengikuti cara teknisi mengidentifikasi kebutuhan unit di lapangan, sehingga proses pencarian lebih cepat dan relevan.","SEARCHABLE PRODUCT DATABASE":"DATABASE SUKU CADANG YANG MUDAH DITELUSURI","Searchable product database":"Database suku cadang yang mudah ditelusuri","Filter by category, machine, availability, origin and export packaging across a structured tractor parts catalog.":"Saring katalog berdasarkan kategori, unit, ketersediaan, asal barang, dan kesiapan packing ekspor dalam satu tampilan yang terstruktur.","Reset all":"Reset filter","Ready stock":"Stok tersedia","Limited stock":"Stok terbatas","Export packed":"Siap packing ekspor","Exclude regulated items":"Sembunyikan item yang perlu review regulasi","Retail price":"Harga retail","B2B price":"Harga B2B","Export price":"Harga ekspor","Price: low to high":"Harga terendah","Price: high to low":"Harga tertinggi","Prices exclude freight, duty and destination tax":"Harga belum termasuk freight, bea masuk, dan pajak negara tujuan","parts found":"suku cadang ditemukan","showing":"menampilkan","Equipment-first experience":"Mulai dari unit, lalu temukan part yang tepat","Save your machine. Stop guessing fitment.":"Simpan model unit agar pencarian part lebih akurat.","The “My Garage” pattern keeps model and engine context attached to every search, so buyers see compatible parts first and reduce costly export returns.":"Saved Models menjaga konteks model dan engine di setiap pencarian, sehingga pembeli lebih cepat menemukan part yang sesuai dan mengurangi risiko kesalahan pengiriman.","Select equipment family":"Pilih jenis unit","Add model / engine code":"Tambahkan model atau kode engine","Browse verified fitment":"Telusuri part yang sesuai","Add to My Garage":"Simpan model","Fitment-first catalog":"Katalog berbasis kecocokan unit","Model · engine · serial-range ready":"Siap untuk model, engine, dan rentang serial","Quote-to-shipment workflow":"Alur penawaran hingga pengiriman","Built for export, not just checkout":"Dirancang untuk kebutuhan ekspor, bukan sekadar checkout","The order drawer captures commercial terms, destination and buyer type before quotation, so freight and packing can be calculated correctly.":"Panel order mencatat term dagang, negara tujuan, dan tipe pembeli sejak awal agar estimasi packing dan freight dapat dihitung dengan lebih tepat.","Export process":"Alur ekspor","Incoterm guide":"Panduan Incoterm","Mixed-carton B2B orders":"Order B2B multi-SKU","Combine filters, seals, bearings and maintenance kits into a single commercial quotation with carton-level packing data.":"Gabungkan filter, seal, bearing, dan service kit dalam satu penawaran komersial, lengkap dengan data packing per karton.","Commercial document pack":"Paket dokumen komersial","Prepare proforma invoices, packing lists, origin fields, HS-code notes and shipment references for export review.":"Siapkan proforma invoice, packing list, data origin, catatan HS code, dan referensi pengiriman untuk kebutuhan review ekspor.","Download order CSV":"Unduh template order","Operational tools":"Perangkat operasional","One storefront, four buying workflows":"Satu katalog untuk berbagai kebutuhan pembelian","The interface separates quick retail purchases from workshop orders, fleet replenishment and distributor RFQs without duplicating the catalog.":"Interface ini memisahkan kebutuhan retail, bengkel, fleet, dan distributor tanpa menggandakan data katalog.","Retail & workshop":"Retail dan bengkel","Fleet replenishment":"Restock armada","Secure production path":"Fondasi produksi yang aman","Browse retail catalog →":"Jelajahi katalog retail →","Switch to B2B price →":"Gunakan harga B2B →","Open Saved Models →":"Buka model tersimpan →","Read architecture notes →":"Baca catatan arsitektur →","Buyer confidence":"Keputusan pembelian yang lebih yakin","Support before the shipment leaves":"Pastikan semuanya beres sebelum barang dikirim","Good export UX makes uncertainty visible: fitment confidence, stock status, quotation validity, packaging, documentation and destination requirements.":"Pengalaman ekspor yang baik harus membuat detail penting terlihat sejak awal: kecocokan part, status stok, masa berlaku penawaran, packing, dokumen, dan kebutuhan negara tujuan.","Request a parts quotation":"Ajukan penawaran suku cadang","Share your parts list, destination and buyer type for export quotation review.":"Kirim daftar part, negara tujuan, dan tipe pembeli agar tim Hikari dapat menyiapkan review penawaran ekspor.","Create RFQ":"Ajukan RFQ","Do not include payment-card details or sensitive identity documents in this form.":"Jangan masukkan detail kartu pembayaran atau dokumen identitas sensitif pada formulir ini.","Tractor Parts · Export Supply":"Suku Cadang Traktor · Pasokan Ekspor","Hikari Tractors Indonesia supplies tractor spare parts, export packing support and quotation assistance for workshops, fleets and distributors.":"Hikari Tractors Indonesia menyediakan suku cadang traktor, dukungan packing ekspor, dan asistensi penawaran untuk bengkel, fleet, dan distributor.","Export terms, availability and fitment are confirmed during quotation.":"Term ekspor, stok, dan kecocokan part dikonfirmasi dalam proses penawaran.","Order / RFQ Builder":"Order / RFQ","Your order list is empty":"Daftar order masih kosong","Add products from the catalog. Quantities and buyer tier are saved only in your browser.":"Tambahkan part dari katalog. Jumlah item dan tier harga akan tersimpan di browser Anda.","Trade term":"Term dagang","Merchandise":"Subtotal produk","Estimated packing":"Estimasi packing","Freight & destination charges":"Freight dan biaya tujuan","Quoted separately":"Dikonfirmasi terpisah","Quotation base":"Estimasi penawaran","Generate quotation":"Buat penawaran","Final pricing, stock and shipping are confirmed during quotation.":"Harga final, stok, dan pengiriman akan dikonfirmasi saat penawaran diproses.","No saved products yet.":"Belum ada part yang disimpan.","No matching parts":"Belum ada part yang sesuai","Try a broader model, engine or category search.":"Coba gunakan kata kunci, model, engine, atau kategori yang lebih umum.","Added to order":"Part ditambahkan ke order","Saved to wishlist":"Part disimpan ke favorit","Removed from wishlist":"Part dihapus dari favorit","Comparison limit":"Batas perbandingan tercapai","You can compare up to 4 parts.":"Anda dapat membandingkan maksimal 4 part.","No comparison items":"Belum ada part untuk dibandingkan","Use the compare icon on a product card.":"Gunakan ikon compare pada kartu produk untuk menambahkan item.","Saved parts":"Part favorit","Machine saved":"Model unit disimpan","Order list is empty":"Order masih kosong","Quotation request prepared":"Permintaan penawaran siap diproses","Quotation draft ready":"Draft penawaran siap","Request summary":"Ringkasan permintaan","Bulk parts-list upload":"Unggah daftar part massal","Upload CSV / XLSX / PDF parts list":"Unggah daftar part dalam format CSV, XLSX, atau PDF","Parts list upload":"Unggah daftar part","Trade compliance and platform security":"Kepatuhan ekspor dan keamanan platform","Operational safeguards":"Standar pengamanan operasional","Part match":"Pencocokan part","Fitment check":"Validasi kecocokan","Price validity":"Masa berlaku harga","Dispatch":"Pengiriman keluar","Destination support":"Dukungan negara tujuan","Seller scope":"Lingkup seller","Best for":"Paling sesuai untuk","Match":"Validasi","Model, engine and serial checked":"Model, engine, dan serial ikut divalidasi","Wrong-part prevention":"Mengurangi risiko salah part","Quote":"Penawaran","Price, MOQ and validity issued":"Harga, MOQ, dan masa berlaku disiapkan","B2B approval":"Persetujuan pembeli B2B","Freight quote":"Estimasi freight","Quote status":"Status penawaran","Goods packed at warehouse":"Barang dipacking di gudang","Buyer-appointed forwarder":"Forwarder ditunjuk pembeli","Instant base":"Estimasi awal","Export clearance + port delivery":"Clearance ekspor dan pengiriman ke port","Sea freight consolidation":"Konsolidasi pengiriman laut","Manual freight":"Freight dihitung manual","Distributor replenishment":"Restock distributor","Rate request":"Permintaan rate","Door delivery; duty depends on term":"Kirim sampai alamat; duty mengikuti term","Workshop / retail buyer":"Bengkel atau pembeli retail","Compliance review":"Review kepatuhan","Purpose":"Fungsi","Needed for":"Diperlukan untuk","Buyer approval":"Persetujuan pembeli","Classification and origin fields":"Klasifikasi dan data origin","How it works":"Cara kerja","Many small SKUs packed together":"Banyak SKU kecil dipacking bersama","Ready stock ships first":"Stok ready dikirim lebih dulu","Urgent repair":"Perbaikan mendesak","Are the prices final export prices?":"Apakah harga ini sudah final untuk ekspor?","No. Final export pricing is confirmed after stock, freight, destination tax, duty, banking fees and destination-specific compliance costs are reviewed.":"Belum. Harga final ditetapkan setelah stok, freight, pajak tujuan, bea masuk, biaya bank, dan kebutuhan compliance negara tujuan selesai direview.","Can retail and B2B customers use the same catalog?":"Apakah retail dan B2B bisa memakai katalog yang sama?","How should fitment be confirmed?":"Bagaimana memastikan part benar-benar cocok?","Can large product catalogs be managed at scale?":"Apakah katalog besar bisa dikelola dengan rapi?","How are export documents handled?":"Bagaimana dokumen ekspor disiapkan?","Search SKU, part name, model or engine...":"Cari SKU, nama part, model, atau engine...","Try: oil filter, V2403, HIK-FLT-00018":"Contoh: oil filter, V2403, HIK-FLT-00018","Try: L4508, M7040, U50-5":"Contoh: L4508, M7040, U50-5","Try: D1105, V2403, V3800":"Contoh: D1105, V2403, V3800","Try: oil filter, V2403, L4508, HIK-FLT-00018":"Contoh: oil filter, V2403, L4508, HIK-FLT-00018","Example: V2403 service kit, 10 sets, destination Surabaya / Singapore / Manila...":"Contoh: service kit V2403, 10 set, tujuan Surabaya / Singapore / Manila..."});
Object.assign(ID_TEXT,{"Save your machine. Stop guessing fitment.":"Simpan model unit untuk pencarian suku cadang yang lebih akurat.","Add to order":"Tambahkan ke order","Support before the shipment leaves":"Pastikan setiap detail siap sebelum pengiriman","The order drawer captures commercial terms, destination and buyer type before quotation, so freight and packing can be calculated correctly.":"Panel order mencatat term dagang, negara tujuan, dan profil pembeli sejak awal, sehingga estimasi packing dan freight dapat dihitung dengan lebih presisi.","A compact export catalog built for farmers, workshops, fleet operators and distributors. Search by SKU, machine model or engine series, compare price tiers, and request freight-ready quotations in one flow.":"Katalog ekspor untuk petani, bengkel, operator armada, dan distributor. Cari berdasarkan SKU, model unit, atau seri engine; bandingkan tingkat harga; lalu ajukan penawaran yang siap diproses untuk pengiriman.","Good export UX makes uncertainty visible: fitment confidence, stock status, quotation validity, packaging, documentation and destination requirements.":"Pengalaman ekspor yang baik menampilkan semua detail penting sejak awal: kecocokan part, status stok, masa berlaku penawaran, packing, dokumen, dan kebutuhan negara tujuan."});
Object.assign(ID_TEXT,{"parts available":"suku cadang tersedia","Show":"Tampilkan","parts":"suku cadang","Close filters":"Tutup filter","RETAIL UNIT PRICE":"HARGA RETAIL","B2B UNIT PRICE":"HARGA B2B","EXPORT UNIT PRICE":"HARGA EKSPOR","MOQ":"MOQ","Export":"Ekspor"});
// Catalog content is generated from the downloaded #PARTS HIKARI TRACTORS Drive archive.
// No generated/demo SKU is retained in the public catalogue.
let categories=[];
let products=[];
let catalogProducts=[];
let catalogControlUpdatedAt="";
let sheetIndex={};
let sheetSearchIndex={partNumbers:{},partNames:{},sheets:{}};
let partControls={};
const tractorModels=["L3608","L4400DT","L5018DT-NES","M9000DT","M9540DT","MX5000DT","MX5100DT"];
const familyModels={Tractor:tractorModels};
const catalogApiBase=String(window.HIKARI_CONFIG?.catalogApiBase||"").replace(/\/$/,"");
function catalogApi(path){return `${catalogApiBase}${path}`}
function publicAssetUrl(mediaId,sourcePath){
 if(mediaId)return catalogApi(`/api/public-media?id=${encodeURIComponent(mediaId)}`);
 if(!sourcePath)return IMG.tractor;
 if(/^https?:\/\//i.test(sourcePath))return sourcePath;
 return catalogApi(`/api/public-assets?path=${encodeURIComponent(String(sourcePath).replace(/^\/+/,""))}`);
}
function priceInUsd(part,tier="retail_price"){
 const raw=Number(part?.[tier]??part?.retail_price??0);return part?.currency==="IDR"?raw/16300:raw;
}
function mapPublicCatalog(tree){
 const mappedProducts=[],mappedSheets={},numbers={},names={},sheets={};
 const models=Array.isArray(tree)?tree:[];
 tractorModels.splice(0,tractorModels.length,...models.map(model=>model.code).filter(Boolean));
 models.forEach(model=>(model.categories||[]).forEach(category=>(category.subcategories||[]).forEach(subcategory=>(subcategory.assemblies||[]).forEach(assembly=>{
  const parts=Array.isArray(assembly.spare_parts)?assembly.spare_parts:[];
  const previewImage=publicAssetUrl(assembly.thumbnail_media_id,assembly.source_thumbnail_url);
  const fullImage=publicAssetUrl(assembly.full_diagram_media_id,assembly.source_full_diagram_url||assembly.source_thumbnail_url);
  const sheetId=String(assembly.id), searchable=[];
  const mappedParts=parts.map(part=>{
   const match={part_number:part.part_number,name:part.name,callout:part.callout};searchable.push(match);
   const raw=String(part.part_number||"").toLowerCase(),norm=searchToken(raw);[raw,norm].filter(Boolean).forEach(key=>{(numbers[key]??=[]).push(sheetId)});
   const nameKey=String(part.name||"").toLowerCase();if(nameKey)(names[nameKey]??=[]).push(sheetId);
   return {id:part.id,callout:part.callout||"-",part_number:part.part_number,name:part.name,quantity:part.quantity||1,notes:part.notes||part.location_description||"",estimated_usd:priceInUsd(part),admin_stock:Number(part.stock_quantity||0),admin_publish_status:"published",currency:part.currency||"IDR"};
  });
  sheets[sheetId]={matches:searchable};
  mappedSheets[sheetId]={data:{sheet_id:sheetId,model_code:model.code,diagram_code:assembly.code,title:assembly.title,category_label:category.name,category_slug:category.slug,page_count:1,preview_image:previewImage,full_image:fullImage,parts:mappedParts,hotspots:(assembly.hotspots||[]).map(h=>({id:h.id,callout:h.callout,x:Number(h.x_pct),y:Number(h.y_pct),spare_part_id:h.spare_part_id}))}};
  const stockTotal=parts.reduce((sum,part)=>sum+Number(part.stock_quantity||0),0),lowest=parts.reduce((value,part)=>{const next=priceInUsd(part);return next>0&&(!value||next<value)?next:value},0);
  mappedProducts.push({id:sheetId,sku:assembly.code,name:assembly.title,category:category.name,machine:"Tractor",model:model.code,engine:"",grade:"Catalog",diagramCode:assembly.code,sheetId,partCount:parts.length,price:lowest,b2b:parts.length?Math.min(...parts.map(part=>priceInUsd(part,"b2b_price")).filter(Boolean)):lowest,export:parts.length?Math.min(...parts.map(part=>priceInUsd(part,"export_price")).filter(Boolean)):lowest,stock:stockTotal>8?"in":stockTotal>0?"low":"out",qty:stockTotal,featured:false,previewImage});
 }))));
 sheetIndex=mappedSheets;sheetSearchIndex={partNumbers:numbers,partNames:names,sheets};catalogProducts=mappedProducts;products=mappedProducts;catalogControlUpdatedAt=new Date().toISOString();
 return mappedProducts;
}
async function loadPublicCatalog(){
 if(!catalogApiBase)throw new Error("Catalog API URL is not configured");
 const response=await fetch(catalogApi("/api/public-catalog"),{cache:"no-store"});
 if(!response.ok)throw new Error(`public catalog ${response.status}`);
 const payload=await response.json();mapPublicCatalog(payload.data||[]);buildCatalogMetadata();renderCategories();renderProducts();renderCart();return payload;
}
function buildCatalogMetadata(){
 const counts=new Map();
 products.forEach(p=>counts.set(p.category,(counts.get(p.category)||0)+1));
 categories=[...counts.entries()].sort(([a],[b])=>a.localeCompare(b)).map(([name,count])=>({name,count,icon:"i-box"}));
}
function applyCatalogControl(control){
 const factor=control?.currency==="IDR"?1/16300:1;
 window.catalogControlCurrency=control?.currency||"USD";
 const controls=new Map((control?.products||[]).map(item=>[item.id,{...item,price:item.price==null?item.price:item.price*factor,b2b:item.b2b==null?item.b2b:item.b2b*factor,export:item.export==null?item.export:item.export*factor}]));
 partControls=control?.parts||{};
 catalogControlUpdatedAt=control?.updatedAt||catalogControlUpdatedAt;
 products=catalogProducts.map(product=>({...product,...(controls.get(product.id)||{})})).filter(product=>!product.publishStatus||product.publishStatus==="published");
}
function applySheetControls(sheet){
 if(!sheet)return sheet;
 const factor=window.catalogControlCurrency==="IDR"?1/16300:1;
 const source=(sheet.parts||[]).map((part,index)=>{
  const control=partControls[`${sheet.sheet_id}:${index}`],sourcePrice=part.source_estimated_usd??part.estimated_usd;
  return {...part,source_estimated_usd:sourcePrice,estimated_usd:control?.price==null?sourcePrice:control.price*factor,admin_stock:control?.stock,admin_publish_status:control?.publishStatus,name:control?.name??part.name,part_number:control?.partNumber??part.part_number,callout:control?.callout??part.callout,quantity:control?.quantity??part.quantity,notes:control?.notes??part.notes,deleted:control?.deleted};
 }).filter(part=>!part.deleted);
 const custom=Object.entries(partControls).filter(([key,control])=>key.startsWith(`${sheet.sheet_id}:custom:`)&&control?.custom&&!control.deleted).map(([,control])=>({callout:control.callout??"-",part_number:control.partNumber??"",name:control.name??"Sparepart baru",quantity:control.quantity??1,notes:control.notes,estimated_usd:(control.price||0)*factor,admin_stock:control.stock,admin_publish_status:control.publishStatus}));
 return {...sheet,parts:[...source,...custom]};
}
async function refreshCatalogControl(){
 try{await loadPublicCatalog()}catch(error){console.warn("[catalog-sync]",error)}
}
async function loadDriveCatalog(){
 try{return await loadPublicCatalog()}
 catch(remoteError){console.warn("[catalog-api-fallback]",remoteError)}
 try{
  const [catalog,index,search,control]=await Promise.all([
   fetch("assets/data/drive-catalog.json",{cache:"no-store"}).then(r=>{if(!r.ok)throw new Error(`catalog ${r.status}`);return r.json()}),
   fetch("assets/data/sheets-index.json",{cache:"no-store"}).then(r=>r.ok?r.json():{}),
   fetch("assets/data/sheets-search.json",{cache:"no-store"}).then(r=>r.ok?r.json():{partNumbers:{},partNames:{},sheets:{}}),
   fetch("assets/data/catalog-control-state.json",{cache:"no-store"}).then(r=>r.ok?r.json():null).catch(()=>null)
  ]);
  sheetIndex=index||{};
  sheetSearchIndex=search||{partNumbers:{},partNames:{},sheets:{}};
  catalogProducts=Array.isArray(catalog.products)?catalog.products:[];
  applyCatalogControl(control);
  buildCatalogMetadata(); renderCategories(); renderProducts(); renderCart();
 }catch(error){
  productGrid.innerHTML=`<div style="grid-column:1/-1;background:white;border:1px solid var(--line);border-radius:12px;padding:60px;text-align:center"><h3>Catalog unavailable</h3><p style="color:var(--muted)">Please retry shortly or contact Hikari for a parts quotation.</p></div>`;
 }
}
function load(k,f){try{return JSON.parse(localStorage.getItem(k))??f}catch{return f}}
function save(k,v){localStorage.setItem(k,JSON.stringify(v))}
function esc(s){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
function money(v){const rate=rates[state.currency], val=v*rate;return symbols[state.currency]+(state.currency==="IDR"?Math.round(val).toLocaleString("en-US"):val.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2}))}
function icon(id,size=17){return `<svg width="${size}" height="${size}"><use href="#${id}"/></svg>`}
function toast(title,msg=""){const el=document.createElement("div");el.className="toast";el.innerHTML=`<b>${esc(t(title))}</b>${esc(t(msg))}`;document.querySelector("#toastStack").appendChild(el);setTimeout(()=>el.remove(),3200)}
function setImages(){
 heroImage.src=IMG.hero; heroImage.fetchPriority="high"; modelImage.src=IMG.tractor; modelImage.loading="lazy"; engineImage.src=IMG.engine; engineImage.loading="lazy";pistonImage.src=IMG.piston; pistonImage.loading="lazy";headImage.src=IMG.head; headImage.loading="lazy";
}
function renderCategories(){
 categoryStrip.innerHTML=tractorModels.map(model=>`<button class="cat-card ${state.selectedModel===model?"active":""}" data-model="${esc(model)}"><span class="cat-icon">${icon("i-truck",18)}</span><span><b>${esc(model)}</b><small>${state.selectedModel===model?"Selected — choose an assembly":"Select tractor first"}</small></span></button>`).join("");
 const scoped=state.selectedModel?products.filter(p=>p.model===state.selectedModel):[];
 const scopedCounts=new Map(); scoped.forEach(p=>scopedCounts.set(p.category,(scopedCounts.get(p.category)||0)+1));
 categoryChecks.innerHTML=!state.selectedModel?`<p class="filter-note">Select a Hikari tractor above before opening its assemblies.</p>`:[...scopedCounts.entries()].sort(([a],[b])=>a.localeCompare(b)).map(([name,count])=>`<label class="check"><input type="checkbox" name="category" value="${esc(name)}"> ${esc(name)} <span style="margin-left:auto;color:#9aa1a6">${count}</span></label>`).join("");
 bindCategoryFilters();
}
function searchToken(value){return String(value||"").toLowerCase().replace(/[^a-z0-9]/g,"")}
function hasSearchQuery(){return state.query.trim().length>0}
function partMatchesForSheet(sheetId,q=state.query){
 const raw=String(q||"").toLowerCase().trim(), norm=searchToken(raw); if(!raw||!norm)return [];
 const ids=new Set([...(sheetSearchIndex.partNumbers?.[raw]||[]),...(sheetSearchIndex.partNumbers?.[norm]||[])]);
 const sheet=sheetSearchIndex.sheets?.[sheetId];
 if(sheet?.matches?.some(m=>[m.part_number,m.name,m.callout].join(" ").toLowerCase().includes(raw)||searchToken([m.part_number,m.name,m.callout].join(" ")).includes(norm)))ids.add(sheetId);
 return ids.has(sheetId)?(sheet?.matches||[]).filter(m=>[m.part_number,m.name,m.callout].join(" ").toLowerCase().includes(raw)||searchToken([m.part_number,m.name,m.callout].join(" ")).includes(norm)).slice(0,3):[];
}
function matchesPartSearch(p,q=state.query){return partMatchesForSheet(p.sheetId,q).length>0}
function partMatchBadge(p){const m=partMatchesForSheet(p.sheetId)[0];return m?`<div class="part-match-badge">Matched sparepart: <b>${esc(m.part_number)}</b> ${esc(m.name||"")}</div>`:""}
function filtered(){
 let arr=products.filter(p=>{
   const q=state.query.trim().toLowerCase();
   const okq=!q||[p.sku,p.name,p.category,p.machine,p.model,p.engine,p.grade,p.diagramCode].join(" ").toLowerCase().includes(q)||matchesPartSearch(p,q);
   const okSelected=!state.selectedModel||p.model===state.selectedModel;
   const okc=!state.category.size||state.category.has(p.category);
   const okm=!state.machine.size||state.machine.has(p.machine);
   const oks=!state.stock.size||state.stock.has(p.stock);
   const okg=!state.grade.size||state.grade.has(p.grade);
   const okmin=state.minPrice==null||p.price>=state.minPrice, okmax=state.maxPrice==null||p.price<=state.maxPrice;
   const okpack=!document.getElementById("exportPacked")?.checked||p.exportPacked;
   const okreg=!document.getElementById("dangerousGoods")?.checked||p.id%29!==0;
   return okq&&okSelected&&okc&&okm&&oks&&okg&&okmin&&okmax&&okpack&&okreg;
 });
 if(state.sort==="price-asc")arr.sort((a,b)=>priceFor(a)-priceFor(b));
 if(state.sort==="price-desc")arr.sort((a,b)=>priceFor(b)-priceFor(a));
 if(state.sort==="stock")arr.sort((a,b)=>({in:0,low:1,out:2}[a.stock]-({in:0,low:1,out:2}[b.stock])));
 if(state.sort==="name")arr.sort((a,b)=>a.name.localeCompare(b.name));
 if(state.sort==="featured")arr.sort((a,b)=>Number(b.featured)-Number(a.featured)||String(a.id).localeCompare(String(b.id)));
 return arr;
}
function priceFor(p){return p[state.account==="retail"?"price":state.account]}
function moqFor(p){return state.account==="retail"?Math.max(1,p.moq||1):state.account==="b2b"?(p.b2bMoq||50):(p.exportMoq||200)}
function stockLabel(p){return p.stock==="in"?`${p.qty} ${t("in stock")}`:p.stock==="low"?`${t("Only")} ${p.qty} ${t("left")}`:t("Pre-order")}
function imgFor(p){return p?.previewImage||IMG[p?.img]||IMG.tractor}
function openWhatsApp(){const page=location.hash.slice(1)||"home";const msg=encodeURIComponent(`Hi Hikari! I'm interested in your tractor parts catalog. I'm currently browsing: ${page}. Can you help?`);window.open(`https://wa.me/6282100000000?text=${msg}`,"_blank")}
function productCard(p){
 const saved=state.wishlist.has(p.id), compared=state.compare.has(p.id), price=priceFor(p);
 return `<article class="product-card">
  <button class="product-img" data-action="quick" data-id="${p.id}" aria-label="Open ${esc(p.name)} diagram"><img loading="lazy" src="${imgFor(p)}" alt="${esc(p.name)} diagram"></button>
  <div class="product-body"><div class="sku">${esc(p.diagramCode)} · ${esc(p.category)}</div><div class="product-name">${esc(p.name.replace(/\s*##\s*.*/,""))}</div><div class="fitment">${esc(p.model)} · ${p.partCount||0} orderable parts</div>${partMatchBadge(p)}
  <div class="price-box"><div class="price-main"><div><small>SPAREPART ROWS</small><br><b>${p.partCount||0} parts</b></div><small>Open diagram to choose part</small></div></div>
  <div class="product-actions"><button class="btn btn-primary" data-action="quick" data-id="${p.id}">${icon("i-search",14)} Open diagram</button></div></div></article>`;
}
function renderProducts(){
 if(!state.selectedModel&&!hasSearchQuery()){
  productGrid.innerHTML=`<div style="grid-column:1/-1;background:white;border:1px solid var(--line);border-radius:12px;padding:60px;text-align:center"><h3>Select your Hikari tractor first</h3><p style="color:var(--muted)">Assemblies and diagrams stay locked to one tractor model. Choose a model above to continue.</p></div>`;
  resultCount.textContent="Select a tractor model to open assemblies"; pagination.innerHTML=""; paginationTop.innerHTML=""; updateFilterUi(0); return;
 }
 const arr=filtered(), pages=Math.max(1,Math.ceil(arr.length/state.perPage)); if(state.page>pages)state.page=pages;
 const start=(state.page-1)*state.perPage, items=arr.slice(start,start+state.perPage);
 productGrid.innerHTML=items.map(productCard).join("")||`<div style="grid-column:1/-1;background:white;border:1px solid var(--line);border-radius:12px;padding:60px;text-align:center"><h3>${t("No matching parts")}</h3><p style="color:var(--muted)">${t("Try a broader model, engine or category search.")}</p><button class="btn btn-primary" onclick="resetAll()">${t("Reset filters")}</button></div>`;
 productGrid.classList.toggle("list-view",state.view==="list");
 resultCount.textContent=`${arr.length.toLocaleString()} ${t("parts found")} · ${t("showing")} ${arr.length?start+1:0}–${Math.min(start+state.perPage,arr.length)}`;
 pageSummary.textContent=`${t("Page")} ${state.page} ${t("of")} ${pages}`;
 renderPagination(pages); updateCounts(); updateFilterUi(arr.length); renderFilterTags();
}
function renderPagination(pages){
 let nums=[]; for(let p=Math.max(1,state.page-2);p<=Math.min(pages,state.page+2);p++)nums.push(p);
 const html=`<button class="page-prev" data-page="${state.page-1}" ${state.page===1?"disabled":""}>‹ <span>${t("Prev")}</span></button>${nums.map(p=>`<button class="${p===state.page?"active":""}" data-page="${p}">${p}</button>`).join("")}<button class="page-next" data-page="${state.page+1}" ${state.page===pages?"disabled":""}><span>${t("Next")}</span> ›</button>`;
 pagination.innerHTML=html;
 paginationTop.innerHTML=html;
}
function updateCounts(){cartCount.textContent=state.cart.reduce((a,x)=>a+x.qty,0);wishCount.textContent=state.wishlist.size;compareCount.textContent=state.compare.size;renderActionStrips()}
function searchSuggest(q){
 const el=document.getElementById("catalogSuggestions"); if(!el)return;
 if(!q||q.length<2){el.classList.remove("open");return;}
 const ql=q.toLowerCase();
 const hits=products.filter(p=>[p.sku,p.name,p.model,p.engine,p.category,p.diagramCode].join(" ").toLowerCase().includes(ql)||matchesPartSearch(p,q)).slice(0,8);
 if(!hits.length){el.classList.remove("open");return;}
 el.innerHTML=hits.map(p=>{const m=partMatchesForSheet(p.sheetId,q)[0];return `<div class="search-suggestion" data-sku="${esc(m?.part_number||p.sku)}" data-query="${esc(m?.part_number||p.sku)}"><span class="ss-sku">${esc(m?.part_number||p.sku)}</span><span class="ss-name">${esc(m?`${m.name} · in ${p.name}`:p.name)}</span><span class="ss-price">${esc(p.model)}</span></div>`}).join("");
 el.classList.add("open");
}
function activeFilterCount(){return state.category.size+state.machine.size+state.stock.size+state.grade.size+(state.minPrice!=null?1:0)+(state.maxPrice!=null?1:0)+(document.getElementById("exportPacked")?.checked?1:0)+(document.getElementById("dangerousGoods")?.checked?1:0)}
function updateFilterUi(total=filtered().length){
 const count=activeFilterCount();
 if(mobileFilterCount)mobileFilterCount.textContent=count?String(count):"";
 if(filterSheetCount)filterSheetCount.textContent=`${total.toLocaleString()} ${t("parts available")}`;
 if(filterApplyBtn)filterApplyBtn.textContent=`${t("Show")} ${total.toLocaleString()} ${t("parts")}`;
}
function saveRfqForm(){
 const data={name:rfqBuyerName?.value||"",email:rfqBuyerEmail?.value||"",phone:rfqBuyerPhone?.value||"",dest:destCountry?.value||"",term:incoterm?.value||"",ship:shippingMethod?.value||"",ref:buyerRef?.value||""};
 try{localStorage.setItem("hikari_rfq_form",JSON.stringify(data))}catch(e){}
}
function loadRfqForm(){
 try{
  const raw=localStorage.getItem("hikari_rfq_form");
  if(!raw)return;
  const d=JSON.parse(raw);
  if(rfqBuyerName&&d.name!=null)rfqBuyerName.value=d.name;
  if(rfqBuyerEmail&&d.email!=null)rfqBuyerEmail.value=d.email;
  if(rfqBuyerPhone&&d.phone!=null)rfqBuyerPhone.value=d.phone;
  if(destCountry&&d.dest!=null)destCountry.value=d.dest;
  if(incoterm&&d.term!=null)incoterm.value=d.term;
  if(shippingMethod&&d.ship!=null)shippingMethod.value=d.ship;
  if(buyerRef&&d.ref!=null)buyerRef.value=d.ref;
 }catch(e){}
}
function renderFilterTags(){ const el=document.getElementById("filterTags"); if(!el)return; const parts=[];
 state.category.forEach(v=>parts.push({label:v,type:"category",val:v}));
 state.machine.forEach(v=>parts.push({label:v,type:"machine",val:v}));
 state.stock.forEach(v=>parts.push({label:v==="in"?"Ready stock":v==="low"?"Limited stock":"Pre-order",type:"stock",val:v}));
 state.grade.forEach(v=>parts.push({label:v,type:"grade",val:v}));
 if(state.minPrice!=null)parts.push({label:"Min $"+state.minPrice,type:"minPrice",val:null});
 if(state.maxPrice!=null)parts.push({label:"Max $"+state.maxPrice,type:"maxPrice",val:null});
 if(document.getElementById("exportPacked")?.checked)parts.push({label:"Export packed",type:"exportPacked",val:null});
 if(document.getElementById("dangerousGoods")?.checked)parts.push({label:"Exclude regulated",type:"dangerousGoods",val:null});
 if(state.query.trim())parts.push({label:"Search: "+state.query,type:"query",val:null});
 el.innerHTML=parts.map((p,i)=>`<span class="filter-tag" data-tag="${i}"><strong>${esc(p.label)}</strong><button data-tag-remove="${i}" aria-label="Remove filter" tabindex="-1">✕</button></span>`).join("")||"";
}
function removeTag(i){
 const tags=[];
 state.category.forEach(v=>tags.push({type:"category",val:v,do:()=>state.category.delete(v)}));
 state.machine.forEach(v=>tags.push({type:"machine",val:v,do:()=>state.machine.delete(v)}));
 state.stock.forEach(v=>tags.push({type:"stock",val:v,do:()=>state.stock.delete(v)}));
 state.grade.forEach(v=>tags.push({type:"grade",val:v,do:()=>state.grade.delete(v)}));
 if(state.minPrice!=null)tags.push({type:"minPrice",val:null,do:()=>{state.minPrice=null;minPrice.value=""}});
 if(state.maxPrice!=null)tags.push({type:"maxPrice",val:null,do:()=>{state.maxPrice=null;maxPrice.value=""}});
 if(document.getElementById("exportPacked")?.checked)tags.push({type:"exportPacked",val:null,do:()=>{document.getElementById("exportPacked").checked=false;document.getElementById("exportPacked").dispatchEvent(new Event("change",{bubbles:true}))}});
 if(document.getElementById("dangerousGoods")?.checked)tags.push({type:"dangerousGoods",val:null,do:()=>{document.getElementById("dangerousGoods").checked=false;document.getElementById("dangerousGoods").dispatchEvent(new Event("change",{bubbles:true}))}});
 if(state.query.trim())tags.push({type:"query",val:null,do:()=>{state.query="";catalogSearch.value=""}});
 const t=tags[i]; if(t){t.do();renderProducts()}
}

function cartLine(ci){
 if(ci.line)return ci.line;
 const p=products.find(x=>x.id===ci.id); if(!p)return null;
 return {id:p.id,sku:p.sku,name:p.name,price:priceFor(p),moq:moqFor(p),img:imgFor(p),meta:`${p.model} · ${p.category}`};
}
function addPartToCart(sheetId,index){
 const sheet=window.currentSheet;if(!sheet||sheet.sheet_id!==sheetId)return;
 const part=sheet.parts[index];if(!part)return;
 const lineId=`${sheetId}:${index}`;
 const line={id:lineId,partId:part.id,sku:part.part_number,name:part.name,price:part.estimated_usd||0,moq:1,img:sheet.preview_image,meta:`${sheet.model_code} · ${sheet.diagram_code} · No. ${part.callout} · Kebutuhan per set: ${part.quantity} pcs${part.notes?` · ${part.notes}`:""}`};
 const found=state.cart.find(x=>x.id===lineId); if(found)found.qty++; else state.cart.push({id:lineId,qty:1,line});
 save("kpx_cart",state.cart);updateCounts();renderCart();renderExplodedSheet(sheet);toast("Added sparepart to order",`${line.sku} · ${line.name}`);
}
function addCart(id){
 const p=products.find(x=>x.id===id); if(!p)return;
 const found=state.cart.find(x=>x.id===id); if(found)found.qty++; else state.cart.push({id,qty:1});
 save("kpx_cart",state.cart);updateCounts();renderCart();toast("Added to order",`${p.sku} · ${p.name}`)
}
function renderCart(){
 const items=state.cart.map(ci=>({ci,line:cartLine(ci)})).filter(x=>x.line);
 emptyCart.classList.toggle("hidden",items.length>0);
 cartItems.innerHTML=items.map(({ci,line})=>`<div class="cart-item"><img src="${line.img}" alt=""><div><b>${esc(line.name)}</b><small>${esc(line.sku)} · ${esc(line.meta)} · ${money(line.price)}/${t("unit")}</small><div class="qty"><button data-cart="minus" data-id="${esc(ci.id)}">−</button><span>${ci.qty}</span><button data-cart="plus" data-id="${esc(ci.id)}">+</button></div></div><button class="remove-btn" data-cart="remove" data-id="${esc(ci.id)}">${icon("i-close",15)}</button></div>`).join("");
 const subtotal=items.reduce((s,{ci,line})=>s+line.price*ci.qty,0),packing=items.length?Math.max(12,subtotal*.018):0;
 subtotalText.textContent=money(subtotal);packingText.textContent=money(packing);grandText.textContent=money(subtotal+packing);
 drawerModeLabel.textContent=t(state.account==="retail"?"Retail / workshop order mode":state.account==="b2b"?"B2B distributor quotation mode":"Export quotation mode");
 updateRfqChecklist();
}
function updateRfqChecklist(){
 if(!rfqChecklist)return;
 const hasItems=state.cart.length>0;
 const hasDest=destCountry?.value.trim().length>0;
 const hasTerm=incoterm?.value&&!"Quote best method".includes(incoterm.value);
 rfqChecklist.querySelectorAll("[data-check]").forEach(el=>{
  const key=el.dataset.check;
  const ok=key==="items"?hasItems:key==="dest"?hasDest:key==="term"?hasTerm:true;
  el.classList.toggle("rfq-ready",ok);
  el.classList.toggle("rfq-pending",!ok);
 });
}
function collectRfqSummary(){
 if(!rfqSummary)return;
 const hasDest=destCountry?.value.trim().length>0;
 rfqSummary.style.display=state.cart.length>0||hasDest?"block":"none";
 rfqCountryLabel.textContent=hasDest?"📍 "+destCountry.value.trim():"";
 rfqIncotermLabel.textContent=incoterm?.value||"";
 rfqShippingLabel.textContent=shippingMethod?.value||"";
}
function openDrawer(){drawerBackdrop.classList.add("open");cartDrawer.classList.add("open");document.body.style.overflow="hidden";renderCart()}
function closeDrawer(){drawerBackdrop.classList.remove("open");cartDrawer.classList.remove("open");document.body.style.overflow=""}
function openModal(title,html){modalTitle.textContent=t(title);modalBody.innerHTML=html;translateStatic(modalBody);modalBackdrop.classList.add("open");document.body.style.overflow="hidden"}
function closeModal(){modalBackdrop.classList.remove("open");document.body.style.overflow=""}
function sheetLineId(sheetId,index){return `${sheetId}:${index}`}
function sheetCartQuantity(sheetId,index){return state.cart.find(x=>String(x.id)===sheetLineId(sheetId,index))?.qty||0}
function changeSheetPartQuantity(sheetId,index,delta){
 const lineId=sheetLineId(sheetId,index), item=state.cart.find(x=>String(x.id)===lineId);
 if(!item)return;
 item.qty=Math.max(0,item.qty+delta);
 if(item.qty===0)state.cart=state.cart.filter(x=>String(x.id)!==lineId);
 save("kpx_cart",state.cart);updateCounts();renderCart();renderExplodedSheet(window.currentSheet);
}
function sheetCartControl(sheet,index){
 const qty=sheetCartQuantity(sheet.sheet_id,index);
 if(!qty)return `<button class="sheet-buy" onclick="addPartToCart('${sheet.sheet_id}',${index})">${icon("i-cart",12)} Tambah 1 pcs</button>`;
 return `<div class="sheet-qty-control"><button onclick="changeSheetPartQuantity('${sheet.sheet_id}',${index},-1)" aria-label="Reduce quantity">−</button><b>${qty}</b><button onclick="changeSheetPartQuantity('${sheet.sheet_id}',${index},1)" aria-label="Add quantity">+</button><span>In cart</span></div>`;
}
function renderExplodedSheet(sheet){
 if(!sheet)return;
 window.currentSheet=sheet;
 const cartTotal=sheet.parts.reduce((sum,_,index)=>sum+sheetCartQuantity(sheet.sheet_id,index),0);
 const visibleParts=sheet.parts.filter(part=>!part.admin_publish_status||part.admin_publish_status==="published");
 const rows=sheet.parts.map((part,index)=>part.admin_publish_status&&part.admin_publish_status!=="published"?"":`<div class="sheet-row" data-sheet-callout="${part.callout}"><button class="sheet-callout" onclick="selectSheetPart('${part.callout}',${index})">${part.callout}</button><span onclick="selectSheetPart('${part.callout}',${index})"><strong>${esc(part.part_number)}</strong><small>${esc(part.name)} · Jual satuan · kebutuhan per set: ${part.quantity} pcs${part.notes?` · ${esc(part.notes)}`:""}</small></span><em>${money(part.estimated_usd)}<small>Harga / pcs${part.admin_stock!=null?` · stok ${part.admin_stock}`:" · estimasi"}</small></em>${sheetCartControl(sheet,index)}</div>`).join("");
 const markers=(sheet.hotspots||[]).map(h=>`<button class="sheet-marker" data-sheet-marker="${h.callout}" onclick="selectSheetPart('${h.callout}')" style="left:${h.x}%;top:${h.y}%" aria-label="Part callout ${h.callout}"><span>${h.callout}</span></button>`).join("");
 openModal(`${sheet.model_code} · ${sheet.title}`,`<div class="sheet-viewer"><div class="sheet-intro"><b>${sheet.diagram_code} · ${sheet.category_label||sheet.category_slug.replaceAll("-"," ")} · ${sheet.page_count||1} PDF page${(sheet.page_count||1)===1?"":"s"}</b><span>Pilih nomor pada gambar lalu tambah sparepart per pcs ke keranjang. Harga dan stok mengikuti control panel; item tanpa override tetap estimasi.</span></div><div class="sheet-layout"><div class="sheet-canvas"><img src="${sheet.full_image||sheet.preview_image}" alt="${esc(sheet.title)} exploded diagram">${markers}</div><div class="sheet-parts"><h3>Orderable spareparts (${visibleParts.length}) <small class="sheet-cart-summary">Sheet cart · ${cartTotal} item</small></h3>${rows||'<p class="sheet-empty">No parsed sparepart rows yet. Use RFQ with source PDF.</p>'}</div></div></div>`);
 window.selectSheetPart=(callout,index)=>{document.querySelectorAll("[data-sheet-marker],[data-sheet-callout]").forEach(el=>el.classList.toggle("active",el.dataset.sheetMarker===callout||el.dataset.sheetCallout===callout));const row=document.querySelector(`[data-sheet-callout="${callout}"]`);row?.scrollIntoView({block:"nearest",behavior:"smooth"})};
 if(sheet.parts[0])window.selectSheetPart(sheet.parts[0].callout,0);
}
async function openExplodedSheet(p){
 const entry=sheetIndex[p.sheetId];
 if(!entry){toast("Diagram unavailable");return}
 let raw=entry.data;
 if(!raw){const response=await fetch(entry.path,{cache:"no-store"});if(!response.ok){toast("Diagram unavailable");return}raw=await response.json()}
 const sheet=applySheetControls(raw);
 renderExplodedSheet(sheet);
}
function quickView(id) {
 const p = products.find(x => x.id === id); if (!p) return;
 if(p.sheetId){openExplodedSheet(p);return}
 const ebl = p.exportPacked ? "Export packed" : "Pre-pack review", ebd = p.exportPacked ? "green" : "amber";
 const availCls = p.stock === "in" ? "green" : p.stock === "low" ? "amber" : "dark";
 const rel = products.filter(r => r.id !== p.id && (r.category === p.category || r.model === p.model || r.engine === p.engine)).slice(0, 4);
 trackRecentView(p.id);
 openModal("Part detail", `<div class="quickd"><div class="quickd-top"><div class="quickd-img" onclick="showImageZoom(${p.id})"><img src="${imgFor(p)}" alt="${esc(p.name)}" style="cursor:zoom-in"><div class="quickd-img-meta"><button class="btn-icon-sm" onclick="event.stopPropagation();showImageZoom(${p.id})" aria-label="Zoom image">${icon("i-search", 15)}</button><button class="btn-icon-sm" onclick="event.stopPropagation();toggleWish(${p.id})" aria-label="Save part">${icon("i-heart", 15)}</button><button class="btn-icon-sm" onclick="event.stopPropagation();toggleCompare(${p.id})" aria-label="Compare">${icon("i-compare", 15)}</button></div></div><div class="quickd-info"><div class="quickd-badges"><span class="pill ${p.grade === "OEM" ? "orange" : "dark"}">${esc(p.grade)}</span><span class="pill ${availCls}">${stockLabel(p)}</span><span class="pill ${ebd}">${ebl}</span></div><h2>${esc(p.name)}</h2><div class="quickd-sku">${esc(p.sku)} <span class="dot">·</span> ${esc(p.origin)} <span class="dot">·</span> HS ${p.hs}</div><div class="quickd-price"><b>${money(priceFor(p))}</b><small>${state.account === "retail" ? "Retail unit price" : state.account === "b2b" ? "B2B unit price" : "Export unit price"}</small></div><div class="quickd-actions"><button class="btn btn-primary quickd-cart" onclick="addCart(${p.id});closeModal()">${icon("i-cart", 15)} Add to order</button><button class="btn btn-light quickd-rfq" onclick="quickdRFQ(${p.id})">${icon("i-file", 15)} Request quotation</button></div></div></div><div class="quickd-tabs"><button class="quickd-tab active" data-tab="spec">${icon("i-info", 13)} Specifications</button><button class="quickd-tab" data-tab="fitment">${icon("i-search", 13)} Fitment</button><button class="quickd-tab" data-tab="commercial">${icon("i-file", 13)} Commercial</button><button class="quickd-tab" data-tab="packing">${icon("i-box", 13)} Packing</button></div><div class="quickd-panels"><div class="quickd-panel active" data-panel="spec"><div class="qspec-grid"><div class="qspec"><span>Part type</span><b>${esc(p.category)}</b></div><div class="qspec"><span>Equipment</span><b>${esc(p.machine)}</b></div><div class="qspec"><span>Engine series</span><b>${esc(p.engine)}</b></div><div class="qspec"><span>Grade</span><b>${esc(p.grade)}</b></div><div class="qspec"><span>Weight</span><b>${p.weight} kg</b></div><div class="qspec"><span>Dimensions</span><b>${p.dims}</b></div></div></div><div class="quickd-panel" data-panel="fitment"><div class="fitment-detail"><div class="fitment-main"><span class="pill orange">Match</span><b>${esc(p.machine)} ${esc(p.model)}</b></div><p>Confirmed for model code <b>${esc(p.model)}</b>. Also listed for <b>${esc(p.alt)}</b> where applicable. Serial range and market variant must be verified before final confirmation.</p><div class="fitment-rows"><div class="fitment-row"><span>Alternate model</span><b>${esc(p.alt)}</b></div><div class="fitment-row"><span>Engine reference</span><b>${esc(p.engine)}</b></div><div class="fitment-row"><span>Confidence</span><span class="pill green">High</span></div></div></div></div><div class="quickd-panel" data-panel="commercial"><div class="qspec-grid"><div class="qspec"><span>Retail</span><b>${money(p.price)}</b></div><div class="qspec"><span>B2B</span><b>${money(p.b2b)}</b></div><div class="qspec"><span>Export</span><b>${money(p.export)}</b></div><div class="qspec"><span>MOQ (${state.account})</span><b>${moqFor(p)} unit(s)</b></div><div class="qspec"><span>Stock</span><b>${stockLabel(p)}</b></div><div class="qspec"><span>Available</span><b>${p.qty} unit(s)</b></div></div><p class="form-note" style="margin-top: 14px">Final pricing, stock, and payment terms are confirmed during quotation review.</p></div><div class="quickd-panel" data-panel="packing"><div class="qspec-grid"><div class="qspec"><span>Pack size</span><b>${p.dims}</b></div><div class="qspec"><span>Weight</span><b>${p.weight} kg</b></div><div class="qspec"><span>Export ready</span><span class="pill ${ebd}">${ebl}</span></div><div class="qspec"><span>HS code</span><b>${p.hs}</b></div><div class="qspec"><span>Lead time</span><b>${p.lead}</b></div><div class="qspec"><span>Origin</span><b>${esc(p.origin)}</b></div></div></div></div>${rel.length ? `<div class="quickd-related"><div class="quickd-related-head"><b>Related parts</b><small>Same category or equipment</small></div><div class="quickd-related-grid">${rel.map(r => `<button class="rel-part" onclick="quickView(${r.id});event.stopPropagation()"><div class="rel-img"><img src="${imgFor(r)}" alt=""></div><div class="rel-info"><b>${esc(r.name)}</b><small>${esc(r.sku)}</small><div>${money(priceFor(r))}</div></div></button>`).join("")}</div></div>` : ""}</div>`); setTimeout(() => { document.querySelectorAll(".quickd-tab").forEach(b => b.onclick = () => { document.querySelectorAll(".quickd-tab").forEach(x => x.classList.remove("active")); b.classList.add("active"); document.querySelectorAll(".quickd-panel").forEach(p => p.style.display = "none"); const panel = document.querySelector(`.quickd-panel[data-panel="${b.dataset.tab}"]`); if (panel) { panel.classList.add("active"); panel.style.display = ""; } }); }, 50);
}
function quickdRFQ(id) {
 const p = products.find(x => x.id === id); if (!p) return;
 closeModal(); openDrawer();
 setTimeout(() => { const ta = document.querySelector("#destCountry"); if (ta) ta.value = p.name; document.querySelector("#buyerRef")?.focus(); }, 200);
}
function toggleWish(id){state.wishlist.has(id)?state.wishlist.delete(id):state.wishlist.add(id);save("kpx_wishlist",[...state.wishlist]);renderProducts();toast(state.wishlist.has(id)?"Saved to wishlist":"Removed from wishlist")}
function toggleCompare(id){if(state.compare.has(id))state.compare.delete(id);else{if(state.compare.size>=4){toast("Comparison limit","You can compare up to 4 parts.");return}state.compare.add(id)}save("kpx_compare",[...state.compare]);renderProducts()}

function trackRecentView(id){
 const key='hikari_recent';let arr=[];
 try{arr=JSON.parse(localStorage.getItem(key))||[]}catch(e){}
 arr=arr.filter(x=>x!==id);arr.unshift(id);if(arr.length>12)arr=arr.slice(0,12);
 try{localStorage.setItem(key,JSON.stringify(arr))}catch(e){}
 renderRecentView();
}
function renderRecentView(){
 const nodes=document.querySelectorAll('.recent-view');if(!nodes.length)return;
 const key='hikari_recent';let ids=[];
 try{ids=JSON.parse(localStorage.getItem(key))||[]}catch(e){}
 if(!ids.length){nodes.forEach(el=>el.style.display='none');return}
 const items=ids.map(id=>products.find(p=>p.id===id)).filter(Boolean).slice(0,6);
 const html='<div class="recent-head"><b>Recently viewed</b><small>'+items.length+' part(s)</small></div><div class="recent-grid">'+items.map(p=>'<button class="rel-part" onclick="quickView('+p.id+');event.stopPropagation()"><div class="rel-img"><img src="'+imgFor(p)+'" alt=""></div><div class="rel-info"><b>'+esc(p.name)+'</b><small>'+esc(p.sku)+'</small><div>'+money(priceFor(p))+'</div></div></button>').join('')+'</div>';
 nodes.forEach(el=>{el.style.display='block';el.innerHTML=html});
}
function renderActionStrips(){
 const saved=document.getElementById('savedViewTop'), compared=document.getElementById('compareViewTop');
 if(compared){compared.style.display='none';compared.innerHTML=''}
 if(saved){
  const items=[...state.wishlist].map(id=>products.find(p=>p.id===id)).filter(Boolean).slice(0,6);
  const comp=[...state.compare].map(id=>products.find(p=>p.id===id)).filter(Boolean).slice(0,4);
  const has=items.length||comp.length;
  saved.style.display=has?'block':'none';
  saved.innerHTML=has?'<div class="strip-head"><b>Saved & compare</b><span><button onclick="showWishlist()">Saved '+items.length+'</button><button onclick="showCompare()">Compare '+comp.length+'</button></span></div><div class="strip-scroll">'+items.map(p=>'<button class="mini-part" onclick="quickView('+p.id+')"><img src="'+imgFor(p)+'" alt=""><span><b>'+esc(p.name)+'</b><small>Saved · '+esc(p.sku)+'</small></span></button>').join('')+comp.map(p=>'<button class="mini-part mini-compare" onclick="quickView('+p.id+')"><img src="'+imgFor(p)+'" alt=""><span><b>'+esc(p.name)+'</b><small>Compare · '+money(priceFor(p))+'</small></span></button>').join('')+'</div>':'';
 }
}
function showImageZoom(id){
 const p=products.find(x=>x.id===id);if(!p)return;
 openModal(p.name+' — Image','<div style="text-align:center"><img src="'+imgFor(p)+'" style="max-width:100%;max-height:75vh;border-radius:10px;object-fit:contain" alt="'+esc(p.name)+'"><p style="font-size:10px;color:var(--muted);margin-top:10px">'+esc(p.name)+' — '+esc(p.sku)+'</p></div>');
}
function showCompare(){
 const arr=[...state.compare].map(id=>products.find(p=>p.id===id)).filter(Boolean);
 if(!arr.length){toast("No comparison items","Use the compare icon on a product card.");return}
 openModal("Compare parts",`<div class="compare-modal"><div class="compare-mobile-cards">${arr.map(p=>`<article class="compare-card"><img src="${imgFor(p)}" alt=""><div><b>${esc(p.name)}</b><small>${esc(p.sku)}</small></div><dl><dt>Price</dt><dd>${money(priceFor(p))}</dd><dt>MOQ</dt><dd>${moqFor(p)}</dd><dt>Stock</dt><dd>${stockLabel(p)}</dd><dt>Fitment</dt><dd>${esc(p.machine)} ${esc(p.model)}</dd></dl><button class="btn btn-primary btn-sm" onclick="addCart(${p.id})">Add to RFQ</button></article>`).join("")}</div><div class="compare-table-wrap"><table class="compare-table"><thead><tr><th>Attribute</th>${arr.map(p=>`<th>${esc(p.name)}<br><small>${esc(p.sku)}</small></th>`).join("")}</tr></thead><tbody>
 <tr><td>Image</td>${arr.map(p=>`<td><img src="${imgFor(p)}" style="width:150px;height:90px;object-fit:cover;border-radius:7px"></td>`).join("")}</tr>
 <tr><td>Price</td>${arr.map(p=>`<td><b>${money(priceFor(p))}</b></td>`).join("")}</tr><tr><td>Grade</td>${arr.map(p=>`<td>${p.grade}</td>`).join("")}</tr><tr><td>Fitment</td>${arr.map(p=>`<td>${p.machine} ${p.model}<br>${p.engine}</td>`).join("")}</tr><tr><td>Stock</td>${arr.map(p=>`<td>${stockLabel(p)}</td>`).join("")}</tr><tr><td>Weight</td>${arr.map(p=>`<td>${p.weight} kg</td>`).join("")}</tr><tr><td>MOQ</td>${arr.map(p=>`<td>${moqFor(p)} (${state.account.slice(0,1).toUpperCase()+state.account.slice(1)})</td>`).join("")}</tr></tbody></table></div><button class="btn btn-primary btn-block compare-rfq" onclick="addComparedToCart()">Add compared parts to RFQ</button></div>`);
}
function showWishlist(){
 const arr=[...state.wishlist].map(id=>products.find(p=>p.id===id)).filter(Boolean);
 openModal("Saved parts",arr.length?`<div class="saved-modal"><div class="saved-list">${arr.map(p=>`<button class="saved-row" onclick="quickView(${p.id})"><img src="${imgFor(p)}" alt=""><span><b>${esc(p.name)}</b><small>${esc(p.sku)} · ${money(priceFor(p))}</small></span><em>${stockLabel(p)}</em></button>`).join("")}</div><button class="btn btn-primary btn-block" onclick="addSavedToCart()">Add saved parts to RFQ</button></div>`:`<p>No saved products yet.</p>`);
}
function addSavedToCart(){[...state.wishlist].forEach(addCart);renderCart();toast("Saved parts added","Wishlist moved into RFQ list")}
function addComparedToCart(){[...state.compare].forEach(addCart);renderCart();toast("Compared parts added","Compare queue moved into RFQ list")}
function resetAll(){
 state.query="";state.category.clear();state.machine.clear();state.stock.clear();state.grade.clear();state.minPrice=null;state.maxPrice=null;state.page=1;
 catalogSearch.value="";document.querySelectorAll(".filters input[type=checkbox]").forEach(x=>x.checked=false);minPrice.value="";maxPrice.value="";renderProducts()
}
window.resetAll=resetAll;window.addCart=addCart;window.addPartToCart=addPartToCart;window.closeModal=closeModal;window.toggleWish=toggleWish;
function closeMobileFilters(){filtersPanel.classList.remove("mobile-open");filtersPanel.style.setProperty("transform","translateY(108%)","important");filtersPanel.style.setProperty("pointer-events","none","important");if(!cartDrawer.classList.contains("open"))drawerBackdrop.classList.remove("open");document.body.style.overflow=""}
function openMobileFilters(){filtersPanel.classList.add("mobile-open");filtersPanel.style.setProperty("transform","translateY(0)","important");filtersPanel.style.setProperty("pointer-events","auto","important");drawerBackdrop.classList.add("open");document.body.style.overflow="hidden";updateFilterUi()}
function updateGarageModel(){const fam=garageFamily.value;garageModel.innerHTML=familyModels[fam].map(x=>`<option>${x}</option>`).join("")}
function renderGarage(){
 const garageBox=document.querySelector(".garage");
 garageBox.classList.toggle("has-items",state.garage.length>0);
 garageItems.innerHTML=state.garage.map((g,i)=>`<button class="machine-chip" data-garage="${i}"><span class="machine-icon">${icon("i-truck",17)}</span><span><b>${esc(g.family)} ${esc(g.model)}</b><small>Use as fitment shortcut</small></span></button>`).join("");
 garageCount.textContent=`${state.garage.length} saved`;
}
const exportPanels={
 process:`<div class="route"><div class="route-node"><div class="route-icon">${icon("i-search",16)}</div><b>Part match</b><small>Fitment check</small></div><div class="route-node"><div class="route-icon">${icon("i-file",16)}</div><b>Proforma</b><small>Price validity</small></div><div class="route-node"><div class="route-icon">${icon("i-box",16)}</div><b>Packing</b><small>Weight & volume</small></div><div class="route-node"><div class="route-icon">${icon("i-truck",16)}</div><b>Dispatch</b><small>Air / sea / courier</small></div><div class="route-node"><div class="route-icon">${icon("i-globe",16)}</div><b>Delivery</b><small>Destination support</small></div></div><table class="incoterm-table"><thead><tr><th>Step</th><th>Seller scope</th><th>Best for</th><th>Status</th></tr></thead><tbody><tr><td><b>Match</b></td><td>Model, engine and serial checked</td><td>Wrong-part prevention</td><td><span class="pill green">Required</span></td></tr><tr><td><b>Quote</b></td><td>Price, MOQ and validity issued</td><td>B2B approval</td><td><span class="pill amber">Manual</span></td></tr><tr><td><b>Pack</b></td><td>Carton weight and volume recorded</td><td>Freight quote</td><td><span class="pill dark">Ops</span></td></tr></tbody></table>`,
 incoterm:`<table class="incoterm-table"><thead><tr><th>Term</th><th>Seller scope</th><th>Best for</th><th>Quote status</th></tr></thead><tbody><tr><td><b>EXW Jakarta</b></td><td>Goods packed at warehouse</td><td>Buyer-appointed forwarder</td><td><span class="pill green">Instant base</span></td></tr><tr><td><b>FOB Tanjung Priok</b></td><td>Export clearance + port delivery</td><td>Sea freight consolidation</td><td><span class="pill amber">Manual freight</span></td></tr><tr><td><b>CIF Main Port</b></td><td>Ocean freight + insurance</td><td>Distributor replenishment</td><td><span class="pill amber">Rate request</span></td></tr><tr><td><b>DAP / DDP</b></td><td>Door delivery; duty depends on term</td><td>Workshop / retail buyer</td><td><span class="pill dark">Compliance review</span></td></tr></tbody></table>`,
 documents:`<table class="incoterm-table"><thead><tr><th>Document</th><th>Purpose</th><th>Needed for</th><th>Status</th></tr></thead><tbody><tr><td><b>Proforma invoice</b></td><td>Price, validity, payment reference</td><td>Buyer approval</td><td><span class="pill green">Included</span></td></tr><tr><td><b>Packing list</b></td><td>Carton count, gross/net weight</td><td>Freight & customs</td><td><span class="pill amber">After pack</span></td></tr><tr><td><b>HS / origin</b></td><td>Classification and origin fields</td><td>Import clearance</td><td><span class="pill dark">Verify</span></td></tr></tbody></table>`,
 consolidation:`<table class="incoterm-table"><thead><tr><th>Mode</th><th>How it works</th><th>Best for</th><th>Status</th></tr></thead><tbody><tr><td><b>Mixed carton</b></td><td>Many small SKUs packed together</td><td>Service kits</td><td><span class="pill green">Fast</span></td></tr><tr><td><b>Pallet build</b></td><td>Cartons grouped for sea freight</td><td>Distributor restock</td><td><span class="pill amber">Quoted</span></td></tr><tr><td><b>Split shipment</b></td><td>Ready stock ships first</td><td>Urgent repair</td><td><span class="pill dark">Manual</span></td></tr></tbody></table>`
};
function renderExportPanel(tab="process"){
 const content=document.getElementById("exportContent");
 if(!content)return;
 state.exportTab=tab;
 content.innerHTML=exportPanels[tab]||exportPanels.process;
 document.querySelectorAll("[data-export-tab]").forEach(b=>b.classList.toggle("active",b.dataset.exportTab===tab));
 translateStatic(content);
}
function syncMobileQuicknav(forcedId){
 const links=[...document.querySelectorAll(".mobile-quicknav a")];
 if(!links.length)return;
 const sections=links.map(a=>document.querySelector(a.getAttribute("href"))).filter(Boolean);
 const y=scrollY+110;
 let active=forcedId||sections[0]?.id;
 if(!forcedId)sections.forEach(s=>{if(s.offsetTop<=y)active=s.id});
 links.forEach(a=>a.classList.toggle("active",a.getAttribute("href")===`#${active}`));
 const current=links.find(a=>a.classList.contains("active"));
 current?.scrollIntoView({block:"nearest",inline:"center"});
}
function bindCategoryFilters(){
 document.querySelectorAll(".filters input[name=category]").forEach(el=>el.onchange=()=>{state.category=new Set([...document.querySelectorAll('input[name=category]:checked')].map(x=>x.value));state.page=1;renderProducts()});
}
function bind(){
 document.querySelectorAll("[data-search-mode]").forEach(b=>b.onclick=()=>{document.querySelectorAll("[data-search-mode]").forEach(x=>x.classList.remove("active"));b.classList.add("active");heroSearch.placeholder=t(b.dataset.searchMode==="part"?"Try: oil filter, V2403, HIK-FLT-00018":b.dataset.searchMode==="model"?"Try: L4508, M7040, U50-5": "Try: D1105, V2403, V3800")});
 const doHeroSearch=()=>{state.query=heroSearch.value.trim();catalogSearch.value=state.query;state.page=1;renderProducts();document.querySelector("#catalog").scrollIntoView({behavior:"smooth"})};
 heroSearchBtn.onclick=doHeroSearch;heroSearch.onkeydown=e=>{if(e.key==="Enter")doHeroSearch()};browseBtn.onclick=()=>document.querySelector("#catalog").scrollIntoView({behavior:"smooth"});
 uploadListBtn.onclick=()=>openModal("Bulk parts-list upload",`<div style="max-width:670px"><h2>Upload CSV / XLSX / PDF parts list</h2><p style="color:var(--muted)">Upload purchase lists with SKU, description, quantity, model and notes for quotation review. Files should be validated before processing.</p><div style="border:2px dashed #cfd5d8;border-radius:12px;padding:55px;text-align:center;background:#f7f8f9">${icon("i-file",34)}<h3>Parts list upload</h3><small>SKU · description · quantity · model · notes</small></div></div>`);
 categoryStrip.onclick=e=>{const b=e.target.closest("[data-model]");if(!b)return;resetAll();state.selectedModel=b.dataset.model;state.query="";catalogSearch.value="";state.page=1;renderCategories();renderProducts();document.querySelector("#catalog").scrollIntoView({behavior:"smooth"})};
 document.querySelectorAll(".filters input").forEach(el=>el.addEventListener("change",()=>{state.category=new Set([...document.querySelectorAll('input[name=category]:checked')].map(x=>x.value));state.machine=new Set([...document.querySelectorAll('input[name=machine]:checked')].map(x=>x.value));state.stock=new Set([...document.querySelectorAll('input[name=stock]:checked')].map(x=>x.value));state.grade=new Set([...document.querySelectorAll('input[name=grade]:checked')].map(x=>x.value));state.minPrice=minPrice.value?Number(minPrice.value):null;state.maxPrice=maxPrice.value?Number(maxPrice.value):null;state.page=1;renderProducts()}));
 resetFilters.onclick=resetAll;catalogSearch.oninput=()=>{state.query=catalogSearch.value;state.page=1;renderProducts();searchSuggest(catalogSearch.value)};catalogSearch.onkeydown=e=>{if(e.key==="Escape"||e.key==="Tab")document.getElementById("catalogSuggestions")?.classList.remove("open")};catalogSearch.onblur=()=>setTimeout(()=>document.getElementById("catalogSuggestions")?.classList.remove("open"),200);document.getElementById("catalogSuggestions").onclick=e=>{const s=e.target.closest("[data-sku]");if(s){catalogSearch.value=s.dataset.sku;state.query=s.dataset.sku;state.page=1;renderProducts();document.getElementById("catalogSuggestions").classList.remove("open")}};sortSelect.onchange=()=>{state.sort=sortSelect.value;state.page=1;renderProducts()};
 accountSelect.onchange=()=>{state.account=accountSelect.value;buyerProfile.value=state.account==="export"?"b2b":state.account;renderProducts();renderCart()};
 buyerProfile.onchange=()=>{state.account=buyerProfile.value==="retail"?"retail":"b2b";accountSelect.value=state.account;renderProducts();renderCart()};
 currencySelect.onchange=()=>{state.currency=currencySelect.value;renderProducts();renderCart()};
 languageSelect.onchange=()=>{state.lang=languageSelect.value;save("hikari_lang",state.lang);renderCategories();renderProducts();renderCart();renderGarage();buildFAQs();renderExportPanel(state.exportTab||"process");translateStatic()};
 gridView.onclick=()=>{state.view="grid";gridView.classList.add("active");listView.classList.remove("active");renderProducts()};listView.onclick=()=>{state.view="list";listView.classList.add("active");gridView.classList.remove("active");renderProducts()};
 productGrid.onclick=e=>{const b=e.target.closest("[data-action]");if(!b)return;const id=b.dataset.id;({add:addCart,quick:quickView,wish:toggleWish,compare:toggleCompare})[b.dataset.action]?.(id)};
 const handlePagination=e=>{const b=e.target.closest("[data-page]");if(!b||b.disabled)return;state.page=Number(b.dataset.page);renderProducts();document.querySelector("#catalog").scrollIntoView({behavior:"smooth",block:"start"})};
 pagination.onclick=handlePagination;paginationTop.onclick=handlePagination;
 cartBtn.onclick=openDrawer;drawerClose.onclick=closeDrawer;drawerBackdrop.onclick=()=>{closeDrawer();closeMobileFilters()};
 cartItems.onclick=e=>{const b=e.target.closest("[data-cart]");if(!b)return;const id=b.dataset.id,item=state.cart.find(x=>String(x.id)===id);if(!item)return;if(b.dataset.cart==="plus")item.qty++;if(b.dataset.cart==="minus")item.qty=Math.max(1,item.qty-1);if(b.dataset.cart==="remove")state.cart=state.cart.filter(x=>String(x.id)!==id);save("kpx_cart",state.cart);renderCart();updateCounts()};
 checkoutBtn.onclick=async()=>{
  if(!state.cart.length){toast("Order list is empty");return}
  const items=state.cart.map(ci=>({ci,line:cartLine(ci)})).filter(x=>x.line);
  const subtotal=items.reduce((s,{ci,line})=>s+line.price*ci.qty,0);
  const dest=destCountry.value.trim()||"—";
  const term=incoterm.value;
  const shipping=shippingMethod.value;
  const ref=buyerRef.value.trim()||"—";
  let refNo="";
  const mode=state.account==="retail"?"Retail / Workshop":state.account==="b2b"?"B2B Distributor":"Export";
  const buyerName=rfqBuyerName.value.trim(),buyerEmail=rfqBuyerEmail.value.trim(),buyerPhone=rfqBuyerPhone.value.trim();
  if(!buyerName||!destCountry.value.trim()){toast("Buyer and destination required","Complete the RFQ contact fields before submitting.");return}
  const orderLines=items.map(({ci,line})=>({partId:line.partId,quantity:ci.qty}));
  if(orderLines.some(item=>!item.partId)){toast("Catalog refresh required","Reload the storefront so every cart line is linked to a published sparepart.");return}
  checkoutBtn.disabled=true;checkoutBtn.textContent="Submitting RFQ…";
  try{
   const response=await fetch(catalogApi("/api/public-orders"),{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({buyerName,buyerEmail,buyerPhone,destination:dest,incoterm:term,shippingMethod:shipping,buyerReference:ref,accountType:state.account,items:orderLines})});
   const result=await response.json().catch(()=>({}));
   if(!response.ok)throw new Error(result.error||"RFQ submission failed");
   refNo=result.data.reference;state.cart=[];save("kpx_cart",state.cart);updateCounts();renderCart();
  }catch(error){toast("RFQ not submitted",error instanceof Error?error.message:"Please retry shortly.");return}
  finally{checkoutBtn.disabled=false;checkoutBtn.textContent="Generate quotation"}
  closeDrawer();
  openModal("Quotation request prepared",`<div style="max-width:620px;margin:auto"><div style="text-align:center;margin-bottom:16px">${icon("i-check",42)}</div><h2 style="margin:0 0 4px">Quotation draft ready</h2><p style="color:var(--muted);font-size:11px;margin:0 0 18px">Reference <b>${refNo}</b> · ${mode} pricing</p><div class="rfq-confirm-grid"><div class="rfq-confirm-block"><span>Destination</span><b>${esc(dest)}</b></div><div class="rfq-confirm-block"><span>Trade term</span><b>${esc(term)}</b></div><div class="rfq-confirm-block"><span>Shipping</span><b>${esc(shipping)}</b></div><div class="rfq-confirm-block"><span>Reference</span><b>${esc(ref)}</b></div></div><div class="rfq-items-summary"><div class="rfq-sum-head">Items (${items.length})</div><div style="display:grid;gap:5px;margin-top:8px">${items.slice(0,6).map(({ci,line})=>`<div class="rfq-item-row"><span><b>${esc(line.name)}</b><small>${esc(line.sku)} · ${esc(line.meta)}</small></span><span>${ci.qty} × ${money(line.price)}</span></div>`).join("")}${items.length>6?`<div class="rfq-item-row"><span><b>+${items.length-6} more items</b></span></div>`:""}</div></div><div class="rfq-total-bar"><span>Estimated quotation base</span><b>${money(subtotal+Math.max(12,subtotal*.018))}</b></div><p class="form-note" style="margin-top:12px;text-align:center">Freight, duty, and final pricing confirmed during quotation review.</p><button class="btn btn-primary btn-block" onclick="closeModal()" style="margin-top:14px">Done</button></div>`);
 }
 rfqBuyerName.oninput=saveRfqForm;rfqBuyerEmail.oninput=saveRfqForm;rfqBuyerPhone.oninput=saveRfqForm;
 destCountry.oninput=()=>{updateRfqChecklist();collectRfqSummary();saveRfqForm()};
  incoterm.onchange=()=>{updateRfqChecklist();collectRfqSummary();saveRfqForm()};
  shippingMethod.onchange=()=>{collectRfqSummary();saveRfqForm()};
  buyerRef.oninput=saveRfqForm;
  wishlistBtn.onclick=showWishlist;compareBtn.onclick=showCompare;
 modalClose.onclick=closeModal;modalBackdrop.onclick=e=>{if(e.target===modalBackdrop)closeModal()};document.addEventListener("keydown",e=>{if(e.key==="Escape"){closeModal();closeDrawer()}});
 garageFamily.onchange=updateGarageModel;saveMachineBtn.onclick=()=>{const g={family:garageFamily.value,model:garageModel.value};if(!state.garage.some(x=>x.family===g.family&&x.model===g.model)){state.garage.push(g);save("kpx_garage",state.garage);renderGarage();toast("Machine saved",`${g.family} ${g.model}`)}};
 garageItems.onclick=e=>{const b=e.target.closest("[data-garage]");if(!b)return;const g=state.garage[Number(b.dataset.garage)];state.query=g.model;catalogSearch.value=g.model;renderProducts();document.querySelector("#catalog").scrollIntoView({behavior:"smooth"})};
 document.querySelectorAll("[data-export-tab]").forEach(b=>b.onclick=()=>renderExportPanel(b.dataset.exportTab));
 document.querySelectorAll(".mobile-quicknav a").forEach(a=>a.onclick=()=>syncMobileQuicknav(a.getAttribute("href").slice(1)));
 addEventListener("scroll",()=>syncMobileQuicknav(),{passive:true});addEventListener("hashchange",()=>syncMobileQuicknav(location.hash.slice(1)));
 document.querySelectorAll(".faq-q").forEach(b=>b.onclick=()=>b.parentElement.classList.toggle("open"));
 contactForm.onsubmit=async e=>{
  e.preventDefault();const fd=new FormData(contactForm),button=contactForm.querySelector('button[type="submit"]');button.disabled=true;button.textContent="Submitting RFQ…";
  try{const response=await fetch(catalogApi("/api/public-orders"),{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({buyerName:fd.get("name"),buyerEmail:fd.get("email"),destination:fd.get("country"),accountType:String(fd.get("type")||"").toLowerCase().includes("b2b")?"b2b":"retail",message:fd.get("message"),items:[]})});const result=await response.json().catch(()=>({}));if(!response.ok)throw new Error(result.error||"RFQ submission failed");openModal("Quotation request submitted",`<h2>Thank you, ${esc(fd.get("name"))}</h2><p>Your enquiry for <b>${esc(fd.get("country"))}</b> has been recorded for quotation review.</p><div class="spec"><span>Reference</span><b>${esc(result.data.reference)}</b></div>`);contactForm.reset()}catch(error){toast("RFQ not submitted",error instanceof Error?error.message:"Please retry shortly.")}finally{button.disabled=false;button.textContent="Create RFQ"}
 };
 downloadSampleBtn.onclick=downloadCSV;
 securityBtn.onclick=securityFooterBtn.onclick=e=>{e.preventDefault();showSecurity()};
 creditsBtn.onclick=e=>{e.preventDefault();showCredits()};
 clearDataBtn.onclick=e=>{e.preventDefault();["kpx_cart","kpx_wishlist","kpx_compare","kpx_garage"].forEach(k=>localStorage.removeItem(k));location.reload()};
 mobileFilterBtn.onclick=openMobileFilters;mobileFilterClose.onclick=closeMobileFilters;filterApplyBtn.onclick=closeMobileFilters;filterResetMobileBtn.onclick=()=>{resetAll();closeMobileFilters()};
 dismissCatalogNotice.onclick=()=>catalogBanner.remove();
 filterTags.onclick=e=>{const b=e.target.closest("[data-tag-remove]");if(b)removeTag(Number(b.dataset.tagRemove));};
 waFloat.onclick=openWhatsApp;
 syncMobileQuicknav(location.hash.slice(1)||"catalog");
}
function downloadCSV(){
 const rows=[["part_number","description","quantity","tractor_model","buyer_note"]];
 const blob=new Blob([rows.map(r=>r.join(",")).join("\n")],{type:"text/csv"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="Hikari_bulk_order_template.csv";a.click();URL.revokeObjectURL(a.href)
}
function showSecurity(){
 openModal("Trade compliance and platform security",`<div style="max-width:820px"><h2>Operational safeguards</h2><p>Export quotations should be validated through secure account, pricing, stock, freight and documentation workflows before invoice issuance.</p>
 <div class="spec-grid"><div class="spec"><span>Identity</span><b>Passkeys / MFA, secure sessions, role-based access</b></div><div class="spec"><span>Catalog</span><b>Server-side validation, versioned price lists, audit history</b></div><div class="spec"><span>Payments</span><b>Hosted provider fields; never store raw card data</b></div><div class="spec"><span>Uploads</span><b>Signed URLs, malware scanning, file limits, quarantine</b></div><div class="spec"><span>APIs</span><b>Rate limits, CSRF protection, schema validation, idempotency</b></div><div class="spec"><span>Operations</span><b>Backups, alerts, WAF/CDN, secrets manager, log retention</b></div></div>
 <h3>Recommended service boundaries</h3><p>Catalog/Search · Pricing & Contracts · Inventory · Cart/RFQ · Order Management · Freight Quotes · Documents · Customer Accounts · CMS/PIM · Analytics. Keep price calculation, stock reservation, customs fields and payment confirmation server-authoritative.</p>
 <h3>Large-catalog strategy</h3><p>Use a PIM or normalized product database, object storage plus image CDN, background image processing, faceted search index, cursor pagination, cached model-fitment tables and event-driven synchronization with ERP/WMS.</p></div>`);
}
function showCredits(){
 openModal("Media attribution",`<p>Image sources and license notes for catalog media review.</p><table class="compare-table"><tr><th>Image</th><th>Source / license</th></tr>
 <tr><td>Kubota tractor 7, C and D</td><td>Love Krittaya · Wikimedia Commons · released to the public domain.</td></tr>
 <tr><td>Kubota engine at Agritechnica 2023</td><td>Matti Blume · Wikimedia Commons · CC BY-SA.</td></tr>
 <tr><td>Piston and cylinder-head images</td><td>Dana60Cummins · Wikimedia Commons · CC BY-SA 3.0.</td></tr></table>
 <p style="font-size:10px;color:var(--muted)">Review each source license and intended commercial use before publishing.</p>`);
}
function buildFAQs(){
 const qs=[
 ["Are the prices final export prices?","No. Final export pricing is confirmed after stock, freight, destination tax, duty, banking fees and destination-specific compliance costs are reviewed."],
 ["Can retail and B2B customers use the same catalog?","Yes. The same product records can expose different price tiers, MOQ rules, credit terms and quotation workflows based on the authenticated customer account."],
 ["How should fitment be confirmed?","Use equipment family, exact model, engine code, serial range, market variant and superseded part numbers. High-risk assemblies should require manual approval before shipment."],
 ["Can large product catalogs be managed at scale?","Yes. A production catalog should use a database, search index, PIM, image CDN and server-side APIs for reliable inventory and pricing operations."],
 ["How are export documents handled?","The system should generate controlled commercial documents from validated order, packing, country-of-origin and classification data. HS codes and regulatory requirements need professional review."],
 ["Is Hikari Tractors affiliated with OEM brands?","Hikari Tractors Indonesia is an independent supplier. Brand names and trademarks belong to their respective owners."]
 ];
 faqList.innerHTML=qs.map((q,i)=>`<div class="faq-item ${i===0?"open":""}"><button class="faq-q">${esc(q[0])}${icon("i-plus",15)}</button><div class="faq-a">${esc(q[1])}</div></div>`).join("");
}
if(matchMedia("(max-width:560px)").matches)state.view="list";
setImages();buildFAQs();updateGarageModel();renderGarage();renderCart();loadRfqForm();bind();loadDriveCatalog();
setInterval(refreshCatalogControl,10000);
gridView.classList.toggle("active",state.view==="grid");listView.classList.toggle("active",state.view==="list");
translateStatic();
