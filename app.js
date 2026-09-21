'use strict';

const BANK=window.OTTO_DIAGNOSTIC_BANK;
const ENGINE=window.OTTO_DIAGNOSTIC_ENGINE;
const STORAGE='ottoB1.diagnostic.v3';
const MODULES=['Lesen','Hören','Schreiben','Sprechen'];

const B1_MAP={
  Lesen:[
    ['Teil 1','Личный / повествовательный текст','Richtig / Falsch'],
    ['Teil 2','Два текста из прессы','a / b / c'],
    ['Teil 3','Ситуации ↔ объявления','matching / 0'],
    ['Teil 4','Позиции людей','Ja / Nein'],
    ['Teil 5','Правила / инструкции','a / b / c']
  ],
  Hören:[
    ['Teil 1','5 коротких аудио','R/F + a/b/c; 2 раза'],
    ['Teil 2','Один более длинный текст','a/b/c; 1 раз'],
    ['Teil 3','Разговор','R/F; 1 раз'],
    ['Teil 4','Дискуссия / speaker tracking','распределение по говорящим; 2 раза']
  ],
  Schreiben:[
    ['Aufgabe 1','Личная E-Mail','около 80 слов'],
    ['Aufgabe 2','Мнение / Diskussionsbeitrag','около 80 слов'],
    ['Aufgabe 3','Короткая E-Mail','около 40 слов']
  ],
  Sprechen:[
    ['Aufgabe 1','Gemeinsam etwas planen','парное взаимодействие'],
    ['Aufgabe 2','Präsentation','структурированное высказывание'],
    ['Aufgabe 3','Reaktion + Fragen','реакция / вопрос / ответ']
  ]
};

const $=s=>document.querySelector(s);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const now=()=>new Date().toISOString();
let memoryFallback=null;
let recorder=null;
let chunks=[];

function fresh(){
  return {
    version:3,
    auth:{method:'email',contact:'',verified:false},
    name:'',gender:'',examDate:'',dailyMinutes:25,
    diagnostic:{
      session:ENGINE.createSession(),
      audioPlays:{},
      speakingIndex:0,
      activeItemId:null,
      itemStartedAt:null,
      result:null
    },
    selectedModule:'Lesen'
  };
}

function load(){
  try{
    const raw=localStorage.getItem(STORAGE);
    if(!raw)return fresh();
    const p=JSON.parse(raw),base=fresh();
    return Object.assign(base,p,{
      auth:Object.assign(base.auth,p.auth||{}),
      diagnostic:Object.assign(base.diagnostic,p.diagnostic||{})
    });
  }catch(e){return memoryFallback||fresh();}
}
let S=load();

function save(){
  try{localStorage.setItem(STORAGE,JSON.stringify(S));}
  catch(e){memoryFallback=JSON.parse(JSON.stringify(S));}
}
function reset(){
  try{localStorage.removeItem(STORAGE);}catch(e){}
  memoryFallback=null;S=fresh();history.replaceState(null,'','#register');render();
}
function go(r){
  save();
  const h='#'+r;
  if(location.hash!==h)history.pushState(null,'',h);
  render();
}
function route(){return (location.hash||'#register').slice(1);}
function button(label,action,kind='primary',extra=''){return '<button class="btn '+kind+'" data-action="'+action+'" '+extra+'>'+label+'</button>';}
function pill(t,k=''){return '<span class="pill '+k+'">'+esc(t)+'</span>';}
function card(title,body,kind=''){return '<div class="card '+kind+'"><div class="card-title">'+esc(title)+'</div><div class="muted">'+body+'</div></div>';}
function domainLabel(d){
  return {
    language_system:'Language system',vocabulary:'Vocabulary',grammar:'Grammar',
    Lesen:'Lesen',Hören:'Hören',Schreiben:'Schreiben',Sprechen:'Sprechen'
  }[d]||d;
}
function confidenceRu(c){return c==='high'?'высокая':c==='medium'?'средняя':c==='low'?'низкая':'недостаточно данных';}

function captureRegistrationDraft(){
  const n=$('#regName'),g=$('#regGender'),d=$('#regExamDate'),c=$('#regContact');
  if(n)S.name=n.value;
  if(g)S.gender=g.value;
  if(d)S.examDate=d.value;
  if(c&&S.auth.method==='email')S.auth.contact=c.value;
}
function registerView(){
  const contact=S.auth.method==='email'
    ? '<label><b>Email</b><input id="regContact" class="field" type="email" value="'+esc(S.auth.contact)+'" placeholder="name@example.com"></label>'
    : '<div class="friendly-note"><b>Telegram</b><br>В рабочей версии здесь будет безопасное подтверждение через Telegram Mini App. В Preview проверяется только сценарий.</div>';
  return '<section class="first-onboarding"><div class="first-copy"><span class="kicker">Тренажёр Otto · Goethe-Zertifikat B1</span><h1 class="h1">Готовимся к сертификату B1</h1><p class="lead">Чем точнее мы определим старт, тем меньше времени вы потратите на слишком лёгкие или слишком сложные задания.</p><div class="auth-card"><h2>Регистрация</h2><div class="form-grid"><label><b>Имя</b><input id="regName" class="field" value="'+esc(S.name)+'"></label><label><b>Как к вам обращаться?</b><select id="regGender" class="field"><option value="">Не указывать</option><option value="female" '+(S.gender==='female'?'selected':'')+'>Женский род</option><option value="male" '+(S.gender==='male'?'selected':'')+'>Мужской род</option></select></label><div><b>Способ входа</b><div class="auth-tabs"><button data-action="auth-email" class="'+(S.auth.method==='email'?'active':'')+'">Email</button><button data-action="auth-telegram" class="'+(S.auth.method==='telegram'?'active':'')+'">Telegram</button></div></div>'+contact+'<label><b>Дата экзамена, если известна</b><input id="regExamDate" class="field" type="date" value="'+esc(S.examDate)+'"></label><div><b>Сколько времени удобно заниматься в обычный день?</b><div class="button-row">'+[10,25,45].map(n=>'<button class="btn '+(S.dailyMinutes===n?'primary':'ghost')+'" data-minutes="'+n+'">'+n+' минут</button>').join('')+'</div><p class="small">Это настройка ежедневного маршрута. Она не ограничивает первоначальную диагностику.</p></div></div><div class="button-row">'+button(S.auth.method==='email'?'Получить код':'Продолжить в Telegram','register-submit')+'</div></div></div><div class="first-otto"><img src="'+window.OTTO_SRC+'" alt="Otto"></div></section>';
}
function verifyView(){
  return '<div class="auth-wrap"><div class="auth-card"><span class="eyebrow">Подтверждение</span><h1 class="h2">'+(S.auth.method==='email'?'Введите код из письма':'Telegram-подтверждение')+'</h1>'+(S.auth.method==='email'?'<p class="muted">Для Preview используйте код <b>111111</b>.</p><input id="verifyCode" class="field verify-code" maxlength="6" inputmode="numeric">':'<div class="friendly-note">Для Preview нажмите «Подтвердить». Реальный Telegram backend не подключён.</div>')+'<div class="button-row">'+button('Подтвердить','verify')+button('Назад','back-register','ghost')+'</div></div></div>';
}
function submitRegistration(){
  captureRegistrationDraft();
  if(!S.name.trim())return alert('Введите имя.');
  if(S.auth.method==='email'&&!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(S.auth.contact))return alert('Введите корректный email.');
  if(S.auth.method==='telegram')S.auth.contact='Telegram';
  save();go('verify');
}
function finishVerification(){
  if(S.auth.method==='email'&&($('#verifyCode')?.value.trim()!=='111111'))return alert('Для Preview используйте 111111.');
  S.auth.verified=true;save();go('diagnostic-gate');
}

function diagnosticStarted(){
  const s=S.diagnostic.session;
  return !!(s&&s.startedAt&&((s.answers&&s.answers.length)||s.phase!=='screening_core'));
}
function diagnosticGate(){
  const resume=diagnosticStarted()&&!S.diagnostic.session.completed;
  return '<div class="gate-card"><div class="plain-otto"><img src="'+window.OTTO_SRC+'" alt="Otto"></div><span class="eyebrow">Первичная калибровка</span><h1 class="h1">'+(resume?'Продолжим диагностику':'Сначала — диагностика')+'</h1><p class="lead">Это не тест из шести случайных вопросов. Otto сначала делает wide screening, затем проверяет предполагаемую границу на новом материале и отдельно собирает productive evidence.</p><div class="friendly-note" style="text-align:left"><b>Важно:</b> A1.1 / A1.2 / A2.1 / A2.2 / B1.1 / B1.2 — внутренние учебные placement bands OTTO, а не официальный сертификат CEFR.<br><br><b>Зачем точнее:</b> чем точнее старт, тем меньше времени вы потратите на слишком лёгкие или слишком сложные задания.</div><div class="button-row">'+button(resume?'Продолжить с сохранённого места':'Начать диагностику',resume?'diag-resume':'diag-start')+'</div></div>';
}
function startDiagnostic(){
  S.diagnostic={
    session:ENGINE.createSession(),
    audioPlays:{},
    speakingIndex:0,
    activeItemId:null,
    itemStartedAt:null,
    result:null
  };
  save();go('diagnostic');
}
function stageTitle(phase){
  if(phase==='screening_core'||phase==='screening_path')return 'Этап A · Wide screening';
  if(phase==='boundary'||phase==='boundary_extra')return 'Этап B · Adaptive boundary check';
  if(phase==='closed_complete'||phase==='writing'||phase==='speaking')return 'Этап C · Productive evidence';
  return 'Этап D · Результат';
}
function phaseCopy(phase){
  if(phase==='screening_core')return 'Сначала быстро определяем вероятный диапазон. Один ответ ничего не решает.';
  if(phase==='screening_path')return 'Screening уже разветвился по вашим ответам и проверяет подходящий диапазон.';
  if(phase==='boundary')return 'Проверяем две соседние учебные зоны несколькими независимыми заданиями.';
  if(phase==='boundary_extra')return 'Результат пограничный, поэтому добавлены новые подтверждающие задания.';
  return '';
}
function remainingMinutes(){
  const s=S.diagnostic.session;
  if(s.phase==='screening_core'||s.phase==='screening_path'||s.phase==='boundary'||s.phase==='boundary_extra'){
    const ids=s.queue.slice(s.cursor),secs=ids.reduce((sum,id)=>{
      const item=BANK.items.find(x=>x.item_id===id);
      return sum+(item?.expected_duration_seconds||45);
    },0);
    return Math.max(1,Math.ceil((secs+360)/60));
  }
  if(s.phase==='closed_complete'||s.phase==='writing')return 8;
  if(s.phase==='speaking')return Math.max(2,4-S.diagnostic.speakingIndex);
  return 0;
}
function currentItem(){
  const item=ENGINE.nextItem(S.diagnostic.session);
  if(item&&S.diagnostic.activeItemId!==item.item_id){
    S.diagnostic.activeItemId=item.item_id;
    S.diagnostic.itemStartedAt=Date.now();
    save();
  }
  return item;
}
function renderClosed(item){
  let html='';
  if(item.text)html+='<div class="task-text">'+esc(item.text).replace(/\n/g,'<br>')+'</div>';
  if(item.modality==='audio'){
    const used=S.diagnostic.audioPlays[item.item_id]||0;
    html+='<div class="audio-card"><div><b>Hören · '+esc(item.target_band)+'</b><div class="small">Диагностическое аудио можно прослушать до 2 раз. Прослушано: '+used+'/2.</div></div>'+button('▶ Воспроизвести','diag-audio','secondary',used>=2?'disabled':'')+'</div>';
  }
  html+='<p class="lead" style="font-size:17px"><b>'+esc(item.prompt)+'</b></p><div class="choice-grid">';
  item.options.forEach((o,i)=>html+='<button class="choice" data-diag-choice="'+i+'">'+esc(o)+'</button>');
  html+='</div>';
  return html;
}
function diagnosticView(){
  const s=S.diagnostic.session;
  if(s.completed||s.phase==='complete')return reportView();
  if(s.phase==='closed_complete'||s.phase==='writing'||s.phase==='speaking')return productiveView();
  const item=currentItem();
  if(!item)return '<div class="notice">Otto пересчитывает следующий шаг диагностики…</div>';
  const pct=s.phase==='screening_core'?18:s.phase==='screening_path'?35:s.phase==='boundary'?55:s.phase==='boundary_extra'?68:75;
  return '<span class="eyebrow">'+stageTitle(s.phase)+'</span><div class="diag-top"><div><h1 class="h2">'+(s.phase.startsWith('boundary')?'Проверяем границу':'Сужаем диапазон')+'</h1><p class="muted">'+phaseCopy(s.phase)+'</p></div><div class="time-left">≈ '+remainingMinutes()+' мин.</div></div><div class="progress-line"><i style="width:'+pct+'%"></i></div><div class="meta-row">'+pill(item.target_band)+pill(item.skill)+pill(item.micro_skill)+'</div>'+renderClosed(item)+'<p class="small">Каждый ответ сохраняется автоматически. Закрыли страницу — продолжите с этого места.</p>';
}
function answerDiagnostic(index){
  const s=S.diagnostic.session,item=currentItem();
  if(!item)return;
  const duration=S.diagnostic.itemStartedAt?Date.now()-S.diagnostic.itemStartedAt:null;
  const audio=S.diagnostic.audioPlays[item.item_id]||0;
  ENGINE.submitClosed(s,item.item_id,Number(index),{duration_ms:duration,audio_plays:audio});
  S.diagnostic.activeItemId=null;S.diagnostic.itemStartedAt=null;save();render();
}
function playDiagnosticAudio(){
  const item=currentItem();if(!item||item.modality!=='audio')return;
  const used=S.diagnostic.audioPlays[item.item_id]||0;
  if(used>=2)return;
  S.diagnostic.audioPlays[item.item_id]=used+1;save();
  if(!('speechSynthesis'in window))return alert('Системная немецкая озвучка недоступна в этом браузере.');
  speechSynthesis.cancel();
  const u=new SpeechSynthesisUtterance(item.audio_script);
  u.lang='de-DE';
  u.rate=item.target_band.startsWith('B1')?.96:item.target_band.startsWith('A2')?.90:.82;
  speechSynthesis.speak(u);
  render();
}

function countGermanWords(text){return (String(text||'').match(/[A-Za-zÄÖÜäöüß]+/g)||[]).length;}
function writingGate(text,prompt){
  const words=countGermanWords(text),cyr=(String(text||'').match(/[А-Яа-яЁё]+/g)||[]).length;
  const min=prompt.target_band.startsWith('B1')?45:prompt.target_band.startsWith('A2')?30:15;
  return {words,cyr,valid:words>=min&&words>cyr*2,min};
}
function productiveView(){
  const s=S.diagnostic.session;
  if(s.phase==='closed_complete'||s.phase==='writing'){
    const w=ENGINE.selectWritingPrompt(s);
    return '<span class="eyebrow">'+stageTitle(s.phase)+'</span><div class="diag-top"><div><h1 class="h2">Schreiben · реальный productive sample</h1><p class="muted">Prompt выбран по предварительно найденной границе. Он сохраняется как evidence, но без надёжной оценки не превращается в выдуманный уровень.</p></div><div class="time-left">≈ '+remainingMinutes()+' мин.</div></div><div class="progress-line"><i style="width:80%"></i></div><div class="meta-row">'+pill(w.target_band)+pill(w.task_family)+'</div><div class="task-text">'+esc(w.prompt)+'</div><textarea id="writingSample" class="field" rows="11" placeholder="Schreiben Sie auf Deutsch…">'+esc(s.writing?.text||'')+'</textarea><div class="notice">Проверяем только пригодность sample. Итоговый статус сейчас: <b>NEEDS_REVIEW</b>. Ни количество символов, ни один AI-вызов не выдаются за официальный CEFR/Goethe результат.</div><div class="button-row">'+button('Сохранить и перейти к Sprechen','save-writing')+'</div>';
  }
  if(s.phase==='speaking')return speakingView();
  return reportView();
}
function saveWriting(){
  const s=S.diagnostic.session,w=ENGINE.selectWritingPrompt(s),text=$('#writingSample').value.trim(),gate=writingGate(text,w);
  if(!gate.valid)return alert('Нужен осмысленный преимущественно немецкий текст минимум примерно '+gate.min+' слов для этой диагностической пробы.');
  ENGINE.saveWritingSample(s,w.item_id,text,{gate_version:'meaningful-german-v1'});
  S.diagnostic.speakingIndex=0;save();render();
}
function speakingView(){
  const s=S.diagnostic.session,prompts=ENGINE.selectSpeakingPrompts(s),i=S.diagnostic.speakingIndex,p=prompts[i];
  if(!p){ENGINE.markComplete(s);S.diagnostic.result=ENGINE.result(s);save();return reportView();}
  const b1=p.item_id==='S-B1';
  return '<span class="eyebrow">'+stageTitle(s.phase)+'</span><div class="diag-top"><div><h1 class="h2">Sprechen · '+esc(p.target_band)+' probe</h1><p class="muted">'+(b1?'Для приблизившегося к B1 обязательно проверяем interaction, а не только монолог.':'Собираем речевой sample подходящей сложности.')+'</p></div><div class="time-left">≈ '+remainingMinutes()+' мин.</div></div><div class="progress-line"><i style="width:'+(88+i*5)+'%"></i></div><div class="task-text">'+esc(p.prompt)+'</div>'+
    (b1?'<div class="speaker"><div class="speaker-avatar"><img src="'+window.OTTO_SRC+'" alt="Otto"></div><div><b>Otto — партнёр</b><div class="muted">Wir könnten den Lerntag am Samstag ab zehn Uhr in der Bibliothek machen. Ich würde aber nur eine kurze Mittagspause planen. Was meinst du?</div></div></div><div class="button-row">'+button('🔊 Otto говорит','speak-otto','secondary')+'</div>':'')+
    '<div id="recordBox" class="record-box '+(recorder&&recorder.state==='recording'?'recording':'')+'"><span class="record-dot"></span><b> Реальная запись микрофона</b><div class="button-row" style="justify-content:center">'+button(recorder&&recorder.state==='recording'?'■ Остановить':'🎙 Начать запись','record-speaking','secondary')+'</div></div><div class="notice">Transcript ≠ оценка Sprechen. Без отдельной audio/rubric evaluation мы не придумываем pronunciation, fluency или B1.1/B1.2.</div><div class="button-row">'+button('Сохранить этот sample','finish-speaking')+button('Нет доступа к микрофону','skip-speaking','ghost')+'</div>';
}
async function toggleSpeakingRecord(){
  if(recorder&&recorder.state==='recording'){
    recorder.stop();recorder.stream.getTracks().forEach(t=>t.stop());return;
  }
  try{
    const stream=await navigator.mediaDevices.getUserMedia({audio:true});
    chunks=[];recorder=new MediaRecorder(stream);recorder.stream=stream;
    recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
    recorder.onstop=()=>{
      const bytes=chunks.reduce((n,b)=>n+b.size,0);
      S.diagnostic.lastRecording={recorded:bytes>0,bytes,savedAt:now()};
      save();recorder=null;render();
    };
    recorder.start();render();
  }catch(e){alert('Нет доступа к микрофону: '+e.message);}
}
function finishSpeaking(skipped=false){
  const s=S.diagnostic.session,prompts=ENGINE.selectSpeakingPrompts(s),p=prompts[S.diagnostic.speakingIndex];
  if(!p){ENGINE.markComplete(s);S.diagnostic.result=ENGINE.result(s);save();return go('report');}
  if(!skipped&&!S.diagnostic.lastRecording?.recorded)return alert('Сначала запишите речевой sample или выберите «Нет доступа к микрофону».');
  ENGINE.saveSpeakingSample(s,p.item_id,{
    audio:!skipped,
    bytes:skipped?0:S.diagnostic.lastRecording.bytes,
    interaction:p.item_id==='S-B1',
    evaluation_status:skipped?'NEED_CONFIRMATION':'NEEDS_REVIEW'
  });
  S.diagnostic.lastRecording=null;
  S.diagnostic.speakingIndex++;
  if(S.diagnostic.speakingIndex>=prompts.length){
    ENGINE.markComplete(s);
    S.diagnostic.result=ENGINE.result(s);
    save();go('report');
  }else{save();render();}
}
function speakOtto(){
  if(!('speechSynthesis' in window))return;
  const u=new SpeechSynthesisUtterance('Wir könnten den Lerntag am Samstag ab zehn Uhr in der Bibliothek machen. Ich würde aber nur eine kurze Mittagspause planen. Was meinst du?');
  u.lang='de-DE';u.rate=.92;speechSynthesis.speak(u);
}

function ensureResult(){
  const s=S.diagnostic.session;
  if(!s.completed)return null;
  if(!S.diagnostic.result)S.diagnostic.result=ENGINE.result(s);
  return S.diagnostic.result;
}
function profileLine(v){
  if(v.status==='NEED_CONFIRMATION')return 'требуется подтверждение · evidence: '+v.evidenceCount;
  return (v.band||'без зоны')+' · уверенность '+confidenceRu(v.confidence)+' · evidence: '+v.evidenceCount;
}
function reportView(){
  const r=ensureResult();
  if(!r)return diagnosticGate();
  let domains='<div class="stack">';
  ['language_system','vocabulary','grammar','Lesen','Hören','Schreiben','Sprechen'].forEach(d=>{
    const v=r.profiles[d];
    domains+=card(domainLabel(d),profileLine(v),v.status==='NEED_CONFIRMATION'?'warn':'');
  });
  domains+='</div>';
  let gaps=r.gaps.length?r.gaps.map(g=>'<li><b>'+esc(domainLabel(g.module))+'</b> — '+esc(g.reason)+'</li>').join(''):'<li>Явный B1-oriented gap пока не подтверждён; нужны дальнейшие independent evidence points.</li>';
  return '<span class="eyebrow">Результат диагностики · '+esc(r.diagnostic_version)+'</span><h1 class="h2">'+esc(r.placementDisplay)+'</h1><p class="lead">Это внутренняя учебная placement band. OTTO не сертифицирует официальный уровень CEFR.</p>'+
    card('Confidence',confidenceRu(r.placement.confidence)+' · '+esc(r.placement.status),r.placement.status==='NEED_CONFIRMATION'?'warn':'good')+
    '<h3>Профиль по навыкам</h3>'+domains+
    '<h3>До Goethe B1 сейчас важнее всего</h3><div class="card"><ul>'+gaps+'</ul></div>'+
    card('Почему такой результат',r.explanation.map(esc).join('<br>'),'soft')+
    '<div class="button-row">'+button('Открыть мой маршрут','open-route')+button('На главную','open-home','ghost')+'</div>';
}

function homeView(){
  const r=ensureResult();if(!r)return diagnosticGate();
  const p=r.placement.band||r.placement.closerTo||'нужно подтверждение';
  return '<span class="eyebrow">Моя подготовка</span><h1 class="h2">Здравствуйте, '+esc(S.name)+'</h1><p class="lead">Стартовая гипотеза: '+esc(p)+'. После новых evidence профиль может меняться — первичная диагностика не фиксирует человека навсегда.</p><div class="mode-grid"><div class="mode-card primary-mode"><h3>Otto ведёт меня</h3><p class="muted">'+esc(r.route.summary)+'</p>'+button('Посмотреть маршрут','open-route')+'</div><div class="mode-card"><h3>Выбрать модуль</h3><p class="muted">Старые демонстрационные задания изолированы. Пока здесь видна только подтверждённая Goethe B1 task map, а обучение откроется после content QA.</p>'+button('Открыть модули','open-modules','secondary')+'</div></div>';
}
function routeView(){
  const r=ensureResult();if(!r)return diagnosticGate();
  let html='<span class="eyebrow">Первый персональный маршрут</span><h1 class="h2">'+esc(r.route.routeType)+'</h1><p class="lead">'+esc(r.route.summary)+'</p><p class="muted">Настройка '+S.dailyMinutes+' минут влияет на будущий объём занятия, но не на placement.</p><div class="stack">';
  r.route.blocks.forEach((b,i)=>html+=card((i+1)+'. '+b.label,esc(b.why)+(b.weight?' · ориентировочный вес '+b.weight+'%':''),b.id.includes('confirm')?'warn':''));
  html+='</div><div class="button-row">'+button('Модули','open-modules','ghost')+button('Evidence / прогресс','open-progress','secondary')+'</div>';return html;
}
function modulesView(){
  let html='<span class="eyebrow">Goethe-Zertifikat B1 · task map</span><h1 class="h2">Четыре модуля</h1><div class="notice">Неподтверждённые старые SAMPLES / TRANSFER / weekly / exam-preview не доступны пользователю. Лучше временно показать, что training content проходит QA, чем выдать A1/A2 материал за B1.</div><div class="modules-grid">';
  MODULES.forEach(m=>html+='<button class="module-pick" data-module="'+m+'"><div class="module-name">'+m+'</div><div class="module-count">'+B1_MAP[m].length+' частей</div></button>');
  return html+'</div>';
}
function moduleView(){
  const m=S.selectedModule;
  let html='<span class="eyebrow">Task map · '+m+'</span><h1 class="h2">'+m+'</h1><div class="exam-map">';
  B1_MAP[m].forEach(row=>html+='<div class="teil-row"><div class="teil-num">'+esc(row[0])+'</div><div><b>'+esc(row[1])+'</b><p>'+esc(row[2])+'</p></div><span class="pill warn">training content QA pending</span></div>');
  return html+'</div><div class="button-row">'+button('← Все модули','open-modules','ghost')+'</div>';
}
function errorsView(){
  const s=S.diagnostic.session;
  const wrong=s.answers.filter(a=>a.correct===false);
  let html='<span class="eyebrow">Диагностические пробелы</span><h1 class="h2">Что уже подтверждено ошибками</h1><div class="stack">';
  wrong.forEach(a=>html+=card(domainLabel(a.skill)+' · '+a.target_band,esc(a.micro_skill)+' · '+esc(a.item_id),'bad'));
  if(!wrong.length)html+=card('Пока нет','Closed-task ошибки не зафиксированы.','soft');
  return html+'</div>';
}
function progressView(){
  const r=ensureResult();if(!r)return diagnosticGate();
  let html='<span class="eyebrow">Evidence</span><h1 class="h2">На чём основан профиль</h1><div class="grid4">';
  ['language_system','Lesen','Hören','Schreiben','Sprechen'].forEach(d=>{
    const v=r.profiles[d];
    html+='<div class="card"><b>'+domainLabel(d)+'</b><p class="muted">'+profileLine(v)+'</p></div>';
  });
  html+='</div>'+card('Productive skills','Schreiben и Sprechen остаются NEED_CONFIRMATION, пока sample не прошёл versioned rubric/audio evaluation. Transcript сам по себе не является оценкой Sprechen.','warn');
  return html;
}

function render(){
  let r=route();
  if(!S.auth.verified&&!['register','verify'].includes(r)){r='register';history.replaceState(null,'','#register');}
  if(S.auth.verified&&!S.diagnostic.session.completed&&!['diagnostic-gate','diagnostic'].includes(r)){r='diagnostic-gate';history.replaceState(null,'','#diagnostic-gate');}
  const views={
    register:registerView,verify:verifyView,'diagnostic-gate':diagnosticGate,diagnostic:diagnosticView,
    report:reportView,home:homeView,route:routeView,modules:modulesView,module:moduleView,
    errors:errorsView,progress:progressView
  };
  $('#screen').innerHTML=(views[r]||registerView)();
  const locked=['register','verify','diagnostic-gate','diagnostic'].includes(r);
  $('#bottomNav').classList.toggle('hidden',locked);
  $('#ottoFab').classList.add('hidden');
  document.querySelectorAll('[data-nav]').forEach(b=>b.classList.toggle('active',b.dataset.nav===r));
}

function click(e){
  const nav=e.target.closest('[data-nav]');if(nav){go(nav.dataset.nav);return;}
  const mod=e.target.closest('[data-module]');if(mod){S.selectedModule=mod.dataset.module;save();go('module');return;}
  const mins=e.target.closest('[data-minutes]');if(mins){captureRegistrationDraft();S.dailyMinutes=Number(mins.dataset.minutes);save();render();return;}
  const ch=e.target.closest('[data-diag-choice]');if(ch){answerDiagnostic(Number(ch.dataset.diagChoice));return;}
  const a=e.target.closest('[data-action]');if(!a)return;
  const x=a.dataset.action;
  if(x==='auth-email'){captureRegistrationDraft();S.auth.method='email';save();render();}
  else if(x==='auth-telegram'){captureRegistrationDraft();S.auth.method='telegram';save();render();}
  else if(x==='register-submit')submitRegistration();
  else if(x==='verify')finishVerification();
  else if(x==='back-register')go('register');
  else if(x==='diag-start')startDiagnostic();
  else if(x==='diag-resume')go('diagnostic');
  else if(x==='diag-audio')playDiagnosticAudio();
  else if(x==='save-writing')saveWriting();
  else if(x==='record-speaking')toggleSpeakingRecord();
  else if(x==='finish-speaking')finishSpeaking(false);
  else if(x==='skip-speaking')finishSpeaking(true);
  else if(x==='speak-otto')speakOtto();
  else if(x==='open-route')go('route');
  else if(x==='open-home')go('home');
  else if(x==='open-modules')go('modules');
  else if(x==='open-progress')go('progress');
}
document.addEventListener('click',click);
$('#resetButton').addEventListener('click',()=>{if(confirm('Сбросить Preview и диагностику?'))reset();});
window.addEventListener('popstate',render);
window.addEventListener('hashchange',render);

window.__OTTO_TEST__={
  getState:()=>JSON.parse(JSON.stringify(S)),
  setState:x=>{S=x;save();render();},
  currentItem:()=>{const x=ENGINE.nextItem(S.diagnostic.session);return x?JSON.parse(JSON.stringify(x)):null;},
  result:()=>S.diagnostic.session.completed?ENGINE.result(S.diagnostic.session):null,
  engine:ENGINE,
  bank:BANK
};

if(!location.hash)history.replaceState(null,'','#register');
render();
