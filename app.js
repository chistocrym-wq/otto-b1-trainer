'use strict';

const BANK=window.OTTO_DIAGNOSTIC_BANK;
const ENGINE=window.OTTO_DIAGNOSTIC_ENGINE;
const STORAGE='ottoB1.diagnostic.v2';
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

const SCREENING_INITIAL=['A12-LS-01','A12-R-01','A21-LS-01','A21-H-01','A22-LS-01','A22-R-01'];
const SCREENING_EXTENDED=['A22-H-01','A22-LS-02','B11-LS-01','B11-R-01','B11-H-01','B12-LS-01'];

const $=s=>document.querySelector(s);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const now=()=>new Date().toISOString();
const uid=p=>p+'-'+Date.now()+'-'+Math.random().toString(36).slice(2,7);
const itemById=id=>BANK.items.find(x=>x.item_id===id);
let memoryFallback=null;
let recorder=null, chunks=[];

function fresh(){
  return {
    version:2,
    auth:{method:'email',contact:'',verified:false},
    name:'',gender:'',examDate:'',dailyMinutes:25,
    diagnostic:{
      diagnostic_version:BANK.version,
      stage:'not_started',
      queue:[],cursor:0,evidence:[],audioPlays:{},
      writingSample:null,speakingSample:null,
      productiveBand:null,productiveStep:0,
      completed:false,result:null,startedAt:null,lastSavedAt:null
    },
    route:[],
    selectedModule:'Lesen'
  };
}
function load(){
  try{
    const raw=localStorage.getItem(STORAGE);
    if(!raw)return fresh();
    const p=JSON.parse(raw);
    const base=fresh();
    return Object.assign(base,p,{auth:Object.assign(base.auth,p.auth||{}),diagnostic:Object.assign(base.diagnostic,p.diagnostic||{})});
  }catch(e){return memoryFallback||fresh();}
}
let S=load();
function save(){S.diagnostic.lastSavedAt=now();try{localStorage.setItem(STORAGE,JSON.stringify(S));}catch(e){memoryFallback=JSON.parse(JSON.stringify(S));}}
function reset(){try{localStorage.removeItem(STORAGE);}catch(e){}memoryFallback=null;S=fresh();history.replaceState(null,'','#register');render();}
function go(r){save();const h='#'+r;if(location.hash!==h)history.pushState(null,'',h);render();}
function route(){return (location.hash||'#register').slice(1);}
function button(label,action,kind='primary',extra=''){return '<button class="btn '+kind+'" data-action="'+action+'" '+extra+'>'+label+'</button>';}
function pill(t,k=''){return '<span class="pill '+k+'">'+esc(t)+'</span>';}
function card(title,body,kind=''){return '<div class="card '+kind+'"><div class="card-title">'+esc(title)+'</div><div class="muted">'+body+'</div></div>';}

function captureRegistrationDraft(){
  const n=$('#regName'),g=$('#regGender'),d=$('#regExamDate'),c=$('#regContact');
  if(n)S.name=n.value;if(g)S.gender=g.value;if(d)S.examDate=d.value;
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
function diagnosticGate(){
  const resume=S.diagnostic.stage!=='not_started'&&!S.diagnostic.completed;
  return '<div class="gate-card"><div class="plain-otto"><img src="'+window.OTTO_SRC+'" alt="Otto"></div><span class="eyebrow">Первичная калибровка</span><h1 class="h1">'+(resume?'Продолжим диагностику':'Сначала — диагностика')+'</h1><p class="lead">Это не короткий тест на один grammar question. Otto сначала сужает диапазон, затем проверяет границу дополнительными независимыми заданиями и отдельно собирает Schreiben/Sprechen evidence.</p><div class="friendly-note" style="text-align:left"><b>Важно:</b> A1.1 / A1.2 / A2.1 / A2.2 / B1.1 / B1.2 — внутренние учебные placement bands, а не официальный сертификат CEFR.</div><div class="button-row">'+button(resume?'Продолжить с сохранённого места':'Начать диагностику',resume?'diag-resume':'diag-start')+'</div></div>';
}
function startDiagnostic(){
  S.diagnostic=Object.assign(fresh().diagnostic,{stage:'screening',queue:SCREENING_INITIAL.slice(),cursor:0,startedAt:now()});
  save();go('diagnostic');
}

function currentDiagnosticItem(){
  if(S.diagnostic.stage==='screening'||S.diagnostic.stage==='boundary')return itemById(S.diagnostic.queue[S.diagnostic.cursor]);
  return null;
}
function remainingMinutes(){
  let secs=0;
  if(['screening','boundary'].includes(S.diagnostic.stage)){
    S.diagnostic.queue.slice(S.diagnostic.cursor).forEach(id=>secs+=(itemById(id)?.expected_duration_sec||45));
    secs+=420;
  }else if(S.diagnostic.stage==='productive')secs=S.diagnostic.productiveStep===0?420:180;
  return Math.max(1,Math.round(secs/60));
}
function stageTitle(){
  return {screening:'Этап A · Wide screening',boundary:'Этап B · Boundary check',productive:'Этап C · Productive evidence',report:'Этап D · Результат'}[S.diagnostic.stage]||'Диагностика';
}
function diagnosticProgress(){
  if(S.diagnostic.stage==='screening')return 20+Math.round((S.diagnostic.cursor/Math.max(1,S.diagnostic.queue.length))*25);
  if(S.diagnostic.stage==='boundary')return 50+Math.round((S.diagnostic.cursor/Math.max(1,S.diagnostic.queue.length))*20);
  if(S.diagnostic.stage==='productive')return 78+S.diagnostic.productiveStep*9;
  return 100;
}
function renderClosed(item){
  let body='';
  if(item.modality==='lesen')body+='<div class="task-text">'+esc(item.text).replace(/\n/g,'<br>')+'</div>';
  if(item.modality==='hoeren'){
    const used=S.diagnostic.audioPlays[item.item_id]||0,limit=item.audio_plays||2;
    body+='<div class="audio-card"><b>Hören</b><span class="small">Прослушано '+used+' из '+limit+'</span>'+button('▶ Воспроизвести','diag-audio','secondary',used>=limit?'disabled':'')+'</div>';
  }
  body+='<p class="lead" style="font-size:17px"><b>'+esc(item.prompt)+'</b></p><div class="choice-grid">';
  item.options.forEach((o,i)=>body+='<button class="choice" data-diag-choice="'+i+'">'+esc(o)+'</button>');
  body+='</div>';
  return body;
}
function diagnosticView(){
  if(S.diagnostic.stage==='report'||S.diagnostic.completed)return reportView();
  if(S.diagnostic.stage==='productive')return productiveView();
  const item=currentDiagnosticItem();
  if(!item)return '<div class="notice">Диагностическая очередь пуста. Продолжаем расчёт…</div>';
  return '<span class="eyebrow">'+stageTitle()+'</span><div class="diag-top"><div><h1 class="h2">'+(S.diagnostic.stage==='screening'?'Сужаем диапазон':'Проверяем предполагаемую границу')+'</h1><p class="muted">'+(S.diagnostic.stage==='screening'?'Задания идут от более простых к более сложным, но сильный или явно слабый профиль не обязан проходить всё.':'Пограничный результат получает больше новых independent evidence points.')+'</p></div><div class="time-left">≈ '+remainingMinutes()+' мин.</div></div><div class="progress-line"><i style="width:'+diagnosticProgress()+'%"></i></div><div class="meta-row">'+pill(item.target_band,'')+pill(item.modality,'')+pill(item.skill,'')+'</div>'+renderClosed(item)+'<div class="button-row">'+button('Ответить','diag-answer')+'</div><p class="small">Ответ автоматически сохранится. Если закрыть страницу, диагностика продолжится с этого места.</p>';
}
function playDiagnosticAudio(){
  const item=currentDiagnosticItem();if(!item||item.modality!=='hoeren')return;
  const used=S.diagnostic.audioPlays[item.item_id]||0,limit=item.audio_plays||2;if(used>=limit)return;
  S.diagnostic.audioPlays[item.item_id]=used+1;save();
  if(!('speechSynthesis'in window))return alert('Системная озвучка недоступна в этом браузере.');
  speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(item.audio_script);u.lang='de-DE';u.rate=item.target_band.startsWith('B1')?.96:item.target_band.startsWith('A2')?.9:.82;speechSynthesis.speak(u);render();
}
function answerDiagnostic(index){
  const item=currentDiagnosticItem();if(!item)return;
  const correct=Number(index)===item.correct;
  S.diagnostic.evidence.push({
    evidence_id:uid('ev'),item_id:item.item_id,modality:item.modality,skill:item.skill,target_band:item.target_band,
    correct,answered_at:now(),duration_ms:null,contributes_to_placement:item.contributes_to_placement,
    contributes_to_b1_exam_gap:item.contributes_to_b1_exam_gap,diagnostic_version:BANK.version
  });
  S.diagnostic.cursor++;save();
  advanceDiagnostic();
}
function advanceDiagnostic(){
  if(S.diagnostic.cursor<S.diagnostic.queue.length){render();return;}
  if(S.diagnostic.stage==='screening'){
    if(S.diagnostic.queue.length===SCREENING_INITIAL.length){
      const first=S.diagnostic.evidence.filter(e=>SCREENING_INITIAL.includes(e.item_id));
      const correct=first.filter(e=>e.correct).length;
      if(correct<=2){planBoundary();return;}
      S.diagnostic.queue=SCREENING_INITIAL.concat(SCREENING_EXTENDED);save();render();return;
    }
    planBoundary();return;
  }
  if(S.diagnostic.stage==='boundary'){startProductive();return;}
}
function planBoundary(){
  const items=ENGINE.requiredBoundaryItems(S.diagnostic.evidence,BANK.items);
  S.diagnostic.stage='boundary';S.diagnostic.queue=items.map(x=>x.item_id);S.diagnostic.cursor=0;save();
  if(!items.length)startProductive();else render();
}
function startProductive(){
  const placement=ENGINE.boundaryDecision(S.diagnostic.evidence);
  S.diagnostic.productiveBand=ENGINE.chooseProductiveBand(placement);
  S.diagnostic.stage='productive';S.diagnostic.productiveStep=0;save();render();
}
function productiveItem(modality){
  const target=S.diagnostic.productiveBand;
  return BANK.productive.find(x=>x.modality===modality&&x.target_band===target)
    || BANK.productive.find(x=>x.modality===modality&&x.target_band==='A2.2');
}
function productiveView(){
  if(S.diagnostic.productiveStep===0){
    const w=productiveItem('schreiben');
    return '<span class="eyebrow">'+stageTitle()+'</span><div class="diag-top"><div><h1 class="h2">Schreiben · реальный productive sample</h1><p class="muted">Prompt выбран по предварительно найденному диапазону: '+esc(S.diagnostic.productiveBand)+'.</p></div><div class="time-left">≈ '+remainingMinutes()+' мин.</div></div><div class="progress-line"><i style="width:'+diagnosticProgress()+'%"></i></div><div class="task-text">'+esc(w.prompt)+'</div><textarea id="writingSample" class="field" rows="11" placeholder="Schreiben Sie auf Deutsch…">'+esc(S.diagnostic.writingSample?.text||'')+'</textarea><div class="notice">Мы не будем автоматически объявлять уровень по длине текста. Sample сохранится со статусом «нужна оценка».</div><div class="button-row">'+button('Сохранить и перейти к Sprechen','save-writing')+'</div>';
  }
  const sp=productiveItem('sprechen');
  return '<span class="eyebrow">'+stageTitle()+'</span><h1 class="h2">Sprechen · productive evidence</h1><p class="lead">'+esc(sp.prompt)+'</p>'+(sp.target_band==='B1.1'?'<div class="speaker"><div class="speaker-avatar"><img src="'+window.OTTO_SRC+'"></div><div><b>Otto — партнёр</b><div class="muted">Vorschlag: Wir könnten den Lerntag am Samstag ab 10 Uhr in der Bibliothek machen. Ich würde aber nur eine kurze Mittagspause planen. Was meinst du?</div></div></div><div class="button-row">'+button('🔊 Otto говорит','speak-otto','secondary')+'</div>':'')+'<div id="recordBox" class="record-box '+(recorder&&recorder.state==='recording'?'recording':'')+'"><span class="record-dot"></span><b> Реальная запись микрофона</b><div class="button-row" style="justify-content:center">'+button(recorder&&recorder.state==='recording'?'■ Остановить':'🎙 Начать запись','record-speaking','secondary')+'</div></div><div class="notice">Speech Recognition transcript не считается оценкой Sprechen. Pronunciation, fluency и качество аудио здесь не выдумываются.</div><div class="button-row">'+button('Сохранить evidence и завершить','finish-speaking')+button('Нет доступа к микрофону','skip-speaking','ghost')+'</div>';
}
function basicWritingGate(text){
  const german=(text.match(/[A-Za-zÄÖÜäöüß]+/g)||[]).length;
  const cyr=(text.match(/[А-Яа-яЁё]+/g)||[]).length;
  return {words:german,valid:german>=18&&german>cyr*2};
}
function saveWriting(){
  const w=productiveItem('schreiben'),text=$('#writingSample').value.trim(),gate=basicWritingGate(text);
  if(!gate.valid)return alert('Нужен осмысленный преимущественно немецкий текст. Русский или случайный набор символов не создаёт productive evidence.');
  S.diagnostic.writingSample={item_id:w.item_id,target_band:w.target_band,text,wordCount:gate.words,evaluation_status:'PENDING_REVIEW',saved_at:now()};
  S.diagnostic.evidence.push({evidence_id:uid('ev'),item_id:w.item_id,modality:'schreiben',skill:'productive_writing',target_band:w.target_band,correct:null,evaluation_status:'PENDING_REVIEW',contributes_to_placement:false,contributes_to_b1_exam_gap:true,answered_at:now()});
  S.diagnostic.productiveStep=1;save();render();
}
async function toggleSpeakingRecord(){
  if(recorder&&recorder.state==='recording'){recorder.stop();recorder.stream.getTracks().forEach(t=>t.stop());return;}
  try{
    const stream=await navigator.mediaDevices.getUserMedia({audio:true});chunks=[];recorder=new MediaRecorder(stream);recorder.stream=stream;
    recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
    recorder.onstop=()=>{const bytes=chunks.reduce((n,b)=>n+b.size,0);S.diagnostic.speakingSample={recorded:bytes>0,bytes,evaluation_status:'PENDING_REVIEW',saved_at:now()};save();recorder=null;render();};
    recorder.start();render();
  }catch(e){alert('Нет доступа к микрофону: '+e.message);}
}
function finishSpeaking(skipped=false){
  const sp=productiveItem('sprechen');
  if(!skipped&&!S.diagnostic.speakingSample?.recorded)return alert('Сначала запишите голосовой образец или выберите «Нет доступа к микрофону».');
  S.diagnostic.evidence.push({evidence_id:uid('ev'),item_id:sp.item_id,modality:'sprechen',skill:sp.skill,target_band:sp.target_band,correct:null,evaluation_status:skipped?'NEED_CONFIRMATION':'PENDING_REVIEW',contributes_to_placement:false,contributes_to_b1_exam_gap:true,answered_at:now(),audio:!skipped});
  finalizeDiagnostic();
}
function finalizeDiagnostic(){
  const placement=ENGINE.boundaryDecision(S.diagnostic.evidence);
  const profiles=ENGINE.profileByDomain(S.diagnostic.evidence);
  const routeBlocks=ENGINE.routeFor(placement,profiles);
  const b1Gaps=S.diagnostic.evidence.filter(e=>e.contributes_to_b1_exam_gap&&e.correct===false).map(e=>({modality:e.modality,skill:e.skill,item_id:e.item_id}));
  S.diagnostic.result={placement,profiles,b1Gaps,completed_at:now(),diagnostic_version:BANK.version};
  S.route=routeBlocks;S.diagnostic.stage='report';S.diagnostic.completed=true;save();go('report');
}
function confidenceRu(c){return c==='high'?'высокая':c==='medium'?'средняя':'низкая';}
function domainLabel(d){return {language_system:'Language system',lesen:'Lesen',hoeren:'Hören',schreiben:'Schreiben',sprechen:'Sprechen'}[d]||d;}
function reportView(){
  if(!S.diagnostic.result)finalizeDiagnostic();
  const r=S.diagnostic.result,p=r.placement;
  let domains='<div class="stack">';
  Object.entries(r.profiles).forEach(([d,v])=>{
    const text=v.status==='NEED_CONFIRMATION'?'требуется подтверждение':(v.band+' · уверенность '+confidenceRu(v.confidence));
    domains+=card(domainLabel(d),text,v.status==='NEED_CONFIRMATION'?'warn':'');
  });domains+='</div>';
  let gaps=r.b1Gaps.length?r.b1Gaps.slice(0,5).map(g=>'<li>'+esc(domainLabel(g.modality))+' · '+esc(g.skill)+'</li>').join(''):'<li>По текущему closed evidence явный B1 exam-gap ещё не подтверждён.</li>';
  return '<span class="eyebrow">Результат диагностики · '+esc(BANK.version)+'</span><h1 class="h2">Текущая учебная зона: ближе к '+esc(p.band)+'</h1><p class="lead">Это внутренняя учебная placement band, а не официальный сертификат CEFR.</p>'+card('Confidence',confidenceRu(p.confidence)+' · '+esc(p.status),p.status==='NEED_CONFIRMATION'?'warn':'good')+'<h3>Профиль по доменам</h3>'+domains+'<h3>До Goethe B1 сейчас важнее всего</h3><div class="card"><ul>'+gaps+'</ul></div>'+card('Почему такой результат',p.why.length?p.why.map(esc).join('<br>'):'Пока недостаточно независимых evidence points для более сильного утверждения.','soft')+'<div class="button-row">'+button('Открыть мой маршрут','open-route')+button('На главную','open-home','ghost')+'</div>';
}
function homeView(){
  const r=S.diagnostic.result;if(!r)return diagnosticGate();
  return '<span class="eyebrow">Моя подготовка</span><h1 class="h2">Здравствуйте, '+esc(S.name)+'</h1><p class="lead">Стартовая гипотеза: ближе к '+esc(r.placement.band)+'. После новых evidence профиль может меняться.</p><div class="mode-grid"><div class="mode-card primary-mode"><h3>Otto ведёт меня</h3><p class="muted">Маршрут уже отличается в зависимости от placement band и слабых доменов.</p>'+button('Посмотреть маршрут','open-route')+'</div><div class="mode-card"><h3>Выбрать модуль</h3><p class="muted">Пока пользовательские B1-тренировки временно закрыты: старый demo content изолирован. Видна только подтверждённая task map.</p>'+button('Открыть модули','open-modules','secondary')+'</div></div>';
}
function routeView(){
  let html='<span class="eyebrow">Первый персональный маршрут</span><h1 class="h2">Маршрут из результата диагностики</h1><p class="lead">Настройка '+S.dailyMinutes+' минут влияет на объём будущих занятий, но не меняет placement.</p><div class="stack">';
  S.route.forEach((b,i)=>html+=card((i+1)+'. '+b.title,b.why+' '+(b.weight?'Ориентировочный вес: '+b.weight+'%.':''),b.type.startsWith('confirm_')?'warn':''));
  html+='</div><div class="button-row">'+button('Модули','open-modules','ghost')+button('Прогресс / evidence','open-progress','secondary')+'</div>';return html;
}
function modulesView(){
  let html='<span class="eyebrow">Goethe B1 task map</span><h1 class="h2">Четыре модуля</h1><div class="notice">Старые SAMPLES больше не доступны как B1-обучение. Полноценные training items будут добавляться только после content QA.</div><div class="modules-grid">';
  MODULES.forEach(m=>html+='<button class="module-pick" data-module="'+m+'"><div class="module-name">'+m+'</div><div class="module-count">'+B1_MAP[m].length+' частей</div></button>');
  return html+'</div>';
}
function moduleView(){
  const m=S.selectedModule;let html='<span class="eyebrow">Task map · '+m+'</span><h1 class="h2">'+m+'</h1><div class="exam-map">';
  B1_MAP[m].forEach(row=>html+='<div class="teil-row"><div class="teil-num">'+esc(row[0])+'</div><div><b>'+esc(row[1])+'</b><p>'+esc(row[2])+'</p></div><span class="pill warn">content QA pending</span></div>');
  return html+'</div><div class="button-row">'+button('← Все модули','open-modules','ghost')+'</div>';
}
function errorsView(){
  const wrong=S.diagnostic.evidence.filter(e=>e.correct===false);
  let html='<span class="eyebrow">Диагностические пробелы</span><h1 class="h2">Что уже подтверждено ошибками</h1><div class="stack">';
  wrong.forEach(e=>html+=card(domainLabel(e.modality)+' · '+e.target_band,esc(e.skill)+' · '+esc(e.item_id),'bad'));
  return html+(wrong.length?'':card('Пока нет','Closed-task ошибки не зафиксированы.','soft'))+'</div>';
}
function progressView(){
  const ev=S.diagnostic.evidence;let html='<span class="eyebrow">Evidence</span><h1 class="h2">На чём основан профиль</h1><div class="grid4">';
  ['language_system','lesen','hoeren','schreiben','sprechen'].forEach(d=>{
    const x=ev.filter(e=>e.modality===d),sc=x.filter(e=>e.correct!==null&&e.correct!==undefined),ok=sc.filter(e=>e.correct).length;
    html+='<div class="card"><b>'+domainLabel(d)+'</b><p class="muted">Evidence: '+x.length+'<br>Closed scored: '+sc.length+(sc.length?'<br>Correct: '+ok+'/'+sc.length:'')+'</p></div>';
  });
  return html+'</div>'+card('Productive skills','Schreiben и Sprechen могут оставаться NEED_CONFIRMATION, пока sample не прошёл полноценную rubric/audio evaluation.','warn');
}
function speakOtto(){
  if(!('speechSynthesis'in window))return;
  const u=new SpeechSynthesisUtterance('Wir könnten den Lerntag am Samstag ab zehn Uhr in der Bibliothek machen. Ich würde aber nur eine kurze Mittagspause planen. Was meinst du?');u.lang='de-DE';u.rate=.92;speechSynthesis.speak(u);
}

function render(){
  let r=route();
  if(!S.auth.verified&&!['register','verify'].includes(r)){r='register';history.replaceState(null,'','#register');}
  if(S.auth.verified&&!S.diagnostic.completed&&!['diagnostic-gate','diagnostic'].includes(r)){r='diagnostic-gate';history.replaceState(null,'','#diagnostic-gate');}
  const view={register:registerView,verify:verifyView,'diagnostic-gate':diagnosticGate,diagnostic:diagnosticView,report:reportView,home:homeView,route:routeView,modules:modulesView,module:moduleView,errors:errorsView,progress:progressView}[r]||registerView;
  $('#screen').innerHTML=view();
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
  currentItem:()=>{const x=ENGINE.nextItem(S.diagnostic);return x?JSON.parse(JSON.stringify(x)):null;},
  result:()=>S.diagnostic.completed?ENGINE.result(S.diagnostic):null
};

if(!location.hash)history.replaceState(null,'','#register');
render();
