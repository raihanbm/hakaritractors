# KPX Website Foundation v1

This package is the cleaned **staging foundation** of the uploaded KPX single-file prototype.
It is not yet a production e-commerce backend.

## What changed

- Split the original 26.37 MB monolithic HTML into HTML, CSS, JavaScript, and image assets.
- Converted six embedded JPEG images to optimized WebP files.
- Added local verification and a dependency-free Node preview server.
- Added Vercel security headers for a private/public staging deployment.
- Kept `noindex,nofollow` and `robots.txt` blocking crawlers until real data, legal copy, and backend flows are ready.
- Preserved the existing UI and demo interaction behavior.

## Run locally

Requirements: Node.js 18 or newer.

```bash
npm run check
npm run dev
```

Open `http://localhost:4173`.

## Deploy as staging

1. Create a private GitHub repository.
2. Upload this entire folder, not only `index.html`.
3. Import the repository into Vercel.
4. Set the project as a staging environment and use a temporary domain.
5. Do not activate real payments or accept sensitive documents yet.

## Current limitations

- Product, price, stock, fitment, and quotation data are generated demo data.
- RFQ forms do not send information to a server.
- Cart and garage data stay in the visitor's browser.
- There is no authentication, admin dashboard, inventory reservation, payment webhook, or audit log.

Read `docs/ARCHITECTURE.md` and `docs/PHASES.md` before continuing.
