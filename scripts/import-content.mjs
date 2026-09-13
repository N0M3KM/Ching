import { readFileSync, writeFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
const path=new URL('../apps/api/src/content/data/content.v1.json',import.meta.url);
const seed=JSON.parse(readFileSync(path,'utf8'));
const url='https://www.mdbg.net/chinese/export/cedict/cedict_1_0_ts_utf-8_mdbg.txt.gz';
const response=await fetch(url,{signal:AbortSignal.timeout(30000)});
if(!response.ok)throw new Error('CC-CEDICT download failed: '+response.status);
const raw=gunzipSync(Buffer.from(await response.arrayBuffer())).toString('utf8');
const selected=[];
for(const word of seed.vocabulary){
 const entries=raw.split('\n').filter(line=>line.startsWith(word.traditional+' '+word.simplified+' ['));
 if(entries.length){
  selected.push(...entries);
  word.definitions=[...new Set(entries.flatMap(line=>line.slice(line.indexOf(' /')+2).split('/').map(value=>value.trim()).filter(Boolean)))];
  word.sourceId='cc-cedict';
 }
}
if(!seed.sources.some(s=>s.id==='cc-cedict'))seed.sources.push({id:'cc-cedict',name:'CC-CEDICT contributors',license:'CC-BY-SA-4.0',attribution:'CC-CEDICT via MDBG, retrieved 2026-09-13. Curated subset; lexical pinyin spacing and track metadata adapted by Ching.',url:'https://www.mdbg.net/chinese/dictionary?page=cedict'});
writeFileSync(new URL('../docs/cedict-subset.txt',import.meta.url),raw.split('\n').filter(l=>l.startsWith('#')).join('\n')+'\n'+selected.join('\n')+'\n');
if(!seed.sources.some(s=>s.id==='tatoeba-4869782'))seed.sources.push({id:'tatoeba-4869782',name:'Tatoeba sentence 4869782',license:'CC-BY-2.0-FR',attribution:'你好！ by zvzuibqx, added January 29, 2016. Ching added pinyin, English translation and level metadata.',url:'https://tatoeba.org/en/sentences/show/4869782'});
if(!seed.sentences.some(s=>s.id==='tatoeba-hello'))seed.sentences.push({id:'tatoeba-hello',level:'beginner',simplified:'你好！',traditional:'你好！',pinyin:'nǐ hǎo',translation:{en:'Hello!','zh-Hans':'你好！','zh-Hant':'你好！'},tags:['greetings'],sourceId:'tatoeba-4869782'});
writeFileSync(path,JSON.stringify(seed,null,2)+'\n');
console.log('Imported '+selected.length+' CC-CEDICT entries and Tatoeba sentence 4869782.');
