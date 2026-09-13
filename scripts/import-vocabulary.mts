import {readFileSync,writeFileSync,existsSync,copyFileSync} from 'node:fs';
import {gzipSync,gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {generateHsk,parseHsk} from '../apps/api/src/content/hsk-generator.js';
import {hskOverrides} from '../apps/api/src/content/hsk-overrides.js';
import {validateSeed} from '../apps/api/src/content/seed-schema.js';
import {CedictRepository} from '../apps/api/src/adapters/cedict.repository.js';
const root = new URL('../apps/api/src/content/data/',import.meta.url);
const manifestFile=new URL('hsk.manifest.json',root);
const previous=existsSync(manifestFile)?JSON.parse(readFileSync(manifestFile,'utf8')):undefined;
const revision = process.env.HSK_SOURCE_REVISION ?? previous?.revision ?? '7ac65bf1a6387d35f1ade478906172a19311c7f9';
if (!/^[a-f0-9]{40}$/.test(revision)) throw new Error('HSK_SOURCE_REVISION must be an immutable commit SHA');
const source = 'https://raw.githubusercontent.com/drkameleon/complete-hsk-vocabulary/'+revision+'/';
const sourceFile = new URL('hsk-source.json.gz',root);
if (!existsSync(sourceFile) || process.argv.includes('--refresh')) {
 const response = await fetch(source+'complete.json',{signal:AbortSignal.timeout(60000)});
 if (!response.ok) throw new Error('HSK download failed: '+response.status);
 const raw = await response.text(); parseHsk(JSON.parse(raw));
 writeFileSync(sourceFile,gzipSync(raw));
 const license = await fetch(source+'LICENSE');
 if (!license.ok) throw new Error('HSK license download failed');
 writeFileSync(new URL('../docs/licenses/complete-hsk-MIT.txt',import.meta.url),await license.text());
}
const archive = readFileSync(sourceFile);
if(previous && !process.argv.includes('--refresh') && (revision!==previous.revision || createHash('sha256').update(archive).digest('hex')!==previous.sourceSha256))throw new Error('HSK source mismatch; use --refresh for a deliberate update');
const rows = parseHsk(JSON.parse(gunzipSync(archive).toString('utf8')));
const strokePath=(char:string)=>new URL('../node_modules/hanzi-writer-data/'+encodeURIComponent(char)+'.json',import.meta.url);
const result = generateHsk(rows,new CedictRepository([]),char=>existsSync(strokePath(char)),hskOverrides);
const content = validateSeed(result.content);
const compressed = gzipSync(JSON.stringify(content));
const strokes: Record<string,unknown> = {};
for(const word of content.vocabulary) {
 const char=word.practice!.traceCharacter;
 if(!strokes[char]) strokes[char]=JSON.parse(readFileSync(strokePath(char),'utf8'));
}
writeFileSync(new URL('content.hsk.v1.json.gz',root),compressed);
const strokeArchive=gzipSync(JSON.stringify(strokes));
writeFileSync(new URL('strokes.hsk.json.gz',root),strokeArchive);
copyFileSync(new URL('../node_modules/hanzi-writer-data/ARPHICPL.TXT',import.meta.url),new URL('../docs/licenses/ARPHICPL.TXT',import.meta.url));
const manifest={source,revision,edition:'HSK 3.0 (new-1 through new-7; new-7 is levels 7–9)',sourceSha256:createHash('sha256').update(archive).digest('hex'),
 strokeSha256:createHash('sha256').update(strokeArchive).digest('hex'),
 contentSha256:createHash('sha256').update(compressed).digest('hex'),contentVersion:content.contentVersion,
 sourceRecords:rows.length,vocabulary:content.vocabulary.length,lessons:content.lessons.length,strokeCharacters:Object.keys(strokes).length,
 tracks:Object.fromEntries(content.tracks.map(t=>[t.id,content.vocabulary.filter(w=>w.level===t.id).length])),
 referenceFallbacks:result.referenceFallbacks,excluded:result.excluded,manualOverrides:hskOverrides.length,
 enrichment:'Deterministic metalinguistic reading prompts, not sourced natural usage examples. Source reading preserved; adjacent tone sandhi derived.'};
writeFileSync(new URL('hsk.manifest.json',root),JSON.stringify(manifest,null,2)+'\n');
console.log('Generated '+manifest.vocabulary+' words, '+manifest.lessons+' lessons, '+manifest.strokeCharacters+' stroke assets; excluded '+manifest.excluded.length+' source records. No dataset contents printed.');
