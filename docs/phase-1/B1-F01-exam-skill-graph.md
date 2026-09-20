# B1-F01 — Exam Skill Graph & Goethe Constraints

Status: **B1-F01 SPEC READY FOR ARCHITECTURE**  
Phase: **PHASE 1 — FOUNDATION**  
Parent: **#2 OTTO B1 — PRODUCT REVIEW & REDESIGN**  
Task: **#3 [B1-F01] Exam Skill Graph & Goethe Constraints**  
Scope: **specification only; no application/runtime change**  
Checked: **2026-09-20**

---

## 0. Purpose

This document is the canonical Phase 1 map for:

**Module → Teil/Aufgabe → Skill → Micro-skill**

It separates:

- **OFFICIAL** — current Goethe-Institut exam structure, task format, timing, item counts, candidate instructions, and assessment criteria;
- **OTTO_METHOD** — OTTO pedagogical decomposition used to train, diagnose, repair, review, and later measure evidence.

This document does **not** define:

- mastery thresholds;
- spaced-review intervals;
- readiness formulas;
- evidence weights;
- decay functions;
- planner priorities;
- pass probabilities.

Those belong to B1-F02 and later tasks.

---

# 1. Source hierarchy

## G1 — highest priority: current exam administration rules

**Goethe-Institut — Durchführungsbestimmungen GOETHE-ZERTIFIKAT B1**  
Version: **Stand 1. September 2025**  
Checked: 2026-09-20  
https://www.goethe.de/pro/relaunch/prf/de/Durchfuehrungsbestimmungen_B1.pdf

Use for current:
- module composition;
- module timing;
- Sprechen timing ranges and preparation;
- assessment administration;
- current scoring rules;
- pass threshold.

## G2 — official published B1 Modellsatz Erwachsene

**Goethe-Institut — B1 Modellsatz Erwachsene**  
Edition shown in current official download: 2nd revised edition, January 2015  
Checked through current Goethe official materials page: 2026-09-20  
https://www.goethe.de/pro/relaunch/prf/materialien/B1/b1_modellsatz_erwachsene.pdf

Use for:
- task goals;
- task types;
- item counts;
- published task allocations;
- candidate task instructions;
- official assessment criteria;
- model examples.

## G3 — current official interactive Modellsatz

Checked: 2026-09-20

- Lesen: https://bfu.goethe.de/b1_mod/lesen.php
- Hören: https://bfu.goethe.de/b1_mod/hoeren.php
- Schreiben: https://bfu.goethe.de/b1_mod/schreiben.php
- Sprechen: https://bfu.goethe.de/b1_mod/sprechen.php

Use as a current public cross-check of the task format.

## G4 — official result information

https://www.goethe.de/de/spr/prf/pes/pab1.html  
Checked: 2026-09-20

Use for current module result scale and pass threshold.

## M1 — OTTO methodology input

Owner-provided Project file:
**Goethe_B1_principy_i_istochniki.pdf**, version 19 September 2026.

It defines a teaching loop and source hierarchy. It is methodology, not authority over Goethe rules.

## M2 — OTTO Sprechen methodology input

Owner-provided Project file:
**B1_Sprechen_Principles_and_Sources.pdf**, version 1.0, source check 19 September 2026.

It contains both Goethe and ÖSD context. **Only Goethe-verified facts enter OFFICIAL.**
Useful coaching mechanics may enter OTTO_METHOD.

## M3 — existing Project content standard

**OTTO_B1_CONTENT_QA_STANDARD.md**

Used as an internal quality standard where it does not conflict with G1–G4.

---

# 2. Classification and constraint rules

Every node or constraint in this document has one of two classifications.

## OFFICIAL

A claim directly supported by G1–G4.

An OFFICIAL claim may additionally have a constraint level:

- **HARD_EXAM** — must be preserved in an OTTO exam-like/full simulation.
- **PUBLISHED_TASK_FORMAT** — part of the official published model/task format, but not necessarily a separately enforced timer or lock.
- **OFFICIAL_CRITERION** — part of official assessment criteria.
- **OFFICIAL_SCORE_RULE** — official scoring/result rule.

## OTTO_METHOD

A pedagogical decomposition created by OTTO to teach or diagnose the official task.

OTTO_METHOD may never be presented to the user as an official Goethe rule.

---

# 3. Global official exam constraints

| ID | Classification | Constraint | Source |
|---|---|---|---|
| EXAM-01 | OFFICIAL / HARD_EXAM | Goethe-Zertifikat B1 has four modules: Lesen, Hören, Schreiben, Sprechen. | G1 |
| EXAM-02 | OFFICIAL / HARD_EXAM | Modules may be taken separately or in combination. | G1 |
| EXAM-03 | OFFICIAL / HARD_EXAM | Lesen: 65 minutes. | G1 |
| EXAM-04 | OFFICIAL / HARD_EXAM | Hören: approx. 40 minutes. | G1 |
| EXAM-05 | OFFICIAL / HARD_EXAM | Schreiben: 60 minutes. | G1 |
| EXAM-06 | OFFICIAL / HARD_EXAM | Sprechen: approx. 15 minutes in pairs; approx. 10 minutes individual; preparation 15 minutes. | G1 |
| EXAM-07 | OFFICIAL / HARD_EXAM | Dictionaries and mobile phones are not allowed in the real exam. | G1/G2/G3 |
| EXAM-08 | OFFICIAL / OFFICIAL_SCORE_RULE | Lesen has 30 scored items; each item gives 1 or 0 raw point; result is converted to 100 points. | G1 |
| EXAM-09 | OFFICIAL / OFFICIAL_SCORE_RULE | Hören has 30 scored items; each item gives 1 or 0 raw point; result is converted to 100 points. | G1 |
| EXAM-10 | OFFICIAL / OFFICIAL_SCORE_RULE | Each module has max 100 points = 100%. | G1/G4 |
| EXAM-11 | OFFICIAL / OFFICIAL_SCORE_RULE | A module is officially passed at 60 points / 60%. | G1/G4 |
| EXAM-12 | OFFICIAL / HARD_EXAM | Schreiben is graded by two independent graders using established criteria; a third grading may be required under the current rules in a specified disagreement case. | G1 |
| EXAM-13 | OFFICIAL / HARD_EXAM | Sprechen is conducted by two examiners; both grade independently. | G1 |
| EXAM-14 | OFFICIAL / HARD_EXAM | Brief notes prepared during Sprechen preparation may be used during the speaking module. | G1 |
| EXAM-15 | OFFICIAL / HARD_EXAM | In Sprechen, the introductory exchange is not graded. | G1 |

**Architecture rule:** OTTO readiness is not the Goethe official module score and must not reuse the official 60/100 threshold as an internal mastery formula.

---

# 4. Stable node ID convention

Format:

**{MODULE}.{TEIL}.{SKILL}.{MICRO}**

Examples:
- L.T2.ARG.M03
- H.T4.ATTR.M02
- W.A1.CONTACT.M04
- S.A1.PLAN.M05

Module codes:
- L = Lesen
- H = Hören
- W = Schreiben
- S = Sprechen

Task codes follow the official published task numbering.

A Micro-skill has exactly one parent Skill and one parent Teil/Aufgabe.

---

# 5. Evidence-ready raw observable contract

F01 defines only the **raw observations that a future Evidence/Mastery Model may consume**.

No observation below changes mastery by itself.

## Common raw fields

| Field | Classification | Meaning |
|---|---|---|
| skill_node_id | OTTO_METHOD | Stable micro-skill ID from this graph. |
| module | OTTO_METHOD derived from OFFICIAL structure | L/H/W/S. |
| teil_or_aufgabe | OTTO_METHOD derived from OFFICIAL structure | Official task number. |
| task_instance_id | OTTO_METHOD | Unique training/checkpoint item instance. |
| task_origin | OTTO_METHOD | official_published or original_aligned. |
| mode | OTTO_METHOD | worked_example / guided / independent / transfer / exam_like. |
| support_level | OTTO_METHOD | none / strategy / keyword / evidence_hint / phrase_start / full_model or future normalized equivalent. |
| hint_used | OTTO_METHOD | Whether support was consumed. |
| attempt_number | OTTO_METHOD | Attempt number on the current task instance. |
| started_at / completed_at | OTTO_METHOD | Raw timestamps. |
| response_time_ms | OTTO_METHOD | Raw completion time when meaningful. |
| completion_state | OTTO_METHOD | completed / abandoned / interrupted. |
| self_correction_attempted | OTTO_METHOD | Whether learner attempted own repair. |
| self_correction_success | OTTO_METHOD | Raw result of the repair attempt. |
| transfer_context_id | OTTO_METHOD | New-context identity for later transfer analysis. |
| prior_exposure_same_item | OTTO_METHOD | Whether the exact item was previously seen. |

## Objective-task raw fields

Used by Lesen/Hören:
- selected_answer;
- correct_answer;
- item_correct;
- distractor_id;
- distractor_tag;
- evidence_span_or_audio_segment selected in training if the UX asks for proof;
- answer_changed_after_hint;
- answer_changed_after_replay.

## Productive-task raw fields

Used by Schreiben/Sprechen:
- task_functions_required;
- task_functions_observed;
- task_points_covered;
- criterion_observations using the applicable official criteria;
- omission flags;
- language sample;
- retry sample;
- support used;
- assessor source (AI / human / rule-based / unknown);
- assessor confidence where applicable.

## Hören-specific raw fields

- official_required_play_count;
- actual_play_count;
- extra_training_replay_count;
- transcript_opened;
- prelisten_support_used.

**Rule:** extra replay or transcript access is OTTO training assistance and cannot be treated as independent exam-like evidence.

## Schreiben-specific raw fields

- word_count;
- required communicative functions covered;
- salutation/closing where task-relevant;
- user self-repair delta;
- criterion observation per Erfüllung / Kohärenz / Wortschatz / Strukturen.

## Sprechen-specific raw fields

- audio_available;
- speaking_duration;
- task functions observed;
- interaction turns where applicable;
- response latency where meaningful;
- interruption/help events;
- criterion observation according to the task;
- pronunciation observation only when real audio exists;
- notes/script assistance if observable.

**Rule:** no pronunciation evidence may be created from text-only input.

---

# 6. LESEN — official structure and OTTO skill graph

## Module-level OFFICIAL constraints

- Total: **65 minutes**.
- Five tasks.
- 30 scored items total.
- Candidate may begin with any task.
- One correct answer per item.
- Published Modellsatz task allocations: 10 / 20 / 10 / 15 / 10 minutes.

**Resolution:** the 65-minute module duration is HARD_EXAM. The per-task allocations are OFFICIAL / PUBLISHED_TASK_FORMAT and are not separate forced locks because the candidate instructions allow starting with any task.

---

## Lesen Teil 1

### OFFICIAL

- Skill / Prüfungsziel: **Korrespondenz lesen**.
- Task type: **Richtig/Falsch**.
- 6 items.
- Published task allocation: 10 min.
- Candidate reads a correspondence-style text and judges statements true/false.

Official Skill ID: **L.T1.CORR**

### OTTO_METHOD Micro-skills

| ID | Micro-skill |
|---|---|
| L.T1.CORR.M01 | Extract an explicit fact from a personal/correspondence text. |
| L.T1.CORR.M02 | Reconstruct event order and temporal sequence. |
| L.T1.CORR.M03 | Resolve who/what a pronoun, person, object, or reference refers to. |
| L.T1.CORR.M04 | Recognize paraphrase rather than relying on word overlap. |
| L.T1.CORR.M05 | Detect negation, limitation, correction, or contradiction. |
| L.T1.CORR.M06 | Reject a plausible statement when one detail conflicts with the text. |

### Evidence-ready observations

- item_correct;
- true/false choice;
- distractor/error tag;
- response_time_ms;
- hint/support;
- text evidence selected in training;
- self-correction;
- transfer result on a different correspondence text.

---

## Lesen Teil 2

### OFFICIAL

- Skill / Prüfungsziel: **Information und Argumentation verstehen**.
- Task type: **3-option multiple choice**.
- 6 items.
- Published task allocation: 20 min.
- Official model uses press/information texts.

Official Skill ID: **L.T2.ARG**

### OTTO_METHOD Micro-skills

| ID | Micro-skill |
|---|---|
| L.T2.ARG.M01 | Identify topic/main point of an informational or argumentative text. |
| L.T2.ARG.M02 | Locate a precise supporting detail. |
| L.T2.ARG.M03 | Understand reason, purpose, result, or condition. |
| L.T2.ARG.M04 | Follow a short argument and distinguish claim from supporting detail. |
| L.T2.ARG.M05 | Recognize paraphrase across stem, option, and source text. |
| L.T2.ARG.M06 | Reject a distractor with correct vocabulary but wrong meaning/scope. |
| L.T2.ARG.M07 | Distinguish stated fact from an unsupported inference. |

### Evidence-ready observations

Objective raw fields plus:
- question_target tag: topic/detail/reason/purpose/result/inference;
- distractor_type: lexical_overlap/scope/causal_reversal/unsupported_inference/partial_truth.

---

## Lesen Teil 3

### OFFICIAL

- Skill / Prüfungsziel: **Zur Orientierung lesen**.
- Task type: **Zuordnung**.
- 7 items.
- Published task allocation: 10 min.
- Candidate matches situations to notices/ads; one situation can have no suitable notice and is marked 0 in the official model format.

Official Skill ID: **L.T3.ORIENT**

### OTTO_METHOD Micro-skills

| ID | Micro-skill |
|---|---|
| L.T3.ORIENT.M01 | Extract the essential need from a situation. |
| L.T3.ORIENT.M02 | Extract multiple constraints: time, place, audience, purpose, format, cost, availability, etc. |
| L.T3.ORIENT.M03 | Scan multiple short notices efficiently. |
| L.T3.ORIENT.M04 | Match all critical constraints, not just one keyword. |
| L.T3.ORIENT.M05 | Reject near-matches that violate one decisive condition. |
| L.T3.ORIENT.M06 | Recognize when no option is suitable. |
| L.T3.ORIENT.M07 | Manage one-use matching constraints without losing semantic accuracy. |

### Evidence-ready observations

- selected_notice;
- correct_mapping;
- constraint set extracted in training;
- failed_constraint tag;
- no-match decision;
- response time;
- support level;
- transfer result with a new notice set.

---

## Lesen Teil 4

### OFFICIAL

- Skill / Prüfungsziel: **Information und Argumentation verstehen**.
- Task type: **Ja/Nein**.
- 7 items.
- Published task allocation: 15 min.
- Official model asks whether each person supports a stated position/prohibition based on short comments.

Official Skill ID: **L.T4.STANCE**

### OTTO_METHOD Micro-skills

| ID | Micro-skill |
|---|---|
| L.T4.STANCE.M01 | Identify the writer’s overall position. |
| L.T4.STANCE.M02 | Distinguish the final stance from a concession or rhetorical question. |
| L.T4.STANCE.M03 | Track argument-to-position relationship. |
| L.T4.STANCE.M04 | Interpret negation, modality, qualification, and contrast markers. |
| L.T4.STANCE.M05 | Recognize stance expressed indirectly through reasons/examples. |
| L.T4.STANCE.M06 | Avoid classifying by isolated positive/negative words. |

### Evidence-ready observations

- stance choice;
- correct/incorrect;
- stance evidence selected;
- concession/negation error tag;
- support used;
- transfer to a new opinion set.

---

## Lesen Teil 5

### OFFICIAL

- Skill / Prüfungsziel: **Schriftliche Anweisung verstehen**.
- Task type: **3-option multiple choice**.
- 4 items.
- Published task allocation: 10 min.
- Official model uses written rules/instructions.

Official Skill ID: **L.T5.RULES**

### OTTO_METHOD Micro-skills

| ID | Micro-skill |
|---|---|
| L.T5.RULES.M01 | Identify obligation, prohibition, permission, or recommendation. |
| L.T5.RULES.M02 | Identify who a rule applies to. |
| L.T5.RULES.M03 | Identify conditions and exceptions. |
| L.T5.RULES.M04 | Combine information across more than one sentence/rule. |
| L.T5.RULES.M05 | Distinguish absolute rules from qualified rules. |
| L.T5.RULES.M06 | Resolve exact practical detail such as place, fee, procedure, or permitted action. |

### Evidence-ready observations

Objective fields plus:
- rule_type;
- exception_detected;
- scope/actor;
- failed_condition tag.

---

# 7. HÖREN — official structure and OTTO skill graph

## Module-level OFFICIAL constraints

- Total: approx. **40 minutes**.
- Four tasks.
- 30 scored items total.
- Candidate reads the task first, then hears the text.
- Official audio contains texts plus instructions/information.
- Model format allows 5 minutes after listening to transfer answers in paper form.
- Replay count differs by Teil and must be preserved in exam-like simulation.

---

## Hören Teil 1

### OFFICIAL

- Prüfungsziel: **Ankündigungen, Durchsagen und Anweisungen verstehen**.
- Task type: **Richtig/Falsch + 3-option multiple choice**.
- 10 items.
- Five short texts, **each played twice**.
- Two items per short text.

Official Skill ID: **H.T1.ANNOUNCE**

### OTTO_METHOD Micro-skills

| ID | Micro-skill |
|---|---|
| H.T1.ANNOUNCE.M01 | Identify the situation/source quickly. |
| H.T1.ANNOUNCE.M02 | Extract the main message/action required. |
| H.T1.ANNOUNCE.M03 | Capture precise details: time, number, place, route, person, change. |
| H.T1.ANNOUNCE.M04 | Notice correction, cancellation, delay, exception, or contrast. |
| H.T1.ANNOUNCE.M05 | Use the second official hearing to verify rather than replace meaning with a guess. |
| H.T1.ANNOUNCE.M06 | Distinguish what was actually heard from world-knowledge assumptions. |

### Evidence-ready observations

- item correctness;
- actual_play_count;
- answer after first/second hearing where training instrumented;
- changed answer;
- detail type;
- transcript access;
- extra replay;
- support;
- transfer to new announcements.

---

## Hören Teil 2

### OFFICIAL

- Prüfungsziel: **Als Zuschauer/Zuhörer im Publikum verstehen**.
- Task type: **3-option multiple choice**.
- 5 items.
- One longer text, **played once**.
- Official model gives 60 seconds to read items before listening.

Official Skill ID: **H.T2.PUBLIC**

### OTTO_METHOD Micro-skills

| ID | Micro-skill |
|---|---|
| H.T2.PUBLIC.M01 | Predict the information targets from the questions before listening. |
| H.T2.PUBLIC.M02 | Follow the main line of an extended public talk/guide/instruction. |
| H.T2.PUBLIC.M03 | Retain and select relevant details after one hearing. |
| H.T2.PUBLIC.M04 | Track sequence and transitions. |
| H.T2.PUBLIC.M05 | Distinguish main information from examples or side remarks. |
| H.T2.PUBLIC.M06 | Resist a distractor built from a heard word with the wrong relation. |

### Evidence-ready observations

- correctness;
- one-play compliance in exam_like;
- prelisten support;
- target type;
- extra replay count in training;
- transcript access;
- response time.

---

## Hören Teil 3

### OFFICIAL

- Prüfungsziel: **Gespräche zwischen Muttersprachlern verstehen**.
- Task type: **Richtig/Falsch**.
- 7 items.
- One conversation, **played once**.
- Official model gives 60 seconds to read items before listening.

Official Skill ID: **H.T3.CONVERSATION**

### OTTO_METHOD Micro-skills

| ID | Micro-skill |
|---|---|
| H.T3.CONVERSATION.M01 | Identify context and relationship of speakers when relevant. |
| H.T3.CONVERSATION.M02 | Follow turn-by-turn meaning in natural dialogue. |
| H.T3.CONVERSATION.M03 | Extract specific factual details. |
| H.T3.CONVERSATION.M04 | Track chronology and event sequence. |
| H.T3.CONVERSATION.M05 | Understand attitude/evaluation expressed through ordinary dialogue. |
| H.T3.CONVERSATION.M06 | Detect when a statement overgeneralizes or distorts what a speaker said. |

### Evidence-ready observations

Objective fields plus:
- speaker/reference error tag;
- detail/sequence/attitude target;
- one-play compliance;
- extra replay/transcript support.

---

## Hören Teil 4

### OFFICIAL

- Prüfungsziel: **Radiosendungen und Tonaufnahmen verstehen**.
- Task type: **Zuordnung**.
- 8 items.
- One discussion, **played twice**.
- Official model gives 60 seconds to read statements before listening.
- Candidate attributes statements to speakers.

Official Skill ID: **H.T4.ATTR**

### OTTO_METHOD Micro-skills

| ID | Micro-skill |
|---|---|
| H.T4.ATTR.M01 | Distinguish speakers reliably across a discussion. |
| H.T4.ATTR.M02 | Attribute an idea/claim to the correct speaker. |
| H.T4.ATTR.M03 | Track agreement, disagreement, qualification, and concession. |
| H.T4.ATTR.M04 | Recognize paraphrased speaker positions. |
| H.T4.ATTR.M05 | Separate moderator framing from participant opinion. |
| H.T4.ATTR.M06 | Update attribution after the second official hearing without losing earlier context. |

### Evidence-ready observations

- assigned speaker;
- correctness;
- attribution error type;
- first/second hearing state if instrumented;
- extra replay;
- support/transcript;
- transfer discussion.

---

# 8. SCHREIBEN — official structure and OTTO skill graph

## Module-level OFFICIAL constraints

- Total: **60 minutes**.
- Three tasks.
- Candidate may begin with any task.
- Aufgabe 1 and 3 are e-mails; Aufgabe 2 is a discussion contribution.
- Official published task allocations: 20 / 25 / 15 minutes.
- Official assessment criteria: **Erfüllung, Kohärenz, Wortschatz, Strukturen**.
- If Erfüllung is graded E / 0 for a task, the whole task receives 0 points in the published criteria.
- Module graded by two independent graders under current rules.

**Resolution:** 60 minutes is HARD_EXAM. The 20/25/15 values are OFFICIAL / PUBLISHED_TASK_FORMAT, not separate timer locks.

---

## Schreiben Aufgabe 1

### OFFICIAL

- Prüfungsziel: **Interaktion — Persönliche Mitteilung zur Kontaktpflege**.
- Free writing.
- Published model: e-mail, approx. **80 words**.
- Published allocation: **20 min**.
- Published task requires all three content points and attention to text structure.
- Official task functions in the model include: describe, justify, make a proposal.

Official Skill ID: **W.A1.CONTACT**

### Official criteria applicable

- Erfüllung;
- Kohärenz;
- Wortschatz;
- Strukturen.

### OTTO_METHOD Micro-skills

| ID | Micro-skill |
|---|---|
| W.A1.CONTACT.M01 | Decode situation, recipient, relationship, and communicative purpose. |
| W.A1.CONTACT.M02 | Cover every required content point. |
| W.A1.CONTACT.M03 | Perform required functions such as describing, giving a reason, and proposing. |
| W.A1.CONTACT.M04 | Use a situation-appropriate personal register. |
| W.A1.CONTACT.M05 | Build an e-mail with appropriate opening, progression, and closing. |
| W.A1.CONTACT.M06 | Link sentences and content points coherently. |
| W.A1.CONTACT.M07 | Use sufficient B1 vocabulary for the task without template dependence. |
| W.A1.CONTACT.M08 | Use understandable morphology, syntax, and orthography. |
| W.A1.CONTACT.M09 | Self-correct a meaningful language/task-fulfillment error after feedback. |

### Evidence-ready observations

- content points covered;
- functions fulfilled;
- register observation;
- coherence observation;
- vocabulary observation;
- structures observation;
- word count;
- self-repair;
- support level;
- transfer writing on a new context.

---

## Schreiben Aufgabe 2

### OFFICIAL

- Prüfungsziel: **Produktion — Persönliche Meinung zu einem Thema äußern**.
- Free writing.
- Published model: discussion contribution, approx. **80 words**.
- Published allocation: **25 min**.
- Candidate writes a personal opinion in response to a discussion context.

Official Skill ID: **W.A2.OPINION**

### Official criteria applicable

- Erfüllung;
- Kohärenz;
- Wortschatz;
- Strukturen.

### OTTO_METHOD Micro-skills

| ID | Micro-skill |
|---|---|
| W.A2.OPINION.M01 | Identify the discussion question and scope. |
| W.A2.OPINION.M02 | State a clear personal position. |
| W.A2.OPINION.M03 | Give at least one relevant reason/explanation. |
| W.A2.OPINION.M04 | Support the position with a concrete example or comparison where useful. |
| W.A2.OPINION.M05 | Organize the response into a coherent progression. |
| W.A2.OPINION.M06 | Use connectors to express cause, contrast, consequence, sequence, and addition. |
| W.A2.OPINION.M07 | Maintain appropriate public discussion register. |
| W.A2.OPINION.M08 | Use sufficient B1 vocabulary and structures while remaining understandable. |
| W.A2.OPINION.M09 | Distinguish personal argument from copied/template text. |

### Evidence-ready observations

- position present;
- reason present;
- supporting example;
- relevance to prompt;
- official criterion observations;
- word count;
- support/template use;
- self-correction and transfer.

---

## Schreiben Aufgabe 3

### OFFICIAL

- Prüfungsziel: **Interaktion — Persönliche Mitteilung zur Handlungsregulierung**.
- Free writing.
- Published model: e-mail, approx. **40 words**.
- Published allocation: **15 min**.
- Model task includes apology + reason; task type can include a request or comparable action-regulating function.
- Candidate is reminded not to forget salutation and closing.

Official Skill ID: **W.A3.ACTION**

### Official criteria applicable

- Erfüllung;
- Kohärenz;
- Wortschatz;
- Strukturen.

### OTTO_METHOD Micro-skills

| ID | Micro-skill |
|---|---|
| W.A3.ACTION.M01 | Identify recipient, action problem, and required communicative act. |
| W.A3.ACTION.M02 | State the essential message directly. |
| W.A3.ACTION.M03 | Perform required function: apology, reason, request, reschedule, or equivalent task function. |
| W.A3.ACTION.M04 | Use appropriate salutation and closing when the task requires e-mail conventions. |
| W.A3.ACTION.M05 | Maintain polite, situation-appropriate register. |
| W.A3.ACTION.M06 | Be concise without omitting required information. |
| W.A3.ACTION.M07 | Use coherent and understandable B1 language. |
| W.A3.ACTION.M08 | Repair a missing function before polishing minor language errors. |

### Evidence-ready observations

- required action functions covered;
- politeness/register;
- essential message;
- criterion observations;
- word count;
- omission type;
- repair and transfer.

---

# 9. SPRECHEN — official structure and OTTO skill graph

## Module-level OFFICIAL constraints

Current G1:
- usually pair exam, individual exam possible in exceptions;
- pair exam approx. 15 min; individual approx. 10 min;
- preparation: 15 min;
- current part timing: Teil 1 approx. **2–3 min**, Teil 2 approx. **3–4 min per participant**, Teil 3 approx. **1–2 min per participant**;
- brief preparation notes may be used;
- two examiners; both assess independently;
- introduction is not graded.

G3/current interactive nominal presentation:
- Aufgabe 1 approx. 3 min;
- Aufgabe 2 approx. 3 min;
- Aufgabe 3 approx. 2 min.

**Resolution:** G1 current 2025 ranges are the current administrative timing source. The interactive/model figures are nominal public examples and do not override G1.

---

## Sprechen Aufgabe 1

### OFFICIAL

- Prüfungsziel: **Interaktion — Gemeinsam etwas planen und aushandeln**.
- Participants plan something together.
- Official published model uses **4 Leitpunkte**.
- Current timing: approx. **2–3 minutes** for Teil 1 in G1.

Official Skill ID: **S.A1.PLAN**

### Official criteria applicable

- Erfüllung;
- Interaktion;
- Wortschatz;
- Strukturen;
- Aussprache contributes across Aufgaben 1–3.

### OTTO_METHOD Micro-skills

| ID | Micro-skill |
|---|---|
| S.A1.PLAN.M01 | Open the planning exchange and engage the partner. |
| S.A1.PLAN.M02 | Make a concrete proposal. |
| S.A1.PLAN.M03 | React relevantly to the partner’s proposal. |
| S.A1.PLAN.M04 | Ask for the partner’s opinion or clarification. |
| S.A1.PLAN.M05 | Agree and move the plan forward. |
| S.A1.PLAN.M06 | Disagree politely and give a reason. |
| S.A1.PLAN.M07 | Offer an alternative or compromise. |
| S.A1.PLAN.M08 | Address the task’s planning points without leaving critical points unresolved. |
| S.A1.PLAN.M09 | Allocate practical details such as who/when/where/how when the task requires them. |
| S.A1.PLAN.M10 | Summarize/close with a joint decision. |
| S.A1.PLAN.M11 | Keep the exchange interactive rather than turning it into a monologue/interview. |

### Evidence-ready observations

- required planning points covered;
- communicative functions observed;
- relevant partner reactions;
- turn interaction;
- unresolved point count;
- official criterion observations for Aufgabe 1;
- pronunciation only from audio;
- help events;
- speaking duration;
- transfer to new planning situation.

---

## Sprechen Aufgabe 2

### OFFICIAL

- Prüfungsziel: **Produktion — In einem Monolog ein Thema präsentieren**.
- Candidate chooses one of **two themes** in the official format.
- Official published model uses **5 prompt slides/Leitfolien**.
- Current timing: approx. **3–4 minutes per participant** in G1.
- Notes prepared during the 15-minute preparation may be used.
- Official candidate guidance expects free speaking rather than simply reading everything from notes.

Official Skill ID: **S.A2.PRESENT**

### Official criteria applicable

- Erfüllung;
- Kohärenz;
- Wortschatz;
- Strukturen;
- Aussprache contributes across Aufgaben 1–3.

### OTTO_METHOD Micro-skills

| ID | Micro-skill |
|---|---|
| S.A2.PRESENT.M01 | Choose a theme and plan from prompts rather than rely on a memorized full script. |
| S.A2.PRESENT.M02 | Introduce the theme and give the listener an understandable structure. |
| S.A2.PRESENT.M03 | Address all required prompt areas with sufficient content. |
| S.A2.PRESENT.M04 | Give a relevant personal experience/example when required by the prompt. |
| S.A2.PRESENT.M05 | Describe relevant context/situation when required by the prompt. |
| S.A2.PRESENT.M06 | Explain advantages/disadvantages or contrasting aspects when required. |
| S.A2.PRESENT.M07 | State and justify a personal opinion. |
| S.A2.PRESENT.M08 | Link sections into a traceable line of thought. |
| S.A2.PRESENT.M09 | Close the presentation appropriately. |
| S.A2.PRESENT.M10 | Use notes as prompts without reading a full prepared text. |
| S.A2.PRESENT.M11 | Maintain understandable B1 vocabulary, structures, pacing, and pronunciation. |

**Important:** M04–M07 are OTTO training decomposition based on the official prompt pattern. They are not separate official Goethe grading criteria.

### Evidence-ready observations

- prompts/slides covered;
- order/coherence;
- reason/example use;
- duration;
- dependence on hints/script;
- official criterion observations;
- pronunciation from audio;
- transfer presentation on a new theme.

---

## Sprechen Aufgabe 3

### OFFICIAL

- Prüfungsziel: **Interaktion — Situationsadäquat reagieren**.
- Candidate responds to the partner’s presentation, gives feedback, asks a question, and responds to feedback/questions about own presentation.
- Current timing: approx. **1–2 minutes per participant** in G1.

Official Skill ID: **S.A3.REACT**

### Official criteria applicable

- Erfüllung for Aufgabe 3.
- Aussprache contributes across Aufgaben 1–3.

The official scoring table does **not** apply the full Aufgabe-1/2 criterion set separately to Aufgabe 3.

### OTTO_METHOD Micro-skills

| ID | Micro-skill |
|---|---|
| S.A3.REACT.M01 | Listen to the partner’s presentation well enough to respond specifically. |
| S.A3.REACT.M02 | Give relevant short feedback. |
| S.A3.REACT.M03 | Ask a relevant question about the partner’s presentation. |
| S.A3.REACT.M04 | Understand a question asked about own presentation. |
| S.A3.REACT.M05 | Give a relevant spontaneous answer. |
| S.A3.REACT.M06 | Ask for clarification when necessary instead of freezing or giving an unrelated answer. |
| S.A3.REACT.M07 | Keep the response at B1 level: understandable, relevant, and sufficiently developed. |

### Evidence-ready observations

- feedback function completed;
- question asked;
- question relevance;
- answer relevance;
- response latency;
- need for rescue/hint;
- Aufgabe-3 Erfüllung observation;
- pronunciation from real audio;
- transfer to a new partner presentation.

---

# 10. Assistance ladder — F01 constraint for later Evidence Model

This is **OTTO_METHOD**, not an official Goethe rule.

To make later evidence interpretable, every attempt should be able to record an assistance level.

Suggested normalized progression:

1. **none** — no help;
2. **strategy** — general task strategy, no answer content;
3. **keyword** — relevant key word/concept;
4. **evidence_hint** — directs attention to a relevant area/segment;
5. **phrase_start** — partial productive scaffold;
6. **full_model** — answer/model phrase shown.

B1-F02 decides how these levels affect evidence strength.

For Sprechen, the owner-provided methodology explicitly supports staged help in training; in exam-like simulation automatic help must be disabled.

---

# 11. Worked-example → guided → independent → transfer → exam-like

This sequence is **OTTO_METHOD** and is part of the Phase 1 learning architecture input.

| Stage | What it means | Evidence note |
|---|---|---|
| worked_example | Learner sees a model and explanation. | Exposure, not independent evidence. |
| guided | Learner performs with structured help. | Evidence must record assistance. |
| independent | Learner attempts without content help. | Candidate for stronger evidence. |
| transfer | Same micro-skill is tested in a new context/material. | Distinguishes pattern memorization from transferable skill. |
| exam_like | Official task constraints and assistance restrictions are simulated. | Candidate for exam-readiness evidence, subject to F02 rules. |

F01 defines the stages only. F02 defines transition logic.

---

# 12. Error taxonomy hooks for B1-F02

F01 does not define the Error Model, but the graph requires future errors to be attributable to a micro-skill.

Candidate raw error categories:

## Objective tasks
- misunderstood_question_target;
- explicit_detail_miss;
- paraphrase_miss;
- negation_limitation_miss;
- scope_mismatch;
- causal_relation_error;
- unsupported_inference;
- lexical_overlap_distractor;
- speaker_attribution_error;
- condition_exception_error;
- time_number_place_detail_error.

## Schreiben
- task_point_omission;
- wrong_or_missing_function;
- register_mismatch;
- coherence_break;
- vocabulary_limitation_or_misuse;
- structure_morphology_syntax_error;
- orthography_error;
- overreliance_on_template.

## Sprechen
- task_point_omission;
- missing_communicative_function;
- weak_partner_reaction;
- unresolved_planning_point;
- presentation_prompt_omission;
- coherence_break;
- question_or_feedback_failure;
- vocabulary_limitation_or_misuse;
- structure_error;
- pronunciation_intelligibility_issue.

These are OTTO_METHOD tags. B1-F02 owns final normalization and storage schema.

---

# 13. Official scoring constraints that F02/F06 must not confuse with OTTO readiness

## Lesen / Hören

OFFICIAL:
- 30 raw items each.
- 1 or 0 raw point per item.
- Converted to 100 result points under the current official scheme.

## Schreiben

OFFICIAL:
- max 100 module points;
- established criteria;
- independent grading under current rules.

## Sprechen

OFFICIAL:
- max 100 module points;
- tasks assessed by two independent examiners;
- arithmetic mean under current rules.

## Pass

OFFICIAL:
- 60/100 is the official pass threshold **per module**.

## OTTO architecture boundary

OTTO readiness must:
- remain separate by module;
- be able to say insufficient evidence;
- not claim to be the official Goethe score;
- not convert training activity directly into the official 100-point scale;
- not promise passing.

The formula belongs to B1-F06, not F01.

---

# 14. QA review result

**QA PASS**

QA verified:
- complete task coverage across 5/4/3/3 official tasks;
- unique parentage for skill/micro-skill nodes;
- future Evidence/Mastery raw fields without mastery thresholds;
- separation of objective vs productive evidence;
- explicit assistance recording;
- provenance field;
- no activity-count shortcut.

QA raised timing/criteria questions that were passed to GOETHE review and resolved below.

---

# 15. GOETHE review result

**GOETHE PASS**

Current official source verification confirmed:
- module composition;
- current module timings;
- current Sprechen timing ranges and 15-minute preparation;
- Lesen/Hören item counts and official task types;
- Hören replay counts by task;
- Schreiben task types and official criteria;
- Sprechen task-specific criteria;
- independent assessment rules;
- 60/100 official module pass threshold.

No telc/DTZ rule is used.
No ÖSD-only rule is used as Goethe truth.

---

# 16. Resolved QA ↔ GOETHE discrepancies

| ID | Question | Resolution |
|---|---|---|
| R-01 | Are Lesen 10/20/10/15/10 separate hard timers? | No. They are official published task allocations. Hard module limit is 65 min; candidate may start with any task. OTTO must not lock each Lesen task from F01. |
| R-02 | Are Schreiben 20/25/15 separate hard timers? | No. They are official published allocations inside the 60-min module; candidate may start with any task. |
| R-03 | Is Sprechen timing 3/3/2 or 2–3 / 3–4 / 1–2? | Current 2025 Durchführungsbestimmungen controls: 2–3 / 3–4 / 1–2. Interactive/model 3/3/2 is retained only as nominal public presentation. |
| R-04 | Can notes be used in Sprechen? | Yes, brief preparation notes are officially allowed. OTTO may teach free speech and low script-dependence as OTTO_METHOD. |
| R-05 | Can training replay Hören freely? | Training may allow extra replay as OTTO_METHOD, but the extra help must be recorded; exam-like mode preserves official per-Teil replay counts. |
| R-06 | Does every Sprechen task use every criterion? | No. Aufgabe 1: Erfüllung/Interaktion/Wortschatz/Strukturen; Aufgabe 2: Erfüllung/Kohärenz/Wortschatz/Strukturen; Aufgabe 3: Erfüllung; Aussprache across 1–3. |
| R-07 | Are detailed presentation substeps official criteria? | No. Five-prompt presentation is official task format; OTTO teaching decomposition is OTTO_METHOD unless directly specified by the official task. |
| R-08 | Can shared Goethe/ÖSD methodology define Goethe constraints? | No. ÖSD-only constraints are excluded. Methodological ideas may be OTTO_METHOD only. |

---

# 17. Director scope check

**PASS**

Scope check confirms:
- only B1-F01 specification is changed;
- no app code;
- no UI;
- no runtime behavior;
- no Evidence/Mastery thresholds;
- no readiness formula;
- no scheduler;
- no planner;
- no production/main changes.

The output is stable enough to act as the source input for B1-F02.

---

# 18. Acceptance criteria checklist

- [x] One canonical Module → Teil → Skill → Micro-skill graph exists.
- [x] Lesen official structure fully covered.
- [x] Hören official structure fully covered.
- [x] Schreiben official structure fully covered.
- [x] Sprechen official structure fully covered.
- [x] Every exam-format claim is tied to an official Goethe source registry.
- [x] Current source version/date recorded.
- [x] OFFICIAL and OTTO_METHOD explicitly separated.
- [x] No Goethe rule invented.
- [x] No ÖSD/telc/DTZ rule silently imported.
- [x] OTTO micro-skills are observable/trainable.
- [x] Stable skill IDs exist for B1-F02.
- [x] Evidence-ready raw observables defined without mastery math.
- [x] QA PASS.
- [x] GOETHE PASS.
- [x] Director scope check PASS.
- [x] No application/code file changed.
- [x] No production/main change.

---

# 19. Frozen input contract for B1-F02

B1-F02 may now consume the following from this artifact:

1. **Node hierarchy and IDs**
   - Module;
   - Teil/Aufgabe;
   - Skill;
   - Micro-skill.

2. **Constraint classification**
   - OFFICIAL / HARD_EXAM;
   - OFFICIAL / PUBLISHED_TASK_FORMAT;
   - OFFICIAL / OFFICIAL_CRITERION;
   - OFFICIAL / OFFICIAL_SCORE_RULE;
   - OTTO_METHOD.

3. **Raw evidence dimensions**
   - outcome/correctness where objective;
   - official criterion observations where productive;
   - time;
   - support/hints;
   - replay/transcript use;
   - retry/self-correction;
   - transfer context;
   - task provenance;
   - completion/interruption.

4. **Assistance ladder**
   - none → strategy → keyword → evidence_hint → phrase_start → full_model.

5. **Learning stages**
   - worked_example → guided → independent → transfer → exam_like.

6. **Error taxonomy hooks**
   - every error maps to a stable micro-skill node.

7. **Exam/readiness boundary**
   - official score rules remain separate from OTTO mastery/readiness.

B1-F02 must not rename F01 node IDs without reopening F01 review.
