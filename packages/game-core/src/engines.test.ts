import {readFileSync} from 'node:fs';
import {describe,expect,it} from 'vitest';
import type {ContentSeed,GameSession} from '@ching/contracts';
import {DIFFICULTY} from '@ching/contracts';
import {ToneMatchEngine,PinyinMatchEngine,ListenPickEngine,CharacterTraceEngine} from './index.js';
const content=JSON.parse(readFileSync(new URL('../../../apps/api/src/content/data/content.v1.json',import.meta.url),'utf8')) as ContentSeed;
const engines=[new ToneMatchEngine(),new PinyinMatchEngine(),new ListenPickEngine(),new CharacterTraceEngine()];
for(const engine of engines)describe(engine.game,()=>{
 for(const lesson of content.lessons)it('generates and scores '+lesson.track,()=>{
  const input={lesson,content,seed:123};const s=engine.generate(input);
  expect(s).toEqual(engine.generate(input));expect(s).not.toEqual(engine.generate({...input,seed:321}));
  expect(s.rounds).toHaveLength(DIFFICULTY[lesson.track].roundCount);
  for(const r of s.rounds){expect(r.options).toHaveLength(DIFFICULTY[lesson.track].choiceCount);expect(new Set(r.permittedAnswerIds).size).toBe(r.options.length);expect(r).not.toHaveProperty('correctAnswerId');expect(r.transcript).not.toBe('');}
  const probe=engine.grade(s,s.rounds.map(r=>({roundId:r.id,answerId:null,elapsedMs:0})),content);
  const answers=probe.rounds.map(r=>({roundId:r.roundId,answerId:r.correctAnswerId,elapsedMs:(DIFFICULTY[lesson.track].timeLimitSeconds??1)*1000}));
  const result=engine.grade(s,answers,content);
  expect(result.accuracy).toBe(1);expect(result.completed).toBe(true);expect(result.speedBonus).toBe(0);expect(result.mistakes).toHaveLength(0);
  if(lesson.track!=='beginner')expect(engine.grade(s,answers.map(a=>({...a,elapsedMs:a.elapsedMs+1})),content).accuracy).toBe(0);
 });
 const lesson=content.lessons[0]!;
 const session=()=>engine.generate({lesson,content,seed:0});
 it('rejects unknown and duplicate rounds, invalid answers and elapsed times',()=>{
  const s=session(),a={roundId:'r0',answerId:'a0',elapsedMs:0};
  for(const answers of [[{...a,roundId:'r99'}],[a,a],[{...a,answerId:'a9'}],[{...a,elapsedMs:-1}],[]])expect(()=>engine.grade(s,answers,content)).toThrow();
 });
 it('does not trust a client answer key or round content',()=>{
  const s=session();const altered={...s,rounds:[]} as GameSession;
  expect(engine.grade(altered,[{roundId:'r0',answerId:null,elapsedMs:0}],content).rounds).toHaveLength(1);
 });
 it('rejects invalid seeds',()=>{for(const seed of [-1,NaN,1.5,4294967296])expect(()=>engine.generate({lesson,content,seed})).toThrow();});
});
it('uses spoken third-tone sandhi for 很好',()=>{
 const engine=new ToneMatchEngine();const s=engine.generate({lesson:content.lessons[1]!,content,seed:1});
 const r=s.rounds.find(r=>r.vocabularyId==='very-good')!;
 const result=engine.grade(s,[{roundId:r.id,answerId:null,elapsedMs:0}],content);
 expect(r.options.find(o=>o.id===result.rounds[0]!.correctAnswerId)?.label.en).toBe('2 ↗ / 3 ↘↗');
});
