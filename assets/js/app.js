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
  page:1, perPage:24, query:"", category:new Set(), machine:new Set(), stock:new Set(), grade:new Set(),
  minPrice:null,maxPrice:null,sort:"featured",account:"retail",currency:"USD",view:"grid",
  cart:load("kpx_cart",[]), wishlist:new Set(load("kpx_wishlist",[])), compare:new Set(load("kpx_compare",[])),
  garage:load("kpx_garage",[{family:"Tractor",model:"L4508"},{family:"Engine",model:"V2403"}])
};
const rates={USD:1,IDR:16300,EUR:.92,SGD:1.35,AUD:1.52};
const symbols={USD:"$",IDR:"Rp ",EUR:"€",SGD:"S$",AUD:"A$"};
const categories=[
 {name:"Filters",icon:"i-filter",count:146},{name:"Engine",icon:"i-box",count:212},{name:"Fuel System",icon:"i-globe",count:94},
 {name:"Hydraulic",icon:"i-truck",count:108},{name:"Electrical",icon:"i-shield",count:126},{name:"Cooling",icon:"i-info",count:87},
 {name:"Transmission",icon:"i-compare",count:101},{name:"Gaskets & Seals",icon:"i-grid",count:164},{name:"Bearings",icon:"i-plus",count:73},
 {name:"Undercarriage",icon:"i-truck",count:52},{name:"Body & Cabin",icon:"i-user",count:37},{name:"Maintenance Kits",icon:"i-check",count:80}
];
const familyModels={
 Tractor:["L4508","L5018","M7040","M9540","B2420","B2441","MU4501","MX5100","L2501","M5000SU"],
 Excavator:["U15-3","U30-6","U50-5","KX040-4","KX057-5","KX080-4","K008-5"],
 Engine:["D722","D902","D1105","V1505","V2203","V2403","V2607","V3307","V3800"],
 Combine:["DC-70","DC-93","PRO588i-G","PRO688Q","ER470","ER460"],
 RTV:["RTV-X900","RTV-X1100","RTV400","RTV520"]
};
const nameParts={
 "Filters":["Engine Oil Filter","Hydraulic Return Filter","Fuel Filter Element","Primary Air Cleaner","Secondary Air Element","Transmission Strainer","Water Separator Element","Cabin Dust Filter"],
 "Engine":["Piston & Pin Set","Cylinder Liner Kit","Connecting Rod","Crankshaft Bearing Set","Rocker Arm Assembly","Camshaft Gear","Oil Pump Assembly","Engine Overhaul Kit"],
 "Fuel System":["Injector Nozzle","Fuel Feed Pump","Injection Pump Seal Kit","Common Rail Sensor","Fuel Shutoff Solenoid","High Pressure Pipe","Water Separator Bowl"],
 "Hydraulic":["Hydraulic Pump","Control Valve Seal Kit","Lift Cylinder Seal Set","Hydraulic Hose Assembly","Relief Valve","Steering Cylinder End","Quick Coupler"],
 "Electrical":["Starter Motor","Alternator Assembly","Glow Plug","Oil Pressure Switch","Temperature Sensor","Wiring Harness","Ignition Switch","Work Lamp"],
 "Cooling":["Radiator Core","Water Pump","Thermostat","Cooling Fan","Radiator Hose Set","Fan Belt","Expansion Tank Cap"],
 "Transmission":["Clutch Disc","Release Bearing","PTO Gear","Synchro Ring","Differential Gear Set","Transmission Seal Kit","Propeller Shaft Joint"],
 "Gaskets & Seals":["Full Gasket Set","Cylinder Head Gasket","Rear Main Oil Seal","Valve Cover Gasket","O-Ring Service Pack","Front Crank Seal","Injector Seal Washer"],
 "Bearings":["Main Bearing Set","Thrust Bearing","Wheel Hub Bearing","PTO Shaft Bearing","Needle Bearing","Pilot Bearing"],
 "Undercarriage":["Track Roller","Carrier Roller","Drive Sprocket","Idler Assembly","Rubber Track Pad","Track Tension Seal Kit"],
 "Body & Cabin":["Seat Cushion","Bonnet Latch","Door Gas Strut","Mirror Assembly","Instrument Panel Lens","Floor Mat","Fender Lamp"],
 "Maintenance Kits":["250-Hour Service Kit","500-Hour Service Kit","1,000-Hour Service Kit","Seasonal Filter Bundle","Fleet Preventive Kit","Engine Tune-Up Pack"]
};
const imageKeys=["engine","piston","head","tractor","fleet","hero"];
const grades=["OEM","OEM","OEM","Aftermarket","Aftermarket","Reman"];
function hash(n){let x=Math.sin(n*999.17)*10000;return x-Math.floor(x)}
function makeProducts(count=1200){
 const arr=[]; const cats=categories.map(x=>x.name); const machines=Object.keys(familyModels);
 for(let i=1;i<=count;i++){
   const c=cats[i%cats.length], names=nameParts[c], machine=machines[(i*7)%machines.length], models=familyModels[machine];
   const model=models[(i*13)%models.length], alt=models[(i*19+2)%models.length];
   const base=Math.round((8+hash(i)*560+(c==="Engine"?180:0)+(c==="Undercarriage"?130:0))*100)/100;
   const stockVal=i%11===0?"out":i%7===0?"low":"in";
   const qty=stockVal==="in"?Math.floor(8+hash(i+3)*160):stockVal==="low"?Math.floor(1+hash(i+5)*7):0;
   const grade=grades[i%grades.length];
   const prefix=c.split(/[\s&]/).filter(Boolean).map(s=>s[0]).join("").slice(0,3).toUpperCase();
   arr.push({
     id:i,sku:`KPX-${prefix}-${String(i).padStart(5,"0")}`,name:names[i%names.length],category:c,machine,model,alt,
     engine:["D722","D1105","V1505","V2203","V2403","V3307","V3800"][(i*5)%7],
     grade,origin:i%5===0?"Japan":i%3===0?"Thailand":"Indonesia",
     price:base,b2b:base*.91,export:base*.87,moq:grade==="OEM"?1:(i%5+2),stock:stockVal,qty,
     weight:Math.round((.12+hash(i+7)*18)*100)/100,
     dims:`${Math.round(10+hash(i+8)*42)}×${Math.round(8+hash(i+9)*34)}×${Math.round(5+hash(i+10)*30)} cm`,
     hs:`84${String(10+(i%89)).padStart(2,"0")}.${String(i%100).padStart(2,"0")}`,
     lead:stockVal==="in"?"1–3 business days":stockVal==="low"?"3–7 business days":"14–30 business days",
     img:imageKeys[i%imageKeys.length],exportPacked:i%4!==0,featured:(i%17===0||i<15)
   });
 }
 return arr;
}
const products=makeProducts();
function load(k,f){try{return JSON.parse(localStorage.getItem(k))??f}catch{return f}}
function save(k,v){localStorage.setItem(k,JSON.stringify(v))}
function esc(s){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
function money(v){const rate=rates[state.currency], val=v*rate;return symbols[state.currency]+(state.currency==="IDR"?Math.round(val).toLocaleString("en-US"):val.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2}))}
function icon(id,size=17){return `<svg width="${size}" height="${size}"><use href="#${id}"/></svg>`}
function toast(title,msg=""){const el=document.createElement("div");el.className="toast";el.innerHTML=`<b>${esc(title)}</b>${esc(msg)}`;document.querySelector("#toastStack").appendChild(el);setTimeout(()=>el.remove(),3200)}
function setImages(){
 heroImage.src=IMG.hero; heroImage.fetchPriority="high"; modelImage.src=IMG.tractor; modelImage.loading="lazy"; engineImage.src=IMG.engine; engineImage.loading="lazy";pistonImage.src=IMG.piston; pistonImage.loading="lazy";headImage.src=IMG.head; headImage.loading="lazy";
}
function renderCategories(){
 categoryStrip.innerHTML=categories.slice(0,7).map(c=>`<button class="cat-card" data-cat="${esc(c.name)}"><span class="cat-icon">${icon(c.icon,18)}</span><span><b>${esc(c.name)}</b><small>${c.count} catalog entries</small></span></button>`).join("");
 categoryChecks.innerHTML=categories.map(c=>`<label class="check"><input type="checkbox" name="category" value="${esc(c.name)}"> ${esc(c.name)} <span style="margin-left:auto;color:#9aa1a6">${c.count}</span></label>`).join("");
}
function filtered(){
 let arr=products.filter(p=>{
   const q=state.query.trim().toLowerCase();
   const okq=!q||[p.sku,p.name,p.category,p.machine,p.model,p.alt,p.engine,p.grade].join(" ").toLowerCase().includes(q);
   const okc=!state.category.size||state.category.has(p.category);
   const okm=!state.machine.size||state.machine.has(p.machine);
   const oks=!state.stock.size||state.stock.has(p.stock);
   const okg=!state.grade.size||state.grade.has(p.grade);
   const okmin=state.minPrice==null||p.price>=state.minPrice, okmax=state.maxPrice==null||p.price<=state.maxPrice;
   return okq&&okc&&okm&&oks&&okg&&okmin&&okmax;
 });
 if(state.sort==="price-asc")arr.sort((a,b)=>priceFor(a)-priceFor(b));
 if(state.sort==="price-desc")arr.sort((a,b)=>priceFor(b)-priceFor(a));
 if(state.sort==="stock")arr.sort((a,b)=>({in:0,low:1,out:2}[a.stock]-({in:0,low:1,out:2}[b.stock])));
 if(state.sort==="name")arr.sort((a,b)=>a.name.localeCompare(b.name));
 if(state.sort==="featured")arr.sort((a,b)=>Number(b.featured)-Number(a.featured)||a.id-b.id);
 return arr;
}
function priceFor(p){return p[state.account==="retail"?"price":state.account]}
function stockLabel(p){return p.stock==="in"?`${p.qty} in stock`:p.stock==="low"?`Only ${p.qty} left`:"Pre-order"}
function productCard(p){
 const saved=state.wishlist.has(p.id), compared=state.compare.has(p.id), price=priceFor(p);
 return `<article class="product-card">
 <div class="product-img"><img loading="lazy" src="${IMG[p.img]}" alt="${esc(p.name)}"><div class="img-overlay"></div>
 <div class="product-badges"><span class="pill ${p.grade==="OEM"?"orange":"dark"}">${esc(p.grade)}</span>${p.featured?'<span class="pill green">Top match</span>':""}</div>
 <div class="product-tools"><button class="${saved?"active":""}" data-action="wish" data-id="${p.id}" aria-label="Save">${icon("i-heart",15)}</button><button class="${compared?"active":""}" data-action="compare" data-id="${p.id}" aria-label="Compare">${icon("i-compare",15)}</button></div></div>
 <div class="product-body"><div><div class="sku">${esc(p.sku)} · ${esc(p.origin)}</div><div class="product-name">${esc(p.name)}</div><div class="fitment">Fits ${esc(p.machine)} ${esc(p.model)} / ${esc(p.alt)} · Engine ${esc(p.engine)}</div><div class="stock-row"><span class="stock ${p.stock}">● ${stockLabel(p)}</span><span>${p.weight} kg</span></div></div>
 <div class="price-box"><div class="price-main"><div><small>${state.account.toUpperCase()} UNIT PRICE</small><br><b>${money(price)}</b></div><small>MOQ ${p.moq}</small></div><div class="tier"><span>B2B ${money(p.b2b)}</span><span>Export ${money(p.export)}</span></div></div>
 <div class="product-actions"><button class="btn btn-primary" data-action="add" data-id="${p.id}">${icon("i-cart",14)} Add to order</button><button class="btn btn-light square-only" data-action="quick" data-id="${p.id}" aria-label="Quick view">${icon("i-search",14)}</button></div></div></article>`;
}
function renderProducts(){
 const arr=filtered(), pages=Math.max(1,Math.ceil(arr.length/state.perPage)); if(state.page>pages)state.page=pages;
 const start=(state.page-1)*state.perPage, items=arr.slice(start,start+state.perPage);
 productGrid.innerHTML=items.map(productCard).join("")||`<div style="grid-column:1/-1;background:white;border:1px solid var(--line);border-radius:12px;padding:60px;text-align:center"><h3>No matching parts</h3><p style="color:var(--muted)">Try a broader model, engine or category search.</p><button class="btn btn-primary" onclick="resetAll()">Reset filters</button></div>`;
 productGrid.classList.toggle("list-view",state.view==="list");
 resultCount.textContent=`${arr.length.toLocaleString()} parts found · showing ${arr.length?start+1:0}–${Math.min(start+state.perPage,arr.length)}`;
 renderPagination(pages); updateCounts();
}
function renderPagination(pages){
 let nums=[]; for(let p=Math.max(1,state.page-2);p<=Math.min(pages,state.page+2);p++)nums.push(p);
 pagination.innerHTML=`<button data-page="${state.page-1}" ${state.page===1?"disabled":""}>‹</button>${nums.map(p=>`<button class="${p===state.page?"active":""}" data-page="${p}">${p}</button>`).join("")}<button data-page="${state.page+1}" ${state.page===pages?"disabled":""}>›</button>`;
}
function updateCounts(){cartCount.textContent=state.cart.reduce((a,x)=>a+x.qty,0);wishCount.textContent=state.wishlist.size;compareCount.textContent=state.compare.size}
function addCart(id){
 const p=products.find(x=>x.id===id); if(!p)return;
 const found=state.cart.find(x=>x.id===id); if(found)found.qty++; else state.cart.push({id,qty:Math.max(1,p.moq)});
 save("kpx_cart",state.cart);updateCounts();renderCart();toast("Added to order",`${p.sku} · ${p.name}`)
}
function renderCart(){
 const items=state.cart.map(ci=>({ci,p:products.find(x=>x.id===ci.id)})).filter(x=>x.p);
 emptyCart.classList.toggle("hidden",items.length>0);
 cartItems.innerHTML=items.map(({ci,p})=>`<div class="cart-item"><img src="${IMG[p.img]}" alt=""><div><b>${esc(p.name)}</b><small>${esc(p.sku)} · MOQ ${p.moq} · ${money(priceFor(p))}/unit</small><div class="qty"><button data-cart="minus" data-id="${p.id}">−</button><span>${ci.qty}</span><button data-cart="plus" data-id="${p.id}">+</button></div></div><button class="remove-btn" data-cart="remove" data-id="${p.id}">${icon("i-close",15)}</button></div>`).join("");
 const subtotal=items.reduce((s,{ci,p})=>s+priceFor(p)*ci.qty,0),packing=items.length?Math.max(12,subtotal*.018):0;
 subtotalText.textContent=money(subtotal);packingText.textContent=money(packing);grandText.textContent=money(subtotal+packing);
 drawerModeLabel.textContent=state.account==="retail"?"Retail / workshop order mode":state.account==="b2b"?"B2B distributor quotation mode":"Export quotation mode";
}
function openDrawer(){drawerBackdrop.classList.add("open");cartDrawer.classList.add("open");document.body.style.overflow="hidden";renderCart()}
function closeDrawer(){drawerBackdrop.classList.remove("open");cartDrawer.classList.remove("open");document.body.style.overflow=""}
function openModal(title,html){modalTitle.textContent=title;modalBody.innerHTML=html;modalBackdrop.classList.add("open");document.body.style.overflow="hidden"}
function closeModal(){modalBackdrop.classList.remove("open");document.body.style.overflow=""}
function quickView(id){
 const p=products.find(x=>x.id===id);if(!p)return;
 openModal("Part detail",`<div class="quick-grid"><div class="quick-image"><img src="${IMG[p.img]}" alt="${esc(p.name)}"></div><div class="quick-info"><span class="pill orange">${esc(p.grade)}</span><div class="sku" style="margin-top:10px">${esc(p.sku)} · ${esc(p.origin)}</div><h2>${esc(p.name)}</h2><p style="font-size:10px;color:var(--muted)">Demo product record designed to show the data depth required for an export parts catalog.</p><div class="quick-price">${money(priceFor(p))}</div><div class="spec-grid"><div class="spec"><span>Fitment</span><b>${esc(p.model)} / ${esc(p.alt)}</b></div><div class="spec"><span>Engine</span><b>${esc(p.engine)}</b></div><div class="spec"><span>Availability</span><b>${stockLabel(p)}</b></div><div class="spec"><span>Lead time</span><b>${p.lead}</b></div><div class="spec"><span>Net weight</span><b>${p.weight} kg</b></div><div class="spec"><span>Pack size</span><b>${p.dims}</b></div><div class="spec"><span>HS placeholder</span><b>${p.hs}</b></div><div class="spec"><span>MOQ</span><b>${p.moq} unit(s)</b></div></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:13px"><button class="btn btn-primary" onclick="addCart(${p.id});closeModal()">Add to order</button><button class="btn btn-light" onclick="toggleWish(${p.id})">Save part</button></div></div></div>
 <div class="tabs"><button class="active">Compatibility</button><button>Commercial</button><button>Packing</button><button>Documents</button></div><div class="tab-content"><b>Fitment note:</b> compatibility shown in this prototype is illustrative. A production system should validate machine model, engine code, serial range, superseded part numbers and market variant before confirming supply.</div>`);
}
function toggleWish(id){state.wishlist.has(id)?state.wishlist.delete(id):state.wishlist.add(id);save("kpx_wishlist",[...state.wishlist]);renderProducts();toast(state.wishlist.has(id)?"Saved to wishlist":"Removed from wishlist")}
function toggleCompare(id){if(state.compare.has(id))state.compare.delete(id);else{if(state.compare.size>=4){toast("Comparison limit","You can compare up to 4 parts.");return}state.compare.add(id)}save("kpx_compare",[...state.compare]);renderProducts()}
function showCompare(){
 const arr=[...state.compare].map(id=>products.find(p=>p.id===id)).filter(Boolean);
 if(!arr.length){toast("No comparison items","Use the compare icon on a product card.");return}
 openModal("Compare parts",`<div style="overflow:auto"><table class="compare-table"><thead><tr><th>Attribute</th>${arr.map(p=>`<th>${esc(p.name)}<br><small>${esc(p.sku)}</small></th>`).join("")}</tr></thead><tbody>
 <tr><td>Image</td>${arr.map(p=>`<td><img src="${IMG[p.img]}" style="width:150px;height:90px;object-fit:cover;border-radius:7px"></td>`).join("")}</tr>
 <tr><td>Price</td>${arr.map(p=>`<td><b>${money(priceFor(p))}</b></td>`).join("")}</tr><tr><td>Grade</td>${arr.map(p=>`<td>${p.grade}</td>`).join("")}</tr><tr><td>Fitment</td>${arr.map(p=>`<td>${p.machine} ${p.model}<br>${p.engine}</td>`).join("")}</tr><tr><td>Stock</td>${arr.map(p=>`<td>${stockLabel(p)}</td>`).join("")}</tr><tr><td>Weight</td>${arr.map(p=>`<td>${p.weight} kg</td>`).join("")}</tr><tr><td>MOQ</td>${arr.map(p=>`<td>${p.moq}</td>`).join("")}</tr></tbody></table></div>`);
}
function showWishlist(){
 const arr=[...state.wishlist].map(id=>products.find(p=>p.id===id)).filter(Boolean);
 openModal("Saved parts",arr.length?`<div class="product-grid" style="grid-template-columns:repeat(3,1fr)">${arr.map(productCard).join("")}</div>`:`<p>No saved products yet.</p>`);
}
function resetAll(){
 state.query="";state.category.clear();state.machine.clear();state.stock.clear();state.grade.clear();state.minPrice=null;state.maxPrice=null;state.page=1;
 catalogSearch.value="";document.querySelectorAll(".filters input[type=checkbox]").forEach(x=>x.checked=false);minPrice.value="";maxPrice.value="";renderProducts()
}
window.resetAll=resetAll;window.addCart=addCart;window.closeModal=closeModal;window.toggleWish=toggleWish;
function updateGarageModel(){const fam=garageFamily.value;garageModel.innerHTML=familyModels[fam].map(x=>`<option>${x}</option>`).join("")}
function renderGarage(){
 garageItems.innerHTML=state.garage.map((g,i)=>`<button class="machine-chip" data-garage="${i}"><span class="machine-icon">${icon("i-truck",17)}</span><span><b>${esc(g.family)} ${esc(g.model)}</b><small>Use as fitment context</small></span></button>`).join("");
 garageCount.textContent=`${state.garage.length} machine${state.garage.length===1?"":"s"} saved locally`;
}
function bind(){
 document.querySelectorAll("[data-search-mode]").forEach(b=>b.onclick=()=>{document.querySelectorAll("[data-search-mode]").forEach(x=>x.classList.remove("active"));b.classList.add("active");heroSearch.placeholder=b.dataset.searchMode==="part"?"Try: oil filter, V2403, KPX-FLT-00018":b.dataset.searchMode==="model"?"Try: L4508, M7040, U50-5": "Try: D1105, V2403, V3800"});
 const doHeroSearch=()=>{state.query=heroSearch.value.trim();catalogSearch.value=state.query;state.page=1;renderProducts();document.querySelector("#catalog").scrollIntoView({behavior:"smooth"})};
 heroSearchBtn.onclick=doHeroSearch;heroSearch.onkeydown=e=>{if(e.key==="Enter")doHeroSearch()};browseBtn.onclick=()=>document.querySelector("#catalog").scrollIntoView({behavior:"smooth"});
 uploadListBtn.onclick=()=>openModal("Bulk parts-list upload",`<div style="max-width:670px"><h2>Upload CSV / XLSX / PDF parts list</h2><p style="color:var(--muted)">A production version should upload directly to private object storage using short-lived signed URLs, scan files, enforce size and file-type rules, and process rows asynchronously. This static prototype does not upload files.</p><div style="border:2px dashed #cfd5d8;border-radius:12px;padding:55px;text-align:center;background:#f7f8f9">${icon("i-file",34)}<h3>Drop zone preview</h3><small>SKU · description · quantity · model · notes</small></div></div>`);
 categoryStrip.onclick=e=>{const b=e.target.closest("[data-cat]");if(!b)return;resetAll();state.category.add(b.dataset.cat);document.querySelector(`input[name=category][value="${CSS.escape(b.dataset.cat)}"]`).checked=true;renderProducts();document.querySelector("#catalog").scrollIntoView({behavior:"smooth"})};
 document.querySelectorAll(".filters input").forEach(el=>el.addEventListener("change",()=>{state.category=new Set([...document.querySelectorAll('input[name=category]:checked')].map(x=>x.value));state.machine=new Set([...document.querySelectorAll('input[name=machine]:checked')].map(x=>x.value));state.stock=new Set([...document.querySelectorAll('input[name=stock]:checked')].map(x=>x.value));state.grade=new Set([...document.querySelectorAll('input[name=grade]:checked')].map(x=>x.value));state.minPrice=minPrice.value?Number(minPrice.value):null;state.maxPrice=maxPrice.value?Number(maxPrice.value):null;state.page=1;renderProducts()}));
 resetFilters.onclick=resetAll;catalogSearch.oninput=()=>{state.query=catalogSearch.value;state.page=1;renderProducts()};sortSelect.onchange=()=>{state.sort=sortSelect.value;state.page=1;renderProducts()};
 accountSelect.onchange=()=>{state.account=accountSelect.value;buyerProfile.value=state.account==="export"?"b2b":state.account;renderProducts();renderCart()};
 buyerProfile.onchange=()=>{state.account=buyerProfile.value==="retail"?"retail":"b2b";accountSelect.value=state.account;renderProducts();renderCart()};
 currencySelect.onchange=()=>{state.currency=currencySelect.value;renderProducts();renderCart()};
 gridView.onclick=()=>{state.view="grid";gridView.classList.add("active");listView.classList.remove("active");renderProducts()};listView.onclick=()=>{state.view="list";listView.classList.add("active");gridView.classList.remove("active");renderProducts()};
 productGrid.onclick=e=>{const b=e.target.closest("[data-action]");if(!b)return;const id=Number(b.dataset.id);({add:addCart,quick:quickView,wish:toggleWish,compare:toggleCompare})[b.dataset.action]?.(id)};
 pagination.onclick=e=>{const b=e.target.closest("[data-page]");if(!b||b.disabled)return;state.page=Number(b.dataset.page);renderProducts();document.querySelector("#catalog").scrollIntoView({behavior:"smooth",block:"start"})};
 cartBtn.onclick=openDrawer;drawerClose.onclick=closeDrawer;drawerBackdrop.onclick=closeDrawer;
 cartItems.onclick=e=>{const b=e.target.closest("[data-cart]");if(!b)return;const id=Number(b.dataset.id),item=state.cart.find(x=>x.id===id),p=products.find(x=>x.id===id);if(!item)return;if(b.dataset.cart==="plus")item.qty++;if(b.dataset.cart==="minus")item.qty=Math.max(p.moq,item.qty-1);if(b.dataset.cart==="remove")state.cart=state.cart.filter(x=>x.id!==id);save("kpx_cart",state.cart);renderCart();updateCounts()};
 checkoutBtn.onclick=()=>{if(!state.cart.length){toast("Order list is empty");return}openModal("Demo quotation created",`<div style="text-align:center;padding:30px 10px">${icon("i-check",48)}<h2>Quotation draft ready</h2><p style="color:var(--muted)">Reference KPX-RFQ-${Date.now().toString().slice(-8)} has been generated locally. A production system would validate the buyer, destination, price, stock, export restrictions and freight before issuing a signed proforma invoice.</p><button class="btn btn-primary" onclick="closeModal()">Done</button></div>`);closeDrawer()};
 wishlistBtn.onclick=showWishlist;compareBtn.onclick=showCompare;
 modalClose.onclick=closeModal;modalBackdrop.onclick=e=>{if(e.target===modalBackdrop)closeModal()};document.addEventListener("keydown",e=>{if(e.key==="Escape"){closeModal();closeDrawer()}});
 garageFamily.onchange=updateGarageModel;saveMachineBtn.onclick=()=>{const g={family:garageFamily.value,model:garageModel.value};if(!state.garage.some(x=>x.family===g.family&&x.model===g.model)){state.garage.push(g);save("kpx_garage",state.garage);renderGarage();toast("Machine saved",`${g.family} ${g.model}`)}};
 garageItems.onclick=e=>{const b=e.target.closest("[data-garage]");if(!b)return;const g=state.garage[Number(b.dataset.garage)];state.query=g.model;catalogSearch.value=g.model;renderProducts();document.querySelector("#catalog").scrollIntoView({behavior:"smooth"})};
 document.querySelectorAll(".faq-q").forEach(b=>b.onclick=()=>b.parentElement.classList.toggle("open"));
 contactForm.onsubmit=e=>{e.preventDefault();const fd=new FormData(contactForm);openModal("Demo RFQ",`<h2>Thank you, ${esc(fd.get("name"))}</h2><p>Your enquiry for <b>${esc(fd.get("country"))}</b> has been prepared locally. No information was sent because this is a static prototype.</p><div class="spec"><span>Request summary</span><b>${esc(fd.get("message"))}</b></div>`);contactForm.reset()};
 downloadSampleBtn.onclick=downloadCSV;
 securityBtn.onclick=securityFooterBtn.onclick=e=>{e.preventDefault();showSecurity()};
 creditsBtn.onclick=e=>{e.preventDefault();showCredits()};
 clearDataBtn.onclick=e=>{e.preventDefault();["kpx_cart","kpx_wishlist","kpx_compare","kpx_garage"].forEach(k=>localStorage.removeItem(k));location.reload()};
 mobileFilterBtn.onclick=()=>{filtersPanel.classList.toggle("mobile-open");drawerBackdrop.classList.toggle("open")};
 dismissDemo.onclick=()=>demoBanner.remove();
}
function downloadCSV(){
 const rows=[["sku","description","quantity","model","buyer_note"],["KPX-FLT-00018","Engine Oil Filter","12","V2403","B2B export quote"],["KPX-GS-00044","Full Gasket Set","3","D1105","Confirm serial range"]];
 const blob=new Blob([rows.map(r=>r.join(",")).join("\\n")],{type:"text/csv"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="KPX_bulk_order_template.csv";a.click();URL.revokeObjectURL(a.href)
}
function showSecurity(){
 openModal("Production security architecture",`<div style="max-width:820px"><h2>What must change before launch</h2><p>This single-file prototype intentionally contains no authentication, payment, private API keys or live inventory. A production implementation should use a secure backend and treat the browser as untrusted.</p>
 <div class="spec-grid"><div class="spec"><span>Identity</span><b>Passkeys / MFA, secure sessions, role-based access</b></div><div class="spec"><span>Catalog</span><b>Server-side validation, versioned price lists, audit history</b></div><div class="spec"><span>Payments</span><b>Hosted provider fields; never store raw card data</b></div><div class="spec"><span>Uploads</span><b>Signed URLs, malware scanning, file limits, quarantine</b></div><div class="spec"><span>APIs</span><b>Rate limits, CSRF protection, schema validation, idempotency</b></div><div class="spec"><span>Operations</span><b>Backups, alerts, WAF/CDN, secrets manager, log retention</b></div></div>
 <h3>Recommended service boundaries</h3><p>Catalog/Search · Pricing & Contracts · Inventory · Cart/RFQ · Order Management · Freight Quotes · Documents · Customer Accounts · CMS/PIM · Analytics. Keep price calculation, stock reservation, customs fields and payment confirmation server-authoritative.</p>
 <h3>Large-catalog strategy</h3><p>Use a PIM or normalized product database, object storage plus image CDN, background image processing, faceted search index, cursor pagination, cached model-fitment tables and event-driven synchronization with ERP/WMS.</p></div>`);
}
function showCredits(){
 openModal("Image credits",`<p>Images are embedded so the demo works as one offline HTML file.</p><table class="compare-table"><tr><th>Image</th><th>Source / license</th></tr>
 <tr><td>Kubota tractor 7, C and D</td><td>Love Krittaya · Wikimedia Commons · released to the public domain.</td></tr>
 <tr><td>Kubota engine at Agritechnica 2023</td><td>Matti Blume · Wikimedia Commons · CC BY-SA.</td></tr>
 <tr><td>Piston and cylinder-head images</td><td>Dana60Cummins · Wikimedia Commons · CC BY-SA 3.0.</td></tr></table>
 <p style="font-size:10px;color:var(--muted)">This prototype includes attribution for demonstration. Review each source license and your intended commercial use before publishing.</p>`);
}
function buildFAQs(){
 const qs=[
 ["Are the prices final export prices?","No. Prices in this prototype are illustrative and exclude freight, destination tax, duty, banking fees and any destination-specific compliance cost."],
 ["Can retail and B2B customers use the same catalog?","Yes. The same product records can expose different price tiers, MOQ rules, credit terms and quotation workflows based on the authenticated customer account."],
 ["How should fitment be confirmed?","Use equipment family, exact model, engine code, serial range, market variant and superseded part numbers. High-risk assemblies should require manual approval before shipment."],
 ["Can thousands of products be managed in one HTML file?","This prototype can filter 1,200 generated records locally, but production should use a database, search index, PIM, image CDN and server-side APIs."],
 ["How are export documents handled?","The system should generate controlled commercial documents from validated order, packing, country-of-origin and classification data. HS codes and regulatory requirements need professional review."],
 ["Is this an official Kubota website?","No. It is an independent catalog prototype. Brand names and trademarks belong to their respective owners."]
 ];
 faqList.innerHTML=qs.map((q,i)=>`<div class="faq-item ${i===0?"open":""}"><button class="faq-q">${esc(q[0])}${icon("i-plus",15)}</button><div class="faq-a">${esc(q[1])}</div></div>`).join("");
}
setImages();renderCategories();buildFAQs();updateGarageModel();renderGarage();renderProducts();renderCart();bind();
