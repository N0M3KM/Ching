import {readFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {StaticContentRepository} from './static-content/static-content.repository.js';
import manifest from '../content/data/hsk.manifest.json';
let cached:StaticContentRepository|undefined;
export function hskContentRepository():StaticContentRepository {
 if(!cached){
  const data=readFileSync(new URL('../content/data/content.hsk.v1.json.gz',import.meta.url));
  if(createHash('sha256').update(data).digest('hex')!==manifest.contentSha256)throw new Error('HSK content checksum mismatch');
  cached=new StaticContentRepository(JSON.parse(gunzipSync(data,{maxOutputLength:80000000}).toString('utf8')));
 }
 return cached;
}
