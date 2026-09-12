import { DIFFICULTY } from '@ching/contracts';
import type { Lesson, Vocabulary } from '@ching/contracts';
import { BaseEngine, choices, foundation, local } from './common.js';
export class CharacterTraceEngine extends BaseEngine {
 readonly game='character-trace' as const;
 build(word:Vocabulary,pool:readonly Vocabulary[],lesson:Lesson,rng:()=>number){
  return {...foundation(word,lesson),...choices(pool.map(v=>v.practice!.traceCharacter),word.practice!.traceCharacter,DIFFICULTY[lesson.track].choiceCount,rng),
   traceCharacter:word.practice!.traceCharacter,
   prompt:local('Follow the strokes, then identify the character. '+word.practice!.sentence.en,'按笔顺练习，然后认出汉字。'+word.practice!.sentence['zh-Hans'],'按筆順練習，然後認出漢字。'+word.practice!.sentence['zh-Hant'])};
 }
}
