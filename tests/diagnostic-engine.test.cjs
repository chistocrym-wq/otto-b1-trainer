'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const BANK=require('../diagnostic-bank.js');
const ENGINE=require('../diagnostic-engine.js');

const bandIndex=b=>ENGINE.BANDS.indexOf(b);
const wrongIndex=item=>item.correct_answer===0?1:0;

function runClosed(policy){
  const s=ENGINE.createSession();
  let guard=0,item;
  while((item=ENGINE.nextItem(s))){
    const ok=policy(item,s);
    ENGINE.submitClosed(s,item.item_id,ok?item.correct_answer:wrongIndex(item),{duration_ms:item.expected_duration_seconds*1000});
    if(++guard>80)throw new Error('diagnostic loop guard');
  }
  assert.equal(s.phase,'closed_complete');
  return s;
}
function threshold(maxBand,mutator){
  return (item,s)=>{
    let ok=bandIndex(item.target_band)<=bandIndex(maxBand);
    return mutator?mutator(item,s,ok):ok;
  };
}
function resultOf(s){return ENGINE.result(s);}

// 1. Clearly lower candidate must not be inflated into A2.2/B1.
{
  const s=runClosed(threshold('A1.2'));
  assert.equal(s.closedDecision.status,'PLACED');
  assert.equal(s.closedDecision.band,'A1.2');
  assert.equal(resultOf(s).route.routeType,'FOUNDATION_FIRST');
}

// 2. Strong A2 candidate reaches B1 boundary probes but remains A2.2 when B1 evidence fails.
{
  const s=runClosed(threshold('A2.2'));
  assert.equal(s.closedDecision.band,'A2.2');
  assert.ok(s.answers.some(a=>a.target_band==='B1.1'),'A2.2 candidate should reach B1.1 boundary probes');
  assert.equal(resultOf(s).route.routeType,'BRIDGE_TO_B1');
}

// 3. Borderline A2.2/B1.1 result gets extra independent evidence and can remain NEED_CONFIRMATION.
{
  const s=ENGINE.createSession();
  const counts={};
  let guard=0,item;
  while((item=ENGINE.nextItem(s))){
    let ok=false;
    if(s.phase==='screening_core'||s.phase==='screening_path'){
      ok=bandIndex(item.target_band)<=bandIndex('A2.2');
    }else if((s.phase==='boundary'||s.phase==='boundary_extra')&&['A2.2','B1.1'].includes(item.target_band)){
      const key=item.target_band;
      counts[key]=(counts[key]||0)+1;
      ok=[1,2,4].includes(counts[key]); // 3/5 in each band -> mixed after confirmation.
    }
    ENGINE.submitClosed(s,item.item_id,ok?item.correct_answer:wrongIndex(item));
    if(++guard>80)throw new Error('borderline loop guard');
  }
  assert.equal(s.extraTriggered,true);
  assert.equal(s.boundaryRounds,2);
  assert.equal(s.closedDecision.status,'NEED_CONFIRMATION');
  assert.match(s.closedDecision.label,/A2\.2|B1\.1/);
}

// 4. One random error must not collapse an otherwise supported A2.2 placement.
{
  let forced=false;
  const s=runClosed(threshold('A2.2',(item,state,ok)=>{
    if(ok&&state.phase==='boundary'&&item.target_band==='A2.2'&&!forced){forced=true;return false;}
    return ok;
  }));
  assert.equal(s.closedDecision.band,'A2.2');
}

// 5. One lucky B1 answer must not promote an A2.2 candidate.
{
  let lucky=false;
  const s=runClosed(threshold('A2.2',(item,state,ok)=>{
    if(!ok&&state.phase==='boundary'&&item.target_band==='B1.1'&&!lucky){lucky=true;return true;}
    return ok;
  }));
  assert.equal(s.closedDecision.band,'A2.2');
}

// 6. Uneven profile stays uneven: strong receptive evidence cannot hide weak Schreiben.
{
  const s=runClosed(threshold('B1.1'));
  const before=ENGINE.result(s);
  assert.equal(before.profiles.Schreiben.status,'NEED_CONFIRMATION');
  ENGINE.applyProductiveReview(s,'Schreiben','A2.1',false,{review_version:'regression-v1'});
  const after=ENGINE.result(s);
  assert.equal(after.profiles.Schreiben.status,'REVIEWED_WEAK');
  assert.equal(after.profiles.Schreiben.band,'A2.1');
  assert.notEqual(after.profiles.Lesen.band,after.profiles.Schreiben.band);
}

// 7. Insufficient Sprechen evidence stays NEED_CONFIRMATION.
{
  const s=runClosed(threshold('B1.1'));
  ENGINE.saveSpeakingSample(s,'S-B1',{audio:true,interaction:true});
  const r=ENGINE.result(s);
  assert.equal(r.profiles.Sprechen.status,'NEED_CONFIRMATION');
  assert.equal(r.profiles.Sprechen.band,null);
}

// 8. Three real placement trajectories generate three different initial route families.
{
  const a1=ENGINE.result(runClosed(threshold('A1.2'))).route.routeType;
  const a22=ENGINE.result(runClosed(threshold('A2.2'))).route.routeType;
  const b1=ENGINE.result(runClosed(threshold('B1.1'))).route.routeType;
  assert.deepEqual([a1,a22,b1],['FOUNDATION_FIRST','BRIDGE_TO_B1','B1_EXAM_FOCUSED']);
}

// 9. New evaluated evidence can change a profile; placement is not frozen forever.
{
  const s=runClosed(threshold('A2.2'));
  let r=ENGINE.result(s);
  assert.equal(r.profiles.Schreiben.status,'NEED_CONFIRMATION');
  ENGINE.applyProductiveReview(s,'Schreiben','A2.2',true,{review_version:'regression-v1'});
  r=ENGINE.result(s);
  assert.equal(r.profiles.Schreiben.status,'REVIEWED');
  assert.equal(r.profiles.Schreiben.band,'A2.2');
}

// 10-13. Content QA / legacy quarantine / metadata.
{
  const v=ENGINE.validateBank();
  assert.equal(v.ok,true,v.errors.join('\n'));
  assert.equal(BANK.items.length,42);
  assert.equal(BANK.productive.length,6);
  for(const band of ENGINE.BANDS){
    const items=BANK.items.filter(i=>i.target_band===band);
    assert.ok(items.length>=7,band+' must have at least seven closed items');
  }
  for(const item of BANK.items.concat(BANK.productive)){
    assert.equal(item.original_aligned,true);
    assert.ok(item.source_basis.length>=2,item.item_id+' source basis');
    assert.ok(item.cefr_alignment_note,item.item_id+' CEFR note');
    assert.ok(!String(item.publish_status).includes('CONFIRMED_B1_TRAINING'),item.item_id+' must not masquerade as confirmed training');
  }
  const app=fs.readFileSync(path.join(__dirname,'..','app.js'),'utf8');
  for(const legacy of ['const SAMPLES=','const TRANSFER=','const DIAG=']){
    assert.equal(app.includes(legacy),false,'legacy runtime bank leaked: '+legacy);
  }
}

// Reading/listening material gets materially denser toward B1.
{
  const wc=s=>(String(s||'').match(/[A-Za-zÄÖÜäöüß]+/g)||[]).length;
  const avg=(band,skill)=>{
    const xs=BANK.items.filter(i=>i.target_band===band&&i.skill===skill).map(i=>wc(i.text||i.audio_script));
    return xs.reduce((a,b)=>a+b,0)/xs.length;
  };
  assert.ok(avg('B1.1','Lesen')>avg('A2.1','Lesen')*1.5);
  assert.ok(avg('B1.2','Hören')>avg('A1.2','Hören')*1.8);
}

console.log('diagnostic-engine regression: PASS');
