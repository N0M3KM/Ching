import {beforeAll, afterAll, expect, it} from 'vitest';
import request from 'supertest';
import type {INestApplication} from '@nestjs/common';
import {createApp} from './app.js';
import {CedictRepository} from './adapters/cedict.repository.js';
import {parseCedict, normalizePinyin} from './adapters/cedict-parser.js';
import {StaticContentRepository} from './adapters/static-content/static-content.repository.js';
import {dictionarySchema} from '../../web/src/schemas.js';
import manifest from './content/data/cedict.manifest.json';
const content = StaticContentRepository.fromFile(new URL('./content/data/content.v1.json', import.meta.url));
const repository = new CedictRepository(content.getContent().vocabulary);
let app: INestApplication;
beforeAll(async () => {app = await createApp();},30000);
afterAll(async () => {await app.close();});
it('loads the full pinned dictionary and searches Chinese, readings and English', () => {
 expect(manifest.entries).toBeGreaterThan(120000);
 for (const term of ['计算机', '計算機', 'ji4 suan4 ji1', 'jì suàn jī', 'jisuanji', 'computer']) {
  expect(repository.lookup(term).some(entry => entry.simplified === '计算机')).toBe(true);
 }
 expect(repository.lookup('水')[0]?.simplified).toBe('水');
 expect(repository.lookup('a').length).toBeLessThanOrEqual(50);
 expect(repository.lookup(' ')).toEqual([]);
 expect(repository.lookup('zzzznonexistentwordzzzz')).toEqual([]);
});
it('preserves every existing course entry and pronunciation variants', () => {
 for (const entry of content.getContent().vocabulary) {
  expect(repository.lookup(entry.simplified)).toContainEqual(entry);
 }
 expect(repository.lookup('好').filter(entry => entry.simplified === '好').map(entry => entry.pinyin)).toEqual(expect.arrayContaining(['hǎo', 'hào']));
 expect(repository.lookup('行').filter(entry => entry.simplified === '行').length).toBeGreaterThan(1);
 expect(content.getContent().vocabulary).toHaveLength(18);
});
it('parses tone marks and rejects malformed source data', () => {
 const entries = parseCedict('# license header\n綠 绿 [lu:4] /green/\n');
 expect(entries[0]).toMatchObject({pinyin: 'lǜ', traditional: '綠', simplified: '绿', definitions: ['green']});
 expect(normalizePinyin('lǜ')).toBe(normalizePinyin('lu:4'));
 expect(() => parseCedict('broken record')).toThrow('line 1');
});
it('serves schema-compatible new entries and synthesizes their audioText', async () => {
 const response = await request(app.getHttpServer()).get('/api/v1/dictionary').query({query: '计算机'});
 expect(response.status).toBe(200);
 const entry = dictionarySchema.parse(response.body).entries.find(word => word.simplified === '计算机')!;
 expect(['complete-hsk','cc-cedict']).toContain(entry.sourceId);
 const audio = await request(app.getHttpServer()).post('/api/v1/tts').send({text: entry.audioText});
 expect(audio.status).toBe(200);
 const bytes = Buffer.from(audio.body.audioBase64, 'base64');
 expect(bytes.subarray(0, 4).toString()).toBe('RIFF');
 expect(bytes.length).toBeGreaterThan(1000);
 expect(audio.body.transcript).toBe(entry.simplified);
});
