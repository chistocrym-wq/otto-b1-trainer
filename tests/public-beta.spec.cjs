'use strict';
const {test,expect}=require('@playwright/test');

const url=process.env.PUBLIC_BETA_URL;
if(!url)throw new Error('PUBLIC_BETA_URL is required');

test('public Beta opens anonymously without Netlify/GitHub login',async({browser},testInfo)=>{
  const context=await browser.newContext({viewport:{width:390,height:844}});
  const page=await context.newPage();
  const response=await page.goto(url,{waitUntil:'networkidle',timeout:30000});
  expect(response).not.toBeNull();
  expect(response.status()).toBe(200);
  await expect(page.locator('.beta-badge')).toHaveText('Beta');
  await expect(page.getByText('Готовимся к сертификату B1')).toBeVisible();
  const body=await page.locator('body').innerText();
  expect(body).not.toMatch(/Log in to Netlify|Sign in to Netlify|GitHub login|Team SSO/i);
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth+1);
  expect(overflow).toBe(false);
  await page.screenshot({path:testInfo.outputPath('public-beta-390.png'),fullPage:true});
  await context.close();
});
