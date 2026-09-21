# OTTO B1 — Diagnostic methodology v1.0

## Status

This is a criterion-referenced placement foundation for the owner preview. It is **not** a calibrated psychometric/IRT test and does not certify an official CEFR level.

Internal placement bands: A1.1, A1.2, A2.1, A2.2, B1.1, B1.2.
The `.1/.2` split is an OTTO internal learning-route convention. User-facing language must say “примерная учебная зона”, “ближе к A2.2”, “нужно подтверждение”.

## Primary source families

1. Council of Europe CEFR Companion Volume / descriptors:
   - https://www.coe.int/en/web/common-european-framework-reference-languages/cefr-companion-volume-and-its-language-versions
   - https://www.coe.int/en/web/common-european-framework-reference-languages/cefr-descriptors
2. Goethe-Zertifikat A1 official practice family:
   - https://www.goethe.de/ins/de/de/prf/prf/gzsd1/ueb.html
3. Goethe-Zertifikat A2 official practice family:
   - https://www.goethe.de/ins/de/de/m/prf/prf/gzsd2/ub2.html
4. Goethe-Zertifikat B1 official practice family:
   - https://www.goethe.de/ins/de/de/prf/prf/gzb1/ueb.html
5. Goethe-Zertifikat B1 current exam-administration rules: official Durchführungsbestimmungen, Stand 1 September 2025.

No Goethe item is copied. Diagnostic items are ORIGINAL_ALIGNED and store source-family metadata.

## Bank inventory

Closed items: **42**.

| Internal band | Closed items |
|---|---:|
| A1.1 | 7 |
| A1.2 | 7 |
| A2.1 | 7 |
| A2.2 | 7 |
| B1.1 | 7 |
| B1.2 | 7 |

Productive probes: **6** — Schreiben upper-A1/A2/B1 and Sprechen upper-A1/A2/B1, including a B1 interactive probe.

Every closed item stores diagnostic_version, item_id, modality, skill/micro_skill, target_band, difficulty_boundary, grammar tags, vocabulary/function tags, CEFR alignment note, source_basis, expected duration, scoring rule, placement/B1-gap flags, QA/publish status and original_aligned=true.

## Adaptive stages

### A. Wide screening

The first short screen sits around A2.1/A2.2. It is not a final placement decision. Clearly weak results branch down; mixed results use a middle path; clearly strong results branch toward B1-oriented material.

### B. Boundary check

After screening the engine estimates a neighbouring band pair (for example A1.2/A2.1, A2.2/B1.1, B1.1/B1.2) and selects new, not-yet-used items from both sides.

Initial decision requires at least 3 items per side. Lower >=2/3 with upper <=1/3 supports the lower band. Upper 3/3 with lower >=2/3 supports the upper band. Other patterns are BORDERLINE and trigger an extra round with new items. Mixed evidence after confirmation becomes NEED_CONFIRMATION instead of a forced level.

A single correct or incorrect answer cannot by itself promote or demote the user.

### C. Productive evidence

Writing prompt depends on the estimated range: upper-A1 short message, A2 personal email/event description, B1 connected opinion/advice prompt. The application only checks that a sample is substantial and predominantly German, then stores it as NEEDS_REVIEW.

Speaking also depends on range: A1 basic production, A2 narration/evaluation, B1 includes an interactive planning/opinion probe with Otto. Speech transcript is not treated as a speaking score. Without versioned audio/rubric review, Sprechen stays NEED_CONFIRMATION.

### D. Result and route

Output includes a cautious overall placement hypothesis, separate skill profiles, evidence counts/confidence, B1-oriented gaps, explanation of boundary evidence and an initial route.

Route families:
- A1.x → FOUNDATION_FIRST
- A2.x → BRIDGE_TO_B1
- B1.x → B1_EXAM_FOCUSED

A strong Lesen profile cannot hide weak or unevaluated Schreiben/Sprechen.

## Current limitations

- Item difficulties are source-aligned and internally reviewed but not statistically calibrated on a real candidate population.
- Hören in preview uses browser German speech synthesis rather than the final versioned audio bank.
- Writing and speaking productive evidence is captured but not automatically assigned a reliable band.
- Training content outside the diagnostic is intentionally closed until independent content QA.

## Content readiness / Hören media

Diagnostic placement content и будущий learning bank — разные слои. Browser speech synthesis, используемый в текущем диагностическом Preview, остаётся явно технической заглушкой и не может быть повышен до final Hören source.

Полный owner standard для learning tasks находится в `docs/content-readiness-standard.md`. CI запрещает считать task `CONTENT_READY`, если отсутствуют обязательные translation/explanation/glossary/strategy/verified answer key-or-rubric, а для Hören — versioned final audio + speaker/voice metadata + playback rules + context-only image.
