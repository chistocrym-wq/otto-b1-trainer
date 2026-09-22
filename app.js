'use strict';

const BANK=window.OTTO_DIAGNOSTIC_BANK;
const ENGINE=window.OTTO_DIAGNOSTIC_ENGINE;
const GUIDE=window.OTTO_GUIDE_B1;
const LEARNING=window.OTTO_LEARNING_BANK;
const FULL=window.OTTO_FULL_LEARNING;
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
let lessonRecorder=null,lessonChunks=[],lessonAudioBlob=null,lessonAudioUrl=null,micTestBlob=null,micTestUrl=null;

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
    selectedModule:'Lesen',
    selectedGuide:'Lesen',
    assistanceEvidence:[],
    learning:{
      module:'Lesen',teil:1,mode:'training',supportLevel:1,index:0,
      answers:[null,null,null,null,null,null],checked:[false,false,false,false,false,false],
      translation:false,instructionHelp:false,strategy:false,dictionary:false,dictionaryAll:false,
      helpOpen:false,review:false,completed:false
    },
    ui:{ottoOpen:false,helpOpen:false,micHelp:false},
    task_history:{},
    learningErrors:[],
    lesson:{task_id:null,mode:'training',index:0,answers:{},checked:{},audioPlays:{},translation:false,strategy:false,dictionary:false,sample:false,userText:'',submitted:false,feedback:null,transcript:'',assistance_used:false,micStatus:'',recordingReady:false},
    ottoChat:{messages:[],sending:false,error:null},
    dailySession:{started:false,date:null,plan:[],index:0,completed:[],finished:false}
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
function normalizeRuntimeState(){
  if(!S.assistanceEvidence)S.assistanceEvidence=[];
  if(!S.learning)S.learning=fresh().learning;
  else S.learning=Object.assign(fresh().learning,S.learning);
  if(!S.ui)S.ui={ottoOpen:false,helpOpen:false,micHelp:false};
  else S.ui=Object.assign({ottoOpen:false,helpOpen:false,micHelp:false},S.ui);
  if(!S.dailySession)S.dailySession={started:false,date:null,plan:[],index:0,completed:[],finished:false};
  if(!S.task_history)S.task_history={};
  if(!S.learningErrors)S.learningErrors=[];
  if(!S.lesson)S.lesson=fresh().lesson; else S.lesson=Object.assign(fresh().lesson,S.lesson);
  if(!S.ottoChat)S.ottoChat={messages:[],sending:false,error:null};
  if(FULL)FULL.ensureState(S);
  if(!S.selectedGuide)S.selectedGuide=S.selectedModule||'Lesen';
}
normalizeRuntimeState();

function save(){
  try{localStorage.setItem(STORAGE,JSON.stringify(S));}
  catch(e){memoryFallback=JSON.parse(JSON.stringify(S));}
}
function reset(){
  try{localStorage.removeItem(STORAGE);}catch(e){}
  memoryFallback=null;S=fresh();normalizeRuntimeState();history.replaceState(null,'','#register');render();
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
    language_system:'Языковая база',vocabulary:'Словарный запас',grammar:'Грамматика',
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
    : '<div class="friendly-note"><b>Telegram</b><br>Вход через Telegram пока не подключён. Сейчас профиль сохраняется только в этом браузере на этом устройстве.</div>';
  return '<section class="first-onboarding"><div class="first-copy"><span class="kicker">Тренажёр Otto · Goethe-Zertifikat B1</span><h1 class="h1">Готовимся к сертификату B1</h1><p class="lead">Чем точнее мы определим старт, тем меньше времени вы потратите на слишком лёгкие или слишком сложные задания.</p><div class="auth-card"><h2>Регистрация</h2><div class="form-grid"><label><b>Имя</b><input id="regName" class="field" value="'+esc(S.name)+'"></label><label><b>Как к вам обращаться?</b><select id="regGender" class="field"><option value="">Не указывать</option><option value="female" '+(S.gender==='female'?'selected':'')+'>Женский род</option><option value="male" '+(S.gender==='male'?'selected':'')+'>Мужской род</option></select></label><div><b>Способ входа</b><div class="auth-tabs"><button data-action="auth-email" class="'+(S.auth.method==='email'?'active':'')+'">Email</button><button data-action="auth-telegram" class="'+(S.auth.method==='telegram'?'active':'')+'">Telegram</button></div></div>'+contact+'<label><b>Дата экзамена, если известна</b><input id="regExamDate" class="field" type="date" value="'+esc(S.examDate)+'"></label><div><b>Сколько времени удобно заниматься в обычный день?</b><div class="button-row">'+[10,25,45].map(n=>'<button class="btn '+(S.dailyMinutes===n?'primary':'ghost')+'" data-minutes="'+n+'">'+n+' минут</button>').join('')+'</div><p class="small">Это настройка ежедневного маршрута. Она не ограничивает первоначальную диагностику.</p></div></div><div class="button-row">'+button(S.auth.method==='email'?'Получить код':'Продолжить в Telegram','register-submit')+'</div></div></div><div class="first-otto"><img src="'+window.OTTO_SRC+'" alt="Otto"></div></section>';
}
function verifyView(){
  return '<div class="auth-wrap"><div class="auth-card"><span class="eyebrow">Профиль</span><h1 class="h2">Профиль сохранён</h1><div class="friendly-note"><b>Сейчас:</b> отправка кода на Email и вход через Telegram ещё не подключены. Данные профиля сохраняются локально в вашем браузере. Можно перейти к диагностике и начать заниматься.</div><div class="button-row">'+button('Перейти к диагностике','verify')+button('Назад','back-register','ghost')+'</div></div></div>';
}
function submitRegistration(){
  captureRegistrationDraft();
  if(!S.name.trim())return alert('Введите имя.');
  if(S.auth.method==='email'&&!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(S.auth.contact))return alert('Введите корректный email.');
  if(S.auth.method==='telegram')S.auth.contact='Telegram';
  save();go('verify');
}
function finishVerification(){
  S.auth.verified=true;
  save();
  go('diagnostic-gate');
}

function diagnosticStarted(){
  const s=S.diagnostic.session;
  return !!(s&&s.startedAt&&((s.answers&&s.answers.length)||s.phase!=='screening_core'));
}
function diagnosticGate(){
  const resume=diagnosticStarted()&&!S.diagnostic.session.completed;
  return '<div class="gate-card"><div class="plain-otto"><img src="'+window.OTTO_SRC+'" alt="Otto"></div><span class="eyebrow">Определяем точку старта</span><h1 class="h1">'+(resume?'Продолжим диагностику':'Сначала — диагностика')+'</h1><p class="lead">Otto постепенно проверит языковую базу, чтение, понимание речи, письмо и устную речь. Один удачный или неудачный ответ ничего не решает.</p><div class="friendly-note" style="text-align:left"><b>Зачем это нужно:</b> после диагностики тренажёр сам соберёт маршрут и будет давать больше практики именно там, где она полезнее всего.<br><br><b>Можно закрыть страницу:</b> ответы сохраняются, и вы продолжите с того же места.</div><div class="button-row">'+button(resume?'Продолжить с сохранённого места':'Начать диагностику',resume?'diag-resume':'diag-start')+'</div></div>';
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
  if(phase==='screening_core'||phase==='screening_path')return 'Определяем ваш стартовый уровень';
  if(phase==='boundary'||phase==='boundary_extra')return 'Уточняем результат';
  if(phase==='closed_complete'||phase==='writing')return 'Проверяем письменную речь';
  if(phase==='speaking')return 'Проверяем устную речь';
  return 'Готовим результат';
}
function phaseCopy(phase){
  if(phase==='screening_core')return 'Начинаем с заданий разной сложности и постепенно сужаем диапазон.';
  if(phase==='screening_path')return 'Otto уже подбирает следующие задания по вашим ответам.';
  if(phase==='boundary')return 'Нужно ещё несколько независимых ответов, чтобы не делать вывод по одной случайной попытке.';
  if(phase==='boundary_extra')return 'Ответы получились близкими по уровню, поэтому Otto добавил короткую перепроверку.';
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
    html+='<div class="audio-card"><div><b>Проверяем понимание речи</b><div class="small">Диагностическое аудио можно прослушать до 2 раз. Прослушано: '+used+'/2.</div></div>'+button('▶ Воспроизвести','diag-audio','secondary',used>=2?'disabled':'')+'</div>';
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
  const human=item.modality==='audio'?'Понимание речи':item.skill==='Lesen'?'Чтение':item.skill==='grammar'?'Грамматика':item.skill==='vocabulary'?'Лексика':'Языковая база';
  return '<span class="eyebrow">'+stageTitle(s.phase)+'</span><div class="diag-top"><div><h1 class="h2">'+human+'</h1><p class="muted">'+phaseCopy(s.phase)+'</p></div><div class="time-left">≈ '+remainingMinutes()+' мин.</div></div><div class="progress-line"><i style="width:'+pct+'%"></i></div>'+renderClosed(item)+'<p class="small">Каждый ответ сохраняется автоматически. Закрыли страницу — продолжите с этого места.</p>';
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
    return '<span class="eyebrow">'+stageTitle(s.phase)+'</span><div class="diag-top"><div><h1 class="h2">Напишите короткий ответ по-немецки</h1><p class="muted">Живой образец письма делает диагностику точнее. Если сейчас не готовы — этот шаг можно пропустить.</p></div><div class="time-left">≈ '+remainingMinutes()+' мин.</div></div><div class="progress-line"><i style="width:80%"></i></div><div class="friendly-note"><b>Что делать:</b> прочитайте условие и напишите связный ответ по-немецки. Постарайтесь выполнить все пункты задания.</div><div class="task-text">'+esc(w.prompt)+'</div><textarea id="writingSample" class="field" rows="11" placeholder="Schreiben Sie auf Deutsch…">'+esc(s.writing?.text||'')+'</textarea><div class="notice">Если пропустите, общий стартовый ориентир всё равно будет рассчитан по закрытой части диагностики; Schreiben останется навыком для последующего уточнения.</div><div class="button-row">'+button('Сохранить и перейти к Sprechen','save-writing')+button('Пропустить Schreiben','skip-writing','ghost')+'</div>';
  }
  if(s.phase==='speaking')return speakingView();
  return reportView();
}
function saveWriting(){
  const s=S.diagnostic.session,w=ENGINE.selectWritingPrompt(s),text=$('#writingSample').value.trim(),gate=writingGate(text,w);
  if(!gate.valid)return alert('Нужен осмысленный преимущественно немецкий текст минимум примерно '+gate.min+' слов. Если сейчас не готовы — нажмите «Пропустить Schreiben».');
  ENGINE.saveWritingSample(s,w.item_id,text,{gate_version:'meaningful-german-v1'});
  S.diagnostic.speakingIndex=0;save();render();
}
function skipWriting(){
  const s=S.diagnostic.session,w=ENGINE.selectWritingPrompt(s);
  ENGINE.skipWritingSample(s,w.item_id);
  S.diagnostic.speakingIndex=0;save();render();
}
function speakingView(){
  const s=S.diagnostic.session,prompts=ENGINE.selectSpeakingPrompts(s),i=S.diagnostic.speakingIndex,p=prompts[i];
  if(!p){ENGINE.markComplete(s);S.diagnostic.result=ENGINE.result(s);save();return reportView();}
  const b1=p.item_id==='S-B1';
  return '<span class="eyebrow">'+stageTitle(s.phase)+'</span><div class="diag-top"><div><h1 class="h2">Sprechen · речевой образец</h1><p class="muted">'+(b1?'Здесь важно не только говорить самому, но и реагировать на партнёра.':'Запишите короткий ответ по-немецки. Главное — естественная понятная речь, а не заученный текст.')+'</p></div><div class="time-left">≈ '+remainingMinutes()+' мин.</div></div><div class="progress-line"><i style="width:'+(88+i*5)+'%"></i></div><div class="task-text">'+esc(p.prompt)+'</div>'+
    (b1?'<div class="speaker"><div class="speaker-avatar"><img src="'+window.OTTO_SRC+'" alt="Otto"></div><div><b>Otto — партнёр</b><div class="muted">Wir könnten den Lerntag am Samstag ab zehn Uhr in der Bibliothek machen. Ich würde aber nur eine kurze Mittagspause planen. Was meinst du?</div></div></div><div class="button-row">'+button('🔊 Otto говорит','speak-otto','secondary')+'</div>':'')+
    '<div id="recordBox" class="record-box '+(recorder&&recorder.state==='recording'?'recording':'')+'"><span class="record-dot"></span><b> Реальная запись микрофона</b><div class="button-row" style="justify-content:center">'+button(recorder&&recorder.state==='recording'?'■ Остановить':'🎙 Начать запись','record-speaking','secondary')+button('Как разрешить микрофон','mic-help','ghost')+'</div></div>'+
    (S.ui.micHelp?'<div class="friendly-note"><b>Как разрешить микрофон:</b> нажмите значок замка/настроек слева от адреса сайта → «Микрофон» → «Разрешить», затем обновите страницу. В Windows: Параметры → Конфиденциальность и безопасность → Микрофон → включите доступ для приложений и браузера.</div>':'')+
    (S.diagnostic.micError?'<div class="notice"><b>Микрофон пока недоступен:</b> '+esc(S.diagnostic.micError)+'</div>':'')+
    '<div class="notice">Если вы не готовы говорить сейчас, Sprechen можно полностью пропустить. Общий стартовый ориентир всё равно будет рассчитан по остальной диагностике.</div><div class="button-row">'+button('Сохранить этот sample','finish-speaking')+button('Пропустить Sprechen','skip-speaking','ghost')+'</div>';
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
  }catch(e){
    S.diagnostic.micError=(e&&e.name==='NotAllowedError')?'Браузер отклонил разрешение. Разрешите микрофон для этого сайта и попробуйте снова.':(e&&e.message?e.message:'Не удалось открыть микрофон.');
    S.ui.micHelp=true;save();render();
  }
}
function skipAllSpeaking(){
  const s=S.diagnostic.session,prompts=ENGINE.selectSpeakingPrompts(s);
  for(let i=S.diagnostic.speakingIndex;i<prompts.length;i++){
    const p=prompts[i];
    ENGINE.saveSpeakingSample(s,p.item_id,{audio:false,bytes:0,interaction:false,evaluation_status:'SKIPPED'});
  }
  S.diagnostic.lastRecording=null;
  S.diagnostic.speakingIndex=prompts.length;
  ENGINE.markComplete(s);
  S.diagnostic.result=ENGINE.result(s);
  save();go('report');
}
function finishSpeaking(skipped=false){
  const s=S.diagnostic.session,prompts=ENGINE.selectSpeakingPrompts(s),p=prompts[S.diagnostic.speakingIndex];
  if(!p){ENGINE.markComplete(s);S.diagnostic.result=ENGINE.result(s);save();return go('report');}
  if(!skipped&&!S.diagnostic.lastRecording?.recorded)return alert('Сначала запишите ответ или выберите «Пропустить Sprechen».');
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
  if(v.status==='NEED_CONFIRMATION')return 'будем уточнять в занятиях · проверок: '+v.evidenceCount;
  return (v.band?'ориентир '+v.band:'зона пока не определена')+' · уверенность '+confidenceRu(v.confidence)+' · проверок: '+v.evidenceCount;
}
function placementHeading(r){
  const b=r.placement.band||r.placement.closerTo;
  return b?'Ваш стартовый ориентир: '+b:'Стартовый ориентир определён';
}
function readinessRecommendation(r){
  const b=r.placement.band||r.placement.closerTo||'A2.1';
  const correct=(S.diagnostic.session.answers||[]).filter(x=>x.correct).length;
  if(b==='A1.1'&&correct<=2)return {kind:'START',title:'Сначала Otto Start',text:'Сейчас полезнее начать с самых базовых конструкций и словаря, а затем вернуться к B1-диагностике.'};
  if(b==='A1.1')return {kind:'A1',title:'Сначала Otto A1',text:'B1 пока будет слишком резким скачком. Надёжнее укрепить A1, а затем вернуться сюда.'};
  return {kind:'B1',title:'Можно строить маршрут к B1',text:'База уже позволяет готовиться здесь: Otto будет дозировать B1 и закрывать пробелы по ходу занятий.'};
}
function humanRouteTitle(type){
  if(type==='FOUNDATION_FIRST')return 'Сначала укрепим базу';
  if(type==='BRIDGE_TO_B1')return 'Мост от текущего уровня к B1';
  if(type==='B1_EXAM_FOCUSED')return 'Фокус на формате Goethe B1';
  return 'Персональный маршрут Otto';
}
function humanRouteCopy(text){
  return String(text||'')
    .replace(/B1 tasks/gi,'задания уровня B1')
    .replace(/Goethe B1 task families/gi,'типы заданий Goethe B1')
    .replace(/task families/gi,'типы экзаменационных заданий')
    .replace(/B1 practice/gi,'практики уровня B1')
    .replace(/practice/gi,'практики')
    .replace(/Timing \+ mocks/gi,'Работа на время и пробные экзамены')
    .replace(/timing/gi,'работу на время')
    .replace(/mocks/gi,'пробные экзамены')
    .replace(/paraphrase/gi,'перефразирование')
    .replace(/B1-oriented/gi,'уровня B1')
    .replace(/Lesen\/Hören/g,'чтение и понимание речи');
}
function reportView(){
  const r=ensureResult();
  if(!r)return diagnosticGate();
  let domains='<div class="stack">';
  ['language_system','vocabulary','grammar','Lesen','Hören','Schreiben','Sprechen'].forEach(function(d){
    const v=r.profiles[d];
    domains+=card(domainLabel(d),profileLine(v),v.status==='NEED_CONFIRMATION'?'warn':'');
  });
  domains+='</div>';
  let gaps=r.gaps.length?r.gaps.map(function(g){return '<li><b>'+esc(domainLabel(g.module))+'</b> — '+esc(humanRouteCopy(g.reason))+'</li>';}).join(''):'<li>Сейчас нет одного явного провала. Дальше Otto будет уточнять профиль на новых заданиях.</li>';
  const rec=readinessRecommendation(r);
  return '<span class="eyebrow">Результат диагностики</span><h1 class="h2">'+esc(placementHeading(r))+'</h1><p class="lead">Это учебный стартовый ориентир для маршрута, а не официальный сертификат CEFR. Пропущенные Schreiben/Sprechen не мешают определить рабочую стартовую зону по закрытым заданиям.</p>'+
    card(rec.title,rec.text,rec.kind==='B1'?'good':'warn')+
    card('Насколько уверенно можно использовать результат',confidenceRu(r.placement.confidence),r.placement.confidence==='low'?'warn':'good')+
    '<h3>Что видно по отдельным навыкам</h3>'+domains+
    '<h3>До Goethe B1 сейчас важнее всего</h3><div class="card"><ul>'+gaps+'</ul></div>'+
    '<div class="button-row">'+button('Начать первое занятие','start-first')+button('Посмотреть мой маршрут','open-route','secondary')+button('Гид B1: понять экзамен','open-guide','ghost')+'</div>';
}

function homeView(){
  const r=ensureResult();if(!r)return diagnosticGate();
  const p=r.placement.band||r.placement.closerTo||'старт определён';
  const resume=FULL&&FULL.shouldResume(S);
  return '<span class="eyebrow">Моя подготовка</span><h1 class="h2">Здравствуйте, '+esc(S.name)+'</h1><p class="lead">Текущий ориентир: '+esc(p)+'. Otto будет менять маршрут по мере новых попыток.</p>'+
    '<div class="mode-grid"><div class="mode-card primary-mode"><span class="subtle-label">Основной режим</span><h3>Otto ведёт меня</h3><p class="muted">'+esc(humanRouteCopy(r.route.summary))+'</p>'+button(resume?'Продолжить занятие':'Начать занятие на сегодня',resume?'resume-session':'start-first')+'</div>'+
    '<div class="mode-card"><span class="subtle-label">Свободная практика</span><h3>Выбрать модуль</h3><p class="muted">Можно отдельно открыть Lesen, Hören, Schreiben или Sprechen и выбрать часть экзамена.</p>'+button('Открыть модули','open-modules','secondary')+'</div></div>'+
    '<div class="grid2"><div class="card soft"><span class="eyebrow">Учебный справочник</span><h3>Гид B1</h3><p class="muted">Как проходит экзамен, стратегии, образцы, шаблоны и подсказки — простым русским языком.</p>'+button('Открыть Гид B1','open-guide','secondary')+'</div>'+
    '<div class="card soft"><span class="eyebrow">От учёбы к экзамену</span><h3>Помощи становится меньше</h3><p class="muted">Сначала можно учиться с объяснениями. Затем перевод, шаблоны и подсказки постепенно убираются. В режиме «Как на экзамене» во время попытки помощи нет.</p></div></div>';
}
function routeView(){
  const r=ensureResult();if(!r)return diagnosticGate();
  const rec=readinessRecommendation(r);
  if(rec.kind==='START')return '<span class="eyebrow">Ваш следующий шаг</span><h1 class="route-human">Сначала Otto Start</h1><p class="lead">'+esc(rec.text)+'</p>'+card('Почему так','Если базовые A1-задания пока нестабильны, погружение в B1 только перегружает. Вернитесь к B1 после базового курса.','warn')+'<div class="button-row"><a class="btn primary" href="https://otto-start.netlify.app/" target="_blank" rel="noopener">Открыть Otto Start</a>'+button('На главную','open-home','ghost')+'</div>';
  if(rec.kind==='A1')return '<span class="eyebrow">Ваш следующий шаг</span><h1 class="route-human">Сначала Otto A1</h1><p class="lead">'+esc(rec.text)+'</p>'+card('Рекомендация Otto','Сначала закрепите A1, затем вернитесь в этот тренажёр и пройдите диагностику снова.','warn')+'<div class="button-row"><a class="btn primary" href="https://otto-a1-new.netlify.app/" target="_blank" rel="noopener">Открыть Otto A1</a>'+button('На главную','open-home','ghost')+'</div>';
  let html='<span class="eyebrow">Персональный маршрут</span><h1 class="route-human">'+esc(humanRouteTitle(r.route.routeType))+'</h1><p class="lead">'+esc(humanRouteCopy(r.route.summary))+'</p><div class="friendly-note"><b>Otto ведёт вас сам.</b> Нажмите ниже — откроется сегодняшняя последовательность на '+S.dailyMinutes+' минут.</div><div class="button-row">'+button('Начать сегодняшнюю сессию','start-session')+'</div><div class="stack">';
  r.route.blocks.forEach(function(b,i){html+=card((i+1)+'. '+humanRouteCopy(b.label),esc(humanRouteCopy(b.why))+(b.weight?' · ориентир по времени '+b.weight+'%':''));});
  return html+'</div><div class="button-row">'+button('Выбрать модуль вручную','open-modules','ghost')+button('Гид B1','open-guide','secondary')+'</div>';
}
function sessionPlan(){
  const r=ensureResult();if(!r||!FULL)return [];
  if(!FULL.shouldResume(S))FULL.buildPlan(S,r);
  return S.dailySession.plan||[];
}
function sessionView(){
  const plan=sessionPlan();
  if(!plan.length)return '<span class="eyebrow">Сегодня</span><h1 class="h2">Занятие пока не собрано</h1><div class="button-row">'+button('Собрать занятие','start-first')+'</div>';
  const current=S.dailySession.index||0;
  let html='<span class="eyebrow">Сегодня · '+S.dailyMinutes+' минут</span><h1 class="h2">План занятия</h1><p class="lead">Otto уже выбрал задания по диагностике, ошибкам и истории повторений.</p><div class="stack">';
  plan.forEach(function(x,i){html+=card((i+1)+'. '+x.module+(i===current?' · сейчас':''),'Часть '+x.part+' · примерно '+x.minutes+' мин.',i<current?'good':i===current?'soft':'');});
  return html+'</div><div class="button-row">'+button('Перейти к текущему заданию','resume-session')+'</div>';
}
function modulesView(){
  let html='<span class="eyebrow">Goethe-Zertifikat B1</span><h1 class="h2">Четыре модуля</h1><p class="lead">Сначала смысл, потом терминология: откройте модуль, посмотрите, как он устроен на экзамене, и переходите к доступной проверенной тренировке.</p>'+
    '<div class="notice">В тренировку попадают только задания, которые прошли проверку структуры и комплектности.</div>'+
    '<div class="button-row">'+button('Открыть Гид B1','open-guide','secondary')+'</div><div class="modules-grid">';
  MODULES.forEach(function(m){
    const g=GUIDE.modules[m];
    html+='<button class="module-pick" data-module="'+m+'"><div class="module-name">'+m+'</div><div class="module-count">'+esc(g.exam.duration)+' · '+esc(g.exam.parts)+'</div><div class="small" style="margin-top:9px">'+esc(g.summary)+'</div></button>';
  });
  return html+'</div>';
}
function moduleView(){
  const m=S.selectedModule,g=GUIDE.modules[m],published=(window.OTTO_CONTENT_CATALOG&&window.OTTO_CONTENT_CATALOG[m])||{};
  let html='<div class="module-head"><div><span class="eyebrow">Модуль Goethe B1</span><h1 class="h2">'+esc(m)+'</h1><p class="lead">'+esc(g.summary)+'</p></div><div class="module-meta"><span class="meta-chip">'+esc(g.exam.parts)+'</span></div></div>'+
    '<div class="button-row">'+button('Помощь по '+m,'open-help','secondary')+button('Открыть '+m+' в Гиде B1','open-guide-module','ghost')+'</div><div class="exam-map">';
  g.parts.forEach(function(part){
    const sets=published[String(part.id)]||published[part.id]||[];
    html+='<div class="teil-row"><div class="teil-num">'+esc(part.label.split(' — ')[0])+'</div><div><b>'+esc(part.label.split(' — ').slice(1).join(' — '))+'</b><p>'+esc(part.what)+'</p><div class="small">'+esc(part.count)+' · '+esc(part.format)+' · '+esc(part.time)+'</div></div>';
    if(sets.length){
      html+='<div><span class="pill part-ready">'+sets.length+' вариантов</span><div class="button-row" style="margin-top:8px"><button class="btn secondary" data-start-full="'+part.id+'" data-mode="training">Тренировать</button><button class="btn ghost" data-start-full="'+part.id+'" data-mode="exam">Как на экзамене</button></div></div>';
    }else html+='<span class="pill part-pending">Готовится</span>';
    html+='</div>';
  });
  return html+'</div><div class="button-row">'+button('← Все модули','open-modules','ghost')+'</div>';
}
function errorsView(){
  const ds=S.diagnostic.session;
  const wrong=ds.answers.filter(function(a){return a.correct===false;});
  let models=wrong.map(errorModel);
  const le=S.learning&&S.learning.answerEvidence?Object.values(S.learning.answerEvidence).filter(function(x){return x.correct===false;}):[];
  le.forEach(function(){models.push(ERROR_MODELS.evidence_and_paraphrase);});
  if(Array.isArray(S.learningErrors))S.learningErrors.forEach(function(x){models.push(errorModel(x));});
  let html='<span class="eyebrow">Мои ошибки</span><h1 class="h2">Разбираем и превращаем в тренировку</h1><p class="lead">Здесь только понятные объяснения: что произошло, почему это важно и что потренировать дальше.</p><div class="stack">';
  models.forEach(function(m,i){html+=errorCard(m,i);});
  if(!models.length)html+=card('Пока пусто','После реальных попыток здесь появятся ошибки с объяснением и кнопкой для повторения.','soft');
  return html+'</div>';
}
function humanMicroSkill(x){
  const m=ERROR_MODELS[String(x||'')];
  return m?m.title:'Здесь нужна ещё одна тренировка';
}
function progressView(){
  const r=ensureResult();if(!r)return diagnosticGate();
  let html='<span class="eyebrow">Прогресс</span><h1 class="h2">На чём основан профиль</h1><div class="grid4">';
  ['language_system','Lesen','Hören','Schreiben','Sprechen'].forEach(function(d){
    const v=r.profiles[d];
    html+='<div class="card"><b>'+domainLabel(d)+'</b><p class="muted">'+profileLine(v)+'</p></div>';
  });
  html+='</div>'+card('Письмо и устная речь','Письменную и устную речь мы продолжаем уточнять на следующих заданиях. Расшифровка записи помогает разобрать содержание, но сама по себе не оценивает произношение или беглость.','warn')+
    card('Использование помощи','Зафиксировано действий с переводом / стратегией / словарём / помощью: '+S.assistanceEvidence.length+'. Такие попытки не считаются полностью самостоятельными.','soft');
  return html;
}

/* ---------- Guide B1: one source of truth, global + contextual entry ---------- */
function listHtml(items){return '<ul>'+items.map(function(x){return '<li>'+esc(x)+'</li>';}).join('')+'</ul>';}
function guidePartRows(g){
  return '<div class="stack">'+g.parts.map(function(p){
    return '<div class="card"><b>'+esc(p.label)+'</b><p class="muted">'+esc(p.what)+'</p><div class="small">'+esc(p.count)+' · '+esc(p.format)+' · '+esc(p.time)+'</div><div class="notice"><b>Типичная ловушка:</b> '+esc(p.trap)+'</div></div>';
  }).join('')+'</div>';
}
function renderPhraseBank(bank){
  let html='<div class="phrase-grid">';
  Object.keys(bank||{}).forEach(function(cat){
    html+='<details class="guide-section"><summary>'+esc(cat)+'</summary><div class="guide-body">';
    bank[cat].forEach(function(p){html+='<div class="phrase-row"><div><b>'+esc(p[0])+'</b><div class="small">'+esc(p[2])+'</div></div><div>'+esc(p[1])+'</div></div>';});
    html+='</div></details>';
  });
  return html+'</div>';
}
function renderWritingSamples(g){
  let html='';
  [1,2,3].forEach(function(n){
    const s=g.samples&&g.samples[n]&&g.samples[n][0];if(!s)return;
    html+='<div class="sample-card"><span class="pill">Aufgabe '+n+'</span><h4>'+esc(s.title)+'</h4><div class="small"><b>Условие:</b> '+esc(s.task)+'</div><div class="sample-text">'+esc(s.text)+'</div><details class="guide-section"><summary>Показать перевод и разбор</summary><div class="guide-body"><p>'+esc(s.translation)+'</p><p><b>Структура:</b> '+esc(s.structure.join(' → '))+'</p><p><b>Почему это работает:</b> '+esc(s.why)+'</p>'+(s.vocabulary&&s.vocabulary.length?'<p><b>Vocabulary:</b></p><ul>'+s.vocabulary.map(function(v){return '<li><b>'+esc(v[0])+'</b> — '+esc(v[1])+'</li>';}).join('')+'</ul>':'')+'</div></details></div>';
  });
  return html;
}
function renderScaffolding(g){
  return '<div class="stack">'+(g.scaffolding||[]).map(function(x){
    return '<div class="card"><b>Уровень '+x.level+' — '+esc(x.title)+'</b><p class="muted">'+esc(x.help)+'</p></div>';
  }).join('')+'</div>';
}
function guideView(){
  const m=S.selectedGuide||'Lesen',g=GUIDE.modules[m];
  let html='<div class="guide-hero"><div><span class="eyebrow">'+esc(GUIDE.title)+'</span><h1 class="h2">'+esc(GUIDE.subtitle)+'</h1><p class="lead">Здесь всё объясняется простым русским языком. Немецкий остаётся там, где он нужен для реальной подготовки.</p></div><span class="pill good">актуальная структура B1</span></div><div class="guide-tabs">';
  MODULES.forEach(function(x){html+='<button class="guide-tab '+(x===m?'active':'')+'" data-guide-module="'+x+'">'+x+'</button>';});
  html+='</div><div class="fact-grid"><div class="fact"><span class="small">Время</span><strong>'+esc(g.exam.duration)+'</strong></div><div class="fact"><span class="small">Структура</span><strong>'+esc(g.exam.parts)+'</strong></div><div class="fact"><span class="small">Формат</span><strong>'+esc(g.exam.scored)+'</strong></div></div>'+
    '<details class="guide-section" open><summary>1. Как проходит на экзамене</summary><div class="guide-body"><p>'+esc(g.summary)+'</p><p>'+esc(g.exam.aids)+'</p></div></details>'+
    '<details class="guide-section" open><summary>2. Blitz & Fakten — главное за минуту</summary><div class="guide-body">'+listHtml(g.blitz)+'</div></details>'+
    '<details class="guide-section"><summary>3. Части экзамена</summary><div class="guide-body">'+guidePartRows(g)+'</div></details>'+
    '<details class="guide-section"><summary>4. Стратегия Otto</summary><div class="guide-body">'+listHtml(g.strategy)+'</div></details>'+
    '<details class="guide-section"><summary>5. Типичные ошибки</summary><div class="guide-body">'+listHtml(g.errors)+'</div></details>';

  if(m==='Lesen'&&g.worked_example){
    const w=g.worked_example;
    html+='<details class="guide-section"><summary>6. Worked example — как искать доказательство</summary><div class="guide-body"><p><b>Текст:</b> '+esc(w.text)+'</p><p><b>Утверждение:</b> '+esc(w.question)+'</p><p><b>Ход мысли:</b> '+esc(w.reasoning)+'</p><p><b>Доказательство:</b> '+esc(w.evidence)+'</p><p><b>Ответ:</b> '+esc(w.answer)+'</p><p><b>Ловушка:</b> '+esc(w.distractor)+'</p></div></details>';
  }
  if(m==='Hören'&&g.speaker_guide){
    html+='<details class="guide-section"><summary>6. Как не потерять говорящего</summary><div class="guide-body">'+listHtml(g.speaker_guide.steps)+'</div></details>';
  }
  if(m==='Schreiben'){
    html+='<details class="guide-section" open><summary>6. Образцы — один хороший вариант</summary><div class="guide-body">'+renderWritingSamples(g)+'</div></details>'+
      '<details class="guide-section"><summary>7. Шаблон</summary><div class="guide-body"><div class="template-box">'+esc(g.template)+'</div><p class="muted">Шаблон — опора, а не текст для заучивания.</p></div></details>'+
      '<details class="guide-section"><summary>8. Phrase bank</summary><div class="guide-body">'+renderPhraseBank(g.phrase_bank)+'</div></details>'+
      '<details class="guide-section"><summary>9. От образца к самостоятельной работе</summary><div class="guide-body">'+renderScaffolding(g)+'</div></details>';
  }
  if(m==='Sprechen'){
    const p=g.presentation;
    html+='<details class="guide-section" open><summary>6. Образец презентации и её структура</summary><div class="guide-body">'+
      listHtml(p.structure)+'<div class="sample-card"><b>'+esc(p.task)+'</b><div class="sample-text">'+esc(p.sample)+'</div><div class="button-row">'+button('Прослушать образец','guide-speak-sample','secondary')+'</div><details class="guide-section"><summary>Русский перевод</summary><div class="guide-body">'+esc(p.translation)+'</div></details><p class="muted">'+esc(p.note)+'</p></div></div></details>'+
      '<details class="guide-section"><summary>7. Полезные фразы</summary><div class="guide-body"><div class="phrase-grid">'+g.phrases.map(function(x){return '<div class="phrase-row"><b>'+esc(x[0])+'</b><span>'+esc(x[1])+'</span></div>';}).join('')+'</div></div></details>'+
      '<details class="guide-section"><summary>8. От образца к самостоятельной речи</summary><div class="guide-body">'+renderScaffolding(g)+'</div></details>';
  }
  html+='<details class="guide-section"><summary>Чек-лист перед экзаменом</summary><div class="guide-body">'+listHtml(g.checklist)+'</div></details>'+
    '<div class="button-row">'+button('Перейти к модулю '+m,'guide-to-module','primary')+'</div>';
  return html;
}

/* ---------- Contextual help ---------- */
function recordAssistance(kind,context){
  S.assistanceEvidence.push({kind:kind,context:context||route(),at:now()});
  save();
}
function openHelp(){
  if(route()==='learn')recordAssistance('help_used','Lesen Teil 1');
  S.ui.helpOpen=true;S.ui.ottoOpen=false;save();renderModal();
}
function helpModal(){
  const m=S.selectedModule||'Lesen',g=GUIDE.modules[m];
  const phrase=(g.phrases&&g.phrases.length)?'<h4>Полезные фразы</h4><div>'+g.phrases.slice(0,4).map(function(x){return '<p><b>'+esc(x[0])+'</b> — '+esc(x[1])+'</p>';}).join('')+'</div>':'';
  return '<div class="modal-backdrop"><div class="help-drawer"><div class="help-panel"><div class="modal-head"><div><span class="eyebrow">Помощь · '+esc(m)+'</span><h2 style="margin:0">Что делать и на что смотреть</h2></div><button class="close" data-action="close-modal">×</button></div><h4>Как выполнять</h4>'+listHtml(g.strategy.slice(0,4))+phrase+'<div class="help-actions">'+button('Открыть полный Гид B1','help-open-guide','secondary')+button('Закрыть','close-modal','ghost')+'</div></div></div></div>';
}
function ottoModal(){
  return '<div class="modal-backdrop"><div class="modal"><div class="modal-head"><div><span class="eyebrow">Beta</span><h2 style="margin:0">Otto Personal скоро будет доступен</h2></div><button class="close" data-action="close-modal">×</button></div><div class="speaker"><div class="speaker-avatar"><img src="'+window.OTTO_SRC+'" alt="Otto"></div><div><b>Пока без AI-ответов</b><div class="muted">В этой Beta персональный AI-диалог ещё не подключён. Я не буду изображать работу функции, которой пока нет.</div></div></div><div class="button-row">'+button('Открыть Гид B1','otto-open-guide','secondary')+button('Закрыть','close-modal','ghost')+'</div></div></div>';
}
function renderModal(){
  const root=$('#modalRoot');if(!root)return;
  root.innerHTML=S.ui.helpOpen?helpModal():(S.ui.ottoOpen?ottoModal():'');
}

/* ---------- Full original-aligned Lesen Teil 1 ---------- */
function freshLearning(mode){
  return {
    module:'Lesen',teil:1,mode:mode||'training',supportLevel:1,index:0,
    answers:[null,null,null,null,null,null],checked:[false,false,false,false,false,false],
    translation:false,instructionHelp:false,strategy:false,dictionary:false,dictionaryAll:false,
    helpOpen:false,review:false,completed:false,answerEvidence:{}
  };
}
function startLearning(teil,mode){
  if(S.selectedModule!=='Lesen'||Number(teil)!==1)return;
  S.learning=freshLearning(mode);
  if(mode==='exam')S.learning.supportLevel=4;
  save();go('learn');
}
function learningTask(){return LEARNING.published.Lesen[String(S.learning.teil)];}
function assistanceFlags(){
  const l=S.learning;
  return {
    sample_used:false,
    template_used:false,
    phrase_bank_used:false,
    translation_used:!!l.translation,
    strategy_used:!!l.strategy,
    dictionary_used:!!l.dictionary,
    help_used:S.assistanceEvidence.some(function(x){return x.context==='Lesen Teil 1';}),
    support_level:l.supportLevel,
    assisted:l.mode!=='exam'&&(l.supportLevel<3||l.translation||l.strategy||l.dictionary)
  };
}
function glossaryHtml(task){
  const rows=task.glossary.filter(function(x){return S.learning.dictionaryAll||x.kind==='useful';});
  return '<div class="dictionary-list">'+rows.map(function(x){return '<div class="dictionary-row"><div><b>'+esc(x.de)+'</b></div><div class="dict-ru">'+esc(x.ru)+'</div><button class="word-audio" data-speak-word="'+esc(x.de)+'" title="Прослушать">▶</button></div>';}).join('')+'</div><div class="button-row"><button class="btn ghost" data-action="dictionary-all">'+(S.learning.dictionaryAll?'Только полезные слова':'Все слова')+'</button></div>';
}
function trainingTools(task){
  if(S.learning.mode==='exam'||S.learning.supportLevel>=3)return '';
  let html='<div class="task-tools"><button class="chip" data-action="instruction-help">👁 Что нужно сделать?</button><button class="chip" data-action="toggle-translation">👁 Перевод текста</button><button class="chip" data-action="toggle-strategy">☝ Стратегия Otto</button><button class="chip" data-action="toggle-dictionary">Aa Словарь задания</button><button class="chip" data-action="open-help">? Помощь</button></div>';
  if(S.learning.supportLevel===1&&!S.learning.instructionHelp)html+='<div class="friendly-note"><b>Что делать:</b> '+esc(task.instruction_ru)+'</div>';
  if(S.learning.instructionHelp)html+='<div class="friendly-note"><b>Что нужно сделать:</b> '+esc(task.instruction_ru)+'</div>';
  if(S.learning.translation)html+='<div class="translation-box">'+esc(task.translation)+'</div>';
  if(S.learning.strategy)html+='<div class="notice"><b>Стратегия Otto:</b> '+esc(task.strategy)+'</div>';
  if(S.learning.dictionary)html+='<div class="card soft"><b>Словарь задания</b>'+glossaryHtml(task)+'</div>';
  return html;
}
function supportLevels(){
  if(S.learning.mode==='exam')return '';
  return '<div class="support-levels"><span class="small" style="align-self:center"><b>Режим помощи:</b></span>'+
    '<button class="support-level '+(S.learning.supportLevel===1?'active':'')+'" data-support-level="1">1 · Учусь</button>'+
    '<button class="support-level '+(S.learning.supportLevel===2?'active':'')+'" data-support-level="2">2 · Тренируюсь</button>'+
    '<button class="support-level '+(S.learning.supportLevel===3?'active':'')+'" data-support-level="3">3 · Почти экзамен</button></div>';
}
function learningFeedback(task,q,i){
  const selected=S.learning.answers[i],correct=(selected===0)===q.correct;
  const picked=selected===0?'Richtig':'Falsch';
  return '<div class="feedback-card '+(correct?'correct':'wrong')+'"><h3>'+(correct?'✓ Правильно':'✕ Нужно разобрать')+'</h3><p><b>Правильный ответ:</b> '+(q.correct?'Richtig':'Falsch')+'</p><p><b>Почему:</b> '+esc(q.why)+'</p><blockquote>'+esc(q.evidence)+'</blockquote><p><b>Где ловушка:</b> '+esc(q.trap)+'</p>'+(!correct?'<p><b>Почему ваш вариант «'+picked+'» не подходит:</b> он не учитывает смысл доказательства выше.</p>':'')+'<p class="small">В следующий раз сначала найдите доказательство, а уже потом смотрите, совпадают ли слова.</p></div>';
}
function learnView(){
  const task=learningTask(),l=S.learning,i=l.index,q=task.questions[i];
  if(l.completed)return learningSummaryView();
  const exam=l.mode==='exam';
  let html='<div class="learning-shell"><div class="learning-head"><div><span class="eyebrow">'+(exam?'Как на экзамене':'Учебный режим · русская поддержка')+'</span><h1 class="h2">'+(exam?'Lesen · Teil 1':'Lesen Teil 1 — верно или неверно')+'</h1></div><div class="learning-progress">'+(exam?('Aufgabe '+(i+1)+' / 6'):('Задание '+(i+1)+' из 6'))+'</div></div><div class="progress-line"><i style="width:'+(((i+1)/6)*100)+'%"></i></div>';
  if(exam)html+='<div class="exam-lock"><b>Prüfungsmodus.</b> Keine Übersetzung, kein Wörterbuch und keine Tipps während der Bearbeitung.</div>';
  else html+=supportLevels();
  html+='<div class="card soft"><div class="small">Немецкая инструкция</div><b>'+esc(task.german_instruction)+'</b></div>';
  if(!exam)html+=trainingTools(task);
  html+='<div class="learning-text">'+esc(task.text)+'</div><div class="card"><span class="subtle-label">Утверждение '+(i+1)+'</span><h3>'+esc(q.statement)+'</h3>';
  if(!exam&&l.translation)html+='<div class="translation-box">'+esc(q.translation)+'</div>';
  html+='<div class="choice-grid"><button class="choice '+(l.answers[i]===0?'selected':'')+'" data-learn-choice="0" '+(l.checked[i]?'disabled':'')+'>Richtig</button><button class="choice '+(l.answers[i]===1?'selected':'')+'" data-learn-choice="1" '+(l.checked[i]?'disabled':'')+'>Falsch</button></div></div>';
  if(!exam&&l.checked[i])html+=learningFeedback(task,q,i);
  html+='<div class="button-row">';
  if(i>0)html+='<button class="btn ghost" data-action="learn-back">← Назад</button>';
  if(exam){
    html+='<button class="btn primary" data-action="learn-exam-next">'+(i===5?'Завершить Teil':'Далее →')+'</button>';
  }else if(!l.checked[i]){
    html+='<button class="btn primary" data-action="learn-check">Проверить</button>';
  }else{
    html+='<button class="btn primary" data-action="learn-next">'+(i===5?'Завершить Teil':'Далее →')+'</button>';
  }
  html+='</div></div>';return html;
}
function saveLearningEvidence(i){
  const task=learningTask(),q=task.questions[i],sel=S.learning.answers[i],correct=(sel===0)===q.correct,flags=assistanceFlags();
  S.learning.answerEvidence[i]=Object.assign({task_id:task.task_id,question_id:q.id,correct:correct,label:'доказательство / '+(i===4?'изменение плана':i===5?'условие':'деталь')},flags,{at:now()});
  save();
}
function learnCheck(){
  const i=S.learning.index;if(S.learning.answers[i]==null)return alert('Сначала выберите Richtig или Falsch.');
  if(!S.learning.checked[i]){S.learning.checked[i]=true;saveLearningEvidence(i);}
  save();render();
}
function learnNext(){
  if(S.learning.index===5){S.learning.completed=true;save();go('learn-summary');return;}
  S.learning.index++;S.learning.translation=false;S.learning.instructionHelp=false;S.learning.strategy=false;S.learning.dictionary=false;save();render();
}
function learnExamNext(){
  const i=S.learning.index;if(S.learning.answers[i]==null)return alert('Сначала выберите Richtig или Falsch.');
  if(!S.learning.checked[i]){S.learning.checked[i]=true;saveLearningEvidence(i);}
  if(i===5){S.learning.completed=true;save();go('learn-summary');return;}
  S.learning.index++;save();render();
}
function learnBack(){if(S.learning.index>0){S.learning.index--;save();render();}}
function learningSummaryView(){
  const task=learningTask(),ev=Object.values(S.learning.answerEvidence),score=ev.filter(function(x){return x.correct;}).length;
  let html='<div class="learning-shell"><span class="eyebrow">'+(S.learning.mode==='exam'?'Как на экзамене завершён':'Teil завершён')+'</span><h1 class="h2">'+score+' / 6</h1><p class="lead">Главное не число само по себе, а то, какие ошибки повторились и сколько помощи потребовалось.</p>';
  const assisted=ev.filter(function(x){return x.assisted;}).length;
  html+=card('Самостоятельность','Попыток с учебной помощью: '+assisted+' из '+ev.length+'. Перевод или стратегия до ответа делают попытку с учебной помощью.','soft');
  const wrong=ev.filter(function(x){return !x.correct;});
  html+=card('Что Otto будет учитывать дальше',wrong.length?'Нужно вернуться к '+wrong.map(function(x){return x.label;}).join(', ')+'.':'В этом Teil явных повторяющихся ошибок пока не видно. Для устойчивого вывода нужны новые тексты.',''+(wrong.length?'warn':'good'));
  if(S.learning.mode==='exam'&&!S.learning.review){
    html+='<div class="button-row">'+button('Разобрать ответы','learn-review','secondary')+button('Вернуться к Lesen','learn-module','ghost')+'</div></div>';return html;
  }
  if(S.learning.review){
    html+='<h3>Разбор после Exam</h3><div class="review-list">';
    task.questions.forEach(function(q,i){html+=learningFeedback(task,q,i);});
    html+='</div>';
  }
  html+='<div class="button-row">'+button('Вернуться к Lesen','learn-module','primary')+button('Открыть Гид Lesen','learn-guide','ghost')+'</div></div>';return html;
}
function speakText(text){
  if(!('speechSynthesis' in window))return alert('В этом браузере недоступна системная немецкая озвучка.');
  speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang='de-DE';u.rate=.92;speechSynthesis.speak(u);
}
async function shareApp(){
  const data={url:location.origin+location.pathname};
  try{
    if(navigator.share){await navigator.share(data);return;}
    if(navigator.clipboard&&navigator.clipboard.writeText){await navigator.clipboard.writeText(data.url);alert('Ссылка скопирована.');return;}
  }catch(e){if(e&&e.name==='AbortError')return;}
  const ta=document.createElement('textarea');ta.value=data.url;document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove();alert('Ссылка скопирована.');
}


function render(){
  normalizeRuntimeState();
  let r=route();
  if(!S.auth.verified&&!['register','verify'].includes(r)){r='register';history.replaceState(null,'','#register');}
  if(S.auth.verified&&!S.diagnostic.session.completed&&!['diagnostic-gate','diagnostic'].includes(r)){r='diagnostic-gate';history.replaceState(null,'','#diagnostic-gate');}
  const views={
    register:registerView,verify:verifyView,'diagnostic-gate':diagnosticGate,diagnostic:diagnosticView,
    report:reportView,home:homeView,route:routeView,modules:modulesView,module:moduleView,
    guide:guideView,learn:learnView,'learn-summary':learningSummaryView,session:sessionView,
    errors:errorsView,progress:progressView
  };
  const content=(views[r]||registerView)();
  const unlockedBack=!['register','verify','diagnostic-gate','diagnostic','home'].includes(r);
  $('#screen').innerHTML=(unlockedBack?'<div class="page-back"><button class="btn ghost" data-action="nav-back">← К предыдущему экрану</button></div>':'')+content;
  const locked=['register','verify','diagnostic-gate','diagnostic'].includes(r);
  $('#bottomNav').classList.toggle('hidden',locked);
  $('#guideButton').classList.toggle('hidden',locked);
  $('#shareButton').classList.toggle('hidden',locked);
  $('#ottoDecor').classList.toggle('hidden',locked);
  $('#ottoDecor').src=window.OTTO_SRC||'';
  $('#ottoNavImg').src=window.OTTO_SRC||'';
  document.querySelectorAll('[data-nav]').forEach(function(b){b.classList.toggle('active',b.dataset.nav===r);});
  renderModal();
}

function click(e){
  const nav=e.target.closest('[data-nav]');if(nav){go(nav.dataset.nav);return;}
  const guideTab=e.target.closest('[data-guide-module]');if(guideTab){S.selectedGuide=guideTab.dataset.guideModule;save();render();return;}
  const startLearn=e.target.closest('[data-start-learning]');if(startLearn){startLearning(Number(startLearn.dataset.startLearning),'training');return;}
  const startExam=e.target.closest('[data-start-exam]');if(startExam){startLearning(Number(startExam.dataset.startExam),'exam');return;}
  const learnChoice=e.target.closest('[data-learn-choice]');if(learnChoice){if(!S.learning.checked[S.learning.index]){S.learning.answers[S.learning.index]=Number(learnChoice.dataset.learnChoice);save();render();}return;}
  const support=e.target.closest('[data-support-level]');if(support){S.learning.supportLevel=Number(support.dataset.supportLevel);S.learning.translation=false;S.learning.instructionHelp=false;S.learning.strategy=false;S.learning.dictionary=false;save();render();return;}
  const speakWord=e.target.closest('[data-speak-word]');if(speakWord){speakText(speakWord.dataset.speakWord);return;}
  const mod=e.target.closest('[data-module]');if(mod){S.selectedModule=mod.dataset.module;S.selectedGuide=S.selectedModule;save();go('module');return;}
  const mins=e.target.closest('[data-minutes]');if(mins){captureRegistrationDraft();S.dailyMinutes=Number(mins.dataset.minutes);save();render();return;}
  const ch=e.target.closest('[data-diag-choice]');if(ch){answerDiagnostic(Number(ch.dataset.diagChoice));return;}
  const sessionMod=e.target.closest('[data-session-module]');if(sessionMod){
    const m=sessionMod.dataset.sessionModule;S.selectedModule=m;S.selectedGuide=m;save();
    if(m==='Lesen')startLearning(1,'training');else go('guide');
    return;
  }
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
  else if(x==='skip-writing')skipWriting();
  else if(x==='record-speaking')toggleSpeakingRecord();
  else if(x==='mic-help'){S.ui.micHelp=!S.ui.micHelp;save();render();}
  else if(x==='finish-speaking')finishSpeaking(false);
  else if(x==='skip-speaking')skipAllSpeaking();
  else if(x==='speak-otto')speakOtto();
  else if(x==='open-route')go('route');
  else if(x==='start-session'){S.dailySession.started=true;save();go('session');}
  else if(x==='nav-back'){if(history.length>1)history.back();else go('home');}
  else if(x==='open-home')go('home');
  else if(x==='open-modules')go('modules');
  else if(x==='open-progress')go('progress');
  else if(x==='open-guide'){S.selectedGuide=S.selectedGuide||S.selectedModule||'Lesen';save();go('guide');}
  else if(x==='open-guide-module'){S.selectedGuide=S.selectedModule;save();go('guide');}
  else if(x==='guide-to-module'){S.selectedModule=S.selectedGuide;save();go('module');}
  else if(x==='open-help')openHelp();
  else if(x==='help-open-guide'){S.ui.helpOpen=false;S.selectedGuide=S.selectedModule;save();go('guide');}
  else if(x==='otto-open-guide'){S.ui.ottoOpen=false;S.selectedGuide=S.selectedModule||'Lesen';save();go('guide');}
  else if(x==='ask-otto'){S.ui.ottoOpen=true;S.ui.helpOpen=false;save();renderModal();}
  else if(x==='close-modal'){S.ui.helpOpen=false;S.ui.ottoOpen=false;save();renderModal();}
  else if(x==='share-app')shareApp();
  else if(x==='guide-speak-sample')speakText(GUIDE.modules.Sprechen.presentation.sample);
  else if(x==='instruction-help'){S.learning.instructionHelp=!S.learning.instructionHelp;if(S.learning.instructionHelp)recordAssistance('instruction_help','Lesen Teil 1');save();render();}
  else if(x==='toggle-translation'){S.learning.translation=!S.learning.translation;if(S.learning.translation)recordAssistance('translation_used','Lesen Teil 1');save();render();}
  else if(x==='toggle-strategy'){S.learning.strategy=!S.learning.strategy;if(S.learning.strategy)recordAssistance('strategy_used','Lesen Teil 1');save();render();}
  else if(x==='toggle-dictionary'){S.learning.dictionary=!S.learning.dictionary;if(S.learning.dictionary)recordAssistance('dictionary_used','Lesen Teil 1');save();render();}
  else if(x==='dictionary-all'){S.learning.dictionaryAll=!S.learning.dictionaryAll;save();render();}
  else if(x==='learn-check')learnCheck();
  else if(x==='learn-next')learnNext();
  else if(x==='learn-exam-next')learnExamNext();
  else if(x==='learn-back')learnBack();
  else if(x==='learn-review'){S.learning.review=true;save();render();}
  else if(x==='learn-module'){S.selectedModule='Lesen';save();go('module');}
  else if(x==='learn-guide'){S.selectedGuide='Lesen';save();go('guide');}
}
document.addEventListener('click',click);
$('#resetButton').addEventListener('click',()=>{if(confirm('Сбросить профиль, диагностику и прогресс?'))reset();});
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
