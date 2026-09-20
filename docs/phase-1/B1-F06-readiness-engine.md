# B1-F06 — Readiness Engine

Status: **B1-F06 SPEC READY TO FREEZE**  
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

Known weaknesses are **not hidden**:
- `active_blockers` still records any observed M5/M6/returned-error/failed-review evidence;
- the explanation may say that problems were observed in the checked areas even though the whole module lacks enough coverage.

R0 means “not enough module-wide evidence to classify readiness”, not “no problems observed”.

## R1 — NEEDS_WORK

Meaning:
Data coverage is sufficient to make a conclusion, and current evidence shows material unresolved learning problems.

Module-level R1 aggregation is deterministic.

R1 is selected if any is true:
- at least one readiness-basis Micro-skill is M6 REGRESSED;
- at least 2 M1 WEAK Micro-skills exist in the same official Teil;
- one M1 Micro-skill has repeated N3/N4 or a RETURNED error after prior repair/transfer confirmation;
- a productive criterion/function problem is repeated strongly enough to satisfy the equivalent frozen M1/M6 evidence conditions.

A single isolated M1 Micro-skill still blocks R4, but by itself resolves the module to R2 DEVELOPING_UNSTABLE rather than R1.

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
**«Устойчивые доказательства есть»**

Module-card heading:
**«Готовность к модулю — оценка OTTO»**

Persistent detail note:
**«Это внутренняя оценка OTTO, не официальный результат Goethe.»**

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

**Path A satisfies only the exam-like coverage component of R4.**

It does **not** replace the wider Ready Gate:
- every Teil must still be T3;
- distinct-task independent evidence must still exist;
- transfer history must still exist;
- Mastery profile requirements still apply.

One excellent full-module run cannot manufacture a complete readiness history.

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

User-facing secondary line:
**«Надёжность данных: низкая»**

Do not expose C0.

## C1 — MEDIUM

Use when:
- module sufficiency gate passes;
- all official Teil are covered;
- evidence is adequate but some Teil sit near minimum coverage;
- or evidence is somewhat mixed/stale but still classifiable;
- no decisive productive evidence is low-confidence.

User-facing secondary line:
**«Надёжность данных: средняя»**

Do not expose C1.

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

User-facing secondary line:
**«Надёжность данных: высокая»**

Do not expose C2.

Confidence is not displayed as a percentage in V1 and describes evidence quality, not the learner's official level.

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
All Aufgaben 1–3 must satisfy the productive rules in section 12.

## Sprechen
All Aufgaben 1–3 must satisfy the productive rules in section 13.

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

## Aufgabe-scoped criterion/function coverage

Schreiben criterion evidence is evaluated **separately for each official Aufgabe**. Evidence from one Aufgabe cannot fill a missing criterion dimension in another.

Frozen F01 applicable official dimensions for **each** Aufgabe 1–3:
- Erfüllung / task fulfillment;
- Kohärenz;
- Wortschatz;
- Strukturen.

Task-specific communicative functions/register remain additional OTTO/F01 evidence where applicable.

For each Aufgabe, derive an `AufgabeCriterionCoverage` record:

- aufgabe_id;
- applicable_criteria[];
- criterion_observations_by_dimension;
- distinct_sample_ids_by_dimension;
- independent_sample_ids_by_dimension;
- transfer_or_exam_like_sample_ids_by_dimension;
- evaluator_provenance_by_dimension;
- evaluator_confidence_by_dimension;
- missing_criterion_dimensions[].

### Productive sufficiency gate for Schreiben

For an Aufgabe to count as T2+ readiness coverage:
- every applicable criterion dimension must have at least **1 valid observation** from an independent learner-written sample;
- the decisive observation for each dimension must have evaluator confidence >= medium;
- missing one applicable dimension sets `SCHREIBEN_AUFGABE_CRITERION_MISSING` and that Aufgabe cannot satisfy the productive sufficiency gate.

Therefore stronger A1/A2 evidence cannot compensate for missing Strukturen/Kohärenz/etc. in A3.

### R4 criterion gate

For each Aufgabe and each applicable criterion dimension:
- at least **2 valid observations** on distinct learner-written samples;
- at least 1 observation must come from a P4/P5 transfer or exam-like sample;
- decisive evaluator confidence >= medium;
- no unresolved M5/M6 or repeated M1 blocker for the corresponding readiness-basis Micro-skill/criterion evidence.

A strong Erfüllung/content result cannot hide repeated weak or completely unobserved Strukturen.

## Ready blocker examples

R4 is blocked by:
- repeated structure errors creating M1/M5/M6;
- any `missing_criterion_dimensions[]` for an official Aufgabe;
- missing required task-function evidence;
- only one prompt/template family;
- model-dependent writing;
- low-confidence evaluator evidence dominating a criterion dimension.

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

`audio_available=true` proves only that usable audio exists. It does **not** prove pronunciation or interaction quality.

## Deterministic interaction requirement

Interaction is a separate evidence channel for **Aufgabe 1** and **Aufgabe 3**.

**Boundary:** the machine-testable sufficiency gate below is **OTTO_METHOD**. It operationalizes evidence for the official interactive task behavior frozen in F01; it does not invent or replace Goethe's official scoring criteria.

A valid interaction sample is grouped by the same `task_instance_id` and must satisfy all common conditions:
- `audio_available=true`;
- EvidenceEvents are valid;
- evaluator provenance recorded;
- decisive evaluator confidence >= medium;
- `interaction_turn_count >= 2`;
- evidence is not text-only/model-exposed when used for independent readiness.

### Aufgabe 1 — planning interaction gate

The same task instance must contain valid observations linked to frozen F01 Micro-skills showing both:

**initiative**
- at least one of:
  - S.A1.PLAN.M02 make a proposal;
  - S.A1.PLAN.M04 ask for partner opinion/clarification;

and **reciprocal reaction**
- at least one of:
  - S.A1.PLAN.M03 react to partner proposal;
  - S.A1.PLAN.M05 agree and move plan forward;
  - S.A1.PLAN.M06 disagree politely with reason;
  - S.A1.PLAN.M07 offer alternative/compromise.

It must also have no evidence that the sample is only a monologue substitute for interaction when S.A1.PLAN.M11 is evaluated.

### Aufgabe 3 — reaction interaction gate

The same task instance must contain valid observations for:
- S.A3.REACT.M02 relevant feedback;
- S.A3.REACT.M03 relevant question;
- at least one responsive behavior:
  - S.A3.REACT.M05 relevant spontaneous answer; or
  - S.A3.REACT.M06 clarification behavior when needed.

A prepared monologue or audio recording without reciprocal-turn evidence does not satisfy this gate.

### Interaction sufficiency

For T2+ on Aufgabe 1/3:
- at least 1 valid interaction sample is required.

For R4:
- each of Aufgabe 1 and Aufgabe 3 needs at least **2 valid interaction samples** on distinct task instances/contexts;
- at least 1 per Aufgabe must be P4/P5;
- evaluator confidence >= medium.

If audio/task success exists but this interaction gate is not met:
- set `SPRECHEN_INTERACTION_MISSING`;
- do not treat the Aufgabe as interaction-ready;
- R4 is blocked.

## Pronunciation — separate mandatory channel

Pronunciation is never inferred from audio presence.

**Boundary:** F01 states that Aussprache contributes across Sprechen Aufgaben 1–3. The per-Aufgabe evidence-coverage requirements below are a conservative **OTTO_METHOD readiness sufficiency rule**, not a claim that Goethe assigns a separate pronunciation score to each Aufgabe.

A valid `pronunciation_observation` must:
- come from `audio_available=true`;
- be scorable, not missing/not_scorable;
- record evaluator provenance;
- have evaluator confidence >= medium when used for sufficiency/R4;
- link to the speaking EvidenceEvent/task instance.

### Pronunciation sufficiency gate

Pronunciation coverage is tracked separately for **each official Aufgabe 1–3**.

For an Aufgabe to count as T2+ productive readiness coverage:
- at least **1 valid pronunciation_observation** must be linked to a real-audio independent sample for that Aufgabe;
- the observation must be scorable (not missing / not_scorable);
- evaluator provenance must be recorded;
- evaluator confidence must be >= medium.

If any official Aufgabe lacks this pronunciation evidence:
- set `SPRECHEN_PRONUNCIATION_MISSING`;
- that Aufgabe cannot satisfy the productive T2 gate;
- module-wide readiness sufficiency therefore remains R0 until the missing pronunciation evidence exists.

### Pronunciation R4 gate

R4 additionally requires:
- at least **1 valid P4/P5-linked pronunciation_observation for each Aufgabe 1, 2 and 3**;
- pronunciation-basis evidence must span at least **2 distinct learning occasions**;
- no decisive pronunciation observation may be low-confidence.

Thus fresh P4/P5 audio events with missing/not_scorable pronunciation **cannot** satisfy Sprechen R4, and audio presence never substitutes for pronunciation assessment.

## Evaluator confidence

If audio/interaction/pronunciation evaluator confidence is low on decisive Sprechen evidence:
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
- `SPRECHEN_PRONUNCIATION_MISSING`
- `SPRECHEN_INTERACTION_MISSING`
- `SCHREIBEN_AUFGABE_CRITERION_MISSING`
- `HOEREN_INDEPENDENT_REPLAY_EVIDENCE_MISSING`
- `FRESHNESS_RECHECK_REQUIRED`
- `ACTIVE_RETURNED_ERROR`
- `REGRESSION_PRESENT`
- `CONTENT_GAP_BLOCKING_EVIDENCE`

Flags are audit/explanation signals.

## System-data-gap rule

A content gap is a system limitation, not negative learner evidence.

Therefore:
- a content gap may keep the module in R0 because required evidence cannot yet be collected;
- it cannot by itself cause R1 NEEDS_WORK or R2 DEVELOPING_UNSTABLE;
- it must be labeled in audit as `SYSTEM_DATA_GAP`, separate from learner-performance blockers;
- when valid content becomes available, readiness is recomputed from learner evidence without any negative penalty for the prior gap.

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
- `SCHREIBEN_AUFGABE_CRITERION_GAP`
- `SPRECHEN_AUDIO_GAP`
- `SPRECHEN_PRONUNCIATION_GAP`
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
5. For Schreiben, compute AufgabeCriterionCoverage for every official Aufgabe and fail productive sufficiency if any applicable criterion dimension is missing.
6. For Sprechen, compute separate audio, pronunciation and interaction sufficiency gates; audio presence must never substitute for pronunciation/interaction observations.
7. Evaluate data-quality/productive-confidence floor.
8. If sufficiency gate fails → R0.
9. Evaluate M6/module-level negative blockers → R1 if present.
10. Evaluate M5/conflict/assistance/transfer/exam-like blockers → R2 if present.
11. Evaluate F04 freshness/review due/overdue blockers → R3 if otherwise ready-capable.
12. Evaluate full Ready Gate → R4 if all conditions pass.
13. Otherwise → R2.
14. Compute confidence separately.
15. Store audit/missing-data/supporting evidence references.

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
- `missing_productive_dimensions[]` (for example Schreiben Aufgabe+criterion, Sprechen pronunciation/interaction);
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

# 20. UX / DESIGN contract for module readiness

Internal R/T/C/M/P/N codes, policy thresholds, audit reason codes and raw evidence ratios are not shown in the normal learner UI.

## 20.1 Four independent module cards — no global readiness verdict

Readiness must be presented as **four independent module cards in fixed exam order**:

1. **Lesen**
2. **Hören**
3. **Schreiben**
4. **Sprechen**

The order is stable and is **not** sorted by strongest/weakest status.

The readiness surface must not create:
- one global readiness percentage;
- one average score;
- one green/yellow/red whole-exam verdict;
- one “B1 ready / not ready” badge;
- any visual mechanism by which a strong module appears to compensate for a weak module.

Optional neutral summary line:

**«По модулям сейчас разная картина. OTTO оценивает каждый модуль отдельно.»**

Each module card uses exactly this information hierarchy:

1. **Module name**
2. **Readiness label**
3. **One plain-language primary reason**
4. **Coverage line**
5. **Data reliability line**
6. **One next step**
7. expandable **«Почему OTTO так считает?»**

Example anatomy:

> **Lesen**  
> **Нужна повторная проверка**  
> Все Teil были проверены, но часть подтверждений уже пора обновить.  
> Проверено: 5 из 5 Teil  
> Надёжность данных: средняя  
> **Дальше:** короткая самостоятельная проверка без подсказок  
> **Почему OTTO так считает?**

Card heading/details must retain:

**«Готовность к модулю — оценка OTTO»**

Persistent readiness-details note:

**«Это внутренняя оценка OTTO, не официальный результат Goethe.»**

---

## 20.2 User-facing readiness labels and state-specific meaning

| Internal | User-facing |
|---|---|
| R0 | **Недостаточно данных** |
| R1 | **Требуется работа** |
| R2 | **Прогресс есть, но результат нестабилен** |
| R3 | **Нужна повторная проверка** |
| R4 | **Устойчивые доказательства есть** |

The label alone is never enough. The card must provide a simple reason derived from the audited blocker/supporting evidence.

### R0 — Недостаточно данных

Default explanation:

**«Пока недостаточно самостоятельных проверок, чтобы оценить весь модуль.»**

When official coverage is missing:

**«Проверено: 4 из 5 Teil. Ещё нужно проверить: Teil 3.»**

When known weakness also exists:

**«Для общей оценки данных пока недостаточно. При этом уже видно, что нужно поработать над …»**

Missing evidence is not learner failure:
- do not label it “слабое место” without negative evidence;
- do not call it an “ошибка”;
- do not use failure-red styling by default.

### R1 — Требуется работа

Default explanation pattern:

**«Данных уже достаточно, и одна проблема повторяется в самостоятельных попытках.»**

The card must name the concrete learner-level area supported by audit evidence.

Do not expose:
- M1/M6;
- N3/N4;
- raw threshold counts.

### R2 — Прогресс есть, но результат нестабилен

Reason copy must reflect the actual blocker. Approved patterns include:

- **«На новых заданиях результат пока меняется.»**
- **«Часть успешных попыток была с подсказками.»**
- **«Самостоятельных подтверждений пока недостаточно.»**
- **«Результаты последних попыток расходятся.»**

### R3 — Нужна повторная проверка

Default explanation:

**«Раньше результат подтверждался, но его пора проверить снова.»**

Do not imply forgetting unless negative evidence actually exists.

Do not say:
- “Навык ухудшился” merely because evidence became due/stale;
- “Вы больше не готовы” without regression evidence.

### R4 — Устойчивые доказательства есть

Default explanation:

**«Есть несколько самостоятельных подтверждений на разных заданиях, включая exam-like проверку.»**

Keep the persistent disclaimer:

**«Это внутренняя оценка OTTO, не официальный результат Goethe.»**

Do not use certification/pass language:
- “сдано”;
- “проходной”;
- “экзамен пройдёте”;
- “готов на 80%”.

---

## 20.3 Confidence / data reliability is separate from readiness

Internal C0/C1/C2 are never shown.

Use one secondary line:

- **«Надёжность данных: низкая»**
- **«Надёжность данных: средняя»**
- **«Надёжность данных: высокая»**

This line describes the quality and sufficiency of evidence used by OTTO.

It does **not** describe:
- the learner's official Goethe level;
- a score;
- probability of passing.

A negative readiness state may have high data reliability if the evidence is broad, recent and consistent.

---

## 20.4 Coverage is not a score

Show coverage as coverage.

Preferred patterns:

- **«Проверено: 4 из 5 Teil»**
- **«Ещё нужно проверить: Teil 3»**
- **«Exam-like подтверждение: есть»**
- **«Exam-like подтверждение: не хватает»**

Do not use a headline like:
- “80% ready”;
- “готовность 72/100”;
- “Goethe score”.

Internal Micro-skill ratios may appear only in deeper diagnostic/admin detail and must be explicitly labeled as **coverage**, never readiness points.

---

## 20.5 Assisted-heavy evidence is a first-class UX case

Many completed tasks do not imply independent readiness.

When evidence volume is high but most success used assistance, use:

> **Прогресс есть, но результат нестабилен**  
> **«Данных уже много, но большинство успешных попыток были с подсказками. OTTO пока не может подтвердить самостоятельный результат.»**

After full-model exposure:

**«После примера получилось правильно. Нужна новая попытка на другом задании без подсказки.»**

Do not use:
- activity count;
- number of completed tasks;
- assisted accuracy

as positive readiness messaging when independence is still missing.

---

## 20.6 “Почему OTTO так считает?” — progressive disclosure

The collapsed card shows:
- readiness label;
- one primary reason;
- coverage;
- data reliability;
- one next step.

Expanded **«Почему OTTO так считает?»** uses only four human-readable sections.

### Подтверждено

Examples:
- **«Проверены все 5 Teil.»**
- **«Есть самостоятельные попытки на разных заданиях.»**
- **«Есть свежая exam-like проверка без подсказок.»**

### Пока не подтверждено

Examples:
- **«Не хватает самостоятельной проверки Teil 3.»**
- **«Нет свежей exam-like проверки.»**
- **«Для Sprechen пока нет достаточно надёжной аудиопроверки.»**

### Что повлияло

Examples:
- **«В последних попытках часто использовались подсказки.»**
- **«Одна и та же ошибка вернулась после повторения.»**
- **«Часть данных устарела и требует перепроверки.»**

### Что дальше

Show **one concrete next action only**, supplied through the existing F04/F05 contracts.

Do not expose:
- R/T/C/M/P/N codes;
- raw policy thresholds;
- percentages used internally for gates;
- audit reason-code identifiers;
- planner priority classes.

---

## 20.7 Missing coverage and system/content gaps

Missing coverage must be visually and verbally different from weakness.

Approved language:
- **«Ещё не проверено»**
- **«Не хватает данных»**
- **«Нужна самостоятельная попытка»**

Do not say:
- “слабое место” without negative evidence;
- “ошибка” for missing coverage.

For a system/content gap:

**«Для этой части OTTO пока не хватает подходящего задания для проверки. Это не оценка вашего уровня.»**

This is the learner-facing form of SYSTEM_DATA_GAP.

It must not:
- lower the learner's displayed ability;
- be colored/stamped as failure;
- be described as a user mistake.

---

## 20.8 Module-specific explanation language

The common readiness states are shared, but reasons must reflect the evidence channel of each module.

### Lesen

Explain:
- official Teil coverage;
- independent work on different texts/tasks;
- transfer/new material;
- freshness/recheck.

Example:

**«Все 5 Teil проверены, но по Teil 4 пока мало самостоятельных попыток на новом материале.»**

### Hören

Extra replay/transcript is training support, not learner failure.

Example:

**«Часть ответов получилась после дополнительного повтора аудио. Это полезно для тренировки, но пока не подтверждает самостоятельную работу в exam-like условиях.»**

Do not simply say “Hören слабый” because extra replay was used.

### Schreiben

Never reduce explanation to correct/incorrect or word count.

Examples:

**«Содержание задания выполняется устойчиво, но структуры в самостоятельных текстах пока нестабильны.»**

When evidence is incomplete:

**«Есть данные по содержанию и связности, но пока недостаточно надёжных наблюдений по нескольким критериям.»**

If one Aufgabe is missing one criterion dimension:

**«По Aufgabe 3 уже есть самостоятельные тексты, но пока не хватает надёжной проверки структур. Другие Aufgaben это не заменяют.»**

### Sprechen

For text-only work:

**«Есть данные по тому, что вы хотите сказать, но этого недостаточно, чтобы оценить реальную устную речь.»**

For audio with low evaluator confidence:

**«Устная попытка записана, но данных пока недостаточно для надёжного вывода о произношении или взаимодействии.»**

If audio exists but pronunciation is not scorable:

**«Аудио есть, но произношение пока не удалось надёжно оценить. Нужна новая аудиопопытка с проверяемым произношением.»**

For interactive Aufgaben:

**«Нужна проверка реального взаимодействия; подготовленный монолог её не заменяет.»**

If task/audio success exists but reciprocal interaction evidence is missing:

**«Устный ответ записан, но пока не подтверждено, как вы реагируете на партнёра в диалоге.»**

---

## 20.9 Visual semantics for future implementation

Status must always be communicated in text. Color is secondary only.

Do not use:
- score rings;
- speedometers/gauges;
- readiness percentage bars;
- certificate/trophy metaphors;
- pass/fail stamps;
- “exam passed” visual language.

State visual semantics:

- **Недостаточно данных** → neutral, not failure-red.
- **Требуется работа** → clear learning attention state, not official fail.
- **Прогресс есть, но результат нестабилен** → progress + uncertainty.
- **Нужна повторная проверка** → maintenance/recheck, not regression.
- **Устойчивые доказательства есть** → calm positive emphasis, not certification/pass confirmation.

The OTTO-vs-Goethe disclaimer must remain available in readiness details without dominating the card.

---

## 20.10 Mixed module states

Show different module states side by side without compensation.

Example:

- **Lesen — Устойчивые доказательства есть**
- **Hören — Нужна повторная проверка**
- **Schreiben — Прогресс есть, но результат нестабилен**
- **Sprechen — Недостаточно данных**

Optional summary:

**«По модулям сейчас разная картина. OTTO оценивает каждый модуль отдельно.»**

Never derive:
- a global readiness average;
- a whole-exam green/yellow/red state;
- “B1 ready / not ready”.

---

## 20.11 Required UX acceptance examples

These examples freeze presentation behavior only. They do not create new readiness rules.

### UX-EX01 — insufficient data, no known weakness

> **Sprechen**  
> **Недостаточно данных**  
> Пока недостаточно самостоятельных проверок, чтобы оценить весь модуль.  
> Проверено: 1 из 3 Aufgaben  
> Надёжность данных: низкая  
> **Дальше:** самостоятельная аудиопопытка по Aufgabe 1

### UX-EX02 — insufficient data + known weakness

> **Schreiben**  
> **Недостаточно данных**  
> Для общей оценки данных пока недостаточно. При этом уже видно, что в самостоятельных текстах повторяется проблема со структурами.  
> Проверено: 2 из 3 Aufgaben  
> Надёжность данных: низкая  
> **Дальше:** новый самостоятельный текст с фокусом на структуры

### UX-EX03 — sufficient data + recurring weakness

> **Lesen**  
> **Требуется работа**  
> Данных уже достаточно, и одна проблема повторяется в самостоятельных попытках: в Teil 4 часто неверно определяется позиция автора.  
> Проверено: 5 из 5 Teil  
> Надёжность данных: высокая  
> **Дальше:** новое задание Teil 4 без подсказок

### UX-EX04 — unstable evidence

> **Hören**  
> **Прогресс есть, но результат нестабилен**  
> Результаты последних самостоятельных попыток расходятся.  
> Проверено: 4 из 4 Teil  
> Надёжность данных: средняя  
> **Дальше:** новая самостоятельная проверка на другом аудио

### UX-EX05 — recheck due

> **Lesen**  
> **Нужна повторная проверка**  
> Раньше результат подтверждался, но часть доказательств уже пора обновить.  
> Проверено: 5 из 5 Teil  
> Надёжность данных: средняя  
> **Дальше:** короткая независимая проверка без подсказок

### UX-EX06 — stable evidence

> **Lesen**  
> **Устойчивые доказательства есть**  
> Есть несколько самостоятельных подтверждений на разных заданиях, включая exam-like проверку.  
> Проверено: 5 из 5 Teil  
> Надёжность данных: высокая  
> **Дальше:** поддерживающая проверка по расписанию  
> Это внутренняя оценка OTTO, не официальный результат Goethe.

### UX-EX07 — many successes, mostly assisted

> **Schreiben**  
> **Прогресс есть, но результат нестабилен**  
> Данных уже много, но большинство успешных попыток были с подсказками. OTTO пока не может подтвердить самостоятельный результат.  
> Проверено: 3 из 3 Aufgaben  
> Надёжность данных: средняя  
> **Дальше:** новый текст без подсказки

### UX-EX08 — mixed modules

> **Lesen — Устойчивые доказательства есть**  
> **Hören — Нужна повторная проверка**  
> **Schreiben — Прогресс есть, но результат нестабилен**  
> **Sprechen — Недостаточно данных**  
> По модулям сейчас разная картина. OTTO оценивает каждый модуль отдельно.

### UX-EX09 — Hören with extra replay

> **Hören**  
> **Прогресс есть, но результат нестабилен**  
> Часть ответов получилась после дополнительного повтора аудио. Это полезно для тренировки, но пока не подтверждает самостоятельную работу в exam-like условиях.  
> Проверено: 4 из 4 Teil  
> Надёжность данных: средняя  
> **Дальше:** проверка с официально допустимым количеством прослушиваний

### UX-EX10 — Sprechen text-only

> **Sprechen**  
> **Недостаточно данных**  
> Есть данные по тому, что вы хотите сказать, но этого недостаточно, чтобы оценить реальную устную речь.  
> Проверено: текстовая подготовка есть; аудиопроверки не хватает  
> Надёжность данных: низкая  
> **Дальше:** записать самостоятельный устный ответ

### UX-EX11 — productive evidence with low evaluator confidence

> **Sprechen**  
> **Прогресс есть, но результат нестабилен**  
> Устная попытка записана, но данных пока недостаточно для надёжного вывода о произношении или взаимодействии.  
> Проверено: 3 из 3 Aufgaben  
> Надёжность данных: низкая  
> **Дальше:** повторная аудиопроверка с надёжной оценкой

### UX-EX12 — system content gap

> **Hören**  
> **Недостаточно данных**  
> Для этой части OTTO пока не хватает подходящего задания для проверки. Это не оценка вашего уровня.  
> Проверено: 3 из 4 Teil  
> Надёжность данных: низкая  
> **Дальше:** проверить Teil 4, когда будет доступно валидное новое задание

---

## 20.12 UX implementation acceptance guard

A future runtime implementation of F06 fails the UX contract if it can reasonably:
- expose internal codes as learner-facing states;
- turn readiness into a score dashboard;
- visually average modules together;
- confuse missing evidence with weakness;
- confuse assisted success with independent readiness;
- present system/content gaps as learner failure;
- imply an official Goethe pass/result;
- hide known negative evidence behind “Недостаточно данных”.

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


## F06-Q18 — Sprechen audio present, pronunciation missing/not_scorable
Situation:
- fresh independent P4/P5 audio evidence exists for Aufgaben 1–3;
- `audio_available=true`;
- task/function evidence has medium/high evaluator confidence;
- `pronunciation_observation` is missing or `not_scorable`.

Expected:
- `SPRECHEN_PRONUNCIATION_MISSING`;
- pronunciation sufficiency/R4 gate fails;
- audio presence cannot substitute for pronunciation evidence;
- module cannot reach R4.

## F06-Q19 — Sprechen task/audio success without valid interaction evidence
Situation:
- Aufgabe 1 and/or 3 has fresh audio P4/P5 task-success evidence;
- reciprocal interaction requirements are absent:
  - insufficient interaction_turn_count; or
  - required initiative/reaction Micro-skill evidence missing.

Expected:
- `SPRECHEN_INTERACTION_MISSING`;
- interaction gate fails deterministically;
- prepared monologue/audio success cannot satisfy interaction readiness;
- module cannot reach R4 and may remain R0 if productive sufficiency is incomplete.

## F06-Q20 — Schreiben one Aufgabe missing one applicable criterion
Situation:
- Aufgaben 1 and 2 have complete reliable Erfüllung/Kohärenz/Wortschatz/Strukturen observations;
- Aufgabe 3 has valid independent/transfer samples but one applicable criterion, e.g. Strukturen, has no valid medium/high observation.

Expected:
- `SCHREIBEN_AUFGABE_CRITERION_MISSING`;
- Aufgabe 3 fails productive sufficiency for readiness;
- evidence from Aufgaben 1/2 cannot compensate;
- R4 is impossible; if module classification coverage is thereby incomplete → R0.

---

# 23. Acceptance checklist

- [x] separate readiness per module.
- [x] R0–R4 deterministic.
- [x] confidence C0–C2 separate from state.
- [x] sufficiency gate explicit.
- [x] official Teil coverage explicit.
- [x] Micro-skill coverage floor explicit.
- [x] independence/assistance effects explicit.
- [x] transfer/exam-like effects explicit.
- [x] freshness/review effects explicit.
- [x] recurrence/regression effects explicit.
- [x] Schreiben rules non-binary.
- [x] Sprechen text/audio/interaction/pronunciation separated.
- [x] evaluator confidence rules explicit.
- [x] Hören replay assistance handled.
- [x] no module compensation.
- [x] no official-looking readiness score required.
- [x] no 60/100 OTTO threshold.
- [x] audit trail complete.
- [x] F05 advisory interface does not rewrite Planner.
- [x] destructive scenarios F06-Q01..Q20 defined.
- [x] frozen F01–F05 unchanged.
- [x] no app/runtime/main/production change.

---

# 24. Independent review results

## Technical Architecture
**PASS — FINAL**

Resolved:
- deterministic blocker semantics without undefined criticality;
- CheckpointCoverageManifest for full-module exam-like proof;
- Teil-level freshness aggregation from F04;
- machine-testable C0/C1/C2 confidence gates;
- full frozen F01 Micro-skill denominator for R4;
- QA-driven R1 aggregation, R0 blocker visibility and system-data-gap semantics.

No frozen F01–F05 change request is required.

## QA
**RE-CHECK REQUIRED after independent QA FAIL on prior head**

The independent review of head `02f52f666f5e99188cb0c62657cd876de143d812` superseded the earlier 17/17 PASS and found three blocking productive-skill gaps:
- Sprechen pronunciation could be missing while audio existed;
- Sprechen interaction validity was not deterministic;
- Schreiben criterion coverage was module-aggregated rather than Aufgabe-scoped.

The current spec addresses all three and adds F06-Q18..Q20.

Final QA status must be set only after re-running F06-Q01..Q20 on the updated head.

## GOETHE boundary
**PASS — FINAL**

- R/T/C states and internal thresholds are OTTO_METHOD.
- Official Module/Teil/Aufgabe structure remains frozen from F01.
- 60/100 is not used as an OTTO threshold.
- No official score, pass/fail or pass probability is calculated.
- Final UX explicitly states OTTO readiness is not an official Goethe result.
- Hören/Schreiben/Sprechen exam-like boundaries remain intact.

## UX / DESIGN
**PASS — FINAL AFTER DEEP REVIEW**

The earlier UX contract passed basic wording review but later received a deeper PR-level review with **DESIGN FAIL** because the presentation contract could still be implemented as a technical dashboard.

Deep-review findings UX-F06-01..UX-F06-09 are now resolved.

The final spec freezes:
- four independent cards in fixed order: Lesen → Hören → Schreiben → Sprechen;
- no global percentage, average, gauge, or whole-exam “B1 ready” verdict;
- one card anatomy: state → plain-language reason → coverage → data reliability → next step → “Почему OTTO так считает?”;
- state-specific explanatory copy, not label-only output;
- assisted-heavy success as a first-class unstable-readiness UX case;
- progressive disclosure through “Подтверждено / Пока не подтверждено / Что повлияло / Что дальше”;
- missing coverage visually/verbally distinct from weakness;
- SYSTEM_DATA_GAP explicitly framed as an OTTO limitation, not learner failure;
- module-specific explanation language for Hören/Schreiben/Sprechen;
- text-first visual semantics with score rings, gauges, pass/fail stamps and certificate metaphors prohibited;
- 12 complete UX acceptance examples;
- R0 with known weakness shows both insufficient module-wide data and the known problem;
- OTTO-vs-Goethe disclaimer remains persistent in readiness details.

---

# 25. Unresolved blockers / change requests

**No blocking unresolved questions.**

**No change request against frozen B1-F01–F05 is required.**

Intentional deferrals:
- runtime/storage implementation;
- actual UI implementation;
- calibration of future policy versions from real product data;
- any future predictive pass-probability model would require a separate validated task and is not part of F06.

---

# 26. Implementation handoff

After Owner freeze, Foundation F01–F06 provides the specification input for the first runtime vertical slice.

The implementation slice may consume:
- F01 skill IDs and exam constraints;
- F02 Evidence/Mastery;
- F03 Error Repair;
- F04 Review Scheduler;
- F05 Daily Planner;
- F06 module-specific readiness snapshots.

Implementation must still:
- use a separate DEV task contract;
- work on a non-main branch;
- produce a Preview;
- receive independent QA;
- not deploy production without Owner instruction.

---

# 27. Current status after blocking QA findings

**B1-F06 — QA RE-CHECK REQUIRED**

The three blocking productive-skill findings have been addressed in the spec, but freeze is not allowed until:
- QA re-runs F06-Q01..Q20 and passes;
- Technical Architecture confirms deterministic implementability of the new gates;
- GOETHE boundary re-check confirms the Aufgabe/criterion and Sprechen interaction/pronunciation boundary;
- UX/DESIGN confirms the new missing-evidence explanations remain non-technical.

DEV runtime remains blocked.  
Implementation has not started.  
`main` unchanged.  
production unchanged.
