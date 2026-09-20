MASTER BUILD PROMPT: AYAH ATLAS

1. Role, mission, and working agreement

You are the lead full-stack engineer, product designer, search engineer, and content-integrity engineer for a new Quran reading and research platform.

Working product name: Ayah Atlas. Keep branding configurable.

Build a complete working application, not a landing page, mockup, generic chatbot, or collection of disconnected demos. This is a NEW project. Do not modify, deploy over, or reuse the identity of my existing VideoScope project.

The product has three equally real pillars:

Read the complete Quran using the exact Arabic typography shown in my reference.

Understand each ayah through published Bengali, English, and Japanese translations.

Research an ayah, topic, or prophetic story across the Quran, published tafsir, and hadith, then assemble a source-linked study or talk.

The third pillar is the differentiator. Treat it as a research workspace, not an AI answer box attached to a reader.

Make sensible design and implementation decisions independently. Add the beneficial features specified below without repeatedly asking for permission. Do not spend on services, change billing, or publish production deployments without explicit authorization for those actions.

Start by inspecting the available repository, assets, tools, credentials, and runtime. Preserve relevant existing work in this new project's repository. Create a concise AGENTS.md containing the enduring content-integrity rules and test commands; save this full specification as PROJECT_SPEC.md and maintain an implementation checklist. Then implement and test; do not stop after planning.

When an external dependency is unavailable, isolate it, continue all independent work, and record the exact missing configuration. Never replace unavailable religious content with invented material or claim an unrun test passed.

2. Reference inputs and exact Arabic typography

REFERENCE_IMAGE: [Attach the original Quran reference image to this Codex task.]
REFERENCE_SITE_URL: [Paste the exact reference website URL here.]

These references determine the Arabic appearance. They do not require copying the source site's entire interface.

Inspect the actual image and source website before selecting the Arabic rendering implementation. Identify the font family, font version, associated text representation, script style, and relevant layout behavior. Inspect source CSS and published font documentation when available. A visual resemblance alone is not proof of an exact font match.

Determine whether the reference uses normal Unicode text, page-specific glyph fonts, or a different rendering system. Quran Foundation documents both Unicode and page-specific QCF approaches. Match the text representation and font correctly; do not apply a glyph font to unrelated Unicode data.

Preserve the requested letterforms, diacritics, pause marks, ligatures, and verse markers. Keep the same Arabic typography in reader, verse details, research quotations, and print layouts. Improve navigation and spacing without replacing the requested font with a convenient alternative.

For page-specific glyph rendering, implement the correct page-to-font mapping and retain canonical Unicode for copying, accessibility, and search. Never expose meaningless glyph codes as copied Quran text.

Create a typography comparison page showing representative passages beside the supplied reference. Check tall diacritics, long ayat, verse markers, mixed-direction text, font loading, zoom, and mobile rendering. Avoid clipped marks, synthetic bold, arbitrary letter spacing, and distorted letterforms.

If the reference is missing, do not guess its identity or claim a match. Keep the renderer replaceable, continue the rest of the application, and mark exact-font verification as pending. Any temporary fallback must be visibly identified rather than silently presented as the requested font.

3. Canonical Quran data and integrity

Use a versioned, traceable Quran dataset from a documented publisher. Tanzil and Quran Foundation are starting points; choose the representation compatible with the reference and document the decision.

Store the source text immutably. Never ask a language model to generate, complete, spell-correct, or reconstruct the Quran.

Implement the complete 114-surah reader. Validate the complete verse inventory against the selected edition's manifest, including surah order, ayah identifiers, and its basmalah/numbering conventions. Do not combine datasets with incompatible numbering without an explicit mapping.

Separate canonical text, display glyphs, and normalized search text. Search normalization must never alter the displayed or exported source text.

Record publisher, edition, script/reading designation, version, retrieval date, source URL, and checksums. Detect truncated imports, duplicate ayat, missing verses, encoding damage, and mismatched translations. A partial import must not appear as a complete Quran.

Stage source updates, validate differences, and promote them atomically. Preserve earlier versions needed to reproduce saved citations.

4. Pillar one: an excellent Quran reader

Provide two connected modes: a calm continuous Arabic reading mode and an ayah-by-ayah study mode. Add a reference-faithful page mode when the supplied rendering assets support it.

Include surah navigation, juz navigation from verified metadata, direct surah lookup, bookmarks, last-read position, font-size and line-height controls, light/dark themes, and stable shareable verse links.

Selecting an ayah should reveal translation, explanation, related topics, copy-with-reference, save-to-notebook, and research-this-ayah actions. Returning from research must preserve the reader's position.

Keep Arabic visually primary. Show translations beneath the relevant ayah, with optional side-by-side comparison on wide screens. Use whitespace and gentle separators rather than underlining Arabic in a way that interferes with diacritics.

Allow reading and basic study without an account. Add consent-based local offline packs for already-validated text and translations, subject to the source's redistribution terms. Clearly indicate what is available offline.

5. Pillar two: Bengali, English, and Japanese translations

Bengali, English, and Japanese are first-class languages for the interface, translations, research, and notebook workflow. Arabic remains the original scripture language.

Integrate at least one complete published Quran translation in each target language. Initial candidates to evaluate are Bengali Abu Bakr Zakaria and Rowwad editions, English Rowwad or Noor International editions, and Japanese Saeed Sato, as listed by QuranEnc. Discover actual resource identifiers and versions from the current provider rather than inventing them.

Choose and document sensible default editions based on identifiable authorship, editorial provenance, completeness, and readability. Do not call any translation universally the simplest or most authentic without a defensible basis. Make the selected translator visible and allow switching between available editions.

Preserve the published wording and footnotes. A simplified explanation is a separate layer, not a silent rewrite of an attributed translation.

Each translation record needs language, translator/team, publisher, edition/version, source URL, canonical ayah key, footnotes, and content checksum. Do not splice different editions together without disclosure.

Implement independent interface-language and translation-language settings. Support one translation or a comparison of two or three. Preserve the selected ayah when changing languages.

Provide a sourced glossary for unfamiliar terminology. Use suitable Bengali and Japanese UI fonts, while preserving the exact requested Arabic font. Verify Bengali shaping, Japanese line breaking, punctuation, and bidirectional isolation.

Published translations must not be replaced by an LLM's own Quran translation. Missing commentary or hadith translations should be labeled accurately; any optional machine-assisted reading aid belongs in a separate, clearly identified field with its source-language text accessible.

6. Pillar three A: verse-by-verse explanations

Every ayah must have an explanation entry point. Ingest at least one complete published tafsir with coverage mapped to the entire selected Quran inventory. A tafsir passage may cover an ayah range; preserve that range and do not pretend it is an individual commentary on every verse separately.

Evaluate available published works such as Al-Mukhtasar, Al-Muyassar, Tafsir al-Sa'di, and Tafsir Ibn Kathir in identified editions. These are candidates, not proof that every edition, translation, or API is available. QuranEnc lists Bengali and Japanese Al-Mukhtasar commentary; verify actual retrievable coverage during integration.

Present three reading depths: a brief orientation, an easy explanation, and a detailed source view. Use existing published explanations where suitable. Any AI-assisted condensation must be labeled as a summary, tied to exact source passages, and kept separate from quotations.

Explanation panels should cover the main subject, important terminology, surrounding passage, relevant cross-references, and documented interpretive differences. Include circumstances of revelation only when a cited source supplies them, with the report's status represented accurately.

Where sources disagree, show attributed positions and their context. Do not invent consensus, collapse differing interpretations into one quotation, or imply that software has settled a scholarly dispute.

For each explanation, display work, author, edition, language, passage/volume/page or stable digital locator, publisher link, and review state. Distinguish faithful source reproduction from human-reviewed interpretation.

Document the scholarly traditions represented in the initial collection. Do not portray a selected corpus as encompassing every Islamic interpretive tradition.

7. Pillar three B: multilingual topic research

Build natural-language research across all indexed Quran text, translations, tafsir, and hadith, not just the current surah or the first few search results.

Support topics such as qualities of a believer, hypocrisy, honesty, lying, gossip, backbiting, charity, justice, parents, patience, gratitude, repentance, and stories of prophets. Accept questions in Bengali, English, and Japanese, plus Arabic terms and common transliterations such as mu'min, munafiq, ghibah, and namimah.

The system should understand related terms while preserving distinctions. Do not treat backbiting, slander, and malicious tale-bearing as interchangeable. Where a question is broad, organize the relevant subtopics rather than silently choosing an unrelated interpretation.

Return a structured research dossier containing:

A plain-language orientation with citations and a clear description of the question's scope.

Directly relevant Quran passages, additional related passages, and surrounding context.

Published tafsir explanations connected to those passages.

Relevant hadith with exact references and attributed grading information.

Source-supported stories or examples, practical themes, related questions, and a reusable bibliography.

Each result must explain why it is relevant. Clearly distinguish direct textual support, a published scholar's interpretation, and a broader thematic connection.

Retrieve complementary passages across multiple surahs where relevant. Deduplicate quotations without hiding genuinely different narrations or interpretations. Provide pagination and source filters; do not truncate the whole research experience to five attractive cards.

For questions framed around punishment, distinguish a prohibition, moral warning, specified consequence, and a scholar's interpretation. Retrieve relevant repentance or contextual material rather than generating a dramatic punishment that the cited text does not establish.

Display searched corpus, editions, language coverage, and unsearched or unavailable sources. Say 'references found in the indexed sources', not 'every reference in Islam'. Explain evidence gaps without filling them with guesses.

8. Source selection and authenticity methodology

Implement a source registry, not an unrestricted web scrape presented as scholarship.

Evaluate candidates through identifiable authorship, publisher provenance, edition fidelity, exact citations, explicit scholarly methodology, and documented review. Popularity, follower counts, likes, and search ranking must not serve as authenticity scores.

Store source type, author/editor, publisher, language, edition/version, canonical URL, retrieval date, attribution requirements, reuse terms, editorial scope, and import/review status. Build the attributions and source-information screens as part of the product.

Use the wider internet for discovery and corroboration. Newly discovered material enters a candidate-review queue rather than automatically becoming authoritative evidence. An indexed page or search snippet alone is insufficient for a quotation: retrieve the underlying passage.

Keep contemporary lectures in a separately attributed layer. Material from a speaker such as the user-mentioned Nouman Ali Khan must have an identifiable original lecture or publication and an accurate timestamp or passage locator. Do not fabricate quotations, imply endorsement, or use a speaker's popularity to authenticate a hadith.

For hadith, store the collection, book/chapter, narration identifier, numbering scheme, narrator when supplied, original Arabic, published translation, source locator, and grade as reported by an identified source or grader. Preserve alternate numbering and variant narrations.

Never generate hadith grades from model confidence. Where grading differs, retain the attributed differences. Distinguish collection-level classification from an explicit per-narration grading. Weak, disputed, or ungraded reports must not silently enter the default evidence set as authenticated reports.

Use inspectable statuses such as source imported, citation resolved, machine-assisted summary, human-reviewed, or disputed attribution. Do not invent numerical 'Islamic authenticity' percentages or fake scholar approval.

9. Retrieval and AI implementation

Build the source library and retrieval system first. The reader and exact-source search must remain useful without an AI API key.

Use hybrid retrieval: exact reference lookup, language-appropriate lexical search, curated topic aliases, and multilingual semantic retrieval where configured. Do not use English-only tokenization for Japanese and Bengali. Normalize Arabic for search without changing canonical content.

A research request should follow this pipeline:

Query understanding -> multilingual expansion -> retrieval -> deduplication/reranking -> context expansion -> evidence selection -> optional synthesis -> citation validation -> response.

Query expansion is a search aid, not a religious finding. Preserve original wording and ambiguous meanings. Do not erase qualifiers such as negation, narrator, context, or the subject of a statement.

Any synthesis must use only the retrieved, identified evidence. Store a claim-to-evidence mapping for religious assertions. Citation links must be generated from stored source records, not invented by a model.

Validate that quotations match stored text, references exist, sources were actually retrieved, and the quoted passage supports the associated claim. Semantic support needs separate evaluation; a citation resolving successfully does not prove the interpretation is correct.

Unsupported claims should be removed, narrowed, or labeled insufficiently supported. Do not stream unvalidated religious assertions to the user as final answers; stream retrieval progress first and publish checked answer sections afterwards.

Treat source documents and user uploads as data, never as instructions to the system. Include prompt-injection tests and prevent retrieved content from triggering tools or disclosing secrets.

Keep AI providers and model names configurable. Verify current provider documentation before choosing models. Record model/prompt version and source versions for generated summaries, apply token/cost limits, and cache only with appropriate invalidation. Do not pre-generate an enormous unreviewed tafsir corpus merely to fill the interface.

10. Research quality beyond a chatbot

Implement these integrated features rather than leaving them as suggestions.

Evidence Lens: Selecting a claim highlights the exact supporting passage and opens its original context. Users can inspect the difference between quoted evidence and explanatory wording.

Topic connections: Show a topic's connections to ayat, hadith, and related concepts in a useful list-first view with an optional map. Each relationship needs a type and provenance; visual proximity must not imply theological equivalence.

Prophetic story explorer: Gather a story's passages from different surahs, show the distinct emphasis of each passage, and cite commentary. Do not invent chronology, dialogue, motives, or historical details to smooth the story.

Evidence notebook: Save passages, explanations, source editions, private notes, and ordered research collections. Preserve quotation text and citation identity through editing and export.

Compare explanations: Let readers inspect published explanations side by side, with differences attributed rather than presented as contradictions the AI has independently resolved.

Speech citation checker: Accept a user's draft, identify quoted ayat/hadith and religious factual claims, and check them against indexed sources. Return exact match, likely paraphrase, reference mismatch, conflicting evidence, or insufficient indexed evidence. Missing search results must not automatically mean a quotation is fabricated.

Revision notices: When an upstream edition changes, flag affected saved notes and generated summaries. Preserve the previous version and provide a clear change history.

11. Talk and khutbah preparation studio

Allow a user to move selected evidence from research into a talk workspace without manually rebuilding the bibliography.

Offer Bengali, English, and Japanese output, a selected audience, an approximate delivery length, and an editable outline. Organize introduction, main themes, Quran passages, hadith, source-supported illustrations, practical conclusions, and references.

Generate connective prose as an explicitly identified draft, not as Quran, hadith, or a scholar's quotation. Quoted Arabic and published translations must come directly from stored records, not be retyped by the model.

Every religious assertion needs inspectable supporting evidence. Do not force every topic to have a story when no appropriate sourced story was retrieved. Keep private user reflections distinct from source-based statements.

Include rehearsal/presentation view, adjustable text size, numbered references, copy-with-citations, Markdown export, and print-ready HTML/PDF through the browser's print workflow. Verify Arabic typography, direction, and citation preservation in exports.

Make citation checking part of the workflow before sharing. Human scholarly approval must appear only after an actual identified review; the product is research assistance, not a self-declared religious authority.

12. Concrete gossip/backbiting acceptance scenario

Implement a real end-to-end workflow for this request:

'I am preparing a talk about gossip and backbiting. Find relevant Quran passages, hadith, accessible explanations, and practical lessons with references.'

Create equivalent Bengali and Japanese test queries.

The research should retrieve Quran 49:12 and Sahih Muslim 2589 as benchmark references, then discover additional relevant material from the indexed corpus. These are benchmark seeds, not the entire answer. Retrieve their actual text from the identified sources.

The result must distinguish relevant speech-related concepts, show Quran context, supply hadith reference information, connect explanations to their published sources, and avoid inventing unsupported penalties or anecdotes.

The user must be able to open the evidence, save selected items, create a talk outline, edit the draft, check citations, and export without losing Arabic, translation attribution, or references.

Also test a hypocrisy-related query using Sahih al-Bukhari 33 as one benchmark. Do not turn general characteristics into judgments declaring a named living person a hypocrite.

13. Content model and traceability

Create a relational schema covering sources, editions, import runs, surahs, ayat, display glyph mappings, translations, tafsir passages and ayah-range mappings, hadith, numbering aliases, attributed gradings, topic aliases, evidence relationships, research sessions, claims, citations, notebooks, talk drafts, and editorial reviews.

Separate immutable source records from derived summaries and private user content. Every derived item must retain its parent source IDs and versions. Model one passage supporting several ayat and several sources supporting one claim without duplicating or corrupting source text.

A citation must include a stable internal ID, source edition, exact locator, supported text span where applicable, canonical external link, and access/version metadata. Keep deep links usable after index rebuilds.

Expose a content coverage report by source, edition, language, and surah/ayah range. Distinguish imported source coverage, available summaries, and human-reviewed coverage. Never label these three as equivalent.

14. Architecture and API

Prefer a maintainable modular monolith over unnecessary microservices. A sensible default is TypeScript, a modern React/Next.js frontend and application server, PostgreSQL, and a background worker for ingestion and expensive indexing. Use a suitable multilingual search implementation; add vector retrieval only when it improves measured results.

Keep clear modules for reader, typography, source ingestion, translation, tafsir, hadith, search, synthesis, citations, notebooks, exports, and review. Provide Docker-based local setup where it simplifies reproduction.

Implement real APIs for chapter/verse retrieval, translation and explanation lookup, reference/topic search, research jobs and progress, notebooks, talk drafts, citation checks, coverage, and protected editorial actions. Validate input and return typed, structured errors.

External credentials belong on the server. Do not run long import jobs inside unsuitable short-lived requests. Use bounded retries, resumable imports, rate-limit handling, idempotent upserts, and source-version-aware caching. One unavailable provider should not erase an already-validated local corpus.

Do not assume Netlify must host every component. Choose deployment based on the actual application and worker requirements, document it, and avoid gratuitous additional services.

15. Design, accessibility, and privacy

Create a calm, polished reading environment, not a cluttered analytics dashboard. Use an understated editorial design, generous space, restrained decorative geometry, excellent contrast, and clear hierarchy. Keep scripture, translation, commentary, and personal notes visually distinct.

Primary navigation: Read, Explore Topics, Research, My Notebook, Prepare a Talk, and Sources. On mobile, use simple navigation and progressive disclosure rather than squeezing desktop panels onto a phone.

Support keyboard operation, screen readers, visible focus, reduced motion, accessible labels, and sufficient contrast. Target WCAG 2.2 AA and test rather than merely displaying a compliance claim. Arabic blocks need correct language/direction metadata without reversing Bengali, English, Japanese, or Latin references.

Test at 360, 390, 430, 768, and 1440 pixel widths. Preserve state between reader, research, and notebook. Show meaningful loading, empty, offline, and failure states. No fake counters, fake review badges, or decorative buttons without actions.

Keep guest notes locally unless the user enables account sync. Store private research separately from public caches; never expose one person's query or notebook to another. Provide deletion and export controls. Use privacy-preserving operational logs, not public logs of sensitive religious questions.

16. Editorial workflow and server security

Implement protected source import, review, correction, and publication workflows. A community correction creates a review item; it must not directly rewrite canonical scripture or published translations.

Require identified reviewer actions, timestamps, review scope, and revision history. Source approval must be distinct from approving a generated interpretation. Corrections should invalidate affected summaries and notify saved-record owners where appropriate.

Protect admin routes, database access, secrets, and any user accounts. Sanitize source HTML without altering source wording. Guard import URLs against SSRF, validate redirects, and reject internal-network targets. Apply rate limits and bounded job sizes. Do not trust imported scripts, lecture transcripts, or scraped markup.

17. Testing and acceptance gates

Create automated integrity, unit, integration, and browser tests. Separate mocked tests, live-source integration tests, and human review. Report each honestly.

Required gates:

A. Data: complete selected Quran inventory; stable ayah mappings; no duplicate/missing verses; validated source checksums; complete primary translations in all three languages; actual tafsir range coverage; source failure and interrupted-import recovery.

B. Typography: verified reference/font mapping when supplied; correct glyph pages; readable diacritics; correct Unicode copy; no clipping at mobile widths or zoom; accurate print rendering. Browser emulation must not be described as testing on a physical iPhone.

C. Research: at least 30 evaluated queries spanning the three target languages, with cited expected evidence prepared from the sources. Test cross-surah retrieval, transliteration, Japanese/Bengali query handling, ambiguous terms, contradictory premises, and irrelevant keyword matches. Do not hardcode final answers for benchmark questions.

D. Citations: zero fabricated references in the evaluation set; exact quoted-text matching; correct editions/numbering; no invented grades; unsupported-claim handling; source context access; evidence preserved through editing and exports. Record retrieval recall and citation-support results, not only whether the API returned HTTP 200.

E. End-to-end: open an ayah, change translations, read its explanation, research a topic, inspect a citation, save evidence, prepare a talk, run the citation checker, and export. Repeat in each primary language.

F. Failure/security: unavailable APIs, missing credentials, rate limits, malformed source HTML, prompt injection, invalid URLs, unauthorized admin access, cross-user isolation, and AI service failure with the core reader/search still usable.

A working interface does not prove content accuracy. Automated checks do not substitute for an actual scholarly or linguistic review. Report these dimensions separately.

18. Implementation order and deployment discipline

First inspect inputs and preserve the project specification. Then build a working vertical slice: one correctly rendered passage, three real translations, a published explanation, a real topic search, and a clickable source citation.

Next complete and validate the corpus imports, expand search across the full indexed data, and implement source-backed synthesis. Then integrate notebooks, the talk studio, citation checking, editorial workflows, and polished mobile/offline behavior.

Run linting, type checks, tests, production builds, and local end-to-end verification before any deployment. Fix root causes instead of repeatedly publishing broken builds. Keep a cost-conscious architecture and document external usage limits.

Do not treat fixture data as the production corpus. Do not mark empty source adapters as integrated. Do not call a feature complete because its button appears.

19. Deliverables and completion report

Deliver the working source repository, dependency lockfiles, environment-variable examples, schema/migrations, provider adapters, reproducible import/index scripts, source registry, coverage report, tests, local setup, deployment configuration, and maintenance documentation.

Provide a final table containing feature, implementation status, test actually run, result, and remaining dependency. Include concrete evidence of the reader-to-research-to-talk workflow, with screenshots or test artifacts where available.

Report actual provider access and imported versions; do not imply that documentation inspection proves live API access. Report exact-font verification separately when the reference was unavailable. State any incomplete coverage plainly while delivering all functioning work.

Success means a person can read the Quran beautifully, understand an ayah in Bengali, English, or Japanese, investigate a topic across connected sources, inspect where every religious claim came from, and prepare a useful cited talk without the application inventing scripture, scholarship, or evidence.

20. Official documentation and source starting points

Check current documentation, catalog availability, credentials, and content terms before integration. These are starting sources, not a claim that every endpoint has already been tested in this project.

Quran text:
https://tanzil.net/download/
https://tanzil.net/docs/Text_License

Quran Foundation content and rendering:
https://api-docs.quran.com/
https://api-docs.quran.com/docs/tutorials/fonts/font-rendering/
https://api-docs.quran.com/docs/content_apis_versioned/4.0.0/list-surah-tafsirs/

QuranEnc translation catalog and API:
https://quranenc.com/en/home
https://quranenc.com/en/home/api/

HadeethEnc official API documentation:
https://github.com/islamhouse-dev/hadith-api
https://documenter.getpostman.com/view/5211979/TVev3j7q

Sunnah.com developer documentation:
https://sunnah.com/developers
Its documented API requires a key and covers a portion of its data; verify current scope rather than assuming full access.

Benchmark reference pages:
https://quran.com/al-hujurat/12
https://sunnah.com/muslim:2589
https://sunnah.com/bukhari:33

Accessibility standard:
https://www.w3.org/TR/WCAG22/

Codex project instructions:
https://developers.openai.com/codex/guides/agents-md/

Begin implementation now. Make reasonable engineering decisions, maintain the source-integrity rules, and carry the project through actual verification rather than returning only another proposal.