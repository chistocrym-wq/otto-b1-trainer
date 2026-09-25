'use strict';

const BANK=window.OTTO_DIAGNOSTIC_BANK;
const ENGINE=window.OTTO_DIAGNOSTIC_ENGINE;
const GUIDE=window.OTTO_GUIDE_B1;
const LEARNING=window.OTTO_LEARNING_BANK;
const FULL=window.OTTO_FULL_LEARNING;
const STORAGE='ottoB1.diagnostic.v3';
const PREFS_KEY='ottoB1.uiPrefs.v1';
const LEGAL_VERSION='2026-09-23-v1';
const SUPPORT_EMAIL='otto.nash@mail.ru';
const MODULES=['Lesen','Hören','Schreiben','Sprechen'];
const DEFAULT_PREFS={textSize:'medium',helpMode:'guided',voiceSpeed:'normal',language:'ru',reminder:{enabled:false,days:[1,3,5],time:'19:00'}};
function loadPrefs(){
  try{
    const raw=JSON.parse(localStorage.getItem(PREFS_KEY)||'{}'),rem=raw.reminder||{};
    return {
      textSize:['small','medium','large'].includes(raw.textSize)?raw.textSize:'medium',
      helpMode:['guided','direct'].includes(raw.helpMode)?raw.helpMode:'guided',
      voiceSpeed:raw.voiceSpeed==='slow'?'slow':'normal',
      language:'ru',
      reminder:{enabled:Boolean(rem.enabled),days:Array.isArray(rem.days)?rem.days.map(Number).filter(n=>n>=0&&n<=6):[1,3,5],time:/^([01]\d|2[0-3]):[0-5]\d$/.test(String(rem.time||''))?String(rem.time):'19:00'}
    };
  }catch{return JSON.parse(JSON.stringify(DEFAULT_PREFS));}
}
let PREFS=loadPrefs(),deferredInstallPrompt=null,lastReminderDate='';
function applyPrefs(){
  document.documentElement.dataset.textSize=PREFS.textSize;
  document.documentElement.style.setProperty('--otto-text-scale',PREFS.textSize==='small'?'0.94':PREFS.textSize==='large'?'1.12':'1');
  window.OTTO_SPEECH?.setMode?.(PREFS.voiceSpeed);
}
function savePrefs(){
  try{localStorage.setItem(PREFS_KEY,JSON.stringify(PREFS));}catch{}
  applyPrefs();
}
function notificationCapability(){return typeof Notification==='undefined'?'unsupported':Notification.permission;}
async function requestReminderPermission(){
  if(typeof Notification==='undefined')return'unsupported';
  try{return await Notification.requestPermission();}catch{return'denied';}
}
function maybeSendReminder(){
  if(!PREFS.reminder.enabled||typeof Notification==='undefined'||Notification.permission!=='granted')return;
  const d=new Date(),day=d.getDay(),hhmm=String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0'),date=d.toISOString().slice(0,10);
  if(!PREFS.reminder.days.includes(day)||hhmm!==PREFS.reminder.time||lastReminderDate===date)return;
  try{new Notification('Тренажёр Otto',{body:'Пора на короткую тренировку B1.',icon:'./otto-b1-icon.svg',tag:'otto-b1-reminder'});lastReminderDate=date;}catch{}
}
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredInstallPrompt=e;window.dispatchEvent(new Event('otto:pwa-install-change'));});
window.addEventListener('appinstalled',()=>{deferredInstallPrompt=null;window.dispatchEvent(new Event('otto:pwa-install-change'));});
function isStandalone(){try{return window.matchMedia('(display-mode: standalone)').matches||navigator.standalone===true}catch{return false}}
function manualInstallHint(){
  const ua=navigator.userAgent||'',ios=/iPad|iPhone|iPod/i.test(ua)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
  if(ios)return 'В Safari нажмите «Поделиться» → «На экран Домой» → «Добавить».';
  return 'Откройте меню браузера и выберите «Установить приложение» или «Добавить на главный экран».';
}
applyPrefs();

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
    lesson:defaultLesson(),
    speakingContext:{lastPresentationTranscript:'',lastPresentationTaskId:null,lastPresentationAt:null},
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
  if(!S.lesson)S.lesson=defaultLesson(); else S.lesson=Object.assign(defaultLesson(),S.lesson);
  if(!S.speakingContext)S.speakingContext={lastPresentationTranscript:'',lastPresentationTaskId:null,lastPresentationAt:null};
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

const ERROR_MODELS={
  matching_constraints:{
    error_code:'matching_constraints',module:'Lesen',priority:'high',
    title:'Не все условия объявления были учтены',
    what:'Вы нашли вариант с подходящей темой, но одно или несколько важных условий ситуации не совпали.',
    why:'В Lesen Teil 3 правильный ответ должен подходить по всем существенным ограничениям: тема, место, время, цена, возраст и другие условия.',
    fix:'Перед выбором отметьте каждое условие ситуации и проверьте объявление по ним по очереди.',
    target:'Сопоставление ситуаций и объявлений'
  },
  embedded_question:{
    error_code:'embedded_question',module:'Грамматика',priority:'medium',
    title:'Порядок слов в косвенном вопросе',
    what:'После вводной фразы порядок слов остался как в прямом вопросе.',
    why:'В конструкциях вроде „Ich weiß nicht, …“ и „Können Sie mir sagen, …“ спрягаемый глагол в придаточной части обычно стоит в конце.',
    fix:'Сначала найдите вводную фразу, затем соберите придаточную часть и поставьте спрягаемый глагол в конец.',
    target:'Косвенные вопросы'
  },
  purpose_paraphrase:{
    error_code:'purpose_paraphrase',module:'Lesen',priority:'high',
    title:'Трудно распознать ту же мысль другими словами',
    what:'Вопрос и текст передают один смысл, но используют разные слова и формулировки.',
    why:'На B1 ответ часто нельзя найти по одному совпавшему слову: нужно узнавать перефразирование.',
    fix:'Сформулируйте смысл вопроса своими словами и ищите в тексте подтверждение идеи, а не буквальное совпадение.',
    target:'Перефразирование и доказательство в тексте'
  },
  evidence_and_paraphrase:{
    error_code:'evidence_and_paraphrase',module:'Lesen',priority:'high',
    title:'Ответ выбран без достаточного доказательства в тексте',
    what:'Вариант показался подходящим, но ключевой фрагмент текста подтверждает другой смысл.',
    why:'В Lesen нужно опираться на конкретное доказательство, особенно когда варианты специально звучат правдоподобно.',
    fix:'Перед ответом найдите фразу-доказательство и сравните её со всеми вариантами.',
    target:'Поиск доказательства и перефразирование'
  },
  task_completion:{
    error_code:'task_completion',module:'Schreiben',priority:'high',
    title:'Не все пункты письменного задания раскрыты',
    what:'Текст написан, но один из обязательных коммуникативных пунктов отсутствует или раскрыт слишком слабо.',
    why:'В Schreiben выполнение задания оценивается отдельно: хороший язык не компенсирует пропущенный пункт.',
    fix:'Перед написанием превратите каждый пункт условия в отдельную короткую мысль и отметьте его после выполнения.',
    target:'Полное выполнение письменной задачи'
  },
  speaking_practice:{
    error_code:'speaking_practice',module:'Sprechen',priority:'medium',
    title:'Нужна ещё одна устная попытка',
    what:'Устное задание было пропущено или пока не дало достаточно материала для разбора.',
    why:'Для Sprechen важна реальная речь и взаимодействие, а не только чтение образцов.',
    fix:'Запишите короткий ответ, прослушайте себя и проверьте, выполнена ли коммуникативная задача.',
    target:'Самостоятельная устная практика'
  }
};
function errorModel(raw){
  const key=String(raw&&raw.micro_skill||raw&&raw.error_code||'');
  const known=ERROR_MODELS[key];
  if(known)return Object.assign({},known,{module:raw&&raw.module&&raw.module!=='grammar'?raw.module:known.module});
  return {
    error_code:'needs_review',module:domainLabel(raw&&raw.module||raw&&raw.skill||'Навык'),priority:'medium',
    title:'Здесь нужна ещё одна тренировка',
    what:'По этой попытке пока нельзя надёжно назвать узкую причину ошибки.',
    why:'Otto не показывает внутренний технический код пользователю, если для него нет проверенного понятного объяснения.',
    fix:'Повторите новое задание того же типа и сравните ход решения с разбором после ответа.',
    target:'Уточнение навыка на новом задании'
  };
}
function errorCard(m,i){
  const cls=m.priority==='high'?'error-learning-card':'soft';
  return '<div class="card '+cls+'"><span class="eyebrow">'+esc(m.module)+'</span><h3>'+esc(m.title)+'</h3>'+
    '<p>'+esc(m.what)+'</p><div class="friendly-note"><b>Почему это важно:</b> '+esc(m.why)+'</div>'+
    '<p><b>Что делать:</b> '+esc(m.fix)+'</p><p class="small"><b>Следующая цель:</b> '+esc(m.target)+'</p>'+
    '<button class="btn secondary" data-error-train="'+i+'">Потренировать это</button></div>';
}

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
  if(!item){
    if(['closed_complete','writing','speaking'].includes(s.phase))return productiveView();
    if(s.completed||s.phase==='complete')return reportView();
    return '<div class="notice">Otto пересчитывает следующий шаг диагностики…</div>';
  }
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
  S.diagnostic.audioPlays[item.item_id]=used+1;save();render();
  const speech=window.OTTO_SPEECH;
  if(!speech?.speakGerman)return alert('Фирменная немецкая озвучка Otto недоступна.');
  void speech.speakGerman(item.audio_script,{voiceRole:'otto',speed:item.target_band.startsWith('B1')?'normal':'slow',context:'diagnostic'}).then(ok=>{if(!ok)alert('Не удалось воспроизвести немецкую озвучку. Попробуйте ещё раз позже.');});
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
    const mime=recorderMime();chunks=[];recorder=new MediaRecorder(stream,mime?{mimeType:mime}:undefined);recorder.stream=stream;
    recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
    recorder.onstop=()=>{
      const bytes=chunks.reduce((n,b)=>n+b.size,0);
      S.diagnostic.lastRecording={recorded:bytes>0,bytes,mime_type:mime||'',savedAt:now()};
      save();recorder=null;render();
    };
    recorder.start();render();
  }catch(e){
    const m=micErrorInfo(e);
    S.diagnostic.micError=m.message;S.diagnostic.micDiagnosticCode=m.code;
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
  const text='Wir könnten den Lerntag am Samstag ab zehn Uhr in der Bibliothek machen. Ich würde aber nur eine kurze Mittagspause planen. Was meinst du?';
  const speech=window.OTTO_SPEECH;
  if(!speech?.speakGerman)return alert('Фирменный голос Otto недоступен.');
  void speech.speakGerman(text,{voiceRole:'otto',context:'sprechen-partner'}).then(ok=>{if(!ok)alert('Не удалось воспроизвести голос Otto.');});
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
    (g.exam.criteria?'<details class="guide-section"><summary>Критерии оценки</summary><div class="guide-body">'+listHtml(g.exam.criteria)+'</div></details>':'')+
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
  const msgs=(S.ottoChat&&S.ottoChat.messages)||[];
  let thread='<div class="otto-chat-thread">';
  if(!msgs.length)thread+='<div class="speaker"><div class="speaker-avatar"><img src="'+window.OTTO_SRC+'" alt="Otto"></div><div><b>Otto</b><div class="muted">Спросите о текущем задании, ошибке, грамматике, Schreiben или Sprechen. Я вижу только минимальный учебный контекст этой попытки.</div></div></div>';
  msgs.slice(-12).forEach(function(m){thread+='<div class="bubble '+(m.role==='user'?'user':'')+'"><b>'+(m.role==='user'?'Вы':'Otto')+'</b><br>'+esc(m.text)+'</div>';});
  thread+='</div>';
  return '<div class="modal-backdrop"><div class="modal otto-chat-modal"><div class="modal-head"><div><span class="eyebrow">Учебный помощник</span><h2 style="margin:0">Спросить Otto</h2></div><button class="close" data-action="close-modal">×</button></div>'+thread+'<textarea id="ottoMessage" class="field" rows="3" maxlength="2000" placeholder="Например: почему этот вариант не подходит?"></textarea><div class="button-row"><button class="btn primary" data-action="otto-send" '+(S.ottoChat.sending?'disabled':'')+'>'+(S.ottoChat.sending?'Отвечаю…':'Отправить')+'</button><button class="btn ghost" data-action="close-modal">Закрыть</button></div><p class="small">Otto помогает учиться и не выдаёт учебный результат за официальный балл Goethe.</p></div></div>';
}
function renderModal(){
  const root=$('#modalRoot');if(!root)return;
  root.innerHTML=S.ui.helpOpen?helpModal():(S.ui.ottoOpen?ottoModal():'');
  bindActionButtons();
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
  const speech=window.OTTO_SPEECH;
  if(!speech?.speakGerman)return alert('Фирменная немецкая озвучка недоступна.');
  void speech.speakGerman(text,{voiceRole:'otto',context:'dictionary'}).then(ok=>{if(!ok)alert('Не удалось воспроизвести слово фирменным немецким голосом Otto.');});
}
async function shareApp(){
  const data={url:location.origin+location.pathname};
  try{
    if(navigator.share){await navigator.share(data);return;}
    if(navigator.clipboard&&navigator.clipboard.writeText){await navigator.clipboard.writeText(data.url);alert('Ссылка скопирована.');return;}
  }catch(e){if(e&&e.name==='AbortError')return;}
  const ta=document.createElement('textarea');ta.value=data.url;document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove();alert('Ссылка скопирована.');
}
function dayButton(day,label){return '<button type="button" class="day-toggle '+(PREFS.reminder.days.includes(day)?'active':'')+'" data-reminder-day="'+day+'" aria-pressed="'+PREFS.reminder.days.includes(day)+'">'+label+'</button>';}
function settingsView(){
  const email=S.auth.method==='email'&&S.auth.contact?S.auth.contact:'не указан';
  const gender=S.gender||'';
  const installState=isStandalone()?'OTTO уже установлен и запускается как приложение.':'Установите OTTO на устройство, чтобы запускать его как обычное приложение.';
  const permission=notificationCapability();
  return '<span class="eyebrow">Настройки</span><h1 class="h2">OTTO B1</h1><p class="lead">Профиль, режим обучения, напоминания, интерфейс и фирменный немецкий голос.</p>'+
    '<section class="settings-card"><div class="settings-head"><span class="settings-icon">👤</span><div><span class="eyebrow">Профиль</span><h2>'+esc(S.name||'Профиль пользователя')+'</h2></div></div><p class="muted">Email: '+esc(email)+(S.auth.method==='email'?'<br><b>Статус:</b> локальный Preview-профиль; реальная email-verification в B1 ещё не подключена.':'')+'</p>'+
    '<div class="settings-gender"><b>Ваш пол</b><div class="segmented"><button data-setting-gender="female" class="'+(gender==='female'?'active':'')+'">Женский</button><button data-setting-gender="male" class="'+(gender==='male'?'active':'')+'">Мужской</button></div></div>'+
    '<div class="button-row"><button class="btn secondary" data-action="settings-edit-profile">Изменить профиль</button><button class="btn ghost" data-action="open-progress">Мой прогресс</button><button class="btn ghost" data-action="settings-logout">Выйти из аккаунта</button></div><p class="small">Выход не удаляет сохранённый учебный прогресс на этом устройстве.</p></section>'+
    '<section class="settings-card"><div class="settings-head"><span class="settings-icon">📄</span><div><span class="eyebrow">Документы</span><h2>Правовая информация</h2></div></div><p class="muted">Актуальная утверждённая версия в линейке OTTO: '+LEGAL_VERSION+'. Документы A1 содержат A1-специфичный текст, поэтому B1 не выдаёт их за утверждённые документы B1.</p><div class="legal-list"><button disabled>Политика обработки персональных данных · B1-версия требует утверждения</button><button disabled>Согласие на обработку персональных данных · B1-версия требует утверждения</button><button disabled>Пользовательское соглашение OTTO · B1-версия требует утверждения</button></div><p class="small">Контакт: <a href="mailto:'+SUPPORT_EMAIL+'">'+SUPPORT_EMAIL+'</a></p></section>'+
    '<section class="settings-card"><div class="settings-head"><span class="settings-icon">Aa</span><div><span class="eyebrow">Интерфейс</span><h2>Размер текста</h2></div></div><div class="segmented three"><button data-text-size="small" class="'+(PREFS.textSize==='small'?'active':'')+'">Мелкий</button><button data-text-size="medium" class="'+(PREFS.textSize==='medium'?'active':'')+'">Средний</button><button data-text-size="large" class="'+(PREFS.textSize==='large'?'active':'')+'">Крупный</button></div></section>'+
    '<section class="settings-card"><div class="settings-head"><span class="settings-icon">📘</span><div><span class="eyebrow">Обучение</span><h2>Режим помощи Otto</h2></div></div><p class="muted">Режим можно изменить в любой момент. Результаты и прогресс сохранятся.</p><div class="mode-grid settings-modes"><button class="mode-card '+(PREFS.helpMode==='guided'?'selected':'')+'" data-help-mode="guided"><b>Начинаю с нуля</b><span>Короткие объяснения перед новыми типами заданий.</span></button><button class="mode-card '+(PREFS.helpMode==='direct'?'selected':'')+'" data-help-mode="direct"><b>Я уже немного знаю немецкий</b><span>Сразу к тренировкам без дополнительного вступления.</span></button></div></section>'+
    '<section class="settings-card"><div class="settings-head"><span class="settings-icon">🌐</span><div><span class="eyebrow">Язык</span><h2>Язык приложения</h2></div></div><p class="muted">Русский интерфейс проверяется полностью. Другие языки появятся только после полной локализации.</p><button class="btn secondary" disabled>Русский</button></section>'+
    '<section class="settings-card"><div class="settings-head"><span class="settings-icon">🔔</span><div><span class="eyebrow">Напоминания</span><h2>Когда напомнить о тренировке?</h2></div></div><p class="muted">В веб-Preview локальное напоминание может сработать, пока OTTO открыт. Фоновую доставку закрытому приложению не обещаем.</p><div class="days">'+dayButton(0,'Вс')+dayButton(1,'Пн')+dayButton(2,'Вт')+dayButton(3,'Ср')+dayButton(4,'Чт')+dayButton(5,'Пт')+dayButton(6,'Сб')+'</div><label class="setting-label">Время<input id="reminderTime" type="time" class="field" value="'+esc(PREFS.reminder.time)+'"></label><div class="button-row"><button class="btn secondary" data-action="request-notifications">'+(permission==='granted'?'Уведомления разрешены':'Разрешить уведомления')+'</button><button class="btn primary" data-action="save-reminder">Сохранить</button></div></section>'+
    '<section class="settings-card"><div class="settings-head"><span class="settings-icon">🔊</span><div><span class="eyebrow">Фирменный голос</span><h2>Как говорит Otto</h2></div></div><p class="muted">Один фирменный немецкий голос Otto используется для помощника, словаря и учебных фраз. Здесь можно изменить только скорость этого голоса; Hören exam audio остаётся в исходном темпе.</p><div class="segmented"><button data-voice-speed="normal" class="'+(PREFS.voiceSpeed==='normal'?'active':'')+'">Нормально</button><button data-voice-speed="slow" class="'+(PREFS.voiceSpeed==='slow'?'active':'')+'">Медленнее</button></div><button class="btn secondary full" data-action="test-otto-voice">▶ Послушать голос Otto</button></section>'+
    '<section class="settings-card"><div class="settings-head"><span class="settings-icon">🎙</span><div><span class="eyebrow">Микрофон</span><h2>Проверить микрофон</h2></div></div><p class="muted">OTTO запишет 5 секунд. Микрофон считается проверенным только если запись можно остановить и реально прослушать.</p><button class="btn secondary full" data-action="mic-preflight">Проверить микрофон</button>'+(S.lesson.micStatus?'<div class="notice">'+esc(S.lesson.micStatus)+'</div>':'')+(micTestUrl?'<audio class="record-playback" controls src="'+micTestUrl+'"></audio>':'')+'</section>'+
    '<section class="settings-card"><div class="settings-head"><span class="settings-icon">📱</span><div><span class="eyebrow">Установка</span><h2>Установка приложения</h2></div></div><p class="muted">'+esc(installState)+'</p><button class="btn secondary full" data-action="install-app">'+(isStandalone()?'Приложение установлено':'Установить приложение')+'</button><div id="installNotice" class="small"></div></section>'+
    '<section class="settings-card settings-support"><div><span class="eyebrow">Поддержка</span><h2>Написать в поддержку</h2><p class="muted">Откроется ваше почтовое приложение. Ложного статуса «обращение отправлено» OTTO не показывает.</p></div><a class="btn secondary" href="mailto:'+SUPPORT_EMAIL+'">Написать</a></section>'+
    '<section class="settings-card settings-support"><div><span class="eyebrow">Поделиться</span><h2>Поделиться OTTO B1</h2><p class="muted">Передаётся только ссылка на приложение — без email, диагностики, прогресса и аккаунта.</p></div><button class="btn secondary" data-action="share-app">Поделиться</button></section>';
}
async function installApp(){
  if(isStandalone())return alert('OTTO уже установлен на этом устройстве.');
  if(deferredInstallPrompt){
    const p=deferredInstallPrompt;deferredInstallPrompt=null;
    try{await p.prompt();const choice=await p.userChoice;if(choice?.outcome==='accepted')return alert('Установка приложения началась.');if(choice?.outcome==='dismissed')return alert('Установка отменена. Можно повторить позже.');}catch{}
  }
  alert(manualInstallHint());
}
function logoutLocalProfile(){
  S.auth.verified=false;S.ui.ottoOpen=false;S.ui.helpOpen=false;save();go('register');
}
function editLocalProfile(){
  const next=prompt('Имя пользователя',S.name||'');if(next===null)return;
  const name=String(next).trim();if(!name)return alert('Имя не может быть пустым.');
  let contact=S.auth.contact||'';
  if(S.auth.method==='email'){
    const e=prompt('Email',contact);if(e===null)return;
    const clean=String(e).trim();if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(clean))return alert('Введите корректный email.');
    contact=clean;
  }
  S.name=name;S.auth.contact=contact;save();render();
}


/* ---------- Full learning preview v1 ---------- */
function defaultLesson(){
  return {task_id:null,mode:'training',index:0,answers:{},checked:{},audioPlays:{},translation:false,strategy:false,dictionary:false,sample:false,userText:'',submitted:false,feedback:null,transcript:'',assistance_used:false,micStatus:'',micDiagnosticCode:'',recordingReady:false,fromSession:false,score:null,review:false,examFinished:false,presentationStartedAt:null,presentationDurationSeconds:0,conversation:{started:false,sending:false,turns:[],covered:[],complete:false,voiceStatus:'',showTranscript:false,showTranslation:false,translation:'',showPhrases:false}};
}
function resetLesson(task,mode,fromSession){
  S.lesson=Object.assign(defaultLesson(),{task_id:task.task_id,mode:mode||'training',fromSession:!!fromSession});
  lessonAudioBlob=null;lessonAudioUrl=null;micTestBlob=null;micTestUrl=null;
  save();
}
function generatedPart(module,part){
  const cat=window.OTTO_CONTENT_CATALOG||{},pm=cat[module]||{};
  return pm[String(part)]||pm[Number(part)]||[];
}
function chooseGeneratedTask(module,part){
  const sets=generatedPart(module,part);
  if(!sets.length)return null;
  return sets.slice().sort(function(a,b){
    const ah=S.task_history&&S.task_history[a.task_id],bh=S.task_history&&S.task_history[b.task_id];
    if(!ah&&!bh)return a.task_id.localeCompare(b.task_id);
    if(!ah)return -1;if(!bh)return 1;
    return String(ah.last_seen||'').localeCompare(String(bh.last_seen||''));
  })[0];
}
function startFullLearning(part,mode){
  const task=chooseGeneratedTask(S.selectedModule,Number(part));
  if(!task)return alert('Для этой части пока нет проверенного задания.');
  resetLesson(task,mode,false);go('lesson');
}
function startSessionTask(){
  const r=ensureResult();if(!r||!FULL)return;
  if(!FULL.shouldResume(S))FULL.buildPlan(S,r);
  const task=FULL.currentSessionTask(S);
  if(!task){go('session-summary');return;}
  resetLesson(task,'training',true);go('lesson');
}
function startFirstLesson(){
  const r=ensureResult();if(!r||!FULL)return;
  FULL.buildPlan(S,r);save();startSessionTask();
}
function currentFullTask(){return FULL?FULL.findTask(S.lesson&&S.lesson.task_id):null;}
function closedItems(task){
  const out=[];
  if(task.module==='Lesen'&&Number(task.teil)===1){
    task.questions.forEach((q,i)=>out.push({id:q.id,prompt:q.statement,choices:['Richtig','Falsch'],choices_ru:['Верно','Неверно'],correct:q.correct?'Richtig':'Falsch',why:q.why,evidence:q.evidence,trap:q.trap,translation:q.translation,material:task.text}));
  }else if(task.module==='Lesen'&&Number(task.teil)===2){
    task.questions.forEach((q,i)=>out.push({id:q.id,prompt:q.question,choices:q.options,choices_ru:q.options_ru||[],correct:q.options[q.correct_index],why:q.why,evidence:q.evidence,trap:q.trap,translation:q.translation||'',material:task.texts[i<3?0:1]}));
  }else if(task.module==='Lesen'&&Number(task.teil)===3){
    const choices=task.ads.map(x=>x.id).concat('0');
    task.situations.forEach(q=>out.push({id:task.task_id+'-S'+q.id,prompt:q.text,choices,choices_ru:choices,correct:String(q.correct),why:q.why,evidence:'Проверьте все условия ситуации и объявления.',trap:q.trap,translation:'',material:task.ads}));
  }else if(task.module==='Lesen'&&Number(task.teil)===4){
    task.opinions.forEach(q=>out.push({id:task.task_id+'-O'+q.id,prompt:q.text,choices:['Ja','Nein'],choices_ru:['Да','Нет'],correct:q.correct,why:q.why,evidence:'Определите общую позицию автора.',trap:q.trap,translation:'',material:null}));
  }else if(task.module==='Lesen'&&Number(task.teil)===5){
    task.questions.forEach(q=>out.push({id:q.id,prompt:q.question,choices:q.options,choices_ru:q.options_ru||[],correct:q.options[q.correct_index],why:q.why,evidence:q.evidence,trap:q.trap,translation:q.translation||'',material:task.text}));
  }else if(task.module==='Hören'&&Number(task.teil)===1){
    task.scenes.forEach(sc=>sc.questions.forEach(q=>out.push({id:q.id,prompt:q.question,choices:q.options,choices_ru:q.options_ru||[],correct:q.options[q.correct_index],why:q.why,evidence:q.evidence,trap:q.trap,audio:sc.audio,image:sc.image,translation:task.translation,material:sc.context})));
  }else if(task.module==='Hören'&&Number(task.teil)===2){
    task.questions.forEach(q=>out.push({id:q.id,prompt:q.question,choices:q.options,choices_ru:q.options_ru||[],correct:q.options[q.correct_index],why:q.why,evidence:q.evidence,trap:q.trap,audio:task.audio,image:task.image,translation:task.translation,material:task.topic}));
  }else if(task.module==='Hören'&&Number(task.teil)===3){
    task.questions.forEach(q=>out.push({id:q.id,prompt:q.statement,choices:['Richtig','Falsch'],choices_ru:['Верно','Неверно'],correct:q.correct?'Richtig':'Falsch',why:q.why,evidence:q.evidence,trap:q.trap,audio:task.audio,image:task.image,translation:task.translation,material:task.topic}));
  }else if(task.module==='Hören'&&Number(task.teil)===4){
    task.questions.forEach(q=>out.push({id:q.id,prompt:q.statement,choices:['Moderatorin','Person A','Person B'],choices_ru:['Модератор','Участник A','Участник B'],correct:q.correct_speaker,why:q.why,evidence:'Слушайте, кто именно формулирует эту мысль.',trap:q.trap,audio:task.audio,image:task.image,translation:task.translation,material:task.topic}));
  }
  return out;
}
function lessonTools(task){
  if(S.lesson.mode==='exam'&&!S.lesson.submitted)return '<div class="exam-lock"><b>Как на экзамене.</b> Перевод, словарь, образец и подсказки скрыты до завершения попытки.</div>';
  let html=PREFS.helpMode==='guided'?'<div class="friendly-note"><b>Otto ведёт:</b> сначала выполните задание самостоятельно. Перевод, стратегия и словарь доступны ниже по запросу.</div>':'';
  html+='<div class="task-tools"><button class="chip" data-action="lesson-translation">👁 Перевод</button><button class="chip" data-action="lesson-strategy">☝ Стратегия Otto</button><button class="chip" data-action="lesson-dictionary">Aa Словарь</button>';
  if(task.sample)html+='<button class="chip" data-action="lesson-sample">◎ Образец</button>';
  html+='</div>';
  if(S.lesson.translation)html+='<div class="translation-box">'+esc(task.translation||task.sample_translation||'Перевод для этого материала пока не добавлен.')+'</div>';
  if(S.lesson.strategy)html+='<div class="notice"><b>Стратегия:</b> '+esc(task.strategy||'Сначала выполните задание самостоятельно, затем сверяйтесь с доказательством.')+'</div>';
  if(S.lesson.dictionary&&task.glossary)html+='<div class="card soft"><b>Словарь</b><div class="dictionary-list">'+task.glossary.map(x=>'<div class="dictionary-row"><b>'+esc(x.de)+'</b><span>'+esc(x.ru)+'</span><button class="word-audio" data-speak-word="'+esc(x.de)+'">▶</button></div>').join('')+'</div></div>';
  if(S.lesson.sample&&task.sample)html+='<div class="sample-card"><b>Хороший образец</b><div class="sample-text">'+esc(task.sample)+'</div><p class="small">'+esc(task.sample_translation||'')+'</p></div>';
  return html;
}
function lessonMaterial(task,item){
  if(task.module==='Lesen'&&Number(task.teil)===2&&item.material)return '<div class="learning-text"><b>'+esc(item.material.title)+'</b><br><br>'+esc(item.material.text)+'</div>';
  if(task.module==='Lesen'&&Number(task.teil)===3&&Array.isArray(item.material))return '<div class="stack">'+item.material.map(a=>'<div class="card"><b>'+esc(a.id)+' · '+esc(a.title)+'</b><p>'+esc(a.text)+'</p></div>').join('')+'</div>';
  if(typeof item.material==='string'&&task.module==='Lesen')return '<div class="learning-text">'+esc(item.material)+'</div>';
  return '';
}
function audioPanel(item){
  if(!item.audio)return '';
  const used=S.lesson.audioPlays[item.audio.audio_id]||0,p=item.audio.playback_rules||{},limit=S.lesson.mode==='exam'?p.exam_play_count:p.training_play_count;
  const disabled=used>=limit?'disabled':'',training=S.lesson.mode!=='exam';
  const image=training&&item.image?'<img class="hearing-image" src="'+esc(item.image.src)+'" alt="'+esc(item.image.alt)+'" loading="lazy">':'';
  const portraits=training&&Array.isArray(item.audio.speakers)?item.audio.speakers.filter(s=>s.portrait_src).map(s=>'<div class="speaker-identity"><img src="'+esc(s.portrait_src)+'" alt="'+esc(s.display_name||s.speaker_id)+'"><div><b>'+esc(s.display_name||s.speaker_id)+'</b><span>'+esc(s.role||'')+'</span></div></div>').join(''):'';
  return '<div class="audio-card hearing-panel">'+image+'<div class="audio-main"><b>Аудио задания</b><div class="small">Прослушано: '+used+' / '+limit+(training?' · дополнительное прослушивание учитывается как помощь':'')+'</div>'+(portraits?'<div class="speaker-identities">'+portraits+'</div>':'')+'</div><button class="btn secondary" data-action="lesson-audio" '+disabled+'>▶ Слушать</button></div>';
}
function closedLessonView(task){
  const items=closedItems(task);
  if(S.lesson.examFinished){
    const correct=items.filter(q=>S.lesson.answers[q.id]===q.correct).length;
    let html='<div class="learning-shell"><span class="eyebrow">Как на экзамене · завершено</span><h1 class="h2">'+correct+' / '+items.length+'</h1><p class="lead">Во время попытки подсказки и объяснения были скрыты. Теперь можно открыть разбор.</p>';
    if(!S.lesson.review)return html+'<div class="button-row"><button class="btn secondary" data-action="lesson-review">Разобрать ответы</button><button class="btn primary" data-action="lesson-complete">Завершить задание</button></div></div>';
    html+='<div class="review-list">';
    items.forEach(function(q){
      const answer=S.lesson.answers[q.id],ok=answer===q.correct;
      html+='<div class="feedback-card '+(ok?'correct':'wrong')+'"><h3>'+esc(q.prompt)+'</h3><p><b>Ваш ответ:</b> '+esc(answer||'—')+'</p><p><b>Правильный ответ:</b> '+esc(q.correct)+'</p><p><b>Почему:</b> '+esc(q.why||'')+'</p><blockquote>'+esc(q.evidence||'')+'</blockquote><p><b>Ловушка:</b> '+esc(q.trap||'')+'</p></div>';
    });
    return html+'</div>'+lessonTools(task)+'<div class="button-row"><button class="btn primary" data-action="lesson-complete">Завершить задание</button></div></div>';
  }
  const i=Math.min(S.lesson.index,Math.max(0,items.length-1)),q=items[i],answer=S.lesson.answers[q.id],checked=!!S.lesson.checked[q.id],exam=S.lesson.mode==='exam';
  let html='<div class="learning-shell"><div class="learning-head"><div><span class="eyebrow">'+(exam?'Как на экзамене':'Учебный режим')+' · '+esc(task.module)+'</span><h1 class="h2">'+esc(task.module)+' · Teil '+task.teil+'</h1></div><div class="learning-progress">'+(exam?'Aufgabe ':'Задание ')+(i+1)+' / '+items.length+'</div></div><div class="progress-line"><i style="width:'+((i+1)/items.length*100)+'%"></i></div>';
  html+='<div class="card soft"><div class="small">Инструкция</div><b>'+esc(task.german_instruction)+'</b><p>'+esc(task.instruction_ru)+'</p></div>'+lessonTools(task)+lessonMaterial(task,q)+audioPanel(q);
  if(S.lesson.translation&&q.translation)html+='<div class="translation-box">'+esc(q.translation)+'</div>';
  html+='<div class="card"><h3>'+esc(q.prompt)+'</h3><div class="choice-grid">'+q.choices.map((c,ci)=>'<button class="choice '+(answer===c?'selected':'')+'" data-full-choice="'+esc(c)+'" '+(checked?'disabled':'')+'>'+esc(c)+(S.lesson.translation&&q.choices_ru&&q.choices_ru[ci]&&q.choices_ru[ci]!==c?'<span class="choice-translation">'+esc(q.choices_ru[ci])+'</span>':'')+'</button>').join('')+'</div></div>';
  if(checked&&!exam){
    const ok=answer===q.correct;
    html+='<div class="feedback-card '+(ok?'correct':'wrong')+'"><h3>'+(ok?'✓ Правильно':'✕ Нужно разобрать')+'</h3><p><b>Правильный ответ:</b> '+esc(q.correct)+'</p><p><b>Почему:</b> '+esc(q.why||'Сверьтесь с материалом.')+'</p><blockquote>'+esc(q.evidence||'')+'</blockquote><p><b>Ловушка:</b> '+esc(q.trap||'Не выбирайте ответ только по одному знакомому слову.')+'</p></div>';
  }
  html+='<div class="button-row">';
  if(i>0)html+='<button class="btn ghost" data-action="full-back">← Назад</button>';
  if(exam)html+='<button class="btn primary" data-action="full-exam-next">'+(i===items.length-1?'Завершить попытку':'Далее →')+'</button>';
  else if(!checked)html+='<button class="btn primary" data-action="full-check">Проверить</button>';
  else html+='<button class="btn primary" data-action="full-next">'+(i===items.length-1?'Завершить задание':'Далее →')+'</button>';
  return html+'</div></div>';
}
function writingLessonView(task){
  const words=countGermanWords(S.lesson.userText||'');
  let html='<div class="learning-shell"><span class="eyebrow">'+(S.lesson.mode==='exam'?'Как на экзамене':'Учебный режим')+' · Schreiben</span><h1 class="h2">Schreiben · Aufgabe '+task.teil+'</h1><div class="card soft"><b>'+esc(task.instruction_de)+'</b><p>'+esc(task.instruction_ru)+'</p></div>'+lessonTools(task);
  html+='<textarea id="fullWriting" class="field" rows="13" placeholder="Schreiben Sie auf Deutsch…">'+esc(S.lesson.userText||'')+'</textarea><div class="small">Слов: '+words+' · ориентир '+task.target_words+'</div>';
  if(!S.lesson.submitted)html+='<div class="button-row"><button class="btn primary" data-action="writing-submit">Проверить мой текст</button></div>';
  else{
    const fb=S.lesson.feedback||{};
    html+='<div class="feedback-card '+(fb.ok?'correct':'wrong')+'"><h3>'+esc(fb.title||'Учебная проверка')+'</h3><p>'+esc(fb.text||'')+'</p><p><b>Что проверить вручную:</b> раскрыты ли все пункты, подходит ли обращение и есть ли связки между мыслями.</p></div><div class="button-row"><button class="btn secondary" data-action="ask-otto">Спросить Otto о тексте</button><button class="btn primary" data-action="lesson-complete">Далее</button></div>';
  }
  return html+'</div>';
}
function micPracticePanel(){
  return '<div class="card"><h3>Проверить микрофон</h3><p class="muted">Тест запишет 5 секунд. Микрофон считается рабочим только если вы можете прослушать себя.</p><div class="button-row"><button class="btn secondary" data-action="mic-preflight">Проверить микрофон</button></div>'+(S.lesson.micStatus?'<div class="notice">'+esc(S.lesson.micStatus)+'</div>':'')+(micTestUrl?'<audio class="record-playback" controls src="'+micTestUrl+'"></audio>':'')+'</div>';
}
function recordPracticePanel(label='Ваш ответ'){
  let html='<div class="record-box '+(lessonRecorder&&lessonRecorder.state==='recording'?'recording':'')+'"><b>'+(lessonRecorder&&lessonRecorder.state==='recording'?'Идёт запись…':esc(label))+'</b><div class="button-row"><button class="btn primary" data-action="lesson-record">'+(lessonRecorder&&lessonRecorder.state==='recording'?'■ Остановить':'🎙 Начать запись')+'</button></div></div>';
  if(lessonAudioUrl)html+='<div class="card good"><b>Запись готова</b><p class="muted">Прослушайте себя перед отправкой.</p><audio class="record-playback" controls src="'+lessonAudioUrl+'"></audio></div>';
  return html;
}
function conversationThreadHtml(conv){
  if(!conv.turns.length)return '';
  const reveal=S.lesson.mode!=='exam'&&conv.showTranscript;
  return '<div class="conversation-thread">'+conv.turns.map(t=>{
    const hidden=t.role==='otto'?'Реплика Otto прозвучала голосом.':'Ваша реплика записана.';
    return '<div class="conversation-turn '+t.role+'"><b>'+(t.role==='otto'?'Otto':'Вы')+'</b><span>'+(reveal?esc(t.text):hidden)+'</span></div>';
  }).join('')+'</div>';
}
function conversationStudyTools(task,conv){
  if(S.lesson.mode==='exam'||!conv.turns.length)return '';
  let html='<div class="button-row"><button class="btn ghost" data-action="conversation-transcript">'+(conv.showTranscript?'Скрыть transcript':'Показать transcript')+'</button><button class="btn ghost" data-action="conversation-translation">'+(conv.showTranslation?'Скрыть перевод':'Перевод реплик')+'</button><button class="btn ghost" data-action="conversation-phrases">'+(conv.showPhrases?'Скрыть useful phrases':'Useful phrases')+'</button></div>';
  if(conv.showTranslation&&conv.translation)html+='<div class="translation-box">'+esc(conv.translation)+'</div>';
  if(conv.showPhrases)html+='<div class="card soft"><b>Useful phrases</b><ul>'+(task.phrase_bank||[]).map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul></div>';
  return html;
}
function speakingConversationView(task){
  const conv=speakingConversation(),covered=task.planning_points||[];
  let html='<div class="learning-shell"><span class="eyebrow">'+(S.lesson.mode==='exam'?'Как на экзамене':'Учебный режим')+' · Sprechen</span><h1 class="h2">Aufgabe 1 · Gemeinsam etwas planen</h1>'+speakingTaskCard(task)+lessonTools(task)+micPracticePanel();
  if(!conv.started)html+='<div class="card"><h3>Диалог с Otto</h3><p class="muted">Otto сам сформулирует первую немецкую реплику. Дальше он будет реагировать на вашу речь, а не проигрывать заранее записанный сценарий.</p><button class="btn primary" data-action="speaking-conversation-start">Начать диалог с Otto</button></div>';
  else{
    html+=conversationThreadHtml(conv)+conversationStudyTools(task,conv);
    if(S.lesson.mode!=='exam')html+='<div class="planning-progress">'+covered.map(x=>'<span class="'+(conv.covered.includes(x)?'done':'')+'">'+esc(x)+'</span>').join('')+'</div>';
    if(conv.sending)html+='<div class="notice">Otto формулирует следующую реплику…</div>';
    if(conv.voiceStatus==='tts_unavailable')html+='<div class="notice">Текстовая реплика готова, но фирменный голос Otto на сервере не настроен. Live voice reply сейчас BLOCKED.</div>';
    if(!S.lesson.submitted&&!conv.complete&&!conv.sending)html+=recordPracticePanel('Ваша следующая реплика')+(lessonAudioBlob?'<div class="button-row"><button class="btn primary" data-action="speaking-conversation-send">Отправить реплику Otto</button></div>':'');
    if(!S.lesson.submitted&&conv.complete)html+='<div class="button-row"><button class="btn primary" data-action="speaking-conversation-finish">Завершить диалог</button></div>';
  }
  if(S.lesson.submitted)html+='<div class="feedback-card correct"><h3>Диалог завершён</h3><p>'+esc(S.lesson.feedback?.text||'')+'</p></div><div class="button-row"><button class="btn primary" data-action="lesson-complete">Далее</button></div>';
  return html+'</div>';
}
function speakingPresentationView(task){
  let html='<div class="learning-shell"><span class="eyebrow">'+(S.lesson.mode==='exam'?'Как на экзамене':'Учебный режим')+' · Sprechen</span><h1 class="h2">Aufgabe 2 · Präsentation</h1>'+speakingTaskCard(task)+lessonTools(task)+micPracticePanel();
  html+='<div class="speaking-timer"><span>Время речи</span><strong data-speaking-timer>'+formatSeconds(S.lesson.presentationDurationSeconds)+'</strong><small>Ориентир задания: около 3 минут. Это временной формат, не норма количества слов.</small></div>'+recordPracticePanel('Ваша презентация');
  if(S.lesson.sample&&task.sample_audio)html+='<div class="card soft"><b>Аудиообразец</b><audio class="record-playback" controls src="'+esc(task.sample_audio)+'"></audio><p class="small">QA оценивает длительность образца и покрытие структуры, а не придуманную норму слов.</p></div>';
  if(S.lesson.transcript&&S.lesson.mode!=='exam')html+='<div class="card soft"><b>Расшифровка</b><p>'+esc(S.lesson.transcript)+'</p></div>';
  if(!S.lesson.submitted)html+='<div class="button-row"><button class="btn primary" data-action="speaking-submit" '+(!lessonAudioBlob?'disabled':'')+'>Завершить презентацию</button><button class="btn ghost" data-action="speaking-skip">Пропустить</button></div>';
  else html+='<div class="feedback-card correct"><h3>Презентация сохранена</h3><p>'+esc(S.lesson.feedback?.text||'')+'</p></div><div class="button-row"><button class="btn primary" data-action="lesson-complete">Далее</button></div>';
  return html+'</div>';
}
function speakingFollowupView(task){
  const conv=speakingConversation(),hasPresentation=Boolean(S.speakingContext?.lastPresentationTranscript);
  let html='<div class="learning-shell"><span class="eyebrow">'+(S.lesson.mode==='exam'?'Как на экзамене':'Учебный режим')+' · Sprechen</span><h1 class="h2">Aufgabe 3 · Rückmeldung und Fragen</h1>'+speakingTaskCard(task)+lessonTools(task)+micPracticePanel();
  if(!hasPresentation)html+='<div class="notice"><b>Для живого follow-up нужна ваша реальная презентация.</b> Сначала выполните Aufgabe 2: Otto должен задать вопрос по тому, что вы действительно сказали, а не по фиктивному тексту.</div><button class="btn primary" data-action="start-sprechen-a2">Перейти к Aufgabe 2</button>';
  else if(!conv.started)html+='<div class="card"><h3>Otto слушал вашу презентацию</h3><p class="muted">Он даст короткую реакцию и сформулирует один релевантный вопрос по вашему transcript.</p><button class="btn primary" data-action="speaking-followup-start">Получить реакцию и вопрос Otto</button></div>';
  else{
    html+=conversationThreadHtml(conv)+conversationStudyTools(task,conv);
    if(conv.sending)html+='<div class="notice">Otto готовит реплику…</div>';
    if(!S.lesson.submitted)html+=recordPracticePanel('Ответьте на вопрос Otto')+(lessonAudioBlob?'<div class="button-row"><button class="btn primary" data-action="speaking-followup-send">Отправить ответ</button></div>':'');
  }
  if(S.lesson.submitted)html+='<div class="feedback-card correct"><h3>Follow-up завершён</h3><p>'+esc(S.lesson.feedback?.text||'')+'</p></div><div class="button-row"><button class="btn primary" data-action="lesson-complete">Далее</button></div>';
  return html+'</div>';
}
function speakingLessonView(task){
  if(Number(task.teil)===1)return speakingConversationView(task);
  if(Number(task.teil)===2)return speakingPresentationView(task);
  return speakingFollowupView(task);
}
function lessonView(){
  const task=currentFullTask();
  if(!task)return '<div class="notice">Задание не найдено. Вернитесь на главную и соберите занятие снова.</div>';
  if(task.module==='Schreiben')return writingLessonView(task);
  if(task.module==='Sprechen')return speakingLessonView(task);
  return closedLessonView(task);
}
function selectFullChoice(v){
  const task=currentFullTask(),items=closedItems(task),q=items[S.lesson.index];if(!q||S.lesson.checked[q.id])return;
  S.lesson.answers[q.id]=v;save();render();
}
function lessonAssistance(kind){
  if(S.lesson.mode==='exam'&&!S.lesson.submitted)return;
  S.lesson[kind]=!S.lesson[kind];if(S.lesson[kind])S.lesson.assistance_used=true;save();render();
}
function checkFullAnswer(){
  const task=currentFullTask(),items=closedItems(task),q=items[S.lesson.index];if(!q)return;
  const answer=S.lesson.answers[q.id];if(answer==null)return alert('Сначала выберите ответ.');
  S.lesson.checked[q.id]=true;
  if(answer!==q.correct){
    if(!S.learningErrors)S.learningErrors=[];
    if(!S.learningErrors.some(x=>x.task_id===task.task_id&&x.question_id===q.id))S.learningErrors.push({task_id:task.task_id,question_id:q.id,module:task.module,skill:task.module,micro_skill:task.micro_skill,created_at:now()});
  }
  save();render();
}
function fullBack(){if(S.lesson.index>0){S.lesson.index--;save();render();}}
function fullExamNext(){
  const task=currentFullTask(),items=closedItems(task),q=items[S.lesson.index];if(!q)return;
  const answer=S.lesson.answers[q.id];if(answer==null)return alert('Сначала выберите ответ.');
  S.lesson.checked[q.id]=true;
  if(answer!==q.correct&&!S.learningErrors.some(x=>x.task_id===task.task_id&&x.question_id===q.id))S.learningErrors.push({task_id:task.task_id,question_id:q.id,module:task.module,skill:task.module,micro_skill:task.micro_skill,created_at:now()});
  if(S.lesson.index<items.length-1){S.lesson.index++;save();render();return;}
  const correct=items.filter(x=>S.lesson.answers[x.id]===x.correct).length;S.lesson.score=items.length?correct/items.length:0;S.lesson.submitted=true;S.lesson.examFinished=true;save();render();
}
function fullNext(){
  const task=currentFullTask(),items=closedItems(task);
  if(S.lesson.index<items.length-1){S.lesson.index++;S.lesson.translation=false;S.lesson.strategy=false;S.lesson.dictionary=false;save();render();return;}
  const correct=items.filter(q=>S.lesson.answers[q.id]===q.correct).length;
  S.lesson.score=items.length?correct/items.length:0;S.lesson.submitted=true;save();
  finishLessonAndAdvance();
}
function saveWritingDraft(){const el=$('#fullWriting');if(el){S.lesson.userText=el.value;save();}}
function submitWritingLesson(){
  saveWritingDraft();const task=currentFullTask(),words=countGermanWords(S.lesson.userText),target=Number(task.target_words)||80,min=Math.max(20,Math.round(target*.6));
  if(words<min)return alert('Текст пока слишком короткий для полезной проверки. Напишите хотя бы примерно '+min+' слов.');
  const near=words>=target*.75&&words<=target*1.45;
  S.lesson.submitted=true;S.lesson.score=near?.8:.65;S.lesson.feedback={ok:near,title:near?'Хорошая основа':'Проверьте объём и структуру',text:near?'Объём близок к заданию. Теперь проверьте все обязательные пункты и связность текста.':'Текст можно улучшить: приблизьте объём к ориентиру и проверьте, что каждый обязательный пункт раскрыт.'};
  if(!near)S.learningErrors.push({task_id:task.task_id,module:'Schreiben',skill:'Schreiben',micro_skill:'task_completion',created_at:now()});
  save();render();
}
function base64Blob(blob){return new Promise((resolve,reject)=>{const fr=new FileReader();fr.onload=()=>resolve(String(fr.result).split(',')[1]||'');fr.onerror=reject;fr.readAsDataURL(blob);});}
function speakingConversation(){
  if(!S.lesson.conversation||typeof S.lesson.conversation!=='object')S.lesson.conversation={started:false,sending:false,turns:[],covered:[],complete:false,voiceStatus:'',showTranscript:false,showTranslation:false,translation:'',showPhrases:false};
  else S.lesson.conversation=Object.assign({started:false,sending:false,turns:[],covered:[],complete:false,voiceStatus:'',showTranscript:false,showTranslation:false,translation:'',showPhrases:false},S.lesson.conversation);
  return S.lesson.conversation;
}
function planningCoverage(text,current=[]){
  const s=String(text||'').toLowerCase(),set=new Set(current||[]);
  if(/\b(montag|dienstag|mittwoch|donnerstag|freitag|samstag|sonntag|uhr|morgen|vormittag|nachmittag|abend|wochenende)\b/.test(s))set.add('Wann?');
  if(/\b(in der|im |bei |bibliothek|café|cafe|park|schule|zentrum|wohnung|haus|online|treffen wir uns)\b/.test(s))set.add('Wo?');
  if(/\b(ich|du|wir)\b.{0,45}\b(mache|machst|machen|kaufe|kaufst|bringen|mitbringen|organisieren|vorbereiten|reservieren|bestellen)\b/.test(s))set.add('Wer macht was?');
  if(/\b(brauchen|braucht|mitbringen|material|ticket|tickets|getränk|getränke|essen|geld|kamera|buch|bücher|werkzeug)\b/.test(s))set.add('Was braucht man?');
  return [...set];
}
function clearLessonRecording(){
  lessonAudioBlob=null;lessonChunks=[];S.lesson.recordingReady=false;
  if(lessonAudioUrl){URL.revokeObjectURL(lessonAudioUrl);lessonAudioUrl=null;}
}
async function transcribeLessonRecording(){
  if(!lessonAudioBlob)return{ok:false,code:'no_recording',message:'Сначала запишите реплику.'};
  try{
    const audio_base64=await base64Blob(lessonAudioBlob);
    const res=await fetch('/.netlify/functions/transcribe',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({audio_base64,mime_type:lessonAudioBlob.type})});
    const data=await res.json().catch(()=>({}));
    if(res.ok&&data.text)return{ok:true,text:String(data.text).trim()};
    if(res.status===503)return{ok:false,code:'transcription_not_configured',message:'Live Sprechen с Otto пока заблокирован: на сервере не подключена безопасная транскрипция речи.'};
    return{ok:false,code:'transcription_failed',message:'Не удалось расшифровать запись. Саму запись можно прослушать и повторить.'};
  }catch{return{ok:false,code:'transcription_network_error',message:'Не удалось связаться с сервисом расшифровки. Попробуйте ещё раз.'};}
}
async function playOttoRoleplay(text,context){
  const ok=await window.OTTO_SPEECH?.speakGerman?.(text,{voiceRole:'otto',context:context||'sprechen-partner'});
  const conv=speakingConversation();conv.voiceStatus=ok?'ready':'tts_unavailable';save();render();return ok;
}
async function requestOttoRoleplay(mode,message,extra={}){
  const conv=speakingConversation(),task=currentFullTask();if(conv.sending)return false;
  conv.sending=true;save();render();
  const context={
    mode,task_id:task?.task_id||null,teil:task?.teil||null,topic:task?.topic||null,
    planning_points:task?.planning_points||[],covered_planning_points:conv.covered||[],
    unresolved_planning_points:(task?.planning_points||[]).filter(x=>!(conv.covered||[]).includes(x)),
    conversation:(conv.turns||[]).slice(-10),exam_like:S.lesson.mode==='exam',...extra
  };
  try{
    const res=await fetch('/.netlify/functions/otto-chat',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({message,context})});
    const data=await res.json().catch(()=>({}));
    if(!res.ok)throw new Error(data.message||'Otto сейчас недоступен.');
    conv.turns.push({role:'otto',text:String(data.text||''),at:now()});conv.sending=false;save();render();
    await playOttoRoleplay(String(data.text||''),mode);
    return true;
  }catch(e){conv.sending=false;conv.voiceStatus='reply_error';S.lesson.micStatus=e?.message||'Otto сейчас недоступен.';save();render();return false;}
}
async function translateConversationTraining(){
  if(S.lesson.mode==='exam')return;
  const conv=speakingConversation();
  if(conv.translation){conv.showTranslation=!conv.showTranslation;save();render();return;}
  if(!conv.turns.length)return;
  conv.sending=true;save();render();
  const transcript=conv.turns.map(t=>(t.role==='otto'?'Otto: ':'Lernende Person: ')+t.text).join('\n');
  try{
    const res=await fetch('/.netlify/functions/otto-chat',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({message:transcript,context:{mode:'sprechen_translate_training',task_id:currentFullTask()?.task_id||null}})});
    const data=await res.json().catch(()=>({}));if(!res.ok)throw new Error(data.message||'Перевод сейчас недоступен.');
    conv.translation=String(data.text||'');conv.showTranslation=true;
  }catch(e){S.lesson.micStatus=e?.message||'Перевод сейчас недоступен.';}
  conv.sending=false;save();render();
}
function speakingTaskCard(task){
  return '<div class="card soft"><b>'+esc(task.instruction_de)+'</b>'+(S.lesson.mode==='exam'?'':'<p>'+esc(task.instruction_ru)+'</p>')+'</div>';
}
async function startOttoConversation(){
  const conv=speakingConversation();if(conv.started)return;
  conv.started=true;save();render();
  await requestOttoRoleplay('sprechen_aufgabe1_partner','Beginne das Planungsgespräch natürlich und frage nach einem ersten konkreten Punkt.');
}
async function sendConversationTurn(){
  const conv=speakingConversation();if(conv.sending)return;
  const tr=await transcribeLessonRecording();
  if(!tr.ok){S.lesson.micDiagnosticCode=tr.code;S.lesson.micStatus=tr.message;save();render();return;}
  conv.turns.push({role:'user',text:tr.text,at:now()});conv.covered=planningCoverage(tr.text,conv.covered);S.lesson.transcript=tr.text;clearLessonRecording();save();render();
  await requestOttoRoleplay('sprechen_aufgabe1_partner',tr.text,{user_transcript:tr.text});
  const userTurns=conv.turns.filter(x=>x.role==='user').length;
  if(userTurns>=3&&['Wann?','Wo?','Wer macht was?','Was braucht man?'].every(x=>conv.covered.includes(x))){conv.complete=true;save();render();}
}
function finishOttoConversation(){
  const conv=speakingConversation();if(!conv.complete)return alert('Im Gespräch sind noch nicht alle Planungspunkte geklärt.');
  S.lesson.submitted=true;S.lesson.score=null;S.lesson.feedback={text:'Диалог завершён. Otto сохранил несколько реальных обменов репликами и четыре пункта планирования. Учебный результат не выдаётся за официальный балл Goethe.'};save();render();
}
async function startFollowupQuestion(){
  const presentation=String(S.speakingContext?.lastPresentationTranscript||'').trim();
  if(!presentation)return alert('Сначала выполните Aufgabe 2 и запишите реальную презентацию.');
  const conv=speakingConversation();if(conv.started)return;
  conv.started=true;save();render();
  await requestOttoRoleplay('sprechen_aufgabe3_question','Reagiere auf die Präsentation und stelle eine relevante Frage.',{presentation_transcript:presentation});
}
async function sendFollowupAnswer(){
  const tr=await transcribeLessonRecording();if(!tr.ok){S.lesson.micDiagnosticCode=tr.code;S.lesson.micStatus=tr.message;save();render();return;}
  const conv=speakingConversation();conv.turns.push({role:'user',text:tr.text,at:now()});S.lesson.transcript=tr.text;clearLessonRecording();save();render();
  await requestOttoRoleplay('sprechen_aufgabe3_reaction',tr.text,{presentation_transcript:S.speakingContext.lastPresentationTranscript,user_answer_transcript:tr.text});
  conv.complete=true;S.lesson.submitted=true;S.lesson.score=null;S.lesson.feedback={text:'Follow-up завершён: Otto задал вопрос по содержанию вашей реальной презентации и получил голосовой ответ.'};save();render();
}
function formatSeconds(sec){sec=Math.max(0,Math.round(Number(sec)||0));return String(Math.floor(sec/60)).padStart(2,'0')+':'+String(sec%60).padStart(2,'0');}
function updateSpeakingTimer(){
  const el=document.querySelector('[data-speaking-timer]');if(!el)return;
  let sec=S.lesson.presentationDurationSeconds||0;
  if(lessonRecorder?.state==='recording'&&S.lesson.presentationStartedAt)sec=(Date.now()-S.lesson.presentationStartedAt)/1000;
  el.textContent=formatSeconds(sec);
}
function recorderMime(){
  if(!window.MediaRecorder)return '';
  const candidates=['audio/webm;codecs=opus','audio/webm','audio/mp4','audio/ogg;codecs=opus'];
  if(typeof MediaRecorder.isTypeSupported!=='function')return '';
  return candidates.find(x=>MediaRecorder.isTypeSupported(x))||'';
}
function micErrorInfo(error){
  const name=String(error?.name||''),msg=String(error?.message||'');
  if(name==='NotAllowedError'||name==='SecurityError')return{code:'permission_denied',message:'Разрешите микрофон для OTTO в настройках сайта.'};
  if(name==='NotFoundError'||name==='DevicesNotFoundError')return{code:'no_device',message:'Микрофон не найден.'};
  if(name==='NotReadableError'||name==='TrackStartError')return{code:'device_busy',message:'Микрофон сейчас занят другим приложением. Закройте его там и попробуйте снова.'};
  if(name==='OverconstrainedError')return{code:'constraints_failed',message:'Браузер не смог использовать доступный микрофон. Проверьте устройство ввода в настройках.'};
  if(name==='AbortError')return{code:'recording_aborted',message:'Запись была прервана. Попробуйте ещё раз.'};
  if(name==='TypeError'||/mediaDevices|MediaRecorder/i.test(msg))return{code:'unsupported_browser',message:'Этот браузер не поддерживает нужный режим записи. Откройте OTTO в актуальном Chrome, Edge или Safari.'};
  if(name==='NoAudioInput')return{code:'no_device',message:'Микрофон не найден.'};
  if(name==='EmptyRecording')return{code:'empty_recording',message:'Запись получилась пустой. Проверьте микрофон и повторите тест.'};
  return{code:'unknown_mic_error',message:'Не удалось открыть микрофон. Проверьте разрешение сайта и устройство ввода.'};
}
function setMicStatus(info){
  S.lesson.micDiagnosticCode=info.code;S.lesson.micStatus=info.message;save();render();
}
async function microphonePreflight(){
  S.lesson.micDiagnosticCode='checking';S.lesson.micStatus='Проверяем доступ к микрофону…';save();render();
  const local=['localhost','127.0.0.1'].includes(location.hostname);
  if(!(window.isSecureContext||local))return setMicStatus({code:'insecure_context',message:'Микрофон доступен только на защищённой HTTPS-странице.'});
  if(!navigator.mediaDevices?.getUserMedia)return setMicStatus({code:'unsupported_browser',message:'Этот браузер не поддерживает доступ к микрофону. Откройте OTTO в актуальном Chrome, Edge или Safari.'});
  if(!window.MediaRecorder)return setMicStatus({code:'unsupported_recorder',message:'В этом браузере недоступна запись звука. Обновите браузер или используйте другой.'});
  let stream=null;
  try{
    if(navigator.permissions?.query){
      try{const p=await navigator.permissions.query({name:'microphone'});if(p.state==='denied'){const e=new Error();e.name='NotAllowedError';throw e;}}catch(e){if(e?.name==='NotAllowedError')throw e;}
    }
    stream=await navigator.mediaDevices.getUserMedia({audio:true});
    if(navigator.mediaDevices.enumerateDevices){
      const devices=await navigator.mediaDevices.enumerateDevices();
      if(!devices.some(d=>d.kind==='audioinput')){const e=new Error();e.name='NoAudioInput';throw e;}
    }
    const mime=recorderMime(),parts=[],rec=new MediaRecorder(stream,mime?{mimeType:mime}:undefined);
    rec.ondataavailable=e=>{if(e.data?.size)parts.push(e.data);};
    await new Promise((resolve,reject)=>{rec.onerror=e=>reject(e.error||e);rec.onstop=resolve;rec.start();setTimeout(()=>{if(rec.state==='recording')rec.stop();},5000);});
    if(!parts.length||parts.reduce((n,b)=>n+b.size,0)===0){const e=new Error();e.name='EmptyRecording';throw e;}
    micTestBlob=new Blob(parts,{type:mime||parts[0]?.type||'audio/webm'});
    if(micTestUrl)URL.revokeObjectURL(micTestUrl);
    micTestUrl=URL.createObjectURL(micTestBlob);
    S.lesson.micDiagnosticCode='record_playback_ready';S.lesson.micStatus='Запись готова. Нажмите Play и убедитесь, что вы слышите себя.';save();render();
  }catch(e){setMicStatus(micErrorInfo(e));}
  finally{try{stream?.getTracks?.().forEach(t=>t.stop())}catch{}}
}
async function toggleLessonRecording(){
  if(lessonRecorder&&lessonRecorder.state==='recording'){lessonRecorder.stop();return;}
  if(!navigator.mediaDevices?.getUserMedia||!window.MediaRecorder){setMicStatus({code:'unsupported_browser',message:'Запись микрофона не поддерживается в этом браузере.'});return;}
  let stream=null;
  try{
    stream=await navigator.mediaDevices.getUserMedia({audio:true});const mime=recorderMime();lessonChunks=[];
    lessonRecorder=new MediaRecorder(stream,mime?{mimeType:mime}:undefined);
    lessonRecorder.ondataavailable=e=>{if(e.data?.size)lessonChunks.push(e.data);};
    lessonRecorder.onstop=()=>{
      try{stream?.getTracks?.().forEach(t=>t.stop())}catch{}
      const activeTask=currentFullTask();
      if(activeTask?.module==='Sprechen'&&Number(activeTask.teil)===2&&S.lesson.presentationStartedAt){S.lesson.presentationDurationSeconds=(Date.now()-S.lesson.presentationStartedAt)/1000;S.lesson.presentationStartedAt=null;}
      lessonAudioBlob=new Blob(lessonChunks,{type:mime||lessonChunks[0]?.type||'audio/webm'});
      if(lessonAudioUrl)URL.revokeObjectURL(lessonAudioUrl);
      lessonAudioUrl=URL.createObjectURL(lessonAudioBlob);
      S.lesson.recordingReady=true;S.lesson.micDiagnosticCode='recording_ready';S.lesson.micStatus='Запись готова.';lessonRecorder=null;save();render();
    };
    lessonRecorder.start();const activeTask=currentFullTask();if(activeTask?.module==='Sprechen'&&Number(activeTask.teil)===2&&!S.lesson.presentationStartedAt)S.lesson.presentationStartedAt=Date.now();S.lesson.micDiagnosticCode='recording';S.lesson.micStatus='Идёт запись…';save();render();
  }catch(e){try{stream?.getTracks?.().forEach(t=>t.stop())}catch{};setMicStatus(micErrorInfo(e));}
}
async function submitSpeakingLesson(skip){
  const task=currentFullTask();
  if(skip){S.lesson.submitted=true;S.lesson.score=null;S.lesson.feedback={text:'Задание пропущено. Otto предложит устную практику снова позже.'};S.learningErrors.push({task_id:task.task_id,module:'Sprechen',skill:'Sprechen',micro_skill:'speaking_practice',created_at:now()});save();render();return;}
  if(Number(task.teil)!==2)return alert('Для этой части используйте диалоговый Sprechen-flow.');
  const tr=await transcribeLessonRecording();
  if(tr.ok){
    S.lesson.transcript=tr.text;
    S.speakingContext.lastPresentationTranscript=tr.text;S.speakingContext.lastPresentationTaskId=task.task_id;S.speakingContext.lastPresentationAt=now();
  }else{
    S.lesson.transcript='';S.lesson.micDiagnosticCode=tr.code;S.lesson.micStatus=tr.message;
  }
  S.lesson.submitted=true;S.lesson.score=null;
  const sec=Math.round(S.lesson.presentationDurationSeconds||0);
  S.lesson.feedback={text:'Презентация записана ('+formatSeconds(sec)+'). Проверяйте пять обязательных шагов структуры. Автоматический балл за произношение и беглость не выставляется.'+(tr.ok?' Расшифровка сохранена для следующего follow-up.':' Live follow-up с Otto требует рабочей серверной транскрипции.')};
  save();render();
}
function recordManualHistory(task,score,assisted){
  const old=S.task_history[task.task_id]||{},d=new Date(),next=new Date(d);next.setUTCDate(next.getUTCDate()+(score!=null&&score<.7?2:5));
  S.task_history[task.task_id]={task_id:task.task_id,module:task.module,part:Number(task.teil),completed_at:now(),score:score,assistance_used:!!assisted,last_seen:d.toISOString().slice(0,10),next_review:next.toISOString().slice(0,10),attempt_count:(old.attempt_count||0)+1};
}
function finishLessonAndAdvance(){
  const task=currentFullTask();if(!task)return;
  if(S.lesson.fromSession&&FULL){FULL.recordCompletion(S,task,{score:S.lesson.score,assistance_used:S.lesson.assistance_used});save();if(S.dailySession.finished){go('session-summary');return;}startSessionTask();return;}
  recordManualHistory(task,S.lesson.score,S.lesson.assistance_used);save();S.selectedModule=task.module;go('module');
}
function sessionSummaryView(){
  const done=S.dailySession.completed||[],history=S.task_history||{},good=done.filter(id=>history[id]&&history[id].score!=null&&history[id].score>=.7).length;
  return '<span class="eyebrow">Сегодня готово</span><h1 class="h2">Занятие завершено</h1><p class="lead">Выполнено заданий: '+done.length+'. Уверенно получилось: '+good+'.</p>'+card('Что получилось',good?good+' заданий выполнены устойчиво.':'Сегодня важнее было разобрать трудные места, а не гнаться за числом.','good')+card('Что повторим',S.learningErrors.length?'Otto вернёт в маршрут ошибки, которые повторялись сегодня.':'Явных повторяющихся ошибок сегодня не добавилось.','soft')+card('Следующая сессия','При следующем входе Otto выберет новые задания и учтёт сроки повторения.','soft')+'<div class="button-row">'+button('На главную','open-home')+button('Посмотреть маршрут','open-route','ghost')+'</div>';
}
function playLessonAudio(){
  const task=currentFullTask(),items=closedItems(task),q=items[S.lesson.index];if(!q?.audio)return;
  const p=q.audio.playback_rules||{},used=S.lesson.audioPlays[q.audio.audio_id]||0,limit=S.lesson.mode==='exam'?p.exam_play_count:p.training_play_count;
  if(used>=limit)return;
  S.lesson.audioPlays[q.audio.audio_id]=used+1;if(used+1>(p.exam_play_count||1))S.lesson.assistance_used=true;save();
  const a=new Audio(q.audio.asset_src);a.play().catch(()=>alert('Аудио пока не загрузилось. Обновите страницу или попробуйте позже.'));render();
}
async function sendOttoMessage(){
  const input=$('#ottoMessage');if(!input||S.ottoChat.sending)return;const message=input.value.trim();if(!message)return;if(message.length>2000)return alert('Сообщение слишком длинное.');
  const task=currentFullTask(),context=FULL?FULL.ottoContext(S,task):{module:S.selectedModule};
  if(task){
    const items=closedItems(task),item=items[S.lesson.index||0];
    if(item){
      context.current_prompt=item.prompt||null;
      context.user_answer=S.lesson.answers[item.id]??null;
      context.attempted=!!(S.lesson.checked[item.id]||S.lesson.submitted);
      if(context.attempted){
        context.correct_answer=item.correct??null;
        context.evidence=item.evidence||null;
        context.trap=item.trap||null;
      }
    }
    if(task.module==='Schreiben'){
      context.required_points=task.required_points||[];
      context.user_text=S.lesson.userText||'';
    }
    if(task.module==='Sprechen')context.user_transcript=S.lesson.transcript||'';
    context.recent_errors=(S.learningErrors||[]).slice(-5).map(x=>({module:x.module||null,micro_skill:x.micro_skill||null}));
  }
  S.ottoChat.messages.push({role:'user',text:message});S.ottoChat.sending=true;S.ottoChat.error=null;save();renderModal();
  try{
    const res=await fetch('/.netlify/functions/otto-chat',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({message,context})});
    const data=await res.json().catch(()=>({}));if(!res.ok)throw new Error(data.message||'Otto сейчас недоступен.');
    S.ottoChat.messages.push({role:'otto',text:data.text});
  }catch(e){S.ottoChat.messages.push({role:'otto',text:e&&e.message?e.message:'Otto сейчас недоступен.'});}
  S.ottoChat.sending=false;save();renderModal();
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
    lesson:lessonView,'session-summary':sessionSummaryView,
    errors:errorsView,progress:progressView,settings:settingsView
  };
  const content=(views[r]||registerView)();
  const unlockedBack=!['register','verify','diagnostic-gate','diagnostic','home'].includes(r);
  $('#screen').innerHTML=(unlockedBack?'<div class="page-back"><button class="btn ghost" data-action="nav-back">← К предыдущему экрану</button></div>':'')+content;
  const locked=['register','verify','diagnostic-gate','diagnostic'].includes(r);
  $('#bottomNav').classList.toggle('hidden',locked);
  $('#guideButton').classList.toggle('hidden',locked);
  $('#utilityDock').classList.toggle('hidden',locked);
  $('#ottoDecor').classList.toggle('hidden',locked);
  $('#ottoDecor').src=window.OTTO_SRC||'';
  $('#ottoNavImg').src=window.OTTO_SRC||'';
  document.querySelectorAll('[data-nav]').forEach(function(b){b.classList.toggle('active',b.dataset.nav===r);});
  renderModal();
  bindActionButtons();
}

function click(e){
  const nav=e.target.closest('[data-nav]');if(nav){go(nav.dataset.nav);return;}
  const guideTab=e.target.closest('[data-guide-module]');if(guideTab){S.selectedGuide=guideTab.dataset.guideModule;save();render();return;}
  const startLearn=e.target.closest('[data-start-learning]');if(startLearn){startLearning(Number(startLearn.dataset.startLearning),'training');return;}
  const startExam=e.target.closest('[data-start-exam]');if(startExam){startLearning(Number(startExam.dataset.startExam),'exam');return;}
  const startFull=e.target.closest('[data-start-full]');if(startFull){startFullLearning(Number(startFull.dataset.startFull),startFull.dataset.mode||'training');return;}
  const fullChoice=e.target.closest('[data-full-choice]');if(fullChoice){selectFullChoice(fullChoice.dataset.fullChoice);return;}
  const errorTrain=e.target.closest('[data-error-train]');if(errorTrain){
    const cards=document.querySelectorAll('[data-error-train]'),idx=Array.from(cards).indexOf(errorTrain),models=[];
    const wrong=S.diagnostic.session.answers.filter(a=>a.correct===false);wrong.forEach(a=>models.push(errorModel(a)));
    if(Array.isArray(S.learningErrors))S.learningErrors.forEach(a=>models.push(errorModel(a)));
    const m=models[Math.max(0,idx)]||ERROR_MODELS.evidence_and_paraphrase;S.selectedModule=m.module==='Грамматика'?'Lesen':m.module;save();const sets=generatedPart(S.selectedModule,1);if(sets.length){resetLesson(sets[0],'training',false);go('lesson');}else go('module');return;
  }
  const learnChoice=e.target.closest('[data-learn-choice]');if(learnChoice){if(!S.learning.checked[S.learning.index]){S.learning.answers[S.learning.index]=Number(learnChoice.dataset.learnChoice);save();render();}return;}
  const support=e.target.closest('[data-support-level]');if(support){S.learning.supportLevel=Number(support.dataset.supportLevel);S.learning.translation=false;S.learning.instructionHelp=false;S.learning.strategy=false;S.learning.dictionary=false;save();render();return;}
  const speakWord=e.target.closest('[data-speak-word]');if(speakWord){speakText(speakWord.dataset.speakWord);return;}
  const mod=e.target.closest('[data-module]');if(mod){S.selectedModule=mod.dataset.module;S.selectedGuide=S.selectedModule;save();go('module');return;}
  const mins=e.target.closest('[data-minutes]');if(mins){captureRegistrationDraft();S.dailyMinutes=Number(mins.dataset.minutes);save();render();return;}
  const gender=e.target.closest('[data-setting-gender]');if(gender){S.gender=gender.dataset.settingGender;save();render();return;}
  const size=e.target.closest('[data-text-size]');if(size){PREFS.textSize=size.dataset.textSize;savePrefs();render();return;}
  const helpMode=e.target.closest('[data-help-mode]');if(helpMode){PREFS.helpMode=helpMode.dataset.helpMode;savePrefs();render();return;}
  const voiceSpeed=e.target.closest('[data-voice-speed]');if(voiceSpeed){PREFS.voiceSpeed=voiceSpeed.dataset.voiceSpeed;savePrefs();render();return;}
  const reminderDay=e.target.closest('[data-reminder-day]');if(reminderDay){const d=Number(reminderDay.dataset.reminderDay),has=PREFS.reminder.days.includes(d);PREFS.reminder.days=has?PREFS.reminder.days.filter(x=>x!==d):[...PREFS.reminder.days,d].sort();savePrefs();render();return;}
  const ch=e.target.closest('[data-diag-choice]');if(ch){answerDiagnostic(Number(ch.dataset.diagChoice));return;}
  const sessionMod=e.target.closest('[data-session-module]');if(sessionMod){
    const m=sessionMod.dataset.sessionModule;S.selectedModule=m;S.selectedGuide=m;save();
    if(m==='Lesen')startLearning(1,'training');else go('guide');
    return;
  }
  const a=e.target.closest('[data-action]');if(a){handleAction(a.dataset.action);return;}
}
function handleAction(x){
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
  else if(x==='start-first')startFirstLesson();
  else if(x==='resume-session')startSessionTask();
  else if(x==='start-session')startFirstLesson();
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
  else if(x==='otto-send')sendOttoMessage();
  else if(x==='close-modal'){S.ui.helpOpen=false;S.ui.ottoOpen=false;save();renderModal();}
  else if(x==='share-app')shareApp();
  else if(x==='settings-edit-profile')editLocalProfile();
  else if(x==='settings-logout')logoutLocalProfile();
  else if(x==='request-notifications')requestReminderPermission().then(()=>render());
  else if(x==='save-reminder'){const input=$('#reminderTime');if(input)PREFS.reminder.time=input.value;PREFS.reminder.enabled=PREFS.reminder.days.length>0;savePrefs();alert('Настройка напоминания сохранена.');render();}
  else if(x==='test-otto-voice'){window.OTTO_SPEECH?.speakGerman?.('Hallo. Ich heiße Otto. Schön, dass du da bist.',{voiceRole:'otto',context:'settings'}).then(ok=>{if(!ok)alert('Фирменный голос Otto пока не настроен на сервере.');});}
  else if(x==='install-app')installApp();
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
  else if(x==='lesson-translation')lessonAssistance('translation');
  else if(x==='lesson-strategy')lessonAssistance('strategy');
  else if(x==='lesson-dictionary')lessonAssistance('dictionary');
  else if(x==='lesson-sample')lessonAssistance('sample');
  else if(x==='lesson-audio')playLessonAudio();
  else if(x==='full-check')checkFullAnswer();
  else if(x==='full-back')fullBack();
  else if(x==='full-next')fullNext();
  else if(x==='full-exam-next')fullExamNext();
  else if(x==='lesson-review'){S.lesson.review=true;save();render();}
  else if(x==='writing-submit')submitWritingLesson();
  else if(x==='mic-preflight')microphonePreflight();
  else if(x==='lesson-record')toggleLessonRecording();
  else if(x==='speaking-submit')submitSpeakingLesson(false);
  else if(x==='speaking-skip')submitSpeakingLesson(true);
  else if(x==='speaking-conversation-start')startOttoConversation();
  else if(x==='speaking-conversation-send')sendConversationTurn();
  else if(x==='speaking-conversation-finish')finishOttoConversation();
  else if(x==='speaking-followup-start')startFollowupQuestion();
  else if(x==='speaking-followup-send')sendFollowupAnswer();
  else if(x==='conversation-transcript'){const conv=speakingConversation();conv.showTranscript=!conv.showTranscript;save();render();}
  else if(x==='conversation-translation')translateConversationTraining();
  else if(x==='conversation-phrases'){const conv=speakingConversation();conv.showPhrases=!conv.showPhrases;save();render();}
  else if(x==='start-sprechen-a2'){const t=chooseGeneratedTask('Sprechen',2);if(t){S.selectedModule='Sprechen';resetLesson(t,'training',false);go('lesson');}}
  else if(x==='lesson-complete')finishLessonAndAdvance();
}
function bindActionButtons(){
  const bind=(selector,fn)=>document.querySelectorAll(selector).forEach(function(el){
    el.onclick=function(e){e.preventDefault();e.stopPropagation();fn(el);};
  });
  bind('[data-action]',el=>handleAction(el.dataset.action));
  bind('[data-text-size]',el=>{PREFS.textSize=el.dataset.textSize;savePrefs();render();});
  bind('[data-help-mode]',el=>{PREFS.helpMode=el.dataset.helpMode;savePrefs();render();});
  bind('[data-voice-speed]',el=>{PREFS.voiceSpeed=el.dataset.voiceSpeed;savePrefs();render();});
  bind('[data-setting-gender]',el=>{S.gender=el.dataset.settingGender;save();render();});
  bind('[data-reminder-day]',el=>{const d=Number(el.dataset.reminderDay),has=PREFS.reminder.days.includes(d);PREFS.reminder.days=has?PREFS.reminder.days.filter(x=>x!==d):[...PREFS.reminder.days,d].sort();savePrefs();render();});
  bind('[data-diag-choice]',el=>answerDiagnostic(Number(el.dataset.diagChoice)));
}
document.addEventListener('click',click);
document.addEventListener('input',function(e){if(e.target&&e.target.id==='fullWriting'){S.lesson.userText=e.target.value;save();}if(e.target&&e.target.id==='reminderTime'){PREFS.reminder.time=e.target.value;}});
$('#resetButton').addEventListener('click',()=>{if(confirm('Сбросить профиль, диагностику и прогресс?'))reset();});
window.addEventListener('popstate',render);
window.addEventListener('hashchange',render);
window.addEventListener('focus',maybeSendReminder);
setInterval(maybeSendReminder,30000);
setInterval(updateSpeakingTimer,500);
if('serviceWorker' in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>undefined),{once:true});

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
