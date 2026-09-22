'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const words=s=>(String(s||'').match(/[A-Za-zÄÖÜäöüß]+/g)||[]).length;
const fingerprints=new Map();
function uniqueMaterial(label,text){
  const clean=String(text||'').toLowerCase().replace(/\s+/g,' ').trim();
  assert.ok(clean.length>25,label+' too short for review');
  const h=crypto.createHash('sha1').update(clean).digest('hex');
  assert.equal(fingerprints.has(h),false,label+' duplicates '+(fingerprints.get(h)||'another task'));
  fingerprints.set(h,label);
}
function germanish(label,text){
  const s=String(text||'');assert.ok(words(s)>=4,label+' too little German');
  assert.ok(/\b(?:der|die|das|und|ist|sind|war|wird|werden|Sie|wir|ich|ein|eine|nicht|mit|für|um|am|zu|alles|allein|kann|können|soll|sollen|wann|was|wie|warum|nur|heute|morgen|immer)\b/i.test(s),label+' does not look like German prose');
}
function options(q,label){
  if(!q.options)return;
  assert.ok(q.options.length>=2,label+' too few options');
  assert.equal(new Set(q.options.map(x=>String(x).trim().toLowerCase())).size,q.options.length,label+' duplicate distractor');
  assert.ok(Number.isInteger(q.correct_index)&&q.correct_index>=0&&q.correct_index<q.options.length,label+' invalid correct index');
}
const lesen={};for(let p=1;p<=5;p++)lesen[p]=read('content/lesen/teil-'+p+'.json').sets;
for(const t of lesen[1]){germanish(t.task_id,t.text);assert.ok(words(t.text)>=90,t.task_id+' text too short');uniqueMaterial(t.task_id,t.text);t.questions.forEach(q=>{germanish(q.id,q.statement);assert.ok(q.evidence&&q.why&&q.trap);});}
for(const t of lesen[2]){t.texts.forEach((x,i)=>{germanish(t.task_id+' text '+i,x.text);assert.ok(words(x.text)>=60);uniqueMaterial(t.task_id+'-'+i,x.text);});t.questions.forEach(q=>options(q,q.id));}
for(const t of lesen[3]){assert.equal(new Set(t.ads.map(x=>x.id)).size,10);assert.equal(new Set(t.situations.map(x=>String(x.correct))).size>=4,true);assert.equal(t.situations.filter(x=>String(x.correct)==='0').length,1);}
for(const t of lesen[4]){t.opinions.forEach(x=>germanish(t.task_id+' '+x.person,x.text));assert.ok(new Set(t.opinions.map(x=>x.correct)).size===2);}
for(const t of lesen[5]){germanish(t.task_id,t.text);t.questions.forEach(q=>options(q,q.id));}
const hoeren={};for(let p=1;p<=4;p++)hoeren[p]=read('content/hoeren/teil-'+p+'.json').sets;
for(const t of hoeren[1])for(const s of t.scenes){germanish(s.audio.audio_id,s.audio.transcript);assert.ok(words(s.audio.transcript)>=25);s.questions.forEach(q=>options(q,q.id));}
for(const t of hoeren[2]){germanish(t.task_id,t.audio.transcript);assert.ok(words(t.audio.transcript)>=55);t.questions.forEach(q=>options(q,q.id));}
for(const t of hoeren[3]){germanish(t.task_id,t.audio.transcript);assert.ok(words(t.audio.transcript)>=55);assert.equal(new Set(t.audio.speakers.map(x=>x.voice_id)).size,2);}
for(const t of hoeren[4]){germanish(t.task_id,t.audio.transcript);assert.ok(words(t.audio.transcript)>=70);assert.equal(new Set(t.audio.speakers.map(x=>x.voice_id)).size,3);}
for(const group of Object.values(hoeren))for(const t of group){
  const imgs=t.scenes?t.scenes.map(x=>x.image):[t.image];
  imgs.forEach(i=>{const raw=JSON.stringify(i);assert.equal(/correct_answer|correct_index|solution|answer_key/i.test(raw),false,i.image_id+' answer leak metadata');});
}
for(let a=1;a<=3;a++)for(const t of read('content/schreiben/aufgabe-'+a+'.json').tasks){
  germanish(t.task_id,t.instruction_de);germanish(t.task_id+' sample',t.sample);
  assert.notEqual(t.instruction_de.trim(),t.translation.trim(),t.task_id+' untranslated');
  assert.equal(new Set(t.required_points).size,t.required_points.length,t.task_id+' duplicate required point');
}
for(let a=1;a<=3;a++)for(const t of read('content/sprechen/aufgabe-'+a+'.json').tasks){
  germanish(t.task_id,t.instruction_de);germanish(t.task_id+' sample',t.sample);
  assert.ok(t.phrase_bank.length>=4,t.task_id+' phrase bank short');
}
console.log('content quality reviewer: PASS; unique long materials='+fingerprints.size);
