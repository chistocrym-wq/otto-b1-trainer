'use strict';

const { test, expect } = require('@playwright/test');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
let server;
let baseURL;
const MIME = {
  '.html':'text/html; charset=utf-8',
  '.js':'application/javascript; charset=utf-8',
  '.txt':'text/plain; charset=utf-8',
  '.css':'text/css; charset=utf-8',
  '.webp':'image/webp',
  '.mp3':'audio/mpeg',
  '.json':'application/json; charset=utf-8'
};

function serveFile(req, res) {
  let pathname = decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname);
  if (pathname === '/') pathname = '/index.html';
  const target = path.normalize(path.join(root, pathname));
  if (!target.startsWith(root)) { res.writeHead(403); return res.end('forbidden'); }
  fs.stat(target, (err, st) => {
    if (err || !st.isFile()) { res.writeHead(404); return res.end('not found'); }
    res.writeHead(200, {'Content-Type': MIME[path.extname(target)] || 'application/octet-stream'});
    fs.createReadStream(target).pipe(res);
  });
}

test.beforeAll(async () => {
  server = http.createServer(serveFile);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  baseURL = 'http://127.0.0.1:' + server.address().port;
});

test.afterAll(async () => {
  await new Promise(resolve => server.close(resolve));
});

async function startFresh(page) {
  await page.goto(baseURL, { waitUntil:'networkidle' });
  await page.evaluate(() => localStorage.removeItem('ottoB1'));
  await page.reload({waitUntil:'networkidle'});
}

async function completeDiagnostic(page, opts={}) {
  await page.getByRole('button', {name:'Продолжить мою подготовку'}).click();
  await expect(page.getByText('Не курс «для всех», а маршрут по твоим результатам')).toBeVisible();
  await page.getByRole('button', {name:'Начать', exact:true}).click();

  await page.locator('#name').fill(opts.name || 'Anna');
  await page.getByRole('button', {name:'Продолжить', exact:true}).click();
  await page.getByRole('button', {name:'К диагностике'}).click();
  await page.getByRole('button', {name:'Начать диагностику'}).click();

  await page.getByRole('button', {name:'Встречу перенесли'}).click();
  await page.getByRole('button', {name:'Продолжить', exact:true}).click();

  await page.getByRole('button', {name:'Ich bleibe zu Hause, weil ich krank bin.'}).click();
  await page.getByRole('button', {name:'Продолжить', exact:true}).click();

  // Deliberate Lesen error so adaptive confirmation + repair priority are real.
  await page.getByRole('button', {name:'Falsch', exact:true}).click();
  await page.getByRole('button', {name:'Продолжить', exact:true}).click();

  await page.getByRole('button', {name:'Sich bis 16:00 in eine Liste eintragen'}).click();
  await page.getByRole('button', {name:'Продолжить', exact:true}).click();

  const writing = 'Hallo Lara, entschuldige bitte, dass ich gestern nicht kommen konnte, weil ich länger arbeiten musste. Können wir uns vielleicht am Samstag um 15 Uhr im Café treffen? Ich hoffe, der neue Termin passt dir gut. Liebe Grüße, Anna';
  await page.locator('#p1writing').fill(writing);
  await page.getByRole('button', {name:'Сохранить образец'}).click();

  await page.getByRole('button', {name:'Записать диагностический ответ'}).click();
  await expect(page.getByText(/автоматической оценки речи/i)).toBeVisible();
  await page.getByRole('button', {name:'Сохранить попытку'}).click();

  await expect(page.getByText('Уточняем Lesen после ошибки')).toBeVisible();
  await page.getByRole('button', {name:'Richtig', exact:true}).click();
  await page.getByRole('button', {name:'Ответить'}).click();

  await expect(page.getByText('Что уже видно — и чего пока не видно')).toBeVisible();
}

test('Preview 1 diagnostic drives route, repair, transfer and delayed review', async ({ browser }, testInfo) => {
  const page = await browser.newPage({viewport:{width:1440,height:1000}});
  const pageErrors=[]; const consoleErrors=[];
  page.on('pageerror', e=>pageErrors.push(String(e)));
  page.on('console', m=>{ if(m.type()==='error') consoleErrors.push(m.text()); });

  await startFresh(page);
  await expect(page.getByRole('button', {name:'Продолжить мою подготовку'})).toBeVisible();
  await expect(page.locator('.otto img')).toBeVisible();
  await page.screenshot({path:testInfo.outputPath('01-splash-desktop.png'),fullPage:true});

  await completeDiagnostic(page);

  const reportText=await page.locator('#screen').innerText();
  expect(reportText).toContain('Недостаточно данных');
  expect(reportText).not.toMatch(/вероятность сдачи|B1 ready|60\/100/i);
  await page.screenshot({path:testInfo.outputPath('02-diagnostic-report.png'),fullPage:true});

  await page.getByRole('button', {name:'Открыть мой маршрут'}).click();
  await expect(page.getByText('Что тренируем сейчас и почему')).toBeVisible();
  await expect(page.getByText('Перефразирование').first()).toBeVisible();

  await page.getByRole('button', {name:'Начать сегодняшнюю тренировку'}).click();
  await expect(page.getByText('Перефразирование').first()).toBeVisible();
  await expect(page.getByText(/технической Störung|technischen Störung/i)).toBeVisible();

  // Translation eye toggle really opens and closes in training mode.
  await page.getByRole('button', {name:/Перевод/}).click();
  await expect(page.getByText(/технической неисправности/i)).toBeVisible();
  await page.getByRole('button', {name:/Скрыть перевод/}).click();

  // Contextual strategy is collapsible.
  await page.locator('#screen .p1-chip').filter({hasText:'Стратегия Отто'}).click();
  await expect(page.getByText(/Как действовать/)).toBeVisible();

  // Deliberate error -> self-correction -> skill-matched transfer.
  await page.getByRole('button', {name:'Falsch', exact:true}).click();
  await page.getByRole('button', {name:'Ответить'}).click();
  await expect(page.getByText('Сначала исправь сам')).toBeVisible();

  await page.getByRole('button', {name:'Richtig', exact:true}).click();
  await page.getByRole('button', {name:'Исправить самому'}).click();
  await expect(page.getByText('Теперь без подсказок')).toBeVisible();
  await expect(page.getByText(/Der Eintritt kostet nichts/)).toBeVisible();
  expect(await page.locator('#screen').innerText()).not.toContain('Der Eingang an der Hauptstraße');

  await page.getByRole('button', {name:'Richtig', exact:true}).click();
  await page.getByRole('button', {name:'Ответить'}).click();
  await expect(page.getByText('Получилось на новом материале')).toBeVisible();

  const p1=await page.evaluate(()=>JSON.parse(localStorage.ottoB1).preview1);
  expect(p1.errors.length).toBeGreaterThan(0);
  expect(p1.errors.some(e=>e.skill==='L.T1.CORR.M04' && e.status==='resolved')).toBe(true);
  expect(p1.reviews.some(r=>r.skill==='L.T1.CORR.M04' && r.status==='scheduled')).toBe(true);
  expect(p1.route.priorities.length).toBeGreaterThan(0);

  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
  await page.close();
});

test('Representative Hören, Schreiben, Sprechen partner and exam-like flows work without fake AI', async ({ page }) => {
  await startFresh(page);
  await completeDiagnostic(page);

  // Hören representative flow uses preloaded audio and closed-task scoring.
  await page.evaluate(()=>go('hoeren'));
  await expect(page.getByText('Hören · Teil 1')).toBeVisible();
  await page.getByRole('button', {name:/Воспроизвести/}).click();
  await page.getByRole('button', {name:'Falsch', exact:true}).click();
  await page.getByRole('button', {name:'Ответить'}).click();
  await expect(page.getByText('Что тренируем сейчас и почему')).toBeVisible();

  // Schreiben: semantic/German gate, no fake Goethe percentage.
  await page.evaluate(()=>go('schreiben'));
  await page.locator('#p1modulew').fill('Hallo Max, entschuldige bitte, dass ich gestern nicht kommen konnte, weil mein Zug sehr spät war. Können wir uns am Freitag um 18 Uhr im Café treffen? Viele Grüße, Anna');
  await page.getByRole('button', {name:'Проверить входные условия'}).click();
  await expect(page.getByText('Без фиктивного Goethe-балла')).toBeVisible();
  expect(await page.locator('#screen').innerText()).not.toMatch(/\d+%|60\/100/);

  // Scripted Goethe-aligned Sprechen Aufgabe 1 partner simulation.
  await page.evaluate(()=>go('p1-speaking'));
  await expect(page.getByText('Otto — твой партнёр по совместному планированию')).toBeVisible();
  await page.getByRole('button', {name:'Не согласиться и объяснить'}).click();
  await expect(page.getByText(/компромисс/i)).toBeVisible();
  await page.getByRole('button', {name:'Предложить альтернативу'}).click();
  await page.getByRole('button', {name:'Распределить задачи'}).click();
  await expect(page.getByText('Парная тренировка завершена')).toBeVisible();
  await expect(page.getByText(/Что НЕ оценено/)).toBeVisible();

  // Exam-like mode: no help/translation and feedback delayed until end.
  await page.evaluate(()=>p1StartExam());
  await expect(page.getByText('Без подсказок и перевода')).toBeVisible();
  await expect(page.locator('#screen .p1-chip').filter({hasText:'Перевод'})).toHaveCount(0);
  await expect(page.locator('#screen .p1-chip').filter({hasText:'Стратегия Отто'})).toHaveCount(0);

  await page.getByRole('button', {name:'Richtig', exact:true}).click();
  await page.getByRole('button', {name:'Следующее'}).click();
  await expect(page.getByText(/Exam-like proof · 2\/2/)).toBeVisible();
  await page.getByRole('button', {name:'Falsch', exact:true}).click();
  await page.getByRole('button', {name:'Завершить'}).click();
  await expect(page.getByText('Результат после завершения')).toBeVisible();
  expect(await page.locator('#screen').innerText()).toContain('не официальный Goethe score');
});

test('route persists on reload, weekly checkpoint can change evidence, mobile layouts stay usable', async ({ page }, testInfo) => {
  await startFresh(page);
  await completeDiagnostic(page);
  await page.getByRole('button', {name:'Открыть мой маршрут'}).click();

  const before=await page.evaluate(()=>JSON.parse(localStorage.ottoB1).preview1.route.priorities.map(x=>[x.skill,x.score]));
  await page.reload({waitUntil:'networkidle'});
  const after=await page.evaluate(()=>JSON.parse(localStorage.ottoB1).preview1.route.priorities.map(x=>[x.skill,x.score]));
  expect(after).toEqual(before);

  await page.getByRole('button', {name:'Weekly checkpoint · пересчитать маршрут', exact:true}).click();
  await page.getByRole('button', {name:'Richtig', exact:true}).click();
  await page.getByRole('button', {name:'Дальше'}).click();
  await page.getByRole('button', {name:'Richtig', exact:true}).click();
  await page.getByRole('button', {name:'Завершить checkpoint'}).click();
  await expect(page.getByText('Что тренируем сейчас и почему')).toBeVisible();

  const checkpoint=await page.evaluate(()=>JSON.parse(localStorage.ottoB1).preview1.checkpoint);
  expect(checkpoint.runs).toBe(1);
  expect(checkpoint.answers.length).toBe(2);

  for (const width of [360,390,430]) {
    await page.setViewportSize({width,height:844});
    await page.evaluate(()=>go('home'));
    await expect(page.getByRole('button', {name:/тренировку|диагностику/i}).first()).toBeVisible();
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    expect(overflow).toBe(false);
    await page.screenshot({path:testInfo.outputPath('mobile-'+width+'.png'),fullPage:true});
  }
});

test('daily exam-like item keeps translation and strategy disabled after answer selection rerender', async ({ page }) => {
  await startFresh(page);
  // Seed a completed diagnostic state to enter a daily session quickly.
  await page.evaluate(() => {
    const s=JSON.parse(localStorage.ottoB1 || '{}');
    s.preview1={
      version:'PREVIEW1-V1',startedAt:new Date().toISOString(),
      diagnostic:{cursor:6,completed:true,adaptiveDone:true,evidence:[],writing:null,speaking:null},
      skills:{},errors:[],reviews:[],route:{priorities:[{skill:'L.T1.CORR.M04',module:'Lesen',label:'Перефразирование',score:45,why:'Нужно собрать больше независимых данных.'}],updatedAt:new Date().toISOString()},
      daily:{duration:10,queue:[],cursor:0,active:false,completed:false},
      ui:{translation:{},strategy:{},exam:false},exam:{active:false,startedAt:null,endsAt:null,answers:[],completedAt:null},
      checkpoint:{runs:0,lastAt:null},personalOtto:{lastPrompt:''}
    };
    localStorage.ottoB1=JSON.stringify(s);
  });
  await page.reload({waitUntil:'networkidle'});
  await page.evaluate(()=>p1StartDaily());
  // Move to exam-like action if priority is first.
  if ((await page.getByText(/Самостоятельная exam-like проверка/).count())===0) {
    await page.evaluate(()=>p1DailyNext());
  }
  await expect(page.getByText(/Самостоятельная exam-like проверка/)).toBeVisible();
  await expect(page.locator('#screen .p1-chip').filter({hasText:'Перевод'})).toHaveCount(0);
  await expect(page.locator('#screen .p1-chip').filter({hasText:'Стратегия Отто'})).toHaveCount(0);
  await page.getByRole('button', {name:'Richtig', exact:true}).click();
  await expect(page.locator('#screen .p1-chip').filter({hasText:'Перевод'})).toHaveCount(0);
  await expect(page.locator('#screen .p1-chip').filter({hasText:'Стратегия Отто'})).toHaveCount(0);
});
