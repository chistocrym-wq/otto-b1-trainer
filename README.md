# Тренажёр Otto — Goethe-Zertifikat B1

Owner Preview / adaptive diagnostic foundation.

## Current flow

1. Registration with preserved draft state.
2. Mandatory initial diagnostic before training/module access.
3. Adaptive closed-task placement: wide screening → branch → independent boundary probes → extra evidence for borderline cases.
4. Range-dependent Schreiben productive sample.
5. Range-dependent Sprechen sample; B1 range includes an interactive probe with Otto.
6. Result with cautious internal placement band, separate skill profiles, confidence/evidence, B1 gap evidence and explanation.
7. Initial personal route: FOUNDATION_FIRST / BRIDGE_TO_B1 / B1_EXAM_FOCUSED.

## Content safety

Old demo `SAMPLES`, `TRANSFER`, shallow `DIAG`, weekly and exam-preview items are not available as confirmed B1 training.

The module screens currently show only the Goethe B1 task map and a **training content QA pending** state.

New diagnostic bank: 42 closed ORIGINAL_ALIGNED items + 6 productive probes, each with metadata/source basis.

## Sources

See `docs/diagnostic-methodology.md`. Primary families: Council of Europe CEFR Companion Volume/descriptors; official Goethe A1, A2 and B1 practice materials; current Goethe-Zertifikat B1 rules.

## Important interpretation

A1.1/A1.2/A2.1/A2.2/B1.1/B1.2 are internal OTTO placement bands, not official CEFR certificates.

Productive evidence is not falsified: Schreiben and Sprechen can remain NEED_CONFIRMATION / needs review.

## QA commands

- `npm run check`
- `npm run build:check`
- `npm run test:diagnostic`
- `npm run test:e2e`

Regression covers clear A1, A2.2→B1 boundary, borderline extra evidence, one-error/one-guess robustness, uneven profiles, insufficient Sprechen evidence, three route families, profile update after new evidence, legacy quarantine, metadata, registration persistence, diagnostic resume, desktop Chromium and mobile 390.

## Safety

- branch: `preview/clean-v1`
- Draft PR #21
- no merge
- `main` untouched
- production untouched

## Mandatory content-ready gate

Новый owner requirement зафиксирован в `docs/content-readiness-standard.md` и защищён `content-readiness.js` + `tests/content-readiness.test.cjs`.

Задание не считается готовым без полного bundle: task + translation + detailed explanation + glossary + Otto strategy + verified answer key/versioned rubric + source/QA metadata + audio where required + Hören scene image.

Для Hören:
- final audio не может быть browser `speechSynthesis`;
- versioned audio metadata обязательно;
- multi-speaker task требует стабильные разные speaker/voice IDs;
- Hören Teil 4 не может использовать один voice для всех участников;
- playback rules задаются metadata;
- extra training plays должны фиксироваться как assisted evidence;
- transcript/translation/glossary/strategy скрыты в Exam/Mock;
- каждый Hören learning task требует context-only image, прошедший answer-leak review;
- image не является экзаменационным материалом, если его нет в официальной механике task family.
