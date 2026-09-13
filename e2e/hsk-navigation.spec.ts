import {test,expect} from '@playwright/test';
test('selects a later generated lesson independently in each HSK track',async({page})=>{
 await page.goto('/');
 for(const [index,track] of ['beginner','intermediate','advanced'].entries()){
  await page.locator('.track-tabs button').nth(index).click();
  const selector=page.getByLabel('Lesson',{exact:true});
  await expect(selector).toBeVisible();
  const count=await selector.locator('option').count();expect(count).toBeGreaterThan(20);
  await selector.selectOption({index:count-1});
  const id=await selector.inputValue();expect(id).toMatch(new RegExp('^hsk3-'+track+'-'));
  await page.getByRole('button',{name:/Pinyin Match/}).click();
  const response=page.waitForResponse(r=>r.url().endsWith('/minigames/sessions')&&r.request().method()==='POST');
  await page.getByRole('button',{name:'Let’s play'}).click();
  expect((await (await response).json()).lessonId).toBe(id);
  page.once('dialog',dialog=>dialog.accept());
  await page.getByRole('button',{name:'Learn',exact:true}).click();
 }
});
