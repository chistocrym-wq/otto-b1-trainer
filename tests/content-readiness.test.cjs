'use strict';

const assert=require('node:assert/strict');
const {validateTask,assertCanPublish}=require('../content-readiness.js');

function readyHoeren(overrides={}){
  const task={
    task_id:'H-T4-001',module:'Hören',teil:4,task_type:'speaker_tracking',skill:'Hören',
    micro_skill:'speaker_tracking',difficulty:'B1',topic:'Arbeit',version:'1.0.0',
    qa_status:'QA_PASSED',content_status:'CONTENT_READY',
    source_basis:['GOETHE_B1','CEFR_2020'],
    translation:'Русский перевод учебного transcript после ответа.',
    explanation:'Подробный разбор: кто какую позицию выражает и какими перефразированиями это сделано.',
    glossary:[{de:'pendeln',ru:'ездить на работу из другого места'}],
    strategy:'До прослушивания распределите speaker labels, затем отслеживайте позицию, а не отдельные слова.',
    answer_key_status:'VERIFIED',correct_answer:'speaker_herr_brandt',
    audio:{
      audio_id:'AUD-H-T4-001',task_id:'H-T4-001',version:'1.0.0',
      speakers:[
        {speaker_id:'moderatorin',voice_id:'voice-f-01',portrait_id:'portrait-moderatorin',portrait_src:'assets/images/speakers/moderatorin.webp'},
        {speaker_id:'frau_keller',voice_id:'voice-f-02',portrait_id:'portrait-frau-keller',portrait_src:'assets/images/speakers/person-a.webp'},
        {speaker_id:'herr_brandt',voice_id:'voice-m-01',portrait_id:'portrait-herr-brandt',portrait_src:'assets/images/speakers/person-b.webp'}
      ],
      transcript:'Moderatorin: ... Frau Keller: ... Herr Brandt: ...',
      duration_seconds:82,
      playback_rules:{exam_play_count:2,training_play_count:3,extra_training_plays_are_assisted:true,segment_replay_after_answer:true},
      source_status:'OWNED_OR_LICENSED',production_status:'FINAL',source_type:'versioned_audio_asset',asset_src:'assets/audio/H-T4-001-v1.mp3'
    },
    image:{
      image_id:'IMG-H-T4-001',task_id:'H-T4-001',version:'1.0.0',
      src:'assets/images/H-T4-001-v1.webp',alt:'Три человека обсуждают рабочую тему за столом',
      scene_context:'офисная дискуссия',context_only:true,answer_leak_review:'PASSED',
      art_direction_version:'otto-blue-illustration-v1',source_status:'OWNED_OR_LICENSED'
    }
  };
  return Object.assign(task,overrides);
}

{
  const r=validateTask(readyHoeren());
  assert.equal(r.ok,true,r.errors.join('\n'));
  assert.equal(assertCanPublish(readyHoeren()),true);
}

{
  const t=readyHoeren();
  t.audio.source_type='speechSynthesis';
  const r=validateTask(t);
  assert.equal(r.ok,false);
  assert.ok(r.errors.includes('BROWSER_SPEECH_SYNTHESIS_NOT_FINAL'));
}

{
  const t=readyHoeren();
  t.audio.speakers[2].voice_id=t.audio.speakers[1].voice_id;
  const r=validateTask(t);
  assert.equal(r.ok,false);
  assert.ok(r.errors.includes('MULTISPEAKER_REUSES_VOICE'));
}

{
  const t=readyHoeren();
  t.audio.speakers=[{speaker_id:'moderatorin',voice_id:'voice-f-01'}];
  const r=validateTask(t);
  assert.equal(r.ok,false);
  assert.ok(r.errors.includes('HOEREN_TEIL4_REQUIRES_THREE_SPEAKERS'));
}

{
  const t=readyHoeren({teil:3});
  t.audio.speakers=[{speaker_id:'person_a',voice_id:'voice-f-01'}];
  const r=validateTask(t);
  assert.equal(r.ok,false);
  assert.ok(r.errors.includes('HOEREN_TEIL3_REQUIRES_TWO_SPEAKERS'));
}

{
  const t=readyHoeren();
  delete t.image;
  const r=validateTask(t);
  assert.equal(r.ok,false);
  assert.ok(r.errors.includes('MISSING_IMAGE'));
}

{
  const t=readyHoeren();
  t.image.correct_answer='speaker_herr_brandt';
  const r=validateTask(t);
  assert.equal(r.ok,false);
  assert.ok(r.errors.includes('IMAGE_METADATA_CONTAINS_ANSWER_DATA'));
}

{
  const t=readyHoeren();
  t.audio.playback_rules.extra_training_plays_are_assisted=false;
  const r=validateTask(t);
  assert.equal(r.ok,false);
  assert.ok(r.errors.includes('EXTRA_TRAINING_PLAYS_MUST_BE_ASSISTED'));
}

{
  const t=readyHoeren();
  t.translation='';
  t.glossary=[];
  t.answer_key_status='DRAFT';
  const r=validateTask(t);
  assert.equal(r.ok,false);
  assert.ok(r.errors.includes('CONTENT_READY_WITH_INCOMPLETE_BUNDLE'));
  assert.ok(r.errors.includes('MISSING_TRANSLATION'));
  assert.ok(r.errors.includes('MISSING_GLOSSARY'));
  assert.ok(r.errors.includes('UNVERIFIED_ANSWER_KEY_OR_RUBRIC'));
}

console.log('content-readiness regression: PASS');
