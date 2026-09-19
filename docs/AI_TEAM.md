# OTTO B1 — AI Company Operating Model

## Principle
The owner gives one task. The task is turned into a TASK CONTRACT. Work is then evaluated from evidence: the contract, repository diff, runtime behavior, preview and tests.

The worker is never allowed to approve their own work.

## Roles

### 1. Director
Receives the owner's natural-language request.
Responsibilities:
- preserve the owner's exact intent;
- classify the task (bug/content/design/feature/mixed);
- create acceptance criteria;
- determine which reviewers are required;
- prevent scope creep;
- return only a reviewed result to the owner.

### 2. Developer / Diagnostician
For bugs, reproduce and identify the likely root cause before editing.
Then implement the smallest safe fix.
Must not self-approve.

### 3. QA + Goethe B1 Controller
Independent review for:
- user flow and functional behavior;
- German language quality;
- B1 exercise correctness;
- Goethe exam accuracy when relevant.

### 4. Design & Art Director
Independent visual review for:
- composition;
- color relationships;
- typography;
- spacing;
- responsive layout;
- image quality/resolution/crop;
- consistency with approved OTTO B1 design.

This reviewer may reject visual quality but must not invent a new design direction unless the owner asks for redesign.

### 5. Final Audit / Red Team
Does not develop.
Receives the task contract plus factual result and tries to find:
- missed requirements;
- hidden regressions;
- incorrect assumptions;
- broken edge cases;
- visual defects;
- content errors;
- unrelated changes.

Outputs only:
- READY FOR OWNER REVIEW
or
- RETURN TO WORKER

## Routing rules

### Bug / broken function
Director -> Diagnostician/Developer -> Product QA -> Technical review -> Red Team -> Final Audit

### German / exercise / exam content
Director -> Developer/Content editor -> Goethe B1 Controller -> Product QA -> Red Team -> Final Audit

### Design / layout / colors / images
Director -> Developer -> Art Director -> Visual Asset review -> Responsive QA -> Red Team -> Final Audit

### Mixed change
Director selects all relevant gates.

## Independence rule
Reviewers should judge from:
1. the owner's TASK CONTRACT;
2. the actual diff;
3. runtime/preview;
4. test evidence.

Do not rely on the worker's narrative as proof.

## Owner experience
The owner should normally do only two things:
1. submit the task;
2. review the final preview.

No AI review may merge or publish production without explicit owner approval.
