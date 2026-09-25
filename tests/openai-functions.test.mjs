import test from 'node:test';
import assert from 'node:assert/strict';
import chat from '../netlify/functions/otto-chat.mjs';
import transcribe from '../netlify/functions/transcribe.mjs';
const req=(body)=>new Request('http://localhost/.netlify/functions/x',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
test('chat has no frontend secret dependency and fails clearly without env',async()=>{
  const old=process.env.OPENAI_API_KEY;delete process.env.OPENAI_API_KEY;
  const r=await chat(req({message:'Помоги',context:{module:'Lesen'}}));assert.equal(r.status,503);
  if(old)process.env.OPENAI_API_KEY=old;
});
test('chat guards input length',async()=>{const r=await chat(req({message:'x'.repeat(2001)}));assert.equal(r.status,413);});
test('chat uses Responses API and returns text with mocked provider',async()=>{
  const oldKey=process.env.OPENAI_API_KEY,oldBase=process.env.OPENAI_BASE_URL,oldFetch=global.fetch;process.env.OPENAI_API_KEY='test-only';delete process.env.OPENAI_BASE_URL;
  global.fetch=async(url,opts)=>{assert.match(String(url),/api\.openai\.com\/v1\/responses$/);const body=JSON.parse(opts.body);assert.ok(body.max_output_tokens<=700);return new Response(JSON.stringify({output_text:'Короткая подсказка'}),{status:200,headers:{'content-type':'application/json'}});};
  const r=await chat(req({message:'Что делать?',context:{module:'Lesen',attempted:false}}));assert.equal(r.status,200);assert.equal((await r.json()).text,'Короткая подсказка');
  global.fetch=oldFetch;if(oldKey)process.env.OPENAI_API_KEY=oldKey;else delete process.env.OPENAI_API_KEY;if(oldBase)process.env.OPENAI_BASE_URL=oldBase;else delete process.env.OPENAI_BASE_URL;
});
test('chat honors Netlify AI Gateway base URL',async()=>{
  const oldKey=process.env.OPENAI_API_KEY,oldBase=process.env.OPENAI_BASE_URL,oldFetch=global.fetch;process.env.OPENAI_API_KEY='gateway-token';process.env.OPENAI_BASE_URL='https://gateway.example.test/openai/v1/';
  global.fetch=async(url,opts)=>{assert.equal(String(url),'https://gateway.example.test/openai/v1/responses');assert.equal(opts.headers.authorization,'Bearer gateway-token');return new Response(JSON.stringify({output_text:'Gateway OK'}),{status:200,headers:{'content-type':'application/json'}});};
  const r=await chat(req({message:'Проверка',context:{module:'Lesen'}}));assert.equal(r.status,200);assert.equal((await r.json()).text,'Gateway OK');
  global.fetch=oldFetch;if(oldKey)process.env.OPENAI_API_KEY=oldKey;else delete process.env.OPENAI_API_KEY;if(oldBase)process.env.OPENAI_BASE_URL=oldBase;else delete process.env.OPENAI_BASE_URL;
});
test('chat converts provider 5xx to graceful error',async()=>{
  const oldKey=process.env.OPENAI_API_KEY,oldFetch=global.fetch;process.env.OPENAI_API_KEY='test-only';global.fetch=async()=>new Response('bad',{status:500});
  const r=await chat(req({message:'Помоги'}));assert.equal(r.status,502);
  global.fetch=oldFetch;if(oldKey)process.env.OPENAI_API_KEY=oldKey;else delete process.env.OPENAI_API_KEY;
});
test('transcription requires server key and audio',async()=>{
  const old=process.env.OPENAI_API_KEY;delete process.env.OPENAI_API_KEY;
  assert.equal((await transcribe(req({audio_base64:'YWJj',mime_type:'audio/webm'}))).status,503);
  if(old)process.env.OPENAI_API_KEY=old;
});

test('transcription does not send Netlify gateway token to direct OpenAI audio endpoint',async()=>{
  const oldKey=process.env.OPENAI_API_KEY,oldBase=process.env.OPENAI_BASE_URL,oldDirect=process.env.OTTO_TRANSCRIBE_API_KEY,oldShared=process.env.OPENAI_DIRECT_API_KEY;
  process.env.OPENAI_API_KEY='gateway-token';process.env.OPENAI_BASE_URL='https://gateway.example.test/openai/v1';delete process.env.OTTO_TRANSCRIBE_API_KEY;delete process.env.OPENAI_DIRECT_API_KEY;
  const r=await transcribe(req({audio_base64:'YWJj',mime_type:'audio/webm'}));assert.equal(r.status,503);
  if(oldKey)process.env.OPENAI_API_KEY=oldKey;else delete process.env.OPENAI_API_KEY;
  if(oldBase)process.env.OPENAI_BASE_URL=oldBase;else delete process.env.OPENAI_BASE_URL;
  if(oldDirect)process.env.OTTO_TRANSCRIBE_API_KEY=oldDirect;else delete process.env.OTTO_TRANSCRIBE_API_KEY;
  if(oldShared)process.env.OPENAI_DIRECT_API_KEY=oldShared;else delete process.env.OPENAI_DIRECT_API_KEY;
});

test('Sprechen Aufgabe 1 partner mode is German-only roleplay, not generic coaching',async()=>{
  const oldKey=process.env.OPENAI_API_KEY,oldFetch=global.fetch;process.env.OPENAI_API_KEY='test-only';
  let captured=null;
  global.fetch=async(url,opts)=>{captured=JSON.parse(opts.body);return new Response(JSON.stringify({output_text:'Wann sollen wir uns treffen?'}),{status:200,headers:{'content-type':'application/json'}});};
  const context={mode:'sprechen_aufgabe1_partner',topic:'Bücher',planning_points:['Wann?','Wo?','Wer macht was?','Was braucht man?'],covered_planning_points:['Wo?'],unresolved_planning_points:['Wann?','Wer macht was?','Was braucht man?'],conversation:[{role:'otto',text:'Wo treffen wir uns?'},{role:'user',text:'In der Bibliothek.'}]};
  const r=await chat(req({message:'In der Bibliothek.',context}));assert.equal(r.status,200);
  assert.match(captured.instructions,/ausschließlich auf Deutsch/i);assert.match(captured.instructions,/Wann, Wo, Wer macht was und Was braucht man/i);assert.match(captured.instructions,/kein Prüfungsfeedback/i);
  assert.match(captured.input,/In der Bibliothek/);
  global.fetch=oldFetch;if(oldKey)process.env.OPENAI_API_KEY=oldKey;else delete process.env.OPENAI_API_KEY;
});
test('Sprechen Aufgabe 3 mode receives the real presentation transcript',async()=>{
  const oldKey=process.env.OPENAI_API_KEY,oldFetch=global.fetch;process.env.OPENAI_API_KEY='test-only';
  let captured=null;global.fetch=async(url,opts)=>{captured=JSON.parse(opts.body);return new Response(JSON.stringify({output_text:'Du hast die Kosten erwähnt. Wie könnte man sie senken?'}),{status:200,headers:{'content-type':'application/json'}});};
  const presentation='In meiner Präsentation habe ich gesagt, dass die Kosten für viele Familien ein Problem sind.';
  const r=await chat(req({message:'Stelle eine relevante Frage.',context:{mode:'sprechen_aufgabe3_question',presentation_transcript:presentation}}));assert.equal(r.status,200);
  assert.match(captured.instructions,/konkreten Inhalt aus der echten Präsentation/i);assert.match(captured.input,/Kosten für viele Familien/);
  global.fetch=oldFetch;if(oldKey)process.env.OPENAI_API_KEY=oldKey;else delete process.env.OPENAI_API_KEY;
});

test('transcription may safely reuse server-only OPENAI_DIRECT_API_KEY',async()=>{
  const oldShared=process.env.OPENAI_DIRECT_API_KEY,oldBase=process.env.OPENAI_BASE_URL,oldFetch=global.fetch;
  process.env.OPENAI_DIRECT_API_KEY='server-only-direct-key';process.env.OPENAI_BASE_URL='https://gateway.example.test/openai/v1';
  let auth='';global.fetch=async(url,opts)=>{assert.equal(String(url),'https://api.openai.com/v1/audio/transcriptions');auth=opts.headers.authorization;return new Response(JSON.stringify({text:'Guten Tag'}),{status:200,headers:{'content-type':'application/json'}});};
  const r=await transcribe(req({audio_base64:'YWJj',mime_type:'audio/mp4'}));assert.equal(r.status,200);assert.equal(auth,'Bearer server-only-direct-key');assert.equal((await r.json()).text,'Guten Tag');
  global.fetch=oldFetch;if(oldShared)process.env.OPENAI_DIRECT_API_KEY=oldShared;else delete process.env.OPENAI_DIRECT_API_KEY;if(oldBase)process.env.OPENAI_BASE_URL=oldBase;else delete process.env.OPENAI_BASE_URL;
});
