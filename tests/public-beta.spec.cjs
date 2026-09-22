'use strict';
const {test,expect}=require('@playwright/test');

const url=process.env.PUBLIC_BETA_URL;
if(!url)throw new Error('PUBLIC_BETA_URL is required');

async function assertPublicShell(page){
  const response=await page.goto(url,{waitUntil:'networkidle',timeout:30000});
  expect(response).not.toBeNull();
  expect(response.status()).toBe(200);
  await expect(page.locator('.beta-badge')).toHaveCount(0);
  await expect(page.getByText('Готовимся к сертификату B1')).toBeVisible();
  const body=await page.locator('body').innerText();
  expect(body).not.toMatch(/Log in to Netlify|Sign in to Netlify|GitHub login|Team SSO/i);
  expect(body).not.toMatch(/\\bBeta\\b|тестовой версии/);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth+1)).toBe(false);
}

test('public Beta anonymous desktop is interactive and reaches diagnostic gate',async({browser},testInfo)=>{
  const context=await browser.newContext({viewport:{width:1440,height:900}});
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});

  await assertPublicShell(page);

  await page.locator('#regName').fill('Preview User');
  await page.locator('#regContact').fill('beta@example.com');
  await page.locator('#regExamDate').fill('2026-12-15');

  for(const mins of ['10','25','45']){
    await page.locator('[data-minutes="'+mins+'"]').click();
    await expect(page.locator('#regName')).toHaveValue('Preview User');
    await expect(page.locator('#regContact')).toHaveValue('beta@example.com');
    await expect(page.locator('#regExamDate')).toHaveValue('2026-12-15');
  }

  await page.getByRole('button',{name:'Получить код'}).click();
  await expect(page.getByText('Профиль сохранён')).toBeVisible();
  await page.getByRole('button',{name:'Перейти к диагностике'}).click();
  await expect(page.getByText('Сначала — диагностика')).toBeVisible();
  expect(errors).toEqual([]);

  await page.screenshot({path:testInfo.outputPath('public-beta-desktop.png'),fullPage:true});
  await context.close();
});

test('public Beta anonymous 390x844 renders without overflow or login',async({browser},testInfo)=>{
  const context=await browser.newContext({viewport:{width:390,height:844}});
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});

  await assertPublicShell(page);
  await page.locator('[data-minutes="10"]').click();
  await expect(page.locator('.beta-badge')).toHaveCount(0);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth+1)).toBe(false);
  expect(errors).toEqual([]);

  await page.screenshot({path:testInfo.outputPath('public-beta-390.png'),fullPage:true});
  await context.close();
});
