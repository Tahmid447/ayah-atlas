# Active merge and deployment — 2026-09-26

The user now explicitly authorized free live deployment, merging Famous Quran, page annotations, and private account sync. This supersedes older deployment restrictions below. Current code uses Next.js on Node 24 for Vercel; immutable source corpus is compressed in Git and verified/decompressed at build. Famous Quran is preserved under vendor/famous-quran and integrated at /famous/index.html. Supabase project qzamdjcguksgzqcdaosd in Black Choco is approved for Quran data. See docs/MERGE_DEPLOYMENT.md for current activation and verification status.

**LIVE:** https://famous-quran.vercel.app/ (production code a109a6b; Vercel deployment 9iBvwvChxYgdN9cWYxcvRVeeqSZz, Ready). Public corpus, media API, both reader areas, annotation tools and PDF assets verified. Work and data are backed up in private GitHub. Remaining activation: Google policy confirmation, OAuth web client and Supabase provider, then a real sign-in/sync check. Public Google sign-in is deliberately not enabled yet. Supabase Site URL is now the production domain. Browser email delivery is restricted to project members until Google or custom SMTP is activated. Physical Pencil/printer testing remains a user-device check.

# Historical recovery checkpoint — September 20

The sections below describe the earlier local-only release. Its Vinext commands, deployment restrictions and device-only account status are historical. Use the current README and docs/MERGE_DEPLOYMENT.md for the Next.js merged deployment.

## User intent and stopping point

The user asked for the full application in PROJECT_SPEC.md, with an attached Quran reference image and https://www.equraninstitute.com/quranreading/index.htm. They explicitly authorized using original GIFs and researching alternative fonts rather than stopping when font identification proved difficult. They were frustrated by an earlier premature stop.

The latest user request is to **preserve all work/data and a durable memory before switching accounts**, then continue later. The user subsequently resumed and asked to finish. Files/database/browser notes were checked intact. The private GitHub backup was uploaded and the full recovery archive verified before continuing. Recovery fixes and final checks are now complete. Do not restart the project or replace the existing app with a new starter. Do not modify VideoScope. Do not pay for services or deploy a production website without explicit authorization.

Read AGENTS.md, PROJECT_SPEC.md, IMPLEMENTATION_CHECKLIST.md, docs/VERIFICATION.md, docs/MAINTENANCE.md, and docs/TYPOGRAPHY.md before continuing.

## Where everything is

Original working project on this Mac:
`/Users/tahmidahmed/Documents/Codex/2026-09-20/reference-image-attach-the-original-quran/outputs/ayah-atlas`

Development preview: http://localhost:4173. Development server is retained. The temporary production server on 4183 was stopped deliberately for a successful offline test.

Private GitHub repository: https://github.com/Tahmid447/ayah-atlas
Recovery release: https://github.com/Tahmid447/ayah-atlas/releases/tag/checkpoint-2026-09-20-r2
The repository holds source, lockfile, migrations, manifests, original reference assets, tests, and documentation. The release's recovery archive additionally includes the large validated SQLite corpus, preserved publisher downloads, research files, and example device-state export. Download both using the GitHub account that has access; changing ChatGPT accounts does not grant a different GitHub account access.

Secrets and dependency installation folders are excluded. Dependencies are reproducible from package-lock.json. The runtime SQLite database is regenerated from data/corpus.sqlite by bootstrap-local.py; any review rows at checkpoint are exported into data/editorial-checkpoint.json. Guest state is in docs/test-results/device-workspace.json.

## Working implementation

React 19 / TypeScript / Vinext 1.0.0-beta.5 on Vite 8, with Cloudflare-compatible Worker output and local D1/SQLite. The app is a modular monolith, not a static mockup. No remote Site was registered or deployed; .openai/hosting.json only declares DB. .sites-runtime/execution-profile.json is a portable local profile.

Reader: all 114 surahs; original images, selectable study, continuous reading; surah/juz/ayah navigation; bookmarks/last position; independent interface/translation languages; edition comparison; text sizing/spacing; dark theme. The original screenshot corresponds to p566.gif, printed page 566, Surah 68:7–31. Source image 720×1080, GIF87a. Original image renderer is exact; selectable Uthmani is explicitly an alternative. Image navigation is section-level, with no verified per-ayah pixel boxes.

Data: Tanzil 1.1, five complete translations, four full-coverage tafsir editions, 42 hadith. Canonical/translation content and footnotes are retained with checksums and edition IDs. Tafsir Ibn Kathir has 1,896 shared passages mapping to 6,236 ayat. Import snapshots are 2026-09-20. See coverage.json for exact versions/hashes.

Research: exact references; FTS5 lexical search; Japanese trigram and Bengali/Arabic normalization; editorial topic aliases; deduplication, reranking, pagination, source/language filtering, context. Benchmarks Quran 49:12, Muslim 2589, Bukhari 33 resolve to imported originals. Results are evidence, not AI rulings. A cross-surah story explorer groups actual prophet mentions by surah and opens commentary. It does not invent chronology. Published HadeethEnc practical lessons/glossary are exposed where supplied.

Notebook/talk: immutable evidence snapshots, private notes, ordered collections, talk selections, audience/duration/output language, editable outline and connective draft template, rehearsal, complete-quotation citation checks, source-linked Markdown export preview and attachment endpoint, browser-print stylesheet. Arabic and translated-source attribution/checksums persist. Settings/notes are browser local; no account sync is implemented.

Sources/review: provenance registry, coverage/review status, live publisher version check, notice for older saved canonical editions, pending correction submissions, protected named review decisions/history. Source imports/validation/promotion are CLI-operated. No human review is claimed. EDITORIAL_TOKEN is not configured.

Offline: explicit user download of all 114 chapters and five translations. Each Arabic/translation checksum is verified, then a complete cache snapshot is activated atomically. The existing pack is preserved if a download fails. Production reader was reloaded and another chapter/Japanese translation read with the production server stopped. Original GIFs, tafsir, and search are excluded from the browser offline pack; all are locally available while the app server runs.

## Verification already done

- Typecheck and lint passed on the checkpoint code (see final verification log).
- 26 unit/API/offline/backup validation tests passed; the result is recorded in docs/test-results/checkpoint-tests.txt.
- 11 integrity tests passed: inventory, full translations/tafsir, source checksums, mappings, original GIF hashes, numbering, database constraints, zero fabricated review claims.
- 4 import security tests passed. Provider failure/private DNS/redirect scenarios are mocked, not live outage claims.
- 30 live local retrieval queries, EN/BN/JA, 10 themes: mean benchmark recall at first 54 results = 0.8333; all returned citation IDs resolved. Truthfulness 9:119 misses the first 54 in English/Japanese but is rank 4 in Bengali. Charity 2:261 misses all three. These are ranking gaps, not missing verses. One earlier run hit a temporary 503 while dev work/production checks overlapped; final run completed with no retries.
- Reader checked at 360/390/430/768/1440. Japanese research tabs initially overflowed at 360/390; fixed and all five passed. Talk checked at 390 and desktop. Browser emulation only, not physical iPhone testing.
- English, Bengali, Japanese source selection, notebook/talk/check/export content verified; Bengali and Japanese whole-quotation checks returned 2 exact, 0 unresolved on the two selected passages. Example exports/screenshots saved.
- WebMCP tools registered and exercised: open_source_research, save_evidence_to_notebook, read_workspace_summary. Invalid search and nonexistent evidence rejected, without corrupting state.
- Markdown attachment API returned exact Unicode, proper attachment headers, and private/no-store. In-app browser's download event could not be verified; export content was read from the app's visible export dialog and preserved as files instead. Clipboard success toast appeared but independent clipboard read-back did not provide proof. Browser print-to-PDF has not been visually verified.
- Production build succeeded repeatedly; latest checkpoint build result is saved. Docker was not tested (not installed).

## Priority work when resumed

1. Restore and run the existing project. Confirm source/data checksums before any import. Use the saved browser-state JSON to recover the example notebook/talk if the new account's browser storage is different. The file is a data backup, not executable code; Sources → Restore device backup validates saved source text/attribution against the restored corpus before offering a merge. Existing notes and the current talk are preserved; a different talk is saved separately. A restore with more than two distinct talks is rejected without writing data.
2. Finish QA gaps: print/PDF diacritics and citations; full browser zoom, full dark-mode contrast and screen-reader audit. The 150/200% typography control, mobile/desktop overflow, dark appearance, visible select focus, and restored talk quotation checks in all three languages passed. Do not claim WCAG certification or scholarly review.
3. Improve measured retrieval recall without hardcoding benchmark answers. Qualifier/negation/narrator tests and retained original query wording are implemented. Search expansion is not semantic understanding. The result retry button now triggers a new request.
4. Broaden the hadith corpus with licensed/documented provider access and retain grading/numbering provenance. Current coverage is 42 narrations, not complete collections. Sunnah API key and Quran Foundation credentials were not used.
5. Exact selectable reference typography remains unproven. All original images are available now, so this must not block the reader. Research original publisher/calligrapher or validated per-page glyph mapping if needed; do not claim Amiri or any lookalike is exact. Original image redistribution permissions are not established for public deployment.
6. Complete requested features that are presently partial: richer sourced glossary, robust source candidate/publication/correction workflow, revision diffs and translated-edition notices, saved research jobs/progress, authenticated opt-in sync, richer cross-surah story emphasis with sourced commentary. Current story grouping is lexical mention discovery. Review API/UI works but has no actual identified review or configured token.
7. Optional semantic retrieval and AI synthesis are **not implemented/enabled**. No AI key is needed for current useful core. Reserved .env.example names are not integrated adapters. If added, verify current official provider docs, use server-side credentials, bounded costs, explicit source/claim maps, exact quote validation, and separate semantic-support evaluation. Connective text is an editable deterministic template, not model-generated scholarship.
8. Verify production data seeding and reuse rights before any authorized hosting. Private GitHub backup is not production deployment permission.

## Recovery commands

```sh
gh repo clone Tahmid447/ayah-atlas
cd ayah-atlas
gh release download checkpoint-2026-09-20-r2 --repo Tahmid447/ayah-atlas --pattern 'ayah-atlas-recovery-*.tar.gz' --pattern 'SHA256SUMS.txt'
shasum -a 256 -c SHA256SUMS.txt
# Prefer extracting the recovery archive into a separate empty directory.
# It contains an ayah-atlas/ directory with the complete checkpoint and .git history.
tar -xzf ayah-atlas-recovery-2026-09-20-r2.tar.gz -C /path/to/empty/recovery-directory
cd /path/to/empty/recovery-directory/ayah-atlas
npm run install:ci
python3 scripts/bootstrap-local.py
npm run dev -- --host 127.0.0.1 --port 4173
```

If the original directory still exists on the same Mac, use it directly; do not overwrite it with an extracted archive. Current guest browser state may already persist. The source corpus is ~197 MiB, publisher downloads ~109 MiB, and reference assets ~62 MiB; archive also preserves research materials. Do not delete the corpus assuming it is an empty fixture.

## Latest checkpoint fixes

Validated Sources → Restore device backup, streamed large backup export, preservation of existing/recovered drafts, strict scripture/translation/attribution checks, and rollback after storage failure. Original archive verified: 3,197 file hashes, restored SQLite integrity `ok`, 114 surahs/6,236 ayat. The release also supplies SHA256SUMS.txt and a verification report. Run `python3 scripts/verify-recovery.py /path/to/archive.tar.gz` with its checksum file alongside for a complete independent check. Source text and local browser notes were intact; no loss was found in the checked project/data.
