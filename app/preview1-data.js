'use strict';

const P1_VERSION='PREVIEW1-V1';
const MODULES=['Lesen','Hören','Schreiben','Sprechen'];
const SKILL_META={
  'BASE.GRAMMAR.ORDER':{module:'Basis',label:'Порядок слов в придаточном',kind:'baseline'},
  'BASE.VOCAB.CORE':{module:'Basis',label:'Контекстная лексика B1',kind:'baseline'},
  'L.T1.CORR.M04':{module:'Lesen',label:'Перефразирование',teil:'Teil 1'},
  'L.T1.CORR.M05':{module:'Lesen',label:'Отрицание и ограничение',teil:'Teil 1'},
  'H.T1.ANNOUNCE.M03':{module:'Hören',label:'Точная деталь: время / место / действие',teil:'Teil 1'},
  'H.T1.ANNOUNCE.M04':{module:'Hören',label:'Изменение / отмена / исключение',teil:'Teil 1'},
  'W.A1.CONTACT.M02':{module:'Schreiben',label:'Все пункты задания',teil:'Aufgabe 1'},
  'W.A1.CONTACT.M03':{module:'Schreiben',label:'Коммуникативные функции',teil:'Aufgabe 1'},
  'S.A1.PLAN.M02':{module:'Sprechen',label:'Сделать конкретное предложение',teil:'Aufgabe 1'},
  'S.A1.PLAN.M03':{module:'Sprechen',label:'Реагировать на предложение партнёра',teil:'Aufgabe 1'},
  'S.A1.PLAN.M04':{module:'Sprechen',label:'Спросить мнение / уточнить',teil:'Aufgabe 1'},
  'S.A1.PLAN.M05':{module:'Sprechen',label:'Согласиться и продвинуть план',teil:'Aufgabe 1'},
  'S.A1.PLAN.M06':{module:'Sprechen',label:'Вежливо не согласиться и объяснить',teil:'Aufgabe 1'},
  'S.A1.PLAN.M07':{module:'Sprechen',label:'Предложить альтернативу / компромисс',teil:'Aufgabe 1'},
  'S.A1.PLAN.M09':{module:'Sprechen',label:'Распределить практические детали',teil:'Aufgabe 1'}
};

const DIAG_STEPS=[
  {id:'d-vocab',screen:'diag-p1-vocab',skill:'BASE.VOCAB.CORE'},
  {id:'d-grammar',screen:'diag-p1-grammar',skill:'BASE.GRAMMAR.ORDER'},
  {id:'d-lesen',screen:'diag-p1-lesen',skill:'L.T1.CORR.M04'},
  {id:'d-hoeren',screen:'diag-p1-hoeren',skill:'H.T1.ANNOUNCE.M03'},
  {id:'d-writing',screen:'diag-p1-writing',skill:'W.A1.CONTACT.M02'},
  {id:'d-speaking',screen:'diag-p1-speaking',skill:'S.A1.PLAN.M03'}
];

const TASKS={
  'd-vocab':{module:'Basis',skill:'BASE.VOCAB.CORE',type:'mc',prompt:'Что означает фраза „Der Termin wurde verschoben“?',options:['Встречу отменили','Встречу перенесли','Встречу подтвердили'],correct:1,trap:'Проверяем не отдельное слово, а устойчивый смысл.'},
  'd-grammar':{module:'Basis',skill:'BASE.GRAMMAR.ORDER',type:'mc',prompt:'Выбери правильное предложение.',options:['Ich bleibe zu Hause, weil ich bin krank.','Ich bleibe zu Hause, weil ich krank bin.','Ich bleibe, weil bin ich krank zu Hause.'],correct:1,trap:'В придаточном с weil спрягаемый глагол уходит в конец.'},
  'd-lesen':{module:'Lesen',skill:'L.T1.CORR.M04',type:'mc',text:'Liebe Nora, ich komme morgen etwas später. Der Zug aus Köln hat heute schon zwanzig Minuten Verspätung, und morgen wird auf derselben Strecke gebaut. Warte bitte nicht vor dem Café, sondern geh schon hinein.',translation:'Нора, завтра я приду немного позже. Поезд из Кёльна уже сегодня опаздывает на двадцать минут, а завтра на той же линии будут ремонтные работы. Не жди меня перед кафе, а заходи внутрь.',prompt:'Die Person bittet Nora, im Café auf sie zu warten.',options:['Richtig','Falsch'],correct:0,trap:'„geh schon hinein“ перефразирует ожидание внутри кафе.'},
  'd-lesen-confirm':{module:'Lesen',skill:'L.T1.CORR.M04',type:'mc',text:'Der Computerkurs ist für Vereinsmitglieder gratis. Gäste können auch teilnehmen, bezahlen aber acht Euro.',translation:'Компьютерный курс бесплатен для членов клуба. Гости тоже могут участвовать, но платят восемь евро.',prompt:'Mitglieder des Vereins müssen für den Kurs nichts bezahlen.',options:['Richtig','Falsch'],correct:0,trap:'„gratis“ и „nichts bezahlen“ выражают один смысл.'},
  'd-hoeren':{module:'Hören',skill:'H.T1.ANNOUNCE.M03',type:'audio',audio:'assets/hoeren-01.mp3',prompt:'Was sollen Besucher tun, wenn sie am Fotokurs teilnehmen möchten?',options:['Eigene Materialien mitbringen','Sich bis 16:00 in eine Liste eintragen','Bis 17:30 Uhr im Saal warten'],correct:1,trap:'Слушай действие и точную временную деталь, а не знакомые слова.'},
  'train-lesen':{module:'Lesen',skill:'L.T1.CORR.M05',type:'mc',text:'Eigentlich wollte ich am Freitag kommen, aber ich schaffe es erst am Samstag. Bitte reserviere nichts für Freitag.',translation:'Вообще-то я хотел приехать в пятницу, но смогу только в субботу. Пожалуйста, ничего не бронируй на пятницу.',prompt:'Die Person kommt am Freitag.',options:['Richtig','Falsch'],correct:1,trap:'Слова „Freitag“ есть в тексте, но смысл исправлен конструкцией „aber … erst am Samstag“.'},
  'transfer-lesen':{module:'Lesen',skill:'L.T1.CORR.M05',type:'mc',text:'Der Eingang an der Hauptstraße ist heute geschlossen. Besucher sollen den Seiteneingang benutzen.',translation:'Сегодня вход со стороны главной улицы закрыт. Посетителям следует пользоваться боковым входом.',prompt:'Heute kann man das Gebäude nicht über den Haupteingang betreten.',options:['Richtig','Falsch'],correct:0,trap:'Нужно заметить ограничение „heute geschlossen“.'},
  'train-hoeren':{module:'Hören',skill:'H.T1.ANNOUNCE.M04',type:'audio',audio:'assets/hoeren-03.mp3',prompt:'Die Verabredung bleibt um 17:30 Uhr vor dem Kino.',options:['Richtig','Falsch'],correct:1,trap:'Цель — услышать изменение договорённости, а не первое названное время.'},
  'exam-lesen':{module:'Lesen',skill:'L.T1.CORR.M04',type:'mc',text:'Der Computerkurs ist für Vereinsmitglieder gratis. Gäste können auch teilnehmen, bezahlen aber acht Euro.',prompt:'Mitglieder des Vereins müssen für den Kurs nichts bezahlen.',options:['Richtig','Falsch'],correct:0},
  'exam-hoeren':{module:'Hören',skill:'H.T1.ANNOUNCE.M04',type:'audio',audio:'assets/hoeren-03.mp3',prompt:'Die ursprüngliche Verabredung bleibt unverändert.',options:['Richtig','Falsch'],correct:1}
};

function now(){return Date.now();}
function iso(ts){return new Date(ts||Date.now()).toISOString();}
function p(){
  if(!S.preview1){
    S.preview1={version:P1_VERSION,startedAt:iso(),diagnostic:{cursor:0,completed:false,evidence:[],writing:null,speaking:null},skills:{},errors:[],reviews:[],route:{priorities:[],updatedAt:null},daily:{duration:25,queue:[],cursor:0,active:false,completed:false},ui:{translation:{},strategy:{},exam:false},exam:{active:false,startedAt:null,endsAt:null,answers:[],completedAt:null},checkpoint:{runs:0,lastAt:null},personalOtto:{lastPrompt:''}};
    persist();
  }
  return S.preview1;
}
function resetP1(){S.preview1=null;p();persist();}
function h(s){return esc(s==null?'':s);}
function addScreen(id,title,renderer){TITLES[id]=title;if(!SCREENS.some(x=>x[0]===id))SCREENS.push([id,title]);R[id]=renderer;}
function refreshMap(){by('mapItems').innerHTML=SCREENS.map(([r,t],i)=>`<button onclick="toggleMap();go('${r}')">${i+1}. ${h(t)}</button>`).join('');}
function style(){if(document.getElementById('preview1-style'))return;const s=document.createElement('style');s.id='preview1-style';s.textContent=`
:root{--bg:#f5f7fb;--card:#ffffff;--ink:#11243e;--muted:#65758a;--brand:#205bce;--soft:#eef4ff;--ok:#eaf7ef;--warn:#fff5df;--bad:#fff0ef}
body{background:linear-gradient(180deg,#f7f9fd,#edf2f8);color:var(--ink)}.app{border-color:#dfe7f2;box-shadow:0 26px 70px #17365f1c}.head{background:#ffffffee;border-bottom-color:#e8eef6}.hero{background:linear-gradient(145deg,#0f2947,#174f93 62%,#2d68c6)}.hero p{color:#e8f0ff}.card,.module{border-color:#e2e9f3}.soft{background:#f5f8fd}.primary{background:#174f93}.secondary{background:#edf4ff;color:#174f93}.field{border-color:#d7e0eb}.field:focus{border-color:#4c7ed0;box-shadow:0 0 0 4px #dce9ff}.eyebrow{color:#3464aa}.bar i{background:#2b66c4}.nav{background:#fffffff2;border-top-color:#e8eef6}.notice{background:#f4f7fb}.option.sel{border-color:#4b78bd;background:#edf4ff}.p1-hero-row{display:grid;grid-template-columns:1fr 120px;gap:14px;align-items:center}.p1-otto{width:112px;height:112px;border-radius:28px;overflow:hidden;background:#fff;border:1px solid #dfe7f2}.p1-otto img{width:100%;height:100%;object-fit:cover;object-position:center 18%}.p1-task{font-size:16px;line-height:1.6;background:#f7f9fc;border:1px solid #e4ebf4;border-radius:18px;padding:16px;margin:12px 0}.p1-tools{display:flex;gap:8px;flex-wrap:wrap;margin:10px 0}.p1-chip{border:1px solid #dbe5f1;background:#fff;border-radius:999px;padding:8px 11px;font-size:12px;font-weight:800;color:#305a94}.p1-strip{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin:12px 0}.p1-strip div{padding:9px 5px;border-radius:12px;background:#f4f7fb;text-align:center;font-size:10px}.p1-strip b{display:block;font-size:13px;margin-bottom:2px}.p1-skill{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}.p1-state{font-size:11px;padding:5px 8px;border-radius:999px;background:#eef4ff;color:#234f88;font-weight:850;white-space:nowrap}.p1-risk{background:#fff0ef;color:#8f3c39}.p1-ok{background:#eaf7ef;color:#276443}.p1-unknown{background:#f2f4f7;color:#6b7582}.p1-dialog{display:grid;gap:10px}.p1-bubble{max-width:88%;border-radius:18px;padding:12px 14px;line-height:1.45}.p1-bubble.otto{background:#eef4ff}.p1-bubble.user{background:#102b4b;color:#fff;margin-left:auto}.p1-audio{display:flex;gap:8px;align-items:center}.p1-audio button{flex:1}.p1-overlay-note{font-size:11px;color:#6c7888}.p1-timer{font-variant-numeric:tabular-nums;font-weight:900}.p1-personal{position:fixed;right:18px;bottom:92px;width:58px;height:58px;border-radius:50%;border:0;background:#174f93;color:#fff;font-size:22px;box-shadow:0 10px 28px #174f9342;z-index:7}.p1-toolbar{display:grid;grid-template-columns:1fr 1fr;gap:8px}.p1-hidden{display:none!important}@media(max-width:520px){.p1-hero-row{grid-template-columns:1fr 92px}.p1-otto{width:90px;height:90px}.p1-personal{right:14px;bottom:88px}}
`;document.head.appendChild(s);}
function evidence(skill){return p().diagnostic.evidence.filter(x=>x.skill===skill).concat(p().daily.queue.flatMap(x=>x.evidence||[])).concat(p().exam.answers.filter(x=>x.skill===skill));}
function directEvidence(skill){return p().diagnostic.evidence.filter(x=>x.skill===skill).concat((p().dailyEvidence||[]).filter(x=>x.skill===skill)).concat(p().exam.answers.filter(x=>x.skill===skill));}
function recordEvidence(taskId,ok,ctx={}){const task=TASKS[taskId];const ev={id:'e-'+now()+'-'+Math.random().toString(36).slice(2,7),taskId,skill:task.skill,module:task.module,ok:!!ok,mode:ctx.mode||'diagnostic',assisted:!!ctx.assisted,responseMs:ctx.responseMs||null,at:iso(),source:'original_aligned'};if(ctx.selected!=null)ev.selected=ctx.selected;p().diagnostic.evidence.push(ev);updateSkills();return ev;}
function addGenericEvidence(skill,module,ok,mode,extra={}){const ev=Object.assign({id:'e-'+now()+'-'+Math.random().toString(36).slice(2,7),taskId:null,skill,module,ok:!!ok,mode:mode||'training',assisted:false,at:iso(),source:'original_aligned'},extra);p().diagnostic.evidence.push(ev);updateSkills();return ev;}
