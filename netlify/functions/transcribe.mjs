const json=(status,body)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});
export default async function handler(req){
  if(req.method!=='POST')return json(405,{error:'method_not_allowed'});
  let data;try{data=await req.json();}catch{return json(400,{error:'invalid_json'});}
  const b64=String(data?.audio_base64||'');
  const mime=String(data?.mime_type||'audio/webm').slice(0,80);
  if(!b64)return json(400,{error:'audio_required'});
  if(b64.length>12_000_000)return json(413,{error:'audio_too_large'});
  const gatewayBase=process.env.OPENAI_BASE_URL;
  const key=process.env.OTTO_TRANSCRIBE_API_KEY||process.env.OPENAI_DIRECT_API_KEY||(!gatewayBase?process.env.OPENAI_API_KEY:null);
  if(!key)return json(503,{error:'transcription_not_configured',message:'Запись сохранена, но автоматическая расшифровка в этом Preview не подключена.'});
  let bytes;try{bytes=Buffer.from(b64,'base64');}catch{return json(400,{error:'invalid_audio'});}
  if(!bytes.length)return json(400,{error:'invalid_audio'});
  const model=process.env.OTTO_TRANSCRIBE_MODEL||'gpt-4o-mini-transcribe';
  const ext=mime.includes('wav')?'wav':mime.includes('mp4')?'mp4':mime.includes('mpeg')||mime.includes('mp3')?'mp3':'webm';
  const form=new FormData();
  form.append('file',new Blob([bytes],{type:mime}),'speech.'+ext);
  form.append('model',model);
  form.append('language','de');
  form.append('response_format','json');
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),20000);
  try{
    const res=await fetch('https://api.openai.com/v1/audio/transcriptions',{method:'POST',headers:{'authorization':'Bearer '+key},body:form,signal:controller.signal});
    if(!res.ok)return json(res.status>=500?502:res.status,{error:'transcription_provider_error',message:'Не удалось расшифровать запись.'});
    const payload=await res.json();
    return json(200,{text:String(payload?.text||'').trim(),model});
  }catch(e){
    if(e?.name==='AbortError')return json(504,{error:'timeout',message:'Расшифровка заняла слишком много времени.'});
    return json(502,{error:'network_error',message:'Не удалось отправить запись на расшифровку.'});
  }finally{clearTimeout(timer);}
}
