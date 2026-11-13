# HRGen Reusable Client Core v2.0 — 13 Nov 2026

Status: source patch and test release candidate. This is **not** a hosted live deployment or clinical LIMS.

## Actual implementation
- v1 forward migration preserves existing client/service/booking records; new columns `booking_enabled`, `privacy_url`, `assigned_to`, booking events are added.
- Public booking starts **disabled** for all tenants, including pre-existing tenants after upgrade. Owner must enter a published HTTPS privacy notice and explicitly enable it. Requests cannot be accepted without positive user consent.
- Owner/staff workflow: create staff -> confirm booking -> owner assigns to same-client staff -> assigned staff marks collected. Cancellation is available before collection, invalid transitions are blocked.
- Booking timeline events stored with actor and timestamp; cross-tenant assignment denied.
- Privileged client-data export, no password hashes, no staff access. Exports contain personal information and must be protected.
- Operational SQLite snapshot backup + integrity/checksum verify CLI, no automated live restore; backup contains personal data and requires encryption and offline restore drills. Backups taken across multiple SQLite files are **not an atomic cross-database snapshot**, so pause writes for a consistent disaster recovery point.
- Existing PWA/Express app stays intact; client-specific branding/config continues on `/workspace`, public booking on `/book/{slug}`.

## Endpoints added
- GET `/api/v1/workspace/staff` owner/founder
- POST `/api/v1/workspace/bookings/{id}/assign` owner/founder; `{staffId}`
- GET `/api/v1/workspace/bookings/{id}/events` tenant staff or owner
- GET `/api/v1/workspace/export` owner/founder only
- PATCH `/api/v1/workspace/config` now accepts `privacyUrl` (HTTPS) and `bookingEnabled` (boolean)

## Backup / verify
```
node scripts/core-backup.mjs backup /var/lib/hrgen/client-core /safe/encrypted-storage/snapshot-2026-11-13
node scripts/core-backup.mjs verify /safe/encrypted-storage/snapshot-2026-11-13
```
Schedule under a maintenance pause. Verify an offline restore separately. Do not put raw backups in public GitHub, Drive shares or unencrypted cloud storage.

## QA
- Node built-in sqlite regression tests including v1 migration, tenant negatives, booking lifecycle, staff authorization, export controls, backup integrity/corruption detection.
- HTTP Express integration test added; its actual execution depends on repo's installed `express` package in CI.
- Offline static UI syntax checked. Real mobile/browser interaction, hosted database, security review and consent legal review remain required.

## Release warning
Booking is intentionally disabled on upgrade until an approved privacy URL is supplied. Production deployment requires Node 22.13+ persistent storage. Existing legacy React AI endpoints remain disabled in NODE_ENV=production by prior patch; the AI dashboard is not integrated with the v2 client data model.
