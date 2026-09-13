import {writeFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {parseCedict} from '../apps/api/src/adapters/cedict-parser.js';
const source = 'https://www.mdbg.net/chinese/export/cedict/cedict_1_0_ts_utf-8_mdbg.txt.gz';
const response = await fetch(source, {signal: AbortSignal.timeout(60000)});
if (!response.ok) throw new Error('CC-CEDICT download failed: ' + response.status);
const archive = Buffer.from(await response.arrayBuffer());
const raw = gunzipSync(archive, {maxOutputLength: 50000000}).toString('utf8');
const entries = parseCedict(raw);
if (entries.length < 120000) throw new Error('Incomplete dictionary download');
const metadata = {
 source, attribution: 'CC-CEDICT contributors', license: 'CC BY-SA 4.0',
 licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
 retrievedAt: new Date().toISOString(), entries: entries.length,
 sha256: createHash('sha256').update(archive).digest('hex'),
 changes: 'Original archive preserved. Runtime conversion to JSON records, tone-mark pinyin, stable IDs and search indexes.',
};
writeFileSync(new URL('../apps/api/src/content/data/cedict.txt.gz', import.meta.url), archive);
writeFileSync(new URL('../apps/api/src/content/data/cedict.manifest.json', import.meta.url), JSON.stringify(metadata, null, 2) + '\n');
console.log(JSON.stringify(metadata, null, 2));
