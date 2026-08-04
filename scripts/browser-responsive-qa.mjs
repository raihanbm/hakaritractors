import { spawn } from "node:child_process";
import { mkdir, writeFile, rm } from "node:fs/promises";
import path from "node:path";

const chrome = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const root = "C:/Users/JOMOK/Downloads/hikari-storefront-redesign-proof/qa";
const url = "https://hakaritractors.vercel.app/?responsive-qa=storefront-v3-2";
const allSizes = [[1920,1080],[1440,900],[1366,768],[1024,768],[768,1024],[390,844]];
const sizes = process.env.QA_ONE ? [[1366,768]] : allSizes;
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
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
    await call("Runtime.evaluate", { expression: "loadDriveCatalog().then(()=>document.querySelector('[data-model=\\\"L3608\\\"]')?.click()).catch(e=>console.error(e))" });
    for (let i = 0; i < 40; i++) {
      const rendered = await call("Runtime.evaluate", { expression: "document.querySelectorAll('.product-card').length", returnByValue: true });
      if ((rendered.result?.value || 0) > 0) break;
      await delay(500);
    }
    await call("Runtime.evaluate", { expression: "window.scrollTo(0,0)" });
    await delay(250);
    const expression = `(()=>{const q=s=>document.querySelector(s),cs=s=>getComputedStyle(q(s)),visible=e=>!!e&&getComputedStyle(e).display!=='none'&&e.getBoundingClientRect().width>0;const clipped=[...document.querySelectorAll('button,a,.product-name,.product-meta,.toolbar-result,.cat-card b')].filter(e=>e.scrollWidth>e.clientWidth+1&&getComputedStyle(e).whiteSpace!=='nowrap').map(e=>({tag:e.tagName,class:e.className,text:e.textContent.trim().slice(0,80),delta:e.scrollWidth-e.clientWidth}));return {viewport:[innerWidth,innerHeight],overflowX:document.documentElement.scrollWidth-document.documentElement.clientWidth,header:cs('.site-header').height,hero:cs('.hero').minHeight,sidebar:cs('.catalog-shell').gridTemplateColumns,grid:cs('.product-grid').gridTemplateColumns,gap:cs('.product-grid').gap,cards:document.querySelectorAll('.product-card').length,modelCards:document.querySelectorAll('[data-model]').length,toolbarVisible:visible(q('.catalog-toolbar')),filterButtonVisible:visible(q('.mobile-filter-btn')),cartVisible:visible(q('#cartBtn')),modalZ:cs('.modal-backdrop').zIndex,clipped,css:q('link[href*="main.css"]')?.href}})()`;
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
for (let i = 0; i < sizes.length; i++) {
  const [width, height] = sizes[i];
  output[`${width}x${height}`] = await run(width, height, i);
  console.log(`${width}x${height}`, JSON.stringify(output[`${width}x${height}`]));
}
await writeFile(path.join(root, "responsive-qa.json"), JSON.stringify(output, null, 2));
