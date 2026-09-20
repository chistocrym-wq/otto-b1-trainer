# B1-F06 — Readiness Engine

Status: **DRAFT FOR INDEPENDENT REVIEW**  
Phase: **PHASE 1 — FOUNDATION**  
Parent: **#2 OTTO B1 — PRODUCT REVIEW & REDESIGN**  
Task: **#13 [B1-F06] Readiness Engine**  
Frozen Foundation baseline: `23563aa742e911e67ea9991825e187d2211b6af5`  
Frozen inputs: **B1-F01 + B1-F02 + B1-F03 + B1-F04 + B1-F05**  
Scope: **readiness specification only; no application/runtime change**  
Checked: **2026-09-20**

---

# 0. Purpose

B1-F06 defines a deterministic module-specific readiness model answering:

> **Насколько у OTTO достаточно надёжных доказательств, что пользователь готов выполнять конкретный модуль Goethe B1 самостоятельно в exam-like условиях?**

Readiness is computed separately for:
- LESEN;
- HÖREN;
- SCHREIBEN;
- SPRECHEN.

There is **no global compensating readiness score** in B1-F06.

A strong module never raises another module's readiness.

B1-F06 does **not**:
- calculate the official Goethe score;
- use 60/100 as an OTTO threshold;
- predict official pass probability;
- use XP/activity as evidence;
- modify Mastery;
- modify Error/Review/Planner rules;
- implement runtime code.

---

# 1. Frozen inputs consumed

## From B1-F01
- official Module → Teil/Aufgabe structure;
- frozen Micro-skill IDs;
- official task/exam constraints;
- official criteria boundaries;
- OFFICIAL vs OTTO_METHOD separation.

## From B1-F02
- immutable EvidenceEvents;
- P0–P5 / N1–N4 classes;
- M0–M6 Mastery;
- independence/assistance;
- transfer;
- learning_occasion_id;
- exam_like stage;
- evaluator provenance/confidence;
- missing/invalid data semantics.

## From B1-F03
- active / returned / recurring ErrorObjects;
- repair/transfer state;
- recurrence;
- productive-module error separation.

## From B1-F04
- NOT_DUE / RECENTLY_REPAIRED / TRANSFER_PENDING / SCHEDULED / DUE / OVERDUE / REGRESSION_DETECTED;
- freshness;
- delayed-review outcomes;
- scheduler policy/version.

## From B1-F05
- active module scope;
- actual completed-session evidence pointers;
- exam-like/checkpoint evidence pointers;
- unresolved evidence gaps;
- blocked-content flags.

**Planner priority/rank is not readiness evidence.**

---

# 2. Policy version and output object

Canonical policy:

**OTTO_READINESS_V1**

Every module gets its own immutable `ReadinessSnapshot`.

Required fields:

- readiness_snapshot_id;
- policy_version = OTTO_READINESS_V1;
- module;
- computed_at;
- basis_state_snapshot_ids[];
- basis_evidence_event_ids[];
- basis_error_ids[];
- basis_review_record_ids[];
- readiness_state;
- confidence_level;
- sufficiency_status;
- official_teil_coverage[];
- micro_skill_coverage_summary;
- independence_summary;
- transfer_summary;
- exam_like_summary;
- freshness_summary;
- active_blockers[];
- missing_data_flags[];
- evaluator_quality_summary where relevant;
- user_label_key;
- audit_reason_codes[];
- supersedes_snapshot_id if recomputed.

Snapshots are auditable. Historical snapshots are not rewritten.

---

# 3. Readiness state model

B1-F06 uses five readiness states.

## R0 — INSUFFICIENT_DATA

Meaning:
OTTO does not have enough reliable module coverage to make a readiness conclusion.

User label:
**«Недостаточно данных»**

This state is mandatory whenever the sufficiency gate in section 6 fails.

Known weaknesses may still be listed as blockers, but the system does not pretend the module has been fully assessed.

## R1 — NEEDS_WORK

Meaning:
Data coverage is sufficient to make a conclusion, and current evidence shows material unresolved learning problems.

Typical blockers:
- M6 REGRESSED on a Micro-skill included in the current Teil readiness basis;
- M1 WEAK on a readiness-basis Micro-skill when frozen F02 repeated-negative entry criteria are satisfied;
- returned/active errors with failed transfer/review linked to a readiness-basis Micro-skill;
- repeated N3/N4 on distinct valid task instances for the same readiness-basis Micro-skill;
- productive criterion failure supported by reliable evidence.

F06 does **not** use an undefined “critical skill” or severity flag. Blockers are derived only from frozen F01/F02/F03 states/events.

User label:
**«Требуется работа»**

## R2 — DEVELOPING_UNSTABLE

Meaning:
Coverage is sufficient and progress exists, but independent/transfer/exam-like evidence is not yet stable enough.

Typical causes:
- M2 DEVELOPING dominates key targets;
- M5 UNSTABLE;
- conflicting recent evidence;
- assistance dependency;
- transfer missing;
- exam-like evidence missing;
- productive evaluator confidence not strong enough for a ready conclusion.

User label:
**«Прогресс есть, но результат нестабилен»**

## R3 — RECHECK_DUE

Meaning:
The module had sufficiently positive evidence, but freshness/review status means OTTO needs a new independent check before keeping a ready conclusion current.

Typical causes:
- required evidence is DUE/OVERDUE;
- stable evidence is stale under F04;
- long inactivity creates a maintenance/recheck obligation;
- no strong new regression is present.

User label:
**«Нужна повторная проверка»**

R3 is not a claim that the user forgot the material.

## R4 — EVIDENCE_SUPPORTED_READY

Meaning:
OTTO has sufficient, recent, independent, transferred, module-wide and exam-like evidence to support a readiness conclusion for this module.

User label:
**«Есть устойчивые доказательства готовности»**

This is an OTTO educational state.

It is **not**:
- an official Goethe result;
- a pass certificate;
- a predicted official score;
- a probability of passing.

---

# 4. Readiness resolution precedence

For each module, resolve in this order:

1. **Sufficiency gate fails** → R0 INSUFFICIENT_DATA.
2. **Confirmed regression/material unresolved negative evidence** → R1 NEEDS_WORK.
3. **Unstable/mixed/assistance/transfer/exam-like gap** → R2 DEVELOPING_UNSTABLE.
4. **Otherwise-ready evidence but freshness/review obligation is due/overdue** → R3 RECHECK_DUE.
5. **All Ready Gate conditions pass** → R4 EVIDENCE_SUPPORTED_READY.
6. Any sufficient-but-not-ready remainder → R2 DEVELOPING_UNSTABLE.

The engine must emit explicit reason codes for the selected branch.

No weighted average may override a blocker.

---

# 5. Evidence coverage tiers per official Teil

Coverage is measured separately for each official Teil/Aufgabe.

## T0 — UNCHECKED
No valid scorable evidence for the Teil.

## T1 — OBSERVED
At least 1 valid scorable event exists, but independent sampling is insufficient.

## T2 — INDEPENDENTLY_SAMPLED
Minimum:
- at least 2 valid events on distinct task instances;
- at least 1 P3/P4/P5 independent event;
- no exact-item-only evidence set.

## T3 — TRANSFER_CONFIRMED
Minimum:
- T2 satisfied;
- at least 2 P3+ events on distinct tasks;
- at least 1 P4 or P5;
- evidence spans at least 2 distinct contexts.

## T4 — EXAM_LIKE_CONFIRMED
Minimum:
- T3 satisfied;
- at least 1 valid P5 event for that Teil **or** a valid full-module exam-like checkpoint that includes the Teil;
- relevant frozen F01 exam-like constraints were respected.

These tiers are internal OTTO coverage states, not Goethe scoring bands.

---

# 6. Minimum module evidence sufficiency gate

A module is **SUFFICIENT_FOR_READINESS_CLASSIFICATION** only if all conditions below pass.

## 6.1 Official Teil coverage

Every official Teil/Aufgabe in the module must be at least **T2 INDEPENDENTLY_SAMPLED**.

Therefore:
- any completely unchecked Teil → R0;
- any Teil with only assisted/exposure evidence → R0.

Frozen official counts:
- Lesen: all 5 Teil;
- Hören: all 4 Teil;
- Schreiben: all 3 Aufgaben;
- Sprechen: all 3 Aufgaben.

## 6.2 Micro-skill coverage floor

Within every official Teil:
- at least **60% of frozen F01 OTTO Micro-skills** must have at least one valid targeted EvidenceEvent;
- at least **40% of Micro-skills** must have P3+ independent evidence or be validly observed inside a multi-skill productive sample.

Module-wide:
- at least **70% of Micro-skills** must have valid evidence;
- at least **50%** must have P3+ independent evidence.

These are conservative **OTTO_READINESS_V1 product thresholds**, not scientific constants and not Goethe requirements.

They exist to prevent a readiness conclusion from a tiny sample.

## 6.3 Data-quality floor

The decisive events used to pass sufficiency must be:
- valid, not invalid;
- from distinct tasks/contexts as required;
- not exact-repeat-only;
- not dominated by full-model exposure.

## 6.4 Productive confidence floor

For Schreiben/Sprechen, decisive evidence used for sufficiency must have:
- evaluator provenance recorded;
- evaluator confidence at least **medium** for the observations being relied upon.

If decisive productive evidence is mostly low-confidence → R0 INSUFFICIENT_DATA.

---

# 7. Ready Gate — requirements for R4

R4 requires all conditions below.

## 7.1 Teil coverage

Every official Teil/Aufgabe must be at least **T3 TRANSFER_CONFIRMED**.

## 7.2 Exam-like coverage

One of these must be true:

### Path A — full-module exam-like
A valid module checkpoint/mock must include a deterministic `CheckpointCoverageManifest`:

- checkpoint_id;
- module;
- official_teil_ids_covered[];
- evidence_event_ids_by_teil;
- exam_constraints_valid;
- completed_at;
- learning_occasion_id.

Path A passes only if:
- every official Teil/Aufgabe from frozen F01 is explicitly present in `official_teil_ids_covered`;
- every covered Teil links to valid EvidenceEvents;
- exam_constraints_valid = true;
- the resulting evidence is independent P5-style evidence.

A checkpoint label alone cannot prove full-module coverage.

### Path B — distributed Teil exam-like
Every official Teil/Aufgabe has at least one recent valid P5 event.

If neither path exists, R4 is blocked by:
`EXAM_LIKE_COVERAGE_INCOMPLETE`

## 7.3 Mastery profile

For each official Teil:
- denominator = **all frozen F01 Micro-skills in that Teil**, not only the subset already observed;
- no readiness-basis Micro-skill may be M6 REGRESSED or M5 UNSTABLE;
- no readiness-basis Micro-skill may remain M1 WEAK with unresolved recent negative evidence meeting frozen F02 criteria;
- at least **70% of the full frozen Micro-skill set** in the Teil must be M3 PROVISIONALLY_DEMONSTRATED or M4 STABLE;
- every remaining frozen Micro-skill must be at least M2 DEVELOPING for R4.

Module-wide:
- no official Teil may be carried by one strong Micro-skill while unobserved Micro-skills are removed from the denominator.

Covered-only ratios may be shown in diagnostics, but they never drive R4.

## 7.4 Independence

Ready evidence must not be assistance-dominated.

Minimum:
- every official Teil has at least 2 P3+ independent events;
- at least 1 P4/P5 per Teil;
- recent evidence must include independent performance without answer-level help.

## 7.5 Freshness / review

F06 derives one `teil_freshness_state` for each official Teil from all Micro-skills currently used in that Teil's readiness basis.

Precedence:
1. REGRESSION_DETECTED
2. OVERDUE
3. DUE
4. FRESH

Rules:
- if any basis Micro-skill is REGRESSION_DETECTED → Teil = REGRESSION_DETECTED;
- else if any basis Micro-skill is OVERDUE → Teil = OVERDUE;
- else if any basis Micro-skill is DUE → Teil = DUE;
- otherwise Teil = FRESH.

Module effects:
- any Teil REGRESSION_DETECTED → resolve through R1/R2 using frozen Mastery, never R3;
- no regression, but any Teil OVERDUE or DUE while the remaining Ready Gate is otherwise satisfied → R3 RECHECK_DUE;
- isolated stale/aging observations that F04 has **not** made DUE/OVERDUE do not change readiness state by themselves; they may lower confidence only if confidence rules say so.

A freshness obligation without negative evidence is never treated as forgetting.

## 7.6 Error blockers

R4 is blocked by:
- RETURNED error with unresolved repair/transfer;
- active error linked to M5/M6 or N3/N4;
- repeated recurrence that remains unresolved;
- failed delayed review not yet repaired.

Minor active observations with low classification confidence do not automatically block R4 unless they affect a readiness-basis Micro-skill and are supported by valid evidence.

---

# 8. Confidence model — separate from readiness

`confidence_level` describes **how strongly OTTO can trust the readiness classification**, not whether the state is positive.

A user can have:
- NEEDS_WORK + HIGH confidence;
- EVIDENCE_SUPPORTED_READY + MEDIUM confidence;
- INSUFFICIENT_DATA + LOW confidence.

## C0 — LOW

Use when:
- readiness = R0;
- decisive productive evaluator confidence is low;
- evidence is highly conflicting and sparse;
- important data-quality/missing-data flags remain.

User-facing phrase:
**«Уверенность оценки низкая»** only when useful; normally explain the missing data instead.

## C1 — MEDIUM

Use when:
- module sufficiency gate passes;
- all official Teil are covered;
- evidence is adequate but some Teil sit near minimum coverage;
- or evidence is somewhat mixed/stale but still classifiable;
- no decisive productive evidence is low-confidence.

## C2 — HIGH

Use when:
- all official Teil are T3+;
- evidence spans at least 2 learning occasions per Teil;
- decisive evidence is recent enough for current F04 state;
- independent evidence is consistent;
- transfer is confirmed;
- evaluator confidence is medium/high for productive modules;
- no major missing-data flags remain.

For R4, HIGH additionally requires exam-like coverage under section 7.2.

Confidence is not displayed as a percentage in V1.

---

# 9. Deterministic confidence gates

Confidence is resolved **after** readiness_state and uses machine-testable conditions.

## C0 — LOW

Set C0 if any is true:
- readiness_state = R0 INSUFFICIENT_DATA;
- any decisive productive readiness-basis observation has evaluator_confidence = low and no medium/high replacement evidence exists;
- any official Teil has unresolved contradiction between recent P3/P4/P5 and N2/N3/N4 such that consistency is not established;
- data-quality invalidity affects a decisive readiness-basis event.

## C2 — HIGH

Set C2 only if all are true:
- every official Teil is T3 or T4;
- every official Teil has valid readiness-basis evidence on at least **2 distinct learning_occasion_id** values;
- no official Teil freshness state is DUE, OVERDUE, or REGRESSION_DETECTED;
- no unresolved recent contradiction exists on any readiness-basis Micro-skill;
- for Schreiben/Sprechen, every decisive productive observation has evaluator_confidence medium or high;
- no major missing-data flag from section 15 remains;
- if readiness_state = R4, exam-like coverage under section 7.2 passes.

## C1 — MEDIUM

Use C1 for every classifiable module that is neither C0 nor C2.

This includes:
- sufficiency gate passed but one or more Teil are only T2;
- evidence spans only one learning occasion in a Teil;
- readiness is R3 because a recheck is due;
- evidence is adequate but not rich enough for C2.

Confidence measures evidence reliability, not positivity. NEEDS_WORK can therefore be C2 when negative evidence is broad, recent, and consistent.

---

# 10. Effect of new evidence on readiness

## Independent success P3

Can:
- improve Teil from T1 → T2;
- reduce assistance-dependency concern;
- move R1/R2 toward stronger evidence if repeated.

Cannot alone:
- create R4;
- satisfy transfer;
- satisfy exam-like coverage.

## Transfer success P4

Can:
- improve T2 → T3;
- resolve transfer gap;
- support M3/M4 and readiness.

A single P4 in one Teil cannot make the module ready.

## Exam-like success P5

Can:
- improve T3 → T4;
- satisfy Teil exam-like requirement;
- increase confidence when valid/fresh.

A single P5 in one Teil cannot compensate for unchecked other Teil.

## Assisted success

P1/P2:
- proves learning progress/support response;
- may support R2;
- cannot satisfy independent coverage for T2/T3/T4;
- cannot by itself raise module to R4.

## Full-model exposure

P0/model-exposed:
- no independent readiness credit;
- immediate perfect reproduction does not count as readiness evidence.

## Stale evidence

Time passage alone does not prove forgetting.

If F04 marks basis evidence due/overdue:
- otherwise-positive R4 candidate → R3 RECHECK_DUE;
- confidence may drop C2 → C1;
- actual negative evidence is required for R1/R2 regression conclusions.

## Recurrence / returned error

If unresolved:
- R4 blocked;
- if evidence coverage remains sufficient but competence is mixed → R2;
- if repeated confirmed negative evidence produces M6/material weakness → R1.

## Regression

M6 in a readiness-basis area:
- R1 NEEDS_WORK.

M5:
- R2 DEVELOPING_UNSTABLE.

## Failed delayed review

A valid failure:
- blocks R4;
- follows frozen F02/F03 consequences;
- typically produces R2 if M5;
- may produce R1 if M6/repeated material weakness.

## Low evaluator confidence

For productive modules:
- low-confidence evidence cannot be decisive for T2/T3/T4 or R4;
- if enough reliable evidence remains, classify from that;
- otherwise R0 INSUFFICIENT_DATA.

---

# 11. Official Teil coverage rules

Readiness is module-wide but cannot average away an unchecked official part.

## Lesen
All Teil 1–5 must satisfy the sufficiency gate.

R4 requires:
- all five at T3+;
- exam-like coverage through full-module Path A or P5 evidence across all five Teil.

## Hören
All Teil 1–4 must satisfy the sufficiency gate.

Extra replay/transcript assistance:
- may create learning evidence;
- cannot count as independent exam-like evidence when it violates frozen F01/F02 constraints.

R4 requires valid hearing behavior under the relevant official-aligned replay conditions.

## Schreiben
All Aufgaben 1–3 must satisfy the productive rules in section 11.

## Sprechen
All Aufgaben 1–3 must satisfy the productive rules in section 12.

No official Teil may be substituted by stronger evidence from another Teil.

---

# 12. Schreiben readiness rules

Schreiben readiness is not binary correct/incorrect and is never based on word count alone.

## Required evidence

For each official Aufgabe:
- at least 2 independent learner-written samples on distinct prompts;
- at least 1 transfer or exam-like sample (P4/P5);
- evidence across at least 2 contexts;
- evaluator provenance recorded;
- decisive evaluator confidence >= medium.

## Criterion/function coverage

Across the module, readiness must include valid observations of the applicable frozen F01 dimensions:
- Erfüllung / task fulfillment;
- Kohärenz;
- Wortschatz;
- Strukturen;
- task-specific communicative functions/register where applicable.

A strong content/Erfüllung result cannot hide repeated weak Strukturen.

## Ready blocker examples

R4 is blocked by:
- repeated structure errors creating M1/M5/M6;
- missing required task-function evidence;
- only one prompt/template family;
- model-dependent writing;
- low-confidence evaluator evidence dominating the sample.

Word count is context metadata, not readiness proof.

---

# 13. Sprechen readiness rules

Sprechen uses separate evidence channels.

## Text-only work

Text/planning can support:
- task planning;
- vocabulary/structures;
- communicative-function rehearsal.

Text-only work cannot confirm:
- pronunciation;
- spoken pacing/intelligibility;
- actual interaction;
- audio performance under exam-like conditions.

Therefore text-only evidence cannot satisfy Sprechen R4.

## Audio requirement

For each Aufgabe used in readiness:
- at least one valid independent real-audio sample is required for T2+ productive readiness;
- R4 requires recent audio-based P4/P5 evidence.

## Interaction requirement

For Aufgaben requiring interaction:
- valid interaction evidence is required;
- prepared monologue/text cannot substitute for partner-response behavior.

## Pronunciation

Pronunciation readiness evidence:
- requires real audio;
- must record evaluator provenance/confidence.

## Evaluator confidence

If audio/evaluator confidence is low on decisive Sprechen evidence:
- do not infer ready;
- if reliable coverage is insufficient → R0;
- if coverage exists but stability remains uncertain → R2.

---

# 14. Hören replay rule

Hören readiness must distinguish:

- official-aligned replay count;
- extra training replay;
- transcript use.

A correct answer after extra replay:
- may support learning/Developing;
- does not count as independent P5 exam-like evidence.

If all Hören success depends on extra replay:
- module cannot reach R4;
- likely R2 if sufficiency otherwise passes;
- possibly R0 if independent Teil coverage is below T2.

---

# 15. Timing evidence

Timing is supportive, not a substitute for correctness/independence.

For exam-like readiness:
- timing evidence may strengthen confidence;
- repeated inability to complete within the relevant frozen module/task context may create a blocker;
- one slow but correct training attempt does not automatically make the module unready.

F06 never invents new Goethe timing rules; it consumes frozen F01 constraints.

---

# 16. Missing-data flags

Canonical flags include:

- `TEIL_UNCHECKED`
- `TEIL_INDEPENDENCE_MISSING`
- `MICRO_SKILL_COVERAGE_LOW`
- `TRANSFER_EVIDENCE_MISSING`
- `EXAM_LIKE_COVERAGE_INCOMPLETE`
- `PRODUCTIVE_SAMPLE_COUNT_LOW`
- `EVALUATOR_CONFIDENCE_LOW`
- `SPRECHEN_AUDIO_MISSING`
- `SPRECHEN_INTERACTION_MISSING`
- `HOEREN_INDEPENDENT_REPLAY_EVIDENCE_MISSING`
- `FRESHNESS_RECHECK_REQUIRED`
- `ACTIVE_RETURNED_ERROR`
- `REGRESSION_PRESENT`
- `CONTENT_GAP_BLOCKING_EVIDENCE`

Flags are audit/explanation signals.

A content gap is a system limitation, not negative learner evidence.

---

# 17. Audit reason codes

Canonical reason codes:

- `INSUFFICIENT_OFFICIAL_TEIL_COVERAGE`
- `INSUFFICIENT_MICRO_SKILL_COVERAGE`
- `INSUFFICIENT_INDEPENDENT_EVIDENCE`
- `ASSISTANCE_DEPENDENCY`
- `TRANSFER_NOT_CONFIRMED`
- `EXAM_LIKE_NOT_CONFIRMED`
- `ACTIVE_ERROR_BLOCKER`
- `RETURNED_ERROR_BLOCKER`
- `UNSTABLE_MASTERY`
- `REGRESSED_MASTERY`
- `REVIEW_DUE`
- `REVIEW_OVERDUE`
- `FAILED_DELAYED_REVIEW`
- `STALE_EVIDENCE`
- `PRODUCTIVE_CONFIDENCE_INSUFFICIENT`
- `SPRECHEN_AUDIO_GAP`
- `SPRECHEN_INTERACTION_GAP`
- `HOEREN_REPLAY_ASSISTANCE`
- `READY_GATE_PASSED`

Each ReadinessSnapshot records all applicable reasons and one primary resolution reason.

---

# 18. Deterministic computation algorithm

For one module:

1. Load one consistent frozen state snapshot.
2. Enumerate official Teil/Aufgaben from F01.
3. Build Teil coverage tiers T0–T4.
4. Compute micro-skill coverage counts/ratios.
5. Evaluate data-quality/productive-confidence floor.
6. If sufficiency gate fails → R0.
7. Evaluate M6/material negative blockers → R1 if present.
8. Evaluate M5/conflict/assistance/transfer/exam-like blockers → R2 if present.
9. Evaluate F04 freshness/review due/overdue blockers → R3 if otherwise ready-capable.
10. Evaluate full Ready Gate → R4 if all conditions pass.
11. Otherwise → R2.
12. Compute confidence separately.
13. Store audit/missing-data/supporting evidence references.

No stochastic step is allowed.

---

# 19. F05 interface without Planner rewrite

F06 may emit **planner advisory signals** only.

Allowed outputs:

- `readiness_state`;
- `confidence_level`;
- `module`;
- `missing_teil_ids[]`;
- `missing_micro_skill_targets[]`;
- `exam_like_gap_teil_ids[]`;
- `recheck_required`;
- `productive_data_gap`;
- `content_gap_flags[]`.

Future runtime adapter may map these to **existing F05 action types**:

- missing evidence → EVIDENCE_GAP_PROBE;
- missing exam-like evidence → EXAM_LIKE_CHECKPOINT;
- recheck requirement → existing F04 review candidate;
- productive evidence gap → appropriate evidence-acquisition candidate.

F06 may not:
- change F05 priority classes;
- reorder the plan directly;
- bypass anti-monopoly/fairness;
- create a new hidden readiness priority weight.

F05 remains the owner of daily selection.

---

# 20. User-facing UX labels

Internal codes R0–R4 / C0–C2 are not shown by default.

Approved readiness labels:

| Internal | User-facing |
|---|---|
| R0 | **Недостаточно данных** |
| R1 | **Требуется работа** |
| R2 | **Прогресс есть, но результат нестабилен** |
| R3 | **Нужна повторная проверка** |
| R4 | **Есть устойчивые доказательства готовности** |

## Explanation pattern

Every module card must answer:

1. **Что показывает OTTO сейчас?**
2. **Почему?**
3. **Что уже подтверждено?**
4. **Чего не хватает?**
5. **Что делать дальше?**

Example:
- “Lesen: нужна повторная проверка.”
- “Все Teil были проверены, но два навыка давно не перепроверялись.”
- “Следующий шаг: короткая независимая проверка без подсказок.”

Do not say:
- “Вы точно сдадите.”
- “Ваш официальный балл…”
- “Goethe readiness 78%.”

---

# 21. Numeric display policy

B1-F06 does **not** require a user-facing numeric readiness score.

V1 recommendation:
**state + confidence + coverage explanation**, no headline percentage.

Internal coverage ratios are allowed for deterministic gates/audit, but:
- they are not presented as an official-looking 0–100 score;
- they are not called Goethe points;
- 60/100 is never used as an OTTO readiness threshold.

If a future product version introduces a numeric indicator, it requires a new reviewed policy/version and must remain visibly separate from official Goethe scoring.

---

# 22. Destructive scenario matrix

## F06-Q01 — one perfect task
Expected:
- one Teil may get T1/T2 depending evidence;
- module R0 INSUFFICIENT_DATA.

## F06-Q02 — several perfect tasks from one Teil only
Expected:
- that Teil may reach T3/T4;
- unchecked other Teil force R0.

## F06-Q03 — all tasks with hints
Expected:
- assisted evidence does not satisfy T2 independent floor;
- R0 or R2 only if independent sufficiency exists elsewhere;
- never R4.

## F06-Q04 — strong Lesen, weak Schreiben
Expected:
- separate snapshots;
- Lesen state does not raise Schreiben.

## F06-Q05 — full coverage but stale evidence
Expected:
- if otherwise ready-capable and F04 due/overdue → R3 RECHECK_DUE;
- no automatic forgetting claim.

## F06-Q06 — good exam-like result then regression
Expected:
- new M5/M6/failed review overrides old P5;
- R2 if unstable, R1 if regressed.

## F06-Q07 — Schreiben good content, weak structures
Expected:
- criterion-specific negative evidence blocks R4;
- likely R1/R2 depending Mastery and sufficiency.

## F06-Q08 — Sprechen text-only, no audio
Expected:
- SPRECHEN_AUDIO_MISSING;
- cannot reach productive sufficiency/ready gate;
- R0 if no valid audio basis.

## F06-Q09 — Sprechen audio, low evaluator confidence
Expected:
- low-confidence decisive evidence cannot satisfy ready gate;
- R0 if reliable coverage insufficient, otherwise R2.

## F06-Q10 — Hören with extra replay
Expected:
- learning evidence recorded;
- not independent P5;
- exam-like coverage remains incomplete.

## F06-Q11 — one Teil never checked
Expected:
- R0 regardless of excellence elsewhere.

## F06-Q12 — high activity, little independent evidence
Expected:
- activity ignored as mastery evidence;
- readiness limited by independent coverage.

## F06-Q13 — perfect result after full model
Expected:
- model-exposed/assisted evidence;
- no independent readiness credit.

## F06-Q14 — conflicting evidence
Expected:
- if sufficiency passes but evidence unstable → R2;
- confidence C0/C1 according to density/quality;
- no averaging into R4.

## F06-Q15 — insufficient data
Expected:
- R0 + concrete missing-data flags.

## F06-Q16 — long inactivity
Expected:
- F04 freshness/review status drives R3 when historical coverage exists;
- time alone does not create R1 regression.

## F06-Q17 — one module prepared separately
Expected:
- compute that module independently;
- inactive/other modules do not affect its state;
- other modules may remain R0 without penalty to the active module.

---

# 23. Acceptance checklist

- [ ] separate readiness per module.
- [ ] R0–R4 deterministic.
- [ ] confidence C0–C2 separate from state.
- [ ] sufficiency gate explicit.
- [ ] official Teil coverage explicit.
- [ ] Micro-skill coverage floor explicit.
- [ ] independence/assistance effects explicit.
- [ ] transfer/exam-like effects explicit.
- [ ] freshness/review effects explicit.
- [ ] recurrence/regression effects explicit.
- [ ] Schreiben rules non-binary.
- [ ] Sprechen text/audio/interaction/pronunciation separated.
- [ ] evaluator confidence rules explicit.
- [ ] Hören replay assistance handled.
- [ ] no module compensation.
- [ ] no official-looking readiness score required.
- [ ] no 60/100 OTTO threshold.
- [ ] audit trail complete.
- [ ] F05 advisory interface does not rewrite Planner.
- [ ] destructive scenarios F06-Q01..Q17 defined.
- [ ] frozen F01–F05 unchanged.
- [ ] no app/runtime/main/production change.

---

# 24. Current review status

Technical findings TA-01..TA-05 are incorporated.

Next:
**Technical re-check → QA + GOETHE → UX / DESIGN → Director scope check**

DEV runtime remains blocked.
