'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const {validateTask}=require('../content-readiness.js');

function loadBrowserFile(file,ctx){
  const code=fs.readFileSync(path.join(__dirname,'..',file),'utf8');
  vm.runInContext(code,ctx,{filename:file});
}
const ctx=vm.createContext({window:{}});
loadBrowserFile('guide-data.js',ctx);
loadBrowserFile('learning-bank.js',ctx);

const G=ctx.window.OTTO_GUIDE_B1;
const L=ctx.window.OTTO_LEARNING_BANK;
assert.ok(G&&L,'Guide/learning bank missing');

assert.deepEqual(Object.keys(G.modules),['Lesen','Hören','Schreiben','Sprechen']);
assert.equal(G.modules.Lesen.exam.duration,'65 минут');
assert.equal(G.modules.Lesen.parts.length,5);
assert.equal(G.modules.Lesen.exam.scored,'30 заданий');
assert.equal(G.modules.Hören.parts.length,4);
assert.equal(G.modules.Schreiben.parts.length,3);
assert.equal(G.modules.Sprechen.parts.length,3);
assert.ok(G.modules.Schreiben.exam.criteria.some(x=>x.includes('Erfüllung 10')));
assert.ok(G.modules.Schreiben.exam.criteria.some(x=>x.includes('Wortschatz 6')));
assert.ok(G.modules.Sprechen.exam.criteria.some(x=>x.includes('Interaktion 4')));
assert.ok(G.modules.Sprechen.exam.criteria.some(x=>x.includes('Aussprache')));
assert.ok(G.modules.Sprechen.parts[1].label.includes('Präsentation'));
assert.ok(!G.modules.Schreiben.parts.some(x=>/Präsentation/i.test(x.label)));

assert.ok(G.modules.Schreiben.samples[1][0].translation);
assert.ok(G.modules.Schreiben.samples[2][0].translation);
assert.ok(G.modules.Schreiben.samples[3][0].translation);
assert.ok(G.modules.Schreiben.template.includes('[причина]'));
assert.ok(Object.keys(G.modules.Schreiben.phrase_bank).length>=10);
assert.equal(G.modules.Schreiben.scaffolding.length,4);
assert.equal(G.modules.Sprechen.scaffolding.length,4);
assert.ok(G.modules.Sprechen.presentation.sample.length>300);

const t=L.published.Lesen['1'];
assert.equal(t.questions.length,6);
assert.equal(t.answer_key_status,'VERIFIED');
assert.equal(t.content_status,'CONTENT_READY');
assert.ok(t.translation.length>100);
assert.ok(t.glossary.length>=12);
assert.ok(t.questions.every(q=>q.evidence&&q.why&&q.trap));
const readiness=validateTask(t);
assert.equal(readiness.ok,true,readiness.errors.join('\n'));

assert.deepEqual(Array.from(L.pending.Lesen),[2,3,4,5]);
assert.deepEqual(Array.from(L.pending.Hören),[1,2,3,4]);

console.log('guide/learning regression: PASS');
