# Hikari Tractors Storefront V4

Ready-to-integrate static storefront for Hikari Tractors, built around the existing real exploded-diagram catalog.

## Run

Requirements: Node.js 18 or newer.

```bash
npm run audit
npm run dev
```

Open `http://localhost:4173`.

## Commands

- `npm run dev` — local static preview server.
- `npm run check` — local asset and embedded-image verification.
- `npm test` — v4 regression and source-data integrity tests.
- `npm run audit` — runs verification, tests and generates `docs/hermes/AUDIT_SUMMARY.json`.

## Main implementation

- `index.html`
- `assets/css/main.css`
- `assets/js/app.js`
- `assets/js/runtime-config.js`

## Hermes handoff

Start with `docs/hermes/00-START-HERE.md` and paste `docs/hermes/HERMES_IMPLEMENTATION_PROMPT.md` into Hermes.

## Production notice

RFQ submission uses the configured Internal Hikari public-order endpoint. When unavailable, the UI creates an honest local draft and CSV instead of claiming success. Authentication, newsletter, analytics and final business contact/currency values still require production configuration.
