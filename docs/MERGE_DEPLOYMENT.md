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
- Live production: https://famous-quran.vercel.app/ and https://famous-quran.vercel.app/famous/index.html. Code commit a109a6b, Vercel deployment 9iBvwvChxYgdN9cWYxcvRVeeqSZz reached Ready on 2026-09-26 at 23:39 JST. Existing domain retained, no paid upgrade.

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

## Final activation checkpoint
- All 13 corpus parts and merged source are uploaded to private GitHub; f184a9c is the complete corpus checkpoint. Vercel's existing famous-quran project is connected to Tahmid447/ayah-atlas, with Next.js and Node 24 selected. Subsequent pushes to main deploy automatically.
- Google Cloud project Quran Workspace (hardy-beach-509814-r2), Black Choco account, is at the API Services User Data Policy agreement. User confirmation is pending; no agreement accepted and no OAuth client created yet. After approval, finish branding, create the web OAuth client for the Supabase callback, configure the provider, production redirect URL and public audience, then enable PUBLIC_GOOGLE_SIGN_IN and verify a real sign-in. Never commit client secrets.
- Print uses a same-origin nonce-bound popup and a lossless composite of original image + marks. Browser printing can include page notes separately. A direct A4 PDF download uses vendored jsPDF 4.2.1 with its license. The shared PDF generator was exercised and its one-page A4 output rendered: the complete original page and border fit without clipping. Browser preview confirmed the composite image loaded. Physical printer/Pencil checks remain unperformed.
- Existing root service worker migration preserves private storage and offline packs. No old Famous repository history was rewritten.

## Production verification
- Final build, typecheck, lint and new print-script syntax checks passed. The earlier 26 core tests and 5 focused workspace tests passed; unchanged broad corpus/research benchmarks were not repeated.
- Live health: 6,236 ayahs. Coverage: 114 surahs, five translations. Quran 49:12 returned English/Bengali/Japanese translations. Al-Qalam scan section returned five original images including p566.gif. Surah 25 catalogue returned five reciter tracks. Famous HTML, print preview and PDF utility all returned HTTP 200.
- Live browser: Atlas reader opened Quran 68:7, Famous Quran opened with its original media/study navigation, and all five Furqan scans loaded with shared annotation + print toolbars. Local mouse marks persisted through reload. Final browser PDF action reported successful generation; optional notes appeared separately. The popup produced an Electron host warning, not an app-script exception. Native print dialogue/physical printer were not inspectable.
- A requested viewport override did not apply to the QA tab (it remained 1280px); do not count that as a new phone-size pass. Earlier reader responsive checks predate the shared annotation toolbar. CSS wraps the new controls, but physical iPad/Pencil and current small-screen interaction still need a device check.
- Supabase Site URL saved as https://famous-quran.vercel.app. Public sign-in remains pending and the live account dialog says so. No new users or login credentials created during production QA.
- Remaining: obtain policy approval, complete Google OAuth and verify a real account across both areas; optionally configure SMTP. Production editorial write service is not enabled. Combined account JSON export exists; generic combined-backup import has not been added (the validated Atlas Sources restore remains available).
