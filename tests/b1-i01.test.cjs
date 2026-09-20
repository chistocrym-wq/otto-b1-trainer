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

test('runtime is versioned for canonical B1-I01 stores', () => {
  const rt = api.freshRuntime('2026-09-20T10:00:00.000Z');
  assert.equal(rt.version, 2);
  for (const key of [
    'evidenceEvents','assistanceEvents','repairAttempts','skillStateSnapshots',
    'errors','reviews','plannerInputSnapshots','plannerDecisions','plans',
    'planRevisions','readinessInputSnapshots','readinessSnapshots'
  ]) assert.ok(Array.isArray(rt[key]), key + ' must be an array');
});

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

test('evidence distinguishes independent, assisted, repair and transfer success', () => {
  assert.equal(api.classifyEvidence({stage:'independent',outcomeStatus:'success',maxAssistanceConsumed:'none'}).evidenceClass, 'P3');
  assert.equal(api.classifyEvidence({stage:'independent',outcomeStatus:'success',maxAssistanceConsumed:'strategy'}).evidenceClass, 'P2');
  assert.equal(api.classifyEvidence({stage:'independent',outcomeStatus:'success',maxAssistanceConsumed:'evidence_hint'}).evidenceClass, 'P1');
  assert.equal(api.classifyEvidence({stage:'transfer',outcomeStatus:'success',maxAssistanceConsumed:'none'}).evidenceClass, 'P4');
  assert.equal(api.classifyEvidence({stage:'transfer',outcomeStatus:'failure',maxAssistanceConsumed:'none'}).evidenceClass, 'N3');
  const repair = api.classifyEvidence({stage:'independent',selfRepairAttempt:true,outcomeStatus:'success',maxAssistanceConsumed:'none'});
  assert.equal(repair.evidenceClass, null);
  assert.equal(repair.evidenceRole, 'self_repair');
});

test('one success stays M0 and M3 requires independent transfer history', () => {
  const rt = api.freshRuntime('2026-09-20T10:00:00.000Z');
  const t1 = api.CONTENT[0], t2 = api.CONTENT[1], t3 = api.CONTENT[2];

  ev(rt, t1);
  let st = api.deriveSkillState(rt.evidenceEvents, t1.skillNodeId, null, '2026-09-20T10:02:00.000Z');
  assert.equal(st.mastery_state, 'M0');

  ev(rt, t2, {completedAt:'2026-09-20T10:05:00.000Z'});
  st = api.deriveSkillState(rt.evidenceEvents, t1.skillNodeId, st, '2026-09-20T10:06:00.000Z');
  assert.equal(st.mastery_state, 'M2');

  ev(rt, t3, {stage:'transfer',completedAt:'2026-09-20T10:10:00.000Z',transferOfErrorId:'err-1'});
  st = api.deriveSkillState(rt.evidenceEvents, t1.skillNodeId, st, '2026-09-20T10:11:00.000Z');
  assert.equal(st.mastery_state, 'M3');
});

test('independent failure plus failed self-repair can establish WEAK', () => {
  const rt = api.freshRuntime('2026-09-20T10:00:00.000Z');
  const task = api.CONTENT[0];
  ev(rt, task, {selectedAnswer:1,outcomeStatus:'failure'});
  ev(rt, task, {
    selectedAnswer:1,outcomeStatus:'failure',
    selfRepairAttempt:true,selfCorrectionAttempted:true,selfCorrectionSuccess:'no',
    completedAt:'2026-09-20T10:03:00.000Z',attemptNumber:2,priorExactExposure:1
  });
  const st = api.deriveSkillState(rt.evidenceEvents, task.skillNodeId, null, '2026-09-20T10:04:00.000Z');
  assert.equal(st.mastery_state, 'M1');
  assert.equal(st.transition_reason_code, 'INDEPENDENT_FAILURE_PLUS_FAILED_REPAIR');
});

test('SkillState snapshots are append-only on material changes', () => {
  const now = '2026-09-20T10:00:00.000Z';
  const rt = api.freshRuntime(now);
  api.recomputeAllSkillStates(rt, now);
  const initialCount = rt.skillStateSnapshots.length;
  assert.equal(initialCount, 2);
  api.recomputeAllSkillStates(rt, '2026-09-20T10:01:00.000Z');
  assert.equal(rt.skillStateSnapshots.length, initialCount);

  ev(rt, api.CONTENT[0]);
  api.recomputeAllSkillStates(rt, '2026-09-20T10:02:00.000Z');
  assert.equal(rt.skillStateSnapshots.length, initialCount + 1);
  assert.ok(rt.skillStates['L.T1.CORR.M04'].state_snapshot_id);
});

test('fresh 25-minute planner is deterministic, bounded and auditable', () => {
  const now = '2026-09-20T10:00:00.000Z';
  const a = api.freshRuntime(now);
  const b = api.freshRuntime(now);
  api.recomputeAllSkillStates(a, now);
  api.recomputeAllSkillStates(b, now);

  const pa = api.buildPlan(a, 25, now, 'occasion-test');
  const pb = api.buildPlan(b, 25, now, 'occasion-test');

  assert.deepEqual(pa.selected_actions.map(x => [x.skill_node_id,x.task_id]), pb.selected_actions.map(x => [x.skill_node_id,x.task_id]));
  assert.equal(pa.estimated_total_work_min <= 22, true);
  assert.equal(pa.selected_actions.length, 4);
  assert.deepEqual(pa.selected_actions.map(x => x.skill_node_id), [
    'L.T1.CORR.M04','L.T1.CORR.M05','L.T1.CORR.M04','L.T1.CORR.M05'
  ]);
  assert.equal(new Set(pa.selected_actions.map(x => x.skill_node_id)).size, 2);
  assert.ok(pa.planner_input_snapshot_id);
  assert.equal(pa.learning_occasion_id, 'occasion-test');
  assert.equal(a.plannerInputSnapshots.length, 1);
  assert.equal(a.plans.length, 1);
  assert.equal(a.plannerInputSnapshots[0].content_catalog_version, api.CONTENT_CATALOG_VERSION);
  for (const action of pa.selected_actions) {
    assert.ok(Array.isArray(action.source_evidence_ids));
    assert.ok('mastery_state' in action);
    assert.ok('review_state' in action);
    assert.ok('estimated_duration_min' in action);
    assert.ok('content_status' in action);
    assert.ok('stage_target' in action);
  }
});

test('active error outranks normal evidence-gap work and uses content duration', () => {
  const now = '2026-09-20T10:00:00.000Z';
  const rt = api.freshRuntime(now);
  api.recomputeAllSkillStates(rt, now);
  const task = api.CONTENT[0];
  const failure = ev(rt, task, {selectedAnswer:1,outcomeStatus:'failure'});
  const err = api.createErrorObject(rt, task, failure, now);
  err.status = 'SELF_REPAIR_PENDING';

  const plan = api.buildPlan(rt, 25, now, 'occasion-repair');
  assert.equal(plan.selected_actions[0].action_type, 'RECOVERY_REPAIR');
  assert.equal(plan.selected_actions[0].error_id, err.error_id);
  assert.equal(plan.selected_actions[0].estimated_duration_min, task.minutes);
});

test('ErrorObject exposes frozen lifecycle fields and resolved recurrence reopens it', () => {
  const now = '2026-09-20T10:00:00.000Z';
  const rt = api.freshRuntime(now);
  const task = api.CONTENT[0];
  const failure = ev(rt, task, {selectedAnswer:1,outcomeStatus:'failure'});
  const err = api.createErrorObject(rt, task, failure, now);
  for (const field of [
    'user_id','micro_skill_id','original_action_type','error_cause_hypothesis',
    'classification_source','repair_attempt_count','transfer_status','review_required',
    'review_reason','linked_evidence_event_ids'
  ]) assert.ok(field in err, field + ' missing');
  err.status = 'RESOLVED';
  const recurrence = ev(rt, api.CONTENT[1], {selectedAnswer:1,outcomeStatus:'failure',completedAt:'2026-09-20T11:00:00.000Z'});
  const same = api.createErrorObject(rt, api.CONTENT[1], recurrence, '2026-09-20T11:00:00.000Z');
  assert.equal(same.error_id, err.error_id);
  assert.equal(same.status, 'RETURNED');
  assert.equal(same.recurrence_count, 1);
  assert.ok(same.reopened_at);
});

test('transfer pending selects new context and independent transfer creates +1 day review', () => {
  const now = '2026-09-20T10:00:00.000Z';
  const rt = api.freshRuntime(now);
  api.recomputeAllSkillStates(rt, now);
  const task = api.CONTENT[0];
  const failure = ev(rt, task, {selectedAnswer:1,outcomeStatus:'failure'});
  const err = api.createErrorObject(rt, task, failure, now);
  err.status = 'TRANSFER_PENDING';

  const plan = api.buildPlan(rt, 25, now, 'occasion-transfer');
  const transfer = plan.selected_actions.find(x => x.action_type === 'TRANSFER_CHECK');
  assert.ok(transfer);
  const transferTask = api.CONTENT.find(x => x.id === transfer.task_id);
  assert.equal(api.isTransferSafe(task, transferTask), true);

  const success = ev(rt, transferTask, {
    stage:'transfer',completedAt:'2026-09-20T10:10:00.000Z',
    transferOfErrorId:err.error_id
  });
  const review = api.createReviewObligation(rt, err, success, now);
  assert.equal(review.review_state, 'SCHEDULED');
  assert.equal(review.review_level, 0);
  assert.equal(review.review_success_streak, 0);
  assert.equal(review.review_reason[0], 'POST_REPAIR_CONFIRMATION');
  assert.equal(new Date(review.next_review_at).getTime() - new Date(success.completed_at).getTime(), 86400000);
  assert.equal(err.review_required, true);
  assert.equal(err.status, 'REVIEW_SCHEDULED');
});

test('readiness is four immutable module snapshots and owner-path Lesen coverage is honest T2/1-of-5', () => {
  const rt = api.freshRuntime('2026-09-20T10:00:00.000Z');
  api.recomputeAllSkillStates(rt, '2026-09-20T10:00:00.000Z');
  const source = api.CONTENT[0], transferTask = api.CONTENT[1];
  const fail = ev(rt, source, {selectedAnswer:1,outcomeStatus:'failure'});
  const err = api.createErrorObject(rt, source, fail, '2026-09-20T10:01:00.000Z');
  const transfer = ev(rt, transferTask, {
    stage:'transfer',completedAt:'2026-09-20T10:10:00.000Z',transferOfErrorId:err.error_id
  });
  api.createReviewObligation(rt, err, transfer, '2026-09-20T10:10:00.000Z');
  api.recomputeAllSkillStates(rt, '2026-09-20T10:11:00.000Z');

  const snap = api.computeReadiness(rt, '2026-09-20T10:12:00.000Z');
  assert.deepEqual(snap.modules.map(x => x.module), ['Lesen','Hören','Schreiben','Sprechen']);
  assert.equal(snap.modules.every(x => x.readiness_state === 'R0'), true);
  assert.equal(JSON.stringify(snap).includes('%'), false);

  const lesen = snap.modules[0];
  assert.match(lesen.user_label, /Недостаточно данных/);
  assert.equal(lesen.official_teil_coverage[0].coverage_tier, 'T2');
  assert.equal(lesen.coverage, 'Проверено: 1 из 5 Teil');
  assert.equal(lesen.sufficiency_status, 'INSUFFICIENT_FOR_READINESS_CLASSIFICATION');
  for (const field of [
    'basis_state_snapshot_ids','basis_evidence_event_ids','basis_error_ids',
    'basis_review_record_ids','official_teil_coverage','micro_skill_coverage_summary',
    'independence_summary','transfer_summary','exam_like_summary','freshness_summary',
    'active_blockers','missing_data_flags','evaluator_quality_summary','audit_reason_codes'
  ]) assert.ok(field in lesen, field + ' missing');
  assert.equal(rt.readinessSnapshots.length, 4);
  assert.equal(rt.readinessInputSnapshots.length, 4);

  api.computeReadiness(rt, '2026-09-20T10:13:00.000Z');
  assert.equal(rt.readinessSnapshots.length, 4, 'unchanged basis must not rewrite snapshot history');
});
