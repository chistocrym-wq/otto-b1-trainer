# CONTENT INVENTORY / QUARANTINE — diagnostic v2

Owner-request baseline: `preview/clean-v1@ea007d6cffc5f7036ecdbb25d169f94f01b2dbbb`.

Branch was re-checked before work. It had already advanced beyond that baseline, so the diagnostic-v2 work was reconciled on top of the newer branch state instead of overwriting it.

## Owner decision applied

The former runtime constants `SAMPLES`, `TRANSFER`, the shallow six-step `DIAG`, weekly items, exam-preview items and daily-plan items were demo placeholders. They are not accepted as B1 learning content and are not automatically reclassified as micro-drills.

## Inventory outcome

| Legacy family | Previous purpose | Decision |
|---|---|---|
| SAMPLES | representative UI demo | QUARANTINED / absent from runtime |
| TRANSFER | repair-flow demo | QUARANTINED / absent from runtime |
| DIAG (6 steps) | shallow preview diagnostic | REMOVED / replaced |
| weekly items | checkpoint UI proof | QUARANTINED / absent from runtime |
| exam-preview items | exam-mode UI proof | QUARANTINED / absent from runtime |
| daily-plan items | route UI proof | QUARANTINED / absent from runtime |

No legacy item is counted as confirmed B1 content. User-facing module pages intentionally show **training content QA pending** until a proper verified B1 learning bank exists.

## Replacement diagnostic content

`diagnostic-bank.js` contains 42 closed ORIGINAL_ALIGNED placement items: 7 each for A1.1, A1.2, A2.1, A2.2, B1.1, B1.2; plus 6 productive Schreiben/Sprechen probes.

See `docs/diagnostic-methodology.md` for adaptive branching and source families.

No old user A1 PDF is used as a B1 source.