'use strict';
const {test, expect}=require('@playwright/test');
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
let server,base;
const mime={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8'};
test.beforeAll(async()=>{server=http.createServer((req,res)=>{let p=new URL(req.url,'http://127.0.0.1').pathname;if(p==='/')p='/index.html';const file=path.normalize(path.join(root,p));if(!file.startsWith(root)){res.writeHead(403);return res.end();}fs.readFile(file,(e,b)=>{if(e){res.writeHead(404);return res.end();}res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'});res.end(b);});});await new Promise(r=>server.listen(0,'127.0.0.1',r));base='http://127.0.0.1:'+server.address().port;});
test.afterAll(async()=>{await new Promise(r=>server.close(r));});

async function fresh(page){
  await page.goto(base,{waitUntil:'networkidle'});
  await page.evaluate(()=>{localStorage.clear();location.hash='#register';});
  await page.reload({waitUntil:'networkidle'});
}
async function registerAndVerify(page){
  await expect(page.getByText('Готовимся к сертификату B1')).toBeVisible();
  await expect(page.getByText('Регистрация',{exact:true})).toBeVisible();
  await page.locator('#regName').fill('Anna');
  await page.locator('#regContact').fill('anna@example.com');
  await page.locator('#regExamDate').fill('2026-12-15');
  await page.locator('[data-minutes="45"]').click();
  await expect(page.locator('#regName')).toHaveValue('Anna');
  await expect(page.locator('#regContact')).toHaveValue('anna@example.com');
  await expect(page.locator('#regExamDate')).toHaveValue('2026-12-15');
  await page.getByRole('button',{name:'Получить код'}).click();
  await expect(page.getByText('Введите код из письма')).toBeVisible();
  await page.locator('#verifyCode').fill('111111');
  await page.getByRole('button',{name:'Подтвердить'}).click();
  await expect(page.getByText('Сначала — диагностика')).toBeVisible();
  await expect(page.locator('#bottomNav')).toHaveClass(/hidden/);
  await expect(page.getByRole('button',{name:'Провести диагностику'})).toBeVisible();
}
async function completeDiagnostic(page){
  await page.getByRole('button',{name:'Провести диагностику'}).click();
  await page.getByRole('button',{name:'Der Termin findet zu einer anderen Zeit statt.'}).click();
  await page.getByRole('button',{name:'Продолжить'}).click();
  await page.getByRole('button',{name:'Ich bleibe zu Hause, weil ich krank bin.'}).click();
  await page.getByRole('button',{name:'Продолжить'}).click();
  await page.getByRole('button',{name:'Falsch',exact:true}).click();
  await page.getByRole('button',{name:'Продолжить'}).click();
  await page.getByRole('button',{name:'Richtig',exact:true}).click();
  await page.getByRole('button',{name:'Продолжить'}).click();
  await page.locator('#diagWriting').fill('Hallo Mia, leider konnte ich gestern nicht kommen, weil mein Zug sehr spät war. Können wir uns morgen um 18 Uhr im Café treffen? Entschuldige bitte. Viele Grüße, Anna');
  await page.getByRole('button',{name:'Сохранить текст'}).click();
  await page.getByRole('button',{name:'Нет доступа к микрофону'}).click();
  await expect(page.getByText('Теперь Otto знает, с чего начинать')).toBeVisible();
}

test('registration -> mandatory diagnostic -> two-mode home -> module maps',async({page},testInfo)=>{
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await fresh(page);await registerAndVerify(page);await completeDiagnostic(page);
  await page.getByRole('button',{name:'Открыть мою подготовку'}).click();
  await expect(page.getByText('Otto ведёт меня')).toBeVisible();
  await expect(page.getByText('Выбрать самому')).toBeVisible();
  await expect(page.getByText('Четыре модуля Goethe-Zertifikat B1')).toBeVisible();
  await page.screenshot({path:testInfo.outputPath('home-desktop.png'),fullPage:true});

  await page.getByRole('button',{name:'Открыть модули'}).click();
  await page.locator('[data-module="Lesen"]').first().click();
  await expect(page.getByText('Teil 5')).toBeVisible();
  expect(await page.locator('.teil-row').count()).toBe(5);
  await page.getByRole('button',{name:'← Все модули'}).click();
  await page.locator('[data-module="Hören"]').first().click();
  expect(await page.locator('.teil-row').count()).toBe(4);
  await page.getByRole('button',{name:'← Все модули'}).click();
  await page.locator('[data-module="Schreiben"]').first().click();
  expect(await page.locator('.teil-row').count()).toBe(3);
  await page.getByRole('button',{name:'← Все модули'}).click();
  await page.locator('[data-module="Sprechen"]').first().click();
  expect(await page.locator('.teil-row').count()).toBe(3);
  expect(errors).toEqual([]);
});

test('training has translation/strategy; exam does not; Lesen error enters repair',async({page})=>{
  await fresh(page);await registerAndVerify(page);await completeDiagnostic(page);
  await page.getByRole('button',{name:'Открыть мою подготовку'}).click();
  await page.getByRole('button',{name:'Открыть модули'}).click();
  await page.locator('[data-module="Lesen"]').first().click();
  await page.locator('[data-open-teil="1"]').click();
  await expect(page.getByRole('button',{name:/Перевод/})).toBeVisible();
  await page.getByRole('button',{name:/Перевод/}).click();
  await expect(page.getByText(/^Перевод:/)).toBeVisible();

  await page.evaluate(()=>location.hash='#home');
  await page.waitForTimeout(100);
  await page.getByRole('button',{name:'Продолжить мою подготовку'}).click();
  const dailyText=await page.locator('#screen').innerText();
  expect(dailyText.length).toBeGreaterThan(20);

  await page.evaluate(()=>location.hash='#exam-hub');
  await page.waitForTimeout(100);
  await page.locator('[data-exam-module="Lesen"]').click();
  await expect(page.getByText('Без помощи во время задания')).toBeVisible();
  await expect(page.getByRole('button',{name:/Перевод/})).toHaveCount(0);
  await expect(page.getByRole('button',{name:/Стратегия/})).toHaveCount(0);
});

test('responsive mobile and Sprechen live interaction surface',async({page},testInfo)=>{
  await page.setViewportSize({width:390,height:844});
  await fresh(page);
  await expect(page.getByText('Готовимся к сертификату B1')).toBeVisible();
  let overflow=await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth+1);
  expect(overflow).toBe(false);
  await page.screenshot({path:testInfo.outputPath('register-mobile-390.png'),fullPage:true});

  // Seed diagnostic-complete state to inspect speaking without repeating diagnostics.
  await page.evaluate(()=>{
    const s=JSON.parse(localStorage.getItem('ottoB1.clean.preview.v2')||'{}');
    s.auth={method:'email',contact:'a@b.de',verified:true};s.name='Anna';
    s.diagnostic={index:6,answers:[],writing:null,speaking:null,completed:true,audioPlays:{}};
    localStorage.setItem('ottoB1.clean.preview.v2',JSON.stringify(s));
  });
  await page.reload({waitUntil:'networkidle'});
  await page.evaluate(()=>location.hash='#modules');await page.waitForTimeout(100);
  await page.locator('[data-module="Sprechen"]').first().click();
  await page.locator('[data-open-teil="1"]').click();
  await expect(page.getByText('Поговорите с Otto голосом')).toBeVisible();
  await expect(page.getByRole('button',{name:'🎙 Ответить голосом'})).toBeVisible();
  overflow=await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth+1);
  expect(overflow).toBe(false);
});
