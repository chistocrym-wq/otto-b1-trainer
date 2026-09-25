(function(root,factory){
  const bank=(typeof module==='object'&&module.exports)?require('./diagnostic-bank.js'):root.OTTO_DIAGNOSTIC_BANK;
  const api=factory(bank);
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.OTTO_DIAGNOSTIC_ENGINE=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(BANK){
  'use strict';
  const BANDS=BANK.bands.slice();
  const ITEM_BY_ID=Object.fromEntries(BANK.items.map(i=>[i.item_id,i]));

  function clone(x){return JSON.parse(JSON.stringify(x));}
  function now(){return new Date().toISOString();}
  function createSession(){
    return {
      diagnostic_version:BANK.version,
      phase:'screening_core',
      queue:BANK.screeningSeed.slice(),
      cursor:0,
      answers:[],
      screeningPath:null,
      boundary:null,
      boundaryRounds:0,
      extraTriggered:false,
      closedDecision:null,
      writing:null,
      speaking:[],
      productiveReviews:[],
      completed:false,
      startedAt:now(),
      updatedAt:now()
    };
  }
  function answeredIds(s){return new Set(s.answers.map(a=>a.item_id));}
  function nextItem(s){
    ensureQueue(s);
    if(s.phase==='closed_complete'||s.phase==='writing'||s.phase==='speaking'||s.phase==='complete')return null;
    return ITEM_BY_ID[s.queue[s.cursor]]||null;
  }
  function submitClosed(s,itemId,selectedIndex,meta={}){
    const item=ITEM_BY_ID[itemId];
    if(!item)throw new Error('Unknown diagnostic item '+itemId);
    if(s.queue[s.cursor]!==itemId)throw new Error('Unexpected item order: expected '+s.queue[s.cursor]+' got '+itemId);
    const correct=selectedIndex===item.correct_answer;
    s.answers.push({
      item_id:itemId,
      target_band:item.target_band,
      cefr_level:item.cefr_level,
      skill:item.skill,
      micro_skill:item.micro_skill,
      modality:item.modality,
      correct,
      selectedIndex,
      phase:s.phase,
      boundary_round:s.boundaryRounds,
      duration_ms:meta.duration_ms||null,
      audio_plays:meta.audio_plays||0,
      answeredAt:now()
    });
    s.cursor+=1;s.updatedAt=now();
    ensureQueue(s);
    return {correct,item:clone(item),state:s};
  }
  function ensureQueue(s){
    if(s.cursor<s.queue.length)return;
    if(s.phase==='screening_core'){
      const core=s.answers.filter(a=>a.phase==='screening_core');
      const n=core.filter(a=>a.correct).length;
      const path=n<=1?'low':n===core.length?'high':'middle';
      s.screeningPath=path;
      s.phase='screening_path';
      s.queue=BANK.pathSeeds[path].slice();
      s.cursor=0;
      return;
    }
    if(s.phase==='screening_path'){
      s.boundary=estimateBoundaryFromScreening(s);
      s.boundaryRounds=1;
      s.phase='boundary';
      s.queue=pickBoundaryItems(s,s.boundary,3);
      s.cursor=0;
      return;
    }
    if(s.phase==='boundary'){
      const decision=boundaryDecision(s,s.boundary);
      if(decision.status==='BORDERLINE'&&!s.extraTriggered){
        s.extraTriggered=true;
        s.boundaryRounds+=1;
        s.phase='boundary_extra';
        s.queue=pickBoundaryItems(s,s.boundary,2);
        s.cursor=0;
        return;
      }
      s.closedDecision=decision.status==='BORDERLINE'?finalAmbiguousDecision(s,s.boundary):decision;
      s.phase='closed_complete';
      s.queue=[];s.cursor=0;
      return;
    }
    if(s.phase==='boundary_extra'){
      s.closedDecision=finalBoundaryDecision(s,s.boundary);
      s.phase='closed_complete';
      s.queue=[];s.cursor=0;
    }
  }
  function estimateBoundaryFromScreening(s){
    const by=bandStats(s.answers);
    let highest=-1;
    for(let i=0;i<BANDS.length;i++){
      const st=by[BANDS[i]];
      if(st&&st.n>0&&st.rate>=0.5)highest=i;
    }
    if(highest<0)return [BANDS[0],BANDS[1]];
    if(highest>=BANDS.length-1)return [BANDS[BANDS.length-2],BANDS[BANDS.length-1]];
    return [BANDS[highest],BANDS[highest+1]];
  }
  function bandStats(answers,phasePrefix){
    const out={};
    answers.forEach(a=>{
      if(phasePrefix&&String(a.phase).indexOf(phasePrefix)!==0)return;
      const x=out[a.target_band]||(out[a.target_band]={n:0,correct:0,rate:0});
      x.n++;if(a.correct)x.correct++;x.rate=x.correct/x.n;
    });
    return out;
  }
  function pickBoundaryItems(s,pair,countPerBand){
    const used=answeredIds(s),out=[];
    pair.forEach(b=>{
      const candidates=BANK.items.filter(i=>i.target_band===b&&i.stage_tags.includes('boundary')&&!used.has(i.item_id));
      const skillOrder=['vocabulary','grammar','Lesen','Hören'];
      candidates.sort((a,b2)=>skillOrder.indexOf(a.skill)-skillOrder.indexOf(b2.skill));
      const selected=[];
      for(const item of candidates){
        if(selected.length>=countPerBand)break;
        if(!selected.some(x=>x.skill===item.skill))selected.push(item);
      }
      for(const item of candidates){
        if(selected.length>=countPerBand)break;
        if(!selected.includes(item))selected.push(item);
      }
      out.push(...selected.slice(0,countPerBand).map(i=>i.item_id));
    });
    return interleaveByBand(out,pair);
  }
  function interleaveByBand(ids,pair){
    const a=ids.filter(id=>ITEM_BY_ID[id].target_band===pair[0]);
    const b=ids.filter(id=>ITEM_BY_ID[id].target_band===pair[1]);
    const out=[];const n=Math.max(a.length,b.length);
    for(let i=0;i<n;i++){if(a[i])out.push(a[i]);if(b[i])out.push(b[i]);}
    return out;
  }
  function boundaryEvidence(s,pair){
    const ans=s.answers.filter(a=>(a.phase==='boundary'||a.phase==='boundary_extra')&&pair.includes(a.target_band));
    const stats=bandStats(ans);
    return {lower:stats[pair[0]]||{n:0,correct:0,rate:0},upper:stats[pair[1]]||{n:0,correct:0,rate:0}};
  }
  function boundaryDecision(s,pair){
    const ev=boundaryEvidence(s,pair),lo=ev.lower,up=ev.upper;
    if(lo.n<3||up.n<3)return {status:'BORDERLINE',pair,confidence:'low',reason:'INSUFFICIENT_BOUNDARY_EVIDENCE'};
    if(lo.correct>=2&&up.correct<=1)return makeDecision(pair[0],pair,'medium',ev,'LOWER_SUPPORTED_UPPER_NOT_SUPPORTED');
    if(up.correct===3&&lo.correct>=2)return makeDecision(pair[1],pair,'medium',ev,'UPPER_STRONGLY_SUPPORTED');
    return {status:'BORDERLINE',pair,confidence:'low',evidence:ev,reason:'BOUNDARY_MIXED'};
  }
  function finalBoundaryDecision(s,pair){
    const ev=boundaryEvidence(s,pair),lo=ev.lower,up=ev.upper;
    if(up.n>=4&&up.rate>=0.75&&lo.rate>=0.5)return makeDecision(pair[1],pair,'high',ev,'UPPER_SUPPORTED_AFTER_CONFIRMATION');
    if(lo.n>=4&&lo.rate>=0.75&&up.rate<=0.5)return makeDecision(pair[0],pair,'high',ev,'LOWER_SUPPORTED_AFTER_CONFIRMATION');
    return finalAmbiguousDecision(s,pair);
  }
  function finalAmbiguousDecision(s,pair){
    const ev=boundaryEvidence(s,pair),lo=ev.lower,up=ev.upper;
    // Mixed evidence still needs a usable training start. Stay conservative:
    // promote to the upper band only when a majority of independent upper-band probes are supported.
    const upperSupported=up.n>=4&&up.rate>=0.75&&lo.rate>=0.5;
    const band=upperSupported?pair[1]:pair[0];
    return {
      status:'PLACED',
      band,
      pair,
      closerTo:band,
      label:'ближе к '+band,
      confidence:'low',
      evidence:ev,
      reason:'CONSERVATIVE_ROUTE_PLACEMENT_AFTER_MIXED_EVIDENCE'
    };
  }
  function makeDecision(band,pair,confidence,evidence,reason){
    return {status:'PLACED',band,pair,closerTo:band,label:'ближе к '+band,confidence,evidence,reason};
  }
  function getClosedDecision(s){
    ensureQueue(s);
    return s.closedDecision;
  }
  function selectWritingPrompt(s){
    const idx=estimatedBandIndex(s);
    return clone(BANK.productive.find(p=>p.item_id===(idx<=1?'W-A1':idx<=3?'W-A2':'W-B1')));
  }
  function selectSpeakingPrompts(s){
    const idx=estimatedBandIndex(s);
    if(idx<=1)return [clone(BANK.productive.find(p=>p.item_id==='S-A1'))];
    if(idx<=3)return [clone(BANK.productive.find(p=>p.item_id==='S-A2'))];
    return [
      clone(BANK.productive.find(p=>p.item_id==='S-A2')),
      clone(BANK.productive.find(p=>p.item_id==='S-B1'))
    ];
  }
  function estimatedBandIndex(s){
    const d=s.closedDecision||getClosedDecision(s);
    const b=d&&(d.band||d.closerTo)||'A2.1';
    return Math.max(0,BANDS.indexOf(b));
  }
  function saveWritingSample(s,promptId,text,meta={}){
    s.writing={promptId,text,wordCount:countWords(text),status:'NEEDS_REVIEW',capturedAt:now(),meta};
    s.phase='speaking';s.updatedAt=now();return s;
  }
  function skipWritingSample(s,promptId){
    s.writing={promptId,text:'',wordCount:0,status:'SKIPPED',capturedAt:now(),meta:{skipped:true}};
    s.phase='speaking';s.updatedAt=now();return s;
  }
  function saveSpeakingSample(s,promptId,sampleMeta={}){
    s.speaking.push({promptId,status:'NEEDS_REVIEW',capturedAt:now(),...sampleMeta});
    s.updatedAt=now();return s;
  }
  function markComplete(s){
    s.completed=true;s.phase='complete';s.completedAt=now();s.updatedAt=now();return s;
  }
  function applyProductiveReview(s,skill,band,verdict,meta={}){
    if(!['Schreiben','Sprechen'].includes(skill))throw new Error('Productive review skill must be Schreiben or Sprechen');
    if(!BANDS.includes(band))throw new Error('Unknown band');
    s.productiveReviews.push({skill,band,verdict:!!verdict,review_version:meta.review_version||'manual-test-v1',reviewedAt:now(),...meta});
    s.updatedAt=now();return s;
  }
  function countWords(t){return (String(t||'').match(/[A-Za-zÄÖÜäöüß]+/g)||[]).length;}
  function skillProfile(s,skill){
    if(skill==='Schreiben'||skill==='Sprechen'){
      const reviews=s.productiveReviews.filter(r=>r.skill===skill);
      if(!reviews.length)return {skill,status:'NEED_CONFIRMATION',band:null,confidence:'insufficient',evidenceCount:skill==='Schreiben'?(s.writing?1:0):s.speaking.length,note:'Productive sample captured but not evaluated.'};
      const passed=reviews.filter(r=>r.verdict);
      if(!passed.length)return {skill,status:'REVIEWED_WEAK',band:reviews[0].band,confidence:'medium',evidenceCount:reviews.length};
      const highest=passed.sort((a,b)=>BANDS.indexOf(b.band)-BANDS.indexOf(a.band))[0];
      return {skill,status:'REVIEWED',band:highest.band,confidence:reviews.length>=2?'high':'medium',evidenceCount:reviews.length};
    }
    const relevant=s.answers.filter(a=>a.skill===skill);
    if(!relevant.length)return {skill,status:'NEED_CONFIRMATION',band:null,confidence:'insufficient',evidenceCount:0};
    const stats=bandStats(relevant);let best=null;
    for(const b of BANDS){
      const x=stats[b];
      if(x&&x.n>=2&&x.rate>=0.67)best=b;
    }
    if(!best){
      const anyGood=[...BANDS].reverse().find(b=>stats[b]&&stats[b].correct>0);
      const fallback=anyGood||((s.closedDecision&&(s.closedDecision.band||s.closedDecision.closerTo))||BANDS[0]);
      return {skill,status:'SUPPORTED',band:fallback,confidence:'low',evidenceCount:relevant.length,stats,note:'Training estimate from the available diagnostic sample; refine with future sessions.'};
    }
    const x=stats[best];
    return {skill,status:'SUPPORTED',band:best,confidence:x.n>=3?'high':'medium',evidenceCount:relevant.length,stats};
  }
  function languageSystemProfile(s){
    const rel=s.answers.filter(a=>a.skill==='vocabulary'||a.skill==='grammar');
    if(!rel.length)return {skill:'language_system',status:'NEED_CONFIRMATION',band:null,confidence:'insufficient',evidenceCount:0};
    const stats=bandStats(rel);let best=null;
    for(const b of BANDS){const x=stats[b];if(x&&x.n>=2&&x.rate>=0.67)best=b;}
    if(!best){
      const dec=s.closedDecision;
      return {skill:'language_system',status:'SUPPORTED',band:dec&&(dec.band||dec.closerTo)||BANDS[0],confidence:'low',evidenceCount:rel.length,stats,note:'Training estimate from the available grammar/vocabulary sample; refine with future sessions.'};
    }
    return {skill:'language_system',status:'SUPPORTED',band:best,confidence:'medium',evidenceCount:rel.length,stats};
  }
  function result(s){
    const d=s.closedDecision||getClosedDecision(s);
    const profiles={
      language_system:languageSystemProfile(s),
      vocabulary:skillProfile(s,'vocabulary'),
      grammar:skillProfile(s,'grammar'),
      Lesen:skillProfile(s,'Lesen'),
      Hören:skillProfile(s,'Hören'),
      Schreiben:skillProfile(s,'Schreiben'),
      Sprechen:skillProfile(s,'Sprechen')
    };
    const gaps=b1Gaps(s,profiles);
    const route=buildInitialRoute(s,profiles,gaps);
    return {
      diagnostic_version:BANK.version,
      placement:d,
      placementDisplay:d.status==='PLACED'?'Текущая учебная зона: '+d.label:'Текущая учебная зона: '+d.label+' — требуется подтверждение',
      officialLevelClaim:false,
      profiles,
      gaps,
      route,
      explanation:explainPlacement(s,d),
      evidenceCount:s.answers.length,
      productiveEvidence:{writing:s.writing?{status:s.writing.status,wordCount:s.writing.wordCount}:null,speaking:s.speaking.map(x=>({promptId:x.promptId,status:x.status,audio:x.audio||false,interaction:x.interaction||false}))}
    };
  }
  function b1Gaps(s,profiles){
    const gaps=[];
    const wrongB1=s.answers.filter(a=>!a.correct&&String(a.target_band).startsWith('B1'));
    wrongB1.forEach(a=>{
      const item=ITEM_BY_ID[a.item_id];
      const key=item.skill+':'+item.micro_skill;
      if(!gaps.some(g=>g.key===key))gaps.push({key,module:item.skill,kind:'B1_EVIDENCE_GAP',micro_skill:item.micro_skill,reason:'Ошибка на независимом B1-oriented диагностическом материале.'});
    });
    if(profiles.Schreiben.status==='NEED_CONFIRMATION')gaps.push({key:'Schreiben:review',module:'Schreiben',kind:'PRODUCTIVE_EVIDENCE_GAP',reason:'Письменный образец сохранён, но ещё не прошёл надёжную оценку.'});
    if(profiles.Sprechen.status==='NEED_CONFIRMATION')gaps.push({key:'Sprechen:review',module:'Sprechen',kind:'PRODUCTIVE_EVIDENCE_GAP',reason:'Речевая выборка не даёт честного уровня без оценки аудио/взаимодействия.'});
    return gaps;
  }
  function buildInitialRoute(s,profiles,gaps){
    const idx=estimatedBandIndex(s);
    if(idx<=1){
      return {
        routeType:'FOUNDATION_FIRST',
        summary:'Сначала языковые предпосылки, затем дозированное знакомство с форматом B1.',
        blocks:[
          {id:'foundation-language',weight:55,label:'База языка',why:'Диагностика указывает на диапазон A1.x: без языковой основы B1 tasks будут слишком сложными.'},
          {id:'foundation-listening-reading',weight:30,label:'Понимание короткой речи и текстов',why:'Нужно укрепить базовое Lesen/Hören до перехода к плотному B1 материалу.'},
          {id:'b1-familiarisation',weight:15,label:'Знакомство с B1',why:'Только лёгкое знакомство с механикой экзамена, без выдачи A1/A2 материала за B1.'}
        ]
      };
    }
    if(idx<=3){
      return {
        routeType:'BRIDGE_TO_B1',
        summary:'Меньше базового курса, больше адресного ремонта пробелов и постепенного B1 practice.',
        blocks:[
          {id:'targeted-language-gaps',weight:35,label:'Точечные языковые пробелы',why:'Уровень уже близок к рабочей зоне A2, поэтому не нужен общий курс с нуля.'},
          {id:'a2-b1-transfer',weight:35,label:'Переход A2 → B1',why:'Нужны более длинные тексты, paraphrase, связность и удержание нескольких условий.'},
          {id:'b1-task-families',weight:30,label:'Goethe B1 task families',why:'Постепенно подключаем формат реального экзамена на подтверждённом B1 контенте.'}
        ]
      };
    }
    return {
      routeType:'B1_EXAM_FOCUSED',
      summary:'Основной вес на экзаменационные task families, независимость, timing, слабые модули и mocks.',
      blocks:[
        {id:'b1-targeted-gaps',weight:30,label:'Слабые микронавыки',why:gaps.length?gaps[0].reason:'B1 база близка к целевой; работаем точечно.'},
        {id:'b1-task-families',weight:45,label:'Goethe B1 task families',why:'Главный приоритет — устойчивое выполнение реальных типов заданий.'},
        {id:'b1-independent-proof',weight:25,label:'Timing + mocks',why:'Нужно доказать результат без подсказок на новых материалах.'}
      ]
    };
  }
  function explainPlacement(s,d){
    const ev=d.evidence||{};
    if(d.status==='PLACED'){
      return [
        'Решение основано на нескольких независимых заданиях около границы '+d.pair.join(' / ')+'.',
        'Один правильный или один неправильный ответ сам по себе уровень не меняет.',
        'Boundary evidence: '+formatEvidence(ev)+'.',
        'Внутренние зоны .1/.2 используются только для маршрута OTTO и не являются официальной сертификацией CEFR.'
      ];
    }
    return [
      'Результат на границе '+d.pair.join(' / ')+' остался смешанным даже после дополнительных проверок.',
      'Поэтому OTTO не присваивает точную зону и помечает результат как NEED_CONFIRMATION.',
      'Boundary evidence: '+formatEvidence(ev)+'.'
    ];
  }
  function formatEvidence(ev){
    if(!ev.lower||!ev.upper)return 'недостаточно данных';
    return 'нижняя зона '+ev.lower.correct+'/'+ev.lower.n+', верхняя зона '+ev.upper.correct+'/'+ev.upper.n;
  }
  function validateBank(){
    const required=['diagnostic_version','item_id','modality','skill','target_band','difficulty_boundary','grammar_tags','vocabulary_function_tags','cefr_alignment_note','source_basis','expected_duration_seconds','scoring_rule','contributes_to_placement','contributes_to_b1_exam_gap','qa_status','original_aligned'];
    const errors=[];
    BANK.items.concat(BANK.productive).forEach(item=>{
      required.forEach(k=>{if(item[k]===undefined||item[k]===null||item[k]==='')errors.push(item.item_id+': missing '+k);});
      if(!BANDS.includes(item.target_band))errors.push(item.item_id+': unknown target_band');
      if(item.original_aligned!==true)errors.push(item.item_id+': not original_aligned');
      if(String(item.publish_status).includes('B1')&&String(item.target_band).startsWith('A1'))errors.push(item.item_id+': A1 mislabeled as B1');
    });
    return {ok:errors.length===0,errors,count:BANK.items.length,productive:BANK.productive.length};
  }

  return {
    BANDS,createSession,nextItem,submitClosed,getClosedDecision,selectWritingPrompt,selectSpeakingPrompts,
    saveWritingSample,skipWritingSample,saveSpeakingSample,markComplete,applyProductiveReview,skillProfile,languageSystemProfile,
    result,buildInitialRoute,validateBank,estimateBoundaryFromScreening,boundaryDecision,finalBoundaryDecision
  };
});
