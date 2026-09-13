import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {sessionSchema,sessionResultSchema} from '../apps/web/src/schemas.js';
import {GAME_TYPES,PROGRESS_STORAGE_KEY} from '../packages/contracts/src/index.js';
const names={'tone-match':'Tone Match','pinyin-match':'Pinyin Match','listen-pick':'Listen & Pick','character-trace':'Character Trace'};
for(const [track,index] of [['beginner',0],['intermediate',1],['advanced',2]] as const){
 test(track+' completes all games and retains progress',async({page,request})=>{
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('/');await expect(page.getByRole('heading',{name:'Your learning paths'})).toBeVisible();
  await page.locator('.track-tabs button').nth(index).click();
  for(const game of GAME_TYPES){
   await page.getByRole('button',{name:new RegExp(names[game])}).first().click();
   const created=page.waitForResponse(r=>r.url().endsWith('/minigames/sessions')&&r.request().method()==='POST');
   await page.getByRole('button',{name:'Let’s play'}).click();
   const session=sessionSchema.parse(await (await created).json());
   expect(session.rounds).toHaveLength([5,8,10][index]!);
   const response=await request.post('/api/v1/minigames/sessions/'+session.id+'/grade',{data:{answers:session.rounds.map(r=>({roundId:r.id,answerId:null,elapsedMs:0}))}});
   const key=sessionResultSchema.parse(await response.json());
   for(let i=0;i<session.rounds.length;i++){
    if(game==='character-trace'){
     const watch=page.getByRole('button',{name:'Watch stroke order'});
     await expect(watch).toBeEnabled();await watch.focus();await page.keyboard.press('Enter');
     await expect(page.getByText('Stroke practice complete. Choose the character below.')).toBeVisible();
    }
    if(i===0&&game==='pinyin-match'){
     const audit=await new AxeBuilder({page}).analyze();expect(audit.violations).toEqual([]);
    }
    const round=session.rounds[i]!,correct=key.rounds[i]!.correctAnswerId;
    await page.locator('.answer').nth(round.options.findIndex(o=>o.id===correct)).click();
    await expect(page.getByText('✓ Correct!',{exact:true})).toBeVisible();
    await page.getByRole('button',{name:i===session.rounds.length-1?'See results':'Next round'}).click();
   }
   await expect(page.getByRole('heading',{name:'Game completed',exact:true})).toBeVisible();
   await expect(page.getByText('100%',{exact:true})).toBeVisible();
   await page.getByRole('button',{name:'Back to courses',exact:true}).click();
  }
  const saved=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)!),PROGRESS_STORAGE_KEY);
  expect(saved.completedLessonIds).toContain('hsk3-'+track+'-001');expect(saved.xp).toBeGreaterThan(0);expect(saved.completedGameKeys).toHaveLength(4);
  await page.reload();
  await expect(page.locator('.xp-pill')).toContainText(String(saved.xp));
  await page.locator('.track-tabs button').nth(index).click();
  await expect(page.locator('.game-action').filter({hasText:'Completed'})).toHaveCount(4);
  expect(errors).toEqual([]);
 });
}
test('mobile, language switching, dictionary and audio fallback',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('/');
 await expect(page.getByRole('heading',{name:'Your learning paths'})).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
 expect((await new AxeBuilder({page}).analyze()).violations).toEqual([]);
 await page.getByLabel('Interface language').selectOption('zh-Hant');
 await expect(page.getByRole('heading',{name:'你的學習路線'})).toBeVisible();
 await page.locator('#locale').selectOption('zh-Hans');await expect(page.getByRole('heading',{name:'你的学习路线'})).toBeVisible();
 await page.locator('#locale').selectOption('en');
 await page.getByRole('button',{name:'Dictionary',exact:true}).click();
 await page.getByLabel('Look up a word',{exact:true}).fill('水');await page.getByRole('button',{name:'Look up a word',exact:true}).click();
 await expect(page.locator('.dictionary-entry').first()).toContainText('water');
 await page.getByRole('button',{name:'Learn',exact:true}).click();
 await page.getByRole('button',{name:/Listen & Pick/}).first().click();await page.getByRole('button',{name:'Let’s play'}).click();
 await page.route('**/api/v1/tts',route=>route.fulfill({status:503,json:{code:'TTS_UNAVAILABLE'}}),{times:1});
 await page.getByRole('button',{name:'Play audio'}).click();
 await expect(page.getByText('Audio is unavailable. Use the transcript or retry playback.')).toBeVisible();
 await page.getByText('Show transcript',{exact:true}).click();await expect(page.locator('.hanzi-small')).toBeVisible();
});

test('same-seed retry recovers failure and grading retry preserves the answer',async({page,request})=>{
 await page.goto('/');await page.getByRole('button',{name:/Tone Match/}).first().click();
 const created=page.waitForResponse(r=>r.url().endsWith('/minigames/sessions')&&r.request().method()==='POST');
 await page.getByRole('button',{name:'Let’s play'}).click();
 const session=sessionSchema.parse(await (await created).json());
 for(let i=0;i<5;i++){await page.getByRole('button',{name:'Skip this round'}).click();await page.getByRole('button',{name:i===4?'See results':'Next round'}).click();}
 await expect(page.getByRole('heading',{name:'A little more practice'})).toBeVisible();
 await page.getByRole('button',{name:'Retry same rounds'}).click();
 const response=await request.post('/api/v1/minigames/sessions/'+session.id+'/grade',{data:{answers:session.rounds.map(r=>({roundId:r.id,answerId:null,elapsedMs:0}))}});
 const key=sessionResultSchema.parse(await response.json());
 await page.route('**/grade',route=>route.abort(),{times:1});
 for(let i=0;i<5;i++){
  const round=session.rounds[i]!;
  await page.locator('.answer').nth(round.options.findIndex(o=>o.id===key.rounds[i]!.correctAnswerId)).click();
  if(i===0){await expect(page.getByText('Could not load this step. Please retry.')).toBeVisible();await page.getByRole('button',{name:'Retry',exact:true}).click();}
  await expect(page.getByText('✓ Correct!',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:i===4?'See results':'Next round'}).click();
 }
 await expect(page.getByRole('heading',{name:'Game completed',exact:true})).toBeVisible();
 expect((await new AxeBuilder({page}).analyze()).violations).toEqual([]);
 await page.reload();
 const saved=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)!),PROGRESS_STORAGE_KEY);
 expect(saved.completedGameKeys).toContain('hsk3-beginner-001|tone-match');expect(saved.xp).toBe(50);expect(Object.keys(saved.review)).toHaveLength(0);
});
