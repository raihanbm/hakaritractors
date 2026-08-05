# Environment & Production Checklist

## Storefront config

Update only confirmed values in `assets/js/runtime-config.js`:

- `catalogApiBase`
- `storefront.phone`
- `storefront.email`
- `storefront.genuineLabel`
- `storefront.currency.code`
- `storefront.currency.symbol`
- `storefront.currency.usdRate`

The currency conversion is a configured display rate, not a live FX feed. Final quotation values remain server-authoritative.

## Internal Hikari API

Confirm that the production base allows the storefront origin and exposes:

- `GET /api/public-catalog`
- `GET /api/public-media?id=...`
- `GET /api/public-assets?path=...`
- `POST /api/public-orders`

Use browser Network tools to verify CORS, status codes, cache behavior and payload shape. Never put a service-role key or admin token in this static storefront.

## Still requires a chosen provider

- Customer sign-in/profile storage.
- Newsletter subscription endpoint.
- Analytics and cookie/consent policy.
- Transactional email/CRM notification after RFQ submission.
- Payment is intentionally not implemented; the current flow is quotation-first.
- Live shipping rates, tax, duties and final stock confirmation.

## Deployment

- Node.js 18+ for local verification.
- Static hosting works; Vercel config and Apache headers are included.
- Confirm the production domain before adding canonical URLs or a sitemap.
- Ensure the Internal Hikari domain in CSP matches the final API base.
