# Hikari Tractors — Security, Trust, SEO & Meta Compliance

## Canonical public identity

- **Canonical public URL:** `https://hikaritractors.com/`
- **Business description:** independent tractor spare-parts supplier with model-first catalog, exploded-diagram references, and RFQ support.
- **Support email:** `info@hikaritractors.com`
- **WhatsApp:** `+62 852-8755-1869`
- **Independence notice:** Hikari Tractors is not represented as an official Kubota website, dealer, or authorized representative. Brand names, trademarks, model names, and part numbers are for identification only.

## Meta domain verification — DNS TXT (recommended)

1. Open **Meta Business Settings** → **Brand Safety** → **Domains**.
2. Add `hikaritractors.com` (not a temporary Vercel domain).
3. Select **DNS verification** and copy the TXT host/value Meta provides.
4. In the authoritative DNS provider for `hikaritractors.com`, add that exact TXT record. Do **not** replace unrelated TXT records such as SPF/DKIM.
5. Wait for DNS propagation, return to Meta, and choose **Verify**.
6. Use [Meta Sharing Debugger](https://developers.facebook.com/tools/debug/) with `https://hikaritractors.com/`, inspect the public preview, then choose **Scrape Again** after a deploy.
7. In Instagram, check **Settings and activity** → **Account Status** for any separate account-level limitations.

DNS TXT is deliberately preferred here. No fake `facebook-domain-verification` meta tag is committed, and no verification token belongs in source control.

## Deployment requirements

This source has matching rules for two deployment surfaces:

- **Vercel:** `vercel.json` provides a transparent `www` → apex redirect and security headers.
- **cPanel / Apache:** deploy `.htaccess` beside `index.html`. It provides HTTP/HTTPS + `www` → `https://hikaritractors.com` canonicalization, a real 404 document, and matching headers.

After deployment, verify `https://hikaritractors.com/{about,contact,privacy-policy,terms-and-conditions,shipping-policy,returns-and-refunds,warranty,help-center}`, `robots.txt`, `sitemap.xml`, and `/assets/images/og-hikari-tractors.jpg` each return `200`. The live host must actually use this deployment configuration; GitHub push alone cannot alter DNS, cPanel document root, Vercel domain assignment, or CDN settings.

## Content/operational placeholders to complete

These values are deliberately not invented. Replace only after confirming the business facts:

- `[BUSINESS LEGAL NAME]`
- `[BUSINESS ADDRESS]`
- `[BUSINESS HOURS]`
- `[DATA RETENTION PERIOD]`
- `[RETURN PERIOD]`
- `[DAMAGE REPORTING PERIOD]`

Review the Privacy Policy whenever an analytics, ad-pixel, payment, messaging, or operational processor is added or changed.

## Security headers and allowed origins

The baseline CSP allows only the origins currently required by this storefront:

- `'self'` for static source, assets, and pages;
- `https://internalhikaritractors.vercel.app` for the public catalog/order API and frame content where used;
- `https://cdnjs.cloudflare.com` for currently loaded CDN resources.

It blocks plugins and framing, constrains forms to this site, and includes `nosniff`, HSTS, referrer, and permissions policies. Do not add external origins without confirming the integration and updating this document.

## No cloaking / transparent access

There are no crawler-specific pages, user-agent/IP/country/referrer redirects, hidden Meta verification values, URL shorteners, or conditional content paths. Trust pages are static HTML and expose the same content to visitors and crawlers.
