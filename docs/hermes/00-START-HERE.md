# Hikari Storefront V4 — Start Here

This folder is the handoff package for Hermes. The storefront code is already implemented; Hermes should integrate and verify it, not redesign it from scratch.

## Fastest setup

1. Upload the complete `hakaritractors-main-v4` folder to Hermes.
2. Tell Hermes to read `docs/hermes/HERMES_IMPLEMENTATION_PROMPT.md` first.
3. Run:

```bash
npm run audit
npm run dev
```

4. Open `http://localhost:4173`.
5. Verify these routes:
   - `#home`
   - `#catalog?model=L3608&category=ENGINE`
   - `#diagram?id=L3608-D10100-main-shaft`
   - `#models`
   - `#rfq`

## What is already complete

- Approved orange/black/white marketplace visual direction.
- Home, catalog, diagram detail, models, RFQ, help, contact, deals, about and terms routes.
- 913 real assembly diagrams and the full local sheet/search dataset.
- Model/category/part-number/diagram-code search.
- Filter, sort, grid/list view, pagination and mobile filter drawer.
- Diagram viewer, parts rows, selected/visible part RFQ actions, cart quantities and CSV export.
- Remote Internal Hikari catalog/order integration with a local-data fallback.
- Local wishlist/cart persistence, background control refresh and CSP-safe event handling.
- Responsive layouts for desktop, tablet and mobile.

## Do not let Hermes do these things

- Do not replace the real catalog with demo data.
- Do not delete `assets/data`, diagram crops or full diagram images.
- Do not change the visual direction unless a specific revision is requested.
- Do not claim that authentication, newsletter or payment is live until the real endpoint exists.
- Do not remove the API fallback or Internal Hikari publication/stock/price controls.

## Production values to confirm

Edit `assets/js/runtime-config.js` for the actual phone, email, currency and API base. Then follow `ENVIRONMENT_CHECKLIST.md` and `QA_CHECKLIST.md`.
