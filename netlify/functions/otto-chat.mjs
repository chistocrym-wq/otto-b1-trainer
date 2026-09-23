const json=(status,body)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function outputText(data){
  if(typeof data?.output_text==='string')return data.output_text.trim();
  const out=[];
  for(const item of data?.output||[])for(const c of item?.content||[])if(typeof c?.text==='string')out.push(c.text);
  return out.join('\n').trim();
}
async function provider(body,key,signal){
  const base=String(process.env.OPENAI_BASE_URL||'https://api.openai.com/v1').replace(/\/$/,'');
  return fetch(base+'/responses',{method:'POST',headers:{'authorization':'Bearer '+key,'content-type':'application/json'},body:JSON.stringify(body),signal});
}
export default async function handler(req){
  if(req.method!=='POST')return json(405,{error:'method_not_allowed'});
  let data;try{data=await req.json();}catch{return json(400,{error:'invalid_json'});}
  const message=String(data?.message||'').trim();
  if(!message)return json(400,{error:'empty_message'});
  if(message.length>2000)return json(413,{error:'message_too_long'});
  const rawContext=JSON.stringify(data?.context||{});
  if(rawContext.length>7000)return json(413,{error:'context_too_large'});
  const key=process.env.OPENAI_API_KEY;
  if(!key)return json(503,{error:'otto_not_configured',message:'Otto пока не подключён на сервере.'});
  const model=process.env.OTTO_OPENAI_MODEL||'gpt-5.6-luna';
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),12000);
  const instructions='Ты Otto, учебный помощник по Goethe-Zertifikat B1. Отвечай прежде всего по-русски. Используй немецкий для примеров. Не выдавай правильный ответ до самостоятельной попытки, если контекст говорит, что попытки ещё не было: сначала дай подсказку. Не называй учебный результат официальным баллом Goethe. Не придумывай данные, которых нет в контексте. Ответ должен быть коротким и полезным.';
  const input='Контекст текущего задания (минимально необходимый): '+rawContext+'\n\nСообщение ученика: '+message;
  const body={model,instructions,input,max_output_tokens:700};
  try{
    let res=await provider(body,key,controller.signal);
    if((res.status===429||res.status>=500)&&!controller.signal.aborted){await sleep(250);res=await provider(body,key,controller.signal);}
    if(!res.ok)return json(res.status>=500?502:res.status,{error:'provider_error',message:'Otto сейчас не смог ответить. Попробуйте ещё раз.'});
    const payload=await res.json(),text=outputText(payload);
    if(!text)return json(502,{error:'empty_provider_response'});
    return json(200,{text,model});
  }catch(e){
    if(e?.name==='AbortError')return json(504,{error:'timeout',message:'Ответ занял слишком много времени. Попробуйте ещё раз.'});
    return json(502,{error:'network_error',message:'Не удалось связаться с учебным помощником.'});
  }finally{clearTimeout(timer);}
}
