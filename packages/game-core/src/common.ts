import { DIFFICULTY } from '@ching/contracts';
import type { ContentSeed, GameRound, GameSession, GameType, Lesson, LocalizedText, RoundAnswer, SessionResult, Vocabulary } from '@ching/contracts';
import type { GameEngine } from './index.js';
export const local=(en:string,hans:string,hant=hans):LocalizedText=>({en,'zh-Hans':hans,'zh-Hant':hant});
export function random(seed:number){let value=seed>>>0;return ()=>{value=(value+0x6d2b79f5)|0;let t=Math.imul(value^(value>>>15),1|value);t^=t+Math.imul(t^(t>>>7),61|t);return ((t^(t>>>14))>>>0)/4294967296;};}
export function shuffle<T>(values:readonly T[],rng:()=>number):T[]{const result=[...values];for(let i=result.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[result[i],result[j]]=[result[j]!,result[i]!];}return result;}
export class GameInputError extends Error {}
export interface BuiltRound extends GameRound {readonly correctAnswerId:string; readonly vocabularyId:string;}
export function choices(labels:readonly string[],correct:string,count:number,rng:()=>number){
 const unique=[correct,...shuffle([...new Set(labels)].filter(v=>v!==correct),rng)].slice(0,count);
 if(unique.length!==count)throw new GameInputError('Not enough distinct choices.');
 const options=shuffle(unique,rng).map((label,i)=>({id:'a'+i,label:local(label,label)}));
 return {options,permittedAnswerIds:options.map(o=>o.id),correctAnswerId:options.find(o=>o.label.en===correct)!.id};
}
const wordIndexes = new WeakMap<ContentSeed,Map<string,Vocabulary>>();
export abstract class BaseEngine implements GameEngine {
 abstract readonly game:GameType;
 abstract build(word:Vocabulary,pool:readonly Vocabulary[],lesson:Lesson,rng:()=>number):Omit<BuiltRound,'id'>;
 private generateInternal(input:{lesson:Lesson;seed:number;content:ContentSeed}){
  const {lesson,seed,content}=input;
  if(!Number.isInteger(seed)||seed<0||seed>4294967295)throw new GameInputError('Seed must be an unsigned 32-bit integer.');
  const template=lesson.rounds.find(r=>r.game===this.game);
  if(!template)throw new GameInputError('Game is not available in this lesson.');
  let index=wordIndexes.get(content);if(!index){index=new Map(content.vocabulary.map(word=>[word.id,word]));wordIndexes.set(content,index);}
  const pool=template.vocabularyIds.map(id=>index.get(id)).filter((v):v is Vocabulary=>Boolean(v));
  if(pool.length<DIFFICULTY[lesson.track].choiceCount)throw new GameInputError('Invalid content pool.');
  const rng=random(seed);const ordered=shuffle(pool,rng);
  const rounds=Array.from({length:DIFFICULTY[lesson.track].roundCount},(_,i)=>({...this.build(ordered[i%ordered.length]!,pool,lesson,rng),id:'r'+i}));
  return {id:['c1',content.contentVersion,lesson.id,this.game,seed].join('~'),lessonId:lesson.id,game:this.game,seed,rounds};
 }
 generate(input:{lesson:Lesson;seed:number;content:ContentSeed}):GameSession {
  const session=this.generateInternal(input);
  return {...session,rounds:session.rounds.map(({correctAnswerId: _key,...round})=>round)};
 }
 grade(session:GameSession,answers:readonly RoundAnswer[],content:ContentSeed):SessionResult {
  const lesson=content.lessons.find(l=>l.id===session.lessonId);
  if(!lesson)throw new GameInputError('Unknown lesson.');
  const rebuilt=this.generateInternal({lesson,seed:session.seed,content});
  if(session.id!==rebuilt.id||session.game!==this.game)throw new GameInputError('Session does not match current content.');
  if(!answers.length||answers.length>rebuilt.rounds.length)throw new GameInputError('Submit between one and all round answers.');
  const seen=new Set<string>();let bonus=0;
  const results=answers.map(answer=>{
   const round=rebuilt.rounds.find(r=>r.id===answer.roundId);
   if(!round||seen.has(answer.roundId))throw new GameInputError('Unknown or duplicate round.');
   seen.add(answer.roundId);
   if(answer.answerId!==null&&!round.permittedAnswerIds.includes(answer.answerId))throw new GameInputError('Answer is not permitted.');
   if(!Number.isFinite(answer.elapsedMs)||answer.elapsedMs<0||answer.elapsedMs>3600000)throw new GameInputError('Invalid elapsed time.');
   const withinTime=round.timeLimitSeconds===null||answer.elapsedMs<=round.timeLimitSeconds*1000;
   const correct=withinTime&&answer.answerId===round.correctAnswerId;
   if(correct&&round.timeLimitSeconds!==null)bonus+=Math.max(0,Math.floor((round.timeLimitSeconds*1000-answer.elapsedMs)/5000));
   return {roundId:round.id,vocabularyId:round.vocabularyId,answerId:answer.answerId,correctAnswerId:round.correctAnswerId,correct,explanation:round.explanation};
  });
  const correctAnswers=results.filter(r=>r.correct).length;const accuracy=correctAnswers/rebuilt.rounds.length;
  return {sessionId:session.id,accuracy,correctAnswers,speedBonus:bonus,score:correctAnswers+bonus,earnedXp:correctAnswers*10+bonus,completed:answers.length===rebuilt.rounds.length&&accuracy>=DIFFICULTY[lesson.track].completionAccuracy,rounds:results,mistakes:results.filter(r=>!r.correct),retry:{lessonId:lesson.id,game:this.game,seed:session.seed}};
 }
}
export function foundation(word:Vocabulary,lesson:Lesson){
 const practice=word.practice;if(!practice)throw new GameInputError('Missing practice content.');
 return {vocabularyId:word.id,transcript:word.audioText,pinyin:word.pinyin,audioText:word.audioText,timeLimitSeconds:DIFFICULTY[lesson.track].timeLimitSeconds,
 feedback:{correct:local('Correct!','答对了！','答對了！'),incorrect:local('Try this one again.','再试一次。','再試一次。')},
 explanation:practice.explanation};
}
