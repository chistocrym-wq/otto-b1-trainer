'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const {assertCanPublish}=require('../content-readiness.js');
const allIds=new Set();
function common(t){
  for(const k of ['task_id','module','teil','task_type','skill','micro_skill','difficulty','topic','version','qa_status','content_status','source_basis','strategy','explanation'])assert.ok(t[k],t.task_id+' missing '+k);
  assert.equal(t.original_aligned,true,t.task_id+' not original_aligned');
  assert.equal(t.content_status,'CONTENT_READY_PREVIEW',t.task_id+' not publishable preview content');
  assert.equal(t.qa_status,'CONTROLLER_AUTOMATED_REVIEW_PASSED',t.task_id+' QA status');
  assert.ok(Array.isArray(t.glossary)&&t.glossary.length>=3,t.task_id+' glossary');
  assert.ok(t.translation,t.task_id+' translation');
  assert.equal(allIds.has(t.task_id),false,'duplicate '+t.task_id);allIds.add(t.task_id);
  assert.equal(assertCanPublish(t),true,t.task_id+' publish gate');
}
const lesen={};for(let p=1;p<=5;p++)lesen[p]=read('content/lesen/teil-'+p+'.json').sets;
assert.deepEqual(Object.fromEntries(Object.entries(lesen).map(([k,v])=>[k,v.length])),{'1':10,'2':10,'3':10,'4':10,'5':10});
for(const t of lesen[1]){common(t);assert.equal(t.questions.length,6);}
for(const t of lesen[2]){common(t);assert.equal(t.texts.length,2);assert.equal(t.questions.length,6);}
for(const t of lesen[3]){common(t);assert.equal(t.situations.length,7);assert.equal(t.ads.length,10);assert.equal(t.situations.filter(x=>String(x.correct)==='0').length,1);}
for(const t of lesen[4]){common(t);assert.equal(t.opinions.length,7);}
for(const t of lesen[5]){common(t);assert.equal(t.questions.length,4);}
const hoeren={};for(let p=1;p<=4;p++)hoeren[p]=read('content/hoeren/teil-'+p+'.json').sets;
assert.deepEqual(Object.fromEntries(Object.entries(hoeren).map(([k,v])=>[k,v.length])),{'1':10,'2':10,'3':10,'4':10});
function audio(a,expected,voices){
  assert.equal(a.playback_rules.exam_play_count,expected);
  assert.equal(a.source_type,'versioned_static_asset');
  assert.ok(a.asset_src&&!/speechSynthesis/i.test(a.asset_src));
  assert.ok(Array.isArray(a.speakers)&&new Set(a.speakers.map(x=>x.voice_id)).size>=voices);
  if(process.env.ALLOW_AUDIO_PENDING!=='1')assert.ok(fs.existsSync(path.join(root,a.asset_src)),a.asset_src+' missing');
}
function image(i){assert.ok(i.src&&fs.existsSync(path.join(root,i.src)),i.src+' missing');assert.equal(i.context_only,true);assert.equal(i.answer_leak_review,'PASSED_CONTEXT_ONLY');}
for(const t of hoeren[1]){common(t);assert.equal(t.scenes.length,5);for(const s of t.scenes){assert.equal(s.questions.length,2);audio(s.audio,2,1);image(s.image);}}
for(const t of hoeren[2]){common(t);assert.equal(t.questions.length,5);audio(t.audio,1,1);image(t.image);}
for(const t of hoeren[3]){common(t);assert.equal(t.questions.length,7);audio(t.audio,1,2);image(t.image);}
for(const t of hoeren[4]){common(t);assert.equal(t.questions.length,8);audio(t.audio,2,3);assert.equal(t.audio.speakers.length,3);image(t.image);}
for(let a=1;a<=3;a++){
  const tasks=read('content/schreiben/aufgabe-'+a+'.json').tasks;
  assert.equal(tasks.length,10);
  for(const t of tasks){
    common(t);assert.ok(t.instruction_de&&t.instruction_ru&&t.sample&&t.sample_translation);
    assert.equal(t.rubric_status,'GOETHE_MODEL_FORMAT_VERIFIED');
    assert.ok(Array.isArray(t.required_points)&&t.required_points.length>=3);
    if(a<3)assert.deepEqual(t.rubric,{task_completion:10,coherence:10,vocabulary:10,structures:10});
    else assert.deepEqual(t.rubric,{task_completion:4,coherence:4,vocabulary:6,structures:6});
  }
}
for(let a=1;a<=3;a++){
  const tasks=read('content/sprechen/aufgabe-'+a+'.json').tasks;
  assert.equal(tasks.length,10);
  for(const t of tasks){
    common(t);assert.ok(t.instruction_de&&t.instruction_ru&&t.sample&&t.sample_translation);
    assert.equal(t.rubric_status,'GOETHE_MODEL_FORMAT_VERIFIED');
    if(a===1)assert.deepEqual(t.rubric,{task_completion:8,interaction:4,vocabulary_register:8,structures:8,pronunciation_shared:16});
    if(a===2){assert.deepEqual(t.rubric,{task_completion:12,interaction:4,vocabulary_register:12,structures:12,pronunciation_shared:16});assert.ok(fs.existsSync(path.join(root,t.sample_audio)),t.sample_audio+' missing');}
    if(a===3)assert.deepEqual(t.rubric,{task_completion:16,pronunciation_shared:16});
  }
}
const audioFiles=fs.readdirSync(path.join(root,'assets','audio','hoeren'),{recursive:true}).filter(x=>String(x).endsWith('.mp3'));
const speakingAudio=fs.readdirSync(path.join(root,'assets','audio','sprechen'),{recursive:true}).filter(x=>String(x).endsWith('.mp3'));
const allImageFiles=fs.readdirSync(path.join(root,'assets','images','hoeren'));
const imageFiles=allImageFiles.filter(x=>x.endsWith('.webp'));
const legacySvg=allImageFiles.filter(x=>x.endsWith('.svg'));
assert.equal(audioFiles.length,80,'expected 80 Hören MP3 assets');
assert.equal(speakingAudio.length,10,'expected 10 Sprechen sample MP3 assets');
assert.equal(imageFiles.length,80,'expected 80 Hören contextual WebP images');
assert.equal(legacySvg.length,0,'legacy placeholder SVGs must not remain in Hören');
console.log('full-content regression: PASS; ids='+allIds.size+'; audio='+(audioFiles.length+speakingAudio.length)+'; images='+imageFiles.length);
