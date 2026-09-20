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
  if (!target.startsWith(root)) {
    res.writeHead(403); return res.end('forbidden');
  }
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

test('owner preview scenario works end-to-end and produces honest state', async ({ browser }, testInfo) => {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const pageErrors = [];
  const consoleErrors = [];
  page.on('pageerror', e => pageErrors.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()); });

  await page.goto(baseURL, { waitUntil: 'networkidle' });

  await expect(page.getByRole('button', { name: 'Начать мою подготовку' }).first()).toBeVisible();
  await page.screenshot({path:testInfo.outputPath('01-home-desktop.png'), fullPage:true});

  await page.getByRole('button', { name: 'Начать мою подготовку' }).first().click();
  await expect(page.getByText('План на 25 минут')).toBeVisible();
  await expect(page.getByText('Почему сейчас').first()).toBeVisible();
  await page.screenshot({path:testInfo.outputPath('02-plan-desktop.png'), fullPage:true});

  await page.getByRole('button', { name: 'Начать мою подготовку' }).click();
  await expect(page.getByText('Lesen · Teil 1')).toBeVisible();
  const firstStatement = (await page.locator('.i01-statement').textContent()).trim();
  await page.screenshot({path:testInfo.outputPath('03-task-desktop.png'), fullPage:true});

  // First task is deliberately answered incorrectly to force the genuine repair path.
  await page.getByRole('button', { name: 'Falsch', exact: true }).click();
  await page.getByRole('button', { name: 'Ответить' }).click();

  await expect(page.getByText('Сначала попробуй исправить сам')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Исправить самому' })).toBeVisible();
  await page.screenshot({path:testInfo.outputPath('04-repair-desktop.png'), fullPage:true});

  // Self-repair succeeds without content-level help.
  await page.getByRole('button', { name: 'Richtig', exact: true }).click();
  await page.getByRole('button', { name: 'Исправить самому' }).click();

  await expect(page.getByText('Новый контекст · перенос навыка')).toBeVisible();
  const transferStatement = (await page.locator('.i01-statement').textContent()).trim();
  expect(transferStatement).not.toBe(firstStatement);
  await page.screenshot({path:testInfo.outputPath('05-transfer-desktop.png'), fullPage:true});

  await page.getByRole('button', { name: 'Richtig', exact: true }).click();
  await page.getByRole('button', { name: 'Ответить' }).click();

  // Inspect actual persisted runtime after transfer.
  const persisted = await page.evaluate(() => JSON.parse(localStorage.ottoB1 || '{}'));
  expect(persisted.i01.evidenceEvents.length).toBeGreaterThanOrEqual(3);
  expect(persisted.i01.errors.length).toBeGreaterThanOrEqual(1);
  expect(persisted.i01.reviews.length).toBeGreaterThanOrEqual(1);
  expect(persisted.i01.reviews[0].review_reason).toContain('POST_REPAIR_CONFIRMATION');
  expect(persisted.i01.planRevisions.length).toBeGreaterThanOrEqual(3);

  const source = persisted.i01.evidenceEvents.find(e => e.outcome_status === 'failure');
  const transfer = persisted.i01.evidenceEvents.find(e => e.evidence_class === 'P4');
  expect(source).toBeTruthy();
  expect(transfer).toBeTruthy();
  expect(transfer.task_instance_id).not.toBe(source.task_instance_id);
  expect(transfer.content_fingerprint).not.toBe(source.content_fingerprint);
  expect(transfer.variant_group_id).not.toBe(source.variant_group_id);

  // Audit/reason path is user-visible.
  if (await page.locator('.i01-reason .i01-link').count()) {
    await page.locator('.i01-reason .i01-link').first().click();
    await expect(page.getByText('Почему OTTO так считает?')).toBeVisible();
    await expect(page.getByText('Что дальше')).toBeVisible();
    await page.getByRole('button', { name: 'Назад' }).click();
  }

  // Finish session intentionally; unstarted work is not treated as failure.
  await page.evaluate(() => window.i01FinishSession());
  await expect(page.getByText('Что реально произошло')).toBeVisible();
  await expect(page.getByText('Исправлено — проверим позже')).toBeVisible();
  await page.screenshot({path:testInfo.outputPath('06-summary-desktop.png'), fullPage:true});

  await page.getByRole('button', { name: 'Открыть готовность по модулям' }).click();
  await expect(page.getByText('Четыре модуля — четыре отдельные картины')).toBeVisible();
  for (const module of ['Lesen','Hören','Schreiben','Sprechen']) {
    await expect(page.getByRole('heading', { name: module })).toBeVisible();
  }
  await expect(page.getByText('Недостаточно данных').first()).toBeVisible();
  expect((await page.locator('body').innerText())).not.toMatch(/\d+%|60\/100|B1 ready/i);
  await page.screenshot({path:testInfo.outputPath('07-readiness-desktop.png'), fullPage:true});

  // Mobile visual smoke on the same rendered app.
  await page.setViewportSize({width:390,height:844});
  await page.evaluate(() => window.go('home'));
  await expect(page.getByRole('button', {name:/мою подготовку/i}).first()).toBeVisible();
  await page.screenshot({path:testInfo.outputPath('08-home-mobile.png'), fullPage:true});
  await page.evaluate(() => window.go('readiness'));
  await page.screenshot({path:testInfo.outputPath('09-readiness-mobile.png'), fullPage:true});

  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
  await page.close();
});

test('assistance is recorded and does not masquerade as independent', async ({ page }) => {
  await page.goto(baseURL, { waitUntil:'networkidle' });
  await page.getByRole('button', { name: 'Начать мою подготовку' }).first().click();
  await page.getByRole('button', { name: 'Начать мою подготовку' }).click();

  await page.getByRole('button', { name: 'Совет Отто · будет отмечен как помощь', exact: true }).click();
  await page.getByRole('button', { name: 'Richtig', exact:true }).click();
  await page.getByRole('button', { name: 'Ответить' }).click();

  const state = await page.evaluate(() => JSON.parse(localStorage.ottoB1 || '{}').i01);
  const success = state.evidenceEvents.find(e => e.outcome_status === 'success');
  expect(success.evidence_class).toBe('P2');
  expect(success.independence).toBe('minimally_supported');
  expect(success.max_assistance_consumed).toBe('strategy');
  expect(state.assistanceEvents.some(a => a.event_id === success.event_id)).toBe(true);
});
