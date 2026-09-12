import {readFileSync,writeFileSync} from 'node:fs';
const path='packages/contracts/src/index.ts';
let text=readFileSync(path,'utf8').replace(/(readonly \w+\?: [^;\n]+)(;)/g,(_,a,b)=>a.includes('undefined')?a+b:a+' | undefined'+b);
writeFileSync(path,text);
const config=JSON.parse(readFileSync('tsconfig.json','utf8'));config.compilerOptions.module='ESNext';config.compilerOptions.moduleResolution='Bundler';writeFileSync('tsconfig.json',JSON.stringify(config,null,2)+'\n');
const p='apps/web/src/progress.test.ts';text=readFileSync(p,'utf8').replace("rounds:[{}]","rounds:[{id:'r0',vocabularyId:'water',prompt:{en:'Water','zh-Hans':'水','zh-Hant':'水'},permittedAnswerIds:['a0'],options:[],transcript:'水',pinyin:'shuǐ',feedback:{correct:{en:'Yes','zh-Hans':'对','zh-Hant':'對'},incorrect:{en:'No','zh-Hans':'错','zh-Hant':'錯'}},explanation:{en:'Water','zh-Hans':'水','zh-Hant':'水'},timeLimitSeconds:null}]").replace("earnedXp:10,rounds:[{vocabularyId:'water',correct:true}]","earnedXp:10,accuracy:1,correctAnswers:1,speedBonus:0,score:1,retry:{lessonId:'beginner-01',game:'tone-match'},rounds:[{roundId:'r0',vocabularyId:'water',answerId:'a0',correctAnswerId:'a0',correct:true,explanation:{en:'Water','zh-Hans':'水','zh-Hant':'水'}}]");
writeFileSync(p,text);
