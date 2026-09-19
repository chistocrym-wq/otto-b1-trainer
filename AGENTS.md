# OTTO B1 — Repository Rules for AI Work

## Product
OTTO B1 is an existing German-language Goethe-Zertifikat B1 training application.

Preserve the approved product structure and behavior unless the current owner task explicitly requires a change.

## Non-negotiable workflow
1. Read the current TASK CONTRACT before changing anything.
2. Record the base branch and BASE SHA.
3. Make the smallest change necessary.
4. Do not refactor unrelated code.
5. Do not redesign unrelated UI.
6. Do not rewrite unrelated text or exercises.
7. Do not change navigation, progress, storage, scoring, or neighboring modules unless required.
8. Do not merge to main or deploy production without explicit owner approval.

## Source of truth priority
1. Current TASK CONTRACT / owner's latest explicit instruction.
2. Approved current product behavior.
3. Repository implementation.
4. Previous AI explanations.

Never treat an AI worker's explanation as proof that the implementation is correct.

## Required review disciplines
### Specification & Scope
- Verify every requirement.
- Check every changed file against the task.
- Flag unexplained scope expansion.
- Flag accidental removal or behavior changes.

### Technical
When applicable, verify build/typecheck/runtime, console errors, state transitions, routing, storage, regressions and dependencies.

### Goethe B1 / German
For user-facing German or exam content:
- verify grammar and naturalness;
- verify B1 appropriateness;
- verify prompts, answers, distractors, scoring and explanations;
- never invent Goethe exam rules;
- materially important exam claims must be checked against current official Goethe-Institut sources.

### UI / UX / Art Direction
For visual changes, verify both desktop and mobile.
Check:
- hierarchy;
- typography;
- spacing;
- alignment;
- card proportions;
- contrast;
- responsive behavior;
- visual consistency;
- approved OTTO brand character;
- that B1 feels calm, adult and not childish.

Do not redesign the product just because another design seems preferable.

### Visual Assets
For images/icons/illustrations verify:
- source quality and resolution;
- aspect ratio;
- crop;
- transparency/background;
- pixelation;
- compression;
- display on mobile and desktop;
- no accidental head/hand/body cropping;
- consistency with the approved OTTO visual language.

### Regression / Red Team
After a fix, actively try to find what the change broke nearby.
A successful build is not sufficient evidence of a correct user flow.

## Status vocabulary
- WORKING
- REVIEW
- FAIL
- FIXING
- RE-REVIEW
- READY FOR OWNER REVIEW
- APPROVED BY OWNER

Only the owner can move a change from READY FOR OWNER REVIEW to APPROVED BY OWNER.

## Production gate
Never merge to main and never deploy production without an explicit owner instruction equivalent to "publish/merge to production".
