'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const api = require('../app/i01.js');

function ev(rt, task, cfg) {
  return api.makeEvidenceEvent(rt, task, Object.assign({
    sessionId: 's1',
    learningOccasionId: 'o1',
    stage: 'independent',
    attemptNumber: 1,
    priorExactExposure: 0,
    priorFamilyExposure: 0,
    startedAt: '2026-09-20T10:00:00.000Z',
    completedAt: '2026-09-20T10:01:00.000Z',
    responseTimeMs: 60000,
    maxAssistanceConsumed: 'none',
    assistanceEvents: [],
    selectedAnswer: task.correctIndex,
    outcomeStatus: 'success'
  }, cfg || {}));
}

test('transfer protection rejects exact and near-duplicate identity', () => {
  const a = api.CONTENT[0];
  const exact = Object.assign({}, api.CONTENT[1], {
    skillNodeId: a.skillNodeId,
    contentFingerprint: a.contentFingerprint
  });
  const near = Object.assign({}, api.CONTENT[1], {
    skillNodeId: a.skillNodeId,
    variantGroupId: a.variantGroupId
  });
  assert.equal(api.isTransferSafe(a, exact), false);
  assert.equal(api.isTransferSafe(a, near), false);
  assert.equal(api.isTransferSafe(a, api.CONTENT[1]), true);
});

test('evidence distinguishes independent, assisted and transfer success', () => {
  assert.equal(api.classifyEvidence({stage:'independent',outcomeStatus:'success',maxAssistanceConsumed:'none'}).evidenceClass, 'P3');
  assert.equal(api.classifyEvidence({stage:'independent',outcomeStatus:'success',maxAssistanceConsumed:'strategy'}).evidenceClass, 'P2');
  assert.equal(api.classifyEvidence({stage:'independent',outcomeStatus:'success',maxAssistanceConsumed:'evidence_hint'}).evidenceClass, 'P1');
  assert.equal(api.classifyEvidence({stage:'transfer',outcomeStatus:'success',maxAssistanceConsumed:'none'}).evidenceClass, 'P4');
  assert.equal(api.classifyEvidence({stage:'transfer',outcomeStatus:'failure',maxAssistanceConsumed:'none'}).evidenceClass, 'N3');
  const repair = api.classifyEvidence({stage:'independent',selfRepairAttempt:true,outcomeStatus:'success',maxAssistanceConsumed:'none'});
  assert.equal(repair.evidenceClass, null);
  assert.equal(repair.evidenceRole, 'self_repair');
});

test('mastery does not jump from one success and reaches M3 only with independent transfer history', () => {
  const rt = api.freshRuntime('2026-09-20T10:00:00.000Z');
  const t1 = api.CONTENT[0];
  const t2 = api.CONTENT[1];

  ev(rt, t1);
  let st = api.deriveSkillState(rt.evidenceEvents, t1.skillNodeId, null, '2026-09-20T10:02:00.000Z');
  assert.equal(st.mastery_state, 'M0');

  ev(rt, t2, {completedAt:'2026-09-20T10:05:00.000Z'});
  st = api.deriveSkillState(rt.evidenceEvents, t1.skillNodeId, st, '2026-09-20T10:06:00.000Z');
  assert.equal(st.mastery_state, 'M2');

  const t3 = api.CONTENT[2];
  ev(rt, t3, {stage:'transfer',completedAt:'2026-09-20T10:10:00.000Z',transferOfErrorId:'err-1'});
  st = api.deriveSkillState(rt.evidenceEvents, t1.skillNodeId, st, '2026-09-20T10:11:00.000Z');
  assert.equal(st.mastery_state, 'M3');
});

test('fresh 25-minute planner is deterministic and bounded across both Micro-skills', () => {
  const now = '2026-09-20T10:00:00.000Z';
  const a = api.freshRuntime(now);
  const b = api.freshRuntime(now);
  api.recomputeAllSkillStates(a, now);
  api.recomputeAllSkillStates(b, now);

  const pa = api.buildPlan(a, 25, now);
  const pb = api.buildPlan(b, 25, now);

  assert.deepEqual(pa.selected_actions.map(x => [x.skill_node_id,x.task_id]), pb.selected_actions.map(x => [x.skill_node_id,x.task_id]));
  assert.equal(pa.estimated_total_work_min <= 22, true);
  assert.equal(pa.selected_actions.length, 4);
  assert.deepEqual(pa.selected_actions.map(x => x.skill_node_id), [
    'L.T1.CORR.M04',
    'L.T1.CORR.M05',
    'L.T1.CORR.M04',
    'L.T1.CORR.M05'
  ]);
  assert.equal(new Set(pa.selected_actions.map(x => x.skill_node_id)).size, 2);
});

test('active error outranks normal evidence-gap work', () => {
  const now = '2026-09-20T10:00:00.000Z';
  const rt = api.freshRuntime(now);
  api.recomputeAllSkillStates(rt, now);
  const task = api.CONTENT[0];
  const failure = ev(rt, task, {
    selectedAnswer: 1,
    outcomeStatus:'failure',
    completedAt:'2026-09-20T10:01:00.000Z'
  });
  const err = api.createErrorObject(rt, task, failure, now);
  err.status = 'SELF_REPAIR_PENDING';

  const plan = api.buildPlan(rt, 25, now);
  assert.equal(plan.selected_actions[0].action_type, 'RECOVERY_REPAIR');
  assert.equal(plan.selected_actions[0].error_id, err.error_id);
});

test('transfer pending selects a genuinely new context and success creates delayed review', () => {
  const now = '2026-09-20T10:00:00.000Z';
  const rt = api.freshRuntime(now);
  api.recomputeAllSkillStates(rt, now);
  const task = api.CONTENT[0];
  const failure = ev(rt, task, {selectedAnswer:1,outcomeStatus:'failure'});
  const err = api.createErrorObject(rt, task, failure, now);
  err.status = 'TRANSFER_PENDING';

  const plan = api.buildPlan(rt, 25, now);
  const transfer = plan.selected_actions.find(x => x.action_type === 'TRANSFER_CHECK');
  assert.ok(transfer);
  const transferTask = api.CONTENT.find(x => x.id === transfer.task_id);
  assert.equal(api.isTransferSafe(task, transferTask), true);

  const success = ev(rt, transferTask, {
    stage:'transfer',
    completedAt:'2026-09-20T10:10:00.000Z',
    transferOfErrorId:err.error_id
  });
  const review = api.createReviewObligation(rt, err, success, now);
  assert.equal(review.review_state, 'SCHEDULED');
  assert.equal(review.review_level, 0);
  assert.equal(review.review_reason[0], 'POST_REPAIR_CONFIRMATION');
  assert.equal(new Date(review.next_review_at).getTime() - new Date(success.completed_at).getTime(), 86400000);
});

test('readiness remains honest insufficient-data and separate by four modules', () => {
  const rt = api.freshRuntime('2026-09-20T10:00:00.000Z');
  api.recomputeAllSkillStates(rt, '2026-09-20T10:00:00.000Z');
  const snap = api.computeReadiness(rt, '2026-09-20T10:00:00.000Z');
  assert.deepEqual(snap.modules.map(x => x.module), ['Lesen','Hören','Schreiben','Sprechen']);
  assert.equal(snap.modules.every(x => x.readiness_state === 'R0'), true);
  assert.equal(JSON.stringify(snap).includes('%'), false);
  assert.match(snap.modules[0].user_label, /Недостаточно данных/);
});
