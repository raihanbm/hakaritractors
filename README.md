# Hikari Tractors Indonesia Catalog

Export-ready static catalog interface for Hikari Tractors Indonesia.

## Run locally

Requirements: Node.js 18 or newer.

```bash
npm run check
npm run dev
```

Open `http://localhost:4173`.

## Deploy

1. Upload the complete folder to the GitHub repository.
2. Import the repository into Vercel.
3. Deploy from the `main` branch.
4. Confirm pricing, inventory, RFQ submission, payment and export document workflows before public launch.

## Notes

- Product, price, stock, fitment and quotation values require sales-team confirmation before invoice issuance.
- RFQ forms need a connected email/CRM/backend endpoint for production submission.
- Cart and saved model data are stored in the visitor browser until backend account storage is added.

Read `docs/ARCHITECTURE.md` and `docs/PHASES.md` before continuing.
