import { DIFFICULTY } from '@ching/contracts';
import type { Lesson, Vocabulary } from '@ching/contracts';
import { BaseEngine, foundation, local, shuffle } from './common.js';
export class ListenPickEngine extends BaseEngine {
 readonly game='listen-pick' as const;
 build(word:Vocabulary,pool:readonly Vocabulary[],lesson:Lesson,rng:()=>number){
  const selected=shuffle([word,...shuffle(pool.filter(v=>v.id!==word.id),rng).slice(0,DIFFICULTY[lesson.track].choiceCount-1)],rng);
  const options=selected.map((v,i)=>({id:'a'+i,label:lesson.track==='beginner'?local(v.simplified,v.simplified,v.traditional??v.simplified):v.practice!.sentence}));
  return {...foundation(word,lesson),options,permittedAnswerIds:options.map(o=>o.id),correctAnswerId:options[selected.findIndex(v=>v.id===word.id)]!.id,
   prompt:local('Listen, then choose what you heard','听一听，选择听到的内容','聽一聽，選擇聽到的內容'),
   transcript:lesson.track==='beginner'?word.audioText:word.practice!.sentence['zh-Hans'],
   audioText:lesson.track==='beginner'?word.audioText:word.practice!.sentence['zh-Hans'],
   pinyin:lesson.track==='beginner'?word.pinyin:word.practice!.sentencePinyin};
 }
}
