# Final QA Checklist

## Automated

```bash
npm run audit
```

Expected: asset verification passes, 16 tests pass and the v4 audit reports PASS.

## Desktop — 1672 × 941 reference viewport

- Header heights, logo scale, model strip and orange controls match the references.
- Home hero/search panel is not clipped.
- Catalog displays four cards per row at wide desktop.
- Diagram/detail page keeps image and parts panel balanced.
- No horizontal scrollbar at the page level.

## Tablet — 820 × 1180

- Mobile navigation opens and closes.
- Catalog has two cards per row.
- Filter sidebar becomes a bottom drawer.
- Diagram and parts panel stack cleanly.

## Mobile — 390 × 844

- Logo, search and cart fit the compact header.
- Home model/system/assembly sections scroll horizontally where intended.
- Catalog becomes one card per row.
- Parts table scrolls inside its own container.
- RFQ/cart and modal occupy the screen without trapping the user.

## Functional flows

1. Search `TC422-21514`; open the matching Main Shaft diagram.
2. Add the callout 010 row; increase, decrease and remove its RFQ quantity.
3. Select multiple rows and use the orange bulk-add button.
4. Reload and confirm cart/wishlist persistence.
5. Filter L3608 + Engine + Pre-order, then clear all filters.
6. Submit an RFQ with the API disconnected; verify local draft wording and CSV content.
7. Submit with a working API; verify the returned reference and cart clear.
8. Hide a product/part in Internal Hikari, wait or refocus after five minutes, and confirm storefront refresh.

## Browser QA limitation in this handoff

The build environment used for this package blocked local Chromium navigation with `net::ERR_BLOCKED_BY_ADMINISTRATOR`. Static verification, Node tests and HTTP smoke tests passed, but final pixel-level screenshots must be captured by Hermes or a normal local browser using the reference images in `docs/hermes/references/`.
