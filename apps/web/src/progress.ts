import {z} from 'zod';
import {GAME_TYPES,PROGRESS_STORAGE_KEY} from '@ching/contracts';
import type {GameSession,LocalProgress,ReviewCard,SessionResult} from '@ching/contracts';
import type {ProgressStore} from './ports/progress-store.js';
const stringId=z.string().min(1).max(180);
const date=z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v=>!Number.isNaN(Date.parse(v))&&new Date(v).toISOString().startsWith(v));
const schema=z.object({
 schemaVersion:z.literal(1),completedLessonIds:z.array(stringId).max(5000),
 xp:z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),streak:z.number().int().nonnegative().max(100000),
 review:z.record(z.string().regex(/^[a-z0-9-]+$/),z.object({vocabularyId:stringId,mistakes:z.number().int().nonnegative(),lastReviewedAt:z.iso.datetime()})),
 lastActivityDate:date.optional(),completedGameKeys:z.array(stringId).max(5000).optional(),awardedSessionIds:z.array(stringId).max(5000).optional(),
}).strict();
export const emptyProgress=():LocalProgress=>({schemaVersion:1,completedLessonIds:[],xp:0,streak:0,review:{},completedGameKeys:[],awardedSessionIds:[]});
export class LocalStorageProgressStore implements ProgressStore {
 warning=false;
 private memory=emptyProgress();
 constructor(private readonly getStorage:()=>Pick<Storage,'getItem'|'setItem'|'removeItem'>){}
 load():LocalProgress{
  try{const raw=this.getStorage().getItem(PROGRESS_STORAGE_KEY);if(!raw)return this.memory;
   if(raw.length>2000000)throw new Error('Oversized progress.');
   this.memory=schema.parse(JSON.parse(raw));return this.memory;
  }catch{this.warning=true;return this.memory;}
 }
 save(progress:LocalProgress){
  this.memory=schema.parse(progress);
  try{this.getStorage().setItem(PROGRESS_STORAGE_KEY,JSON.stringify(this.memory));}catch{this.warning=true;}
 }
 clear(){this.memory=emptyProgress();try{this.getStorage().removeItem(PROGRESS_STORAGE_KEY);}catch{this.warning=true;}}
}
function calendarDate(now:Date){return [now.getFullYear(),String(now.getMonth()+1).padStart(2,'0'),String(now.getDate()).padStart(2,'0')].join('-');}
export function recordResult(progress:LocalProgress,session:GameSession,result:SessionResult,now=new Date()):LocalProgress{
 if(result.sessionId!==session.id||result.rounds.length!==session.rounds.length)throw new Error('Only finished sessions may be saved.');
 if(progress.awardedSessionIds?.includes(session.id))return progress;
 const gameKeys=new Set(progress.completedGameKeys??[]);
 if(result.completed)gameKeys.add(session.lessonId+'|'+session.game);
 const lessons=new Set(progress.completedLessonIds);
 if(GAME_TYPES.every(game=>gameKeys.has(session.lessonId+'|'+game)))lessons.add(session.lessonId);
 const review:Record<string,ReviewCard>={...progress.review};
 for(const round of result.rounds){
  if(round.correct){delete review[round.vocabularyId];}
  else{review[round.vocabularyId]={vocabularyId:round.vocabularyId,mistakes:(review[round.vocabularyId]?.mistakes??0)+1,lastReviewedAt:now.toISOString()};}
 }
 const today=calendarDate(now);const yesterday=new Date(now);yesterday.setDate(yesterday.getDate()-1);
 const streak=progress.lastActivityDate===today?progress.streak:progress.lastActivityDate===calendarDate(yesterday)?progress.streak+1:1;
 return {schemaVersion:1,completedLessonIds:[...lessons],completedGameKeys:[...gameKeys],awardedSessionIds:[...(progress.awardedSessionIds??[]),session.id].slice(-5000),xp:progress.xp+result.earnedXp,streak,lastActivityDate:today,review};
}
