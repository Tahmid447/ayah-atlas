# Quran reference font research — 2026-09-20

## Conclusion

No provable exact digital-font, edition, publisher or calligrapher identification was found for eQuran Institute p566.gif. It is GIF87a, 720 × 1080, and the HTML embeds the Quran as images. The HTML's Amiri Google Font is not evidence about the lettering in the scan. Preserve the original raster when exact appearance is required. The observed family is South Asian IndoPak Quran calligraphy; this is a style identification, not a font identification.

Source: https://www.equraninstitute.com/quranreading/068_alqalam_565_568.htm
Image: https://www.equraninstitute.com/quranreading/quraan_images/p566.gif

QUL's Qudratullah 15-line layout page 565 has the same verse boundaries (68:7–31) as the reference's printed 566. This is useful layout evidence, not proof of the same edition or handwriting. QUL's layout-page numbers, printed page numbers, and image filenames can differ. Do not blindly equate them.
https://qul.tarteel.ai/mushaf_layouts/6?page_number=565

## Recommended documented digital alternative: DigitalKhatt IndoPak

Font origin: https://github.com/DigitalKhatt/indopakfont
Its README says it is based on Quraan Al Majeed 13-line IndoPak Mushaf. Therefore it is not established as the exact font of the 15-line reference.

Official QUL font documentation: https://qul.tarteel.ai/resources/font/568
Direct font: https://static-cdn.tarteel.ai/qul/fonts/dk/DigitalKhattIndoPak.otf
Downloaded name-table metadata: DigitalKhatt IndoPak Regular; Version 0.1; © 2024 Amine Anane, © 2024 Tarteel Inc.; SIL Open Font License 1.1.
License: https://github.com/DigitalKhatt/indopakfont/blob/main/LICENSE
Raw license: https://raw.githubusercontent.com/DigitalKhatt/indopakfont/main/LICENSE
Retain license and copyright notices when bundling. Font source repository's current notice says 2024–2025; downloaded binary says 2024.

Official matching text data resources (QUL explicitly pairs them with font 568):
- Words: https://qul.tarteel.ai/resources/quran-script/565
- Verses: https://qul.tarteel.ai/resources/quran-script/566
Both advertise JSON and SQLite. Their actual download actions are login gated; no direct public export URL was exposed. Public previews remain accessible. QUL FAQ says each resource's own licensing governs, so QUL availability is not a blanket open-content license.

Primary-source public downloadable compatible page/line text:
https://raw.githubusercontent.com/DigitalKhatt/digitalkhatt.org/master/ClientApp/src/app/services/quran_text_indopak_15.ts
The file exports quranText, a string[][] of 610 pages. Page 565 has 15 lines and the reference's opening passage. Official service imports this array as QuranTextIndopak15Service:
https://github.com/DigitalKhatt/digitalkhatt.org/blob/master/ClientApp/src/app/services/qurantext.service.ts
Companion font supplied by the same app:
https://raw.githubusercontent.com/DigitalKhatt/digitalkhatt.org/master/ClientApp/src/assets/fonts/coretext/DigitalKhattIndoPak.ttf
App repository license: https://github.com/DigitalKhatt/digitalkhatt.org/blob/master/LICENSE (MIT, © 2024 DigitalKhatt). No separate text-file license header was found. Preserve original notices; do not assume app MIT overrides the embedded OFL font license.
App commit observed: 4213fab9892774f74f7164c70a70dd84a14f0215. Replace master in raw URLs with this commit to pin assets.

Integration caveat: the official text service inserts U+034F combining grapheme joiners for specific alef/waw/yeh + hamza/madda sequences to prevent shaping reordering. Keep those source adjustments when using the dataset. DigitalKhatt's app has its own shaping/layout implementations; plain browser @font-face rendering was not visually verified in this research task. Do not claim text-only output is a facsimile or change Quran characters to force visual width. General Tanzil/Uthmani text is not a verified interchangeable substitute for this IndoPak-specific encoding.

## Alternative with more restrictive embedded terms: QuranWBW IndoPak Nastaleeq

Canonical maintainer notice: https://github.com/marwan/indopak-quran-text
Canonical matching text: https://qul.tarteel.ai/resources/quran-script/59
Font resource: https://qul.tarteel.ai/resources/font/242
Current direct TTF: https://static-cdn.tarteel.ai/qul/fonts/nastaleeq/Hanafi/normal-v4.2.2/with-waqf-lazmi/font.ttf
Resource path version is v4.2.2; embedded font version remains 2.100, dated November 26, 2022; family AlQuran IndoPak by QuranWBW. The name table credits Al Qalam, Ghandhara, KFGQPC, Ayman Siddiqui and others; it describes the font as based on Al Qalam Quran Majeed and Web fonts with specially adjusted text.
The embedded notice restricts sale, modification, distribution and development without written notice by QuranWBW.com. The GitHub README requires credits and forbids selling, manipulation and tampering. Do not call this OFL or freely redistributable. These font credits do not identify the calligrapher of the eQuran scan.

## Downloaded research artifacts

Official font binaries, official app text source, and both DigitalKhatt license files were downloaded to this directory; checksums.txt pins local bytes. Third-party mirror digitalkhatt-indopak-mirror.json was inspected (6236 entries, claims QUL origin), but was NOT treated as a verified production source or used for conclusions. No Quran text or image was generated or edited.
