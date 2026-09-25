'use strict';

const FINAL_AUDIO_FORBIDDEN = new Set(['speechSynthesis','browser_speech_synthesis','tts_browser_placeholder']);
const READY_STATUSES = new Set(['CONTENT_READY','CONTENT_READY_PREVIEW']);

function nonEmptyString(v){return typeof v==='string'&&v.trim().length>0;}
function isArray(v){return Array.isArray(v);}
function uniq(xs){return new Set(xs).size===xs.length;}

function hasEmbeddedAnswers(task){
  const valid=q=>q&&(
    typeof q.correct==='boolean'||typeof q.correct==='string'||
    Number.isInteger(q.correct_index)||nonEmptyString(q.correct_speaker)
  );
  if(isArray(task.questions)&&task.questions.length)return task.questions.every(valid);
  if(isArray(task.situations)&&task.situations.length)return task.situations.every(x=>x&&x.correct!==undefined);
  if(isArray(task.opinions)&&task.opinions.length)return task.opinions.every(x=>x&&x.correct!==undefined);
  if(isArray(task.scenes)&&task.scenes.length)return task.scenes.every(s=>isArray(s.questions)&&s.questions.length&&s.questions.every(valid));
  return false;
}

function validateCommon(task){
  const errors=[];
  const req=['task_id','module','teil','task_type','skill','micro_skill','difficulty','topic','version','qa_status','source_basis','explanation','strategy'];
  req.forEach(k=>{if(task[k]==null||task[k]===''||(isArray(task[k])&&!task[k].length))errors.push('MISSING_'+k.toUpperCase());});
  if(!isArray(task.glossary)||task.glossary.length===0)errors.push('MISSING_GLOSSARY');
  if(!nonEmptyString(task.translation))errors.push('MISSING_TRANSLATION');
  const hasAnswer=task.answer_key_status==='VERIFIED'&&(task.correct_answer!==undefined||task.answer_key!==undefined||hasEmbeddedAnswers(task));
  const hasRubric=['VERIFIED','GOETHE_MODEL_FORMAT_VERIFIED'].includes(task.rubric_status)&&task.rubric;
  if(!hasAnswer&&!hasRubric)errors.push('UNVERIFIED_ANSWER_KEY_OR_RUBRIC');
  return errors;
}

function validateSpeakers(audio,task){
  const errors=[];
  if(!isArray(audio.speakers)||audio.speakers.length===0)return ['MISSING_SPEAKERS'];
  const ids=audio.speakers.map(s=>s&&s.speaker_id).filter(Boolean);
  if(ids.length!==audio.speakers.length||!uniq(ids))errors.push('INVALID_SPEAKER_IDS');
  const voiceBySpeaker=new Map();
  for(const s of audio.speakers){
    if(!s||!nonEmptyString(s.speaker_id)||!nonEmptyString(s.voice_id)){errors.push('MISSING_SPEAKER_OR_VOICE_ID');continue;}
    if(voiceBySpeaker.has(s.speaker_id)&&voiceBySpeaker.get(s.speaker_id)!==s.voice_id)errors.push('SPEAKER_VOICE_NOT_STABLE');
    voiceBySpeaker.set(s.speaker_id,s.voice_id);
  }
  const voices=[...voiceBySpeaker.values()];
  if(ids.length>1&&new Set(voices).size!==ids.length)errors.push('MULTISPEAKER_REUSES_VOICE');
  if(String(task.teil)==='3'&&ids.length<2)errors.push('HOEREN_TEIL3_REQUIRES_TWO_SPEAKERS');
  if(String(task.teil)==='4'&&ids.length<3)errors.push('HOEREN_TEIL4_REQUIRES_THREE_SPEAKERS');
  if(String(task.teil)==='3'||String(task.teil)==='4'){
    const portraits=audio.speakers.map(s=>s&&s.portrait_id).filter(Boolean);
    const portraitSrc=audio.speakers.map(s=>s&&s.portrait_src).filter(Boolean);
    if(portraits.length!==audio.speakers.length||portraitSrc.length!==audio.speakers.length)errors.push('MISSING_SPEAKER_PORTRAIT');
    if(portraits.length&&new Set(portraits).size!==audio.speakers.length)errors.push('MULTISPEAKER_REUSES_PORTRAIT');
  }
  return errors;
}

function validateAudio(task){
  const errors=[];
  const a=task.audio;
  if(!a||typeof a!=='object')return ['MISSING_AUDIO'];
  ['audio_id','task_id','version','transcript','duration_seconds','playback_rules','source_status','production_status'].forEach(k=>{
    if(a[k]==null||a[k]==='')errors.push('MISSING_AUDIO_'+k.toUpperCase());
  });
  if(a.task_id!==task.task_id)errors.push('AUDIO_TASK_ID_MISMATCH');
  if(FINAL_AUDIO_FORBIDDEN.has(a.source_type))errors.push('BROWSER_SPEECH_SYNTHESIS_NOT_FINAL');
  if((a.production_status==='FINAL'||a.source_type==='versioned_static_asset')&&!nonEmptyString(a.asset_src))errors.push('FINAL_AUDIO_ASSET_MISSING');
  const p=a.playback_rules||{};
  if(!Number.isInteger(p.exam_play_count)||p.exam_play_count<1)errors.push('INVALID_EXAM_PLAY_COUNT');
  if(p.extra_training_plays_are_assisted!==true)errors.push('EXTRA_TRAINING_PLAYS_MUST_BE_ASSISTED');
  errors.push(...validateSpeakers(a,task));
  return errors;
}

function validateImage(task){
  const errors=[];
  const i=task.image;
  if(!i||typeof i!=='object')return ['MISSING_IMAGE'];
  ['image_id','task_id','version','src','alt','scene_context','art_direction_version','source_status'].forEach(k=>{
    if(i[k]==null||i[k]==='')errors.push('MISSING_IMAGE_'+k.toUpperCase());
  });
  if(i.task_id!==task.task_id)errors.push('IMAGE_TASK_ID_MISMATCH');
  if(i.context_only!==true)errors.push('IMAGE_MUST_BE_CONTEXT_ONLY');
  if(!['PASSED','PASSED_CONTEXT_ONLY'].includes(i.answer_leak_review))errors.push('IMAGE_ANSWER_LEAK_REVIEW_REQUIRED');
  if(/\.svg(?:$|\?)/i.test(i.src))errors.push('LEGACY_PLACEHOLDER_SVG_FORBIDDEN');
  if(!/\.(webp|avif|png)(?:$|\?)/i.test(i.src))errors.push('IMAGE_MUST_BE_RASTER_ASSET');
  const serialized=JSON.stringify(i);
  if(/correct_answer|answer_key|correctOption|solution/i.test(serialized))errors.push('IMAGE_METADATA_CONTAINS_ANSWER_DATA');
  return errors;
}

function validateHoeren(task){
  const errors=[];
  if(isArray(task.scenes)&&task.scenes.length){
    task.scenes.forEach((scene,index)=>{
      const sceneTask=Object.assign({},task,{audio:scene.audio,image:scene.image});
      validateAudio(sceneTask).forEach(e=>errors.push('SCENE_'+(index+1)+'_'+e));
      validateImage(sceneTask).forEach(e=>errors.push('SCENE_'+(index+1)+'_'+e));
    });
  }else{
    errors.push(...validateAudio(task));
    errors.push(...validateImage(task));
  }
  return errors;
}

function validateTask(task){
  const errors=validateCommon(task);
  if(task.module==='Hören'||task.module==='Hoeren')errors.push(...validateHoeren(task));
  const ready=errors.length===0;
  if(READY_STATUSES.has(task.content_status)&&!ready)errors.unshift('CONTENT_READY_WITH_INCOMPLETE_BUNDLE');
  return {ok:ready,errors};
}

function assertCanPublish(task){
  const r=validateTask(task);
  if(!READY_STATUSES.has(task.content_status))r.errors.unshift('CONTENT_STATUS_NOT_PUBLISHABLE');
  if(!r.ok||r.errors.length)throw new Error('Task '+(task.task_id||'<unknown>')+' is not content-ready: '+r.errors.join(', '));
  return true;
}

module.exports={validateTask,assertCanPublish,FINAL_AUDIO_FORBIDDEN,READY_STATUSES};
