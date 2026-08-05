# Copy/Paste Prompt for Hermes

You are integrating **Hikari Tractors Storefront V4**. Treat the uploaded implementation as the source of truth. Do not redesign it and do not replace its real catalog data with generated samples.

## Objective

Set up, validate and deploy the uploaded storefront exactly in its current approved design direction: a dense professional tractor-parts marketplace with orange/black/white branding, model-first navigation, assembly diagram cards, exploded-diagram detail pages, parts tables and an RFQ cart.

## Mandatory preservation rules

1. Preserve `assets/data/**`, all diagram crop/full images and all 913 assembly records.
2. Preserve these active files unless fixing a proven defect:
   - `index.html`
   - `assets/css/main.css`
   - `assets/js/app.js`
   - `assets/js/runtime-config.js`
3. Preserve the hash routes: `home`, `catalog`, `diagram`, `models`, `rfq`, `help`, `contact`, `deals`, `about`, `terms`.
4. Preserve Internal Hikari integration:
   - `GET /api/public-catalog`
   - `GET /api/public-media`
   - `GET /api/public-assets`
   - `POST /api/public-orders`
5. Preserve local fallback files and control-state overrides.
6. Never claim an RFQ was submitted when the API fails. Keep the local draft + CSV fallback.
7. Never add inline HTML event handlers. Existing event bindings are CSP-safe.
8. Keep responsive behavior at desktop, tablet and mobile widths.

## Required execution

```bash
npm run audit
npm run dev
```

Fix only reproducible failures. Do not “simplify” by removing functionality or data.

## Required functional QA

- Home loads with model, system and featured assembly sections.
- Global search finds assembly names, diagram codes and spare-part numbers.
- Catalog filters and sort work together and reset cleanly.
- Grid/list toggle persists.
- A diagram opens and displays its exploded image and spare-part rows.
- Individual, selected and visible parts enter the RFQ cart.
- Cart quantity plus/minus/remove works and persists after reload.
- RFQ API success clears the cart only after a snapshot is retained for CSV download.
- API failure produces an honest local draft and never shows false success.
- Internal price, stock, publish and custom-part controls are honored.
- Mobile navigation, filter drawer, cart drawer and modal close correctly.

## Production configuration

Read `docs/hermes/ENVIRONMENT_CHECKLIST.md`. Replace placeholder contact/currency values only after confirming them with the owner. Do not invent credentials or API keys. Do not print secrets into chat, source control or build logs.

## Completion response

Report:
- commands run and their exact pass/fail result;
- files changed;
- API endpoints verified;
- remaining production-only connections;
- desktop/tablet/mobile screenshots from the running implementation.
