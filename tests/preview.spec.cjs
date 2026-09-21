'use strict';
const {test,expect}=require('@playwright/test');
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');

const root=path.resolve(__dirname,'..');
let server,base;
const mime={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8'};

test.beforeAll(async()=>{
  server=http.createServer((req,res)=>{
    let p=new URL(req.url,'http://127.0.0.1').pathname;
    if(p==='/')p='/index.html';
    const file=path.normalize(path.join(root,p));
    if(!file.startsWith(root)){res.writeHead(403);return res.end();}
    fs.readFile(file,(e,b)=>{
      if(e){res.writeHead(404);return res.end();}
      res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'});
      res.end(b);
    });
  });
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  base='http://127.0.0.1:'+server.address().port;
});
test.afterAll(async()=>{await new Promise(r=>server.close(r));});

async function fresh(page){
  await page.goto(base,{waitUntil:'networkidle'});
  await page.evaluate(()=>{localStorage.clear();location.hash='#register';});
  await page.reload({waitUntil:'networkidle'});
}
async function register(page){
  await expect(page.getByText('Готовимся к сертификату B1')).toBeVisible();
  await page.locator('#regName').fill('Anna');
  await page.locator('#regContact').fill('anna@example.com');
  await page.locator('#regExamDate').fill('2026-12-15');

  await page.locator('[data-minutes="45"]').click();
  await expect(page.locator('#regName')).toHaveValue('Anna');
  await expect(page.locator('#regContact')).toHaveValue('anna@example.com');
  await expect(page.locator('#regExamDate')).toHaveValue('2026-12-15');

  await page.getByRole('button',{name:'Получить код'}).click();
  await page.locator('#verifyCode').fill('111111');
  await page.getByRole('button',{name:'Подтвердить'}).click();
  await expect(page.getByText('Сначала — диагностика')).toBeVisible();
  await expect(page.locator('#bottomNav')).toHaveClass(/hidden/);
}
async function seedCompleted(page){
  await page.evaluate(()=>{
    const engine=window.__OTTO_TEST__.engine;
    const s=window.__OTTO_TEST__.getState();
    s.auth={method:'email',contact:'anna@example.com',verified:true};
    s.name='Anna';s.dailyMinutes=25;
    const ds=engine.createSession();
    let item;
    const bands=engine.BANDS;
    while((item=engine.nextItem(ds))){
      const ok=bands.indexOf(item.target_band)<=bands.indexOf('A2.2');
      engine.submitClosed(ds,item.item_id,ok?item.correct_answer:(item.correct_answer===0?1:0));
    }
    engine.markComplete(ds);
    s.diagnostic.session=ds;
    s.diagnostic.result=engine.result(ds);
    window.__OTTO_TEST__.setState(s);
  });
  await page.evaluate(()=>{location.hash='#home';});
  await page.reload({waitUntil:'networkidle'});
}
async function runA22Diagnostic(page,{resumeCheck=false}={}){
  await page.getByRole('button',{name:'Начать диагностику'}).click();
  await expect(page.getByText('Определяем ваш стартовый уровень')).toBeVisible();

  const firstScreen=await page.locator('#screen').innerText();
  expect(firstScreen).not.toMatch(/A1\.1|A1\.2|A2\.1|A2\.2|B1\.1|B1\.2|target_band|boundary|screening/i);

  let answered=0;
  for(let guard=0;guard<70;guard++){
    const state=await page.evaluate(()=>window.__OTTO_TEST__.getState());
    const phase=state.diagnostic.session.phase;
    if(['closed_complete','writing','speaking','complete'].includes(phase))break;
    const item=await page.evaluate(()=>window.__OTTO_TEST__.currentItem());
    expect(item).toBeTruthy();
    const order=['A1.1','A1.2','A2.1','A2.2','B1.1','B1.2'];
    const ok=order.indexOf(item.target_band)<=order.indexOf('A2.2');
    const choice=ok?item.correct_answer:(item.correct_answer===0?1:0);
    await page.locator('[data-diag-choice="'+choice+'"]').click();
    answered++;
    if(resumeCheck&&answered===3){
      const before=await page.evaluate(()=>window.__OTTO_TEST__.getState().diagnostic.session);
      await page.reload({waitUntil:'networkidle'});
      const after=await page.evaluate(()=>window.__OTTO_TEST__.getState().diagnostic.session);
      expect(after.answers.length).toBe(before.answers.length);
      expect(after.phase).toBe(before.phase);
    }
  }
  await expect(page.getByText('Напишите короткий ответ по-немецки')).toBeVisible();
  await page.locator('#writingSample').fill('Hallo Maria, am Wochenende war ich mit meiner Schwester in Heidelberg. Wir sind mit dem Zug gefahren und haben die Altstadt besucht. Besonders gut hat mir das Schloss gefallen, weil man von dort eine schöne Aussicht hat. Am Abend waren wir müde, aber sehr zufrieden. Vielleicht können wir uns nächste Woche treffen und ich zeige dir die Fotos. Viele Grüße, Anna');
  await page.getByRole('button',{name:'Сохранить и перейти к Sprechen'}).click();

  for(let guard=0;guard<3;guard++){
    const state=await page.evaluate(()=>window.__OTTO_TEST__.getState());
    if(state.diagnostic.session.completed)break;
    await expect(page.getByText(/Sprechen · речевой образец/)).toBeVisible();
    await page.getByRole('button',{name:'Нет доступа к микрофону'}).click();
  }
  await expect(page.getByText(/Ваш текущий ориентир:|Пока нужно ещё немного данных/)).toBeVisible();
}

test('registration persists; diagnostic hides engine internals and resumes; human route is shown',async({page},testInfo)=>{
  const errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});

  await fresh(page);
  await register(page);
  await runA22Diagnostic(page,{resumeCheck:true});

  const result=await page.evaluate(()=>window.__OTTO_TEST__.result());
  expect(result.placement.status).toBe('PLACED');
  expect(result.placement.band).toBe('A2.2');
  expect(result.route.routeType).toBe('BRIDGE_TO_B1');
  expect(result.profiles.Sprechen.status).toBe('NEED_CONFIRMATION');

  await page.screenshot({path:testInfo.outputPath('diagnostic-report-desktop.png'),fullPage:true});
  await page.getByRole('button',{name:'Открыть мой маршрут'}).click();
  await expect(page.getByText('Мост от текущего уровня к B1')).toBeVisible();
  expect(await page.locator('#screen').innerText()).not.toContain('BRIDGE_TO_B1');
  expect(errors).toEqual([]);
});

test('Guide B1 is global and contextual; Schreiben/Sprechen structure is correct',async({page})=>{
  await fresh(page);await seedCompleted(page);

  await expect(page.locator('#guideButton')).toBeVisible();
  await page.locator('#guideButton').click();
  await expect(page.getByText('Как проходит экзамен, стратегии, образцы и подсказки')).toBeVisible();
  await expect(page.getByText('65 минут').first()).toBeVisible();
  await expect(page.getByText('30 заданий').first()).toBeVisible();

  await page.locator('[data-guide-module="Schreiben"]').click();
  await expect(page.getByText('Aufgabe 1 — E-Mail',{exact:true})).toHaveCount(1);
  await expect(page.getByText('Aufgabe 2 — Diskussionsbeitrag',{exact:true})).toHaveCount(1);
  await expect(page.getByText('Aufgabe 3 — короткая E-Mail',{exact:true})).toHaveCount(1);
  await expect(page.getByText('Один хороший вариант · Aufgabe 1')).toBeVisible();
  await expect(page.getByText('Phrase bank',{exact:true}).first()).toBeVisible();
  await expect(page.getByText('Шаблон',{exact:true}).first()).toBeVisible();
  expect(await page.locator('#screen').innerText()).not.toContain('Präsentation');

  await page.locator('[data-guide-module="Sprechen"]').click();
  await expect(page.getByText(/Aufgabe 2 — Präsentation/)).toHaveCount(1);
  await expect(page.getByRole('button',{name:'Прослушать образец'})).toBeVisible();

  await page.evaluate(()=>{location.hash='#modules';});
  await page.waitForTimeout(100);
  await page.locator('[data-module="Lesen"]').click();
  await expect(page.getByText('65 минут')).toBeVisible();
  await expect(page.getByText('30')).toBeVisible();
  expect(await page.locator('.teil-row').count()).toBe(5);
  await expect(page.getByRole('button',{name:'Помощь по Lesen'})).toBeVisible();
  await page.getByRole('button',{name:'Помощь по Lesen'}).click();
  await expect(page.getByText('Что делать и на что смотреть')).toBeVisible();
  await page.getByRole('button',{name:'Открыть полный Гид B1'}).click();
  await expect(page.locator('.guide-tab.active')).toHaveText('Lesen');
});

test('full Lesen Teil 1: Russian support, translation evidence, dictionary, feedback, Back/Next and finish',async({page})=>{
  await fresh(page);await seedCompleted(page);
  await page.evaluate(()=>{location.hash='#modules';});
  await page.waitForTimeout(80);
  await page.locator('[data-module="Lesen"]').click();
  await page.locator('[data-start-learning="1"]').click();

  await expect(page.getByText('Задание 1 из 6')).toBeVisible();
  await expect(page.getByText(/Прочитайте текст и 6 утверждений/)).toBeVisible();
  await expect(page.getByRole('button',{name:/Перевод текста/})).toBeVisible();
  await page.getByRole('button',{name:/Перевод текста/}).click();
  await expect(page.getByText(/Всем привет!/)).toBeVisible();

  await page.getByRole('button',{name:/Словарь задания/}).click();
  await expect(page.locator('.dictionary-row').filter({hasText:'inzwischen'}).first()).toBeVisible();
  await expect(page.locator('[data-speak-word]').first()).toBeVisible();

  // Q1 intentionally wrong: Richtig instead of Falsch.
  await page.locator('[data-learn-choice="0"]').click();
  await page.getByRole('button',{name:'Проверить'}).click();
  await expect(page.getByText('Нужно разобрать')).toBeVisible();
  await expect(page.getByText(/Где ловушка:/)).toBeVisible();
  await expect(page.locator('.feedback-card').getByText(/Gemeinschaftsraum/)).toBeVisible();

  await page.getByRole('button',{name:'Далее →'}).click();
  await expect(page.getByText('Задание 2 из 6')).toBeVisible();
  await page.getByRole('button',{name:'← Назад'}).click();
  await expect(page.getByText('Задание 1 из 6')).toBeVisible();
  await expect(page.getByText('Нужно разобрать')).toBeVisible();
  await page.getByRole('button',{name:'Далее →'}).click();

  const answers=[0,1,1,0,1]; // Q2..Q6: R, F, F, R, F
  for(let idx=0;idx<answers.length;idx++){
    await page.locator('[data-learn-choice="'+answers[idx]+'"]').click();
    await page.getByRole('button',{name:'Проверить'}).click();
    const last=idx===answers.length-1;
    await page.getByRole('button',{name:last?'Завершить Teil':'Далее →'}).click();
  }
  await expect(page.getByText('5 / 6')).toBeVisible();
  const state=await page.evaluate(()=>window.__OTTO_TEST__.getState());
  expect(state.assistanceEvidence.some(x=>x.kind==='translation_used')).toBe(true);
  expect(Object.values(state.learning.answerEvidence).some(x=>x.assisted===true)).toBe(true);
});

test('Exam-like hides assistance until review',async({page})=>{
  await fresh(page);await seedCompleted(page);
  await page.evaluate(()=>{location.hash='#modules';});await page.waitForTimeout(60);
  await page.locator('[data-module="Lesen"]').click();
  await page.locator('[data-start-exam="1"]').click();

  await expect(page.getByText('Без помощи во время задания')).toBeVisible();
  await expect(page.getByRole('button',{name:/Перевод|Стратегия|Словарь|Помощь/})).toHaveCount(0);

  const answers=[1,0,1,1,0,1];
  for(let i=0;i<6;i++){
    await page.locator('[data-learn-choice="'+answers[i]+'"]').click();
    await page.getByRole('button',{name:i===5?'Завершить Teil':'Далее →'}).click();
    if(i<5)await expect(page.getByText('Задание '+(i+2)+' из 6')).toBeVisible();
  }
  await expect(page.getByText('6 / 6')).toBeVisible();
  expect(await page.getByText(/Правильный ответ:/).count()).toBe(0);
  await page.getByRole('button',{name:'Разобрать ответы'}).click();
  await expect(page.getByText(/Правильный ответ:/).first()).toBeVisible();
  const state=await page.evaluate(()=>window.__OTTO_TEST__.getState());
  expect(Object.values(state.learning.answerEvidence).every(x=>x.assisted===false)).toBe(true);
});

test('blue canvas, mobile 390, bottom nav, Ask Otto, Share and decorative Otto are safe',async({page},testInfo)=>{
  await page.setViewportSize({width:390,height:844});
  await fresh(page);await seedCompleted(page);

  const visual=await page.evaluate(()=>({
    bodyBg:getComputedStyle(document.body).backgroundImage,
    shellBg:getComputedStyle(document.querySelector('.app-shell')).backgroundColor,
    topbarBg:getComputedStyle(document.querySelector('.topbar')).backgroundColor,
    decorPointer:getComputedStyle(document.querySelector('#ottoDecor')).pointerEvents,
    screenPaddingBottom:parseFloat(getComputedStyle(document.querySelector('.screen')).paddingBottom)
  }));
  expect(visual.bodyBg).not.toBe('none');
  expect(visual.shellBg).not.toBe('rgb(255, 255, 255)');
  expect(visual.topbarBg).not.toBe('rgb(255, 255, 255)');
  expect(visual.decorPointer).toBe('none');
  expect(visual.screenPaddingBottom).toBeGreaterThan(80);

  let overflow=await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth+1);
  expect(overflow).toBe(false);
  expect(await page.locator('#bottomNav button').count()).toBe(5);
  await expect(page.getByRole('button',{name:'Спросить Otto'})).toBeVisible();
  await page.getByRole('button',{name:'Спросить Otto'}).click();
  await expect(page.getByText('Otto Personal · Preview')).toBeVisible();
  await page.getByRole('button',{name:'×'}).click();

  await page.evaluate(()=>Object.defineProperty(navigator,'share',{configurable:true,value:async()=>{window.__shareCalled=true;}}));
  await page.locator('#shareButton').click();
  expect(await page.evaluate(()=>window.__shareCalled===true)).toBe(true);

  await page.evaluate(()=>{location.hash='#guide';});
  await page.waitForTimeout(100);
  overflow=await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth+1);
  expect(overflow).toBe(false);
  await page.screenshot({path:testInfo.outputPath('guide-mobile-390.png'),fullPage:true});
});
