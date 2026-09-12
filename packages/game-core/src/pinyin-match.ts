import { DIFFICULTY } from '@ching/contracts';
import type { Lesson, Vocabulary } from '@ching/contracts';
import { BaseEngine, choices, foundation, local } from './common.js';
export class PinyinMatchEngine extends BaseEngine {
 readonly game='pinyin-match' as const;
 build(word:Vocabulary,_pool:readonly Vocabulary[],lesson:Lesson,rng:()=>number){
  return {...foundation(word,lesson),...choices(word.practice!.pinyinChoices,word.pinyin,DIFFICULTY[lesson.track].choiceCount,rng),
   prompt:local('Choose the pinyin for '+word.simplified,'选择“'+word.simplified+'”的拼音','選擇「'+(word.traditional??word.simplified)+'」的拼音')};
 }
}
