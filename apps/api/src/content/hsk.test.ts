import {readFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {expect,it} from 'vitest';
import {hskContentRepository} from '../adapters/hsk-content.repository.js';
import {hskLevel,spokenReading,parseHsk,generateHsk,wordId} from './hsk-generator.js';
import {ToneMatchEngine,PinyinMatchEngine,ListenPickEngine,CharacterTraceEngine} from '@ching/game-core';
import manifest from './data/hsk.manifest.json';
const content=hskContentRepository().getContent();
it('covers the pinned HSK 3.0 vocabulary with correctly assigned tracks and full enrichment',()=>{
 expect(content.vocabulary.length).toBe(manifest.vocabulary);
 expect(content.vocabulary.find(word=>word.simplified==='水')!.definitions.some(definition=>definition.includes('water'))).toBe(true);
 expect(content.vocabulary.length).toBeGreaterThan(10000);
 const strokes=JSON.parse(gunzipSync(readFileSync(new URL('./data/strokes.hsk.json.gz',import.meta.url))).toString('utf8'));
 for(const word of content.vocabulary){
  const band=Number(word.tags.find(tag=>/^hsk-[1-7]$/.test(tag))!.slice(4));
  expect(word.level).toBe(band<=2?'beginner':band<=4?'intermediate':'advanced');
  expect(word.practice!.pinyinChoices).toContain(word.pinyin);
  expect(new Set(word.practice!.pinyinChoices).size).toBeGreaterThanOrEqual(6);
  expect(strokes).toHaveProperty(word.practice!.traceCharacter);
 }
 expect(manifest.excluded.every(record=>record.reason==='outside-hsk-3.0')).toBe(true);
});
it('can play all four games in every generated lesson',()=>{
 const engines=[new ToneMatchEngine(),new PinyinMatchEngine(),new ListenPickEngine(),new CharacterTraceEngine()];
 for(const lesson of content.lessons)for(const engine of engines){
  const session=engine.generate({content,lesson,seed:123});
  for(const round of session.rounds){
   expect(new Set(round.options.map(option=>option.label.en)).size).toBe(round.options.length);
  }
 }
},30000);
it('uses edition-specific bands and source-reading tone sandhi',()=>{
 expect(hskLevel(['old-1','new-5'])).toBe(5);
 expect(hskLevel(['new-7'])).toBe(7);
 expect(hskLevel(['old-1'])).toBeUndefined();
 expect(spokenReading('很好','hěn hǎo').tones).toEqual([2,3]);
 expect(spokenReading('不是','bù shì').tones).toEqual([2,4]);
});
it('retains explicit overrides and rejects malformed HSK records',()=>{
 const source=parseHsk(JSON.parse(gunzipSync(readFileSync(new URL('./data/hsk-source.json.gz',import.meta.url))).toString('utf8')));
 const existing=content.vocabulary[0]!;
 const row=source.find(item=>wordId(item.simplified)===existing.id)!;
 const generated=generateHsk([row],{lookup:()=>[]},()=>true,[existing]);
 expect(generated.content.vocabulary[0]).toEqual(existing);
 expect(()=>parseHsk([{simplified:5}])).toThrow('index 0');
});
