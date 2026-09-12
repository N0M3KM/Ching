import { DIFFICULTY } from '@ching/contracts';
import type { Lesson, Vocabulary } from '@ching/contracts';
import { BaseEngine, choices, foundation, local } from './common.js';
const contours=['','1 —','2 ↗','3 ↘↗','4 ↘','5 ·'];
export class ToneMatchEngine extends BaseEngine {
 readonly game='tone-match' as const;
 build(word:Vocabulary,_pool:readonly Vocabulary[],lesson:Lesson,rng:()=>number){
  const tones=word.practice!.spokenTones;
  const label=(t:readonly number[])=>t.map(n=>contours[n]).join(' / ');
  const candidates=new Set<string>([label(tones)]);
  for(let i=0;i<tones.length;i++)for(let n=1;n<=5;n++){const t=[...tones];t[i]=n;candidates.add(label(t));}
  return {...foundation(word,lesson),...choices([...candidates],label(tones),DIFFICULTY[lesson.track].choiceCount,rng),
   prompt:lesson.track==='beginner'?local('Match the tone contour','选择声调曲线','選擇聲調曲線'):local('Match the spoken tones in context: '+word.practice!.sentence.en,'选择语境中的声调：'+word.practice!.sentence['zh-Hans'],'選擇語境中的聲調：'+word.practice!.sentence['zh-Hant']),
   pinyin:word.practice!.spokenPinyin};
 }
}
