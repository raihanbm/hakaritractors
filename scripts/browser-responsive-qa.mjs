import { spawn } from "node:child_process";
import { mkdir, writeFile, rm } from "node:fs/promises";
import path from "node:path";

const chrome = process.env.QA_CHROME || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const root = process.env.QA_OUTPUT || "C:/Users/JOMOK/Downloads/hikari-storefront-redesign-proof/qa";
const url = process.env.QA_URL || "https://hakaritractors.vercel.app/?responsive-qa=marketplace-v1";
const scrollTarget = process.env.QA_SCROLL_TO || "";
const allSizes = [[1920,1080],[1440,900],[1366,768],[1024,768],[768,1024],[390,844]];
const sizes = process.env.QA_ONE ? [[1366,768]] : allSizes;
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const ALLOW_API_FALLBACK = process.env.QA_ALLOW_API_FALLBACK === "1";

await mkdir(root, { recursive: true });

async function connect(port) {
  for (let i = 0; i < 60; i++) {
    try {
      const pages = await fetch(`http://127.0.0.1:${port}/json`).then(response => response.json());
      const page = pages.find(item => item.type === "page" && item.url === "about:blank") || pages.find(item => item.type === "page");
      if (page?.webSocketDebuggerUrl) return page.webSocketDebuggerUrl;
    } catch {}
    await delay(250);
  }
  throw new Error(`CDP not ready on ${port}`);
}

async function run(width, height, index) {
  const profile = path.join(root, `profile-${width}`);
  const port = 9330 + index;
  await rm(profile, { recursive: true, force: true });
  let proc;
  let ws;
  try {
    proc = spawn(chrome, [
      "--headless=new", "--disable-gpu", "--hide-scrollbars", "--no-first-run",
      "--remote-allow-origins=*", `--remote-debugging-port=${port}`,
      `--user-data-dir=${profile}`, `--window-size=${width},${height}`, "about:blank"
    ], { stdio: "ignore" });
    ws = new WebSocket(await connect(port));
    await Promise.race([
      new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; }),
      delay(10000).then(() => Promise.reject(new Error("CDP WebSocket timeout")))
    ]);

    let id = 0;
    const pending = new Map();
    const consoleErrors = [];
    const networkErrors = [];
    ws.onmessage = event => {
      const message = JSON.parse(event.data);
      if (message.id && pending.has(message.id)) {
        const request = pending.get(message.id);
        clearTimeout(request.timer);
        pending.delete(message.id);
        message.error ? request.reject(new Error(message.error.message)) : request.resolve(message.result);
        return;
      }
      if (message.method === "Runtime.consoleAPICalled" && ["error", "warning"].includes(message.params.type)) {
        consoleErrors.push(message.params.args.map(arg => arg.value || arg.description || "").join(" "));
      }
      if (message.method === "Network.loadingFailed") networkErrors.push(`${message.params.errorText} ${message.params.blockedReason || ""}`.trim());
      if (message.method === "Network.responseReceived" && message.params.response.status >= 400) networkErrors.push(`${message.params.response.status} ${message.params.response.url}`);
    };
    const call = (method, params = {}) => new Promise((resolve, reject) => {
      const requestId = ++id;
      const timer = setTimeout(() => { pending.delete(requestId); reject(new Error(`CDP timeout: ${method}`)); }, 20000);
      pending.set(requestId, { resolve, reject, timer });
      ws.send(JSON.stringify({ id: requestId, method, params }));
    });

    await Promise.all([call("Page.enable"), call("Runtime.enable"), call("Network.enable")]);
    await call("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: width <= 520 });
    await call("Page.navigate", { url });
    await delay(1800);
    await call("Runtime.evaluate", { expression: "loadDriveCatalog().then(()=>document.querySelector('[data-model=\"L3608\"]')?.click()).catch(e=>console.error(e))" });
    for (let i = 0; i < 40; i++) {
      const rendered = await call("Runtime.evaluate", { expression: "document.querySelectorAll('.product-card').length", returnByValue: true });
      if ((rendered.result?.value || 0) > 0) break;
      await delay(500);
    }
    await call("Runtime.evaluate", { expression: scrollTarget ? `document.querySelector(${JSON.stringify(scrollTarget)})?.scrollIntoView({block:'start'})` : "window.scrollTo(0,0)" });
    await delay(250);
    const expression = `(()=>{const q=s=>document.querySelector(s),cs=s=>getComputedStyle(q(s)),visible=e=>!!e&&getComputedStyle(e).display!=='none'&&e.getBoundingClientRect().width>0;const clipped=[...document.querySelectorAll('.product-name,.assembly-fitment span,.assembly-code,.toolbar-result,.cat-card b')].filter(e=>e.scrollWidth>e.clientWidth+1&&getComputedStyle(e).whiteSpace!=='nowrap').map(e=>({tag:e.tagName,class:e.className,text:e.textContent.trim().slice(0,80),delta:e.scrollWidth-e.clientWidth}));return {viewport:[innerWidth,innerHeight],overflowX:document.documentElement.scrollWidth-document.documentElement.clientWidth,header:cs('.site-header').height,hero:cs('.hero').minHeight,sidebar:cs('.catalog-shell').gridTemplateColumns,grid:cs('.product-grid').gridTemplateColumns,gap:cs('.product-grid').gap,cards:document.querySelectorAll('.product-card').length,modelCards:document.querySelectorAll('[data-model]').length,toolbarVisible:visible(q('.catalog-toolbar')),filterButtonVisible:visible(q('.mobile-filter-btn')),cartVisible:visible(q('#cartBtn')),modalZ:cs('.modal-backdrop').zIndex,clipped,css:[...document.querySelectorAll('link[rel="stylesheet"]')].map(link=>link.href)}})()`;
    const metrics = await call("Runtime.evaluate", { expression, returnByValue: true });
    const shot = await call("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
    await writeFile(path.join(root, `after-${width}x${height}.png`), Buffer.from(shot.data, "base64"));
    return { ...metrics.result.value, consoleErrors, networkErrors: [...new Set(networkErrors)] };
  } finally {
    ws?.close();
    proc?.kill();
    await delay(200);
    await rm(profile, { recursive: true, force: true });
  }
}

const output = {};
const failures = [];
for (let i = 0; i < sizes.length; i++) {
  const [width, height] = sizes[i];
  output[`${width}x${height}`] = await run(width, height, i);
  console.log(`${width}x${height}`, JSON.stringify(output[`${width}x${height}`]));
}

// --- ASSERTIONS (fail the script, not just log) ---
for (const [label, result] of Object.entries(output)) {
  const [width, height] = label.split("x").map(Number);

  if (result.overflowX > 0) {
    failures.push(`${label}: horizontal overflow detected (${result.overflowX}px)`);
  }
  if (result.cards < 1) {
    failures.push(`${label}: no product cards rendered (got ${result.cards})`);
  }
  if (result.modelCards < 1) {
    failures.push(`${label}: no model cards rendered (got ${result.modelCards})`);
  }
  if (!result.toolbarVisible) {
    failures.push(`${label}: catalog toolbar not visible`);
  }
  if (!result.cartVisible) {
    failures.push(`${label}: cart button not visible`);
  }

  // Network / console errors are fatal unless ALLOW_API_FALLBACK is set
  const apiErrors = result.consoleErrors.filter(e => e.includes("catalog-api-fallback") || e.includes("ERR_FAILED"));
  const nonApiErrors = result.consoleErrors.filter(e => !e.includes("catalog-api-fallback") && !e.includes("ERR_FAILED"));
  if (nonApiErrors.length > 0) {
    failures.push(`${label}: ${nonApiErrors.length} console error(s): ${nonApiErrors.slice(0,3).join(" | ")}`);
  }
  const netFails = result.networkErrors.filter(e => e.includes("ERR_FAILED") || e.includes("404"));
  if (netFails.length > 0 && !ALLOW_API_FALLBACK) {
    failures.push(`${label}: ${netFails.length} network error(s): ${netFails.slice(0,3).join(" | ")}`);
  }
  if (result.clipped && result.clipped.length > 0) {
    failures.push(`${label}: ${result.clipped.length} text element(s) clipped`);
  }
}

await writeFile(path.join(root, "responsive-qa.json"), JSON.stringify(output, null, 2));

if (failures.length > 0) {
  console.error("\nRESPONSIVE QA FAILURES:");
  failures.forEach(f => console.error(`  ✗ ${f}`));
  throw new Error(`Responsive QA failed with ${failures.length} violation(s):\n${failures.join("\n")}`);
}
console.log("\nResponsive QA passed all viewports.");
