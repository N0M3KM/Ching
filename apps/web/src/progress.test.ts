import {expect,it} from 'vitest';
import {PROGRESS_STORAGE_KEY,GAME_TYPES} from '@ching/contracts';
import type {GameSession,SessionResult} from '@ching/contracts';
import {emptyProgress,LocalStorageProgressStore,recordResult} from './progress.js';
function storage(){const data=new Map<string,string>();return {getItem:(k:string)=>data.get(k)??null,setItem:(k:string,v:string)=>{data.set(k,v);},removeItem:(k:string)=>{data.delete(k);}};}
it('persists, reloads, and resets versioned local data',()=>{const s=storage(),a=new LocalStorageProgressStore(()=>s);a.save({...emptyProgress(),xp:50});expect(new LocalStorageProgressStore(()=>s).load().xp).toBe(50);a.clear();expect(a.load().xp).toBe(0);});
it.each(['bad','{"schemaVersion":2}','{"schemaVersion":1,"xp":-1}'])('recovers corrupt storage',raw=>{const s=storage();s.setItem(PROGRESS_STORAGE_KEY,raw);const store=new LocalStorageProgressStore(()=>s);expect(store.load()).toEqual(emptyProgress());expect(store.warning).toBe(true);});
it('retains memory when storage is blocked',()=>{const store=new LocalStorageProgressStore(()=>{throw new Error('denied');});store.save({...emptyProgress(),xp:10});expect(store.load().xp).toBe(10);expect(store.warning).toBe(true);});
const session=(game:typeof GAME_TYPES[number],id:string)=>({id,lessonId:'beginner-01',game,seed:1,rounds:[{id:'r0',vocabularyId:'water',prompt:{en:'Water','zh-Hans':'水','zh-Hant':'水'},permittedAnswerIds:['a0'],options:[],transcript:'水',pinyin:'shuǐ',feedback:{correct:{en:'Yes','zh-Hans':'对','zh-Hant':'對'},incorrect:{en:'No','zh-Hans':'错','zh-Hant':'錯'}},explanation:{en:'Water','zh-Hans':'水','zh-Hant':'水'},timeLimitSeconds:null}]} as GameSession);
const result=(id:string)=>({sessionId:id,completed:true,earnedXp:10,accuracy:1,correctAnswers:1,speedBonus:0,score:1,retry:{lessonId:'beginner-01',game:'tone-match'},rounds:[{roundId:'r0',vocabularyId:'water',answerId:'a0',correctAnswerId:'a0',correct:true,explanation:{en:'Water','zh-Hans':'水','zh-Hant':'水'}}],mistakes:[]} as SessionResult);
it('completes a lesson only after all four games, and counts a session once',()=>{
 let p=emptyProgress();
 for(const game of GAME_TYPES){const s=session(game,game);p=recordResult(p,s,result(s.id));if(game!=='character-trace')expect(p.completedLessonIds).toEqual([]);}
 expect(p.completedLessonIds).toEqual(['beginner-01']);expect(p.xp).toBe(40);
 expect(recordResult(p,session('tone-match','tone-match'),result('tone-match')).xp).toBe(40);
});
it('increments streak on consecutive local calendar days and resets after a gap',()=>{
 let p=recordResult(emptyProgress(),session('tone-match','a'),result('a'),new Date(2026,8,12,23));
 p=recordResult(p,session('tone-match','b'),result('b'),new Date(2026,8,13,1));expect(p.streak).toBe(2);
 p=recordResult(p,session('tone-match','c'),result('c'),new Date(2026,8,13,23));expect(p.streak).toBe(2);
 p=recordResult(p,session('tone-match','d'),result('d'),new Date(2026,8,15));expect(p.streak).toBe(1);
});
it('rejects partial results',()=>{expect(()=>recordResult(emptyProgress(),session('tone-match','a'),{...result('a'),rounds:[]})).toThrow();});

it('a successful retry improves completion and credits only the XP difference',()=>{
 const s=session('tone-match','retry');
 const failed={...result('retry'),completed:false,earnedXp:0,rounds:[{...result('retry').rounds[0]!,correct:false}]};
 let p=recordResult(emptyProgress(),s,failed);
 expect(p.completedGameKeys).toEqual([]);expect(p.review.water).toBeDefined();
 p=recordResult(p,s,result('retry'));
 expect(p.completedGameKeys).toContain('beginner-01|tone-match');expect(p.xp).toBe(10);expect(p.review.water).toBeUndefined();
 expect(recordResult(p,s,result('retry')).xp).toBe(10);
});
