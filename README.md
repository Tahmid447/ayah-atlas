# Ayah Atlas

**Recovery checkpoint — 20 September 2026.** A working local Quran reader, published-source research workspace, evidence notebook, and cited talk studio. Progress is checkpointed for recovery across account changes. The user has resumed; implementation and verification continue from the preserved files.

Start with **[RESUME_HERE.md](RESUME_HERE.md)**. It records current state, outstanding work, verification, and recovery steps. The complete original brief is [PROJECT_SPEC.md](PROJECT_SPEC.md). This is a new project, unrelated to VideoScope.

## Run locally

Requires Node 22.13+ (Node 24 recommended for the native TypeScript test runner), npm, and Python 3. The delivered recovery archive includes the validated corpus; a source-only Git clone needs the data archive from the private GitHub release.

```sh
npm run install:ci
python3 scripts/bootstrap-local.py
npm run dev -- --host 127.0.0.1 --port 4173
```

Open http://localhost:4173. No external API key is required. The development server was left running at checkpoint time; do not start a duplicate if that URL already works.

Production build and local production server:

```sh
npm run build
npm start -- --port 4183
```

Optional `docker compose up --build` is provided, bound to localhost. Docker was not installed on the delivery host, so this path is **not tested**.

## Included library

- Tanzil Uthmani 1.1: 114 surahs, 6,236 ayat, canonical checksums and metadata.
- Five complete published translations: English Rowwad and Noor International; Bengali Abu Bakr Zakaria and Rowwad; Japanese Saeed Sato.
- Full ayah coverage from Arabic/Bengali/Japanese Al-Mukhtasar and English Ibn Kathir (Abridged), preserving shared commentary ranges.
- 42 imported hadith narrations, with published text, provenance, reported grades, and verified benchmark numbering. **Not complete hadith collections.**
- 755 original eQuran reference GIF assets, with source manifest and hashes. Original page mode preserves the reference; selectable study and quotation text use a separately identified Uthmani font. Exact digital reference-font identification remains unproven.

See [data/coverage.json](data/coverage.json), the Sources screen, and [docs/TYPOGRAPHY.md](docs/TYPOGRAPHY.md).

## Integrity and privacy

Published text is immutable. Search normalization is derived. There are no generated Quran translations or fabricated hadith grades. No scholar review is claimed. The software checks exact text and references; it does not certify semantic support or adjudicate interpretations.

Notes and talks stay in the browser. Sources → **Export device backup** preserves them as JSON before switching accounts or devices. `docs/test-results/device-workspace.json` contains the checkpoint's example notebook and talk. Server caches contain public source content only. Editorial tokens are server-side and never saved in browser storage.

No production website was deployed. No paid service, billing change, or external AI call was made. The private GitHub repository/release is a recovery backup, not a published website.

## Development

```sh
npm run typecheck
npm run lint
npm test
npm run test:integrity
python3 tests/import_security.py
npm run test:research
```

API tests need the local server on port 4173, or `TEST_BASE_URL` pointing to a running instance. Import scripts and maintenance: [docs/MAINTENANCE.md](docs/MAINTENANCE.md). Actual test results and known gaps: [docs/VERIFICATION.md](docs/VERIFICATION.md).
