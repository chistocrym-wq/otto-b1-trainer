'use strict';

const BANK=window.OTTO_DIAGNOSTIC_BANK;
const ENGINE=window.OTTO_DIAGNOSTIC_ENGINE;
const STORAGE='ottoB1.clean.preview.v2';
const MODULES=['Lesen','Hören','Schreiben','Sprechen'];
const EXAM_MAP={
  Lesen:{time:'65 минут',parts:[
    ['Teil 1','Личный/повседневный текст · Richtig/Falsch'],
    ['Teil 2','Информационные/публицистические тексты · a/b/c'],
    ['Teil 3','Ситуации ↔ объявления'],
    ['Teil 4','Позиции людей · Ja/Nein'],
    ['Teil 5','Правила/инструкции · a/b/c']
  ]},
  Hören:{time:'около 40 минут',parts:[
    ['Teil 1','5 коротких аудио · Richtig/Falsch + a/b/c'],
    ['Teil 2','Более длинный текст · a/b/c'],
    ['Teil 3','Разговор · Richtig/Falsch'],
    ['Teil 4','Дискуссия · соотнести высказывания с говорящими']
  ]},
  Schreiben:{time:'60 минут',parts:[
    ['Aufgabe 1','Личная E-Mail · около 80 слов'],
    ['Aufgabe 2','Мнение/дискуссионный текст · около 80 слов'],
    ['Aufgabe 3','Короткое сообщение/E-Mail · около 40 слов']
  ]},
  Sprechen:{time:'около 15 минут + подготовка',parts:[
    ['Aufgabe 1','Gemeinsam etwas planen'],
    ['Aufgabe 2','Präsentation'],
    ['Aufgabe 3','Reaktion + Fragen/Antworten']
  ]}
};

const $=s=>document.querySelector(s);
const esc=v=>String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const now=()=>new Date().toISOString();
let memoryFallback=null;
let mediaRecorder=null;
let mediaChunks=[];
let audioBlobMeta=null;
let itemStartedAt=Date.now();
let activeProductivePrompt=null;
let speakingPromptIndex=0;

function freshState(){
  return {
    appVersion:3,
    name:'',gender:'',examDate:'',dailyMinutes:25,
    auth:{method:'email',contact:'',verified:false},
    diagnostic:ENGINE.createSession(),
    lastDiagnosticResult:null,
    selectedModule:'Lesen',
    ui:{selected:null,ottoOpen:false},
    updatedAt:now()
  };
}
function load(){
  try{
    const raw=localStorage.getItem(STORAGE);
    if(!raw)return freshState();
    const old=JSON.parse(raw),s=freshState();
    s.name=old.name||'';s.gender=old.gender||'';s.examDate=old.examDate||'';s.dailyMinutes=[10,25,45].includes(old.dailyMinutes)?old.dailyMinutes:25;
    s.auth=Object.assign(s.auth,old.auth||{});
    s.selectedModule=old.selectedModule||'Lesen';
    if(old.diagnostic&&old.diagnostic.diagnostic_version===BANK.version){
      s.diagnostic=old.diagnostic;
      s.lastDiagnosticResult=old.lastDiagnosticResult||null;
    }else{
      // Old 6-step demo diagnostic is intentionally invalidated; registration survives.
      s.diagnostic=ENGINE.createSession();
      s.lastDiagnosticResult=null;
    }
    return s;
  }catch(e){return memoryFallback||freshState();}
}
let S=load();
function save(){
  S.updatedAt=now();
  try{localStorage.setItem(STORAGE,JSON.stringify(S));}
  catch(e){memoryFallback=JSON.parse(JSON.stringify(S));}
}
function go(next){
  S.ui.selected=null;save();
  const h='#'+next;
  if(location.hash!==h)history.pushState(null,'',h);
  render();
}
function reset(){
  if(!confirm('Сбросить Preview полностью, включая регистрацию и диагностику?'))return;
  try{localStorage.removeItem(STORAGE);}catch(e){}
  memoryFallback=null;S=freshState();history.replaceState(null,'','#register');render();
}
function captureRegistrationDraft(){
  const n=$('#regName'),g=$('#regGender'),d=$('#regExamDate'),c=$('#regContact');
  if(n)S.name=n.value;if(g)S.gender=g.value;if(d)S.examDate=d.value;if(c&&S.auth.method==='email')S.auth.contact=c.value;
}
function route(){return (location.hash||'#register').slice(1);}
function button(label,action,kind='primary',extra=''){return '<button class="btn '+kind+'" data-action="'+action+'" '+extra+'>'+label+'</button>';}
function pill(label,kind=''){return '<span class="pill '+kind+'">'+esc(label)+'</span>';}
function card(title,body,kind=''){return '<div class="card '+kind+'"><div class="card-title">'+title+'</div><div class="muted">'+body+'</div></div>';}
function progressBar(value){return '<div class="progress-line"><i style="width:'+Math.max(0,Math.min(100,value))+'%"></i></div>';}
function confidenceRu(v){return v==='high'?'высокая':v==='medium'?'средняя':v==='low'?'низкая':'недостаточно данных';}

function registerView(){
  const contact=S.auth.method==='email'
    ? '<label><b>Email</b><input id="regContact" class="field" type="email" value="'+esc(S.auth.contact)+'" placeholder="name@example.com"></label>'
    : '<div class="friendly-note"><b>Telegram</b><br>В production здесь будет подтверждение через Telegram Mini App. В Preview проверяем только UX этого шага.</div>';
  return '<section class="registration-stage"><div class="auth-wrap"><div class="auth-hero">'+
    '<div class="auth-otto natural"><img src="'+window.OTTO_SRC+'" alt="Otto"></div>'+
    '<span class="kicker">Тренажёр Otto · Goethe-Zertifikat B1</span><h1 class="h1">Готовимся к сертификату B1</h1>'+
    '<p class="lead" style="margin:0 auto">Спокойно: Otto сначала точно определит стартовую точку, а потом не будет тратить ваше время на слишком лёгкие или слишком сложные задания.</p></div>'+
    '<div class="auth-card"><h2 style="margin-top:0">Регистрация</h2><div class="form-grid">'+
    '<label><b>Имя</b><input id="regName" class="field" value="'+esc(S.name)+'" placeholder="Как к вам обращаться"></label>'+
    '<label><b>Как к вам обращаться?</b><select id="regGender" class="field"><option value="">Не указывать</option><option value="female" '+(S.gender==='female'?'selected':'')+'>Женский род</option><option value="male" '+(S.gender==='male'?'selected':'')+'>Мужской род</option></select></label>'+
    '<div><b>Способ входа</b><div class="auth-tabs"><button data-action="auth-email" class="'+(S.auth.method==='email'?'active':'')+'">Email</button><button data-action="auth-telegram" class="'+(S.auth.method==='telegram'?'active':'')+'">Telegram</button></div></div>'+
    contact+
    '<label><b>Дата экзамена, если известна</b><input id="regExamDate" class="field" type="date" value="'+esc(S.examDate)+'"></label>'+
    '<div><b>Сколько времени обычно удобно заниматься?</b><div class="button-row">'+[10,25,45].map(n=>'<button class="btn '+(S.dailyMinutes===n?'primary':'ghost')+'" data-minutes="'+n+'">'+n+' минут</button>').join('')+'</div></div>'+
    '</div><div class="button-row">'+button(S.auth.method==='email'?'Получить код':'Продолжить в Telegram','submit-registration')+'</div>'+
    '<p class="registration-note">Изменение 10/25/45 минут меняет только эту настройку — уже введённые имя, Email и дата не сбрасываются.</p></div></div></section>';
}
function verifyView(){
  const body=S.auth.method==='email'
    ? '<p class="muted">Для Preview используйте код <b>111111</b>.</p><input id="verifyCode" class="field verify-code" maxlength="6" inputmode="numeric" placeholder="000000">'
    : '<div class="friendly-note">В production здесь будет Telegram Mini App. Для Preview нажмите «Подтвердить».</div>';
  return '<div class="auth-wrap"><div class="auth-card"><span class="eyebrow">Подтверждение</span><h1 class="h2">'+(S.auth.method==='email'?'Введите код из письма':'Telegram')+'</h1>'+body+
    '<div class="button-row">'+button('Подтвердить','verify')+button('Назад','back-register','ghost')+'</div></div></div>';
}
function diagnosticGate(){
  return '<div class="gate-card"><div class="auth-otto natural"><img src="'+window.OTTO_SRC+'" alt="Otto"></div>'+
    '<span class="eyebrow">Обязательная калибровка</span><h1 class="h1">Сначала — нормальная диагностика</h1>'+
    '<p class="lead">Она может занять дольше старого демо-теста, зато маршрут будет основан на нескольких независимых доказательствах, а не на одном удачном клике.</p>'+
    '<div class="friendly-note" style="text-align:left;margin:20px 0"><b>4 этапа:</b><br>1) широкий screening A1→B1;<br>2) адаптивная проверка около вашей границы;<br>3) реальный письменный sample;<br>4) речевой sample, а около B1 — ещё и interactive probe.<br><br><b>Чем точнее старт, тем меньше времени уйдёт на лишние упражнения.</b></div>'+
    (S.diagnostic.answers.length?card('Можно продолжить','Сохранено ответов: '+S.diagnostic.answers.length+'. Диагностика продолжится с того же места.','good'):'')+
    '<div class="button-row">'+button(S.diagnostic.answers.length?'Продолжить диагностику':'Начать диагностику','start-diagnostic')+'</div></div>';
}
function diagnosticStageInfo(){
  const p=S.diagnostic.phase;
  if(p==='screening_core'||p==='screening_path')return {n:1,title:'Широкий screening',time:'примерно 4–7 минут'};
  if(p==='boundary'||p==='boundary_extra')return {n:2,title:'Проверяем границу',time:p==='boundary_extra'?'ещё примерно 2–3 минуты':'примерно 3–5 минут'};
  if(p==='closed_complete'||p==='writing')return {n:3,title:'Письменный sample',time:'примерно 6–12 минут'};
  return {n:4,title:'Речевой sample',time:'примерно 2–5 минут'};
}
function diagnosticView(){
  ENGINE.getClosedDecision(S.diagnostic);
  if(S.diagnostic.phase==='closed_complete'||S.diagnostic.phase==='writing')return writingDiagnosticView();
  if(S.diagnostic.phase==='speaking')return speakingDiagnosticView();
  if(S.diagnostic.phase==='complete'||S.diagnostic.completed)return reportView();

  const item=ENGINE.nextItem(S.diagnostic);
  if(!item){return '<h1 class="h2">Подготавливаем следующий этап…</h1>';}
  activeProductivePrompt=null;
  const st=diagnosticStageInfo();
  const answered=S.diagnostic.answers.length;
  const pct=st.n===1?Math.min(24,8+answered*2):st.n===2?35+Math.min(28,(S.diagnostic.boundaryRounds||1)*10+S.diagnostic.cursor*3):50;
  let media='';
  if(item.modality==='audio'){
    const key=item.item_id;
    const prev=(S.diagnostic.audioPlays&&S.diagnostic.audioPlays[key])||0;
    media='<div class="audio-card"><b>🎧 Hören</b><p class="small">Оригинальный diagnostic script, озвучка — системный de-DE голос браузера. Для placement проверяем понимание содержания; это не оценка качества реальной записи.</p>'+
      '<button class="btn secondary" data-action="diag-play-audio" '+(prev>=2?'disabled':'')+'>▶ Воспроизвести '+(prev?('ещё раз ('+prev+'/2)'):'')+'</button></div>';
  }
  const text=item.text?'<div class="task-text">'+esc(item.text)+'</div>':'';
  return '<span class="eyebrow">Этап '+st.n+' из 4 · '+st.title+'</span>'+progressBar(pct)+
    '<div class="diagnostic-meta"><span>Осталось: '+st.time+'</span><span>Autosave включён</span></div>'+
    '<h1 class="h2">Задание на зоне '+esc(item.target_band)+'</h1>'+
    '<p class="small">Внутренняя учебная зона OTTO, не официальный CEFR-сертификат.</p>'+media+text+
    '<p class="lead" style="font-size:17px"><b>'+esc(item.prompt)+'</b></p>'+
    '<div class="choice-grid">'+item.options.map((o,i)=>'<button class="choice '+(S.ui.selected===i?'selected':'')+'" data-choice="'+i+'">'+esc(o)+'</button>').join('')+'</div>'+
    '<div class="button-row">'+button('Продолжить','diag-submit')+'</div>';
}
function playDiagnosticAudio(){
  const item=ENGINE.nextItem(S.diagnostic);if(!item||!item.audio_script)return;
  S.diagnostic.audioPlays=S.diagnostic.audioPlays||{};
  const n=S.diagnostic.audioPlays[item.item_id]||0;if(n>=2)return;
  S.diagnostic.audioPlays[item.item_id]=n+1;save();
  if(!('speechSynthesis' in window)){alert('В этом браузере недоступна системная озвучка. Evidence Hören здесь нельзя собрать надёжно.');return;}
  speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(item.audio_script);u.lang='de-DE';u.rate=item.target_band.startsWith('B1')?0.98:item.target_band.startsWith('A2')?0.9:0.82;speechSynthesis.speak(u);render();
}
function submitDiagnosticClosed(){
  const item=ENGINE.nextItem(S.diagnostic);if(!item)return;
  if(S.ui.selected==null){alert('Выберите ответ.');return;}
  const duration=Date.now()-itemStartedAt;
  ENGINE.submitClosed(S.diagnostic,item.item_id,S.ui.selected,{duration_ms:duration,audio_plays:(S.diagnostic.audioPlays||{})[item.item_id]||0});
  S.ui.selected=null;itemStartedAt=Date.now();save();render();
}
function writingDiagnosticView(){
  S.diagnostic.phase='writing';
  const prompt=ENGINE.selectWritingPrompt(S.diagnostic);activeProductivePrompt=prompt;
  return '<span class="eyebrow">Этап 3 из 4 · Schreiben</span>'+progressBar(68)+
    '<h1 class="h2">Нужен настоящий письменный sample</h1>'+
    '<p class="lead">Prompt выбран по предварительно найденному диапазону. Текст сохраняется как productive evidence, но Preview <b>не придумывает уровень</b> без надёжной оценки.</p>'+
    '<div class="task-text"><b>'+esc(prompt.target_band)+' · '+esc(prompt.task_family)+'</b><br><br>'+esc(prompt.prompt)+'</div>'+
    '<textarea id="diagWriting" class="field" rows="11" placeholder="Schreiben Sie auf Deutsch…">'+esc(S.diagnostic.writing?.text||'')+'</textarea>'+
    '<div class="notice">После сохранения статус Schreiben будет «требуется оценка», пока не подключён versioned evaluator/rubric.</div>'+
    '<div class="button-row">'+button('Сохранить и перейти к Sprechen','save-writing')+'</div>';
}
function validateWriting(text,prompt){
  const words=(text.match(/[A-Za-zÄÖÜäöüß]+/g)||[]).length;
  const cyr=(text.match(/[А-Яа-яЁё]+/g)||[]).length;
  if(words<20||cyr>words)return {ok:false,reason:'Нужен осмысленный текст преимущественно по-немецки. Русский текст или случайный набор символов не создаёт placement evidence.'};
  const min=prompt.item_id==='W-A1'?25:prompt.item_id==='W-A2'?45:60;
  if(words<min)return {ok:false,reason:'Для этого диапазона sample пока слишком короткий, чтобы быть полезным для проверки.'};
  return {ok:true,wordCount:words};
}
function saveWriting(){
  const prompt=activeProductivePrompt||ENGINE.selectWritingPrompt(S.diagnostic);
  const text=$('#diagWriting').value.trim();const check=validateWriting(text,prompt);
  if(!check.ok){alert(check.reason);return;}
  ENGINE.saveWritingSample(S.diagnostic,prompt.item_id,text,{wordCount:check.wordCount});
  speakingPromptIndex=0;audioBlobMeta=null;save();render();
}
function speakingDiagnosticView(){
  const prompts=ENGINE.selectSpeakingPrompts(S.diagnostic);
  if(speakingPromptIndex>=prompts.length){
    ENGINE.markComplete(S.diagnostic);S.lastDiagnosticResult=ENGINE.result(S.diagnostic);save();return reportView();
  }
  const p=prompts[speakingPromptIndex];activeProductivePrompt=p;
  const isInteractive=p.item_id==='S-B1';
  const recorded=S.diagnostic.speaking.find(x=>x.promptId===p.item_id);
  return '<span class="eyebrow">Этап 4 из 4 · Sprechen</span>'+progressBar(84+speakingPromptIndex*7)+
    '<h1 class="h2">'+(isInteractive?'Interactive B1-oriented probe':'Речевой sample')+'</h1>'+
    '<p class="lead">'+(isInteractive?'Если screening дошёл до B1, одного монолога недостаточно. Здесь нужен ответ на партнёра и реакция на изменение плана.':'Запишите ответ голосом. Транскрипт сам по себе не считается оценкой Sprechen.')+'</p>'+
    '<div class="task-text">'+esc(p.prompt)+'</div>'+
    (isInteractive?'<div class="speaker"><div class="speaker-avatar"><img src="'+window.OTTO_SRC+'" alt="Otto"></div><div><b>Otto:</b><div class="muted">Wir wollen am Samstag etwas mit unserer Lerngruppe machen. Ich schlage 16 Uhr im Park vor. Was meinst du? Nenne bitte auch einen Grund.</div></div></div><div class="button-row">'+button('🔊 Otto говорит','speak-probe','secondary')+'</div>':'')+
    '<div id="recordBox" class="record-box '+(mediaRecorder&&mediaRecorder.state==='recording'?'recording':'')+'"><span class="record-dot"></span><b> '+(mediaRecorder&&mediaRecorder.state==='recording'?'Идёт запись…':'Запись микрофона')+'</b><div class="button-row" style="justify-content:center">'+button(mediaRecorder&&mediaRecorder.state==='recording'?'■ Остановить':'🎙 Записать ответ','record-speaking','secondary')+'</div></div>'+
    (recorded?card('Sample сохранён','Аудио получено. Статус: NEEDS_REVIEW — уровень по одному transcript не придумывается.','good'):'')+
    '<div class="button-row">'+button(recorded?'Продолжить':'Нет микрофона / продолжить без оценки','speaking-next',recorded?'primary':'ghost')+'</div>';
}
function speakProbe(){
  if(!('speechSynthesis' in window))return alert('Озвучка недоступна.');
  const u=new SpeechSynthesisUtterance('Wir wollen am Samstag etwas mit unserer Lerngruppe machen. Ich schlage sechzehn Uhr im Park vor. Was meinst du? Nenne bitte auch einen Grund.');u.lang='de-DE';u.rate=.95;speechSynthesis.cancel();speechSynthesis.speak(u);
}
async function toggleSpeakingRecord(){
  if(mediaRecorder&&mediaRecorder.state==='recording'){mediaRecorder.stop();mediaRecorder.stream.getTracks().forEach(t=>t.stop());return;}
  try{
    const stream=await navigator.mediaDevices.getUserMedia({audio:true});mediaChunks=[];
    mediaRecorder=new MediaRecorder(stream);mediaRecorder.stream=stream;
    mediaRecorder.ondataavailable=e=>{if(e.data.size)mediaChunks.push(e.data);};
    mediaRecorder.onstop=()=>{
      const bytes=mediaChunks.reduce((n,b)=>n+b.size,0);audioBlobMeta={bytes,audio:bytes>0};
      const p=activeProductivePrompt||ENGINE.selectSpeakingPrompts(S.diagnostic)[speakingPromptIndex];
      ENGINE.saveSpeakingSample(S.diagnostic,p.item_id,{audio:bytes>0,bytes,interaction:p.item_id==='S-B1'});
      mediaRecorder=null;save();render();
    };
    mediaRecorder.start();render();
  }catch(e){alert('Нет доступа к микрофону: '+e.message);}
}
function speakingNext(){
  const prompts=ENGINE.selectSpeakingPrompts(S.diagnostic),p=prompts[speakingPromptIndex];
  const recorded=S.diagnostic.speaking.find(x=>x.promptId===p.item_id);
  if(!recorded)ENGINE.saveSpeakingSample(S.diagnostic,p.item_id,{audio:false,interaction:p.item_id==='S-B1',limitation:'microphone_unavailable_or_skipped'});
  speakingPromptIndex++;
  if(speakingPromptIndex>=prompts.length){
    ENGINE.markComplete(S.diagnostic);S.lastDiagnosticResult=ENGINE.result(S.diagnostic);save();go('report');
  }else{save();render();}
}

function reportView(){
  if(!S.diagnostic.completed){return diagnosticView();}
  const r=ENGINE.result(S.diagnostic);S.lastDiagnosticResult=r;save();
  const profileOrder=[['language_system','Language system'],['Lesen','Lesen'],['Hören','Hören'],['Schreiben','Schreiben'],['Sprechen','Sprechen']];
  const profiles='<div class="diagnostic-profile">'+profileOrder.map(([k,label])=>{
    const p=r.profiles[k];const value=p.band||'требуется подтверждение';const kind=p.status==='SUPPORTED'||p.status==='REVIEWED'?'good':p.status==='REVIEWED_WEAK'?'bad':'warn';
    return '<div class="card"><b>'+label+'</b><div class="profile-band">'+esc(value)+'</div>'+pill('уверенность: '+confidenceRu(p.confidence),kind)+'<div class="small" style="margin-top:8px">evidence: '+p.evidenceCount+'</div></div>';
  }).join('')+'</div>';
  const gaps=r.gaps.length?'<div class="stack">'+r.gaps.slice(0,6).map(g=>card(esc(g.module)+' · '+esc(g.kind),esc(g.reason),'warn')).join('')+'</div>':card('B1 gaps пока не подтверждены','Нужно больше независимых доказательств.','soft');
  return '<span class="eyebrow">Диагностика завершена</span><h1 class="h2">'+esc(r.placementDisplay)+'</h1>'+
    '<p class="lead">Это <b>примерная учебная зона OTTO</b>, а не официальный сертификат CEFR. Внутренние A1.1/A1.2/A2.1/A2.2/B1.1/B1.2 нужны только для выбора следующего обучения.</p>'+
    profiles+'<div style="height:16px"></div>'+
    card('Почему такой результат',r.explanation.map(esc).join('<br>'),'soft')+
    '<h3>До Goethe B1 сейчас важнее всего</h3>'+gaps+
    '<div class="button-row">'+button('Показать мой первый маршрут','open-route')+button('Главная','report-home','ghost')+'</div>';
}
function routeView(){
  if(!S.diagnostic.completed)return diagnosticGate();
  const r=ENGINE.result(S.diagnostic),rt=r.route;
  return '<span class="eyebrow">Персональный маршрут после диагностики</span><h1 class="h2">'+esc(rt.summary)+'</h1>'+
    '<p class="lead">Это не один и тот же курс с другим названием уровня. Вес и тип блоков меняются от результата диагностики.</p>'+
    '<div class="stack">'+rt.blocks.map(b=>'<div class="route-card"><div class="route-weight">'+b.weight+'%</div><div><b>'+esc(b.label)+'</b><p>'+esc(b.why)+'</p></div></div>').join('')+'</div>'+
    '<div class="notice"><b>Контентная защита:</b> старые короткие SAMPLES выведены из пользовательского обучения. Пока новый учебный банк не пройдёт отдельный content QA, OTTO не будет маскировать demo/A2 материал под B1.</div>'+
    '<div class="button-row">'+button('На главную','report-home','primary')+button('Посмотреть модули','open-modules','ghost')+'</div>';
}
function homeView(){
  const r=ENGINE.result(S.diagnostic);
  return '<span class="eyebrow">Здравствуйте, '+esc(S.name)+'</span><h1 class="h2">Стартовая точка определена</h1>'+
    '<div class="mode-grid"><div class="mode-card primary-mode"><div class="mode-icon">◎</div><h3>Otto ведёт меня</h3><p class="muted">'+esc(r.route.summary)+'</p>'+button('Мой маршрут','open-route')+'</div>'+
    '<div class="mode-card"><div class="mode-icon">▦</div><h3>Выбрать самому</h3><p class="muted">Можно посмотреть структуру каждого модуля Goethe B1. Непроверенные demo-задания больше не доступны как учебный контент.</p>'+button('Четыре модуля','open-modules','secondary')+'</div></div>'+
    '<div class="grid2">'+card('Учебная зона',esc(r.placementDisplay),'soft')+card('Evidence',r.evidenceCount+' закрытых независимых ответов + productive samples','soft')+'</div>';
}
function modulesView(){
  return '<span class="eyebrow">Goethe-Zertifikat B1</span><h1 class="h2">Четыре модуля</h1><p class="lead">Структура видна. Учебные задания откроются только после отдельного content QA нового B1-банка.</p>'+
    '<div class="modules-grid">'+MODULES.map(m=>'<button class="module-pick" data-module="'+m+'"><div class="module-name">'+m+'</div><div class="module-count">'+EXAM_MAP[m].parts.length+' частей · '+EXAM_MAP[m].time+'</div></button>').join('')+'</div>';
}
function moduleView(){
  const m=S.selectedModule,x=EXAM_MAP[m];
  return '<span class="eyebrow">Модуль</span><h1 class="h2">'+m+'</h1><p class="lead">'+x.time+'</p><div class="exam-map">'+
    x.parts.map(p=>'<div class="teil-row"><div class="teil-num">'+esc(p[0])+'</div><div><b>'+esc(p[1])+'</b><p>Новый original_aligned training item bank ещё проходит отдельную подготовку и не подменяется старым demo.</p></div><span class="pill warn">контент в QA</span></div>').join('')+
    '</div><div class="button-row">'+button('← Все модули','open-modules','ghost')+'</div>';
}
function errorsView(){
  const r=ENGINE.result(S.diagnostic);
  return '<span class="eyebrow">Диагностические пробелы</span><h1 class="h2">Что уже подтверждено evidence</h1>'+
    (r.gaps.length?'<div class="stack">'+r.gaps.map(g=>card(esc(g.module),esc(g.reason),'warn')).join('')+'</div>':card('Нет подтверждённых пробелов','Это не означает готовность: данных может быть недостаточно.','soft'));
}
function progressView(){
  const r=ENGINE.result(S.diagnostic);
  return '<span class="eyebrow">Evidence profile</span><h1 class="h2">Без псевдоточного процента</h1>'+
    '<div class="grid2">'+card('Closed-task evidence',String(r.evidenceCount),'soft')+
    card('Schreiben',r.profiles.Schreiben.status==='NEED_CONFIRMATION'?'требуется оценка':'есть review','warn')+
    card('Sprechen',r.profiles.Sprechen.status==='NEED_CONFIRMATION'?'требуется оценка':'есть review','warn')+
    card('Placement confidence',confidenceRu(r.placement.confidence),r.placement.confidence==='high'?'good':'warn')+'</div>';
}
function examHubView(){
  return '<span class="eyebrow">Exam mode</span><h1 class="h2">Пробный экзамен пока не подменяем demo-вопросами</h1>'+
    '<p class="lead">Старые exam-preview items из SAMPLES изолированы. Полный mock вернётся сюда только после создания и content QA полноценного original_aligned B1-банка.</p>'+
    '<div class="grid2">'+MODULES.map(m=>card(m,EXAM_MAP[m].time+' · '+EXAM_MAP[m].parts.length+' частей.','soft')).join('')+'</div>';
}
function ottoModal(){
  return '<div class="modal-backdrop"><div class="modal"><div class="modal-head"><div><span class="eyebrow">Otto Personal</span><h2 style="margin:0">Что дальше?</h2></div><button class="close" data-action="close-otto">×</button></div>'+
    '<p class="muted">В этой итерации главное — точная диагностика. Otto Personal пока не используется для автоматического создания непроверенных учебных заданий.</p></div></div>';
}
function renderModal(){$('#modalRoot').innerHTML=S.ui.ottoOpen?ottoModal():'';}

const VIEWS={
  register:registerView,verify:verifyView,'diagnostic-gate':diagnosticGate,diagnostic:diagnosticView,report:reportView,
  home:homeView,route:routeView,modules:modulesView,module:moduleView,errors:errorsView,progress:progressView,'exam-hub':examHubView
};
function render(){
  let r=route();
  if(!S.auth.verified&&!['register','verify'].includes(r)){r='register';history.replaceState(null,'','#register');}
  if(S.auth.verified&&!S.diagnostic.completed&&!['diagnostic-gate','diagnostic'].includes(r)){r='diagnostic-gate';history.replaceState(null,'','#diagnostic-gate');}
  $('#screen').innerHTML=(VIEWS[r]||VIEWS.register)();
  const locked=['register','verify','diagnostic-gate','diagnostic'].includes(r);
  $('#bottomNav').classList.toggle('hidden',locked);
  $('#ottoFab').classList.toggle('hidden',locked);
  document.querySelectorAll('[data-nav]').forEach(b=>b.classList.toggle('active',b.dataset.nav===r));
  renderModal();
}
function setAuthMethod(method){captureRegistrationDraft();S.auth.method=method;save();render();}
function submitRegistration(){
  captureRegistrationDraft();
  if(!S.name.trim())return alert('Введите имя.');
  if(S.auth.method==='email'&&!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(S.auth.contact||''))return alert('Введите корректный Email.');
  if(S.auth.method==='telegram')S.auth.contact='Telegram';
  save();go('verify');
}
function verify(){
  if(S.auth.method==='email'&&($('#verifyCode')?.value.trim()!=='111111'))return alert('Для Preview используйте код 111111.');
  S.auth.verified=true;save();go(S.diagnostic.completed?'home':'diagnostic-gate');
}
function handleClick(e){
  const nav=e.target.closest('[data-nav]');if(nav){go(nav.dataset.nav);return;}
  const min=e.target.closest('[data-minutes]');if(min){captureRegistrationDraft();S.dailyMinutes=Number(min.dataset.minutes);save();render();return;}
  const choice=e.target.closest('[data-choice]');if(choice){S.ui.selected=Number(choice.dataset.choice);save();render();return;}
  const mod=e.target.closest('[data-module]');if(mod){S.selectedModule=mod.dataset.module;save();go('module');return;}
  const a=e.target.closest('[data-action]');if(!a)return;
  const x=a.dataset.action;
  if(x==='auth-email')setAuthMethod('email');
  else if(x==='auth-telegram')setAuthMethod('telegram');
  else if(x==='submit-registration')submitRegistration();
  else if(x==='back-register')go('register');
  else if(x==='verify')verify();
  else if(x==='start-diagnostic'){itemStartedAt=Date.now();go('diagnostic');}
  else if(x==='diag-play-audio')playDiagnosticAudio();
  else if(x==='diag-submit')submitDiagnosticClosed();
  else if(x==='save-writing')saveWriting();
  else if(x==='record-speaking')toggleSpeakingRecord();
  else if(x==='speaking-next')speakingNext();
  else if(x==='speak-probe')speakProbe();
  else if(x==='open-route')go('route');
  else if(x==='report-home')go('home');
  else if(x==='open-modules')go('modules');
  else if(x==='close-otto'){S.ui.ottoOpen=false;save();renderModal();}
}

document.addEventListener('click',handleClick);
$('#resetButton').addEventListener('click',reset);
$('#ottoFab').addEventListener('click',()=>{S.ui.ottoOpen=true;save();renderModal();});
window.addEventListener('hashchange',render);
window.addEventListener('popstate',render);
$('#ottoFabImg').src=window.OTTO_SRC||'';

if(!location.hash)history.replaceState(null,'','#register');
render();
