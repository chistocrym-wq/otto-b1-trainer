(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) {
    root.OTTO_I01 = api;
    if (root.document) api.boot(root);
  }
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';

  const POLICY = {
    evidence: 'OTTO_EVIDENCE_V1',
    mastery: 'OTTO_MASTERY_V1',
    review: 'OTTO_REVIEW_V1',
    planner: 'OTTO_DAILY_PLANNER_V1',
    readiness: 'OTTO_READINESS_V1'
  };

  const SKILLS = {
    'L.T1.CORR.M04': {
      module: 'LESEN',
      teil: 'T1',
      label: 'Понимать перефразирование',
      short: 'перефразирование'
    },
    'L.T1.CORR.M05': {
      module: 'LESEN',
      teil: 'T1',
      label: 'Замечать отрицание и ограничение',
      short: 'отрицание и ограничение'
    }
  };

  const CONTENT = [
    {
      id: 'L-T1-PARA-01',
      skillNodeId: 'L.T1.CORR.M04',
      taskFamilyId: 'L-T1-RF-CORR',
      stimulusId: 'msg-photo-workshop',
      contentFingerprint: 'fp-photo-workshop-v1',
      variantGroupId: 'vg-para-workshop',
      transferContextId: 'ctx-workshop',
      origin: 'original_aligned',
      minutes: 5,
      text: 'Hallo Nina, der Fotoworkshop beginnt zwar erst um 15 Uhr, aber wir sollen schon um 14:30 da sein. Die Teilnahme kostet nichts; anmelden mussten wir uns vorher online.',
      statement: 'Für den Workshop muss man nichts bezahlen.',
      options: ['Richtig', 'Falsch'],
      correctIndex: 0,
      explanation: '„Die Teilnahme kostet nichts“ bedeutet: Für den Workshop bezahlt man nichts.',
      hint: 'Ищи не одинаковые слова, а одинаковый смысл: „kostet nichts“ = „nichts bezahlen“.'
    },
    {
      id: 'L-T1-PARA-02',
      skillNodeId: 'L.T1.CORR.M04',
      taskFamilyId: 'L-T1-RF-CORR',
      stimulusId: 'msg-small-restaurant',
      contentFingerprint: 'fp-small-restaurant-v1',
      variantGroupId: 'vg-para-restaurant',
      transferContextId: 'ctx-restaurant',
      origin: 'original_aligned',
      minutes: 5,
      text: 'Liebe Mara, gestern waren wir in einem ziemlich kleinen Restaurant. Trotzdem bekamen wir sofort einen Tisch und mussten überhaupt nicht warten.',
      statement: 'Obwohl das Restaurant klein war, gab es sofort einen freien Tisch.',
      options: ['Richtig', 'Falsch'],
      correctIndex: 0,
      explanation: '„Trotzdem bekamen wir sofort einen Tisch“ entspricht „obwohl … gab es sofort einen freien Tisch“.',
      hint: 'Сравни связь „trotzdem“ ↔ „obwohl“, а не отдельные слова.'
    },
    {
      id: 'L-T1-PARA-03',
      skillNodeId: 'L.T1.CORR.M04',
      taskFamilyId: 'L-T1-RF-CORR',
      stimulusId: 'msg-club-course',
      contentFingerprint: 'fp-club-course-v1',
      variantGroupId: 'vg-para-course',
      transferContextId: 'ctx-course',
      origin: 'original_aligned',
      minutes: 5,
      text: 'Der Computerkurs ist für Vereinsmitglieder gratis. Gäste können auch teilnehmen, bezahlen aber acht Euro.',
      statement: 'Mitglieder des Vereins müssen für den Kurs nichts bezahlen.',
      options: ['Richtig', 'Falsch'],
      correctIndex: 0,
      explanation: '„Für Vereinsmitglieder gratis“ bedeutet, dass Mitglieder nichts bezahlen.',
      hint: '„gratis“ и „nichts bezahlen“ передают один и тот же смысл.'
    },
    {
      id: 'L-T1-NEG-01',
      skillNodeId: 'L.T1.CORR.M05',
      taskFamilyId: 'L-T1-RF-CORR',
      stimulusId: 'msg-weekend-arrival',
      contentFingerprint: 'fp-weekend-arrival-v1',
      variantGroupId: 'vg-neg-arrival',
      transferContextId: 'ctx-arrival',
      origin: 'original_aligned',
      minutes: 5,
      text: 'Eigentlich wollte ich am Freitag kommen, aber ich schaffe es erst am Samstag. Bitte reserviere nichts für Freitag.',
      statement: 'Die Person kommt am Freitag.',
      options: ['Richtig', 'Falsch'],
      correctIndex: 1,
      explanation: 'План на пятницу отменён: „erst am Samstag“ означает, что человек приедет только в субботу.',
      hint: 'Обрати внимание на коррекцию: „eigentlich … aber … erst am Samstag“.'
    },
    {
      id: 'L-T1-NEG-02',
      skillNodeId: 'L.T1.CORR.M05',
      taskFamilyId: 'L-T1-RF-CORR',
      stimulusId: 'msg-side-entrance',
      contentFingerprint: 'fp-side-entrance-v1',
      variantGroupId: 'vg-neg-entrance',
      transferContextId: 'ctx-entrance',
      origin: 'original_aligned',
      minutes: 5,
      text: 'Der Eingang an der Hauptstraße ist heute geschlossen. Besucher sollen den Seiteneingang benutzen.',
      statement: 'Heute kann man das Gebäude nicht über den Haupteingang betreten.',
      options: ['Richtig', 'Falsch'],
      correctIndex: 0,
      explanation: 'Если главный вход закрыт, войти через него сегодня нельзя.',
      hint: 'Проверь ограничение „heute geschlossen“ и к какому входу оно относится.'
    },
    {
      id: 'L-T1-NEG-03',
      skillNodeId: 'L.T1.CORR.M05',
      taskFamilyId: 'L-T1-RF-CORR',
      stimulusId: 'msg-bike-yard',
      contentFingerprint: 'fp-bike-yard-v1',
      variantGroupId: 'vg-neg-bikes',
      transferContextId: 'ctx-bikes',
      origin: 'original_aligned',
      minutes: 5,
      text: 'Fahrräder dürfen im Hof abgestellt werden, aber nicht direkt vor der Eingangstür.',
      statement: 'Fahrräder dürfen auch direkt vor der Eingangstür stehen.',
      options: ['Richtig', 'Falsch'],
      correctIndex: 1,
      explanation: 'Фраза „aber nicht direkt vor der Eingangstür“ прямо запрещает это место.',
      hint: 'Ищи ограничение после „aber nicht“.'
    }
  ];

  const REASON_LABELS = {
    REGRESSION_DETECTED: 'Эта ошибка вернулась — сначала восстановим навык.',
    RETURNED_ERROR: 'Эта ошибка вернулась — сначала восстановим навык.',
    ACTIVE_ERROR_REPAIR: 'Сначала исправим конкретную ошибку, прежде чем идти дальше.',
    OVERDUE_REVIEW: 'Это повторение уже просрочено.',
    DUE_REVIEW: 'Пора перепроверить навык после паузы.',
    POST_REPAIR_CONFIRMATION: 'После исправления нужен новый независимый пример.',
    TRANSFER_PENDING: 'Проверим этот же навык на новом материале.',
    WEAK_SKILL: 'По этому навыку есть повторные ошибки.',
    DEVELOPING_SKILL: 'Прогресс есть, но навыку ещё нужна самостоятельная практика.',
    ASSISTANCE_DEPENDENCY: 'После подсказок проверим, получится ли самостоятельно.',
    INSUFFICIENT_EVIDENCE: 'По этому микронавыку пока недостаточно самостоятельных данных.',
    STALE_EVIDENCE: 'Этот навык давно не проверяли.',
    EXAM_LIKE_EVIDENCE_GAP: 'Позже понадобится отдельная exam-like проверка.',
    CONTENT_BLOCK_FALLBACK: 'Для приоритетной проверки сейчас нет валидного нового задания.'
  };

  function clone(v) {
    return JSON.parse(JSON.stringify(v));
  }

  function iso(ts) {
    return new Date(ts == null ? Date.now() : ts).toISOString();
  }

  function addDays(ts, n) {
    return new Date(new Date(ts).getTime() + n * 86400000).toISOString();
  }

  function freshRuntime(now) {
    const stamp = iso(now);
    return {
      version: 1,
      seq: 0,
      userId: 'local-preview-user',
      activeModules: ['LESEN'],
      selectedDuration: 25,
      evidenceEvents: [],
      assistanceEvents: [],
      skillStates: {},
      errors: [],
      reviews: [],
      plannerDecisions: [],
      planRevisions: [],
      currentPlan: null,
      session: null,
      readiness: null,
      ui: {
        selectedAnswer: null,
        hintLevel: 'none',
        currentErrorId: null,
        currentTaskStartedAt: null,
        auditActionId: null,
        message: ''
      },
      createdAt: stamp,
      updatedAt: stamp
    };
  }

  function nextId(rt, prefix) {
    rt.seq = Number(rt.seq || 0) + 1;
    return prefix + '-' + String(rt.seq).padStart(4, '0');
  }

  function getTask(id) {
    return CONTENT.find(function (x) { return x.id === id; }) || null;
  }

  function getSkill(id) {
    return SKILLS[id] || { module: 'LESEN', teil: 'T1', label: id, short: id };
  }

  function assistanceRank(level) {
    return {
      none: 0,
      strategy: 1,
      keyword: 2,
      evidence_hint: 3,
      phrase_start: 4,
      full_model: 5
    }[level] == null ? 0 : {
      none: 0,
      strategy: 1,
      keyword: 2,
      evidence_hint: 3,
      phrase_start: 4,
      full_model: 5
    }[level];
  }

  function independenceFromAssistance(level) {
    if (level === 'none') return 'independent';
    if (level === 'strategy') return 'minimally_supported';
    if (level === 'keyword' || level === 'evidence_hint') return 'supported';
    if (level === 'phrase_start') return 'heavily_supported';
    return 'model_exposed';
  }

  function isTransferSafe(source, target) {
    if (!source || !target) return false;
    return source.id !== target.id &&
      source.contentFingerprint !== target.contentFingerprint &&
      source.variantGroupId !== target.variantGroupId &&
      source.stimulusId !== target.stimulusId &&
      source.transferContextId !== target.transferContextId &&
      source.skillNodeId === target.skillNodeId;
  }

  function classifyEvidence(opts) {
    const assistance = opts.maxAssistanceConsumed || 'none';
    const success = opts.outcomeStatus === 'success';
    const stage = opts.stage || 'independent';

    if (stage === 'repair') {
      return {
        evidenceClass: null,
        evidenceRole: 'self_repair',
        independence: independenceFromAssistance(assistance)
      };
    }

    if (success) {
      if (assistance === 'none') {
        return {
          evidenceClass: stage === 'transfer' ? 'P4' : stage === 'exam_like' ? 'P5' : 'P3',
          evidenceRole: stage,
          independence: 'independent'
        };
      }
      if (assistance === 'strategy') {
        return { evidenceClass: 'P2', evidenceRole: stage, independence: 'minimally_supported' };
      }
      return { evidenceClass: 'P1', evidenceRole: stage, independence: independenceFromAssistance(assistance) };
    }

    if (assistance !== 'none') {
      return { evidenceClass: 'N1', evidenceRole: stage, independence: independenceFromAssistance(assistance) };
    }
    if (stage === 'transfer') return { evidenceClass: 'N3', evidenceRole: stage, independence: 'independent' };
    if (stage === 'exam_like') return { evidenceClass: 'N4', evidenceRole: stage, independence: 'independent' };
    return { evidenceClass: 'N2', evidenceRole: stage, independence: 'independent' };
  }

  function makeEvidenceEvent(rt, task, opts) {
    const completedAt = iso(opts.completedAt);
    const classification = classifyEvidence(opts);
    const eventId = nextId(rt, 'ev');
    const event = {
      event_id: eventId,
      user_id: rt.userId,
      session_id: opts.sessionId || (rt.session && rt.session.sessionId) || 'preview-no-session',
      learning_occasion_id: opts.learningOccasionId || (rt.session && rt.session.learningOccasionId) || 'preview-occasion',
      skill_node_id: task.skillNodeId,
      module: 'Lesen',
      teil_or_aufgabe: task.teil || 'T1',
      task_instance_id: task.id,
      task_family_id: task.taskFamilyId,
      stimulus_id: task.stimulusId,
      content_fingerprint: task.contentFingerprint,
      variant_group_id: task.variantGroupId,
      task_origin: task.origin,
      transfer_context_id: opts.stage === 'transfer' ? task.transferContextId : null,
      stage: opts.stage || 'independent',
      attempt_number: Number(opts.attemptNumber || 1),
      prior_exact_item_exposure_count: Number(opts.priorExactExposure || 0),
      prior_task_family_exposure_count: Number(opts.priorFamilyExposure || 0),
      started_at: opts.startedAt || completedAt,
      completed_at: completedAt,
      response_time_ms: Math.max(0, Number(opts.responseTimeMs || 0)),
      completion_state: 'completed',
      assistance_events: clone(opts.assistanceEvents || []),
      max_assistance_consumed: opts.maxAssistanceConsumed || 'none',
      assistance_offered_not_consumed: !!opts.assistanceOfferedNotConsumed,
      exam_constraint_violation: false,
      outcome_type: 'objective',
      outcome_status: opts.outcomeStatus,
      raw_response: opts.selectedAnswer,
      evaluator_source: 'rule',
      evaluator_confidence: 'high',
      data_quality: 'valid',
      linked_error_id: opts.linkedErrorId || null,
      self_correction_attempted: !!opts.selfCorrectionAttempted,
      self_correction_success: opts.selfCorrectionSuccess || 'not_applicable',
      transfer_of_error_id: opts.transferOfErrorId || null,
      delayed_review_of_error_id: opts.delayedReviewOfErrorId || null,
      selected_answer: opts.selectedAnswer,
      correct_answer: task.correctIndex,
      item_correct: opts.outcomeStatus === 'success',
      distractor_id: opts.outcomeStatus === 'success' ? null : 'selected-' + opts.selectedAnswer,
      distractor_tag: task.skillNodeId === 'L.T1.CORR.M04' ? 'paraphrase_miss' : 'negation_limitation_miss',
      question_target: task.skillNodeId === 'L.T1.CORR.M04' ? 'paraphrase' : 'negation_limitation',
      evidence_span_selected: null,
      answer_changed_after_assistance: assistanceRank(opts.maxAssistanceConsumed || 'none') > 0,
      answer_changed_after_replay: false,
      evidence_class: classification.evidenceClass,
      evidence_role: classification.evidenceRole,
      independence: classification.independence
    };
    rt.evidenceEvents.push(event);
    return event;
  }

  function distinctByTask(events) {
    const seen = new Set();
    return events.filter(function (e) {
      const key = e.task_instance_id + '|' + e.content_fingerprint + '|' + e.variant_group_id;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function deriveSkillState(events, skillNodeId, previousState, now) {
    const relevant = events.filter(function (e) {
      return e.skill_node_id === skillNodeId && e.data_quality === 'valid' && e.completion_state === 'completed' && e.evidence_class;
    });
    const unique = distinctByTask(relevant);
    const strongPositive = unique.filter(function (e) { return ['P3', 'P4', 'P5'].includes(e.evidence_class); });
    const anyPositive = unique.filter(function (e) { return ['P1', 'P2', 'P3', 'P4', 'P5'].includes(e.evidence_class); });
    const strongNegative = unique.filter(function (e) { return ['N2', 'N3', 'N4'].includes(e.evidence_class); });
    const prior = previousState && previousState.mastery_state ? previousState.mastery_state : 'M0';
    let mastery = 'M0';
    let reason = 'INSUFFICIENT_EVIDENCE';

    const latestStrongPositive = strongPositive.length ? strongPositive[strongPositive.length - 1] : null;
    const latestStrongNegative = strongNegative.length ? strongNegative[strongNegative.length - 1] : null;
    const strongNegativeAfterPositive = latestStrongNegative && latestStrongPositive &&
      new Date(latestStrongNegative.completed_at).getTime() > new Date(latestStrongPositive.completed_at).getTime();

    if (['M3', 'M4', 'M5'].includes(prior) && strongNegative.length >= 2 && strongNegativeAfterPositive) {
      mastery = 'M6';
      reason = 'REGRESSION_CONFIRMED';
    } else if (['M3', 'M4'].includes(prior) && strongNegativeAfterPositive) {
      mastery = 'M5';
      reason = 'STRONG_CONTRADICTION';
    } else {
      const contexts = new Set(strongPositive.map(function (e) { return e.transfer_context_id || e.stimulus_id; }));
      const hasTransfer = strongPositive.some(function (e) { return e.evidence_class === 'P4' || e.evidence_class === 'P5'; });
      const occasions = new Set(strongPositive.map(function (e) { return e.learning_occasion_id; }));
      const hasUnresolvedNegative = latestStrongNegative && (!latestStrongPositive ||
        new Date(latestStrongNegative.completed_at).getTime() > new Date(latestStrongPositive.completed_at).getTime());

      if (prior === 'M3' && strongPositive.length >= 3 && hasTransfer && occasions.size >= 2 && !hasUnresolvedNegative) {
        mastery = 'M4';
        reason = 'LATER_INDEPENDENT_CONFIRMATION';
      } else if (strongPositive.length >= 2 && hasTransfer && contexts.size >= 2 && !hasUnresolvedNegative) {
        mastery = 'M3';
        reason = 'INDEPENDENT_TRANSFER_CONFIRMED';
      } else if (anyPositive.length >= 2 && anyPositive.some(function (e) { return ['P2', 'P3', 'P4', 'P5'].includes(e.evidence_class); })) {
        mastery = 'M2';
        reason = strongNegative.length ? 'MIXED_DEVELOPING' : 'POSITIVE_PROGRESS';
      } else if (strongNegative.length >= 2 && anyPositive.filter(function (e) { return ['P3', 'P4', 'P5'].includes(e.evidence_class); }).length === 0) {
        mastery = 'M1';
        reason = 'REPEATED_INDEPENDENT_FAILURE';
      }
    }

    const lastValid = relevant.length ? relevant[relevant.length - 1].completed_at : null;
    const lastIndependent = strongPositive.length ? strongPositive[strongPositive.length - 1].completed_at : null;
    const lastNegative = strongNegative.length ? strongNegative[strongNegative.length - 1].completed_at : null;

    return {
      skill_node_id: skillNodeId,
      mastery_state: mastery,
      review_state: 'NOT_DUE',
      policy_version: POLICY.mastery,
      computed_at: iso(now),
      basis_event_ids: relevant.map(function (e) { return e.event_id; }),
      previous_state: prior,
      transition_reason_code: reason,
      latest_valid_evidence_at: lastValid,
      latest_independent_success_at: lastIndependent,
      latest_strong_negative_at: lastNegative,
      freshness_status: lastValid ? 'fresh' : 'unknown'
    };
  }

  function recomputeAllSkillStates(rt, now) {
    Object.keys(SKILLS).forEach(function (skillId) {
      rt.skillStates[skillId] = deriveSkillState(rt.evidenceEvents, skillId, rt.skillStates[skillId], now);
    });
    return rt.skillStates;
  }

  function createErrorObject(rt, task, event, now) {
    const existing = rt.errors.find(function (e) {
      return e.skill_node_id === task.skillNodeId && !['RESOLVED'].includes(e.status) && e.root_error_id == null;
    });
    if (existing && existing.status !== 'RESOLVED') {
      existing.related_event_ids.push(event.event_id);
      existing.last_seen_at = iso(now);
      existing.current_task_id = task.id;
      existing.status = existing.status === 'REVIEW_SCHEDULED' || existing.status === 'PROVISIONALLY_RESOLVED' ? 'RETURNED' : 'NEW';
      existing.recurrence_count = Number(existing.recurrence_count || 0) + (existing.status === 'RETURNED' ? 1 : 0);
      return existing;
    }

    const error = {
      error_id: nextId(rt, 'err'),
      module: 'Lesen',
      teil_or_aufgabe: 'T1',
      parent_skill_id: 'L.T1.CORR',
      skill_node_id: task.skillNodeId,
      task_instance_id: task.id,
      origin_task_id: task.id,
      current_task_id: task.id,
      originating_event_id: event.event_id,
      related_event_ids: [event.event_id],
      original_response: event.selected_answer,
      correct_answer: task.correctIndex,
      error_type: task.skillNodeId === 'L.T1.CORR.M04' ? 'paraphrase_miss' : 'negation_limitation_miss',
      cause_hypothesis: task.skillNodeId === 'L.T1.CORR.M04' ? 'Опора на формулировку вместо смыслового эквивалента.' : 'Пропущено отрицание, ограничение или коррекция.',
      cause_confidence: 'high',
      assistance_event_ids: [],
      repair_attempt_ids: [],
      transfer_event_ids: [],
      review_status: 'NOT_DUE',
      next_review_at: null,
      status: 'NEW',
      recurrence_count: 0,
      first_seen_at: iso(now),
      last_seen_at: iso(now),
      root_error_id: null,
      related_error_ids: []
    };
    rt.errors.push(error);
    return error;
  }

  function createReviewObligation(rt, error, transferEvent, now) {
    const existing = rt.reviews.find(function (r) {
      return r.linked_error_id === error.error_id && r.review_required && !['RESOLVED'].includes(r.review_state);
    });
    if (existing) return existing;
    const review = {
      review_id: nextId(rt, 'rev'),
      skill_node_id: error.skill_node_id,
      linked_error_id: error.error_id,
      review_required: true,
      review_reason: ['POST_REPAIR_CONFIRMATION'],
      primary_review_reason: 'POST_REPAIR_CONFIRMATION',
      review_state: 'SCHEDULED',
      review_level: 0,
      policy_version: POLICY.review,
      basis_event_ids: [transferEvent.event_id],
      computed_at: iso(now),
      next_review_at: addDays(transferEvent.completed_at, 1),
      last_review_result: null,
      blocked_no_valid_item: false
    };
    rt.reviews.push(review);
    error.review_status = 'SCHEDULED';
    error.next_review_at = review.next_review_at;
    error.status = 'REVIEW_SCHEDULED';
    return review;
  }

  function refreshReviewStates(rt, now) {
    const nowMs = new Date(now == null ? Date.now() : now).getTime();
    rt.reviews.forEach(function (r) {
      if (!r.review_required || !r.next_review_at) return;
      const dueMs = new Date(r.next_review_at).getTime();
      if (nowMs >= dueMs + 3 * 86400000) r.review_state = 'OVERDUE';
      else if (nowMs >= dueMs) r.review_state = 'DUE';
      else r.review_state = 'SCHEDULED';
      const skill = rt.skillStates[r.skill_node_id];
      if (skill) skill.review_state = r.review_state;
    });
  }

  function taskUsedInOccasion(rt, taskId) {
    if (!rt.session) return false;
    return rt.evidenceEvents.some(function (e) {
      return e.learning_occasion_id === rt.session.learningOccasionId && e.task_instance_id === taskId;
    });
  }

  function unusedTasks(rt, skillId) {
    const used = new Set(rt.evidenceEvents.map(function (e) { return e.task_instance_id; }));
    return CONTENT.filter(function (t) { return t.skillNodeId === skillId && !used.has(t.id); });
  }

  function chooseUnusedTask(rt, skillId) {
    return unusedTasks(rt, skillId)[0] || null;
  }

  function chooseTransferTask(rt, error) {
    const source = getTask(error.origin_task_id);
    const used = new Set(rt.evidenceEvents.map(function (e) { return e.task_instance_id; }));
    return CONTENT.filter(function (t) {
      return t.skillNodeId === error.skill_node_id && !used.has(t.id) && isTransferSafe(source, t);
    })[0] || null;
  }

  function actionReason(actionType, state) {
    if (actionType === 'RECOVERY_REPAIR') return 'ACTIVE_ERROR_REPAIR';
    if (actionType === 'TRANSFER_CHECK') return 'TRANSFER_PENDING';
    if (actionType === 'OVERDUE_REVIEW') return 'OVERDUE_REVIEW';
    if (actionType === 'DUE_REVIEW') return 'DUE_REVIEW';
    if (actionType === 'WEAK_SKILL_BUILD') return 'WEAK_SKILL';
    if (actionType === 'DEVELOPING_SKILL_BUILD') return 'DEVELOPING_SKILL';
    if (actionType === 'ASSISTANCE_DEPENDENCY_RECHECK') return 'ASSISTANCE_DEPENDENCY';
    if (actionType === 'EVIDENCE_GAP_PROBE') return 'INSUFFICIENT_EVIDENCE';
    if (actionType === 'STALE_MAINTENANCE') return 'STALE_EVIDENCE';
    return state || 'INSUFFICIENT_EVIDENCE';
  }

  function candidatePriority(type) {
    if (type === 'RECOVERY_REPAIR') return 0;
    if (type === 'OVERDUE_REVIEW' || type === 'DUE_REVIEW') return 1;
    if (type === 'TRANSFER_CHECK' || type === 'ASSISTANCE_DEPENDENCY_RECHECK') return 2;
    if (type === 'WEAK_SKILL_BUILD' || type === 'DEVELOPING_SKILL_BUILD') return 3;
    if (type === 'EVIDENCE_GAP_PROBE') return 4;
    return 5;
  }

  function generateCandidates(rt, now) {
    refreshReviewStates(rt, now);
    const candidates = [];

    rt.errors.forEach(function (err) {
      if (['NEW', 'EXPLAINED', 'SELF_REPAIR_PENDING', 'RETURNED'].includes(err.status)) {
        const task = getTask(err.current_task_id || err.origin_task_id);
        if (task) {
          candidates.push({
            candidate_action_id: 'cand-repair-' + err.error_id,
            action_type: 'RECOVERY_REPAIR',
            error_id: err.error_id,
            skill_node_id: err.skill_node_id,
            task_id: task.id,
            module: 'LESEN',
            minutes: 3,
            priority_class: 0,
            primary_reason_code: actionReason('RECOVERY_REPAIR'),
            counts_toward_review_cap: false,
            blocked: false
          });
        }
      } else if (err.status === 'TRANSFER_PENDING' || err.status === 'SELF_REPAIRED') {
        const transfer = chooseTransferTask(rt, err);
        candidates.push({
          candidate_action_id: 'cand-transfer-' + err.error_id,
          action_type: 'TRANSFER_CHECK',
          error_id: err.error_id,
          skill_node_id: err.skill_node_id,
          task_id: transfer ? transfer.id : null,
          module: 'LESEN',
          minutes: 5,
          priority_class: 2,
          primary_reason_code: actionReason('TRANSFER_CHECK'),
          counts_toward_review_cap: false,
          blocked: !transfer,
          block_reason: transfer ? null : 'BLOCKED_NO_VALID_CONTENT'
        });
      }
    });

    rt.reviews.forEach(function (review) {
      if (!review.review_required || !['DUE', 'OVERDUE'].includes(review.review_state)) return;
      const task = chooseUnusedTask(rt, review.skill_node_id);
      candidates.push({
        candidate_action_id: 'cand-review-' + review.review_id,
        action_type: review.review_state === 'OVERDUE' ? 'OVERDUE_REVIEW' : 'DUE_REVIEW',
        review_id: review.review_id,
        skill_node_id: review.skill_node_id,
        task_id: task ? task.id : null,
        module: 'LESEN',
        minutes: 5,
        priority_class: 1,
        primary_reason_code: review.review_state === 'OVERDUE' ? 'OVERDUE_REVIEW' : 'DUE_REVIEW',
        counts_toward_review_cap: true,
        blocked: !task,
        block_reason: task ? null : 'BLOCKED_NO_VALID_CONTENT',
        overdue_by_ms: review.review_state === 'OVERDUE' ? Math.max(0, new Date(now).getTime() - new Date(review.next_review_at).getTime()) : 0
      });
    });

    Object.keys(SKILLS).sort().forEach(function (skillId) {
      const state = rt.skillStates[skillId] || deriveSkillState(rt.evidenceEvents, skillId, null, now);
      let type = 'EVIDENCE_GAP_PROBE';
      if (state.mastery_state === 'M1') type = 'WEAK_SKILL_BUILD';
      else if (state.mastery_state === 'M2') type = 'DEVELOPING_SKILL_BUILD';
      else if (['M3', 'M4'].includes(state.mastery_state)) type = 'STALE_MAINTENANCE';

      unusedTasks(rt, skillId).forEach(function (task, sequenceIndex) {
        candidates.push({
          candidate_action_id: 'cand-skill-' + skillId + '-' + task.id,
          action_type: type,
          skill_node_id: skillId,
          task_id: task.id,
          module: 'LESEN',
          minutes: task.minutes,
          priority_class: candidatePriority(type),
          sequence_rank: sequenceIndex,
          primary_reason_code: actionReason(type),
          counts_toward_review_cap: type === 'STALE_MAINTENANCE',
          blocked: false
        });
      });
    });

    return candidates;
  }

  function buildPlan(rt, duration, now) {
    duration = Number(duration || 25);
    const budgets = { 10: 9, 25: 22, 45: 41 };
    const instructionalBudget = budgets[duration] || 22;
    const reviewCap = duration === 10 ? 1 : duration === 45 ? 3 : 2;
    const candidates = generateCandidates(rt, now);

    candidates.sort(function (a, b) {
      if (a.blocked !== b.blocked) return a.blocked ? 1 : -1;
      if (a.priority_class !== b.priority_class) return a.priority_class - b.priority_class;
      const ao = Number(a.overdue_by_ms || 0), bo = Number(b.overdue_by_ms || 0);
      if (ao !== bo) return bo - ao;
      const as = Number(a.sequence_rank == null ? -1 : a.sequence_rank);
      const bs = Number(b.sequence_rank == null ? -1 : b.sequence_rank);
      if (as !== bs) return as - bs;
      const ar = rt.errors.find(function (e) { return e.error_id === a.error_id; });
      const br = rt.errors.find(function (e) { return e.error_id === b.error_id; });
      const arec = ar ? Number(ar.recurrence_count || 0) : 0;
      const brec = br ? Number(br.recurrence_count || 0) : 0;
      if (arec !== brec) return brec - arec;
      if (a.skill_node_id !== b.skill_node_id) return String(a.skill_node_id).localeCompare(String(b.skill_node_id));
      return String(a.candidate_action_id).localeCompare(String(b.candidate_action_id));
    });

    const selected = [];
    const deferred = [];
    let minutes = 0;
    let reviews = 0;
    const skillMinutes = {};

    candidates.forEach(function (c) {
      if (c.blocked) {
        deferred.push({ candidate_action_id: c.candidate_action_id, reason: c.block_reason || 'BLOCKED_NO_VALID_CONTENT' });
        return;
      }
      if (selected.some(function (a) { return a.task_id === c.task_id && a.action_type !== 'RECOVERY_REPAIR'; })) {
        deferred.push({ candidate_action_id: c.candidate_action_id, reason: 'ALREADY_COVERED_THIS_PLAN' });
        return;
      }
      if (minutes + c.minutes > instructionalBudget) {
        deferred.push({ candidate_action_id: c.candidate_action_id, reason: 'ACTION_EXCEEDS_TIME_BUDGET' });
        return;
      }
      if (c.counts_toward_review_cap && reviews >= reviewCap) {
        deferred.push({ candidate_action_id: c.candidate_action_id, reason: 'REVIEW_QUEUE_CAP' });
        return;
      }
      const projectedSkill = Number(skillMinutes[c.skill_node_id] || 0) + c.minutes;
      const cap = instructionalBudget * 0.5;
      const critical = c.action_type === 'RECOVERY_REPAIR';
      if (!critical && projectedSkill > cap) {
        deferred.push({ candidate_action_id: c.candidate_action_id, reason: 'SAME_SKILL_CAP' });
        return;
      }
      selected.push(clone(c));
      minutes += c.minutes;
      skillMinutes[c.skill_node_id] = projectedSkill;
      if (c.counts_toward_review_cap) reviews += 1;
    });

    const plan = {
      plan_id: nextId(rt, 'plan'),
      planner_policy_version: POLICY.planner,
      generated_at: iso(now),
      requested_duration: duration,
      instructional_budget_min: instructionalBudget,
      selected_actions: selected,
      deferred_actions: deferred,
      estimated_total_work_min: minutes,
      reserved_wrap_min: duration - instructionalBudget,
      active_modules: clone(rt.activeModules)
    };

    rt.currentPlan = plan;
    rt.plannerDecisions.push({
      decision_id: nextId(rt, 'decision'),
      plan_id: plan.plan_id,
      generated_at: plan.generated_at,
      selected: selected.map(function (a, index) {
        return {
          action_id: a.candidate_action_id,
          position: index + 1,
          reason_code: a.primary_reason_code,
          reason_text: REASON_LABELS[a.primary_reason_code],
          frozen_signals: {
            skill_node_id: a.skill_node_id,
            action_type: a.action_type
          }
        };
      }),
      deferred: clone(deferred)
    });
    return plan;
  }

  function computeReadiness(rt, now) {
    const lesenEvents = rt.evidenceEvents.filter(function (e) { return e.module === 'Lesen' && e.data_quality === 'valid'; });
    const t1Distinct = distinctByTask(lesenEvents.filter(function (e) { return e.teil_or_aufgabe === 'T1'; }));
    const t1Independent = t1Distinct.filter(function (e) { return ['P3', 'P4', 'P5'].includes(e.evidence_class); });
    const observedSkills = new Set(lesenEvents.map(function (e) { return e.skill_node_id; }));
    const t1MicroCoverage = observedSkills.size;
    const t1CoverageText = t1Distinct.length
      ? 'Есть данные по Teil 1, но этот Teil покрыт только частично; Teil 2–5 не проверены.'
      : 'Teil 1–5 ещё не имеют достаточного evidence.';

    const lesen = {
      module: 'Lesen',
      readiness_state: 'R0',
      user_label: 'Недостаточно данных',
      confidence_level: 'C0',
      confidence_label: 'Надёжность данных: низкая',
      coverage: 'Полностью подтверждено Teil: 0 из 5',
      reason: t1CoverageText,
      next_step: t1Independent.length < 2
        ? 'Продолжить самостоятельные задания Lesen Teil 1 на новом материале.'
        : 'Расширить coverage Lesen на другие Micro-skills и Teil.',
      confirmed: t1Independent.length ? ['Есть самостоятельные попытки в Lesen Teil 1.'] : [],
      missing: [
        'Teil 2–5 ещё не проверены.',
        'Для Teil 1 нужен более широкий набор Micro-skills.',
        'Нет полного exam-like покрытия модуля.'
      ],
      influenced_by: [
        'EvidenceEvents: ' + lesenEvents.length,
        'Micro-skills с данными в Teil 1: ' + t1MicroCoverage + ' из 6'
      ],
      policy_version: POLICY.readiness
    };

    function systemGapModule(name, partsLabel) {
      return {
        module: name,
        readiness_state: 'R0',
        user_label: 'Недостаточно данных',
        confidence_level: 'C0',
        confidence_label: 'Надёжность данных: низкая',
        coverage: 'Проверено: 0 из ' + partsLabel,
        reason: 'В этом первом vertical slice evidence для этого модуля пока не собирается. Это ограничение Preview, не оценка вашего уровня.',
        next_step: 'Модуль будет подключён следующим vertical slice без изменения Foundation.',
        confirmed: [],
        missing: ['SYSTEM_DATA_GAP: runtime-сбор evidence для модуля ещё не реализован в B1-I01.'],
        influenced_by: [],
        policy_version: POLICY.readiness
      };
    }

    const snapshot = {
      readiness_snapshot_id: 'readiness-' + iso(now).replace(/[^0-9]/g, '').slice(0, 14),
      policy_version: POLICY.readiness,
      computed_at: iso(now),
      modules: [
        lesen,
        systemGapModule('Hören', '4 Teil'),
        systemGapModule('Schreiben', '3 Aufgaben'),
        systemGapModule('Sprechen', '3 Aufgaben')
      ]
    };
    rt.readiness = snapshot;
    return snapshot;
  }

  function masteryLabel(state) {
    return {
      M0: 'Недостаточно данных',
      M1: 'Нужно усилить',
      M2: 'Навык развивается',
      M3: 'Подтверждено на новом контексте',
      M4: 'Стабильно подтверждено',
      M5: 'Результат нестабилен',
      M6: 'Навык вернулся в работу'
    }[state] || 'Недостаточно данных';
  }

  function boot(root) {
    if (typeof S === 'undefined' || typeof R === 'undefined' || typeof go !== 'function') return;

    function ensure() {
      if (!S.i01 || S.i01.version !== 1) S.i01 = freshRuntime();
      const rt = S.i01;
      if (!rt.skillStates) rt.skillStates = {};
      if (!rt.ui) rt.ui = freshRuntime().ui;
      recomputeAllSkillStates(rt);
      refreshReviewStates(rt, Date.now());
      computeReadiness(rt, Date.now());
      persist();
      return rt;
    }

    function rt() { return ensure(); }
    function e(x) { return typeof esc === 'function' ? esc(x) : String(x); }
    function findError(id) { return rt().errors.find(function (x) { return x.error_id === id; }) || null; }
    function currentAction() {
      const state = rt();
      if (!state.session || !state.session.remainingActions || !state.session.remainingActions.length) return null;
      return state.session.remainingActions[0];
    }

    function reasonCard(action) {
      const reason = action ? REASON_LABELS[action.primary_reason_code] || 'Это действие выбрано по текущим evidence.' : '';
      return '<div class="card i01-reason"><b>Почему сейчас</b><p class="sub">' + e(reason) + '</p>' +
        '<button class="i01-link" onclick="i01OpenAudit(\'' + e(action ? action.candidate_action_id : '') + '\')">Почему OTTO так решил?</button></div>';
    }

    function style() {
      if (document.getElementById('i01-style')) return;
      const s = document.createElement('style');
      s.id = 'i01-style';
      s.textContent = [
        '.i01-kicker{font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:.09em;color:#8b6a52}',
        '.i01-plan{display:grid;gap:9px;margin:13px 0}',
        '.i01-step{border:1px solid #e8e0d8;border-radius:16px;padding:12px;background:#fff}',
        '.i01-step b{display:block;margin-bottom:4px}',
        '.i01-step small{color:var(--muted);line-height:1.35;display:block}',
        '.i01-reason{border-left:4px solid #8b6a52}',
        '.i01-link{border:0;background:transparent;padding:0;color:#6b4f3c;text-decoration:underline;font-weight:800;cursor:pointer}',
        '.i01-text{font-size:15px;line-height:1.6;background:#f7f1eb;border-radius:16px;padding:15px;margin:12px 0}',
        '.i01-statement{font-size:17px;line-height:1.45;margin:16px 0;font-weight:800}',
        '.i01-meta{display:flex;gap:6px;flex-wrap:wrap;margin:10px 0}',
        '.i01-meta span{background:#f3eee7;border-radius:999px;padding:6px 9px;font-size:11px;font-weight:750}',
        '.i01-help{background:#fff8ea;border:1px solid #ead7b7;border-radius:14px;padding:12px;margin:10px 0;font-size:13px;line-height:1.45}',
        '.i01-cardgrid{display:grid;gap:10px}',
        '.i01-readiness{border:1px solid #e8e0d8;border-radius:18px;padding:14px;background:#fff}',
        '.i01-readiness h3{margin:0 0 6px;font-size:18px}',
        '.i01-readiness .state{font-weight:900;margin-bottom:6px}',
        '.i01-readiness .coverage{font-size:12px;color:#6f6259;margin:7px 0}',
        '.i01-audit{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px;line-height:1.5;white-space:pre-wrap;background:#f7f1eb;padding:12px;border-radius:14px}',
        '.i01-summaryline{display:flex;justify-content:space-between;gap:12px;padding:9px 0;border-bottom:1px solid #eee8e1}',
        '.i01-summaryline:last-child{border-bottom:0}',
        '.i01-badge{display:inline-block;padding:6px 9px;border-radius:999px;background:#eef2e9;font-size:11px;font-weight:850}',
        '.i01-danger{background:#f8e9e5}',
        '.i01-neutral{background:#f3eee7}'
      ].join('');
      document.head.appendChild(s);
    }

    function registerScreens() {
      [
        ['my-prep', 'Моя подготовка'],
        ['prep-task', 'Задание · Моя подготовка'],
        ['prep-repair', 'Исправление ошибки'],
        ['prep-summary', 'Итог занятия'],
        ['prep-audit', 'Почему OTTO так решил?']
      ].forEach(function (pair) {
        TITLES[pair[0]] = pair[1];
        if (!SCREENS.some(function (x) { return x[0] === pair[0]; })) SCREENS.push(pair);
      });
      by('mapItems').innerHTML = SCREENS.map(function (x, i) {
        return '<button onclick="toggleMap();go(\'' + x[0] + '\')">' + (i + 1) + '. ' + x[1] + '</button>';
      }).join('');
    }

    root.i01Reset = function () {
      if (!confirm('Сбросить данные vertical slice на этом устройстве?')) return;
      S.i01 = freshRuntime();
      persist();
      go('home');
    };

    root.i01SetDuration = function (minutes) {
      const state = rt();
      state.selectedDuration = Number(minutes);
      persist();
      render();
    };

    root.i01Start = function () {
      const state = rt();
      if (state.session && !state.session.finishedAt && state.session.remainingActions && state.session.remainingActions.length) {
        go('my-prep');
        return;
      }
      const now = Date.now();
      recomputeAllSkillStates(state, now);
      const plan = buildPlan(state, state.selectedDuration || 25, now);
      state.session = {
        sessionId: nextId(state, 'session'),
        learningOccasionId: nextId(state, 'occasion'),
        startedAt: iso(now),
        finishedAt: null,
        requestedDuration: state.selectedDuration || 25,
        minutesUsed: 0,
        completedActions: [],
        remainingActions: clone(plan.selected_actions),
        planId: plan.plan_id,
        planRevision: 1,
        revisionReason: 'SESSION_START'
      };
      state.planRevisions.push({
        revision: 1,
        reason: 'SESSION_START',
        at: iso(now),
        plan_id: plan.plan_id,
        selected_action_ids: plan.selected_actions.map(function (a) { return a.candidate_action_id; })
      });
      persist();
      go('my-prep');
    };

    root.i01Replan = function (reason) {
      const state = rt();
      if (!state.session || state.session.finishedAt) return null;
      recomputeAllSkillStates(state, Date.now());
      computeReadiness(state, Date.now());
      const plan = buildPlan(state, state.session.requestedDuration || 25, Date.now());
      const completedTaskIds = new Set(state.session.completedActions.map(function (a) { return a.task_id; }));
      let remainingBudget = Math.max(0, (state.session.requestedDuration === 10 ? 9 : state.session.requestedDuration === 45 ? 41 : 22) - Number(state.session.minutesUsed || 0));
      const remaining = [];
      plan.selected_actions.forEach(function (a) {
        if (completedTaskIds.has(a.task_id) && a.action_type !== 'RECOVERY_REPAIR') return;
        if (a.minutes > remainingBudget) return;
        if (remaining.some(function (x) { return x.task_id === a.task_id && x.action_type !== 'RECOVERY_REPAIR'; })) return;
        remaining.push(a);
        remainingBudget -= a.minutes;
      });
      state.session.planRevision += 1;
      state.session.planId = plan.plan_id;
      state.session.remainingActions = remaining;
      state.session.revisionReason = reason;
      state.planRevisions.push({
        revision: state.session.planRevision,
        reason: reason,
        at: iso(),
        plan_id: plan.plan_id,
        selected_action_ids: remaining.map(function (a) { return a.candidate_action_id; })
      });
      persist();
      return remaining;
    };

    root.i01SelectAnswer = function (index) {
      const state = rt();
      state.ui.selectedAnswer = Number(index);
      persist();
      render();
    };

    root.i01UseHint = function (level) {
      const state = rt();
      const action = currentAction();
      if (!action) return;
      const task = getTask(action.task_id);
      const event = {
        assistance_event_id: nextId(state, 'assist'),
        event_id: null,
        task_instance_id: task ? task.id : null,
        level: level || 'strategy',
        offered_at: iso(),
        consumed_at: iso(),
        content_type: level === 'strategy' ? 'strategy' : 'evidence_hint',
        automatic_or_requested: 'requested',
        source: 'OTTO',
        affected_skill_node_id: action.skill_node_id
      };
      state.assistanceEvents.push(event);
      state.ui.hintLevel = level || 'strategy';
      state.ui.message = (level === 'strategy')
        ? 'Стратегия: сначала сравни смысл утверждения со всем сообщением, потом выбирай Richtig/Falsch.'
        : task.hint;
      persist();
      render();
    };

    function assistanceForCurrentTask(state, task) {
      return state.assistanceEvents.filter(function (a) {
        return a.affected_skill_node_id === task.skillNodeId &&
          state.session && new Date(a.consumed_at).getTime() >= new Date(state.session.startedAt).getTime();
      }).filter(function (a) {
        return a._task_id ? a._task_id === task.id : true;
      });
    }

    function currentMaxAssistance(state) {
      return state.ui.hintLevel || 'none';
    }

    function clearTaskUI(state) {
      state.ui.selectedAnswer = null;
      state.ui.hintLevel = 'none';
      state.ui.message = '';
      state.ui.currentTaskStartedAt = null;
    }

    function markActionCompleted(state, action, outcome) {
      if (!state.session || !action) return;
      state.session.completedActions.push({
        action_id: action.candidate_action_id,
        action_type: action.action_type,
        task_id: action.task_id,
        skill_node_id: action.skill_node_id,
        reason_code: action.primary_reason_code,
        outcome: outcome,
        completed_at: iso()
      });
      state.session.minutesUsed += Number(action.minutes || 0);
      state.session.remainingActions = state.session.remainingActions.filter(function (a) {
        return a.candidate_action_id !== action.candidate_action_id;
      });
    }

    root.i01SubmitTask = function () {
      const state = rt();
      const action = currentAction();
      if (!action) return;
      const task = getTask(action.task_id);
      if (!task) return;
      if (state.ui.selectedAnswer == null) return alert('Выбери Richtig или Falsch.');

      const ok = state.ui.selectedAnswer === task.correctIndex;
      const maxHelp = currentMaxAssistance(state);
      const linkedError = action.error_id ? findError(action.error_id) : null;
      const stage = action.action_type === 'TRANSFER_CHECK' ? 'transfer' :
        (action.action_type === 'DUE_REVIEW' || action.action_type === 'OVERDUE_REVIEW') ? 'independent' : 'independent';

      const priorExact = state.evidenceEvents.filter(function (e) { return e.task_instance_id === task.id; }).length;
      const priorFamily = state.evidenceEvents.filter(function (e) { return e.task_family_id === task.taskFamilyId; }).length;
      const started = state.ui.currentTaskStartedAt || iso();
      const event = makeEvidenceEvent(state, task, {
        stage: stage,
        attemptNumber: priorExact + 1,
        priorExactExposure: priorExact,
        priorFamilyExposure: priorFamily,
        startedAt: started,
        completedAt: Date.now(),
        responseTimeMs: Math.max(0, Date.now() - new Date(started).getTime()),
        maxAssistanceConsumed: maxHelp,
        assistanceEvents: state.assistanceEvents.filter(function (a) {
          return a.affected_skill_node_id === task.skillNodeId && a.task_instance_id === task.id;
        }),
        selectedAnswer: state.ui.selectedAnswer,
        outcomeStatus: ok ? 'success' : 'failure',
        linkedErrorId: linkedError ? linkedError.error_id : null,
        transferOfErrorId: action.action_type === 'TRANSFER_CHECK' && linkedError ? linkedError.error_id : null,
        delayedReviewOfErrorId: action.review_id ? ((state.reviews.find(function (r) { return r.review_id === action.review_id; }) || {}).linked_error_id || null) : null
      });

      if (!ok) {
        let error = linkedError;
        if (!error) error = createErrorObject(state, task, event, Date.now());
        else {
          error.related_event_ids.push(event.event_id);
          error.current_task_id = task.id;
          error.last_seen_at = iso();
          if (stage === 'transfer') error.transfer_event_ids.push(event.event_id);
        }
        error.status = 'EXPLAINED';
        state.ui.currentErrorId = error.error_id;
        state.ui.message = '';
        markActionCompleted(state, action, 'failure');
        recomputeAllSkillStates(state, Date.now());
        root.i01Replan(stage === 'transfer' ? 'TRANSFER_FAILURE' : 'NEW_ERROR');
        persist();
        go('prep-repair');
        return;
      }

      if (stage === 'transfer' && linkedError && maxHelp === 'none' && event.evidence_class === 'P4') {
        linkedError.transfer_event_ids.push(event.event_id);
        linkedError.status = 'PROVISIONALLY_RESOLVED';
        createReviewObligation(state, linkedError, event, Date.now());
      }

      if (action.review_id && ok && maxHelp === 'none') {
        const review = state.reviews.find(function (r) { return r.review_id === action.review_id; });
        if (review) {
          review.last_review_result = 'success';
          review.review_level = Math.min(5, Number(review.review_level || 0) + 1);
          const intervals = [1, 3, 7, 14, 30, 30];
          review.next_review_at = addDays(event.completed_at, intervals[review.review_level]);
          review.review_state = 'SCHEDULED';
          const err = findError(review.linked_error_id);
          if (err) err.status = 'RESOLVED';
        }
      }

      markActionCompleted(state, action, ok ? 'success' : 'failure');
      recomputeAllSkillStates(state, Date.now());
      computeReadiness(state, Date.now());
      clearTaskUI(state);
      root.i01Replan('NEW_EVIDENCE');
      persist();

      if (!state.session.remainingActions.length || state.session.minutesUsed >= 18) {
        root.i01FinishSession();
      } else {
        go('prep-task');
      }
    };

    root.i01SubmitRepair = function () {
      const state = rt();
      const error = findError(state.ui.currentErrorId);
      if (!error) return go('my-prep');
      const task = getTask(error.current_task_id || error.origin_task_id);
      if (state.ui.selectedAnswer == null) return alert('Выбери исправленный ответ.');

      const ok = state.ui.selectedAnswer === task.correctIndex;
      const help = currentMaxAssistance(state);
      const priorExact = state.evidenceEvents.filter(function (e) { return e.task_instance_id === task.id; }).length;
      const started = state.ui.currentTaskStartedAt || iso();

      const event = makeEvidenceEvent(state, task, {
        stage: 'repair',
        attemptNumber: priorExact + 1,
        priorExactExposure: priorExact,
        priorFamilyExposure: state.evidenceEvents.filter(function (e) { return e.task_family_id === task.taskFamilyId; }).length,
        startedAt: started,
        completedAt: Date.now(),
        responseTimeMs: Math.max(0, Date.now() - new Date(started).getTime()),
        maxAssistanceConsumed: help,
        selectedAnswer: state.ui.selectedAnswer,
        outcomeStatus: ok ? 'success' : 'failure',
        linkedErrorId: error.error_id,
        selfCorrectionAttempted: true,
        selfCorrectionSuccess: ok ? 'yes' : 'no'
      });

      const repairId = nextId(state, 'repair');
      error.repair_attempt_ids.push(repairId);
      error.related_event_ids.push(event.event_id);

      if (ok) {
        error.status = (help === 'none' || help === 'strategy') ? 'SELF_REPAIRED' : 'SELF_REPAIR_PENDING';
        error.current_task_id = task.id;
        clearTaskUI(state);
        error.status = 'TRANSFER_PENDING';
        recomputeAllSkillStates(state, Date.now());
        root.i01Replan(help === 'none' ? 'SELF_REPAIR_SUCCESS' : 'SUPPORTED_REPAIR_PROGRESS');
        persist();
        go('prep-task');
      } else {
        error.status = 'SELF_REPAIR_PENDING';
        state.ui.message = 'Пока не получилось. Можно попробовать ещё раз или взять подсказку.';
        clearTaskUI(state);
        state.ui.currentErrorId = error.error_id;
        persist();
        render();
      }
    };

    root.i01RevealRepairHint = function () {
      const state = rt();
      const error = findError(state.ui.currentErrorId);
      if (!error) return;
      const task = getTask(error.current_task_id || error.origin_task_id);
      const event = {
        assistance_event_id: nextId(state, 'assist'),
        event_id: null,
        task_instance_id: task.id,
        level: 'evidence_hint',
        offered_at: iso(),
        consumed_at: iso(),
        content_type: 'evidence_hint',
        automatic_or_requested: 'requested',
        source: 'OTTO',
        affected_skill_node_id: task.skillNodeId
      };
      state.assistanceEvents.push(event);
      error.assistance_event_ids.push(event.assistance_event_id);
      state.ui.hintLevel = 'evidence_hint';
      state.ui.message = task.hint;
      persist();
      render();
    };

    root.i01RevealAnswer = function () {
      const state = rt();
      const error = findError(state.ui.currentErrorId);
      if (!error) return;
      const task = getTask(error.current_task_id || error.origin_task_id);
      const event = {
        assistance_event_id: nextId(state, 'assist'),
        event_id: null,
        task_instance_id: task.id,
        level: 'full_model',
        offered_at: iso(),
        consumed_at: iso(),
        content_type: 'full_model',
        automatic_or_requested: 'requested',
        source: 'OTTO',
        affected_skill_node_id: task.skillNodeId
      };
      state.assistanceEvents.push(event);
      error.assistance_event_ids.push(event.assistance_event_id);
      state.ui.hintLevel = 'full_model';
      state.ui.message = task.explanation + ' Правильный ответ: ' + task.options[task.correctIndex] + '. После модели понадобится новый самостоятельный пример.';
      error.status = 'TRANSFER_PENDING';
      clearTaskUI(state);
      state.ui.hintLevel = 'full_model';
      state.ui.message = task.explanation + ' Правильный ответ: ' + task.options[task.correctIndex] + '. После модели понадобится новый самостоятельный пример.';
      root.i01Replan('MODEL_EXPOSED_NEEDS_TRANSFER');
      persist();
      render();
    };

    root.i01OpenAudit = function (actionId) {
      const state = rt();
      state.ui.auditActionId = actionId;
      persist();
      go('prep-audit');
    };

    root.i01FinishSession = function () {
      const state = rt();
      if (!state.session) return;
      state.session.finishedAt = iso();
      computeReadiness(state, Date.now());
      persist();
      go('prep-summary');
    };

    function planView() {
      const state = rt();
      const plan = state.currentPlan;
      const session = state.session;
      if (!session || !plan) {
        return '<span class="i01-kicker">Моя подготовка</span><h1 class="h1">Готово начать</h1>' +
          '<p class="sub">OTTO построит занятие из текущих evidence, ошибок и review-обязательств.</p>' +
          '<div class="row"><button class="btn secondary" onclick="i01SetDuration(10)">10 минут</button><button class="btn primary" onclick="i01SetDuration(25)">25 минут</button><button class="btn secondary" onclick="i01SetDuration(45)">45 минут</button></div>' +
          '<button class="btn primary" onclick="i01Start()">Построить план</button>';
      }

      const actions = session.remainingActions || [];
      let html = '<span class="i01-kicker">Моя подготовка</span><h1 class="h1">План на ' + session.requestedDuration + ' минут</h1>';
      html += '<p class="sub">План строится детерминированно из evidence, ошибок и review. После значимого события оставшаяся часть пересчитывается.</p>';
      html += '<div class="i01-plan">';
      actions.forEach(function (a, i) {
        const task = getTask(a.task_id);
        html += '<div class="i01-step"><b>' + (i + 1) + '. ' + e(getSkill(a.skill_node_id).label) + '</b>' +
          '<small>' + e(REASON_LABELS[a.primary_reason_code] || '') + '</small>' +
          '<small>' + e(a.action_type === 'RECOVERY_REPAIR' ? 'Исправление текущей ошибки' : task ? 'Lesen Teil 1 · новое задание' : a.action_type) + '</small></div>';
      });
      html += '</div>';
      if (!actions.length) {
        html += '<div class="notice">Сейчас нет валидного следующего задания в этом ограниченном slice. OTTO не подставляет дубликаты ради заполнения времени.</div>';
        html += '<button class="btn primary" onclick="i01FinishSession()">Завершить занятие</button>';
      } else {
        html += reasonCard(actions[0]);
        html += '<button class="btn primary" onclick="go(\'' + (actions[0].action_type === 'RECOVERY_REPAIR' ? 'prep-repair' : 'prep-task') + '\')">Начать мою подготовку</button>';
      }
      return html;
    }

    function taskView() {
      const state = rt();
      const action = currentAction();
      if (!action) {
        setTimeout(function () { root.i01FinishSession(); }, 0);
        return '<h1 class="h1">Собираем итог…</h1>';
      }
      if (action.action_type === 'RECOVERY_REPAIR') {
        setTimeout(function () { go('prep-repair'); }, 0);
        return '<h1 class="h1">Переходим к исправлению…</h1>';
      }
      const task = getTask(action.task_id);
      if (!task) {
        return '<span class="i01-kicker">Моя подготовка</span><h1 class="h1">Нет валидного задания</h1><div class="notice">OTTO не использует exact/near duplicate вместо нового evidence.</div><button class="btn primary" onclick="i01Replan(\'CONTENT_BLOCK\');go(\'my-prep\')">Перестроить план</button>';
      }
      if (!state.ui.currentTaskStartedAt) {
        state.ui.currentTaskStartedAt = iso();
        persist();
      }
      let html = '<span class="i01-kicker">Lesen · Teil 1</span><h1 class="h1">' + e(getSkill(task.skillNodeId).label) + '</h1>';
      html += reasonCard(action);
      html += '<div class="i01-text">' + e(task.text) + '</div>';
      html += '<div class="i01-statement">' + e(task.statement) + '</div>';
      html += '<div class="i01-meta"><span>Richtig / Falsch</span><span>' + e(action.action_type === 'TRANSFER_CHECK' ? 'Новый контекст · transfer' : 'Самостоятельная попытка') + '</span></div>';
      task.options.forEach(function (opt, i) {
        const sel = state.ui.selectedAnswer === i ? ' sel' : '';
        html += '<button class="option' + sel + '" onclick="i01SelectAnswer(' + i + ')">' + e(opt) + '</button>';
      });
      if (state.ui.message) html += '<div class="i01-help">' + e(state.ui.message) + '</div>';
      html += '<button class="btn primary" onclick="i01SubmitTask()">Ответить</button>';
      if (state.ui.hintLevel === 'none') {
        html += '<button class="btn secondary" onclick="i01UseHint(\'strategy\')">Совет Отто <small>· будет отмечен как помощь</small></button>';
      } else if (state.ui.hintLevel === 'strategy') {
        html += '<button class="btn ghost" onclick="i01UseHint(\'evidence_hint\')">Нужна более конкретная подсказка</button>';
      }
      return html;
    }

    function repairView() {
      const state = rt();
      let error = findError(state.ui.currentErrorId);
      if (!error) {
        const repairAction = currentAction();
        if (repairAction && repairAction.error_id) {
          error = findError(repairAction.error_id);
          state.ui.currentErrorId = error ? error.error_id : null;
        }
      }
      if (!error) return '<h1 class="h1">Активной ошибки нет</h1><button class="btn primary" onclick="go(\'my-prep\')">К плану</button>';
      const task = getTask(error.current_task_id || error.origin_task_id);
      error.status = 'SELF_REPAIR_PENDING';
      if (!state.ui.currentTaskStartedAt) state.ui.currentTaskStartedAt = iso();
      persist();

      let html = '<span class="i01-kicker">Error Repair Loop</span><h1 class="h1">Сначала попробуй исправить сам</h1>';
      html += '<div class="card bad"><b>Что произошло</b><p class="sub">' + e(error.cause_hypothesis) + '</p></div>';
      html += '<div class="notice">OTTO пока не показывает готовый ответ. Сравни смысл текста и утверждения ещё раз.</div>';
      html += '<div class="i01-text">' + e(task.text) + '</div><div class="i01-statement">' + e(task.statement) + '</div>';
      task.options.forEach(function (opt, i) {
        const sel = state.ui.selectedAnswer === i ? ' sel' : '';
        html += '<button class="option' + sel + '" onclick="i01SelectAnswer(' + i + ')">' + e(opt) + '</button>';
      });
      if (state.ui.message) html += '<div class="i01-help">' + e(state.ui.message) + '</div>';
      html += '<button class="btn primary" onclick="i01SubmitRepair()">Исправить самому</button>';
      if (state.ui.hintLevel === 'none') html += '<button class="btn secondary" onclick="i01RevealRepairHint()">Нужна подсказка</button>';
      if (state.ui.hintLevel !== 'full_model') html += '<button class="btn ghost" onclick="i01RevealAnswer()">Показать ответ и объяснение</button>';
      return html;
    }

    function summaryView() {
      const state = rt();
      const session = state.session;
      computeReadiness(state, Date.now());
      const completed = session ? session.completedActions : [];
      const independent = state.evidenceEvents.filter(function (ev) {
        return session && ev.session_id === session.sessionId && ev.independence === 'independent' && ev.outcome_status === 'success' && ev.evidence_role !== 'self_repair';
      }).length;
      const assisted = state.evidenceEvents.filter(function (ev) {
        return session && ev.session_id === session.sessionId && ev.outcome_status === 'success' && ev.independence !== 'independent';
      }).length;
      const reviews = state.reviews.filter(function (r) { return r.review_required; });
      let html = '<span class="i01-kicker">Итог занятия</span><h1 class="h1">Что реально произошло</h1>';
      html += '<div class="card"><div class="i01-summaryline"><b>Выполнено действий</b><span>' + completed.length + '</span></div>' +
        '<div class="i01-summaryline"><b>Сделано самостоятельно</b><span>' + independent + '</span></div>' +
        '<div class="i01-summaryline"><b>Получилось с подсказкой</b><span>' + assisted + '</span></div>' +
        '<div class="i01-summaryline"><b>Review-обязательств</b><span>' + reviews.length + '</span></div></div>';

      Object.keys(SKILLS).sort().forEach(function (skillId) {
        const st = state.skillStates[skillId];
        html += '<div class="card"><b>' + e(SKILLS[skillId].label) + '</b><p class="sub">' + e(masteryLabel(st ? st.mastery_state : 'M0')) + '</p></div>';
      });

      if (reviews.length) {
        html += '<div class="card ok"><b>Исправлено — проверим позже</b><p class="sub">После transfer создана отложенная независимая перепроверка. Ближайшая: ' + e(new Date(reviews[0].next_review_at).toLocaleString('ru-RU')) + '.</p></div>';
      }
      html += '<div class="card soft"><b>Readiness</b><p class="sub">Lesen: <b>Недостаточно данных</b>. Этот slice покрывает только часть Lesen Teil 1, поэтому OTTO не выдумывает процент готовности.</p></div>';
      html += '<button class="btn primary" onclick="go(\'readiness\')">Открыть готовность по модулям</button>';
      html += '<button class="btn secondary" onclick="go(\'home\')">На главную</button>';
      return html;
    }

    function auditView() {
      const state = rt();
      const actionId = state.ui.auditActionId;
      const allPlans = [state.currentPlan].filter(Boolean);
      const action = allPlans.reduce(function (found, p) {
        return found || (p.selected_actions || []).find(function (a) { return a.candidate_action_id === actionId; });
      }, null) || (state.session && state.session.remainingActions || []).find(function (a) { return a.candidate_action_id === actionId; });
      const decision = state.plannerDecisions.slice().reverse().find(function (d) {
        return d.selected.some(function (s) { return s.action_id === actionId; });
      });
      let html = '<span class="i01-kicker">Audit trail</span><h1 class="h1">Почему OTTO так считает?</h1>';
      if (!action || !decision) {
        html += '<div class="notice">Для этого действия audit-запись не найдена.</div>';
      } else {
        const selected = decision.selected.find(function (s) { return s.action_id === actionId; });
        html += '<div class="card"><b>Подтверждено</b><p class="sub">Действие выбрано текущей версией Planner V1 из сохранённого состояния пользователя.</p></div>';
        html += '<div class="card"><b>Почему сейчас</b><p class="sub">' + e(selected.reason_text) + '</p></div>';
        html += '<div class="card"><b>Что повлияло</b><p class="sub">Навык: ' + e(getSkill(action.skill_node_id).label) + '. Тип действия: ' + e(action.action_type) + '.</p></div>';
        html += '<div class="card"><b>Что дальше</b><p class="sub">После нового EvidenceEvent OTTO пересчитает Mastery и оставшуюся часть занятия.</p></div>';
        html += '<details><summary>Технический audit для QA</summary><pre class="i01-audit">' + e(JSON.stringify({ selected: selected, deferred: decision.deferred }, null, 2)) + '</pre></details>';
      }
      html += '<button class="btn primary" onclick="back()">Назад</button>';
      return html;
    }

    function readinessView() {
      const state = rt();
      const snapshot = computeReadiness(state, Date.now());
      let html = '<span class="i01-kicker">Готовность к модулю — оценка OTTO</span><h1 class="h1">Четыре модуля — четыре отдельные картины</h1>';
      html += '<p class="sub">Это внутренняя оценка OTTO, не официальный результат Goethe. Сильный модуль не компенсирует другой.</p><div class="i01-cardgrid">';
      snapshot.modules.forEach(function (m) {
        html += '<div class="i01-readiness"><h3>' + e(m.module) + '</h3><div class="state">' + e(m.user_label) + '</div>' +
          '<p class="sub">' + e(m.reason) + '</p><div class="coverage">' + e(m.coverage) + '</div>' +
          '<div class="i01-badge i01-neutral">' + e(m.confidence_label) + '</div>' +
          '<p class="sub"><b>Дальше:</b> ' + e(m.next_step) + '</p>' +
          '<details><summary>Почему OTTO так считает?</summary><p class="sub"><b>Подтверждено:</b> ' + e(m.confirmed.length ? m.confirmed.join(' ') : 'Пока нет достаточного подтверждения.') + '</p>' +
          '<p class="sub"><b>Пока не подтверждено:</b> ' + e(m.missing.join(' ')) + '</p>' +
          '<p class="sub"><b>Что повлияло:</b> ' + e(m.influenced_by.join(' ') || 'Недостаток данных в этом slice.') + '</p>' +
          '<p class="sub"><b>Что дальше:</b> ' + e(m.next_step) + '</p></details></div>';
      });
      html += '</div><button class="btn primary" onclick="go(\'home\')">На главную</button>';
      return html;
    }

    style();
    registerScreens();
    ensure();

    R.splash = function () {
      const state = rt();
      const hasSession = state.session && !state.session.finishedAt;
      return '<div class="hero center"><div class="otto"><img src="assets/otto.webp" alt="Отто"></div><h1>OTTO B1</h1><p>Персональная подготовка по evidence, ошибкам и повторным проверкам.</p>' +
        '<button class="btn ghost" onclick="i01Start()">' + (hasSession ? 'Продолжить мою подготовку' : 'Начать мою подготовку') + '</button></div>' +
        '<div class="card soft"><b>Первый implementation slice</b><p class="sub">Рабочий end-to-end цикл Lesen: evidence → mastery → repair → transfer → review → replanning → readiness.</p></div>';
    };

    R.home = function () {
      const state = rt();
      const sessionOpen = state.session && !state.session.finishedAt;
      return '<span class="eyebrow">' + e(S.name || 'OTTO B1') + '</span><h1 class="h1">Моя подготовка</h1>' +
        '<p class="sub">OTTO сам выбирает следующий полезный шаг из реальных evidence. Основной режим Preview — 25 минут.</p>' +
        '<div class="card soft"><b>Сегодня</b><p class="sub">' + (sessionOpen ? 'Занятие уже начато — можно продолжить.' : 'Новый план будет построен по текущим данным.') + '</p></div>' +
        '<button class="btn primary" onclick="i01Start()">' + (sessionOpen ? 'Продолжить мою подготовку' : 'Начать мою подготовку') + '</button>' +
        '<button class="btn secondary" onclick="go(\'time\')">Время: ' + state.selectedDuration + ' минут</button>' +
        '<button class="btn secondary" onclick="go(\'readiness\')">Готовность по модулям</button>' +
        '<button class="btn ghost" onclick="i01Reset()">Сбросить данные slice</button>';
    };

    R.time = function () {
      const state = rt();
      return '<span class="eyebrow">Время</span><h1 class="h1">Сколько времени есть?</h1><p class="sub">25 минут — полностью проверяемый режим B1-I01. 10/45 используют ту же архитектуру и честно завершаются раньше, если валидного контента недостаточно.</p>' +
        '<div class="grid">' + [10,25,45].map(function (n) {
          return '<button class="module" onclick="i01SetDuration(' + n + ')"><b>' + n + ' минут</b><small>' + (n === 25 ? 'основной Preview' : 'поддерживается ядром') + '</small></button>';
        }).join('') + '</div><button class="btn primary" onclick="go(\'home\')">Готово</button>';
    };

    R['my-prep'] = planView;
    R['prep-task'] = taskView;
    R['prep-repair'] = repairView;
    R['prep-summary'] = summaryView;
    R['prep-audit'] = auditView;
    R.readiness = readinessView;

    R.route = function () {
      const state = rt();
      const skillCards = Object.keys(SKILLS).sort().map(function (skillId) {
        const st = state.skillStates[skillId];
        return '<div class="card"><b>' + e(SKILLS[skillId].label) + '</b><p class="sub">' + e(masteryLabel(st ? st.mastery_state : 'M0')) + '</p></div>';
      }).join('');
      return '<span class="eyebrow">Маршрут</span><h1 class="h1">Что идёт следующим</h1>' + skillCards +
        '<button class="btn primary" onclick="i01Start()">Начать мою подготовку</button>';
    };

    R.errors = function () {
      const state = rt();
      const active = state.errors.slice().reverse();
      return '<span class="eyebrow">Память ошибок</span><h1 class="h1">Мои ошибки</h1>' +
        (active.length ? active.map(function (err) {
          return '<div class="card ' + (err.status === 'REVIEW_SCHEDULED' || err.status === 'RESOLVED' ? 'ok' : 'bad') + '"><b>' +
            e(getSkill(err.skill_node_id).label) + '</b><p class="sub">' + e(err.cause_hypothesis) + '</p><span class="i01-badge">' +
            e(err.status === 'REVIEW_SCHEDULED' ? 'Исправлено — проверим позже' : err.status === 'RESOLVED' ? 'Подтверждено повторно' : 'Нужно ещё закрепить') +
            '</span></div>';
        }).join('') : '<div class="card soft"><b>Пока пусто</b><p class="sub">Ошибки появятся после реальных попыток.</p></div>') +
        '<button class="btn primary" onclick="i01Start()">К моей подготовке</button>';
    };

    R.progress = function () {
      const state = rt();
      return '<span class="eyebrow">Прогресс</span><h1 class="h1">Доказательства, а не XP</h1>' +
        Object.keys(SKILLS).sort().map(function (skillId) {
          const events = state.evidenceEvents.filter(function (x) { return x.skill_node_id === skillId; });
          const st = state.skillStates[skillId];
          return '<div class="card"><b>' + e(SKILLS[skillId].label) + '</b><p class="sub">' +
            e(masteryLabel(st ? st.mastery_state : 'M0')) + ' · evidence: ' + events.length + '</p></div>';
        }).join('') +
        '<button class="btn primary" onclick="go(\'readiness\')">Готовность по модулям</button>';
    };

    render();
  }

  return {
    POLICY: POLICY,
    SKILLS: SKILLS,
    CONTENT: CONTENT,
    REASON_LABELS: REASON_LABELS,
    freshRuntime: freshRuntime,
    isTransferSafe: isTransferSafe,
    classifyEvidence: classifyEvidence,
    makeEvidenceEvent: makeEvidenceEvent,
    deriveSkillState: deriveSkillState,
    recomputeAllSkillStates: recomputeAllSkillStates,
    createErrorObject: createErrorObject,
    createReviewObligation: createReviewObligation,
    refreshReviewStates: refreshReviewStates,
    generateCandidates: generateCandidates,
    buildPlan: buildPlan,
    computeReadiness: computeReadiness,
    masteryLabel: masteryLabel,
    boot: boot
  };
});
