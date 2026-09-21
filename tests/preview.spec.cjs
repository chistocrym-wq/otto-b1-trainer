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

  // Registration-state regression: changing only minutes must preserve all other draft fields.
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

async function runA22Diagnostic(page,{resumeCheck=false}={}){
  await page.getByRole('button',{name:'Начать диагностику'}).click();
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
  await expect(page.getByText('Schreiben · реальный productive sample')).toBeVisible();
  await page.locator('#writingSample').fill('Hallo Maria, am Wochenende war ich mit meiner Schwester in Heidelberg. Wir sind mit dem Zug gefahren und haben die Altstadt besucht. Besonders gut hat mir das Schloss gefallen, weil man von dort eine schöne Aussicht hat. Am Abend waren wir müde, aber sehr zufrieden. Vielleicht können wir uns nächste Woche treffen und ich zeige dir die Fotos. Viele Grüße, Anna');
  await page.getByRole('button',{name:'Сохранить и перейти к Sprechen'}).click();

  // Productive speech is deliberately not scored when microphone evidence is unavailable.
  for(let guard=0;guard<3;guard++){
    const state=await page.evaluate(()=>window.__OTTO_TEST__.getState());
    if(state.diagnostic.session.completed)break;
    await expect(page.getByText(/Sprechen ·/)).toBeVisible();
    await page.getByRole('button',{name:'Нет доступа к микрофону'}).click();
  }
  await expect(page.getByText(/Текущая учебная зона:/)).toBeVisible();
}

test('registration persistence + mandatory diagnostic + resume + A2.2 route',async({page},testInfo)=>{
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
  await expect(page.getByText('BRIDGE_TO_B1')).toBeVisible();
  expect(errors).toEqual([]);
});

test('legacy demo training is quarantined; module task map stays visible',async({page})=>{
  await fresh(page);
  await page.evaluate(()=>{
    const bank=window.__OTTO_TEST__.bank,engine=window.__OTTO_TEST__.engine;
    const s=window.__OTTO_TEST__.getState();
    s.auth={method:'email',contact:'anna@example.com',verified:true};s.name='Anna';
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
  await page.evaluate(()=>{history.replaceState(null,'','#modules');window.dispatchEvent(new PopStateEvent('popstate'));});
  await expect(page.getByText(/Старые SAMPLES/)).toBeVisible();
  await page.locator('[data-module="Lesen"]').first().click();
  expect(await page.locator('.teil-row').count()).toBe(5);
  await expect(page.getByText(/training content QA pending/).first()).toBeVisible();
  await expect(page.getByRole('button',{name:/Тренировать|Начать задание/})).toHaveCount(0);
});

test('mobile 390 has no overflow and diagnostic gate remains usable',async({page},testInfo)=>{
  await page.setViewportSize({width:390,height:844});
  await fresh(page);
  await expect(page.getByText('Готовимся к сертификату B1')).toBeVisible();
  let overflow=await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth+1);
  expect(overflow).toBe(false);
  await page.screenshot({path:testInfo.outputPath('registration-mobile-390.png'),fullPage:true});

  await register(page);
  overflow=await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth+1);
  expect(overflow).toBe(false);
  await expect(page.getByRole('button',{name:'Начать диагностику'})).toBeVisible();
});
