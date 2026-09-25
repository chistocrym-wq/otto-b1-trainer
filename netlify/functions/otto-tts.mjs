import { createHash } from 'node:crypto';
import { getDeployStore } from '@netlify/blobs';

const MODEL='gpt-4o-mini-tts';
const VOICE='cedar';
const URL='https://api.openai.com/v1/audio/speech';
const STORE='otto-b1-tts-cache-openai-direct-v1';
const VERSION='otto-b1-de-DE-hochdeutsch-cedar-v1';
const MAX_TEXT=500;

function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}})}
function instructions(mode,context){
  const pace=mode==='slow'?'Speak a little slower than normal conversation while preserving connected natural German speech.':'Speak at a calm, natural adult teaching pace.';
  return [
    'You are OTTO, a pleasant adult male native speaker from Germany.',
    'Use Standard German/Hochdeutsch from Germany with natural German rhythm, word stress, sentence melody and pauses.',
    'Pay special attention to umlauts, ich-Laut, ach-Laut, German r, vowel length, numbers, times and dates.',
    'Do not use an English, Russian, Dutch, Swiss or Austrian accent.',
    context==='dictionary'?'Pronounce the supplied German word or phrase clearly and only once.':'Speak only the supplied German text and nothing else.',
    pace
  ].join(' ');
}
async function input(req){
  if(req.method==='GET'){const u=new URL(req.url);return{text:u.searchParams.get('text')||'',mode:u.searchParams.get('mode')||'normal',context:u.searchParams.get('context')||'learning'}}
  if(req.method==='POST')return req.json().catch(()=>({}));
  return null;
}
export default async(req)=>{
  const body=await input(req);if(!body)return json({error:'Method not allowed'},405);
  const text=String(body.text||'').trim(),mode=body.mode==='slow'?'slow':'normal',context=String(body.context||'learning');
  if(!text)return json({error:'Text is required'},400);if(text.length>MAX_TEXT)return json({error:'Text is too long'},413);
  const apiKey=Netlify.env.get('OPENAI_DIRECT_API_KEY');if(!apiKey)return json({error:'otto_tts_not_configured',message:'Фирменный голос Otto пока не подключён на этом Preview.'},503);
  const fingerprint=JSON.stringify({VERSION,MODEL,VOICE,text,mode,context}),key=createHash('sha256').update(fingerprint).digest('hex'),store=getDeployStore(STORE);
  try{const cached=await store.get(key,{type:'arrayBuffer'});if(cached)return new Response(Buffer.from(cached),{headers:{'content-type':'audio/wav','cache-control':'public, max-age=31536000, immutable','x-otto-provider':'openai-direct-cedar','x-otto-voice':'cedar','x-otto-pronunciation':VERSION}})}catch{}
  const response=await fetch(URL,{method:'POST',headers:{authorization:'Bearer '+apiKey,'content-type':'application/json'},body:JSON.stringify({model:MODEL,voice:VOICE,input:text,instructions:instructions(mode,context),response_format:'wav',speed:mode==='slow'?0.92:0.98})});
  if(!response.ok)return json({error:'otto_tts_failed',providerStatus:response.status},503);
  const bytes=Buffer.from(await response.arrayBuffer());try{await store.set(key,bytes)}catch{}
  return new Response(bytes,{headers:{'content-type':'audio/wav','cache-control':'public, max-age=31536000, immutable','x-otto-provider':'openai-direct-cedar','x-otto-voice':'cedar','x-otto-pronunciation':VERSION}});
};
export const config={path:'/api/otto-tts',rateLimit:{windowLimit:60,windowSize:60,aggregateBy:['ip','domain']}};
