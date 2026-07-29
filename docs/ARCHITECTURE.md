# Target Architecture

## Staging foundation — current package

Browser → static HTML/CSS/JS → local demo catalog

This is useful for visual approval, responsive testing, copy review, and planning the data model.
It must not be treated as the authoritative source for prices, inventory, freight, payments, or customer identity.

## Production target

```text
Customer browser
  → CDN / WAF / DNS
  → Next.js storefront
  → authenticated server API
      → PostgreSQL product and transaction database
      → object storage and image CDN
      → email provider
      → payment provider hosted checkout
      → background jobs and audit logs
```

## Server-authoritative responsibilities

The server must own and recalculate:

- customer identity and access level;
- retail, B2B, fleet, and export pricing;
- stock and reservation status;
- product fitment and supersession rules;
- quotation totals, packing, freight, taxes, and Incoterms;
- payment status and webhook verification;
- commercial documents and audit history.

## First production data domains

1. Categories and products
2. Product media
3. Machine models and engines
4. Fitment and superseded part numbers
5. Price lists and customer account tiers
6. Inventory locations and availability
7. RFQs and RFQ items
8. Customers and company accounts
9. Quotations, orders, and shipments
10. Audit logs
