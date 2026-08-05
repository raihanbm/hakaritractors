# Feature Map

## Shared storefront shell

- Sticky top contact bar, brand header, global search, account placeholder and RFQ cart.
- Primary navigation and model shortcut strip.
- Benefits strip and complete commerce footer.
- Drawer, modal and toast systems.

## Home (`#home`)

- Tractor hero and four-field parts search.
- Featured models derived from the real catalog.
- System/category navigation.
- Featured assembly diagrams with price, parts count and stock status.

## Catalog (`#catalog`)

- Query parameters: `model`, `category`, `q`.
- Model, system and stock filters.
- Active-filter pills, reset controls, sorting and pagination.
- Grid/list layout and wishlist persistence.
- Mobile bottom-sheet filter drawer.

## Diagram (`#diagram?id=<sheet-id>`)

- Exploded diagram image with zoom, reset, print, download and fullscreen controls.
- Official diagram metadata and compatibility context.
- Parts table with callout, part number, name, diagram quantity, notes, stock and action.
- Add one part, selected parts or all currently visible parts to RFQ.
- Related assembly recommendations.

## RFQ/cart

- Persistent local cart with plus/minus/remove controls.
- Buyer name, email, destination, trade term and note.
- Production order endpoint when configured.
- Honest local RFQ draft fallback and CSV export when unavailable.
- Bulk-order template from the RFQ page.

## Data and control integration

- Local catalog: `assets/data/drive-catalog.json`.
- Sheet metadata: `assets/data/sheets-index.json`.
- Part-number index: `assets/data/sheets-search.json`.
- Per-diagram rows: `assets/data/sheets/*.json`.
- Local control state: `assets/data/catalog-control-state.json`.
- Remote catalog: `GET /api/public-catalog`.
- Remote order: `POST /api/public-orders`.
- Refresh every five minutes and when a stale tab becomes visible.
