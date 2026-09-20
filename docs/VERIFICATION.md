# Verification at recovery checkpoint

This report separates software behavior, imported source integrity, and scholarly/linguistic review. Last category: **none performed**.

| Feature | Implementation status | Test actually run | Result | Remaining dependency/gap |
|---|---|---|---|---|
| Complete Quran | Working, Tanzil Uthmani 1.1 | 11-test integrity suite: inventory, checksums, metadata, constraints | 114 surahs / 6,236 ayat | Human source/rendering review |
| Reference appearance | Original GIF page renderer | All 755 asset hashes; supplied p566 compared visually | Faithful original page asset | Exact selectable font and per-ayah image boxes unproven |
| EN/BN/JA translation | Five complete editions | Integrity coverage; live API; browser language changes | Complete 6,236 per edition | Professional linguistic QA; latest selection-preservation change merits E2E repeat |
| Tafsir | Four full-coverage editions | Range coverage and original context tests | Every ayah mapped; 1,896 shared Ibn Kathir passages retained | Selected Sunni corpus; print edition ID missing for Ibn Kathir digital resource |
| Hadith | 42 selected narrations | Numbering/source/grade tests; Muslim2589, Bukhari33 | Actual source text and attributed grades | Broader collection/provider access |
| Research | Exact/FTS/aliases/CJK search, pagination, filters | 30 live local queries across three languages | Recall@54 0.80; all returned IDs resolve | Improve honesty/charity ranking; no human semantic-support scoring |
| Story explorer | Cross-surah published mention groups | Japanese Musa API groups across >5 surahs | Pass | Richer sourced emphasis/relationships; no invented timeline |
| Notebook/talk | Working local snapshots, notes, editing, outline, rehearsal | UI save→notebook→talk in three languages | Bengali/Japanese full-quote checks: 2 exact, 0 unresolved | Device backup import UI; opt-in authenticated sync |
| Citation checking | Exact quoted text, normalized matches, numbering; insufficient-evidence statuses | Real verses/narrations, invalid references, altered complete quotes | 18 unit/API/offline tests pass before final backup UI addition | Semantic support/conflicting interpretations require separate work |
| Export | Markdown dialog + attachment endpoint; print CSS | Exact Unicode/API headers; UI export content saved as EN/BN/JA artifacts | Content/attribution preserved | In-app download event/clipboard read-back not verified; print/PDF visual QA pending |
| Offline | Atomic verified text+translation cache | Production server stopped; reload; another chapter + Japanese text | Pass | GIF/tafsir/research not in browser pack |
| Responsive | Reader and research all five target widths | Browser 360/390/430/768/1440; talk390 +desktop | Research overflow repaired; no document overflow | Physical device and full AA audit not run |
| Security | Allowlisted imports, prevalidated redirects, rate limits, admin token, plain-text rendering | 4 mocked import tests; API unauthorized/admin and injected-query tests | Pass | Authenticated-user isolation not applicable yet; live throttling stress not run |
| Editorial/revisions | Pending corrections, named protected decisions, source versions | Unauthorized admin401; source registry reads | Working restricted endpoints | Full candidate/publish queue, real reviewers, correction invalidation |
| Agent tools | Three WebMCP actions | Real registration, valid navigation/save, invalid queries/references | Pass | None for tested tools |
| Production build | Cloudflare-compatible bundle | Repeated five-stage Vinext build + running production health | Pass | New deployment/data seeding not attempted |
| Docker | Configuration supplied | Docker not installed | Unrun | Docker host |
| Scholarly/linguistic review | None claimed | None | Not reviewed | Qualified identified reviewers |

Source reports: `data/coverage.json`, `data/reference-pages.json`, `docs/test-results/research-evaluation.json`. Screenshots: reader-desktop, research-desktop/mobile, talk-english/japanese, offline-reader. Device state and talk exports are in docs/test-results.

One earlier retrieval rerun failed with temporary HTTP503 while dev/build/offline checks overlapped. The evaluator now retries 429/503 with a bounded policy and records them. Final 30-query run completed with zero transient failures. No expected answer is inserted into search results.

The generic draft is a deterministic editable scaffold. No external model was called and no semantic model is enabled. Source text and references being intact do not make a draft's interpretation verified.
