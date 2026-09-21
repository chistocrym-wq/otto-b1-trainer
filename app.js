'use strict';

const STORAGE='ottoB1.clean.preview.v2';
const MODULES=['Lesen','Hören','Schreiben','Sprechen'];
const EXAM_MAP={
  Lesen:{
    time:'65 минут',parts:5,icon:'📖',
    rows:[
      {teil:1,title:'Личный текст · Richtig / Falsch',detail:'6 заданий. Понимание фактов, последовательности и перефразирования.'},
      {teil:2,title:'Тексты из прессы · a / b / c',detail:'2 текста, всего 6 заданий. Главная мысль, детали, цель и distractors.'},
      {teil:3,title:'Ситуации ↔ объявления',detail:'7 ситуаций, объявления A–J; одно соответствие отсутствует → 0.'},
      {teil:4,title:'Позиции людей · Ja / Nein',detail:'7 коротких мнений. Нужно распознать позицию автора.'},
      {teil:5,title:'Правила / инструкции · a / b / c',detail:'4 задания на точное понимание информационного текста.'}
    ]
  },
  Hören:{
    time:'около 40 минут',parts:4,icon:'🎧',
    rows:[
      {teil:1,title:'5 коротких аудио · по 2 задания',detail:'Каждый текст звучит 2 раза; Richtig/Falsch + a/b/c.'},
      {teil:2,title:'Один длинный текст · a / b / c',detail:'5 заданий. Аудио звучит 1 раз.'},
      {teil:3,title:'Разговор двух людей · Richtig / Falsch',detail:'7 заданий. Разговор звучит 1 раз.'},
      {teil:4,title:'Дискуссия · кто это сказал?',detail:'8 заданий. Дискуссия звучит 2 раза; распределение по говорящим.'}
    ]
  },
  Schreiben:{
    time:'60 минут',parts:3,icon:'✍️',
    rows:[
      {teil:1,title:'E-Mail · около 80 слов',detail:'Ориентир 20 минут. Выполнить все 3 коммуникативных пункта.'},
      {teil:2,title:'Diskussionsbeitrag · около 80 слов',detail:'Ориентир 25 минут. Выразить и обосновать своё мнение.'},
      {teil:3,title:'Короткая E-Mail · около 40 слов',detail:'Ориентир 15 минут. Коротко и уместно решить коммуникативную задачу.'}
    ]
  },
  Sprechen:{
    time:'около 15 минут + 15 минут подготовки',parts:3,icon:'🎙️',
    rows:[
      {teil:1,title:'Gemeinsam etwas planen',detail:'Около 3 минут. Otto — партнёр: предлагает, реагирует, возражает и ищет компромисс.'},
      {teil:2,title:'Präsentation',detail:'Около 3 минут. Выбор темы A/B и презентация по заданным пунктам.'},
      {teil:3,title:'Reaktion + Fragen / Antworten',detail:'Около 2 минут. Реакция на презентацию, вопрос партнёра и ответ.'}
    ]
  }
};

const SAMPLES={
  'Lesen-1':{kind:'closed',module:'Lesen',teil:1,skill:'paraphrase',text:'Liebe Eva, ich wollte heute nach der Arbeit bei dir vorbeikommen. Leider muss ich länger im Büro bleiben. Ich komme deshalb erst morgen gegen 18 Uhr. Bitte warte heute nicht auf mich.',translation:'Дорогая Ева, я хотела зайти к тебе сегодня после работы. К сожалению, мне нужно задержаться в офисе. Поэтому я приду только завтра около 18:00. Пожалуйста, не жди меня сегодня.',prompt:'Die Person besucht Eva heute Abend.',options:['Richtig','Falsch'],correct:1,evidence:'„ich komme deshalb erst morgen“ — встреча переносится на завтра.',explanation:'Ловушка: слово heute есть в тексте, но относится к первоначальному плану.'},
  'Lesen-2':{kind:'closed',module:'Lesen',teil:2,skill:'purpose',text:'Immer mehr Stadtbibliotheken bieten am Abend kurze Kurse für Erwachsene an. In Bremen lernen Berufstätige dort, wie sie digitale Behördendienste nutzen können. Die Bibliothek möchte damit Menschen erreichen, die tagsüber keine Zeit für einen Kurs haben.',translation:'Всё больше городских библиотек предлагают вечером короткие курсы для взрослых. В Бремене работающие люди учатся пользоваться цифровыми государственными сервисами. Библиотека хочет так охватить людей, у которых днём нет времени на курс.',prompt:'Warum bietet die Bibliothek die Kurse am Abend an?',options:['Weil die Bibliothek tagsüber geschlossen ist.','Damit auch Berufstätige teilnehmen können.','Weil digitale Kurse nur abends stattfinden dürfen.'],correct:1,evidence:'„Menschen erreichen, die tagsüber keine Zeit ... haben“',explanation:'Нужно ответить именно на вопрос о цели, а не выбрать просто правдивую деталь.'},
  'Lesen-3':{kind:'closed',module:'Lesen',teil:3,skill:'matching',text:'Situation: Lara arbeitet bis 18 Uhr und sucht einen Deutschkurs für Anfänger, den sie online besuchen kann.\n\nA: Deutsch A1, Mo/Do 19:00, online.\nB: Deutsch B2, Di 19:00, online.\nC: Deutsch A1, Mo/Do 10:00, Präsenz.',translation:'Лара работает до 18:00 и ищет онлайн-курс немецкого для начинающих.',prompt:'Welche Anzeige passt?',options:['A','B','0'],correct:0,evidence:'A erfüllt Thema, Niveau, Zeit und Online-Bedingung.',explanation:'Teil 3 проверяет все обязательные условия, а не совпадение по одной теме.'},
  'Lesen-4':{kind:'closed',module:'Lesen',teil:4,skill:'opinion',text:'Mara: „Ein komplettes Handyverbot in Schulen finde ich zu streng. Im Unterricht soll das Telefon weg sein, aber in der Pause dürfen Jugendliche es meiner Meinung nach benutzen.“',translation:'Мара считает полный запрет телефонов слишком строгим: на уроке телефон должен быть убран, но на перемене его можно использовать.',prompt:'Ist Mara für ein komplettes Handyverbot an Schulen?',options:['Ja','Nein'],correct:1,evidence:'„ein komplettes Handyverbot ... zu streng“',explanation:'Автор допускает ограничение, но не поддерживает полный запрет.'},
  'Lesen-5':{kind:'closed',module:'Lesen',teil:5,skill:'rules',text:'Hausordnung: Fahrräder dürfen nicht im Treppenhaus abgestellt werden. Der Fahrradraum im Hof ist täglich von 6 bis 22 Uhr geöffnet. Gäste benutzen bitte die Klingel an der Haustür.',translation:'Правила дома: велосипеды нельзя оставлять на лестнице; велокомната во дворе открыта с 6 до 22; гости используют звонок у входной двери.',prompt:'Wo sollen Bewohner ihr Fahrrad abstellen?',options:['Im Treppenhaus.','Im Fahrradraum im Hof.','Vor der Haustür.'],correct:1,evidence:'„Der Fahrradraum im Hof ...“',explanation:'В Teil 5 важна точная практическая информация из правил.'},

  'Hören-1':{kind:'audio',module:'Hören',teil:1,skill:'change_detection',plays:2,audio:'Guten Tag, Frau Berg. Ihr Termin morgen bleibt bestehen, aber statt um fünfzehn Uhr kommen Sie bitte erst um sechzehn Uhr dreißig. Bringen Sie außerdem Ihre Versicherungskarte mit.',prompt:'Der Termin beginnt morgen später als ursprünglich geplant.',options:['Richtig','Falsch'],correct:0,evidence:'„statt um 15 Uhr ... erst um 16:30“',explanation:'Не цепляться за первое услышанное время; важна финальная договорённость.'},
  'Hören-2':{kind:'audio',module:'Hören',teil:2,skill:'detail',plays:1,audio:'Willkommen zu unserer Stadtführung. Zuerst besuchen wir das alte Rathaus. Danach gehen wir gemeinsam zum Stadtmuseum. Die Mittagspause machen wir nicht im Museumscafé, sondern im Restaurant am Markt. Um vierzehn Uhr treffen wir uns wieder vor dem Museumseingang.',prompt:'Wo trifft sich die Gruppe nach der Mittagspause?',options:['Im Restaurant am Markt.','Vor dem Museumseingang.','Vor dem Rathaus.'],correct:1,evidence:'„Um vierzehn Uhr ... vor dem Museumseingang.“',explanation:'Teil 2 звучит один раз; нужно заранее прочитать вопрос и удержать нужную деталь.'},
  'Hören-3':{kind:'audio',module:'Hören',teil:3,skill:'conversation',plays:1,audio:'Mann: War die Feier gestern im Garten? Frau: Nein, wegen des Regens haben wir alles ins Haus verlegt. Mann: Schade. War die Musik trotzdem gut? Frau: Ja, besonders die Band hat allen gefallen.',prompt:'Die Feier fand draußen im Garten statt.',options:['Richtig','Falsch'],correct:1,evidence:'„wegen des Regens ... ins Haus verlegt“',explanation:'Нужно следить за изменением ситуации в разговоре.'},
  'Hören-4':{kind:'audio',module:'Hören',teil:4,skill:'speaker_tracking',plays:2,audio:'Moderator: Heute sprechen wir über Homeoffice. Frau Keller: Für mich spart Homeoffice viel Zeit, weil ich nicht pendeln muss. Herr Brandt: Ich sehe das kritischer. Mir fehlt der direkte Kontakt mit Kollegen. Moderator: Beide Punkte sind wichtig.',prompt:'Wer sagt: „Der direkte Kontakt mit Kollegen fehlt mir.“?',options:['Moderator','Frau Keller','Herr Brandt'],correct:2,evidence:'Herr Brandt sagt ausdrücklich, dass ihm der direkte Kontakt fehlt.',explanation:'Teil 4 требует удерживать, кто какую позицию выражает.'},

  'Schreiben-1':{kind:'writing',module:'Schreiben',teil:1,skill:'task_fulfilment',title:'E-Mail · около 80 слов',prompt:'Sie waren am Wochenende bei Freunden in einer anderen Stadt. Schreiben Sie Ihrer Freundin / Ihrem Freund: Beschreiben Sie kurz den Besuch; erklären Sie, was Ihnen besonders gefallen hat und warum; schlagen Sie ein Treffen vor.'},
  'Schreiben-2':{kind:'writing',module:'Schreiben',teil:2,skill:'argumentation',title:'Diskussionsbeitrag · около 80 слов',prompt:'In einem Online-Forum lesen Sie: „Man sollte in der Innenstadt keine privaten Autos mehr erlauben.“ Schreiben Sie Ihre Meinung dazu und begründen Sie sie.'},
  'Schreiben-3':{kind:'writing',module:'Schreiben',teil:3,skill:'formal_message',title:'Kurze E-Mail · около 40 слов',prompt:'Sie können morgen nicht zu einem vereinbarten Termin kommen. Schreiben Sie eine kurze E-Mail: entschuldigen Sie sich, nennen Sie den Grund und bitten Sie um einen neuen Termin.'},

  'Sprechen-1':{kind:'speaking',module:'Sprechen',teil:1,skill:'interaction',title:'Gemeinsam etwas planen',prompt:'Sie und Otto organisieren ein kleines Treffen für Ihre Lerngruppe. Klären Sie: Tag, Uhrzeit, Ort, Getränke/Essen, wer informiert die Gruppe.'},
  'Sprechen-2':{kind:'speaking',module:'Sprechen',teil:2,skill:'presentation',title:'Präsentation',prompt:'Thema A: Sollten Erwachsene regelmäßig Sport treiben? Thema B: Ist Online-Lernen besser als Präsenzunterricht? Wählen Sie ein Thema. Sprechen Sie über: Einleitung, persönliche Erfahrung, Situation im Heimatland, Vor- und Nachteile, eigene Meinung.'},
  'Sprechen-3':{kind:'speaking',module:'Sprechen',teil:3,skill:'reaction',title:'Reaktion und Fragen',prompt:'Otto hat gerade über „Online-Lernen“ gesprochen. Reagieren Sie kurz auf seine Präsentation und stellen Sie eine passende Frage.'}
};

const DIAG=[
  {id:'d-vocab',kind:'closed',module:'Basis',skill:'vocab_context',prompt:'Was bedeutet: „Der Termin wurde verschoben“?',options:['Der Termin wurde abgesagt.','Der Termin findet zu einer anderen Zeit statt.','Der Termin wurde bestätigt.'],correct:1},
  {id:'d-grammar',kind:'closed',module:'Basis',skill:'word_order',prompt:'Wählen Sie den richtigen Satz.',options:['Ich bleibe zu Hause, weil ich bin krank.','Ich bleibe zu Hause, weil ich krank bin.','Ich bleibe, weil bin ich krank zu Hause.'],correct:1},
  Object.assign({id:'d-les'},SAMPLES['Lesen-1']),
  Object.assign({id:'d-hor'},SAMPLES['Hören-1']),
  {id:'d-write',kind:'writing',module:'Schreiben',skill:'task_fulfilment',title:'Kurzer Schreibtest',prompt:'Schreiben Sie 45–70 Wörter: Sie konnten gestern nicht zu einem Treffen kommen. Entschuldigen Sie sich, erklären Sie den Grund und schlagen Sie einen neuen Termin vor.'},
  {id:'d-speak',kind:'speaking',module:'Sprechen',skill:'free_sample',title:'Kurzer Sprechtest',prompt:'Sprechen Sie 20–40 Sekunden auf Deutsch darüber, wie Sie normalerweise Ihr Wochenende verbringen.'}
];

const TRANSFER={
  paraphrase:{kind:'closed',module:'Lesen',teil:1,skill:'paraphrase',text:'Hallo Tim, der Eingang an der Hauptstraße ist heute geschlossen. Komm bitte durch den Hof. Dort ist die Seitentür geöffnet.',prompt:'Tim soll heute einen anderen Eingang benutzen.',options:['Richtig','Falsch'],correct:0,evidence:'„Komm bitte durch den Hof. Dort ist die Seitentür geöffnet.“',explanation:'Новый контекст подтверждает тот же навык — понимание перефразирования.'}
};

const $=function(s){return document.querySelector(s);};
const esc=function(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c];});};
const now=function(){return new Date().toISOString();};
const uid=function(p){return p+'-'+Date.now()+'-'+Math.random().toString(36).slice(2,7);};
let memoryFallback=null;
let mediaRecorder=null;
let mediaChunks=[];
let recognition=null;

function fresh(){
  return {
    version:2,
    auth:{method:'email',contact:'',verified:false},
    name:'',gender:'',examDate:'',dailyMinutes:25,
    diagnostic:{index:0,answers:[],writing:null,speaking:null,completed:false,audioPlays:{}},
    evidence:[],errors:[],reviews:[],priorities:[],mastery:{},
    selectedModule:'Lesen',selectedTeil:1,freeResult:null,
    ui:{selected:null,translation:false,strategy:false,ottoOpen:false},
    daily:{active:false,step:0,queue:[]},
    speaking:{turn:0,history:[],lastTranscript:'',finished:false},
    weekly:{index:0,answers:[],completed:false},
    exam:{module:'Lesen',done:false,result:null,audioPlays:{}}
  };
}
function load(){
  try{
    var raw=localStorage.getItem(STORAGE);
    if(!raw)return fresh();
    var parsed=JSON.parse(raw);
    return Object.assign(fresh(),parsed,{auth:Object.assign(fresh().auth,parsed.auth||{}),diagnostic:Object.assign(fresh().diagnostic,parsed.diagnostic||{}),ui:Object.assign(fresh().ui,parsed.ui||{}),speaking:Object.assign(fresh().speaking,parsed.speaking||{}),weekly:Object.assign(fresh().weekly,parsed.weekly||{}),exam:Object.assign(fresh().exam,parsed.exam||{})});
  }catch(e){return memoryFallback||fresh();}
}
let S=load();
function save(){
  try{localStorage.setItem(STORAGE,JSON.stringify(S));}
  catch(e){memoryFallback=JSON.parse(JSON.stringify(S));}
}
function reset(){
  try{localStorage.removeItem(STORAGE);}catch(e){}
  memoryFallback=null;S=fresh();location.hash='#register';render();
}
function go(route){S.ui.selected=null;S.freeResult=null;save();location.hash='#'+route;render();}
function route(){return (location.hash||'#register').slice(1);}
function card(title,body,kind){return '<div class="card '+(kind||'')+'"><div class="card-title">'+title+'</div><div class="muted">'+body+'</div></div>';}
function pill(text,kind){return '<span class="pill '+(kind||'')+'">'+esc(text)+'</span>';}
function button(label,action,kind,extra){return '<button class="btn '+(kind||'primary')+'" data-action="'+action+'" '+(extra||'')+'>'+label+'</button>';}

function recordEvidence(module,skill,ok,mode,extra){
  S.evidence.push(Object.assign({id:uid('ev'),module:module,skill:skill,ok:ok,mode:mode,at:now(),assisted:false},extra||{}));
  recompute();save();
}
function addError(sample,selected){
  var e=S.errors.find(function(x){return x.module===sample.module&&x.skill===sample.skill&&x.status!=='resolved';});
  if(e){e.recurrence+=1;e.lastSeen=now();e.selected=selected;}
  else{
    e={id:uid('err'),module:sample.module,teil:sample.teil||null,skill:sample.skill,sourceKey:S.selectedModule+'-'+S.selectedTeil,selected:selected,status:'active',recurrence:0,selfCorrected:false,transfer:false,lastSeen:now(),nextDue:null,reason:sample.explanation||'Нужна перепроверка.'};
    S.errors.push(e);
  }
  save();return e;
}
function recompute(){
  var by={};
  S.evidence.forEach(function(e){
    if(!by[e.skill])by[e.skill]={attempts:0,correct:0,independent:0,assisted:0};
    var x=by[e.skill];x.attempts++;if(e.ok===true)x.correct++;if(e.assisted)x.assisted++;else x.independent++;
  });
  S.mastery={};
  Object.keys(by).forEach(function(k){
    var x=by[k],state='introduced';
    if(x.independent===0)state='guided';
    else if(x.independent===1)state='independent';
    else if(x.correct/x.attempts<0.6)state='unstable';
    else if(x.independent>=3&&x.correct/x.attempts>=0.8)state='stable';
    S.mastery[k]=Object.assign({},x,{state:state});
  });
  var items=[];
  S.errors.filter(function(e){return e.status!=='resolved';}).forEach(function(e){
    items.push({module:e.module,skill:e.skill,label:skillLabel(e.skill),reason:e.recurrence?'Ошибка вернулась — этот навык снова повышен в приоритете.':'Есть конкретная ошибка, которую нужно исправить и подтвердить на новом материале.',score:100+e.recurrence*20});
  });
  MODULES.forEach(function(m){
    var ev=S.evidence.filter(function(e){return e.module===m;});
    if(!ev.length)items.push({module:m,skill:'evidence_gap',label:'Недостаточно данных',reason:'Нужно получить независимое доказательство по модулю.',score:72});
    else if(ev.some(function(e){return e.ok===false;}))items.push({module:m,skill:'module_risk',label:'Есть риск',reason:'В диагностике или тренировке была ошибка.',score:82});
    else if(ev.filter(function(e){return !e.assisted&&e.ok===true;}).length<2)items.push({module:m,skill:'confirm',label:'Нужно подтверждение',reason:'Одной удачной попытки недостаточно.',score:60});
  });
  items.sort(function(a,b){return b.score-a.score;});
  var seen={};S.priorities=[];
  items.forEach(function(x){var k=x.module+'|'+x.skill;if(!seen[k]){seen[k]=true;S.priorities.push(x);}});
}
function skillLabel(k){
  var map={paraphrase:'Перефразирование',purpose:'Цель и причина',matching:'Соответствие условиям',opinion:'Позиция автора',rules:'Правила и инструкции',change_detection:'Изменение договорённости',detail:'Точная деталь',conversation:'Разговор и изменение смысла',speaker_tracking:'Кто что сказал',task_fulfilment:'Выполнение задания',argumentation:'Аргументация',formal_message:'Короткое сообщение',interaction:'Взаимодействие',presentation:'Презентация',reaction:'Реакция и вопросы',word_order:'Порядок слов',vocab_context:'Лексика в контексте'};
  return map[k]||k;
}
function moduleStatus(m){
  var ev=S.evidence.filter(function(e){return e.module===m;});
  if(!ev.length)return {label:'Недостаточно данных',kind:'warn'};
  if(ev.some(function(e){return e.ok===false;}))return {label:'Есть риск',kind:'bad'};
  if(ev.filter(function(e){return e.ok===true&&!e.assisted;}).length<2)return {label:'Нужно подтверждение',kind:'warn'};
  return {label:'Есть подтверждения',kind:'good'};
}

function render(){
  var r=route();
  if(!S.auth.verified&&['register','verify'].indexOf(r)<0){r='register';location.hash='#register';}
  if(S.auth.verified&&!S.diagnostic.completed&&['diagnostic-gate','diagnostic'].indexOf(r)<0){r='diagnostic-gate';location.hash='#diagnostic-gate';}
  var fn=VIEWS[r]||VIEWS.register;
  $('#screen').innerHTML=fn();
  var locked=['register','verify','diagnostic-gate','diagnostic'].indexOf(r)>=0;
  $('#bottomNav').classList.toggle('hidden',locked);
  $('#ottoFab').classList.toggle('hidden',locked||r==='exam-proof');
  document.querySelectorAll('[data-nav]').forEach(function(b){b.classList.toggle('active',b.dataset.nav===r);});
  renderModal();
}
function setAuthMethod(method){S.auth.method=method;save();render();}
function registerView(){
  var contact=S.auth.method==='email'
    ? '<label><b>Email</b><input id="regContact" class="field" type="email" value="'+esc(S.auth.contact)+'" placeholder="name@example.com"></label>'
    : '<div class="friendly-note"><b>Подтверждение через Telegram</b><br>В рабочей версии — переход в Telegram Mini App и безопасное подтверждение пользователя. В Preview показываем этот шаг без подключения B1-бота.</div>';
  return '<div class="auth-wrap">'+
    '<div class="auth-hero"><div class="auth-otto"><img src="'+window.OTTO_SRC+'" alt="Otto"></div><span class="kicker">Тренажёр Otto · Goethe-Zertifikat B1</span>'+
    '<h1 class="h1">Готовимся к сертификату B1</h1>'+
    '<p class="lead" style="margin:0 auto">Спокойно: сертификат B1 — не дракон. Отто разложит экзамен на четыре понятных модуля, найдёт слабые места и не заставит учить то, что у вас уже получается.</p></div>'+
    '<div class="auth-card"><h2 style="margin-top:0">Регистрация</h2><p class="muted">Сначала создаём профиль, потом — обязательная диагностика. До неё никакие случайные упражнения не открываются.</p>'+
    '<div class="form-grid"><label><b>Имя</b><input id="regName" class="field" value="'+esc(S.name)+'" placeholder="Как к вам обращаться"></label>'+
    '<label><b>Как к вам обращаться?</b><select id="regGender" class="field"><option value="">Не указывать</option><option value="female" '+(S.gender==='female'?'selected':'')+'>Женский род</option><option value="male" '+(S.gender==='male'?'selected':'')+'>Мужской род</option></select></label>'+
    '<div><b>Способ входа</b><div class="auth-tabs"><button data-action="auth-email" class="'+(S.auth.method==='email'?'active':'')+'">Email</button><button data-action="auth-telegram" class="'+(S.auth.method==='telegram'?'active':'')+'">Telegram</button></div></div>'+
    contact+
    '<label><b>Дата экзамена, если уже известна</b><input id="regExamDate" class="field" type="date" value="'+esc(S.examDate)+'"></label>'+
    '<div><b>Сколько времени удобно заниматься в день?</b><div class="button-row"><button class="btn '+(S.dailyMinutes===10?'primary':'ghost')+'" data-minutes="10">10 минут</button><button class="btn '+(S.dailyMinutes===25?'primary':'ghost')+'" data-minutes="25">25 минут</button><button class="btn '+(S.dailyMinutes===45?'primary':'ghost')+'" data-minutes="45">45 минут</button></div></div></div>'+
    '<div class="button-row">'+button(S.auth.method==='email'?'Получить код':'Продолжить в Telegram','submit-registration','primary')+'</div>'+
    '<p class="registration-note">Это Preview интерфейса. Реальный аккаунт и реальные коды подключим после утверждения пользовательского сценария.</p></div></div>';
}
function submitRegistration(){
  var n=$('#regName').value.trim();if(!n){alert('Введите имя.');return;}
  S.name=n;S.gender=$('#regGender').value;S.examDate=$('#regExamDate').value;
  if(S.auth.method==='email'){
    var email=$('#regContact').value.trim();
    if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)){alert('Введите корректный email.');return;}
    S.auth.contact=email;
  }else S.auth.contact='Telegram';
  save();go('verify');
}
function verifyView(){
  var body=S.auth.method==='email'
    ? '<p class="muted">В рабочем приложении код придёт на Email. Для просмотра Preview введите <b>111111</b>.</p><input id="verifyCode" class="field verify-code" maxlength="6" inputmode="numeric" placeholder="000000">'
    : '<div class="friendly-note">В рабочей B1-версии здесь откроется Telegram Mini App. В Preview нажмите «Подтвердить», чтобы пройти дальше по сценарию.</div>';
  return '<div class="auth-wrap"><div class="auth-card"><span class="eyebrow">Подтверждение</span><h1 class="h2">'+(S.auth.method==='email'?'Введите код из письма':'Продолжение через Telegram')+'</h1>'+body+
    '<div class="button-row">'+button('Подтвердить','verify','primary')+button('Назад','back-register','ghost')+'</div></div></div>';
}
function finishVerification(){
  if(S.auth.method==='email'&&$('#verifyCode').value.trim()!=='111111'){alert('Для Preview используйте код 111111.');return;}
  S.auth.verified=true;save();go('diagnostic-gate');
}
function diagnosticGate(){
  return '<div class="gate-card"><div class="auth-otto"><img src="'+window.OTTO_SRC+'" alt="Otto"></div><span class="eyebrow">Обязательный первый шаг</span><h1 class="h1">Сначала — диагностика</h1>'+
    '<p class="lead">Именно от неё будет зависеть персональный маршрут. До завершения диагностики модули и тренировки специально закрыты.</p>'+
    '<div class="friendly-note" style="text-align:left;margin:20px 0"><b>Проверим:</b> базовую лексику и грамматику, Lesen, Hören, короткий Schreiben и речевой образец Sprechen. Если данных мало — Otto честно напишет «нужно подтверждение».</div>'+
    button('Провести диагностику','start-diagnostic','primary')+'</div>';
}
function startDiagnostic(){S.diagnostic.index=0;save();go('diagnostic');}

function taskTools(sample){
  var html='<div class="task-tools">';
  if(sample.text)html+='<button class="chip" data-action="toggle-translation">👁 '+(S.ui.translation?'Скрыть перевод':'Перевод')+'</button>';
  html+='<button class="chip" data-action="toggle-strategy">☝ '+(S.ui.strategy?'Скрыть стратегию':'Стратегия Otto')+'</button></div>';
  if(S.ui.translation&&sample.translation)html+='<div class="notice"><b>Перевод:</b> '+esc(sample.translation)+'</div>';
  if(S.ui.strategy)html+='<div class="notice"><b>Стратегия Otto:</b> сначала поймите, что именно проверяет вопрос. Ищите смысл, изменение, отрицание и ограничения — не одинаковые слова.</div>';
  return html;
}
function closedTask(sample,mode){
  var html='';
  if(sample.text)html+='<div class="task-text">'+esc(sample.text).replace(/\n/g,'<br>')+'</div>';
  if(sample.kind==='audio')html+='<div class="speaker"><div class="speaker-avatar"><img src="'+window.OTTO_SRC+'" alt="Otto"></div><div><b>Hören · аудио</b><div class="small">Preview-аудио: немецкая системная озвучка · максимум '+(sample.plays||2)+' прослушивани'+((sample.plays||2)===1?'е':'я')+' для этого Teil.</div></div></div>'+button('▶ Воспроизвести','play-audio','secondary');
  if(mode==='training')html+=taskTools(sample);
  html+='<p class="lead" style="font-size:17px"><b>'+esc(sample.prompt)+'</b></p><div class="choice-grid">';
  sample.options.forEach(function(x,i){html+='<button class="choice '+(S.ui.selected===i?'selected':'')+'" data-choice="'+i+'">'+esc(x)+'</button>';});
  html+='</div>';
  return html;
}
function diagnosticView(){
  var i=S.diagnostic.index;
  if(i>=DIAG.length){S.diagnostic.completed=true;recompute();save();return reportView();}
  var d=DIAG[i],pct=Math.round(i/DIAG.length*100),html='<span class="eyebrow">Диагностика · шаг '+(i+1)+' из '+DIAG.length+'</span><div class="progress-line"><i style="width:'+pct+'%"></i></div>';
  if(d.kind==='closed'||d.kind==='audio')html+='<h1 class="h2">'+(d.module==='Basis'?'Языковая база':d.module+' · диагностическая проба')+'</h1>'+closedTask(d,'diagnostic')+button('Продолжить','diag-submit','primary');
  if(d.kind==='writing')html+='<h1 class="h2">Schreiben · короткий образец</h1><div class="task-text">'+esc(d.prompt)+'</div><textarea id="diagWriting" class="field" rows="8" placeholder="Schreiben Sie auf Deutsch…"></textarea><div class="notice">Пока проверяем пригодность образца и выполнение коммуникативной задачи. Это не официальный Goethe score.</div>'+button('Сохранить текст','diag-writing','primary');
  if(d.kind==='speaking')html+='<h1 class="h2">Sprechen · речевой образец</h1><p class="lead">'+esc(d.prompt)+'</p><div id="recordBox" class="record-box"><p><span class="record-dot"></span><b>Нужен реальный голосовой образец</b></p>'+button('🎙 Начать / остановить запись','diag-record','secondary')+'</div><div class="button-row">'+button('Сохранить попытку','diag-speaking','primary')+button('Нет доступа к микрофону','diag-speaking-skip','ghost')+'</div>';
  return html;
}
function diagSubmit(){
  var d=DIAG[S.diagnostic.index];if(S.ui.selected==null){alert('Выберите ответ.');return;}
  var ok=S.ui.selected===d.correct;recordEvidence(d.module,d.skill,ok,'diagnostic',{taskId:d.id,audio:d.kind==='audio'});
  S.diagnostic.answers.push({id:d.id,ok:ok});S.ui.selected=null;S.diagnostic.index++;save();render();
}
function writingCheck(text){
  var words=(text.match(/[A-Za-zÄÖÜäöüß]+/g)||[]).length;
  var german=(text.match(/\b(ich|wir|leider|weil|aber|kann|können|möchte|treffen|termin|uhr|entschuldig|vielleicht|würde|morgen|gestern)\b/gi)||[]).length;
  var covered=(/entschuldig|leider/i.test(text)?1:0)+(/weil|wegen|da\b|denn/i.test(text)?1:0)+(/könn|möcht|vielleicht|termin|treffen/i.test(text)?1:0);
  return {words:words,german:german,covered:covered,valid:words>=20&&german>=2};
}
function diagWriting(){
  var text=$('#diagWriting').value.trim(),a=writingCheck(text);
  if(!a.valid){alert('Нужен осмысленный немецкий текст примерно от 20 слов. Русский или случайный набор символов не создаёт evidence.');return;}
  S.diagnostic.writing={text:text,analysis:a};recordEvidence('Schreiben','task_fulfilment',a.covered>=2,'diagnostic',{wordCount:a.words});S.diagnostic.index++;save();render();
}
function diagSpeakingFinish(skip){
  if(skip){S.diagnostic.speaking={recorded:false};recordEvidence('Sprechen','free_sample',null,'diagnostic',{audio:false,unscored:true});}
  else{
    if(!S.diagnostic.speaking||!S.diagnostic.speaking.recorded){alert('Сначала запишите голосовой образец или выберите «Нет доступа к микрофону».');return;}
    recordEvidence('Sprechen','free_sample',null,'diagnostic',{audio:true,unscored:true});
  }
  S.diagnostic.index++;S.diagnostic.completed=true;recompute();save();go('report');
}

function reportView(){
  recompute();
  var baseline=S.evidence.filter(function(e){return e.module==='Basis';});
  var zone=baseline.length<2?'Недостаточно данных':baseline.filter(function(e){return e.ok===true;}).length===2?'Примерно A2+/вход в B1':baseline.filter(function(e){return e.ok===true;}).length===1?'Примерно A2':'Ниже A2 по текущему короткому screening';
  var mod='<div class="grid4">';
  MODULES.forEach(function(m){var st=moduleStatus(m);mod+='<div class="card"><b>'+m+'</b><div style="margin-top:8px">'+pill(st.label,st.kind)+'</div></div>';});mod+='</div>';
  var pri='<div class="stack">';
  S.priorities.slice(0,3).forEach(function(p,i){pri+='<div class="card"><b>'+(i+1)+'. '+esc(p.module)+' · '+esc(p.label)+'</b><p class="muted">'+esc(p.reason)+'</p></div>';});pri+='</div>';
  return '<span class="eyebrow">Диагностический отчёт</span><h1 class="h2">Теперь Otto знает, с чего начинать</h1>'+
    card('Текущая языковая зона',zone,'soft')+'<div style="height:14px"></div>'+mod+
    '<div style="height:14px"></div>'+card('Важно','Это предварительный профиль, а не официальный балл Goethe. Там, где доказательств мало, приложение показывает недостаток данных.','warn')+
    '<h3>Главные приоритеты</h3>'+pri+'<div class="button-row">'+button('Открыть мою подготовку','report-home','primary')+'</div>';
}

function homeView(){
  recompute();var p=S.priorities[0];
  var modules='<div class="modules-grid">';
  MODULES.forEach(function(m){var x=EXAM_MAP[m],st=moduleStatus(m);modules+='<button class="module-pick" data-module="'+m+'"><span style="font-size:27px">'+x.icon+'</span><div class="module-name">'+m+'</div><div class="module-count">'+x.parts+' '+(x.parts===1?'часть':'части')+' · '+x.time+'</div><div style="margin-top:10px">'+pill(st.label,st.kind)+'</div></button>';});modules+='</div>';
  return '<span class="eyebrow">Здравствуйте, '+esc(S.name)+'</span><h1 class="h2">Что делаем сегодня?</h1><p class="lead">Теперь есть два режима: Otto может полностью вести подготовку сам, или вы можете отдельно тренировать любой модуль и конкретный Teil.</p>'+
    '<div class="mode-grid"><div class="mode-card primary-mode"><div class="mode-icon">◎</div><h3>Otto ведёт меня</h3><p class="muted">Главный режим. Otto берёт диагностику, ошибки, due-повторы и дату экзамена — и сам выбирает следующий полезный шаг.</p>'+(p?card('Почему сейчас',esc(p.module)+' · '+esc(p.label)+': '+esc(p.reason),''):'')+'<div class="button-row">'+button('Продолжить мою подготовку','start-daily','primary')+button('Посмотреть маршрут','open-route','ghost')+'</div></div>'+
    '<div class="mode-card"><div class="mode-icon">▦</div><h3>Выбрать самому</h3><p class="muted">Нужно отдельно потренировать Lesen, Hören, Schreiben или Sprechen? Все официальные task families видны по Teil.</p><div class="button-row">'+button('Открыть модули','open-modules','secondary')+'</div></div></div>'+
    '<h3>Четыре модуля Goethe-Zertifikat B1</h3>'+modules+
    '<div class="exam-banner" style="margin-top:20px"><span class="eyebrow" style="color:#9ec5ff">Пробный экзамен</span><h2 style="margin:0 0 8px;font-family:Georgia,serif">Отдельный экзаменационный режим</h2><p class="muted">Без перевода, подсказок и мгновенного разбора. В Preview можно проверить поведение режима по каждому модулю и увидеть полную структуру будущего mock.</p><div class="button-row">'+button('Открыть пробный экзамен','open-exam-hub','secondary')+'</div></div>';
}
function routeView(){
  recompute();var html='<span class="eyebrow">Моя подготовка</span><h1 class="h2">Персональный маршрут</h1><p class="lead">Приоритеты строятся из ваших реальных попыток. Режим '+S.dailyMinutes+' минут меняет объём будущей ежедневной сессии.</p><div class="stack">';
  S.priorities.slice(0,5).forEach(function(p,i){html+='<div class="card"><b>'+(i+1)+'. '+esc(p.module)+' · '+esc(p.label)+'</b><p class="muted">'+esc(p.reason)+'</p></div>';});html+='</div><div class="button-row">'+button('Начать сессию','start-daily','primary')+button('Выбрать модуль самому','open-modules','ghost')+'</div>';return html;
}
function modulesView(){
  var html='<span class="eyebrow">Свободная тренировка</span><h1 class="h2">Выберите модуль</h1><p class="lead">Здесь пользователь может отойти от автоматического маршрута и отдельно тренировать конкретную экзаменационную часть.</p><div class="modules-grid">';
  MODULES.forEach(function(m){var x=EXAM_MAP[m];html+='<button class="module-pick" data-module="'+m+'"><span style="font-size:28px">'+x.icon+'</span><div class="module-name">'+m+'</div><div class="module-count">'+x.time+' · '+x.parts+' Teil/Aufgabe</div></button>';});html+='</div><div class="button-row">'+button('Пробный экзамен','open-exam-hub','secondary')+'</div>';return html;
}
function moduleView(){
  var m=S.selectedModule,x=EXAM_MAP[m],html='<div class="module-head"><div><span class="eyebrow">Модуль</span><h1 class="h2">'+x.icon+' '+m+'</h1><p class="lead">Структура в тренажёре повторяет актуальные task families Goethe B1. Задания Otto — собственные original_aligned, не копии закрытых экзаменов.</p></div><div class="module-meta"><span class="meta-chip">'+x.time+'</span><span class="meta-chip">'+x.parts+' частей</span></div></div><div class="exam-map">';
  x.rows.forEach(function(r){html+='<div class="teil-row"><div class="teil-num">'+(m==='Schreiben'||m==='Sprechen'?'Aufgabe ':'Teil ')+r.teil+'</div><div><b>'+esc(r.title)+'</b><p>'+esc(r.detail)+'</p></div><button class="btn secondary" data-open-teil="'+r.teil+'">Тренировать</button></div>';});
  html+='</div><div class="button-row">'+button('← Все модули','open-modules','ghost')+button('Exam mode этого модуля','exam-current','secondary')+'</div>';return html;
}
function openModule(m){S.selectedModule=m;S.selectedTeil=1;save();go('module');}
function openTeil(n){S.selectedTeil=Number(n);S.ui.selected=null;S.ui.translation=false;S.ui.strategy=false;S.freeResult=null;if(S.selectedModule==='Sprechen'&&S.selectedTeil===1){S.speaking={turn:0,history:[],lastTranscript:'',finished:false,fromDaily:false};}save();go('module-task');}
function currentSample(){return SAMPLES[S.selectedModule+'-'+S.selectedTeil];}
function moduleTaskView(){
  var t=currentSample();if(!t)return card('Нет задания','Для этого Teil пока нет representative sample.','warn');
  var header='<span class="eyebrow">Свободная тренировка · '+esc(t.module)+' · '+(t.module==='Schreiben'||t.module==='Sprechen'?'Aufgabe ':'Teil ')+t.teil+'</span><h1 class="h2">'+esc(t.title||skillLabel(t.skill))+'</h1>';
  if(t.kind==='closed'||t.kind==='audio'){
    var result='';
    if(S.freeResult){
      result=card(S.freeResult.ok?'Верно':'Нужно разобрать',S.freeResult.ok?(t.evidence||'Ответ подтверждён текстом.'):(t.explanation||'Посмотрите evidence и попробуйте ещё раз.'),S.freeResult.ok?'good':'bad');
    }
    return header+closedTask(t,'training')+'<div class="button-row">'+button('Проверить','free-submit','primary')+button('← К структуре модуля','back-module','ghost')+'</div>'+result;
  }
  if(t.kind==='writing'){
    return header+'<div class="task-text">'+esc(t.prompt)+'</div><textarea id="freeWriting" class="field" rows="10" placeholder="Schreiben Sie auf Deutsch…"></textarea><div class="notice">Training: после завершённого текста Otto проверит сначала осмысленность и выполнение задания. В Preview показываем structural gate; финальный AI-review будет по Erfüllung, Kohärenz, Wortschatz, Strukturen.</div><div class="button-row">'+button('Проверить основу','free-writing','primary')+button('← К структуре','back-module','ghost')+'</div>';
  }
  if(t.kind==='speaking')return speakingPracticeView(t);
  return '';
}
function freeSubmit(){
  var t=currentSample();if(S.ui.selected==null){alert('Выберите ответ.');return;}
  var ok=S.ui.selected===t.correct;recordEvidence(t.module,t.skill,ok,'free_training',{assisted:S.ui.translation||S.ui.strategy});
  S.freeResult={ok:ok};if(!ok)addError(t,S.ui.selected);S.ui.selected=null;save();render();
}
function freeWriting(){
  var t=currentSample(),text=$('#freeWriting').value.trim(),a=writingCheck(text);
  if(!a.valid){alert('Пока это не пригодный немецкий ответ: нужен осмысленный текст по-немецки.');return;}
  var fulfils=true,detail='';
  if(t.teil===1){fulfils=a.covered>=2;detail='Проверены базовые коммуникативные функции письма; финальная оценка будет по Erfüllung, Kohärenz, Wortschatz, Strukturen.';}
  if(t.teil===2){var opinion=/meiner meinung|ich finde|ich glaube|dafür|dagegen|weil|denn|deshalb|einerseits|andererseits/i.test(text);fulfils=opinion&&a.words>=35;detail='Проверено наличие развёрнутого мнения/обоснования. Финальный AI-review будет критериальным, а не по длине текста.';}
  if(t.teil===3){var polite=/leider|entschuldig|könnten|bitte|termin|freundliche|viele grüße|grüße/i.test(text);fulfils=polite&&a.words>=20;detail='Проверено, что короткое сообщение похоже на уместную коммуникативную E-Mail.';}
  recordEvidence('Schreiben',t.skill,fulfils,'free_training',{wordCount:a.words});
  S.freeResult={ok:fulfils};save();
  $('#screen').innerHTML='<span class="eyebrow">Schreiben · предварительный feedback</span><h1 class="h2">'+(fulfils?'Текст пригоден для полноценной проверки':'Нужно доработать выполнение задачи')+'</h1>'+card('Что уже можно подтвердить',esc(detail),fulfils?'good':'warn')+card('Что мы НЕ называем баллом','Этот Preview не выдаёт фиктивный Goethe score по количеству символов.','warn')+'<div class="button-row">'+button('Назад к модулю','back-module','primary')+'</div>';
}

function playText(text,rate){
  if(!('speechSynthesis' in window)){alert('В браузере недоступна системная немецкая озвучка.');return;}
  speechSynthesis.cancel();var u=new SpeechSynthesisUtterance(text);u.lang='de-DE';u.rate=rate||0.9;speechSynthesis.speak(u);
}
function playCurrentAudio(){
  var t=route()==='diagnostic'?DIAG[S.diagnostic.index]:currentSample();if(!t||!t.audio){return;}
  var key=(route()==='diagnostic'?'diag-':t.module+'-')+(t.teil||S.diagnostic.index),used=S.diagnostic.audioPlays[key]||0,limit=t.plays||2;
  if(used>=limit){alert('Для этого Teil в текущем режиме лимит прослушиваний исчерпан.');return;}
  S.diagnostic.audioPlays[key]=used+1;save();playText(t.audio,0.88);render();
}
async function toggleRecorder(context){
  if(mediaRecorder&&mediaRecorder.state==='recording'){
    mediaRecorder.stop();mediaRecorder.stream.getTracks().forEach(function(t){t.stop();});return;
  }
  try{
    var stream=await navigator.mediaDevices.getUserMedia({audio:true});mediaChunks=[];
    mediaRecorder=new MediaRecorder(stream);mediaRecorder.stream=stream;
    mediaRecorder.ondataavailable=function(e){if(e.data.size)mediaChunks.push(e.data);};
    mediaRecorder.onstop=function(){
      var bytes=mediaChunks.reduce(function(n,b){return n+b.size;},0);
      if(context==='diagnostic')S.diagnostic.speaking={recorded:bytes>0,bytes:bytes};
      else{S.lastVoice={context:context,recorded:bytes>0,bytes:bytes,at:now()};recordEvidence('Sprechen',context,bytes>0,'voice_sample',{audio:bytes>0,unscored:true});}
      save();mediaRecorder=null;render();
    };
    mediaRecorder.start();render();
  }catch(e){alert('Нет доступа к микрофону: '+e.message);}
}

function speakingPracticeView(t){
  if(t.teil===1){
    var history='<div class="stack">';
    S.speaking.history.forEach(function(x){history+='<div class="bubble '+(x.who==='user'?'user':'')+'"><b>'+(x.who==='user'?'Вы':'Otto')+':</b> '+esc(x.text)+'</div>';});
    history+='</div>';
    var prompt=S.speaking.turn===0?'Wir wollen am Samstag ein kleines Treffen für unsere Lerngruppe organisieren. Ich würde 16 Uhr vorschlagen. Was meinst du?':S.speaking.turn===1?'Gut. Wo sollen wir uns treffen? Ich finde ein Café in der Nähe vom Bahnhof praktisch.':S.speaking.turn===2?'Wer kümmert sich um Getränke und wer informiert die Gruppe?':'Super, dann haben wir einen Plan.';
    return '<span class="eyebrow">Sprechen · Aufgabe 1 · живой Preview</span><h1 class="h2">Поговорите с Otto голосом</h1><p class="lead">Otto говорит вслух, слушает распознанную немецкую речь там, где браузер это поддерживает, и отвечает по scripted branching. В финальной версии AI добавит полноценный смысловой анализ.</p>'+history+
      '<div class="speaker"><div class="speaker-avatar"><img src="'+window.OTTO_SRC+'" alt="Otto"></div><div><b>Otto:</b><div class="muted">'+esc(prompt)+'</div></div></div>'+
      '<div class="button-row">'+button('🔊 Otto говорит','otto-speak','secondary')+(S.speaking.finished?'':button('🎙 Ответить голосом','voice-dialogue','primary'))+button('Записать ответ без распознавания','free-record','ghost')+'</div>'+
      (S.speaking.lastTranscript?card('Распознано','«'+esc(S.speaking.lastTranscript)+'»','soft'):'')+
      (S.speaking.finished?card('Диалог завершён','Вы прошли три шага планирования: время → место → распределение задач. Это именно логика парной Aufgabe 1.','good'):'')+
      '<div class="button-row">'+(S.speaking.finished&&S.speaking.fromDaily?button('Продолжить мою сессию','speaking-daily-continue','primary'):'')+button('← К Sprechen','back-module','ghost')+'</div>';
  }
  var promptText=t.teil===2?'Сначала выберите тему A или B, затем говорите по пяти пунктам около 3 минут.':'Сначала коротко отреагируйте на презентацию Otto, затем задайте вопрос и ответьте на его вопрос.';
  return '<span class="eyebrow">Sprechen · Aufgabe '+t.teil+'</span><h1 class="h2">'+esc(t.title)+'</h1><div class="task-text">'+esc(t.prompt)+'</div><div class="friendly-note">'+promptText+'</div><div class="record-box" style="margin-top:14px"><span class="record-dot"></span><b> Реальная запись микрофона</b><div class="button-row" style="justify-content:center">'+button('🎙 Начать / остановить','free-record','secondary')+'</div></div><div class="button-row">'+button('← К Sprechen','back-module','ghost')+'</div>';
}
function voiceDialogue(){
  var SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!SR){alert('В этом браузере нет Web Speech Recognition. Используйте кнопку записи: голос будет записан, но Preview не сможет распознать смысл.');return;}
  if(recognition){try{recognition.stop();}catch(e){}recognition=null;}
  recognition=new SR();recognition.lang='de-DE';recognition.interimResults=false;recognition.maxAlternatives=1;
  recognition.onresult=function(e){
    var text=e.results[0][0].transcript;S.speaking.lastTranscript=text;S.speaking.history.push({who:'user',text:text});
    var low=text.toLowerCase(),reply='';
    if(S.speaking.turn===0){
      reply=/(nicht|lieber|später|früher|passt nicht)/.test(low)?'Kein Problem. Welche Uhrzeit passt dir besser?':'Gut, dann nehmen wir den Nachmittag. Jetzt müssen wir noch den Ort entscheiden.';
    }else if(S.speaking.turn===1){
      reply=/(café|kaffee|bahnhof)/.test(low)?'Einverstanden. Das Café am Bahnhof ist leicht zu finden.':'Das geht auch. Wichtig ist, dass alle den Ort gut erreichen können.';
    }else{
      reply=/(ich|kaufe|bringe|informiere|schreibe)/.test(low)?'Perfekt. Dann übernehme ich die andere Aufgabe und wir informieren die Gruppe heute.':'Dann teilen wir die Aufgaben: Einer bringt Getränke, der andere schreibt der Gruppe.';
    }
    S.speaking.history.push({who:'otto',text:reply});S.speaking.turn++;if(S.speaking.turn>=3){S.speaking.finished=true;recordEvidence('Sprechen','interaction',true,'scripted_dialogue',{audio:true,assisted:false});}
    save();playText(reply,0.92);render();recognition=null;
  };
  recognition.onerror=function(e){recognition=null;alert('Распознавание речи не сработало: '+e.error+'. Можно использовать обычную запись.');};
  recognition.start();
}

function startDaily(){
  recompute();var first=S.priorities[0]?S.priorities[0].module:'Lesen';
  var order=[first].concat(MODULES.filter(function(m){return m!==first;}));
  var count=S.dailyMinutes===10?2:S.dailyMinutes===25?3:4;
  S.daily={active:true,step:0,queue:order.slice(0,count)};save();go('daily');
}
function dailyView(){
  if(!S.daily.active||S.daily.step>=S.daily.queue.length){
    return '<span class="eyebrow">Сессия завершена</span><h1 class="h2">На сегодня достаточно</h1>'+card('Что обновилось','Новые evidence добавлены в профиль. Если появилась ошибка, она уже находится в истории и может вернуться в route.','good')+'<div class="button-row">'+button('На главную','daily-home','primary')+button('Прогресс','daily-progress','ghost')+'</div>';
  }
  var m=S.daily.queue[S.daily.step],p=S.priorities.find(function(x){return x.module===m;});
  var why=p?p.reason:'Нужно собрать независимые данные по этому модулю.';
  var t=SAMPLES[m+'-1'];
  if(m==='Sprechen'){
    S.selectedModule='Sprechen';S.selectedTeil=1;
    return '<span class="eyebrow">Сегодня · '+S.dailyMinutes+' минут</span>'+card('Почему сейчас','Sprechen: '+why,'soft')+'<h1 class="h2">Sprechen с Otto</h1><p class="lead">В ежедневном маршруте Otto открывает ту же парную тренировку, но сам решает, когда она нужна.</p><div class="button-row">'+button('Начать диалог','daily-speaking','primary')+'</div>';
  }
  if(m==='Schreiben'){
    return '<span class="eyebrow">Сегодня · '+S.dailyMinutes+' минут</span>'+card('Почему сейчас','Schreiben: '+why,'soft')+'<h1 class="h2">Schreiben · целевая практика</h1><div class="task-text">'+esc(SAMPLES['Schreiben-1'].prompt)+'</div><textarea id="dailyWriting" class="field" rows="8" placeholder="Schreiben Sie auf Deutsch…"></textarea><div class="button-row">'+button('Проверить и продолжить','daily-writing','primary')+'</div>';
  }
  return '<span class="eyebrow">Сегодня · '+S.dailyMinutes+' минут</span>'+card('Почему сейчас',esc(m)+': '+esc(why),'soft')+'<h1 class="h2">'+esc(m)+' · Training</h1>'+closedTask(t,'training')+'<div class="button-row">'+button('Ответить','daily-submit','primary')+'</div>';
}
function dailySubmit(){
  var m=S.daily.queue[S.daily.step],t=SAMPLES[m+'-1'];if(S.ui.selected==null){alert('Выберите ответ.');return;}
  var ok=S.ui.selected===t.correct;recordEvidence(m,t.skill,ok,'daily',{assisted:S.ui.translation||S.ui.strategy});
  if(!ok&&m==='Lesen'){var e=addError(t,S.ui.selected);S.activeError=e.id;S.ui.selected=null;save();go('repair');return;}
  if(!ok)addError(t,S.ui.selected);
  S.ui.selected=null;S.ui.translation=false;S.ui.strategy=false;S.daily.step++;save();render();
}
function dailyWriting(){
  var text=$('#dailyWriting').value.trim(),a=writingCheck(text);if(!a.valid){alert('Нужен осмысленный немецкий текст.');return;}
  recordEvidence('Schreiben','task_fulfilment',a.covered>=2,'daily',{wordCount:a.words});S.daily.step++;save();render();
}
function dailySpeaking(){S.selectedModule='Sprechen';S.selectedTeil=1;S.speaking={turn:0,history:[],lastTranscript:'',finished:false,fromDaily:true};save();go('module-task');}

function repairView(){
  var e=S.errors.find(function(x){return x.id===S.activeError;})||S.errors.find(function(x){return x.status!=='resolved'&&x.module==='Lesen';});
  if(!e)return card('Активной ошибки нет','Вернитесь к маршруту.','soft');
  var t=SAMPLES[e.sourceKey]||SAMPLES['Lesen-1'];
  if(!e.explained){
    return '<span class="eyebrow">Ошибка → обучение</span><h1 class="h2">Не просто «неверно»</h1>'+card('Почему возникла ошибка',esc(t.explanation||e.reason),'bad')+card('Evidence',esc(t.evidence||'Нужно перечитать ключевой фрагмент.'),'good')+'<div class="button-row">'+button('Исправить самому','repair-explain','primary')+'</div>';
  }
  if(!e.selfCorrected){
    return '<span class="eyebrow">Self-correction</span><h1 class="h2">Теперь исправьте сами</h1>'+closedTask(t,'plain')+'<div class="button-row">'+button('Проверить','repair-self','primary')+'</div>';
  }
  if(!e.transfer){
    var tr=TRANSFER[e.skill]||TRANSFER.paraphrase;S.transferSample=tr;
    return '<span class="eyebrow">Transfer</span><h1 class="h2">Тот же навык — новый материал</h1><div class="notice">Без перевода и стратегии. Старый ответ здесь не помогает.</div>'+closedTask(tr,'plain')+'<div class="button-row">'+button('Проверить transfer','repair-transfer','primary')+'</div>';
  }
  return '<span class="eyebrow">Repair завершён</span><h1 class="h2">Ошибка дошла до нового контекста</h1>'+card('Следующий шаг','Отложенное повторение поставлено в очередь. Если ошибка вернётся позже, навык снова поднимется в маршруте.','good')+'<div class="button-row">'+button('Продолжить сессию','repair-continue','primary')+'</div>';
}
function repairExplain(){var e=S.errors.find(function(x){return x.id===S.activeError;});e.explained=true;S.ui.selected=null;save();render();}
function repairSelf(){
  var e=S.errors.find(function(x){return x.id===S.activeError;}),t=SAMPLES[e.sourceKey]||SAMPLES['Lesen-1'];if(S.ui.selected==null){alert('Выберите ответ.');return;}
  if(S.ui.selected!==t.correct){e.recurrence++;S.ui.selected=null;save();alert('Пока нет. Вернитесь к evidence и попробуйте ещё раз.');return;}
  e.selfCorrected=true;recordEvidence(t.module,t.skill,true,'self_correction',{assisted:true});S.ui.selected=null;save();render();
}
function repairTransfer(){
  var e=S.errors.find(function(x){return x.id===S.activeError;}),t=S.transferSample||TRANSFER[e.skill]||TRANSFER.paraphrase;if(S.ui.selected==null){alert('Выберите ответ.');return;}
  var ok=S.ui.selected===t.correct;recordEvidence(t.module,t.skill,ok,'transfer',{assisted:false});S.ui.selected=null;
  if(ok){e.transfer=true;e.status='resolved';e.nextDue=new Date(Date.now()+86400000).toISOString();S.reviews.push({id:uid('rev'),errorId:e.id,module:e.module,skill:e.skill,dueAt:e.nextDue,status:'scheduled'});}
  else{e.recurrence++;e.selfCorrected=false;e.explained=false;}
  recompute();save();render();
}
function repairContinue(){S.daily.step++;save();go('daily');}

function errorsView(){
  var html='<span class="eyebrow">Мои ошибки</span><h1 class="h2">История ошибок и отработка</h1><p class="lead">Ошибка хранится до тех пор, пока не пройдены self-correction, новый контекст и будущая перепроверка.</p><div class="stack">';
  if(!S.errors.length)html+=card('Пока пусто','Ошибки появятся здесь после реальных тренировок.','soft');
  S.errors.slice().reverse().forEach(function(e){html+=card(e.module+' · '+skillLabel(e.skill),esc(e.reason)+'<br><span class="small">Возвратов: '+e.recurrence+' · self-correction: '+(e.selfCorrected?'да':'нет')+' · transfer: '+(e.transfer?'да':'нет')+'</span>',e.status==='resolved'?'good':'bad');});
  html+='</div>';return html;
}
function progressView(){
  var html='<span class="eyebrow">Прогресс</span><h1 class="h2">Не клики, а evidence</h1><div class="grid4">';
  MODULES.forEach(function(m){var st=moduleStatus(m),count=S.evidence.filter(function(e){return e.module===m;}).length;html+='<div class="card"><b>'+m+'</b><div style="margin:8px 0">'+pill(st.label,st.kind)+'</div><span class="small">Evidence: '+count+'</span></div>';});
  html+='</div><div style="height:14px"></div>'+card('Readiness','Отдельный показатель по модулю появится только при достаточном покрытии Teil и устойчивых независимых попытках. Пока данных мало — так и показываем.','warn')+'<div class="button-row">'+button('Weekly checkpoint','weekly-start','secondary')+button('Пробный экзамен','open-exam-hub','ghost')+'</div>';return html;
}
function weeklyView(){
  var tasks=[SAMPLES['Lesen-2'],SAMPLES['Hören-3']];
  if(S.weekly.completed)return '<span class="eyebrow">Weekly checkpoint</span><h1 class="h2">Маршрут обновлён</h1>'+card('Что произошло','Новые независимые попытки добавлены в evidence, а приоритеты пересчитаны.','good')+'<div class="button-row">'+button('К маршруту','open-route','primary')+'</div>';
  var t=tasks[S.weekly.index];
  return '<span class="eyebrow">Weekly checkpoint · '+(S.weekly.index+1)+'/2</span><h1 class="h2">Независимый срез</h1><div class="notice">Без перевода и стратегии. Используется новый материал, а не знакомое тренировочное задание.</div>'+closedTask(t,'plain')+'<div class="button-row">'+button(S.weekly.index===1?'Завершить':'Дальше','weekly-submit','primary')+'</div>';
}
function weeklySubmit(){
  var tasks=[SAMPLES['Lesen-2'],SAMPLES['Hören-3']],t=tasks[S.weekly.index];if(S.ui.selected==null){alert('Выберите ответ.');return;}
  var ok=S.ui.selected===t.correct;recordEvidence(t.module,t.skill,ok,'weekly',{assisted:false});if(!ok)addError(t,S.ui.selected);
  S.ui.selected=null;S.weekly.answers.push({module:t.module,ok:ok});S.weekly.index++;if(S.weekly.index>=tasks.length){S.weekly.completed=true;recompute();}save();render();
}

function examHubView(){
  var html='<span class="eyebrow">Пробный экзамен</span><h1 class="h2">Экзаменационный режим</h1><p class="lead">Здесь будет полный mock, а не пара вопросов под видом экзамена. Уже сейчас видно, как устроены все четыре модуля и можно проверить поведение Exam mode.</p><div class="grid2">';
  MODULES.forEach(function(m){var x=EXAM_MAP[m];html+='<div class="card"><span style="font-size:28px">'+x.icon+'</span><h3>'+m+'</h3><p class="muted">'+x.time+' · '+x.parts+' частей. Без перевода, стратегии и мгновенного feedback.</p><button class="btn secondary" data-exam-module="'+m+'">Демонстрация режима</button></div>';});
  html+='</div><div class="exam-banner" style="margin-top:18px"><h3 style="margin-top:0">Полный пробный Goethe-Zertifikat B1</h3><p class="muted">Финальная архитектура предусматривает 10 полноценных собственных вариантов с правильным временем и последовательностью. Preview показывает место и поведение режима, но не выдаёт короткий proof за полный mock.</p></div>';return html;
}
function startExamModule(m){S.exam={module:m,done:false,result:null,audioPlays:{}};S.selectedModule=m;S.selectedTeil=1;S.ui.selected=null;save();go('exam-proof');}
function examProofView(){
  var m=S.exam.module,t=SAMPLES[m+'-1'];
  if(S.exam.done)return '<span class="eyebrow">Exam mode · '+m+'</span><h1 class="h2">Блок завершён</h1>'+card('Результат Preview',S.exam.result===null?'Ответ сохранён для последующего оценивания.':(S.exam.result?'Задание выполнено верно.':'Есть ошибка — после выхода она вернётся в маршрут.'),S.exam.result===false?'bad':'good')+'<p class="muted">Это демонстрация режима, не официальный Goethe score и не полноценный mock.</p><div class="button-row">'+button('К экзамену','open-exam-hub','primary')+'</div>';
  var head='<span class="eyebrow">Exam mode · '+m+'</span><h1 class="h2">Без помощи во время задания</h1><div class="notice">Перевод, стратегия и immediate feedback отключены. Результат появляется только после завершения блока.</div>';
  if(t.kind==='closed'||t.kind==='audio')return head+closedTask(t,'exam')+'<div class="button-row">'+button('Завершить блок','exam-submit','primary')+'</div>';
  if(t.kind==='writing')return head+'<div class="task-text">'+esc(t.prompt)+'</div><textarea id="examWriting" class="field" rows="10" placeholder="Schreiben Sie auf Deutsch…"></textarea><div class="button-row">'+button('Завершить блок','exam-writing','primary')+'</div>';
  return head+'<div class="task-text">'+esc(t.prompt)+'</div><div class="record-box"><span class="record-dot"></span><b> Запись ответа</b><div class="button-row" style="justify-content:center">'+button('🎙 Начать / остановить','exam-record','secondary')+'</div></div><div class="button-row">'+button('Завершить блок','exam-speaking','primary')+'</div>';
}
function examSubmit(){
  var t=SAMPLES[S.exam.module+'-1'];if(S.ui.selected==null){alert('Выберите ответ.');return;}
  var ok=S.ui.selected===t.correct;recordEvidence(t.module,t.skill,ok,'exam_like',{assisted:false});if(!ok)addError(t,S.ui.selected);S.exam.done=true;S.exam.result=ok;S.ui.selected=null;save();render();
}
function examWriting(){
  var text=$('#examWriting').value.trim(),a=writingCheck(text);if(!a.valid){alert('Нужен завершённый немецкий ответ.');return;}
  S.exam.done=true;S.exam.result=null;recordEvidence('Schreiben','task_fulfilment',null,'exam_like',{wordCount:a.words,unscored:true});save();render();
}
function examSpeaking(){S.exam.done=true;S.exam.result=null;save();render();}

function ottoModal(){
  return '<div class="modal-backdrop"><div class="modal"><div class="modal-head"><div><span class="eyebrow">Otto Personal · Preview shell</span><h2 style="margin:0">Спросить Otto</h2></div><button class="close" data-action="close-otto">×</button></div><div class="speaker"><div class="speaker-avatar"><img src="'+window.OTTO_SRC+'" alt="Otto"></div><div class="muted">В полном продукте здесь: вопрос по Goethe B1, письмо, внешний материал, voice question, pronunciation check и персональная мини-тренировка.</div></div><textarea class="field" rows="5" placeholder="Например: помоги мне потренировать Hören Teil 4…"></textarea><p class="small">AI в этом Preview не подключён — проверяем место функции и UX.</p></div></div>';
}
function renderModal(){$('#modalRoot').innerHTML=S.ui.ottoOpen?ottoModal():'';}

function eventClick(e){
  var nav=e.target.closest('[data-nav]');if(nav){go(nav.dataset.nav);return;}
  var mod=e.target.closest('[data-module]');if(mod){openModule(mod.dataset.module);return;}
  var teil=e.target.closest('[data-open-teil]');if(teil){openTeil(teil.dataset.openTeil);return;}
  var ex=e.target.closest('[data-exam-module]');if(ex){startExamModule(ex.dataset.examModule);return;}
  var min=e.target.closest('[data-minutes]');if(min){S.dailyMinutes=Number(min.dataset.minutes);save();render();return;}
  var ch=e.target.closest('[data-choice]');if(ch){S.ui.selected=Number(ch.dataset.choice);save();render();return;}
  var a=e.target.closest('[data-action]');if(!a)return;
  var x=a.dataset.action;
  if(x==='auth-email')setAuthMethod('email');
  else if(x==='auth-telegram')setAuthMethod('telegram');
  else if(x==='submit-registration')submitRegistration();
  else if(x==='verify')finishVerification();
  else if(x==='back-register')go('register');
  else if(x==='start-diagnostic')startDiagnostic();
  else if(x==='diag-submit')diagSubmit();
  else if(x==='diag-writing')diagWriting();
  else if(x==='diag-record')toggleRecorder('diagnostic');
  else if(x==='diag-speaking')diagSpeakingFinish(false);
  else if(x==='diag-speaking-skip')diagSpeakingFinish(true);
  else if(x==='toggle-translation'){S.ui.translation=!S.ui.translation;save();render();}
  else if(x==='toggle-strategy'){S.ui.strategy=!S.ui.strategy;save();render();}
  else if(x==='play-audio')playCurrentAudio();
  else if(x==='report-home')go('home');
  else if(x==='start-daily')startDaily();
  else if(x==='open-route')go('route');
  else if(x==='open-modules')go('modules');
  else if(x==='open-exam-hub')go('exam-hub');
  else if(x==='back-module')go('module');
  else if(x==='free-submit')freeSubmit();
  else if(x==='free-writing')freeWriting();
  else if(x==='free-record')toggleRecorder('speaking-'+S.selectedTeil);
  else if(x==='otto-speak'){
    var prompts=['Wir wollen am Samstag ein kleines Treffen für unsere Lerngruppe organisieren. Ich würde 16 Uhr vorschlagen. Was meinst du?','Gut. Wo sollen wir uns treffen? Ich finde ein Café in der Nähe vom Bahnhof praktisch.','Wer kümmert sich um Getränke und wer informiert die Gruppe?'];
    playText(prompts[Math.min(S.speaking.turn,2)],0.92);
  }
  else if(x==='voice-dialogue')voiceDialogue();
  else if(x==='speaking-daily-continue'){S.daily.step++;S.speaking.fromDaily=false;save();go('daily');}
  else if(x==='daily-submit')dailySubmit();
  else if(x==='daily-writing')dailyWriting();
  else if(x==='daily-speaking')dailySpeaking();
  else if(x==='daily-home')go('home');
  else if(x==='daily-progress')go('progress');
  else if(x==='repair-explain')repairExplain();
  else if(x==='repair-self')repairSelf();
  else if(x==='repair-transfer')repairTransfer();
  else if(x==='repair-continue')repairContinue();
  else if(x==='weekly-start'){S.weekly={index:0,answers:[],completed:false};save();go('weekly');}
  else if(x==='weekly-submit')weeklySubmit();
  else if(x==='exam-current')startExamModule(S.selectedModule);
  else if(x==='exam-submit')examSubmit();
  else if(x==='exam-writing')examWriting();
  else if(x==='exam-record')toggleRecorder('exam-speaking');
  else if(x==='exam-speaking')examSpeaking();
  else if(x==='close-otto'){S.ui.ottoOpen=false;save();renderModal();}
}

const VIEWS={
  register:registerView,verify:verifyView,'diagnostic-gate':diagnosticGate,diagnostic:diagnosticView,report:reportView,
  home:homeView,route:routeView,modules:modulesView,module:moduleView,'module-task':moduleTaskView,
  repair:repairView,errors:errorsView,progress:progressView,weekly:weeklyView,'exam-hub':examHubView,'exam-proof':examProofView
};

document.addEventListener('click',eventClick);
$('#resetButton').addEventListener('click',function(){if(confirm('Сбросить данные Preview и начать регистрацию заново?'))reset();});
$('#ottoFab').addEventListener('click',function(){S.ui.ottoOpen=true;save();renderModal();});
window.addEventListener('hashchange',render);
$('#ottoFabImg').src=window.OTTO_SRC||'';
recompute();
if(!location.hash)location.hash='#register';
render();
