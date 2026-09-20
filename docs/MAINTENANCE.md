# Maintenance and reproducibility

## Importing and updating

`python3 scripts/imports/corpus.py` downloads/stages/validates source editions and constructs immutable records and derived FTS indexes. Existing validated corpus remains available when a provider fails. Raw downloads are preserved in data/raw. Previous canonical database versions are retained in data/archive on promotion. `python3 scripts/imports/pages.py` resolves the original site's actual linked GIF URLs and records SHA-256 digests and section metadata. Do not substitute generated scripture or a different source silently.

`python3 scripts/seed-local.py` seeds a **fresh** local D1 from the validated corpus. It intentionally refuses to replace a database containing editorial reviews, notebooks, talks, or research sessions. Export/migrate those records and retained editions before future corpus promotion. The current local bootstrap detects an existing source library and leaves it untouched. Migrations are in drizzle/; schema in db/schema.ts. FTS indexes are created by the import script, not Drizzle.

Source stages: immutable downloaded bytes → parsed source records → inventory/checksum validation → atomic corpus promotion → local D1 installation. Topic aliases are editorial search aids. Changes to alias/ranking logic require retrieval evaluation, not source-text modifications.

## Source access actually used

Tanzil official XML download and metadata; QuranEnc downloadable SQLite editions; Quran.com public content API for resource 169; HadeethEnc documented API plus original Sunnah.com benchmark pages. All were fetched during this task; see data/raw and edition registry. Quran Foundation authenticated API, Sunnah developer API, and AI providers were **not** integrated. No secret keys were configured.

The live QuranEnc catalog omits some retrieved Bengali/commentary resources. The app discloses these omissions rather than treating absent catalog entries as deleted editions. Check publisher pages and actual downloadable version metadata before changing versions.

## Local editorial review

Create a server-only `.dev.vars` file with a random EDITORIAL_TOKEN of at least 32 characters, restart the local server, and use Sources → editorial review. Do not commit the token. Public corrections are pending review items; only bearer-authorized named reviewers can record decisions. Source approval, citation approval, and interpretation approval have separate scopes. Decisions never directly rewrite scripture. A complete candidate import/publish UI and sophisticated correction invalidation are still outstanding.

## Backups and private state

Canonical/source downloads are reproducible but retained in the recovery release for independence from future provider changes. Original assets and manifests are tracked. Large SQLite/raw/research directories are excluded from Git and included in the recovery archive. Archive excludes node_modules, dist, caches, local secrets, and transient runtime files.

Guest notes/talks/preferences are localStorage entries beginning `atlas.`. Sources → Export device backup exports those entries, without editorial tokens. The recovery file is `docs/test-results/device-workspace.json`. Only restore recognized keys after validating the object/format; do not evaluate backup content as code. Sources → Restore device backup now validates format, content checksums and source provenance, then merges notes and preserves a different active talk. Repeated restores cannot overwrite a second recovered talk; keep all JSON backups. The active browser's storage is not guaranteed to follow a ChatGPT account change.

Use SQLite's backup API for a consistent live database snapshot; do not copy only a database file while discarding its WAL. The checkpoint records review rows separately because canonical data can be reinstalled.

## Publication and rights

No deployment is authorized by this checkpoint request. The build emits a Cloudflare Worker and asset directory. D1 binding DB is declared; remote resource provisioning and corpus seeding must be verified before hosting. Keep hosting manifests free of made-up project IDs. Never reuse VideoScope's project.

Preserve Tanzil attribution/license, QuranEnc/HadeethEnc publisher terms, DigitalKhatt OFL/MIT notices, and font provenance. The original GIF site's copyright holder and public redistribution license were not identified. QPC font provenance is documented, but a full deployment rights review remains outstanding. Public availability is not blanket redistribution permission.

## Limits

Reader and lexical search require no external key. Synced user accounts, embeddings, optional model synthesis, asynchronous research jobs, and broad scholarly source coverage are not present. Docker configuration is an untested convenience. Do not label any of these as integrated merely because the schema or environment example has a reserved field.
