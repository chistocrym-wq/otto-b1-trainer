# B1-F03 — Error Repair Loop

Status: **DRAFT FOR INDEPENDENT REVIEW**  
Phase: **PHASE 1 — FOUNDATION**  
Parent: **#2 OTTO B1 — PRODUCT REVIEW & REDESIGN**  
Task: **#7 [B1-F03] Error Repair Loop**  
Frozen base: `b2a0417a8d4ca56a959046c780bfa671d4aad97e`  
Frozen inputs: **B1-F01 + B1-F02**  
Scope: **specification only; no runtime/application change**  
Checked: **2026-09-20**

---

# 0. Purpose

B1-F03 turns the frozen B1-F02 ErrorObject/Evidence contract into one deterministic learning loop:

**detect → classify → explain → self-repair → new-context practice → transfer → delayed review → resolve / reopen**

The unit of repair is a frozen B1-F01 **Micro-skill**, not merely a wrong screen answer.

B1-F03 does not:
- change B1-F02;
- choose scheduler intervals;
- implement B1-F04;
- implement Daily Planner;
- calculate Readiness;
- alter official Goethe structure.

---

# 1. Frozen contracts consumed

From B1-F01:
- Module → Teil/Aufgabe → Skill → Micro-skill;
- official exam/task boundaries;
- OFFICIAL vs OTTO_METHOD separation.

From B1-F02:
- immutable `EvidenceEvent`;
- `ErrorObject`;
- `AssistanceEvent`;
- evidence classes P0–P5 / N1–N4;
- Mastery M0–M6;
- error statuses;
- review obligation;
- transfer identity:
  - task_instance_id;
  - stimulus_id;
  - content_fingerprint;
  - variant_group_id;
  - transfer_context_id;
- learning_occasion_id;
- evaluator provenance/confidence.

No field or semantic from the frozen F02 spec is silently rewritten here.

---

# 2. Repair loop invariants

1. A wrong answer is an observation, not automatically a permanent weakness.
2. Error explanation must be specific enough to teach, but must not reveal more answer content than necessary before learner self-repair.
3. The learner gets a genuine opportunity to repair their own work whenever pedagogically possible.
4. A model answer is not self-repair.
5. Same-item success is not transfer.
6. Transfer requires new context/material.
7. Full operational resolution requires delayed independent confirmation.
8. Recurrence can reopen a resolved error.
9. Multiple ErrorObjects may target one Micro-skill; they are linked, not flattened into one anonymous counter.
10. Productive modules may produce several independent error objects from one response.
11. Uncertain AI/human classification remains explicitly uncertain.
12. Review timing is delegated to B1-F04.

---

# 3. User-facing roll-up status

Frozen F02 lifecycle remains canonical. F03 adds only a user-facing roll-up, derived from it.

| User-facing state | Frozen ErrorObject states included |
|---|---|
| ACTIVE | NEW, EXPLAINED, SELF_REPAIR_PENDING, TRANSFER_PENDING, RETURNED while new cycle active |
| REPAIRED_PENDING_CONFIRMATION | SELF_REPAIRED, PROVISIONALLY_RESOLVED, REVIEW_SCHEDULED |
| RESOLVED | RESOLVED |
| RETURNED | RETURNED at recurrence detection before/while the new repair cycle is shown |

This roll-up does not replace the frozen statuses.

---

# 4. Stage 1 — DETECT

## Trigger

Detection occurs when a valid learner EvidenceEvent contains:
- objective wrong answer;
- productive task-function omission/failure;
- targeted Micro-skill failure;
- independent/transfer/exam-like failure;
- review failure;
- evaluator-supported productive issue.

## Output

Create or link:

### EvidenceEvent
The original event is immutable and records:
- skill_node_id;
- task identity;
- outcome;
- assistance;
- stage;
- response;
- module-specific payload.

### ErrorObject
Create `NEW` when no active linked object represents this concrete occurrence.

Minimum linkage:
- module;
- teil_or_aufgabe;
- parent_skill_id;
- micro_skill_id / canonical skill_node_id;
- task_instance_id;
- originating_event_id;
- original response/action;
- correct/expected basis if validly known;
- initial error_type/cause hypothesis;
- confidence;
- assistance-before-error;
- first_seen_at/last_seen_at.

## One learner response may create multiple ErrorObjects

Allowed only when distinct Micro-skills/causes are supported by evidence.

Example:
one Schreiben answer may create:
- task-point omission;
- coherence break;
- structures error.

Do not multiply trivial variants of the same root mistake into artificial counts.

---

# 5. Stage 2 — CLASSIFY

Classification answers:

1. **Which Micro-skill failed?**
2. **What type of error occurred?**
3. **What concrete evidence supports that diagnosis?**
4. **How confident is the classification?**

## Classification sources

- deterministic rule;
- content metadata;
- human evaluator;
- AI evaluator;
- mixed.

## Confidence

- high;
- medium;
- low.

## Low-confidence rule

If cause confidence is low:
- user may still receive a cautious useful observation;
- OTTO must not state the hypothesis as fact;
- Mastery may use the original valid failure evidence, but a low-confidence cause tag must not become a permanent error taxonomy fact;
- later evidence may revise the cause.

## Classification correction

If a later reviewer/evaluator shows the original cause tag was wrong:
- original learner EvidenceEvent remains unchanged;
- current ErrorObject classification may be revised;
- revision must be auditable as an interpretation correction;
- recurrence counts must not be merged across incompatible causes solely because the first classification was wrong.

Classification revision is **not new learner evidence**.

---

# 6. Stage 3 — EXPLAIN

Explanation occurs before the repair attempt, but it must follow **minimum necessary disclosure**.

The purpose is to explain the specific problem without stealing the learner's repair opportunity.

## Explanation levels

### E1 — diagnostic explanation
States:
- what kind of mismatch occurred;
- which Micro-skill is involved;
- why the current answer/action does not satisfy the task.

Does not reveal:
- the complete correct answer/model.

Typical assistance impact:
- none or strategy, depending on content.

### E2 — evidence-directed explanation
Points the learner to:
- relevant text span;
- audio cue/segment;
- missing communicative function;
- problematic language fragment.

Typical assistance:
- evidence_hint.

### E3 — answer-form support
Provides:
- keyword;
- phrase start;
- stronger scaffold.

Assistance is recorded at the appropriate frozen F02 level.

### E4 — full model / correct answer
Used only when lower support is insufficient or when instruction requires a model.

Assistance:
- full_model.

After E4, immediate reproduction cannot count as independent self-repair.

## Objective item rule

For Lesen/Hören MC-style tasks, default first explanation should identify the mismatch/evidence need **without automatically revealing the correct option**.

## Productive rule

For Schreiben/Sprechen, explanation identifies the specific task/function/language issue and gives the learner a chance to revise or repeat.

Do not rewrite the full answer before that chance unless escalation is necessary.

---

# 7. Stage 4 — SELF-REPAIR

A `RepairAttempt` is created whenever the learner tries to correct the error.

It links:
- error_id;
- source event;
- repair response;
- assistance consumed before/during repair;
- repair result;
- timestamp;
- learning_occasion_id.

## Genuine self-repair

A repair is genuine when:
- the learner produces the corrected choice/text/utterance themselves;
- the correct full answer/model was not simply copied;
- the repair is semantically correct for the targeted Micro-skill.

### Independence classes

**Independent self-repair**
- max assistance consumed = none.

**Minimally supported self-repair**
- strategy only.

**Supported self-repair**
- keyword or evidence_hint consumed.

This is real learner-generated repair, but not independent evidence.

**Assisted correction**
- phrase_start or full_model needed to produce the correction.

This is instructional progress but does **not** satisfy frozen F02 SELF_REPAIRED for independent closure purposes.

## If learner cannot self-repair

Escalate assistance gradually.

The error remains ACTIVE.

Do not punish the learner with an endless same-item loop.

After instruction/model exposure, move to a new practice item when feasible, but later obtain independent evidence.

---

# 8. Stage 5 — NEW-CONTEXT PRACTICE SELECTION

After a successful learner-generated repair, OTTO needs a new task targeting the same Micro-skill.

A valid candidate must satisfy:

1. same `skill_node_id`;
2. new `task_instance_id`;
3. different `content_fingerprint`;
4. not a near-duplicate `variant_group_id` that preserves the same answer pattern;
5. new `stimulus_id`;
6. new `transfer_context_id` for transfer claim;
7. appropriate B1/task difficulty;
8. module/task format compatible with the Micro-skill;
9. no leaked correct answer from the original repair.

## Similarity rule

“Similar” means:
- same target Micro-skill;
- comparable cognitive/communicative demand.

It does **not** mean:
- same text with names changed;
- same answer positions;
- same sentence pattern with cosmetic substitutions.

## If no valid item exists

- ErrorObject remains `TRANSFER_PENDING`;
- set an explicit content-gap/blocking signal for future planner/content work;
- do not count an exact/near duplicate as transfer just to advance status.

B1-F03 does not generate a content bank.

---

# 9. Stage 6 — TRANSFER

A transfer attempt creates a new EvidenceEvent linked through `transfer_of_error_id`.

## Valid transfer

Requirements:
- new context/material under section 8;
- no answer disclosure;
- no disqualifying support;
- same targeted Micro-skill;
- valid data.

### Transfer outcomes

**Independent success**
- creates P4;
- ErrorObject → PROVISIONALLY_RESOLVED;
- review_required = true;
- delayed confirmation still required.

**Minimally/supported success**
- useful evidence;
- does not satisfy independent P4;
- ErrorObject remains TRANSFER_PENDING or REPAIRED_PENDING_CONFIRMATION according to frozen evidence semantics;
- another independent transfer/check is required.

**Failure**
- creates N3;
- ErrorObject remains ACTIVE/TRANSFER_PENDING or becomes RETURNED if this is recurrence after prior resolution;
- repair loop continues.

---

# 10. Stage 7 — DELAYED REVIEW HANDOFF

B1-F03 does not calculate `next_review_at`.

After qualifying transfer:
- set/retain `review_required=true`;
- set `review_reason` such as `post_repair_confirmation`;
- ErrorObject reaches PROVISIONALLY_RESOLVED / REVIEW_SCHEDULED when B1-F04 assigns a date;
- B1-F04 owns deterministic scheduling.

A delayed review result returns to F03 semantics:

## Delayed review success
If independent and valid on a new-enough item:
- linked EvidenceEvent is positive;
- ErrorObject may become RESOLVED when frozen F02 closure conditions are met.

## Delayed review failure
- negative EvidenceEvent;
- ErrorObject → RETURNED;
- recurrence_count increments;
- new repair cycle begins;
- Mastery may become UNSTABLE/REGRESSED only according to frozen F02 rules.

---

# 11. Operational resolution rules

## ACTIVE

The error is active if any is true:
- no successful learner repair;
- transfer pending;
- transfer failed;
- strong assistance prevents independent confirmation;
- returned recurrence is under repair.

## REPAIRED_PENDING_CONFIRMATION

The learner has corrected the issue and/or passed transfer, but delayed confirmation is still outstanding.

## RESOLVED

Allowed only when:
1. learner repair requirement is satisfied under frozen F02 semantics;
2. independent transfer succeeded;
3. delayed independent review succeeded;
4. no unresolved recurrence exists.

Resolution is operational, not permanent immunity.

## RETURNED

A later recurrence of the same targeted pattern after provisional/full resolution.

Effects:
- create new negative EvidenceEvent;
- reopen or link ErrorObject;
- increment recurrence_count;
- preserve old successful history;
- begin a new cycle.

---

# 12. Recurrence and related errors

## Same occurrence vs new occurrence

Do not overwrite old events.

Each new failing task creates its own EvidenceEvent.

A new ErrorObject is created when the occurrence has a distinct task/source/cause that needs independent repair history.

## Linking rule

Use frozen:
- `root_error_id`;
- `related_error_ids[]`.

Link errors when:
- same user;
- same canonical Micro-skill;
- same or closely related normalized error type/cause;
- separate task occurrences.

Do **not** merge merely because:
- they are in the same module;
- they share a broad grammar label;
- they occurred in the same session.

## Root selection

The oldest still-relevant confirmed ErrorObject may be root.

A low-confidence/misclassified root must not absorb later incompatible causes.

## Recurrence count

Increment for a confirmed return of the same tracked pattern after a prior repair/resolution milestone.

Do not increment merely for multiple clicks on the same exact failed attempt.

---

# 13. LESEN-specific repair contract

Typical targets:
- paraphrase;
- explicit detail;
- scope;
- negation/limitation;
- argument/reason;
- stance;
- rule/exception;
- distractor resistance.

Immediate flow:
1. mark answer outcome;
2. identify target Micro-skill;
3. ask learner to inspect the relevant logic/evidence;
4. do not reveal correct option by default;
5. learner chooses/justifies correction;
6. explain remaining mismatch;
7. new text/item for transfer.

Evidence-oriented UX may ask:
**“Какой фрагмент текста это подтверждает?”**

A selected text span is supplementary learning evidence, not a Goethe requirement.

---

# 14. HÖREN-specific repair contract

Hören must preserve the distinction between:
- what was heard;
- guess/inference;
- assistance from replay/transcript.

## Training repair

Additional replay is allowed as training assistance.

Every extra replay records:
- actual_play_count;
- extra_training_replay_count;
- assistance impact.

Transcript opening records assistance/data limitation.

## Transfer / exam-like

For an `exam_like` transfer/check:
- frozen F01 official replay constraint applies;
- extra replay makes the event non-independent exam-like evidence.

Training-mode transfer may use configured support, but only an independent valid attempt can satisfy P4.

The repair explanation may identify:
- missed number/time/place;
- speaker attribution;
- negation/correction;
- paraphrase;
- heard-word distractor.

---

# 15. SCHREIBEN-specific repair contract

Schreiben is never reduced to one correct/incorrect flag.

One response can generate separate evidence/errors for:
- task fulfillment / content point;
- communicative function;
- coherence;
- vocabulary;
- structures;
- register;
- omission.

## Feedback priority

Default priority:
1. task fulfillment / communicative failure;
2. meaning/coherence problems;
3. high-impact structures/vocabulary;
4. lower-impact surface issues.

Do not dump every minor correction at once.

## Repair

The learner edits their own text.

OTTO should show:
- original fragment;
- specific issue;
- brief reason;
- request to revise.

The ideal/full model is escalation, not the first default.

## Transfer

A valid transfer requires a new writing context targeting the same Micro-skill/function.

Copying a memorized template does not establish transfer if task-family/variant identity shows near duplication.

Criterion observations retain evaluator source/confidence.

---

# 16. SPRECHEN-specific repair contract

Sprechen separates evidence channels.

## Text/planning evidence

Can support:
- task planning;
- functional language;
- structures/vocabulary in a text-mode rehearsal.

Cannot prove:
- actual spoken fluency;
- pronunciation;
- real interaction timing.

## Audio evidence

Required for:
- pronunciation;
- spoken pacing/intelligibility observations.

## Interaction evidence

For relevant tasks, requires actual interactive behavior or a valid simulation record, not merely a prepared monologue.

## Pronunciation

No audio → `not_scorable`.

With audio:
- pronunciation observation may create its own Micro-skill evidence/error;
- it must not automatically turn task-success evidence into total failure.

## Evaluator confidence

Low-confidence evaluator findings:
- may create a cautious repair suggestion;
- cannot be the decisive classification for stable/returned status without supporting evidence.

## Repair

Depending on target:
- task-function repair → repeat communicative function;
- structures/vocabulary → reformulate and speak again;
- pronunciation → hear/understand correction then produce a new audio attempt;
- interaction → new partner turn/context.

A text rewrite cannot close a pronunciation error.

---

# 17. EvidenceEvent / ErrorObject transition matrix

| Stage | EvidenceEvent | ErrorObject | Assistance effect |
|---|---|---|---|
| detect | original N1/N2/N3/N4 or productive negative observation | NEW | uses assistance already consumed |
| classify | no new learner evidence | classification fields/confidence updated | none |
| explain | instructional event/log, not mastery evidence by itself | EXPLAINED | explanation may create AssistanceEvent |
| self-repair attempt | new repair EvidenceEvent | SELF_REPAIR_PENDING → SELF_REPAIRED only if valid | level determines independence |
| assisted correction | exposure/assisted event | remains active until independent confirmation | phrase_start/full_model cannot masquerade as self-repair |
| new-context practice | new EvidenceEvent | TRANSFER_PENDING | all help recorded |
| transfer success | P4 if independent; otherwise weaker positive class | PROVISIONALLY_RESOLVED only on qualifying transfer | support may block P4 |
| transfer failure | N3 | active/TRANSFER_PENDING | may escalate instruction |
| delayed review success | independent positive review event | RESOLVED if all closure conditions met | strong assistance does not satisfy closure |
| delayed review failure | negative review event | RETURNED | new repair cycle |

---

# 18. UX / DESIGN contract

## Error screen hierarchy

Show in this order:

1. **What happened**
   - short, neutral outcome.
2. **Why**
   - one concrete reason tied to Micro-skill.
3. **Your action**
   - primary CTA: **“Исправить самому”** when feasible.
4. **Need help?**
   - progressive assistance, not all hints at once.
5. **Check**
   - validate repair.
6. **New example**
   - clearly indicate this is a new context.
7. **Later**
   - if transfer succeeds, explain that OTTO will check it again later.

## Do not show

- fake mastery percentage after one error;
- full ideal answer before repair by default;
- technical IDs to normal learner;
- all grammar corrections at once in productive work;
- “исправлено навсегда” messaging.

## Status language

ACTIVE:
“Нужно ещё закрепить.”

REPAIRED_PENDING_CONFIRMATION:
“Сейчас получилось. OTTO проверит это ещё раз позже.”

RESOLVED:
“Навык подтверждён повторной проверкой.”

RETURNED:
“Эта ошибка вернулась — разберём её ещё раз.”

These are OTTO messages, not Goethe judgments.

---

# 19. Interaction boundary with B1-F04

F03 owns:
- error detection/classification;
- explanation;
- repair;
- transfer;
- recurrence semantics;
- interpretation of delayed-review result.

F04 owns:
- when review is due;
- next_review_at;
- scheduling policy/version;
- scheduler priority.

Shared frozen interface:
- review_required;
- review_reason;
- next_review_at;
- delayed_review_of_error_id;
- learning_occasion_id;
- review result EvidenceEvent.

Neither task may silently rewrite the other.

---

# 20. QA scenario set

## F03-Q01 — one wrong → immediate correct same-item retry
Expected:
- repair progress;
- not transfer;
- not resolved.

## F03-Q02 — repeated exact item
Expected:
- no transfer claim regardless of accuracy.

## F03-Q03 — learner cannot self-repair
Expected:
- assistance escalates;
- error remains active;
- full model does not close it.

## F03-Q04 — full_model then correct reproduction
Expected:
- model-exposed/assisted correction;
- independent confirmation still required.

## F03-Q05 — independent repair → transfer failure
Expected:
- N3;
- error active;
- repair loop continues.

## F03-Q06 — transfer success → delayed review failure
Expected:
- RETURNED;
- recurrence increment;
- new loop.

## F03-Q07 — recurrence after RESOLVED
Expected:
- old positive history preserved;
- new negative event;
- returned linkage.

## F03-Q08 — three related errors same Micro-skill
Expected:
- link under root when cause-compatible;
- retain separate occurrences/evidence.

## F03-Q09 — Hören extra replay
Expected:
- assistance recorded;
- cannot be independent exam-like evidence.

## F03-Q10 — Schreiben multi-dimensional response
Expected:
- several justified Micro-skill observations possible;
- no binary whole-response collapse.

## F03-Q11 — Sprechen text-only
Expected:
- no pronunciation evidence.

## F03-Q12 — Sprechen audio: task success + pronunciation issue
Expected:
- positive task evidence + separate pronunciation error may coexist.

## F03-Q13 — low-confidence evaluator
Expected:
- cautious classification;
- no unsupported hard cause claim.

## F03-Q14 — classification later corrected
Expected:
- original EvidenceEvent immutable;
- interpretation corrected;
- incompatible recurrence grouping prevented.

---

# 21. Acceptance checklist

- [ ] detect/classify/explain/self-repair/practice/transfer/review/resolve-reopen defined.
- [ ] immediate post-error UX defined.
- [ ] explanation timing preserves learner repair opportunity.
- [ ] genuine vs assisted repair defined.
- [ ] assistance effects defined.
- [ ] new-context selection deterministic.
- [ ] transfer identity protected.
- [ ] delayed review required.
- [ ] active/repaired/resolved/returned defined.
- [ ] recurrence defined.
- [ ] same-Micro-skill linking defined.
- [ ] Lesen special cases defined.
- [ ] Hören replay assistance defined.
- [ ] Schreiben non-binary feedback defined.
- [ ] Sprechen text/audio/pronunciation/confidence separation defined.
- [ ] EvidenceEvent/ErrorObject transition matrix exists.
- [ ] F02 remains frozen.
- [ ] scheduler timing not implemented.
- [ ] Daily Planner/Readiness not implemented.

---

# 22. Current review status

Ready for:
**UX/DESIGN → Technical Architecture → QA → GOETHE boundary → Director scope check**

DEV runtime remains blocked.
