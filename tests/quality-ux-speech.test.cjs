'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const words=s=>(String(s||'').match(/[A-Za-zÄÖÜäöüß]+/g)||[]).length;

let imageCount=0;
for(let part=1;part<=4;part++){
  const tasks=read('content/hoeren/teil-'+part+'.json').sets;
  for(const task of tasks){
    const units=part===1?task.scenes:[task];
    for(const unit of units){
      const img=unit.image;imageCount++;
      assert.match(img.src,/\.webp$/i,img.image_id+' must be WebP');
      assert.equal(/\.svg$/i.test(img.src),false,img.image_id+' legacy SVG');
      assert.equal(img.answer_leak_review,'PASSED_CONTEXT_ONLY');
      const full=path.join(root,img.src);assert.ok(fs.existsSync(full),img.src+' missing');
      const magic=fs.readFileSync(full).subarray(0,4).toString('ascii');assert.equal(magic,'RIFF',img.src+' not WebP/RIFF');
    }
    if(part===3){
      assert.equal(task.audio.speakers.length,2);
      assert.equal(new Set(task.audio.speakers.map(x=>x.voice_id)).size,2);
      assert.equal(new Set(task.audio.speakers.map(x=>x.portrait_id)).size,2);
      task.audio.speakers.forEach(s=>assert.ok(fs.existsSync(path.join(root,s.portrait_src)),s.portrait_src));
    }
    if(part===4){
      assert.equal(task.audio.speakers.length,3);
      assert.equal(new Set(task.audio.speakers.map(x=>x.voice_id)).size,3);
      assert.equal(new Set(task.audio.speakers.map(x=>x.portrait_id)).size,3);
      task.audio.speakers.forEach(s=>assert.ok(fs.existsSync(path.join(root,s.portrait_src)),s.portrait_src));
    }
  }
}
assert.equal(imageCount,80,'expected 80 Hören contextual images');

for(const [a,min,max] of [[1,70,95],[2,70,95],[3,35,50]]){
  const tasks=read('content/schreiben/aufgabe-'+a+'.json').tasks;
  for(const t of tasks){const n=words(t.sample);assert.ok(n>=min&&n<=max,t.task_id+' sample words '+n+' outside '+min+'-'+max);}
}
for(const t of read('content/sprechen/aufgabe-2.json').tasks){
  assert.equal(t.presentation_structure_coverage,'ALL_5_STEPS');
  assert.deepEqual(t.sample_duration_target_seconds,[150,210]);
  assert.equal(t.duration_is_primary_qa,true);
  assert.equal(t.presentation_structure.length,5);
}
const sampleAudio=read('assets/audio/sprechen/sample-duration-manifest.json');
assert.equal(sampleAudio.human_listening_qa,'NOT_VERIFIED');
assert.equal(Object.keys(sampleAudio.items).length,10);
for(const [id,m] of Object.entries(sampleAudio.items)){
  assert.ok(m.duration_seconds>=150&&m.duration_seconds<=210,id+' duration '+m.duration_seconds+' outside 150-210');
  assert.ok(fs.existsSync(path.join(root,m.asset_src)),m.asset_src+' missing');
}
const app=fs.readFileSync(path.join(root,'app.js'),'utf8');
const speech=fs.readFileSync(path.join(root,'speech-client.js'),'utf8');
assert.equal(/speechSynthesis|SpeechSynthesisUtterance/.test(app),false,'app final German playback must not use browser speechSynthesis');
assert.equal(/speechSynthesis|SpeechSynthesisUtterance/.test(speech),false,'speech client must not fall back to browser speechSynthesis');
assert.match(speech,/gpt-4o-mini-tts/);assert.match(speech,/voice:'cedar'/);
assert.match(app,/audio\/mp4/,'Safari/iOS microphone MIME fallback missing');
assert.match(app,/Разрешите микрофон для OTTO/);
assert.match(app,/Микрофон не найден/);
assert.match(app,/уже немного знаю немецкий/);
assert.match(app,/2026-09-23-v1/);
assert.match(app,/otto\.nash@mail\.ru/);
console.log('quality/ux/speech regression: PASS; Hören images='+imageCount);
