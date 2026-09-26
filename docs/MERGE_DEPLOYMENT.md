# Quran workspace merge · 2026-09-26

User-authorized: merge Ayah Atlas and Famous Quran, deploy free, add Pencil/touch/mouse annotation and one private login. Do not modify the English app, pay, or upgrade. Name Ayah Atlas was supplied in the original build brief.

## Architecture
- Next.js / React, Node 24 on Vercel; no paid APIs. The 6,236-ayah corpus is immutable SQLite, 197.93 MiB traced API bundle. Compressed corpus in Git is verified at every build. Publisher downloads and private recovery backup remain in the prior release.
- Famous Quran main source is preserved under vendor/famous-quran. Build retains its 36 modules and media features, scopes its assets/service worker to /famous/, and uses shared original-page/media APIs.
- Shared /shared/workspace.js account and private storage namespace, plus /shared/annotations.js. Guest data is not automatically uploaded. Each signed-in account has a separate cache. Supabase RPC uses auth.uid(), per-entry versions, and explicit conflict choices, retaining competing copies.
- Page keys use equran:<original filename>, so the same original page shares marks across the two areas. Coordinates are normalized; source pixels/text stay unchanged. Study: pen/highlighter/eraser, colors, widths, undo/redo; creative: lines/arrows/boxes/ellipses/custom colors/PNG export. Finger drawing opt-in; Pencil pressure is used. Physical Apple Pencil verification remains a device check.
- Supabase approved Quran project: qzamdjcguksgzqcdaosd (Black Choco, Tokyo, free). Public publishable key is browser-safe; never add secret/service-role keys to client code.

## Activation status
- Private atlas_items table and atlas_save_item RPC applied in the dashboard. Anonymous table read was rejected (401 / permission denied).
- Google provider and custom SMTP were initially absent. Google setup is in progress; default Supabase email is restricted to project members. Do not claim general-public login is ready until an actual provider is activated and checked.
- Deployment is in progress. Record the verified production URL and commit here when complete.

## Essential checks
- Next production build passed; full corpus health returned 6236 ayat.
- Browser: reader original scan renders; mouse stroke saves and survives reload.
- Targeted account isolation, conflict and annotation payload checks in tests/workspace.test.mjs. No repeated broad research benchmarks are needed for this merge.
- No physical iPad/Pencil test or Google login success has yet been claimed.

- Targeted workspace tests: 5/5 passed (account isolation, raw preference preservation, conflict handling, sign-out isolation, invalid annotation data). Existing core/API/backup tests: 26/26 passed against the Next server at 4174. Initial attempt used the stale default 4173 port and was corrected; no test failures were hidden.
- Actual Supabase rollback-only test executed owner write/read, other-account read restriction and cross-account stale update rejection. No test user records retained.
- A broad asset-path rewrite initially changed publisher URL suffixes; fixed to rewrite only known local asset names.
- Prefer the existing famous-quran Vercel project/domain for the final switch, preserving origin-scoped guest notes. The root worker retirement script removes only old public shell caches; full reading packs and media are retained. Old #p links forward to the recitation section.

- User explicitly permitted deferring account/profile activation if Google Cloud remains stuck loading on their poor connection. They additionally requested separate, reliable annotated-page printing. Dedicated print preview composites original pixels + marks losslessly and prints A4 with optional notes on a separate page.

- Poor uplink caused one 50.66 MiB Git upload to time out (HTTP 408). Preserve recovery/unified-before-split-upload locally; unpublished commits were repackaged as code plus 4 MiB corpus parts for incremental uploads. The reconstructed raw database must match data/corpus-deployment.json before build. No source data was changed.
