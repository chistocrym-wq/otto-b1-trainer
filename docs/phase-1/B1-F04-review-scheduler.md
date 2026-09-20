# B1-F04 — Review / Spaced Retrieval Scheduler

Status: **DRAFT FOR INDEPENDENT REVIEW**  
Phase: **PHASE 1 — FOUNDATION**  
Parent: **#2 OTTO B1 — PRODUCT REVIEW & REDESIGN**  
Task: **#8 [B1-F04] Review / Spaced Retrieval Scheduler**  
Frozen base: `b2a0417a8d4ca56a959046c780bfa671d4aad97e`  
Frozen inputs: **B1-F01 + B1-F02**  
Scope: **deterministic scheduler specification only; no runtime/application change**  
Checked: **2026-09-20**

---

# 0. Purpose

B1-F04 turns the frozen B1-F02 Review Contract into a deterministic OTTO scheduler policy.

It answers:

- why a Micro-skill/error must be checked again;
- when that check becomes due;
- how successful retrieval changes the next interval;
- how failure/recurrence reactivates learning;
- what review work is exposed to future B1-F05.

It does not implement:
- Daily Planner;
- Readiness arithmetic;
- runtime code;
- UI;
- F03 repair flow.

Scheduler timing is **OTTO_METHOD**, not an official Goethe rule and not a scientifically exact prediction of memory.

---

# 1. Frozen inputs

From B1-F02:

ReviewState:
- NOT_DUE
- RECENTLY_REPAIRED
- TRANSFER_PENDING
- SCHEDULED
- DUE
- OVERDUE
- REGRESSION_DETECTED

Other inputs:
- review_required;
- review_reason;
- next_review_at;
- Mastery M0–M6;
- evidence P0–P5 / N1–N4;
- assistance;
- learning_occasion_id;
- transfer identity/protection;
- ErrorObject recurrence/history;
- freshness timestamps;
- policy-versioned derived state.

B1-F04 does not rewrite these semantics.

---

# 2. Scheduler principles

1. Retrieval must use valid new-enough material.
2. Successful independent retrieval increases spacing.
3. Failed retrieval reopens active learning rather than being averaged away.
4. Strong assistance means the review was learning, not independent confirmation.
5. Exact-item and near-duplicate variants cannot satisfy independent delayed review.
6. Time passage makes evidence due/stale, not “forgotten” by fiat.
7. M0 INSUFFICIENT_EVIDENCE is not converted into mastery by scheduling.
8. Dates are deterministic from stored inputs + policy version.
9. Multiple obligations for one Micro-skill are consolidated deterministically.
10. Scheduler never decides the daily session order; B1-F05 does.

---

# 3. Policy version

Scheduler policy ID:

**OTTO_REVIEW_V1**

Every scheduled obligation stores:
- policy_version = OTTO_REVIEW_V1;
- computed_at;
- source_reason;
- basis_event_ids;
- review_level;
- next_review_at;
- state.

A future interval-policy change must increment policy_version.

Historical review events are not rewritten.

---

# 4. Review reason codes

Canonical `review_reason` values:

- `POST_REPAIR_CONFIRMATION`
- `TRANSFER_CONFIRMATION`
- `MASTERY_MAINTENANCE`
- `STALE_EVIDENCE_CHECK`
- `UNSTABLE_RECHECK`
- `REGRESSION_RECHECK`
- `ASSISTANCE_DEPENDENCY_RECHECK`
- `FAILED_REVIEW_RECOVERY`

If several apply, all reasons may be stored, but one primary reason is selected by precedence.

---

# 5. Primary-reason precedence

Highest priority first:

1. REGRESSION_RECHECK
2. UNSTABLE_RECHECK
3. FAILED_REVIEW_RECOVERY
4. POST_REPAIR_CONFIRMATION
5. TRANSFER_CONFIRMATION
6. ASSISTANCE_DEPENDENCY_RECHECK
7. STALE_EVIDENCE_CHECK
8. MASTERY_MAINTENANCE

This precedence determines urgency metadata, not Daily Planner placement.

---

# 6. Review levels and interval table

B1-F04 uses a simple explicit product policy.

## 6.0 Deterministic bootstrap

Scheduler state is derived from immutable evidence history.

Define `review_success_streak` as the number of **qualifying independent separated retrieval confirmations after the current baseline strong event**, stopping/resetting at the most recent unresolved failure/recurrence.

Bootstrap rules:
- successful post-repair independent transfer creates a new baseline and explicitly resets `review_success_streak=0`, `review_level=0`;
- for historical M3/M4 without a scheduler record, identify the latest valid baseline P4/P5 or equivalent strong independent event and count later qualifying review confirmations on later `learning_occasion_id` values;
- `review_level = min(review_success_streak, 5)`;
- if no valid baseline can be established, do not guess a level; emit `needs_evidence_collection=true`.

This makes migration/bootstrap reproducible instead of assigning a level from the mastery label alone.

Intervals are measured from the qualifying independent event.

| review_level | interval after qualifying success |
|---:|---:|
| 0 | 1 day |
| 1 | 3 days |
| 2 | 7 days |
| 3 | 14 days |
| 4 | 30 days |
| 5 | 30 days |

Level 5 is a maintenance cap for Phase 1. OTTO continues periodic checks instead of predicting indefinite retention.

These intervals are:
- OTTO product policy;
- testable;
- intentionally conservative;
- not Goethe rules;
- not claimed to be an exact cognitive-memory law.

---

# 7. Timestamp policy

All scheduler calculations use offset-aware UTC timestamps internally.

`next_review_at = qualifying_event.completed_at + interval`

No rounding to local midnight.

User-local display is a presentation concern later.

This avoids timezone/day-boundary ambiguity.

If completed_at is invalid/missing:
- do not fabricate a due date;
- scheduler record is blocked with `INVALID_TIME_BASIS`;
- planner receives a data-quality problem signal.

---

# 8. Creation of review_required

## 8.1 Post-repair

After F03 produces successful independent transfer:
- review_required = true;
- primary reason = POST_REPAIR_CONFIRMATION;
- review_level = 0;
- ReviewState = RECENTLY_REPAIRED until scheduled;
- next_review_at = transfer completion + 1 day.

## 8.2 Demonstrated skill without active error

For M3 PROVISIONALLY_DEMONSTRATED:
- review_required = true until later separated confirmation;
- reason = TRANSFER_CONFIRMATION or MASTERY_MAINTENANCE depending history.

For M4 STABLE:
- maintenance review required after the current interval cap/history.

## 8.3 Assistance dependency

If recent success is mostly P1/P2 and there is no sufficient P3+ confirmation:
- do not mark mastery as stable;
- scheduler may create ASSISTANCE_DEPENDENCY_RECHECK only when there is an existing learned/repaired target worth rechecking;
- otherwise evidence acquisition belongs to B1-F05, not the review queue.

## 8.4 Insufficient evidence

M0 with no confirmed error/repair history:
- ReviewState = NOT_DUE;
- review_required = false;
- scheduler outputs `needs_evidence_collection=true` for B1-F05.

Never invent “review” for a skill the learner has never meaningfully attempted.

---

# 9. ReviewState transition model

## NOT_DUE

Conditions:
- no active review obligation;
- or M0 evidence gap without repair history.

Transitions:
- → RECENTLY_REPAIRED after successful repair/transfer handoff;
- → SCHEDULED when a maintenance/staleness obligation is created;
- → REGRESSION_DETECTED after strong contradictory evidence on prior demonstrated skill.

## RECENTLY_REPAIRED

Conditions:
- repair/transfer just completed;
- review_required=true.

Scheduler:
- assign level 0;
- next_review_at = qualifying event + 1 day;
- then state → SCHEDULED.

## TRANSFER_PENDING

Frozen F02 state used while valid transfer evidence is still missing.

Scheduler:
- no delayed-review date can close this gap;
- F03/content flow must produce transfer first.

B1-F04 does not turn TRANSFER_PENDING into scheduled delayed review.

## SCHEDULED

Conditions:
- review_required=true;
- valid next_review_at exists;
- now < next_review_at.

When time reaches date:
- → DUE.

## DUE

Conditions:
- now >= next_review_at;
- obligation unresolved.

If completed validly:
- success path or failure path in sections 12–13.

If not completed and overdue threshold crossed:
- → OVERDUE.

## OVERDUE

Policy:
- becomes OVERDUE when now > next_review_at + 3 days.

This 3-day grace period is OTTO_REVIEW_V1 product policy.

Overdue age is stored for planner priority.

## REGRESSION_DETECTED

Entered after:
- review failure on previously M3/M4;
- or frozen F02 state computation reports M5/M6.

Scheduler:
- current normal interval progression is suspended;
- emits immediate high-priority recovery signal;
- F03 owns repair;
- a new spaced sequence begins only after successful new transfer.

---

# 10. Recalculation triggers

Recompute scheduler record when any of these occurs:

- qualifying transfer success;
- delayed review success;
- delayed review failure;
- recurrence;
- Mastery transition to M3/M4/M5/M6;
- change in review_required/review_reason;
- new strong independent EvidenceEvent;
- assistance changes interpretation of a review attempt;
- policy version change;
- invalidated/reclassified evidence that was a basis event.

Do not continuously move dates for unrelated app activity.

---

# 11. Candidate-item validity for review

A delayed review candidate must target the same `skill_node_id`.

It must exclude:

1. same `task_instance_id`;
2. same `content_fingerprint`;
3. near-duplicate `variant_group_id` that allows answer-pattern recall;
4. same `stimulus_id` when stimulus reuse would make retrieval trivial;
5. any item whose answer/model was recently exposed in the same repair cycle.

For strong transfer/delayed-review evidence, require a new `transfer_context_id` or other valid new context.

If no valid candidate exists:
- do not serve a fake review;
- scheduler outputs `blocked_no_valid_item=true`;
- retains review obligation;
- B1-F05/content system receives the block.

---

# 12. Review-attempt event semantics

Every review attempt preserves the **first unassisted outcome** as its own EvidenceEvent.

If the learner first fails and later becomes correct after assistance:
- the original independent failure remains immutable;
- the assisted success is a separate EvidenceEvent;
- assistance never erases the failure;
- F02/F03 may therefore still produce UNSTABLE/REGRESSION + repair work.

A review is a **qualifying success** only if:

- completion data valid;
- targeted Micro-skill correct/sufficient on the qualifying attempt;
- new-enough candidate under section 11;
- consumed assistance = none for independent confirmation;
- if stage=exam_like, relevant F01 constraints were respected.

### Success from level n

On qualifying independent success:
- review_level = min(n + 1, 5);
- state = SCHEDULED unless no further maintenance obligation is desired by future policy;
- next_review_at = success completion + interval for new level;
- last_review_result = success;
- review_required remains true for periodic maintenance while Phase 1 policy applies.

### Strategy-only success

If strategy assistance is consumed:
- store P2/minimally-supported positive evidence;
- do not advance `review_success_streak` or `review_level`;
- next_review_at = completion + current-level interval, minimum 1 day;
- reason includes ASSISTANCE_DEPENDENCY_RECHECK.

### Keyword / evidence_hint success

- store assisted positive evidence;
- do not advance review_success_streak/level;
- review remains unconfirmed independently;
- next_review_at = completion + 1 day;
- reason includes ASSISTANCE_DEPENDENCY_RECHECK.

### phrase_start / full_model required

If answer-level scaffolding was needed:
- do not treat the review as successful independent retrieval;
- preserve the pre-assistance failure/partial event;
- hand off to F03 repair semantics;
- **do not assign a normal spaced-progression date from the scaffolded correction itself**;
- next spaced sequence begins only from a new qualifying F03 transfer basis event.

This prevents answer-level coaching from manufacturing retrieval success.

---

# 13. Failed delayed review

A valid failure creates/links negative evidence under frozen F02.

Scheduler consequences:

1. last_review_result = failure;
2. state = REGRESSION_DETECTED;
3. review_required = true;
4. primary reason = FAILED_REVIEW_RECOVERY or REGRESSION_RECHECK based on Mastery;
5. normal spacing level is suspended;
6. F03 owns the immediate repair loop.

After F03 produces a new successful independent transfer:
- restart review_level = 0;
- next_review_at = new transfer completion + 1 day.

The failed review itself does not silently schedule endless same-item retries.

---

# 14. Effect on Mastery

B1-F04 does not compute Mastery independently.

It supplies events/state to frozen F02.

Expected frozen effects:

- one strong failure after M3/M4 may yield M5 UNSTABLE;
- repeated valid failures may yield M6 REGRESSED;
- time passing alone does not change M4 to M5/M6;
- successful independent delayed review may support M4 STABLE when F02 criteria are satisfied.

Scheduler reads the resulting Mastery state on recompute.

---

# 15. Recurrence policy

When a RESOLVED/previously repaired error returns:

- recurrence_count increments under F03/frozen ErrorObject rules;
- ReviewState → REGRESSION_DETECTED;
- current interval progression is cancelled;
- primary reason = REGRESSION_RECHECK;
- recovery is immediate work, not a distant scheduled review.

After new repair + independent transfer:
- reset review_level to 0.

Repeated recurrence does not cause arbitrarily negative intervals; it increases planner urgency metadata.

---

# 16. Freshness / maintenance

## Stable skill

If M4 STABLE and there is no active repair/error:

- use the last qualifying independent review/transfer as time basis;
- schedule maintenance according to current review_level;
- maximum interval in V1 = 30 days.

## Provisionally demonstrated

M3 requires further separated confirmation:
- schedule according to current level, normally no later than 7 days unless existing history already warrants a shorter pending review.

## Developing / Weak

Scheduler does not replace teaching.

If there is an active repair obligation:
- schedule according to repair flow.

If there is no repair history:
- output learning/evidence gap for B1-F05 rather than flooding review queue.

## Insufficient evidence

No review date solely because state=M0.

Output:
- `needs_evidence_collection=true`;
- missing target metadata.

---

# 17. Multiple obligations for one Micro-skill

Maintain one active scheduler record per user + skill_node_id, with multiple reason codes.

Primary reason chosen by section 5 precedence.

`next_review_at` uses the earliest valid due date implied by active reasons.

Do not create five duplicate review cards for five reasons.

Distinct ErrorObjects remain separately linked for history/repair, but scheduler consolidates retrieval demand where one valid task can test the same Micro-skill.

If one task cannot validly test all linked causes:
- preserve separate obligations at ErrorObject level;
- planner may need multiple later tasks.

---

# 18. Blocked-content semantics

If review is due but no valid candidate survives the exclusion rules:

- `blocked_no_valid_item=true`;
- preserve the original review obligation, reason, original due date, and overdue duration;
- do not advance review_level;
- do not manufacture a new due date every day;
- do not repeatedly enqueue duplicate review records;
- output planner urgency `BLOCKED_CONTENT`;
- once valid content becomes available, the existing obligation may resume immediately.

This is a content availability block, not successful scheduling.

---

# 19. Policy migration semantics

A policy-version change is explicit.

Migration rules:
- preserve previous scheduler snapshot;
- preserve all EvidenceEvents and completed review outcomes unchanged;
- create a new scheduler snapshot with:
  - old_policy_version;
  - new_policy_version;
  - migrated_at;
  - basis_event_ids;
  - recomputed review_success_streak;
  - recomputed review_level;
  - recomputed next_review_at if valid;
- do not silently migrate on every read;
- migration must be an auditable administrative/data operation.

---

# 20. Priority output for B1-F05

B1-F04 does not choose daily order.

It outputs:

- skill_node_id;
- review_state;
- primary_review_reason;
- all_review_reasons[];
- review_level;
- next_review_at;
- overdue_by_ms;
- mastery_state;
- recurrence_count;
- last_review_result;
- latest_independence_class;
- assistance_dependency flag;
- blocked_no_valid_item;
- needs_evidence_collection;
- candidate_exclusion set:
  - recent task_instance_ids;
  - content_fingerprints;
  - variant_group_ids;
  - stimulus_ids;
- linked_error_ids;
- policy_version.

Suggested planner urgency category (not final ranking):
- CRITICAL_RECOVERY
- DUE_ERROR_REVIEW
- DUE_MAINTENANCE
- SCHEDULED_FUTURE
- EVIDENCE_GAP
- BLOCKED_CONTENT

B1-F05 owns final selection across skills and session time.

---

# 21. Exam-like boundary

If review stage is `exam_like`:

- relevant F01 official-aligned task constraint must be respected;
- no automatic training hint;
- extra Hören replay beyond the frozen official format makes it non-independent exam-like evidence;
- scheduler interval remains OTTO_METHOD.

Passing an OTTO review is not an official Goethe result.

---

# 22. Policy conflict precedence

When inputs conflict, resolve in this order:

1. invalid data → do not schedule from invalid basis;
2. REGRESSION_DETECTED / M6;
3. M5 UNSTABLE;
4. failed review recovery;
5. post-repair/transfer confirmation;
6. overdue obligation;
7. due obligation;
8. stale/maintenance;
9. assistance-dependency check;
10. evidence gap.

Earliest valid due date wins among active schedulable obligations.

Regression/repair can suspend ordinary maintenance progression.

---

# 23. QA scenario matrix

## F04-Q01 — first repaired error
Transfer success → level 0 → +1 day.

## F04-Q02 — first successful delayed review
Independent valid success → level 1 → +3 days.

## F04-Q03 — repeated successful reviews
Intervals progress 1 → 3 → 7 → 14 → 30 → 30 days.

## F04-Q04 — failed delayed review
State REGRESSION_DETECTED; spacing suspended; hand off to F03 repair.

## F04-Q05 — recurrence after RESOLVED
Immediate recovery reason; reset sequence after new transfer.

## F04-Q06 — stable skill untouched
Becomes due through maintenance/freshness without being labeled forgotten.

## F04-Q07 — repeated assisted success only
No independent review advancement.

## F04-Q08 — Hören review with extra replay in exam_like
Not qualifying independent exam-like success.

## F04-Q09 — exact same item
Rejected as candidate.

## F04-Q10 — near-duplicate variant
Rejected when answer-pattern recall invalidates retrieval.

## F04-Q11 — multiple due reasons
One scheduler record; primary reason by precedence; earliest valid date.

## F04-Q12 — M0 insufficient evidence, no error
No review_required; needs_evidence_collection=true.

## F04-Q13 — interrupted/invalid review
No success/failure transition from invalid event; obligation remains.

## F04-Q14 — timezone boundary
UTC duration arithmetic; no midnight rounding.

## F04-Q15 — policy migration
Old snapshot/events preserved; explicit migration creates an auditable new snapshot with old/new policy versions and basis events.

## F04-Q16 — supported review with keyword
Does not advance level; follow-up due +1 day after instructional follow-up.

---

# 24. Acceptance checklist

- [ ] review_required rules deterministic.
- [ ] next_review_at deterministic.
- [ ] policy versioned.
- [ ] all ReviewState transitions defined.
- [ ] success interval progression explicit.
- [ ] failure/restart explicit.
- [ ] assistance effect explicit.
- [ ] recurrence effect explicit.
- [ ] stable/stale behavior explicit.
- [ ] exact/near-duplicate protection explicit.
- [ ] insufficient evidence behavior explicit.
- [ ] multiple obligations consolidated deterministically.
- [ ] learning occasions/validity respected.
- [ ] B1-F05 output contract defined.
- [ ] no planner implementation.
- [ ] no readiness arithmetic.
- [ ] F02 unchanged.

---

# 25. Current review status

Technical findings TA-01..TA-05 are incorporated.

Next:
**Technical re-check → QA → GOETHE boundary (exam-like boundary is touched) → Director scope check**

DEV runtime remains blocked.
