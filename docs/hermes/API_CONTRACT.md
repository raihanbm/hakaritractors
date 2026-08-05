# Public API Contract Used by Storefront V4

The storefront must never receive admin/service-role credentials. It consumes public, sanitized endpoints only.

## `GET /api/public-catalog`

Expected response envelope:

```json
{
  "data": [
    {
      "code": "L3608",
      "categories": [
        {
          "name": "ENGINE",
          "slug": "engine",
          "subcategories": [
            {
              "assemblies": [
                {
                  "id": "assembly-id",
                  "code": "D10100",
                  "title": "MAIN SHAFT",
                  "thumbnail_media_id": null,
                  "full_diagram_media_id": null,
                  "pdf_media_id": null,
                  "source_thumbnail_url": "...",
                  "source_full_diagram_url": "...",
                  "source_pdf_path": "...",
                  "source_page_count": 1,
                  "crop_config": null,
                  "hotspots": [],
                  "spare_parts": [
                    {
                      "id": "part-id",
                      "callout": "010",
                      "part_number": "TC422-21514",
                      "name": "GEAR-SHAFT,MAIN",
                      "quantity": 1,
                      "notes": "...",
                      "location_description": "...",
                      "retail_price": 0,
                      "b2b_price": 0,
                      "export_price": 0,
                      "currency": "IDR",
                      "stock_quantity": 0
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}
```

## Public media

- `GET /api/public-media?id=<media-id>`
- `GET /api/public-assets?path=<encoded-path>`

The storefront uses media IDs first, then sanitized source paths.

## `POST /api/public-orders`

Request:

```json
{
  "buyerName": "Company or buyer",
  "buyerEmail": "buyer@example.com",
  "destination": "Jakarta, Indonesia",
  "incoterm": "Quote best method",
  "accountType": "retail",
  "message": "Buyer note and an RFQ item summary",
  "items": [
    { "partId": "public-part-id", "quantity": 2 }
  ]
}
```

Success response should provide:

```json
{
  "data": {
    "reference": "HT-RFQ-12345678"
  }
}
```

Any non-2xx response is treated as failure. The storefront then prepares a local draft and does not claim server submission.

## CORS and security

- Allow only the real storefront origins.
- Keep admin fields and unpublished records out of the public response.
- Validate every quantity and part ID server-side.
- Apply rate limits and abuse protection to order creation.
- Keep quotation prices and availability server-authoritative.
