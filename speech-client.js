(function(){
'use strict';
const MODE_KEY='ottoB1.voiceSpeed.v1';
const CLIENT_VERSION='otto-b1-speech-v1';
let activeAudio=null,requestId=0;
function getMode(){try{return localStorage.getItem(MODE_KEY)==='slow'?'slow':'normal'}catch{return'normal'}}
function setMode(mode){const next=mode==='slow'?'slow':'normal';try{localStorage.setItem(MODE_KEY,next)}catch{};window.dispatchEvent(new CustomEvent('otto:speech-mode',{detail:{mode:next}}));return next}
function stop(){requestId++;if(activeAudio){try{activeAudio.pause();activeAudio.currentTime=0}catch{}activeAudio=null}}
function ttsUrl(text,options){
  const o=options||{},mode=o.speed==='slow'||o.mode==='slow'?'slow':o.speed==='normal'||o.mode==='normal'?'normal':getMode();
  const q=new URLSearchParams({text:String(text||'').trim(),mode,voiceRole:o.voiceRole||'otto',context:o.context||'learning',v:CLIENT_VERSION});
  return '/api/otto-tts?'+q.toString();
}
async function speakGerman(text,options){
  const clean=String(text||'').trim();if(!clean||typeof Audio==='undefined')return false;
  const id=++requestId;stop();requestId=id;
  return await new Promise(resolve=>{
    const audio=new Audio();activeAudio=audio;audio.preload='auto';audio.playsInline=true;
    let settled=false;const finish=ok=>{if(settled)return;settled=true;clearTimeout(timer);if(!ok&&activeAudio===audio)activeAudio=null;resolve(Boolean(ok)&&id===requestId)};
    audio.addEventListener('playing',()=>finish(true),{once:true});
    audio.addEventListener('error',()=>finish(false),{once:true});
    audio.src=ttsUrl(clean,options||{});
    const timer=setTimeout(()=>finish(false),7000);
    try{const p=audio.play();p&&p.catch&&p.catch(()=>finish(false))}catch{finish(false)}
  });
}
window.OTTO_SPEECH={version:CLIENT_VERSION,speakGerman,setMode,getMode,stop,ttsUrl,provider:'openai-direct',model:'gpt-4o-mini-tts',voice:'cedar'};
})();