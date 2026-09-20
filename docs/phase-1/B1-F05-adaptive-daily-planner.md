# B1-F05 — Adaptive Daily Planner / «Моя подготовка»

Status: **DRAFT FOR INDEPENDENT REVIEW**  
Phase: **PHASE 1 — FOUNDATION**  
Parent: **#2 OTTO B1 — PRODUCT REVIEW & REDESIGN**  
Task: **#11 [B1-F05] Adaptive Daily Planner / Моя подготовка**  
Frozen Foundation baseline: `a5e739a923815240fd45442f4ea55b9b37173e0b`  
Frozen inputs: **B1-F01 + B1-F02 + B1-F03 + B1-F04**  
Scope: **planner specification only; no application/runtime change**  
Checked: **2026-09-20**

---

# 0. Purpose

B1-F05 defines a deterministic planner for the primary user mode:

**«Моя подготовка»**

The planner answers:

> **Что именно этому пользователю нужно делать сегодня, в каком порядке и почему?**

It does this from frozen Foundation evidence. It does not invent mastery, rewrite review dates, calculate Readiness, or use activity/XP as proof of learning.

The output is a **bounded session plan** for 10 / 25 / 45 minutes plus an audit trail that can explain every selected and deferred action.

---

# 1. Frozen contracts consumed

## B1-F01
- Module → Teil/Aufgabe → Skill → Micro-skill;
- official Goethe exam/task constraints;
- stable skill_node_id.

## B1-F02
- EvidenceEvent;
- P0–P5 / N1–N4 evidence classes;
- M0–M6 Mastery;
- independence/assistance semantics;
- learning stages;
- learning_occasion_id;
- exam_like evidence boundary;
- insufficient-evidence rules.

## B1-F03
- active ErrorObjects;
- returned/recurring errors;
- repair state;
- transfer pending/completed;
- review_required / review_reason handoff;
- blocked transfer/content signal.

## B1-F04
- ReviewState;
- due/overdue;
- next_review_at;
- review priority reasons;
- review level/history;
- blocked_no_valid_item;
- needs_evidence_collection;
- candidate exclusion sets;
- planner-facing urgency category;
- OTTO_REVIEW_V1.

F05 reads these contracts. It does not alter them.

---

# 2. Planner policy version

Canonical Phase 1 policy:

**OTTO_DAILY_PLANNER_V1**

## 2.1 Immutable planner input snapshot

Every plan/revision is computed from one immutable `PlannerInputSnapshot`:

- `planner_input_snapshot_id`;
- generated_at;
- active_modules;
- SkillState snapshot IDs / policy versions consumed;
- active ErrorObject IDs + lifecycle/version references consumed;
- ReviewState/scheduler record IDs + policy versions consumed;
- content_catalog_version;
- content_availability_snapshot_id;
- planner-history/fairness snapshot;
- requested_duration_min.

Candidate generation and ranking may not mix records from different input snapshots inside one plan revision.

If relevant state changes after snapshot creation, F05 creates a new `plan_revision` using a new snapshot.

Every plan stores:
- planner_policy_version;
- generated_at;
- plan_id;
- plan_revision;
- planner_input_snapshot_id;
- learning_occasion_id;
- requested_duration_min;
- active_modules;
- source_state_version/basis snapshot references where available;
- candidate_action_ids;
- selected_action_ids in order;
- estimated_duration_min per selected action;
- primary_reason_code per action;
- supporting_signal_ids/references;
- deferred/skipped candidate IDs;
- defer/skip reason codes;
- conflict rule applied;
- anti_monopoly rule applied;
- content-block flags;
- estimated_total_work_min;
- reserved_wrap_min;
- extension flag.

Plan revisions are auditable. Earlier plan versions are not overwritten.

---

# 3. Active module scope

Planner only schedules modules the user is currently preparing.

Canonical active module set is a subset of:
- LESEN;
- HÖREN;
- SCHREIBEN;
- SPRECHEN.

Rules:
1. Inactive modules are excluded from ordinary candidate generation.
2. Their weak/missing evidence remains stored but cannot be silently used to consume session time.
3. Changing active module scope is a **persistent preparation setting**, not a daily planning choice and not a mastery transition.
4. The “Моя подготовка” daily start screen must not force the learner to choose which module/task to study today.
5. Planner audit records `MODULE_NOT_ACTIVE` for excluded candidates when they otherwise exist.
6. Strong performance in one active module never compensates for weak/missing evidence in another active module.

Daily UX:
- user confirms/chooses 10 / 25 / 45 minutes;
- OTTO shows a concise plan summary;
- one primary CTA starts the plan;
- OTTO determines module/task order from the deterministic policy.

---

# 4. Planner candidate model

A `PlannerCandidateAction` represents one possible useful next action.

## 4.0 Deterministic duration source

Every executable candidate must have `estimated_duration_min`.

Priority of duration source:

1. explicit task/content metadata from the versioned content catalog;
2. if absent, `OTTO_DAILY_PLANNER_V1` action-type default:
   - RECOVERY_REPAIR = 6 min
   - OVERDUE_REVIEW = 4 min
   - DUE_REVIEW = 4 min
   - POST_REPAIR_CONFIRMATION = 4 min
   - TRANSFER_CHECK = 5 min
   - WEAK_SKILL_BUILD = 8 min
   - DEVELOPING_SKILL_BUILD = 7 min
   - ASSISTANCE_DEPENDENCY_RECHECK = 5 min
   - EVIDENCE_GAP_PROBE = 5 min
   - STALE_MAINTENANCE = 4 min
   - EXAM_LIKE_CHECKPOINT = 10 min unless content metadata supplies a longer required minimum;
3. if neither content metadata nor a valid policy default can safely represent the action, set `content_status=BLOCKED_MISSING_DURATION`.

No AI duration guess is permitted.

A blocked-duration candidate is non-executable and handled like other content blocks.

Required fields:

- candidate_action_id;
- skill_node_id;
- module;
- teil_or_aufgabe;
- action_type;
- primary_reason_code;
- secondary_reason_codes[];
- source_error_ids[];
- source_review_record_id if any;
- source_evidence_ids[];
- mastery_state;
- review_state;
- evidence_sufficiency;
- independence_status;
- assistance_dependency;
- recurrence_count;
- transfer_status;
- freshness_status;
- exam_like_evidence_status;
- content_status;
- blocked_no_valid_item;
- estimated_duration_min;
- stage_target;
- candidate_content_ids/exclusion metadata;
- last_selected_at;
- recent_same_skill_minutes;
- recent_same_module_minutes.

Candidates are generated from state. The planner does not invent a candidate when no valid learning/review/content action exists.

---

# 5. Action types

Canonical action types:

1. **RECOVERY_REPAIR**
   - returned/regressed/current critical error work owned by F03.

2. **OVERDUE_REVIEW**
   - F04 ReviewState OVERDUE.

3. **DUE_REVIEW**
   - F04 ReviewState DUE.

4. **POST_REPAIR_CONFIRMATION**
   - repaired/transferred error waiting for required delayed confirmation.

5. **TRANSFER_CHECK**
   - F03 transfer pending after repair or learning stage ready for transfer.

6. **WEAK_SKILL_BUILD**
   - M1 WEAK with valid training content.

7. **DEVELOPING_SKILL_BUILD**
   - M2 DEVELOPING needing independent/transfer progression.

8. **ASSISTANCE_DEPENDENCY_RECHECK**
   - repeated assisted success without enough independent evidence.

9. **EVIDENCE_GAP_PROBE**
   - M0 / missing coverage where useful content exists and the user is preparing that module.

10. **STALE_MAINTENANCE**
    - stable/provisional skill that F04 marks due/stale for maintenance.

11. **EXAM_LIKE_CHECKPOINT**
    - bounded official-aligned simulation/checkpoint used to obtain P5-style evidence; never an official Goethe result.

12. **BLOCKED_CONTENT**
    - planner-visible non-executable record when high-priority work has no valid content.

BLOCKED_CONTENT is never scheduled as a user task. It exists for audit and fallback selection.

---

# 6. Primary reason codes

Canonical reason codes:

- `REGRESSION_DETECTED`
- `RETURNED_ERROR`
- `ACTIVE_ERROR_REPAIR`
- `OVERDUE_REVIEW`
- `DUE_REVIEW`
- `POST_REPAIR_CONFIRMATION`
- `TRANSFER_PENDING`
- `WEAK_SKILL`
- `DEVELOPING_SKILL`
- `ASSISTANCE_DEPENDENCY`
- `INSUFFICIENT_EVIDENCE`
- `STALE_EVIDENCE`
- `EXAM_LIKE_EVIDENCE_GAP`
- `MODULE_STARVATION_GUARD`
- `CONTENT_BLOCK_FALLBACK`

Each selected action must have exactly one primary reason and may have several supporting reasons.

---

# 7. Candidate priority classes

The planner uses lexicographic priority classes, not a hidden weighted score.

## P0 — Recovery / regression
Includes:
- REGRESSION_DETECTED;
- RETURNED_ERROR;
- active failed-review recovery.

## P1 — Time-bound review obligations
Includes:
- OVERDUE_REVIEW;
- DUE_REVIEW;
- POST_REPAIR_CONFIRMATION.

## P2 — Incomplete learning closure
Includes:
- TRANSFER_PENDING;
- assistance dependency requiring independent check.

## P3 — Demonstrated learning need
Includes:
- M1 WEAK;
- M2 DEVELOPING.

## P4 — Evidence acquisition
Includes:
- M0 insufficient evidence;
- missing official Teil/Micro-skill evidence;
- missing independent evidence where activity is mostly assisted.

## P5 — Maintenance / exam-like confirmation
Includes:
- stale maintenance;
- exam-like evidence gap/checkpoint;
- strong user maintenance work.

A lower numeric class has higher base priority.

---

# 8. Deterministic tie-break order

Within the same priority class, order candidates by:

1. **executable before blocked**;
2. higher review urgency:
   - OVERDUE > DUE > SCHEDULED/other;
3. larger `overdue_by_ms`;
4. higher recurrence_count;
5. stronger negative evidence class:
   - N4 > N3 > N2 > N1;
6. worse Mastery severity:
   - M6 > M5 > M1 > M2 > M0 > M3 > M4 for learning-need ordering;
7. greater independence deficit;
8. greater freshness age / older last valid independent evidence;
9. module starvation debt;
10. least recently selected skill;
11. stable `skill_node_id` lexical order;
12. stable candidate_action_id lexical order.

No AI semantic preference may override this ordering without a new versioned policy.

---

# 9. Module starvation / fairness state

F05 maintains planner-history metadata only:

Per active module:
- last_planned_session_id;
- consecutive_completed_sessions_skipped;
- recent_planned_minutes over the last 3 completed sessions.

Per skill:
- last_selected_at;
- recent_same_skill_minutes over the last 3 completed sessions.

These are planner fairness signals, not mastery evidence.

## Module starvation debt

For an active module with at least one executable candidate:
- debt increases by 1 after each completed session in which the module receives no work;
- debt resets to 0 when the module receives a meaningful action.

## Deterministic fairness injection

For 25/45-minute plans:

1. P0 recovery is never displaced by module fairness.
2. If P0/P1 obligations exist, serve at least one highest-ranked executable P0/P1 action first.
3. At the **next eligible non-P0 slot**, if an active module has starvation debt >= 2 and an executable candidate that fits, reserve that slot for the highest-debt module.
4. Debt tie-break:
   - greater debt;
   - older last_planned_session_id / least recently planned;
   - higher candidate priority class;
   - stable module order LESEN → HÖREN → SCHREIBEN → SPRECHEN only as final deterministic tie-break.
5. After the fairness slot, return to normal global ranking.

If no P0/P1 exists, the highest-debt eligible module may claim the first non-P0 slot.

For 10-minute sessions:
- starvation debt is only a tie-break; the short session is not required to cover multiple modules.

Planner history cannot change Mastery.

---

# 10. Anti-monopoly rules

The planner must prevent one skill/review queue from consuming every session indefinitely.

## Same Micro-skill cap

Normal daily plan:
- one Micro-skill may consume at most **50% of instructional minutes**.

Exception:
- P0 REGRESSION/RETURNED_ERROR may use up to **70%** in a 10-minute session or when it is the only executable high-value work.

For 25/45 minutes with another active module having valid work:
- reserve at least one meaningful action outside the monopolizing Micro-skill.

### Cap evaluation

Before inserting an indivisible action, compute projected same-skill share.

- if projected share stays within cap → allow;
- if it exceeds cap and another valid action fits the slot → defer with `SAME_SKILL_CAP`;
- if the single indivisible action itself exceeds the cap and no alternative valid action can satisfy the slot, allow it and record `CAP_EXCEPTION_INDIVISIBLE_ACTION`;
- the exception does not permit adding further same-skill actions beyond that indivisible action.

## Same module cap

When 2+ active modules have executable candidates:

For 25/45 minutes:
- one module should not exceed **70% of instructional minutes** unless all other modules are blocked/ineligible.

Before insertion, evaluate projected module share:
- if another valid-module action fits and projected share would exceed 70%, defer with `SAME_MODULE_CAP`;
- a single indivisible long action may exceed the cap only when no alternative valid action can fill the slot; record `CAP_EXCEPTION_INDIVISIBLE_ACTION`.

For 10 minutes:
- no hard module split is required.

## Review queue cap

A candidate counts toward the ordinary review cap when `counts_toward_review_cap=true`.

Set true for:
- OVERDUE_REVIEW;
- DUE_REVIEW;
- POST_REPAIR_CONFIRMATION;
- STALE_MAINTENANCE when it is generated from an active F04 review obligation.

Set false for:
- RECOVERY_REPAIR;
- TRANSFER_CHECK owned by the active F03 learning/repair flow;
- EVIDENCE_GAP_PROBE;
- ordinary WEAK/DEVELOPING skill building;
- exam-like checkpoint unless it is explicitly fulfilling an F04 review obligation.

Maximum ordinary review actions in the base daily plan:
- 10 min: **1**;
- 25 min: **2**;
- 45 min: **3**.

Remaining review obligations stay deferred with `REVIEW_QUEUE_CAP`.

## Repeated-repair cap

Do not schedule repeated same-item repair loops as separate planner actions.

Within one plan, max two distinct actions for the same Micro-skill unless:
- the second is explicitly a new-context transfer/check; or
- no other valid work exists.

---

# 11. Session duration budgets

The user selects exactly one:
- 10 minutes;
- 25 minutes;
- 45 minutes.

Planner reserves a small wrap budget and fills the instructional budget with actions whose estimated durations fit.

| Mode | Instructional budget | Wrap/pre-post budget | Target actions |
|---|---:|---:|---:|
| 10 min | 9 min | 1 min | 1–2 |
| 25 min | 22 min | 3 min | 3–4 |
| 45 min | 41 min | 4 min | 4–6 |

The planner may finish under budget rather than insert low-value/fake work.

No action may be truncated below its content-defined minimum safe duration.

---

# 12. 10-minute composition

Goal:
**one highest-value intervention + one short complement when possible.**

Selection:

1. choose highest-ranked executable candidate that fits;
2. if remaining instructional budget >= 3 min, choose one candidate:
   - preferably different Micro-skill;
   - use a different active module if module starvation debt is higher and priority difference is not P0 vs non-P0;
3. reserve wrap.

Constraints:
- max one ordinary review action;
- full exam-like checkpoint only if a valid micro-checkpoint fits and no P0/P1 obligation would be displaced;
- one high-priority repair may occupy most of the session.

If only one 8–9 minute valid action exists, schedule only that action.

---

# 13. 25-minute composition

Goal:
**repair/retrieval + main learning + second target/transfer.**

Default slot intent:

1. **4–6 min recovery/review slot**
   - highest P0/P1 candidate if present.
2. **9–12 min main learning slot**
   - P2/P3 or highest unmet learning need.
3. **4–7 min diversity/transfer/evidence slot**
   - different Micro-skill/module when possible;
   - may be transfer, evidence gap probe, maintenance or bounded checkpoint.
4. **3 min wrap**

Substitution:
- if no P0/P1 exists, slot 1 becomes short retrieval/maintenance/evidence probe;
- if one module has urgent P0, slot 2 may remain same module but slot 3 should move to another active executable module.

Max ordinary review actions: 2.

---

# 14. 45-minute composition

Goal:
**closed-loop work across more than one need while allowing deeper productive practice.**

Default slot intent:

1. **5–7 min retrieval/recovery**
2. **12–16 min primary learning/repair block**
3. **8–12 min secondary module/skill block**
4. **7–10 min transfer or exam-like checkpoint**
5. **3–4 min closure**

When 2+ active modules have valid work:
- target at least **2 modules**;
- prefer 3 modules only if action duration/content remains meaningful.

Exam-like checkpoint:
- may occupy slot 4 only if no unprocessed P0 recovery in its targeted module and valid official-aligned content exists.

Max ordinary review actions: 3.

---

# 15. Exam-like checkpoint candidate rules

An EXAM_LIKE_CHECKPOINT candidate may be generated only when:

1. targeted module is active;
2. content can respect relevant frozen F01 constraints;
3. no `blocked_no_valid_item`;
4. learner has at least some valid direct evidence for the targeted scope, **or** the checkpoint is explicitly a diagnostic/evidence-acquisition check;
5. no unresolved P0 regression in the exact targeted Micro-skill that should be repaired first;
6. the chosen duration can fit the checkpoint content.

Checkpoint priority:
- never outranks P0 recovery;
- normally does not outrank an overdue post-repair confirmation;
- may outrank low-priority maintenance when exam-like evidence is missing.

A checkpoint outcome creates EvidenceEvents through F02/F01 rules; F05 itself does not score Goethe or calculate Readiness.

---

# 16. Evidence-gap policy

M0 INSUFFICIENT_EVIDENCE is not treated as weakness.

Planner may generate EVIDENCE_GAP_PROBE when:
- module is active;
- Micro-skill/Teil has no or insufficient valid evidence;
- valid content exists;
- the probe is needed to distinguish “unknown” from weak/strong.

Across several evidence gaps:
- use module starvation debt;
- oldest/no-evidence-first;
- then stable skill_node_id tie-break.

Evidence gap work should not displace P0 recovery or urgent P1 overdue obligations indefinitely, but anti-monopoly rules still reserve learning diversity in 25/45-minute sessions.

---

# 17. Assistance-dependency policy

If recent history is dominated by P0/P1/P2 or supported success and lacks enough P3+:

Planner may create:
**ASSISTANCE_DEPENDENCY_RECHECK**

Preferred stage:
- independent attempt on a new valid item;
- transfer if frozen learning stage permits.

Rules:
- do not reward high assisted accuracy as mastery;
- do not repeatedly show the same hint-dependent item;
- if independent attempt fails, F03 creates/updates repair work;
- if success is independent, frozen F02 evidence may advance the skill.

---

# 18. Content availability

Candidate content must satisfy frozen item-validity constraints.

If a high-priority candidate has:
`blocked_no_valid_item=true`

Planner:
1. records candidate as BLOCKED_CONTENT;
2. does not schedule a fake/exact duplicate;
3. selects the next executable candidate;
4. records defer reason `BLOCKED_NO_VALID_CONTENT`;
5. surfaces blocked-content metadata to runtime/content systems.

A blocked high-priority skill remains visible in the audit; it is not silently ignored.

---

# 19. Shortened-plan / blocked-content UX

If the planner cannot fill the requested time with valid work:

1. do not insert duplicate/near-duplicate filler;
2. continue with other valid candidates where available;
3. if the plan still finishes early, tell the learner concisely that OTTO has no valid next item for the blocked target;
4. identify the blocked target in learner-facing language without blaming the learner;
5. post-session summary may say:
   **“Не удалось проверить этот навык — нужен новый материал.”**

This message describes a system/content limitation.

It must not:
- mark the learner wrong;
- lower Mastery;
- create negative EvidenceEvent;
- ask the learner to manually choose random work merely to fill time.

The audit retains the technical block reason `BLOCKED_NO_VALID_CONTENT`.

---

# 20. Conflict-resolution policy

When obligations compete:

## Rule C1 — recovery beats checkpoint
A new P0 error/regression preempts an unstarted EXAM_LIKE_CHECKPOINT.

## Rule C2 — overdue beats ordinary weak-skill work
P1 overdue review ranks above P3 weak/developing work, subject to review caps and anti-monopoly.

## Rule C3 — repair closure before unrelated repetition
TRANSFER_PENDING / post-repair confirmation gets priority over repeating ordinary same-skill practice.

## Rule C4 — executable fallback
Blocked candidate cannot consume session time. Choose next valid candidate.

## Rule C5 — module fairness after urgent coverage
In 25/45 min, once urgent P0/P1 capacity is served, module starvation guard may elevate another active module for one slot.

## Rule C6 — evidence gap is not weakness
M0 is never ranked using a “bad performance” assumption.

## Rule C7 — exact/near duplicate protection
A candidate rejected by frozen content/transfer rules cannot be selected merely because it is convenient.

## Rule C8 — user time is hard
Do not exceed requested 10/25/45 budget.

## Rule C9 — no readiness optimization
Planner does not choose tasks to maximize an invented readiness percentage.

---

# 21. Plan construction algorithm

Given current frozen state snapshot and requested duration:

1. Filter to active modules.
2. Generate PlannerCandidateActions from F02/F03/F04 states.
3. Validate content availability and frozen exclusion rules.
4. Mark blocked candidates.
5. Assign action type + primary/secondary reason codes.
6. Sort by priority class and deterministic tie-breaks.
7. Instantiate duration template (10/25/45).
8. Select candidates in order while applying:
   - review cap;
   - same-skill cap;
   - same-module cap;
   - module starvation guard;
   - duration fit;
   - checkpoint eligibility.
9. Record all deferred/skipped candidates and reasons.
10. Emit ordered plan + audit trail.
11. After each completed action, evaluate replanning triggers.

No stochastic step is allowed in V1.

---

# 22. Replanning policy

Planner never rewrites completed actions.

It creates a new immutable `plan_revision` for remaining unstarted actions.

## Hard replanning triggers

Replan remainder immediately after:
- new N3/N4 or other critical independent failure;
- ErrorObject becomes RETURNED;
- Mastery becomes M5/M6;
- delayed review failure;
- selected content becomes invalid/blocked;
- user changes remaining time;
- user ends session early.

## Normal replanning triggers

Recompute remaining candidates after:
- transfer success P4;
- exam-like P5;
- error becomes provisionally resolved/resolved;
- due review succeeds;
- Mastery transition materially changes candidate class;
- assistance consumed changes independence interpretation.

## Stability rule

Do not interrupt the currently active task.

Replanning affects only unstarted actions.

## Checkpoint preemption

If a new P0 event occurs before a planned checkpoint starts:
- checkpoint is deferred with `PREEMPTED_BY_CRITICAL_RECOVERY`;
- recovery gets the next fitting action slot.

If the checkpoint is already in progress:
- finish/exit according to checkpoint UX; do not inject repair mid-task unless safety/technical failure requires exit.

---

# 23. Early session termination

If the user ends early:

- completed actions/evidence remain valid;
- unstarted planned actions create **no EvidenceEvent**;
- unstarted items are recorded as `DEFERRED_USER_ENDED_SESSION`;
- planner does not mark them failed;
- review obligations remain intact;
- next session is generated from the fresh frozen state, not from the old plan order.

No penalty/mastery downgrade is caused by ending early.

---

# 24. Continue after daily plan

If user chooses to continue:

1. create a new `plan_revision/extension plan`;
2. use the **current post-session state**, not the morning snapshot;
3. exclude exact items/content just completed;
4. prioritize previously deferred valid candidates plus newly created obligations;
5. preserve anti-monopoly rules;
6. keep the same `learning_occasion_id` while the user is continuing the same uninterrupted session.

Because it is the same learning occasion:
- extension work cannot masquerade as a delayed review that requires a later occasion.

UX should ask/allow an extension duration from the supported 10/25/45 set rather than silently creating unlimited work.

---

# 25. Planner audit trail

Every selected action records:

- candidate_action_id;
- rank before constraints;
- selected position;
- primary_reason_code;
- secondary reasons;
- exact frozen signals:
  - mastery;
  - review_state;
  - error status;
  - recurrence;
  - evidence sufficiency;
  - independence;
  - assistance dependency;
  - freshness;
  - transfer status;
  - exam-like evidence gap;
- fairness adjustment;
- anti-monopoly adjustment;
- content validation result;
- estimated duration.

Every deferred/skipped candidate records one or more codes:

- `LOWER_PRIORITY`
- `TIME_BUDGET`
- `REVIEW_QUEUE_CAP`
- `SAME_SKILL_CAP`
- `SAME_MODULE_CAP`
- `MODULE_STARVATION_SLOT`
- `BLOCKED_NO_VALID_CONTENT`
- `MODULE_NOT_ACTIVE`
- `PREEMPTED_BY_CRITICAL_RECOVERY`
- `ALREADY_COVERED_THIS_OCCASION`
- `INVALID_EXACT_OR_NEAR_DUPLICATE`
- `CHECKPOINT_NOT_ELIGIBLE`
- `WAITING_FOR_REPAIR_OR_TRANSFER`
- `DEFERRED_USER_ENDED_SESSION`.

The audit must make it possible to answer:
**“Почему это задание сейчас?”**
and
**“Почему не другое?”**

---

# 26. UX contract — «Моя подготовка»

## Before session

Show:
1. selected duration: 10 / 25 / 45 min;
2. one concise plan summary;
3. 1–3 human-readable reasons, for example:
   - “Эта ошибка вернулась.”
   - “Это повторение уже просрочено.”
   - “После исправления пора проверить навык на новом примере.”
   - “По Schreiben пока недостаточно самостоятельных данных.”
4. modules represented in today's plan;
5. primary CTA:
   **«Начать мою подготовку»**

Do not expose:
- internal M/P/N codes;
- fake readiness percentage;
- long algorithm details.

Optional disclosure:
**«Почему такой план?»** opens a concise explanation derived from audit reason codes.

## During session

Show one next action at a time.

Before each new action, show one short learner-facing **“Почему сейчас”** reason mapped from the action's primary reason code.

Examples:
- RETURNED_ERROR → “Эта ошибка вернулась.”
- OVERDUE_REVIEW → “Это повторение просрочено.”
- ASSISTANCE_DEPENDENCY → “После подсказок проверим, получится ли самостоятельно.”
- TRANSFER_PENDING → “Проверим этот навык на новом примере.”
- INSUFFICIENT_EVIDENCE → “По этому навыку пока недостаточно данных.”
- STALE_EVIDENCE → “Этот навык давно не проверяли.”

Do not expose internal M/P/N states or priority classes.

After action:
- display its actual learning feedback owned by F03/F02;
- do not dump the full replanned queue unless user asks.

If plan changes after new evidence:
- short message:
  **“План обновлён: сначала закрепим эту ошибку.”**
- explanation must map to an audit reason;
- do not interrupt the action already in progress.

## After session

Show only learner-facing outcomes, not internal evidence codes.

Approved status language:
- **“Сделано самостоятельно”**
- **“Получилось с подсказкой”**
- **“Исправлено — проверим позже”**
- **“Ошибка вернулась”**
- **“Недостаточно данных”**

Summary may show:
- what was actually completed;
- which targets were independent vs supported in the plain language above;
- what error was repaired/provisionally resolved/returned;
- what is scheduled for later review;
- what remains insufficient evidence;
- what was deferred due to time/content;
- next recommended action for a future session, without calculating readiness.

Do not aggregate these statuses into a percentage, grade, or Readiness value in F05.

Primary completion message should describe learning progress, not XP.

---

# 27. Outputs for future B1-F06 Readiness

F05 does **not** calculate Readiness.

It may expose to B1-F06/runtime:

- plan_id / session_id references;
- active_modules;
- planned vs completed module/Teil/skill coverage;
- pointers to actual EvidenceEvents produced;
- pointers to exam-like/checkpoint EvidenceEvents;
- unresolved evidence gaps;
- unresolved active/returned errors;
- due/overdue review backlog after session;
- blocked-content flags;
- independence/assistance summary derived from actual events;
- session completion/early-exit metadata.

Important:
- planned work is not evidence;
- skipped work is not negative evidence;
- the source of learning truth remains F02 EvidenceEvents/Mastery;
- F06 must consume actual evidence, not planner rank/priority as proof of readiness.

---

# 28. Outputs for runtime DEV

Future runtime implementation will need:

- deterministic candidate generator;
- deterministic rank/tie-break function;
- session template selector;
- anti-monopoly/fairness state;
- plan audit storage;
- plan revision mechanism;
- reason-code → user copy mapping;
- content availability adapter;
- F03/F04 state adapters.

F05 does not choose technical storage technology or rewrite current app runtime.

---

# 29. Required destructive scenario matrix

## F05-Q01 — many overdue reviews
Expected:
- ranked by urgency/tie-break;
- review cap enforced;
- remaining overdue obligations preserved/deferred.

## F05-Q02 — weak Schreiben + overdue Lesen
25/45 min:
- overdue Lesen receives P1 slot;
- Schreiben receives meaningful learning slot through remaining priority/fairness unless blocked.
10 min:
- P1 may win; Schreiben remains deferred/audited and gains starvation debt if repeatedly skipped.

## F05-Q03 — new critical error + planned checkpoint
Expected:
- unstarted checkpoint preempted;
- P0 recovery next.

## F05-Q04 — insufficient evidence in several modules
Expected:
- evidence probes rotate by active module starvation/oldest gap;
- no module labeled weak solely for missing data.

## F05-Q05 — only 10 minutes
Expected:
- 1–2 highest-value actions only;
- no fake filler;
- one ordinary review cap.

## F05-Q06 — return after one week
Expected:
- F04 overdue/due signals rise;
- review cap prevents entire session becoming reviews;
- some learning diversity remains in 25/45 min.

## F05-Q07 — many repaired errors return simultaneously
Expected:
- P0 ordering;
- same-skill/module caps prevent one repeated pattern taking the whole 25/45 session;
- unresolved backlog remains audited.

## F05-Q08 — high-priority target lacks valid content
Expected:
- BLOCKED_CONTENT;
- choose next executable work;
- no exact duplicate substitution.

## F05-Q09 — constant hint use
Expected:
- assistance-dependency recheck/independent attempt candidate;
- assisted activity not interpreted as mastery.

## F05-Q10 — rapid user improvement
Expected:
- after new P3/P4/P5 and mastery transitions, weak/developing candidates disappear or drop priority;
- plan revisions shift toward transfer/maintenance/checkpoint appropriately.

## F05-Q11 — strong user, no obvious weakness
Expected:
- due maintenance, evidence gaps and eligible exam-like checkpoint populate plan;
- no fake weakness created.

## F05-Q12 — early session termination
Expected:
- unstarted tasks not failed;
- obligations preserved;
- next plan rebuilt fresh.

## F05-Q13 — user continues after plan
Expected:
- extension uses current state;
- same learning occasion;
- completed exact items excluded;
- extension cannot satisfy delayed-review separation merely by continuing.

## F05-Q14 — module not prepared
Expected:
- excluded with MODULE_NOT_ACTIVE;
- cannot consume time.

## F05-Q15 — one skill repeatedly monopolizes
Expected:
- same-skill cap + module starvation guard diversify 25/45 plan when other valid work exists.

## F05-Q16 — review queue larger than session
Expected:
- cap + time budget select subset;
- backlog retained.

## F05-Q17 — blocked content + valid alternative
Expected:
- blocked reason audited;
- valid alternative selected.

## F05-Q18 — overdue signal but underlying candidate event invalid/low-quality
Expected:
- frozen F04/data-quality contract prevents qualifying independent confirmation;
- planner schedules only valid executable review/repair action, not a fake confirmation.

## F05-Q19 — checkpoint planned, sudden regression
Expected:
- P0 preemption if checkpoint unstarted.

## F05-Q20 — all candidate work already completed in same learning occasion
Expected:
- exact/recent exclusion prevents false repeated confirmation;
- planner may finish early or select a different valid target; no filler.

---

# 30. Acceptance checklist

- [ ] Deterministic policy/version defined.
- [ ] Active module scope defined.
- [ ] Candidate action schema defined.
- [ ] Priority classes explicit.
- [ ] Tie-break deterministic.
- [ ] 10/25/45 composition explicit.
- [ ] Review caps explicit.
- [ ] Same-skill/module anti-monopoly explicit.
- [ ] Module starvation/fairness explicit.
- [ ] Evidence gaps handled without fake weakness.
- [ ] Assistance dependency handled.
- [ ] Content blocks handled.
- [ ] Exam-like checkpoint eligibility explicit.
- [ ] Replanning rules explicit.
- [ ] Early termination safe.
- [ ] Continue/extension behavior defined.
- [ ] Audit trail explains selection and deferral.
- [ ] UX before/during/after defined.
- [ ] B1-F06 output contract without readiness arithmetic.
- [ ] Runtime output contract defined.
- [ ] Frozen F01–F04 unchanged.
- [ ] No app/runtime code.
- [ ] No main/production change.

---

# 31. Current review status

Technical findings TA-01..TA-05 are incorporated.
UX findings UX-01..UX-04 are incorporated.

Next:
**UX re-check → QA destructive scenarios → GOETHE boundary (exam-like touched) → Director scope check**

DEV runtime remains blocked.
