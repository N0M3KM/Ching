import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {sessionSchema,resultSchema} from '../apps/web/src/schemas.js';
import {GAME_TYPES,PROGRESS_STORAGE_KEY} from '../packages/contracts/src/index.js';
const names={'tone-match':'Tone Match','pinyin-match':'Pinyin Match','listen-pick':'Listen & Pick','character-trace':'Character Trace'};
for(const [track,index] of [['beginner',0],['intermediate',1],['advanced',2]] as const){
 test(track+' completes all games and retains progress',async({page,request})=>{
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('/');await expect(page.getByRole('heading',{name:'Your learning paths'})).toBeVisible();
  await page.locator('.track-tabs button').nth(index).click();
  for(const game of GAME_TYPES){
   await page.getByRole('button',{name:new RegExp(names[game])}).click();
   const created=page.waitForResponse(r=>r.url().endsWith('/minigames/sessions')&&r.request().method()==='POST');
   await page.getByRole('button',{name:'Let’s play'}).click();
   const session=sessionSchema.parse(await (await created).json());
   expect(session.rounds).toHaveLength([5,8,10][index]!);
   const response=await request.post('/api/v1/minigames/sessions/'+session.id+'/grade',{data:{answers:session.rounds.map(r=>({roundId:r.id,answerId:null,elapsedMs:0}))}});
   const key=resultSchema.parse(await response.json());
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
  expect(saved.completedLessonIds).toContain(track+'-01');expect(saved.xp).toBeGreaterThan(0);expect(saved.completedGameKeys).toHaveLength(4);
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
 await expect(page.locator('.dictionary-entry')).toContainText('water');
 await page.getByRole('button',{name:'Learn',exact:true}).click();
 await page.getByRole('button',{name:/Listen & Pick/}).click();await page.getByRole('button',{name:'Let’s play'}).click();
 await page.getByRole('button',{name:'Play audio'}).click();
 await expect(page.getByText('Audio is unavailable. Use the transcript or retry playback.')).toBeVisible();
 await page.getByText('Show transcript',{exact:true}).click();await expect(page.locator('.hanzi-small')).toBeVisible();
});
