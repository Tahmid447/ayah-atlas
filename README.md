# Ayah Atlas

**Unified workspace — 26 September 2026.** Quran reader, published-source research, notebook and talk studio, with Famous Quran recitations at `/famous/`. Both areas share original-page annotations and an account workspace. See [the merge and deployment record](docs/MERGE_DEPLOYMENT.md) for current deployment and account activation status; the September 20 recovery release remains preserved.

Live: **https://famous-quran.vercel.app/** · Recitations: **https://famous-quran.vercel.app/famous/index.html**. Vercel Hobby, no paid upgrade. Google sign-in is configured through the approved Supabase project. Guest reading, notes and annotations remain available without an account. Open a surah’s annotation studio for a separate device copy; use Apply to reader only when you want those marks in your personal reader.

Start with **[RESUME_HERE.md](RESUME_HERE.md)**. It records current state, outstanding work, verification, and recovery steps. The complete original brief is [PROJECT_SPEC.md](PROJECT_SPEC.md). This is a new project, unrelated to VideoScope.

## Run locally

Requires Node 24 and npm. The current Git repository includes the compressed corpus in verified parts; the historical release also preserves raw publisher downloads. Python 3 is needed only for corpus maintenance and integrity scripts.

```sh
npm ci
node scripts/prepare-deployment.mjs
npm run dev -- --hostname 127.0.0.1 --port 4173
```

Open http://localhost:4173. No external AI API key is required. Check for an existing server before starting a duplicate.

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

Guest notes and talks stay in the browser. Accounts use separate device caches and private Supabase rows; guest work is copied into an account only by an explicit choice. Public sign-in activation is tracked in the merge record. Account & sync offers a combined JSON export; Sources retains its validated Atlas backup restore. `docs/test-results/device-workspace.json` contains the historical example notebook and talk. Source content remains immutable; production editorial writes are not enabled.

Hosting uses the existing Famous Quran Vercel Hobby project, with no paid upgrade or external AI calls. The private source repository and recovery release are separate from the public website.

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

## Durable backup

Private source repository: https://github.com/Tahmid447/ayah-atlas

Latest full recovery archive, checksum, and verification: https://github.com/Tahmid447/ayah-atlas/releases/tag/checkpoint-2026-09-20-r2

The archive includes source history, the validated database, original publisher downloads, reference images, research materials, and device-workspace backup. Another ChatGPT account still needs access to this GitHub repository or the downloaded archive. Resume with `RESUME_HERE.md`; do not recreate the project.
