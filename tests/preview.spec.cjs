'use strict';
const {test,expect}=require('@playwright/test');
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
let server,base;
const mime={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.mp3':'audio/mpeg'};
test.beforeAll(async()=>{
  server=http.createServer((req,res)=>{
    let p=new URL(req.url,'http://127.0.0.1').pathname;
    if(p==='/')p='/index.html';if(p==='/favicon.ico'){res.writeHead(204);return res.end();}
    const file=path.normalize(path.join(root,p));if(!file.startsWith(root)){res.writeHead(403);return res.end();}
    fs.readFile(file,(e,b)=>{if(e){res.writeHead(404);return res.end();}res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'});res.end(b);});
  });
  await new Promise(r=>server.listen(0,'127.0.0.1',r));base='http://127.0.0.1:'+server.address().port;
});
test.afterAll(async()=>new Promise(r=>server.close(r)));
async function fresh(page){
  await page.goto(base,{waitUntil:'networkidle'});await page.evaluate(()=>{localStorage.clear();location.hash='#register';});await page.reload({waitUntil:'networkidle'});
}
async function register(page){
  await expect(page.getByText('Готовимся к сертификату B1')).toBeVisible();
  await page.locator('#regName').fill('Anna');await page.locator('#regContact').fill('anna@example.com');await page.locator('#regExamDate').fill('2026-12-15');
  await page.locator('[data-minutes="25"]').click();await page.getByRole('button',{name:'Получить код'}).click();
  await expect(page.getByText('Профиль сохранён')).toBeVisible();await page.getByRole('button',{name:'Перейти к диагностике'}).click();
  await expect(page.getByText('Сначала — диагностика')).toBeVisible();
}
async function seedCompleted(page,{minutes=25}={}){
  await page.evaluate(({minutes})=>{
    const engine=window.__OTTO_TEST__.engine,s=window.__OTTO_TEST__.getState();
    s.auth={method:'email',contact:'anna@example.com',verified:true};s.name='Anna';s.dailyMinutes=minutes;
    const ds=engine.createSession(),bands=engine.BANDS;let item;
    while((item=engine.nextItem(ds))){const ok=bands.indexOf(item.target_band)<=bands.indexOf('A2.2');engine.submitClosed(ds,item.item_id,ok?item.correct_answer:(item.correct_answer===0?1:0));}
    engine.markComplete(ds);s.diagnostic.session=ds;s.diagnostic.result=engine.result(ds);
    s.diagnostic.result.gaps=[];s.diagnostic.result.profiles.Schreiben={status:'NEED_CONFIRMATION',band:null};s.diagnostic.result.profiles.Sprechen={status:'SUPPORTED',band:'A2.2'};
    window.__OTTO_TEST__.setState(s);
  },{minutes});
  await page.evaluate(()=>{location.hash='#home';});await page.reload({waitUntil:'networkidle'});
}
async function finishDiagnosticBySkipping(page){
  await page.getByRole('button',{name:'Начать диагностику'}).click();
  for(let guard=0;guard<80;guard++){
    const state=await page.evaluate(()=>window.__OTTO_TEST__.getState()),phase=state.diagnostic.session.phase;
    if(['closed_complete','writing','speaking','complete'].includes(phase))break;
    const item=await page.evaluate(()=>window.__OTTO_TEST__.currentItem()),order=['A1.1','A1.2','A2.1','A2.2','B1.1','B1.2'];
    const ok=order.indexOf(item.target_band)<=order.indexOf('A2.2'),choice=ok?item.correct_answer:(item.correct_answer===0?1:0);
    await page.locator('[data-diag-choice="'+choice+'"]').click();
  }
  await page.getByRole('button',{name:'Пропустить Schreiben'}).click();
  await page.getByRole('button',{name:'Пропустить Sprechen'}).click();
  await expect(page.getByText(/Ваш стартовый ориентир:/)).toBeVisible();
}
test('registration + diagnostic reach a usable report without technical labels',async({page})=>{
  await fresh(page);await register(page);await finishDiagnosticBySkipping(page);
  const text=await page.locator('#screen').innerText();
  expect(text).not.toMatch(/target_band|screening|boundary|NEED_CONFIRMATION|productive sample|Transcript/i);
  await expect(page.getByRole('button',{name:'Начать первое занятие'})).toBeVisible();
  expect(await page.locator('.beta-badge').count()).toBe(0);
  expect(await page.locator('body').innerText()).not.toMatch(/Продолжить в Beta|Доступно в Beta|тестовой версии/);
});
test('all four modules expose the generated task bank',async({page})=>{
  await fresh(page);await seedCompleted(page);await page.evaluate(()=>{location.hash='#modules';});await page.waitForTimeout(50);
  const expected={Lesen:5,'Hören':4,Schreiben:3,Sprechen:3};
  for(const [m,parts] of Object.entries(expected)){
    await page.locator('[data-module="'+m+'"]').click();
    expect(await page.locator('.teil-row').count()).toBe(parts);
    expect(await page.locator('[data-start-full][data-mode="training"]').count()).toBe(parts);
    await expect(page.getByText('10 вариантов').first()).toBeVisible();
    expect(await page.locator('#screen').innerText()).not.toMatch(/CONTENT_READY|QA_PENDING|matching constraints|embedded question|purpose paraphrase/i);
    await page.evaluate(()=>{location.hash='#modules';});await page.waitForTimeout(30);
  }
});
test('report starts first real lesson; completion advances and reload resumes',async({page})=>{
  await fresh(page);await seedCompleted(page);await page.evaluate(()=>{location.hash='#report';});await page.waitForTimeout(40);
  await page.getByRole('button',{name:'Начать первое занятие'}).click();
  await expect(page.getByText(/Schreiben · Aufgabe/)).toBeVisible();
  const text='Hallo Anna, ich möchte dir von meinem neuen Kurs erzählen. Ich habe den Kurs gewählt, weil ich mein Deutsch verbessern und neue Leute kennenlernen möchte. Der erste Tag war sehr interessant. Wir haben in kleinen Gruppen gesprochen und eine kurze Aufgabe geschrieben. Die Lehrerin war freundlich und hat alles gut erklärt. Hast du am Samstag Zeit? Dann können wir uns treffen und ich erzähle dir mehr. Liebe Grüße, Mara';
  await page.locator('#fullWriting').fill(text);await page.getByRole('button',{name:'Проверить мой текст'}).click();
  await expect(page.getByText(/Хорошая основа|Проверьте объём/)).toBeVisible();await page.getByRole('button',{name:'Далее'}).click();
  const st=await page.evaluate(()=>window.__OTTO_TEST__.getState());expect(Object.keys(st.task_history).length).toBeGreaterThan(0);expect(st.dailySession.index).toBe(1);
  const current=st.lesson.task_id;await page.reload({waitUntil:'networkidle'});expect((await page.evaluate(()=>window.__OTTO_TEST__.getState().lesson.task_id))).toBe(current);
  await page.evaluate(()=>{location.hash='#home';});await page.waitForTimeout(50);await expect(page.getByRole('button',{name:'Продолжить занятие'})).toBeVisible();
});
test('Lesen training gives feedback; exam mode hides feedback until review',async({page})=>{
  await fresh(page);await seedCompleted(page);await page.evaluate(()=>{location.hash='#modules';});await page.waitForTimeout(40);await page.locator('[data-module="Lesen"]').click();
  await page.locator('[data-start-full="1"][data-mode="training"]').click();await expect(page.getByText(/Задание 1/)).toBeVisible();
  await page.getByRole('button',{name:'Перевод'}).click();await expect(page.locator('.translation-box').first()).toBeVisible();
  await page.locator('[data-full-choice="Richtig"]').click();await page.getByRole('button',{name:'Проверить'}).click();await expect(page.getByText('Нужно разобрать')).toBeVisible();await expect(page.getByText(/Ловушка:/)).toBeVisible();
  await page.evaluate(()=>{location.hash='#modules';});await page.waitForTimeout(30);await page.locator('[data-module="Lesen"]').click();await page.locator('[data-start-full="1"][data-mode="exam"]').click();
  const answers=['Falsch','Falsch','Richtig','Falsch','Richtig','Falsch'];
  for(let i=0;i<answers.length;i++){
    await page.locator('[data-full-choice="'+answers[i]+'"]').click();
    expect(await page.getByText(/Правильный ответ:/).count()).toBe(0);
    await page.getByRole('button',{name:i===5?'Завершить попытку':'Далее →'}).click();
  }
  await expect(page.getByText('6 / 6')).toBeVisible();expect(await page.getByText(/Правильный ответ:/).count()).toBe(0);
  await page.getByRole('button',{name:'Разобрать ответы'}).click();await expect(page.getByText(/Правильный ответ:/).first()).toBeVisible();
});
test('errors page uses human Russian explanations, never raw codes',async({page})=>{
  await fresh(page);await seedCompleted(page);
  await page.evaluate(()=>{const s=window.__OTTO_TEST__.getState();s.learningErrors=[{task_id:'x1',module:'Lesen',skill:'Lesen',micro_skill:'matching_constraints'},{task_id:'x2',module:'grammar',skill:'grammar',micro_skill:'embedded_question'},{task_id:'x3',module:'Lesen',skill:'Lesen',micro_skill:'purpose_paraphrase'}];window.__OTTO_TEST__.setState(s);});
  await page.locator('[data-nav="errors"]').click();
  await expect(page.getByText('Разбираем и превращаем в тренировку')).toBeVisible();
  const text=await page.locator('#screen').innerText();
  expect(text).toContain('Не все условия объявления были учтены');expect(text).toContain('Порядок слов в косвенном вопросе');expect(text).toContain('Трудно распознать ту же мысль другими словами');
  expect(text).not.toMatch(/matching_constraints|matching constraints|embedded_question|embedded question|purpose_paraphrase|purpose paraphrase/);
  await expect(page.getByRole('button',{name:/Потренировать/}).first()).toBeVisible();
});
test('Sprechen microphone preflight records, plays back and uses transcription contract',async({page})=>{
  await page.addInitScript(()=>{
    const real=window.setTimeout.bind(window);window.setTimeout=(fn,ms,...a)=>real(fn,ms===5000?25:ms,...a);
    Object.defineProperty(navigator,'permissions',{configurable:true,value:{query:async()=>({state:'granted'})}});
    Object.defineProperty(navigator,'mediaDevices',{configurable:true,value:{getUserMedia:async()=>({getTracks:()=>[{stop(){}}]}),enumerateDevices:async()=>[{kind:'audioinput',deviceId:'fake'}]}});
    class FakeMediaRecorder{constructor(stream,opt){this.state='inactive';this.mimeType=opt?.mimeType||'audio/webm';}static isTypeSupported(){return true;}start(){this.state='recording';}stop(){if(this.state!=='recording')return;this.state='inactive';if(this.ondataavailable)this.ondataavailable({data:new Blob(['fake-audio'],{type:this.mimeType})});if(this.onstop)this.onstop();}}
    window.MediaRecorder=FakeMediaRecorder;
  });
  await page.route('**/.netlify/functions/transcribe',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({text:'Ich würde Samstag vorschlagen. Wir treffen uns in der Bibliothek.'})}));
  await fresh(page);await seedCompleted(page);await page.evaluate(()=>{location.hash='#modules';});await page.waitForTimeout(40);await page.locator('[data-module="Sprechen"]').click();await page.locator('[data-start-full="1"][data-mode="training"]').click();
  await page.getByRole('button',{name:'Проверить микрофон'}).click();await expect(page.getByText(/Запись готова/).first()).toBeVisible({timeout:3000});await expect(page.locator('audio').first()).toBeVisible();
  await page.getByRole('button',{name:'🎙 Начать запись'}).click();await page.getByRole('button',{name:'■ Остановить'}).click();await expect(page.getByText('Запись готова',{exact:true}).last()).toBeVisible();
  await page.getByRole('button',{name:'Отправить запись'}).click();await expect(page.getByText(/Ich würde Samstag vorschlagen/)).toBeVisible();await expect(page.getByText(/не является оценкой произношения/)).toBeVisible();
});
test('Otto chat is real UI and mobile 390 has no beta/overflow',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.route('**/.netlify/functions/otto-chat',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({text:'Сначала найдите в тексте предложение, которое подтверждает вашу мысль.'})}));
  await fresh(page);await seedCompleted(page);await page.getByRole('button',{name:'Спросить Otto'}).click();
  await expect(page.locator('#ottoMessage')).toBeVisible();await page.locator('#ottoMessage').fill('Почему ответ неверный?');await page.getByRole('button',{name:'Отправить'}).click();await expect(page.getByText(/Сначала найдите в тексте/)).toBeVisible();
  await page.getByRole('button',{name:'×'}).click();expect(await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth+1)).toBe(false);
  expect(await page.locator('.beta-badge').count()).toBe(0);expect(await page.locator('body').innerText()).not.toMatch(/\bBeta\b|тестовой версии/);
});
