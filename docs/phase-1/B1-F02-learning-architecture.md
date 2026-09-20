# B1-F02 — Evidence / Mastery / Learning Architecture

Status: **DRAFT FOR INDEPENDENT REVIEW**  
Phase: **PHASE 1 — FOUNDATION**  
Parent: **#2 OTTO B1 — PRODUCT REVIEW & REDESIGN**  
Task: **#5 [B1-F02] Evidence / Mastery / Learning Architecture**  
Depends on: **B1-F01 — Exam Skill Graph & Goethe Constraints**  
Scope: **specification only; no application/runtime change**  
Checked: **2026-09-20**

---

# 0. Purpose

B1-F02 defines how OTTO B1 converts learner activity into structured learning evidence.

The architecture must answer five different questions without confusing them:

1. **What happened?** → Evidence Event.
2. **What does that event support or contradict?** → Evidence Interpretation.
3. **What is the current learning state of one Micro-skill?** → Mastery State.
4. **What error remains active and what repair is required?** → Error Object.
5. **What evidence will later be available to Review, Daily Planner and Readiness?** → downstream contracts.

B1-F02 does **not** calculate the official Goethe score and does **not** calculate OTTO Readiness.

The canonical skill identifiers are frozen by B1-F01.  
Every evidence/error/mastery object must reference a B1-F01 `skill_node_id`.

---

# 1. Non-negotiable architecture principles

## 1.1 Activity is not mastery

The following alone do **not** prove mastery:

- number of completed exercises;
- streak length;
- time spent in app;
- number of taps;
- viewing an explanation;
- seeing a worked example;
- retrying the same item until correct;
- copying a model answer;
- correct response after full answer disclosure.

These events may be stored, but they cannot independently advance a skill to a demonstrated/stable state.

## 1.2 One correct answer is not mastery

One correct attempt is evidence about one task instance.  
It is not sufficient to classify a Micro-skill as stable.

## 1.3 Assistance changes evidence meaning

A correct response after help is valid learning data but is weaker evidence of independence.

OTTO must record help **consumed**, not merely help shown/offered.

## 1.4 Same-item repetition is not transfer

Repeated success on the same item can show repair/recollection.  
It cannot by itself prove that the learner can use the Micro-skill in a new context.

## 1.5 Productive skills require valid data

- Schreiben evidence requires actual learner text or another valid productive response.
- Sprechen pronunciation evidence requires actual audio.
- Text-only Sprechen may support task-planning/language-form observations, but not pronunciation evidence.

## 1.6 Time without checking is uncertainty, not proof of forgetting

OTTO may mark evidence stale/due.  
It must not claim a skill was lost merely because time passed.

## 1.7 Official Goethe score and OTTO mastery are separate systems

The official Goethe scoring rules from B1-F01 remain factual exam constraints.

OTTO mastery/readiness:
- is internal;
- is evidence-based;
- may say **INSUFFICIENT_EVIDENCE**;
- must not be shown as an official Goethe result;
- must not promise passing.

---

# 2. Canonical entity model

B1-F02 defines these entities:

1. `EvidenceEvent`
2. `EvidenceInterpretation`
3. `SkillState`
4. `ErrorObject`
5. `RepairAttempt`
6. `ReviewState`
7. `AssistanceEvent`
8. `ReadinessInputSnapshot`

Relationships:

`TaskAttempt → EvidenceEvent(s) → EvidenceInterpretation → SkillState`

If an error is detected:

`EvidenceEvent → ErrorObject → RepairAttempt(s) → Transfer Evidence → ReviewState`

Readiness later consumes:

`SkillState + Evidence history + Error history + checkpoint/mock evidence`

---

# 3. Evidence Model

## 3.1 EvidenceEvent — normalized event schema

Every meaningful learner attempt creates an immutable `EvidenceEvent`.

### Identity and routing

| Field | Required | Meaning |
|---|---:|---|
| event_id | yes | Unique immutable event ID. |
| user_id | yes | Learner reference. |
| session_id | yes | Session reference. |
| learning_occasion_id | yes | Evidence occasion identity. Events from the same uninterrupted learning occasion cannot satisfy a later-review requirement solely because timestamps differ. |
| skill_node_id | yes | Frozen B1-F01 Micro-skill ID. |
| module | yes | Lesen/Hören/Schreiben/Sprechen, derived from F01 node. |
| teil_or_aufgabe | yes | Official task parent, derived from F01 node. |
| task_instance_id | yes | Exact task instance. |
| task_family_id | yes | Family/template identity used to group structurally related items. |
| stimulus_id | yes | Identity of the concrete text/audio/prompt/stimulus. |
| content_fingerprint | yes | Immutable content identity/hash used to detect exact-content reuse. |
| variant_group_id | yes | Near-duplicate/template-variant group; variants in the same group cannot by themselves prove transfer. |
| task_origin | yes | `official_published` or `original_aligned`. |
| transfer_context_id | conditional | New-context identifier used when attempt is a transfer check. |

### Attempt context

| Field | Required | Meaning |
|---|---:|---|
| stage | yes | worked_example / guided / independent / transfer / exam_like. |
| attempt_number | yes | Attempt count on exact task instance. |
| prior_exact_item_exposure_count | yes | Number of prior exposures to exact item. |
| prior_task_family_exposure_count | yes | Prior exposure to same family/template. |
| started_at | yes | Start timestamp. |
| completed_at | conditional | Completion timestamp. |
| response_time_ms | conditional | Time when meaningful and technically reliable. |
| completion_state | yes | completed / abandoned / interrupted / invalid. |

### Assistance

| Field | Required | Meaning |
|---|---:|---|
| assistance_events | yes | Ordered list of AssistanceEvent records. |
| max_assistance_consumed | yes | Highest consumed assistance level. |
| assistance_offered_not_consumed | optional | Offered help that learner did not use. |
| exam_constraint_violation | yes | Whether the attempt violated exam_like constraints. |

### Outcome

| Field | Required | Meaning |
|---|---:|---|
| outcome_type | yes | objective / productive / exposure_only. |
| outcome_status | yes | success / partial / failure / not_scorable. |
| raw_response | conditional | Learner answer/sample. |
| evaluator_source | conditional | rule / human / AI / mixed. |
| evaluator_confidence | conditional | high / medium / low / not_applicable. |
| data_quality | yes | valid / limited / invalid. |

### Repair and transfer

| Field | Required | Meaning |
|---|---:|---|
| linked_error_id | optional | ErrorObject created/updated by event. |
| self_correction_attempted | yes | Whether learner attempted own repair. |
| self_correction_success | conditional | yes / partial / no / not_applicable. |
| transfer_of_error_id | optional | Error being tested in new context. |
| delayed_review_of_error_id | optional | Error being checked after time. |

EvidenceEvent is append-only. Corrections create a new event or a correction record; historical events are not rewritten.

---

## 3.2 Objective-task evidence payload

Used for Lesen/Hören.

Required where applicable:

- `selected_answer`;
- `correct_answer`;
- `item_correct`;
- `distractor_id`;
- `distractor_tag`;
- `question_target`;
- `evidence_span_selected` for training interactions that ask for proof;
- `answer_changed_after_assistance`;
- `answer_changed_after_replay`.

### Hören additions

- `official_required_play_count`;
- `actual_play_count`;
- `extra_training_replay_count`;
- `transcript_opened`;
- `prelisten_support_consumed`.

Exam-like Hören is valid as exam-like evidence only if official replay rules from F01 are respected.

An otherwise correct answer after extra replay remains learning evidence, but not independent exam-like evidence.

---

## 3.3 Productive-task evidence payload

Used for Schreiben/Sprechen.

Required where applicable:

- `task_functions_required`;
- `task_functions_observed`;
- `task_points_required`;
- `task_points_covered`;
- `criterion_observations`;
- `omission_flags`;
- `learner_sample`;
- `repaired_sample`;
- `evaluator_source`;
- `evaluator_confidence`.

### Schreiben additions

- `word_count`;
- `register_observation`;
- `coherence_observation`;
- `vocabulary_observation`;
- `structures_observation`;
- `self_repair_delta`.

### Sprechen additions

- `audio_available`;
- `speaking_duration_ms`;
- `interaction_turn_count` where applicable;
- `communicative_functions_observed`;
- `help_events_during_speech`;
- `pronunciation_observation` only if `audio_available=true`.

**Hard constraint:** if `audio_available=false`, pronunciation is `not_scorable`, never inferred.

---

# 4. What an Evidence Event can prove

Evidence is interpreted along separate dimensions. OTTO does not collapse all dimensions into one hidden “knowledge percentage”.

## 4.1 Evidence dimensions

### D1 — Task outcome
Question:
**Did the learner complete the required task correctly or sufficiently?**

Possible values:
- success;
- partial;
- failure;
- not_scorable.

### D2 — Independence
Question:
**How much content-level help was consumed before success?**

Possible values:
- independent;
- minimally_supported;
- supported;
- heavily_supported;
- model_exposed.

### D3 — Novelty / transfer
Question:
**Was the learner solving a genuinely new instance/context?**

Possible values:
- exact_repeat;
- same_family;
- new_context_transfer;
- exam_like_unseen.

### D4 — Temporal freshness
Question:
**How recently was the skill independently demonstrated?**

Possible values:
- fresh;
- aging;
- stale;
- unknown.

The actual time windows are policy inputs owned by the future review scheduler; F02 defines the state semantics, not final interval constants.

### D5 — Consistency
Question:
**Do recent independent observations agree?**

Possible values:
- unknown;
- consistent_positive;
- mixed;
- consistent_negative.

### D6 — Timing
Question:
**Was performance completed within the relevant task/module context?**

Possible values:
- not_measured;
- within_expected_context;
- slow_but_completed;
- incomplete_due_to_time;
- invalid_measurement.

Timing can strengthen confidence in exam-like readiness but cannot turn an incorrect answer into success.

### D7 — Data quality
Question:
**Can this observation validly support the targeted Micro-skill?**

Possible values:
- valid;
- limited;
- invalid.

Examples of limited/invalid:
- Sprechen pronunciation from text only → invalid for pronunciation;
- Hören with transcript opened → limited for listening independence;
- interrupted attempt → may be invalid for outcome.

### D8 — Evaluator confidence
Especially for Schreiben/Sprechen:
- high;
- medium;
- low;
- not_applicable.

Low-confidence productive evidence cannot by itself advance a skill to STABLE.

---

# 5. Assistance / Independence Model

## 5.1 Assistance levels

The normalized F01 ladder is frozen:

| Level | ID | Meaning |
|---:|---|---|
| 0 | none | No help consumed. |
| 1 | strategy | General method/strategy; no task answer content. |
| 2 | keyword | Relevant word/concept supplied. |
| 3 | evidence_hint | Attention directed to a relevant text/audio area or decisive clue. |
| 4 | phrase_start | Partial productive answer scaffold. |
| 5 | full_model | Correct answer/model phrase/text made available. |

Each help action creates an `AssistanceEvent`:

- assistance_event_id;
- event_id;
- level;
- offered_at;
- consumed_at;
- content_type;
- automatic_or_requested;
- source;
- affected_skill_node_id if specific.

## 5.2 Independence classification

For a successful attempt:

- **independent**: max consumed assistance = none and no hidden assistance violation;
- **minimally_supported**: strategy only;
- **supported**: keyword or evidence_hint;
- **heavily_supported**: phrase_start;
- **model_exposed**: full_model.

Exam-like evidence requires:
- no automatic hint;
- no consumed training assistance;
- official task constraints respected.

## 5.3 What assistance means for mastery

- independent success may advance mastery;
- minimally_supported success may contribute to DEVELOPING but cannot alone establish PROVISIONALLY_DEMONSTRATED;
- supported/heavily_supported success is learning evidence, not independent competence;
- model_exposed success proves exposure/rehearsal, not independent competence;
- assistance does not erase the attempt; it changes interpretation.

A learner can improve from repeated assisted work, but OTTO must obtain later independent evidence before claiming demonstrated competence.

---

# 6. Evidence classes used by the state machine

The state machine uses evidence classes rather than a weighted score.

## POSITIVE evidence

### P0 — Exposure
Examples:
- worked example viewed;
- full model shown;
- answer copied after reveal.

Proves:
- exposure only.

Does not prove:
- independent performance.

### P1 — Assisted success
Success with keyword/evidence_hint/phrase_start/full_model.

Proves:
- learner can complete with assistance at the recorded level.

Does not prove:
- independence;
- transfer.

### P2 — Minimally supported success
Success with strategy help only.

Proves:
- learner can perform with non-answer strategy support.

Does not alone prove:
- independent competence.

### P3 — Independent direct success
Requirements:
- max assistance = none;
- valid data;
- new task instance;
- not exact-repeat-only;
- stage independent or equivalent training attempt.

Proves:
- independent success on this context.

### P4 — Independent transfer success
Requirements:
- P3 conditions;
- `transfer_context_id` differs from original error/training context;
- no exact-item or answer-pattern reuse that invalidates transfer.

Proves:
- targeted Micro-skill transferred to new material/context.

### P5 — Valid exam-like success
Requirements:
- independent;
- unseen/new enough for valid check;
- official exam-like constraints respected;
- data quality valid.

Proves:
- independent performance under an exam-like constraint set.

P5 is not an official Goethe score.

## NEGATIVE evidence

### N1 — Assisted failure
Failure despite assistance.

Strong signal of weakness, but interpretation depends on data quality and task alignment.

### N2 — Independent failure
Valid independent failure on a targeted Micro-skill.

Stronger contradiction than assisted failure.

### N3 — Transfer failure
Independent failure on a new transfer item targeted at the same Micro-skill.

Strong evidence the prior repair did not generalize.

### N4 — Exam-like failure
Failure under valid exam-like conditions.

Strong negative evidence for readiness input, but not automatically an official fail result unless it was an actual official exam.

---

# 7. Mastery Model

## 7.0 SkillState snapshot and reproducibility

`SkillState` is a derived snapshot, never the source of truth.

Required snapshot fields:

- `skill_node_id`;
- `mastery_state`;
- `review_state`;
- `policy_version`;
- `computed_at`;
- `basis_event_ids[]`;
- `previous_state`;
- `transition_reason_code`;
- `latest_valid_evidence_at`;
- `latest_independent_success_at`;
- `latest_strong_negative_at`;
- `freshness_status`.

A policy update may recompute current state from immutable events, but the previous snapshot remains auditable through its policy version and basis events.

## 7.1 Mastery states

Mastery is stored per B1-F01 `skill_node_id`.

### M0 — INSUFFICIENT_EVIDENCE

Meaning:
OTTO cannot make a reliable learning claim yet.

Typical conditions:
- no scorable evidence;
- exposure only;
- one isolated positive or negative event without confirmation;
- only low-quality evidence;
- only exact-repeat successes;
- productive evidence with inadequate evaluator confidence.

User-facing:
**Недостаточно данных.**

### M1 — WEAK

Meaning:
There is repeated valid and predominantly negative evidence that the learner cannot yet perform the Micro-skill reliably.

Entry requires one of:
- at least 2 N2/N3/N4 events on distinct task instances/contexts and no meaningful recent P3/P4/P5 evidence that makes the set genuinely mixed;
- 1 valid independent failure followed by failed self-repair or failed transfer, with no contradictory strong success;
- repeated N1 assisted failures across distinct items and no meaningful independent success.

If meaningful positive and negative evidence coexist, use M2 DEVELOPING when M2 requirements are satisfied. If M2 minimum is not satisfied, remain M0 INSUFFICIENT_EVIDENCE with a contradiction/risk flag.

One isolated mistake does not automatically produce WEAK; it creates a risk/error object while mastery may remain INSUFFICIENT_EVIDENCE.

### M2 — DEVELOPING

Meaning:
The learner can sometimes perform the Micro-skill, but independence/transfer/stability is incomplete.

Entry examples:
- at least 2 positive events on distinct items with at least 1 P2/P3, but no P4/P5 yet;
- successful self-repair plus later independent direct success;
- improvement from WEAK with positive evidence but insufficient transfer/freshness.

DEVELOPING permits mixed evidence.

### M3 — PROVISIONALLY_DEMONSTRATED

Meaning:
The learner has demonstrated the Micro-skill independently and in a new context, but long-term stability is not yet established.

Minimum product rule:
- at least 2 P3+ events on distinct task instances;
- at least 1 of those is P4 or P5;
- evidence spans at least 2 distinct contexts;
- no unresolved recent N3/N4;
- productive evidence has at least medium evaluator confidence where evaluation is required.

This is a conservative OTTO product rule, not a Goethe rule.

### M4 — STABLE

Meaning:
The skill has been independently demonstrated across context and time with no unresolved strong contradiction.

Minimum product rule:
- currently PROVISIONALLY_DEMONSTRATED;
- at least 1 additional P3/P4/P5 on a later `learning_occasion_id`;
- positive evidence exists across at least 2 separated learning occasions; calendar-day separation is acceptable but not required if the review policy intentionally creates a later occasion;
- at least 1 P4/P5 is present;
- no unresolved N3/N4 since the latest successful repair;
- for productive skills, enough valid samples exist that no single low-confidence evaluation dominates.

Exact review intervals are not set in F02.

### M5 — UNSTABLE

Meaning:
A previously demonstrated/stable skill now has contradictory recent evidence, but regression is not yet confirmed.

Entry:
- from M3/M4 after one valid N2/N3/N4;
- or recent evidence becomes materially mixed after prior positive consistency.

UNSTABLE triggers a review/repair priority.

### M6 — REGRESSED

Meaning:
There is repeated valid evidence that a previously demonstrated/stable skill is no longer reliable.

Entry requires one of:
- at least 2 N2/N3/N4 events on distinct new task instances after the last strong positive confirmation;
- N3 transfer failure plus another independent failure on a separate item;
- repeated exam-like failure on the targeted Micro-skill.

REGRESSED is not triggered by time passage alone.

---

# 8. Formal Mastery transitions

## 8.1 Allowed forward transitions

- M0 → M1
- M0 → M2
- M1 → M2
- M2 → M3
- M3 → M4

No direct M0 → M4.

No exact-repeat sequence can directly create M3/M4.

## 8.2 Contradiction transitions

- M3 → M5 after one valid strong contradictory event.
- M4 → M5 after one valid strong contradictory event.
- M5 → M6 after regression confirmation.
- M5 → M3/M4 only after new independent positive confirmation appropriate to the prior state.
- M6 → M2 after repair plus new independent success.
- M6 → M3 only after the full M3 evidence requirements are re-established.
- M6 cannot jump directly to M4.

## 8.3 Time transition

Time passage alone:
- does not change M0–M6;
- changes ReviewState/freshness;
- may make a previously STABLE skill `DUE` or `OVERDUE`;
- reduces how strongly old evidence may contribute to future readiness.

This prevents OTTO from falsely claiming forgetting without observation.

## 8.4 Deterministic state-resolution order

When a recomputation sees evidence that could satisfy more than one state rule, it evaluates in this order:

1. **Evidence validity/sufficiency gate** — invalid evidence is excluded; if no meaningful scorable set remains, M0.
2. **Prior demonstrated-state contradiction gate** — if prior state was M3/M4 and a strong unresolved N2/N3/N4 exists, resolve to M5 unless M6 regression criteria are already met.
3. **Regression gate** — if M6 criteria are met, M6 takes precedence over positive historical evidence.
4. **Stable gate** — if all M4 conditions are currently satisfied and there is no unresolved strong contradiction, M4.
5. **Provisional gate** — if all M3 conditions are satisfied and there is no unresolved strong contradiction, M3.
6. **Developing/mixed gate** — if meaningful positive and negative evidence coexist and M2 criteria are met, M2.
7. **Weak gate** — if M1 predominantly-negative criteria are met and the evidence set is not mixed enough to satisfy M2, M1.
8. **Developing-positive gate** — if M2 criteria are met from positive progress without enough evidence for M3, M2.
9. **Fallback** — M0, with a risk/contradiction marker when evidence exists but does not satisfy a higher state.

A state engine must emit one `transition_reason_code` explaining the selected branch. It must not average its way around contradictory evidence.

---

# 9. Evidence aggregation rules

## 9.1 Distinctness

Two events count as distinct confirmation only if:
- different `task_instance_id`; and
- different `content_fingerprint`; and
- not the same near-duplicate `variant_group_id` when that would allow answer-pattern recall; and
- for transfer claims, different `transfer_context_id` and a demonstrably new context/material.

A task that only rewords surface details while preserving the same answer pattern inside the same `variant_group_id` may support practice, but cannot satisfy P4 transfer on its own.

## 9.2 Same-item retry

A same-item retry after feedback can:
- prove self-correction;
- move an ErrorObject through repair states;
- contribute to learning history.

It cannot by itself:
- prove transfer;
- create M3 or M4.

## 9.3 Contradictory evidence

If recent evidence contains both strong positive and strong negative events:
- before M3: state is M2 DEVELOPING only if the explicit M2 minimum is satisfied;
- before M3 but below the M2 minimum: remain M0 INSUFFICIENT_EVIDENCE and set a contradiction/risk marker;
- after M3/M4: state becomes M5 UNSTABLE;
- planner/review later prioritizes a new independent check.

OTTO does not average contradiction away into a comfortable percentage and does not bypass formal state criteria.

## 9.4 Low-quality evidence

Evidence with `data_quality=limited` may support learning decisions but cannot independently satisfy the final required evidence for M3/M4.

Evidence with `data_quality=invalid` is stored for audit/UX but excluded from mastery transitions.

## 9.5 Productive evaluator confidence

- high/medium confidence may be used in transition logic;
- low confidence cannot be the decisive event that creates M3/M4;
- conflicting low-confidence evaluations should trigger additional evidence collection rather than automatic downgrade.

---

# 10. Error Model

## 10.1 ErrorObject schema

Every meaningful learning error becomes a first-class object.

### Identity

- error_id;
- user_id;
- module;
- teil_or_aufgabe;
- skill_node_id;
- task_instance_id;
- originating_event_id.

### Learner action

- original_response;
- original_action_type;
- selected_answer where objective;
- learner_sample where productive.

### Correct/expected basis

- correct_answer where objective;
- evidence_basis / text span / audio segment where available;
- expected_task_function where productive;
- applicable criterion observation where productive.

### Classification

- error_type;
- error_cause_hypothesis;
- cause_confidence: high / medium / low;
- classification_source: rule / human / AI / mixed.

### Assistance and attempts

- assistance_before_error;
- repair_attempt_ids[];
- repair_attempt_count;
- max_assistance_during_repair;
- self_repair_result.

### Transfer and review

- transfer_event_ids[];
- transfer_status;
- delayed_review_event_ids[];
- review_status;
- review_required;
- review_reason;
- next_review_at (nullable until B1-F04 assigns a schedule);
- recurrence_count;
- first_seen_at;
- last_seen_at;
- resolved_at if operationally resolved;
- reopened_at if recurrence.

### Links

- related_error_ids[];
- linked_evidence_event_ids[];
- root_error_id for recurrences of the same tracked pattern.

---

# 11. Error status lifecycle

Canonical statuses:

1. **NEW**
2. **EXPLAINED**
3. **SELF_REPAIR_PENDING**
4. **SELF_REPAIRED**
5. **TRANSFER_PENDING**
6. **PROVISIONALLY_RESOLVED**
7. **REVIEW_SCHEDULED**
8. **RESOLVED**
9. **RETURNED**

## NEW

Error detected and linked to a Micro-skill.

## EXPLAINED

OTTO has provided:
- what was wrong;
- why;
- the relevant evidence/rule;
- without silently replacing the learner’s work with a finished answer before self-repair when self-repair is possible.

## SELF_REPAIR_PENDING

Learner has not yet successfully corrected own response.

## SELF_REPAIRED

Learner corrected the original/similar immediate attempt without disqualifying answer-level assistance.

An assisted/model-exposed correction may be stored as repair progress, but the lifecycle remains active until independent repair/transfer evidence exists.

This is not transfer and not full closure.

## TRANSFER_PENDING

A new-context item is required.

## PROVISIONALLY_RESOLVED

Requirements:
- self-repair successful;
- independent transfer success P4 or valid equivalent;
- no immediate contradiction.

A delayed review is still required.

## REVIEW_SCHEDULED

A future review obligation exists.

Requirements:
- `review_required=true`;
- `review_reason` populated;
- `next_review_at` may temporarily be null before B1-F04 assigns an interval/date;
- once scheduling policy runs, `next_review_at` is populated.

This lets B1-F03 finish a repair loop without inventing scheduler timing before B1-F04 exists.

## RESOLVED

Operational closure requirements:
- self-repair successful;
- independent transfer success;
- delayed independent review on a new task/context is successful;
- no unresolved recurrence of the same error pattern.

RESOLVED is not permanent immunity. A future recurrence reopens the object or creates a linked RETURNED recurrence.

## RETURNED

The same Micro-skill/error pattern recurs after provisional/full resolution.

Effects:
- recurrence_count increments;
- mastery may become UNSTABLE/REGRESSED depending on evidence;
- review priority increases;
- new repair cycle begins.

---

# 12. Error Repair Contract

Formal loop:

**detect → explain → self-repair → transfer → delayed review → close/reopen**

## Step 1 — Detect

Create/link ErrorObject when a valid event contains:
- objective wrong answer;
- productive task omission/failure;
- targeted criterion/micro-skill failure;
- invalid strategy causing the result.

## Step 2 — Explain specific cause

The explanation must identify:
- the targeted Micro-skill;
- the concrete mistake;
- the evidence/rule/context causing the mismatch;
- why the learner’s choice/action fails.

Generic “неправильно” is insufficient.

If the exact cause is uncertain:
- store a hypothesis with confidence;
- avoid presenting hypothesis as fact.

## Step 3 — Learner self-repairs

Default:
- ask learner to correct the answer/text/utterance themselves when pedagogically possible.

If learner cannot self-repair:
- assistance may be escalated gradually;
- every consumed assistance event is recorded;
- the ErrorObject remains active;
- a correction produced only after phrase_start/full_model is assisted correction, not independent SELF_REPAIRED for closure purposes;
- OTTO must later obtain an independent repair or move to a new independent transfer check once the learner can attempt it.

A model answer shown before a genuine self-repair attempt changes the immediate evidence to model_exposed and cannot satisfy the independent-repair requirement.

## Step 4 — New similar item

After successful repair, present a new task instance targeted at the same Micro-skill.

It must not be the identical item.

## Step 5 — Transfer

To count as transfer:
- new context/material;
- no answer disclosure;
- no disqualifying assistance;
- targeted Micro-skill remains the same.

Transfer success → P4.

Transfer failure → N3 and error remains active.

## Step 6 — Delayed review

Future scheduler must create a later independent check.

Immediate transfer is not enough for long-term closure.

## Closure

Error can become RESOLVED only after:
- successful self-repair;
- successful independent transfer;
- successful delayed independent review.

Any recurrence later may reopen it.

---

# 13. Review Contract

B1-F02 defines the data contract; B1-F04 will implement scheduling.

## 13.1 ReviewState values

- **NOT_DUE**
- **RECENTLY_REPAIRED**
- **TRANSFER_PENDING**
- **SCHEDULED**
- **DUE**
- **OVERDUE**
- **REGRESSION_DETECTED**

## 13.2 Required scheduler inputs

Per Micro-skill/ErrorObject:

- mastery_state;
- policy_version;
- learning_occasion_id history;
- last_valid_evidence_at;
- last_independent_success_at;
- last_transfer_success_at;
- last_failure_at;
- last_exam_like_at;
- first_seen_error_at;
- last_error_at;
- recurrence_count;
- repair status;
- next_review_at;
- last_review_result;
- support level of latest successes;
- number of distinct contexts;
- stale/fresh flag;
- learner availability/history later supplied by planner.

## 13.3 When a skill/error becomes due

A review item is DUE when either:

1. `now >= next_review_at`; or
2. a previously demonstrated skill exceeds a configured freshness window; or
3. a strong contradictory event creates UNSTABLE/REGRESSION_DETECTED; or
4. a repaired error has completed transfer but has not yet received delayed confirmation.

The exact interval function is owned by B1-F04.

## 13.4 Successful review

A delayed review is successful when:
- it occurs in a later `learning_occasion_id`, not merely later in the same uninterrupted session;
- task instance/context is new enough to avoid simple recall;
- evidence is valid;
- success is independent or meets the required review policy;
- targeted Micro-skill is the same;
- official exam-like constraints are respected if stage=exam_like.

A review after strong assistance may be useful learning evidence but does not satisfy an independent delayed-review requirement.

## 13.5 Failed review

A failed delayed review:
- reopens/returns the ErrorObject;
- creates negative evidence;
- may move mastery to UNSTABLE or REGRESSED;
- creates a new repair obligation.

---

# 14. Learning Stages

Learning stage is not mastery state.

## L0 — WORKED_EXAMPLE

Purpose:
- demonstrate how the task/skill works.

Entry:
- new or highly weak skill;
- learner requests example;
- curriculum chooses demonstration.

Exit condition:
- learner can attempt with less direct support.

Evidence:
- P0 exposure unless learner later performs independently.

## L1 — GUIDED

Purpose:
- learner performs while support remains available/structured.

Entry:
- after worked example or when independent attempts repeatedly fail.

Exit toward independent:
- at least one successful attempt without full_model/phrase_start;
- learner understands task and can initiate correct process.

This is a pedagogical gate, not mastery.

## L2 — INDEPENDENT

Purpose:
- test unaided performance on a new task instance.

Entry:
- guided task can be attempted without answer content;
- or diagnostic user starts directly here.

Success may create P3.

Repeated failure may return learner to guided/repair.

## L3 — TRANSFER

Purpose:
- test same Micro-skill in a genuinely different context/material.

Entry:
- at least one credible independent/direct success or successful self-repair.

Success may create P4.

Failure creates/updates error and blocks provisional demonstration.

## L4 — EXAM_LIKE

Purpose:
- test performance under official-aligned constraints and without training help.

Entry has two valid paths.

**Learning-progression path**
- Micro-skill is at least DEVELOPING and has prior independent evidence;
- task implementation can preserve the relevant official constraints.

**Assessment path**
- diagnostic/checkpoint/mock may enter EXAM_LIKE directly from M0 or any later state;
- task implementation must preserve the relevant official constraints;
- no training assistance is consumed.

A direct assessment-path P5 is strong evidence, but normal mastery rules still apply: one exam-like success cannot jump a skill directly to STABLE.

Success may create P5.

Exam-like stage is not itself proof of full module readiness.

---

# 15. Readiness Input Contract

B1-F06 will compute readiness. B1-F02 provides inputs only.

For each module, readiness may consume:

## Coverage

- official Teil/Aufgabe nodes from F01;
- Micro-skills with any valid evidence;
- Micro-skills with sufficient evidence;
- missing/unseen nodes.

## Mastery

- distribution of M0–M6;
- count/list of STABLE;
- PROVISIONALLY_DEMONSTRATED;
- DEVELOPING/WEAK;
- UNSTABLE/REGRESSED.

## Independence

- share/list of recent successful evidence that is P3/P4/P5;
- skills demonstrated only with assistance;
- high-support dependencies.

## Transfer

- transfer-confirmed skills;
- transfer-pending skills;
- transfer failures.

## Freshness

- last independent evidence;
- due/overdue skills;
- stale evidence.

## Errors

- unresolved errors;
- recurrence count;
- returned errors;
- recent strong negative evidence.

## Timing

- valid response-time observations;
- exam-like time compliance where available;
- timeout/incomplete events.

## Checkpoints / exam-like

- valid P5 events;
- Teil-level checkpoint evidence;
- future full module mock evidence.

## Productive-skill confidence

- evaluator source;
- evaluator confidence;
- missing audio flags;
- criterion observation coverage.

## Missing-data flags

Examples:
- no Hören evidence under official replay constraint;
- no real-audio pronunciation evidence;
- no independent Schreiben sample;
- no transfer evidence for a Teil;
- evidence too stale.

## Boundary

Readiness output must be an OTTO internal educational state.

It must not:
- equal the official Goethe module score;
- reuse 60/100 as an OTTO threshold by default;
- claim official pass/fail;
- claim a probability of passing without a separately validated predictive model.

It must be allowed to return:
**INSUFFICIENT_EVIDENCE**.

---

# 16. Scenario validation matrix

## S01 — One correct answer, no prior evidence

Evidence:
- P3 if independent and valid.

Mastery:
- remains M0 INSUFFICIENT_EVIDENCE.

Review/error:
- no error object.
- may collect another distinct check later.

Must not infer:
- mastery;
- stability;
- readiness.

## S02 — One correct answer after hint

Evidence:
- P1 or P2 depending on consumed help.

Mastery:
- M0 or contributes toward M2 if other evidence exists.

Must not infer:
- independent competence.

## S03 — Two correct answers on same exact item

Evidence:
- first event classified normally;
- second/third are exact-repeat evidence.

Mastery:
- cannot create M3/M4 by repetition alone.

Must not infer:
- transfer.

## S04 — Correct independent answer on new transfer item

Evidence:
- P4.

Mastery:
- may help move M2 → M3 if other M3 conditions are satisfied.

Must not infer:
- STABLE from one transfer.

## S05 — Error → self-correction → transfer success

Evidence:
- N2/N3 as originating error depending context;
- self-repair event;
- P4 transfer success.

Mastery:
- typically M1/M2 → M2 or M3 depending prior independent evidence.

Error:
- PROVISIONALLY_RESOLVED;
- delayed review still required.

Must not infer:
- permanent resolution.

## S06 — Error → self-correction → later recurrence

Evidence:
- prior repair + later N2/N3.

Mastery:
- if previously M3/M4 → M5 UNSTABLE;
- if not yet demonstrated → remains/returns M1/M2.

Error:
- RETURNED;
- recurrence_count increments.

## S07 — Strong old evidence, no recent check

Evidence:
- old P4/P5 remains historical.

Mastery:
- may remain M4 STABLE.

Review:
- DUE/OVERDUE when freshness policy triggers.

Must not infer:
- forgetting without evidence.

Readiness later:
- must see stale/due flag.

## S08 — Conflicting evidence across days

Evidence:
- strong positive and negative events.

Mastery:
- before M3: M2 DEVELOPING;
- after M3/M4: M5 UNSTABLE.

Action:
- new independent check/repair.

Must not:
- average contradictions into a simple percentage.

## S09 — Hören success after extra replay

Evidence:
- success stored;
- extra_training_replay_count > 0;
- independence degraded;
- not valid P5.

Mastery:
- can support learning/developing.

Must not infer:
- exam-like listening independence.

## S10 — Hören success under official replay constraint

Evidence:
- independent;
- official replay count respected;
- valid data;
- can be P3/P4/P5 depending stage/context.

Mastery:
- may advance under normal state rules.

## S11 — Schreiben good task fulfillment, weak structures

Evidence:
- task_functions_observed strong;
- structures_observation weak;
- same response may generate positive evidence for one Micro-skill and negative evidence for another.

Mastery:
- skill-specific, not one whole-writing state.

Must not infer:
- “Schreiben mastered” from task fulfillment alone.

## S12 — Schreiben corrected after full model shown

Evidence:
- model_exposed;
- P0/P1 depending subsequent action.

Mastery:
- does not create independent evidence.

Error:
- may record exposure/repair attempt, but independent repair remains unproven.

## S13 — Sprechen text-only input

Evidence:
- may support planning, grammar, task-function observations if the task permits text-mode training.

Pronunciation:
- not_scorable / invalid.

Must not infer:
- pronunciation;
- actual oral fluency.

## S14 — Sprechen real audio, task success, pronunciation issue

Evidence:
- positive task-function evidence;
- negative pronunciation evidence for the relevant Micro-skill;
- both can coexist.

Mastery:
- separate skill nodes evolve separately.

Must not infer:
- total Sprechen failure solely from one pronunciation issue.

## S15 — Skill with zero evidence

Mastery:
- M0 INSUFFICIENT_EVIDENCE.

Readiness input:
- missing-data flag.

## S16 — High activity count, low independence

Evidence:
- many P0/P1 events;
- few/no P3+.

Mastery:
- at most DEVELOPING if valid progress exists; otherwise M0.

Must not infer:
- mastery from volume.

---

# 17. Downstream contracts

## For B1-F03 — Error Repair Loop

Consumes:
- ErrorObject schema;
- Error status lifecycle;
- self-repair requirements;
- transfer requirement;
- assistance recording.

Produces later:
- runtime repair events.

## For B1-F04 — Review Scheduler

Consumes:
- ReviewState;
- next_review_at;
- timestamps;
- mastery state;
- recurrence;
- latest support/independence;
- transfer and delayed-review obligations.

F04 decides scheduling intervals/priorities.

## For B1-F05 — Adaptive Daily Planner

Consumes later:
- mastery state;
- review state;
- due/overdue;
- unresolved errors;
- independence deficits;
- stale evidence;
- available session duration;
- history.

F02 does not decide planner ranking.

## For B1-F06 — Readiness Engine

Consumes:
- Readiness Input Contract in section 15.

F02 does not define readiness arithmetic or labels beyond preserving INSUFFICIENT_EVIDENCE capability.

---

# 18. Technical invariants

1. EvidenceEvent is immutable/append-only.
2. F01 skill IDs are immutable in F02.
3. SkillState is derivable from evidence + policy; raw evidence is not overwritten when state changes.
4. ErrorObject links to evidence; it does not replace evidence.
5. Mastery and ReviewState are separate dimensions.
6. LearningStage and MasteryState are separate dimensions.
7. Assistance offered and assistance consumed are distinct.
8. Invalid evidence is stored but excluded from advancement.
9. Same-item retries cannot satisfy transfer.
10. Time passage changes freshness/review obligation, not observed competence by fiat.
11. Productive evidence records evaluator provenance/confidence.
12. No pronunciation evidence without audio.
13. No official Goethe score is computed in F02.

---

# 19. Independent-review status

Technical Architecture findings TA-01..TA-05 have been incorporated:
- content/variant identity added for transfer validity;
- policy-versioned SkillState snapshots added;
- deterministic state-resolution order added;
- learning-occasion identity added;
- review obligation separated from scheduler-assigned date.

QA findings QA-01..QA-04 have been incorporated:
- mixed evidence no longer defaults incorrectly to WEAK;
- formal M2 minimum cannot be bypassed by contradiction prose;
- EXAM_LIKE supports direct diagnostic/checkpoint/mock entry;
- assisted correction cannot masquerade as independent self-repair.

QA must re-check:
- all 16 scenarios;
- one-attempt protection;
- assistance edge cases;
- contradiction/review behavior;
- error closure rules.

GOETHE boundary review must verify:
- no mastery rule is presented as official;
- task criteria remain inherited from F01;
- 60/100 is not reused as OTTO mastery/readiness;
- exam_like means official-aligned simulation, not official certification.

---

# 20. Current draft status

Technical Architecture and first-pass QA changes are incorporated.

Next independent route:
**QA re-check → GOETHE boundary check → Director scope check**.

DEV remains blocked.
