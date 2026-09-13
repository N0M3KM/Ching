import {mkdirSync,readFileSync,copyFileSync} from 'node:fs';
const seed=JSON.parse(readFileSync('apps/api/src/content/data/content.v1.json','utf8'));
mkdirSync('apps/web/public/strokes',{recursive:true});
for(const word of seed.vocabulary)if(word.practice)copyFileSync('node_modules/hanzi-writer-data/'+word.practice.traceCharacter+'.json','apps/web/public/strokes/'+word.practice.traceCharacter+'.json');
copyFileSync('node_modules/hanzi-writer-data/ARPHICPL.TXT','apps/web/public/strokes/ARPHICPL.TXT');
console.log('Prepared local character stroke assets.');
