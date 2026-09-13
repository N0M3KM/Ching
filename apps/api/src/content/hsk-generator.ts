import {createHash} from 'node:crypto';
import {convert, pinyin} from 'pinyin-pro';
import {GAME_TYPES, LEVELS, DIFFICULTY} from '@ching/contracts';
import type {ContentSeed, Vocabulary, Level, LocalizedText, Lesson} from '@ching/contracts';
import type {DictionaryRepository} from '../ports/dictionary-repository.js';

export interface HskRow {
 simplified: string; level: string[]; frequency: number;
 forms: {traditional: string; transcriptions: {pinyin: string; numeric: string}; meanings: string[]}[];
}
const local = (en: string, hans: string, hant = hans): LocalizedText => ({en, 'zh-Hans': hans, 'zh-Hant': hant});
export const wordId = (text: string) => 'hsk-' + createHash('sha256').update(text).digest('hex').slice(0, 20);
export function hskLevel(levels: readonly string[]): number | undefined {
 const levels3 = levels.filter(value => /^new-[1-7]$/.test(value)).map(value => Number(value.slice(4)));
 return levels3.length ? Math.min(...levels3) : undefined;
}
export function parseHsk(raw: unknown): HskRow[] {
 if (!Array.isArray(raw)) throw new Error('HSK source must be an array');
 for (const [index, row] of raw.entries()) {
  if (!row || typeof row.simplified !== 'string' || !Array.isArray(row.level) || !row.level.every((v:unknown) => typeof v === 'string')
   || typeof row.frequency !== 'number' || !Array.isArray(row.forms) || !row.forms.length
   || !row.forms.every((f:HskRow['forms'][number]) => f && typeof f.traditional === 'string' && typeof f.transcriptions?.pinyin === 'string' && typeof f.transcriptions.numeric === 'string' && Array.isArray(f.meanings) && f.meanings.every(v => typeof v === 'string')))
   throw new Error('Invalid HSK source record at index ' + index);
 }
 return raw as HskRow[];
}
export function spokenReading(text: string, reading: string) {
 const syllables = convert(reading, {format:'symbolToNum'}).split(/\s+/);
 const tones = syllables.map(s => Number(s.match(/[1-5]$/)?.[0] ?? 5));
 const chars = [...text];
 // Apply adjacent third-tone, 一 and 不 sandhi to the source reading, preserving polyphones.
 const spoken = tones.map((tone, i) => {
  const next = tones[i+1];
  if (tone === 3 && next === 3) return 2;
  if (chars.length === tones.length && chars[i] === '不' && next === 4) return 2;
  if (chars.length === tones.length && chars[i] === '一' && next && next !== 5) return next === 4 ? 2 : 4;
  return tone;
 });
 return {tones:spoken, pinyin:convert(syllables.map((s,i) => s.replace(/[1-5]$/, '') + spoken[i]).join(' '), {format:'numToSymbol'})};
}
export function generateHsk(rows: readonly HskRow[], dictionary: DictionaryRepository, hasStroke: (character:string)=>boolean, overrides: readonly Vocabulary[] = []) {
 const vocabulary: Vocabulary[] = [], excluded: {id:string; reason:string}[] = [];
 const manual = new Map(overrides.map(word => [word.id, word]));
 let referenceFallbacks = 0;
 const seen = new Set<string>();
 for (const row of [...rows].sort((a,b) => (hskLevel(a.level)??99)-(hskLevel(b.level)??99) || a.frequency-b.frequency || a.simplified.localeCompare(b.simplified,'en'))) {
  const band = hskLevel(row.level);
  if (!band) {excluded.push({id:wordId(row.simplified),reason:'outside-hsk-3.0'}); continue;}
  const id = wordId(row.simplified);
  if (seen.has(id)) throw new Error('Duplicate HSK identity ' + id);
  seen.add(id);
  if (manual.has(id)) {vocabulary.push(manual.get(id)!); manual.delete(id); continue;}
  const formScore = (form:HskRow['forms'][number]) => (form.meanings.every(value=>/^(surname|family name|variant of|old variant|see )/i.test(value))?100:0) + (/^[A-Z]/.test(form.transcriptions.pinyin)?10:0);
  const form = [...row.forms].sort((a,b)=>formScore(a)-formScore(b))[0]!, reading = form.transcriptions.pinyin.trim();
  const traceCharacter = [...row.simplified].find(char => /\p{Script=Han}/u.test(char) && hasStroke(char));
  if (!reading || !traceCharacter) {excluded.push({id,reason:'missing-reading-or-strokes'}); continue;}
  let definitions = [...new Set(form.meanings.map(s=>s.trim()).filter(Boolean))];
  if (!definitions.length || definitions.every(s => /^(variant of|see |old variant|CL:)/i.test(s))) {
   const reference = dictionary.lookup(row.simplified).find(word => word.simplified === row.simplified && word.pinyin.toLowerCase() === reading.toLowerCase());
   if (reference) {definitions = [...reference.definitions]; referenceFallbacks++;}
  }
  if (!definitions.length) {excluded.push({id,reason:'missing-definition'}); continue;}
  const level: Level = band <= 2 ? 'beginner' : band <= 4 ? 'intermediate' : 'advanced';
  const spoken = spokenReading(row.simplified, reading);
  const syllables = convert(reading, {format:'symbolToNum'}).split(/\s+/);
  const candidates = new Set([reading]);
  for (let i=0;i<syllables.length;i++) for(let tone=1;tone<=5;tone++) {
   const variant = [...syllables]; variant[i] = variant[i]!.replace(/[1-5]$/, '') + tone;
   candidates.add(convert(variant.join(' '), {format:'numToSymbol'}));
  }
  // Single-syllable words need a sixth distinct distractor at higher levels.
  for (const other of rows) {if(candidates.size>=6)break;const value=other.forms[0]?.transcriptions.pinyin;if(value)candidates.add(value);}
  const prefix = level === 'advanced' ? '在这段学习材料中，请仔细听词语' : '请读词语';
  const suffix = level === 'advanced' ? '，然后辨认它的读音。' : '。';
  const sentence = local('Read the expression “'+row.simplified+'” ('+definitions[0]+').',
   prefix+'「'+row.simplified+'」'+suffix,
   (level==='advanced'?'在這段學習材料中，請仔細聽詞語':'請讀詞語')+'「'+form.traditional+'」'+(level==='advanced'?'，然後辨認它的讀音。':'。'));
  vocabulary.push({id,level,simplified:row.simplified,traditional:form.traditional,pinyin:reading,definitions,audioText:row.simplified,
   tags:['hsk-edition-3','hsk-'+band,'generated-practice'],sourceId:'complete-hsk',
   practice:{spokenTones:spoken.tones,spokenPinyin:spoken.pinyin,traceCharacter,sentence,
    sentencePinyin:pinyin(prefix)+' '+reading+' '+pinyin(suffix),pinyinChoices:[...candidates].slice(0,6),
    explanation:local(reading+' — '+definitions[0]+'. Spoken tones: '+spoken.tones.join('–')+'.',
     '读音：'+reading+'。声调：'+spoken.tones.join('–')+'。','讀音：'+reading+'。聲調：'+spoken.tones.join('–')+'。')}});
 }
 if (manual.size) throw new Error('Unused manual overrides: ' + [...manual.keys()].join(','));
 const lessons: Lesson[] = [];
 for (const track of LEVELS) {
  const words = vocabulary.filter(word => word.level === track);
  const groups: Vocabulary[][] = [];
  for (let i=0;i<words.length;i+=24) groups.push(words.slice(i,i+24));
  if (groups.length>1 && groups.at(-1)!.length<12) groups.at(-2)!.push(...groups.pop()!);
  groups.forEach((pool,index) => {
   // Add same-track neighbors where a small pool lacks distinct trace characters / multisyllable tone choices.
   let tonePool = pool.filter(word => DIFFICULTY[track].choiceCount <= 5 || word.practice!.spokenTones.length > 1);
   let tracePool = [...pool];
   for (const candidate of words) {
    if (new Set(tracePool.map(w=>w.practice!.traceCharacter)).size >= DIFFICULTY[track].choiceCount && tonePool.length >= DIFFICULTY[track].choiceCount) break;
    if (!tracePool.includes(candidate)) tracePool.push(candidate);
    if (candidate.practice!.spokenTones.length>1 && !tonePool.includes(candidate)) tonePool.push(candidate);
   }
   tonePool = [...new Set(tonePool)]; tracePool = [...new Set(tracePool)];
   const order=index+1,id='hsk3-'+track+'-'+String(order).padStart(3,'0');
   lessons.push({id,track,order,title:local('HSK vocabulary · '+order,'HSK 词汇 · '+order,'HSK 詞彙 · '+order),
    goal:local('Practice '+pool.length+' HSK expressions through four games.','通过四种游戏练习 HSK 词汇。','透過四種遊戲練習 HSK 詞彙。'),
    rounds:GAME_TYPES.map(game=>({id:id+'-'+game,game,
     vocabularyIds:(game==='tone-match'?tonePool:game==='character-trace'?tracePool:pool).map(w=>w.id),
     sentenceIds:pool.map(w=>w.id+'-sentence')}))});
  });
 }
 const content: ContentSeed = {schemaVersion:1,contentVersion:'0.1.0',
  sources:[{id:'complete-hsk',name:'Complete HSK Vocabulary',license:'MIT; CC-CEDICT derived definitions CC BY-SA 4.0',attribution:'Yanis Zafiropulos / Complete HSK contributors; CC-CEDICT contributors. Generated Ching practice.',url:'https://github.com/drkameleon/complete-hsk-vocabulary'},
   {id:'ching-original',name:'Ching overrides',license:'Project license',attribution:'Ching contributors'},
   {id:'cc-cedict',name:'CC-CEDICT',license:'CC BY-SA 4.0',attribution:'CC-CEDICT contributors'}],
  tracks:LEVELS.map((id,i)=>({id,title:local(['Beginner','Intermediate','Advanced'][i]!,['初级','中级','高级'][i]!,['初級','中級','高級'][i]!),description:local(['HSK 1–2','HSK 3–4','HSK 5–6 and 7–9'][i]!,['HSK 1–2','HSK 3–4','HSK 5–6、7–9'][i]!)})),
  vocabulary,lessons,sentences:vocabulary.map(w=>({id:w.id+'-sentence',level:w.level,simplified:w.practice!.sentence['zh-Hans'],traditional:w.practice!.sentence['zh-Hant'],pinyin:w.practice!.sentencePinyin,translation:w.practice!.sentence,tags:['generated-practice'],sourceId:'complete-hsk'}))};
 return {content,excluded,referenceFallbacks};
}
