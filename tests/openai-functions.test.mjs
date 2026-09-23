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
